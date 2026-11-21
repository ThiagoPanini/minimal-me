import { execFile } from "node:child_process";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { expect, test } from "@playwright/test";

// O smoke da entrega (scripts/delivery/smoke.mjs) contra a imagem que vai ao ar. Depois do deploy,
// ele roda contra a URL pública (costura 3); aqui ele ganha teste antes do primeiro deploy. Para
// provar cada falha, um proxy na frente da imagem estraga uma resposta de cada vez.

const smokeScript = path.resolve(import.meta.dirname, "../../../scripts/delivery/smoke.mjs");

type SmokeRun = { code: number; stdout: string; stderr: string };

/** Roda o smoke como a entrega o roda, num processo à parte, sem travar o proxy deste. */
function runSmoke(url: string, commit: string, ...extra: string[]): Promise<SmokeRun> {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [smokeScript, "--url", url, "--commit", commit, ...extra],
      { timeout: 60_000 },
      (error, stdout, stderr) => {
        const code = error ? (typeof error.code === "number" ? error.code : 1) : 0;
        resolve({ code, stdout, stderr });
      },
    );
  });
}

/** As falhas que o smoke escreveu, uma por linha. */
function failures(run: SmokeRun): string[] {
  return run.stderr.split("\n").filter((line) => line.startsWith("falha: "));
}

function baseURL(): string {
  const url = process.env.BASE_URL;
  if (!url) throw new Error("BASE_URL vem de `pnpm test:e2e`");
  return url;
}

function expectedCommit(): string {
  const commit = process.env.EXPECTED_COMMIT;
  if (!commit) throw new Error("EXPECTED_COMMIT vem de `pnpm test:e2e`");
  return commit;
}

type Answer = { route: string; status: number; headers: Record<string, string>; body: Buffer };

// Cabeçalhos da conexão e do corpo original, que o proxy recalcula.
const hopHeaders = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "transfer-encoding",
]);

/** Um proxy na frente da imagem que passa cada resposta por `fault` antes de devolvê-la. */
async function faultyProxy(fault: (answer: Answer) => Answer) {
  const upstream = baseURL();
  const server = createServer(async (request, response) => {
    const route = request.url ?? "/";
    try {
      const original = await fetch(new URL(route, upstream), {
        redirect: "manual",
        headers: { "accept-encoding": "identity" },
      });
      const headers: Record<string, string> = {};
      original.headers.forEach((value, name) => {
        if (!hopHeaders.has(name)) headers[name] = value;
      });
      const body = Buffer.from(await original.arrayBuffer());
      const answer = fault({ route, status: original.status, headers, body });
      response.writeHead(answer.status, answer.headers);
      response.end(answer.body);
    } catch (error) {
      response.writeHead(502, { "content-type": "text/plain" });
      response.end(String(error));
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

/** Roda o smoke com o commit da imagem contra o proxy que estraga as respostas. */
async function smokeThrough(fault: (answer: Answer) => Answer): Promise<SmokeRun> {
  const proxy = await faultyProxy(fault);
  try {
    return await runSmoke(proxy.url, expectedCommit());
  } finally {
    await proxy.close();
  }
}

test("o smoke passa contra a imagem da Home", async () => {
  const run = await runSmoke(baseURL(), expectedCommit());

  expect(run.stderr).toBe("");
  expect(run.code).toBe(0);
});

test("o smoke falha quando o version.json não mostra o commit esperado", async () => {
  const other = "0".repeat(40);

  const run = await runSmoke(baseURL(), other, "--timeout", "2", "--interval", "0.5");

  expect(run.code).toBe(1);
  expect(failures(run)).toEqual([
    `falha: O version.json não mostrou o commit ${other} em 2 s; a última resposta foi o commit ${expectedCommit()}.`,
  ]);
});

test("o smoke falha quando o cabeçalho Server diz a versão", async () => {
  const run = await smokeThrough((answer) => ({
    ...answer,
    headers: { ...answer.headers, server: "nginx/1.31.9" },
  }));

  expect(run.code).toBe(1);
  expect(failures(run)).toEqual(['falha: O cabeçalho Server diz a versão: "nginx/1.31.9".']);
});

test("o smoke falha quando o que tem hash no nome vem sem cache longo", async () => {
  const run = await smokeThrough((answer) =>
    answer.route.startsWith("/_next/static/")
      ? { ...answer, headers: { ...answer.headers, "cache-control": "no-cache" } }
      : answer,
  );

  expect(run.code).toBe(1);
  expect(failures(run)).toEqual([
    expect.stringMatching(
      /^falha: \/_next\/static\/\S+ veio sem cache longo: Cache-Control "no-cache"/,
    ),
  ]);
});

test("o smoke falha quando uma rota inexistente não responde 404", async () => {
  // Como um servidor que devolve a página de erro com 200.
  const run = await smokeThrough((answer) =>
    answer.status === 404 ? { ...answer, status: 200 } : answer,
  );

  expect(run.code).toBe(1);
  expect(failures(run)).toEqual([
    expect.stringMatching(/^falha: A rota inexistente \/smoke-\S+ respondeu 200, não 404\.$/),
  ]);
});

test("o smoke falha quando a 404 não é o 404.html do export", async () => {
  // Como o proxy do Coolify quando nenhuma aplicação atende o domínio.
  const run = await smokeThrough((answer) =>
    answer.status === 404
      ? {
          ...answer,
          headers: { ...answer.headers, "content-type": "text/plain; charset=utf-8" },
          body: Buffer.from("404 page not found\n"),
        }
      : answer,
  );

  expect(run.code).toBe(1);
  expect(failures(run)).toEqual([
    expect.stringMatching(
      /^falha: A rota inexistente \/smoke-\S+ respondeu 404 sem o 404\.html do export: veio text\/plain; charset=utf-8, "404 page not found"\.$/,
    ),
  ]);
});
