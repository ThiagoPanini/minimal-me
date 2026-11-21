import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

// O que a Home diz de si a buscadores e a quem compartilha o link: título, descrição, endereço
// canônico, a prévia de compartilhamento e o ícone.

const site = "https://minimalme.dev/";
const tagline = "Uma dinâmica simples e moderna para consumir e gerar conteúdo.";
const dunesAlt = "Ilustração: uma pessoa sentada nas dunas observa um grande mapa celeste.";

// O conteúdo das metas da página, por `name` ou por `property`.
function metas(page: Page): Promise<Record<string, string>> {
  return page
    .locator("meta[name], meta[property]")
    .evaluateAll((elements) =>
      Object.fromEntries(
        elements.map((element) => [
          element.getAttribute("property") ?? element.getAttribute("name") ?? "",
          element.getAttribute("content") ?? "",
        ]),
      ),
    );
}

// Um endereço absoluto de minimalme.dev, trocado pela mesma rota na imagem em teste.
function local(address: string, baseURL: string | undefined): string {
  const { pathname, search } = new URL(address);
  return new URL(`${pathname}${search}`, baseURL).href;
}

// Uma imagem decodificada pelo navegador: o tamanho e a luminância relativa
// (de 0 a 1) de uma faixa do topo e de uma do pé, cada uma com um décimo da altura.
function decodedImage(page: Page, url: string) {
  return page.evaluate(async (src) => {
    const image = new Image();
    image.src = src;
    await image.decode();
    const { naturalWidth: width, naturalHeight: height } = image;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("sem contexto 2d");
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, width, height);
    const luminance = (index: number) =>
      (0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2]) / 255;
    const band = (top: number, bottom: number) => {
      let sum = 0;
      let darkest = 1;
      for (let y = top; y < bottom; y++) {
        for (let x = 0; x < width; x++) {
          const value = luminance((y * width + x) * 4);
          sum += value;
          darkest = Math.min(darkest, value);
        }
      }
      return { mean: sum / ((bottom - top) * width), darkest };
    };
    const tenth = Math.round(height / 10);
    return { width, height, top: band(0, tenth), bottom: band(height - tenth, height) };
  }, url);
}

test("a Home tem o título Minimal Me, a frase da abertura como descrição e o endereço canônico @webkit", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Minimal Me");
  expect((await metas(page)).description).toBe(tagline);
  await expect(page.getByText(tagline, { exact: true })).toBeVisible();
  // O Next escreve a raiz sem a barra final; as duas formas são o mesmo endereço.
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(new URL(canonical ?? "").href).toBe(site);
});

test("a prévia de compartilhamento traz o título, a frase da abertura e a imagem da abertura", async ({
  page,
}) => {
  await page.goto("/");
  const meta = await metas(page);

  expect(meta).toMatchObject({
    "og:type": "website",
    "og:site_name": "Minimal Me",
    "og:locale": "pt_BR",
    "og:title": "Minimal Me",
    "og:description": tagline,
    "og:image:type": "image/jpeg",
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:image:alt": dunesAlt,
    "twitter:card": "summary_large_image",
  });
  expect(new URL(meta["og:url"]).href).toBe(site);
  expect(meta["og:image"]).toMatch(/^https:\/\/minimalme\.dev\/\S+$/);
  expect(meta["twitter:image"]).toBe(meta["og:image"]);
});

test("a imagem de compartilhamento é a abertura recortada, com o céu no alto e as dunas no pé", async ({
  page,
  baseURL,
}) => {
  await page.goto("/");
  const image = local((await metas(page))["og:image"], baseURL);

  const response = await page.request.get(image);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/jpeg");
  // Leve, para nenhum aplicativo recusar a prévia pelo tamanho.
  expect((await response.body()).length).toBeLessThan(300_000);

  const decoded = await decodedImage(page, image);
  expect(decoded).toMatchObject({ width: 1200, height: 630 });
  // O céu: claro, com as linhas do mapa celeste. As dunas: o pé escuro.
  expect(decoded.top.mean, "luminância média do alto").toBeGreaterThan(0.8);
  expect(decoded.top.darkest, "o ponto mais escuro do alto").toBeLessThan(0.7);
  expect(decoded.bottom.mean, "luminância média do pé").toBeLessThan(0.3);
});

// Uma imagem quadrada decodificada: o lado, a cor do canto e a linha do meio, da borda esquerda
// ao centro, em trechos escuros (`ground`) e claros (o desenho por cima).
function middleRowRuns(page: Page, url: string) {
  return page.evaluate(async (src) => {
    const image = new Image();
    image.src = src;
    await image.decode();
    const { naturalWidth: width, naturalHeight: height } = image;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("sem contexto 2d");
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, Math.floor(height / 2), Math.ceil(width / 2), 1);
    const runs: string[] = [];
    for (let index = 0; index < data.length; index += 4) {
      const value =
        (0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2]) / 255;
      const kind = value > 0.25 ? "claro" : "escuro";
      if (runs.at(-1) !== kind) runs.push(kind);
    }
    return { width, height, corner: [...context.getImageData(0, 0, 1, 1).data], runs };
  }, url);
}

test("a aba mostra o ícone da marca: o anel e o ponto sobre ground @webkit", async ({
  page,
  baseURL,
}) => {
  await page.goto("/");
  const icon = page.locator('link[rel="icon"]');
  await expect(icon).toHaveCount(1);
  await expect(icon).toHaveAttribute("type", "image/png");
  const url = new URL((await icon.getAttribute("href")) ?? "", baseURL).href;

  const response = await page.request.get(url);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");

  const decoded = await middleRowRuns(page, url);
  expect(decoded.width).toBe(decoded.height);
  // O fundo em `ground` (#161616); da borda ao centro, o anel e, no centro, o ponto.
  expect(decoded.corner).toEqual([22, 22, 22, 255]);
  expect(decoded.runs).toEqual(["escuro", "claro", "escuro", "claro"]);
});
