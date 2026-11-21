// `node scripts/delivery/smoke.mjs --url <url> --commit <sha>`: o smoke da entrega (seção
// "Entrega" da #57). Espera o `version.json` mostrar o commit e confere a Home com 200, uma rota
// inexistente com 404 servindo o `404.html` do export, um arquivo de `/_next/static/` com cache
// longo e o cabeçalho `Server` sem versão. Só Node, sem dependências: roda no job de entrega, que
// não instala pacotes, e no e2e, contra a imagem local (apps/web/e2e/smoke.spec.ts).
import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { parseArgs } from "node:util";

/** Um ano, em segundos: o cache longo do que tem hash no nome. */
const longCacheSeconds = 31_536_000;
const requestTimeoutMs = 15_000;

/**
 * @param {{ url: string, commit: string, timeoutSeconds?: number, intervalSeconds?: number,
 *   log?: (line: string) => void }} options
 * @returns {Promise<{ failures: string[] }>} o que falhou; vazio quando o smoke passa.
 */
export async function smoke({ url, commit, timeoutSeconds = 600, intervalSeconds = 5, log }) {
  const say = log ?? (() => {});
  const versionFailure = await waitForCommit(url, commit, timeoutSeconds, intervalSeconds);
  if (versionFailure) return { failures: [versionFailure] };
  say(`version.json mostra o commit ${commit}.`);

  const failures = [];
  const home = await get(url, "/");
  if (home.status === 200 && isHtml(home)) say("A Home responde 200.");
  else failures.push(`A Home respondeu ${describe(home)}, não 200 com HTML.`);

  const server = home.headers.get("server");
  if (server && /\/\s*v?\d|\d+\.\d+/.test(server)) {
    failures.push(`O cabeçalho Server diz a versão: "${server}".`);
  } else {
    say(`O cabeçalho Server não diz a versão (${server ? `"${server}"` : "ausente"}).`);
  }

  const notFound = await checkNotFound(url);
  if (notFound.failure) failures.push(notFound.failure);
  else say(notFound.passed);

  const cache = await checkLongCache(url, home.body);
  if (cache.failure) failures.push(cache.failure);
  else say(cache.passed);

  return { failures };
}

/** Consulta o `version.json` até ele mostrar o commit ou o tempo acabar. */
async function waitForCommit(url, commit, timeoutSeconds, intervalSeconds) {
  const deadline = Date.now() + timeoutSeconds * 1000;
  let last = "nenhuma resposta";
  for (;;) {
    try {
      const response = await get(url, "/version.json");
      if (response.status !== 200) {
        last = `status ${response.status}`;
      } else {
        const shown = parseCommit(response.body);
        if (shown === commit) return undefined;
        last = shown ? `o commit ${shown}` : `um corpo sem commit: ${excerpt(response.body)}`;
      }
    } catch (error) {
      last = `um erro de rede: ${networkError(error)}`;
    }
    if (Date.now() + intervalSeconds * 1000 > deadline) {
      return `O version.json não mostrou o commit ${commit} em ${timeoutSeconds} s; a última resposta foi ${last}.`;
    }
    await sleep(intervalSeconds * 1000);
  }
}

/**
 * Uma rota que não existe responde 404 com o `404.html`: uma página do export, que pede arquivos
 * de `/_next/static/`, e não a página de erro do nginx ou do proxy na frente dele.
 */
async function checkNotFound(url) {
  const route = `/smoke-${randomUUID()}`;
  const response = await get(url, route);
  if (response.status !== 404) {
    return { failure: `A rota inexistente ${route} respondeu ${describe(response)}, não 404.` };
  }
  if (!isHtml(response) || !response.body.includes("/_next/static/")) {
    return {
      failure: `A rota inexistente ${route} respondeu 404 sem o 404.html do export: veio ${response.headers.get("content-type") ?? "sem Content-Type"}, ${excerpt(response.body)}.`,
    };
  }
  return { passed: "Uma rota inexistente responde 404 com o 404.html." };
}

/** O primeiro arquivo de `/_next/static/` que a Home pede leva cache longo e imutável. */
async function checkLongCache(url, homeBody) {
  const asset = homeBody.match(/\/_next\/static\/[^"'\s)\\]+/)?.[0];
  if (!asset) return { failure: "A Home não pede nenhum arquivo de /_next/static/." };
  const response = await get(url, asset);
  const cacheControl = response.headers.get("cache-control") ?? "";
  const maxAge = Number(cacheControl.match(/(?:^|[\s,])max-age=(\d+)/)?.[1] ?? 0);
  if (response.status !== 200) {
    return { failure: `${asset} respondeu ${describe(response)}, não 200.` };
  }
  if (maxAge < longCacheSeconds || !/(?:^|[\s,])immutable(?:$|[\s,])/.test(cacheControl)) {
    return {
      failure: `${asset} veio sem cache longo: Cache-Control "${cacheControl}", e o esperado é max-age de um ano ou mais e immutable.`,
    };
  }
  return { passed: `${asset} leva cache longo ("${cacheControl}").` };
}

async function get(url, route) {
  const response = await fetch(new URL(route, url), {
    redirect: "manual",
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  return { status: response.status, headers: response.headers, body: await response.text() };
}

function isHtml(response) {
  return (response.headers.get("content-type") ?? "").includes("text/html");
}

function describe(response) {
  const location = response.headers.get("location");
  return location ? `${response.status} para ${location}` : String(response.status);
}

function parseCommit(body) {
  try {
    const commit = JSON.parse(body)?.commit;
    return typeof commit === "string" ? commit : undefined;
  } catch {
    return undefined;
  }
}

function excerpt(body) {
  const text = body.replace(/\s+/g, " ").trim();
  if (!text) return "corpo vazio";
  return `"${text.length > 80 ? `${text.slice(0, 80)}…` : text}"`;
}

function networkError(error) {
  return error?.cause?.code ?? error?.cause?.message ?? error?.message ?? String(error);
}

const usage =
  "Uso: node scripts/delivery/smoke.mjs --url <url> --commit <sha de 40 caracteres> [--timeout <s>] [--interval <s>]";

/** A linha de comando: os passos que passaram na saída padrão e as falhas na de erro. */
async function main() {
  let values;
  try {
    ({ values } = parseArgs({
      options: {
        url: { type: "string" },
        commit: { type: "string" },
        timeout: { type: "string", default: "600" },
        interval: { type: "string", default: "5" },
      },
    }));
  } catch (error) {
    console.error(`${error.message}\n${usage}`);
    return 2;
  }
  const timeoutSeconds = Number(values.timeout);
  const intervalSeconds = Number(values.interval);
  if (
    !values.url ||
    !URL.canParse(values.url) ||
    !/^[0-9a-f]{40}$/.test(values.commit ?? "") ||
    !(timeoutSeconds > 0) ||
    !(intervalSeconds > 0)
  ) {
    console.error(usage);
    return 2;
  }

  console.log(`Smoke de ${values.url}, esperando o commit ${values.commit}.`);
  const { failures } = await smoke({
    url: values.url,
    commit: values.commit,
    timeoutSeconds,
    intervalSeconds,
    log: (line) => console.log(`ok: ${line}`),
  });
  for (const failure of failures) console.error(`falha: ${failure}`);
  return failures.length === 0 ? 0 : 1;
}

if (import.meta.main) process.exitCode = await main();
