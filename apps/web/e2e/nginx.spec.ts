import type { APIRequestContext } from "@playwright/test";
import { expect, test } from "@playwright/test";

// As respostas do nginx da imagem que vai ao ar: status, cache, compressão e cabeçalhos.

// Valores da seção "Cabeçalhos de segurança" da spec #57.
const securityHeaders = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "content-security-policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'",
};

const immutable = "public, max-age=31536000, immutable";

// Os arquivos com hash que a Home pede: CSS, JavaScript e fontes.
async function hashedAssets(request: APIRequestContext) {
  const html = await (await request.get("/")).text();
  const paths = [...html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)].map(([match]) => match);
  const pick = (extension: string) => {
    const found = paths.find((asset) => asset.endsWith(extension));
    if (!found) throw new Error(`A Home não pede nenhum ${extension} de /_next/static/`);
    return found;
  };
  return { css: pick(".css"), js: pick(".js"), font: pick(".woff2") };
}

test("uma rota inexistente responde com status 404", async ({ request }) => {
  const response = await request.get("/esta-rota-nao-existe");

  expect(response.status()).toBe(404);
  expect(response.headers()["content-type"]).toContain("text/html");
});

test("o que tem hash no nome leva cache longo e imutável", async ({ request }) => {
  const assets = await hashedAssets(request);

  for (const asset of Object.values(assets)) {
    const response = await request.get(asset);
    expect(response.status(), asset).toBe(200);
    expect(response.headers()["cache-control"], asset).toBe(immutable);
  }
});

// O que não tem hash no nome: o HTML, o version.json, os arquivos de rota e as imagens que o
// Next gera para os metadados (o ícone e a de compartilhamento), que saem sem extensão.
const unhashed = ["/", "/version.json", "/robots.txt", "/sitemap.xml", "/icon", "/opengraph-image"];

test("o que não tem hash no nome fica sem cache longo e sem no-transform", async ({ request }) => {
  for (const route of unhashed) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
    const cacheControl = response.headers()["cache-control"] ?? "";
    expect(cacheControl, route).not.toContain("no-transform");
    expect(cacheControl, route).not.toContain("immutable");
    expect(cacheControl, route).not.toMatch(/max-age=[1-9]/);
  }
});

test("as respostas de texto vêm comprimidas", async ({ request }) => {
  const { css, js } = await hashedAssets(request);

  for (const route of ["/", css, js, "/esta-rota-nao-existe"]) {
    const response = await request.get(route, { headers: { "accept-encoding": "gzip" } });
    expect(response.headers()["content-encoding"], route).toBe("gzip");
  }
});

test("o cabeçalho Server não diz a versão do nginx", async ({ request }) => {
  const response = await request.get("/");

  expect(response.headers().server).toBe("nginx");
});

test("toda resposta leva os quatro cabeçalhos de segurança", async ({ request }) => {
  const { css, font } = await hashedAssets(request);

  for (const route of [css, font, ...unhashed, "/esta-rota-nao-existe"]) {
    const headers = (await request.get(route)).headers();
    for (const [name, value] of Object.entries(securityHeaders)) {
      expect(headers[name], `${name} em ${route}`).toBe(value);
    }
  }
});

test("version.json traz o commit da imagem", async ({ request }) => {
  const expected = process.env.EXPECTED_COMMIT;
  expect(expected, "EXPECTED_COMMIT vem de `pnpm test:e2e`").toMatch(/^[0-9a-f]{40}$/);

  const response = await request.get("/version.json");

  expect(response.headers()["content-type"]).toContain("application/json");
  expect(await response.json()).toEqual({ commit: expected });
});
