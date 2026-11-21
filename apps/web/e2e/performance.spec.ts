import { createServer } from "node:net";
import { chromium } from "@playwright/test";
import type { Config, Result } from "lighthouse";
import lighthouse from "lighthouse";
import { expect, test } from "./fixtures";

// Peso e LCP da primeira visita (spec #57, Testing Decisions): o Lighthouse mede a Home da
// imagem que vai ao ar, no Chromium do contêiner do Playwright, a 390 × 844 com fator de escala
// 3 (o dos iPhones de 390px), sem rolar, com Slow 4G simulado. Cada rodada sobe um Chromium
// novo, sem cache. Roda só no projeto `chromium-390`: o Lighthouse emula a tela sozinho.

// O limite de bytes transferidos na primeira visita a 390px: trava.
const byteBudget = 1_000_000;

// O LCP de referência, em ms. Só informa: em vinte rodadas medidas em 2026-11-20, a mediana foi
// 4.726 ms (de 4.275 a 4.727), acima de 2,5 s, sem folga para travar. O elemento do LCP é o
// céu da abertura. Passa a travar quando a mediana, somada à dispersão, couber nele.
const lcpReference = 2500;

// As rodadas do Lighthouse: o peso de cada uma e a mediana do LCP entre elas.
const runs = 5;

const config: Config = {
  extends: "lighthouse:default",
  settings: {
    onlyAudits: [
      "total-byte-weight",
      "resource-summary",
      "largest-contentful-paint",
      "lcp-breakdown-insight",
    ],
    formFactor: "mobile",
    screenEmulation: {
      mobile: true,
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      disabled: false,
    },
    // Slow 4G simulado, o padrão do Lighthouse para celular.
    throttlingMethod: "simulate",
    // A captura da página inteira estica a tela depois da carga, e isso pediria as imagens
    // preguiçosas: a primeira visita é sem rolar.
    disableFullPageScreenshot: true,
  },
};

async function freePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  await new Promise((resolve) => server.close(resolve));
  if (address === null || typeof address === "string") throw new Error("sem porta livre");
  return address.port;
}

// Uma rodada do Lighthouse num Chromium novo, aberto pelo Playwright com a porta de depuração.
async function audit(url: string): Promise<Result> {
  const port = await freePort();
  const browser = await chromium.launch({
    channel: "chromium",
    args: [`--remote-debugging-port=${port}`],
  });
  try {
    const result = await lighthouse(
      url,
      { port, hostname: "127.0.0.1", logLevel: "error", output: "json" },
      config,
    );
    if (!result) throw new Error("o Lighthouse não devolveu resultado");
    const { runtimeError } = result.lhr;
    if (runtimeError) throw new Error(`Lighthouse: ${runtimeError.code} ${runtimeError.message}`);
    return result.lhr;
  } finally {
    await browser.close();
  }
}

type Weight = { total: number; byType: Record<string, number> };

// Os bytes transferidos: o total e a soma por tipo de arquivo.
function weightOf(lhr: Result): Weight {
  const total = lhr.audits["total-byte-weight"].numericValue ?? Number.NaN;
  const details = lhr.audits["resource-summary"].details;
  const items = details?.type === "table" ? details.items : [];
  const byType = Object.fromEntries(
    items
      .filter((item) => item.resourceType !== "total" && Number(item.requestCount) > 0)
      .map((item) => [String(item.resourceType), Number(item.transferSize)]),
  );
  return { total, byType };
}

// O elemento do LCP, pelo seletor que o Lighthouse dá e, numa imagem, pelo arquivo.
function lcpElementOf(lhr: Result): string {
  const details = lhr.audits["lcp-breakdown-insight"].details;
  const items = details?.type === "list" ? details.items : [];
  const node = items.find((item) => item.type === "node");
  if (node?.type !== "node") return "";
  const source = node.snippet?.match(/ src="([^"]+)"/)?.[1];
  return source ? `${node.selector} (${source})` : (node.selector ?? "");
}

const bytes = (value: number) => value.toLocaleString("pt-BR");
const milliseconds = (value: number) => Math.round(value).toLocaleString("pt-BR");

test.describe("first visit at 390px", () => {
  const results: Result[] = [];

  test.beforeAll(async ({ baseURL }) => {
    test.setTimeout(240_000);
    for (let run = 0; run < runs; run += 1) results.push(await audit(new URL("/", baseURL).href));
  });

  test("weighs up to 1,000,000 transferred bytes", async () => {
    const weights = results.map(weightOf);
    await test.info().attach("peso", {
      body: JSON.stringify(weights, null, 2),
      contentType: "application/json",
    });
    // O peso não depende da rodada; a trava vale para a mais pesada.
    const heaviest = weights.reduce((a, b) => (b.total > a.total ? b : a));
    const byType = Object.entries(heaviest.byType)
      .map(([type, size]) => `${type} ${bytes(size)}`)
      .join(", ");
    expect(heaviest.total, `bytes transferidos (${byType})`).toBeLessThanOrEqual(byteBudget);
  });

  test("the LCP on simulated Slow 4G, as the median of the runs, goes into the report", async () => {
    const lcps = results.map((lhr) => lhr.audits["largest-contentful-paint"].numericValue ?? 0);
    for (const lcp of lcps) expect(lcp, "LCP medido").toBeGreaterThan(0);
    const median = [...lcps].sort((a, b) => a - b)[Math.floor(lcps.length / 2)];
    const element = lcpElementOf(results[0]);
    await test.info().attach("lcp", {
      body: JSON.stringify({ median, runs: lcps, element }, null, 2),
      contentType: "application/json",
    });
    console.log(
      `LCP em Slow 4G simulado a 390px: mediana de ${milliseconds(median)} ms em ${lcps.length} rodadas (${lcps.map(milliseconds).join(", ")}); referência de ${milliseconds(lcpReference)} ms; elemento: ${element}`,
    );
  });
});
