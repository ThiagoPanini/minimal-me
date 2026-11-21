import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Locator, Page } from "@playwright/test";
import sharp from "sharp";
import { expect, test } from "./fixtures";

const illustrationsDir = path.resolve(
  import.meta.dirname,
  "../../../docs/design/system/assets/Illustrations",
);

type Pixels = { data: Buffer; width: number; height: number };

// Os pixels de uma imagem, com a transparência composta sobre preto.
async function pixelsOf(image: Buffer | string): Promise<Pixels> {
  const { data, info } = await sharp(image)
    .flatten({ background: "#000" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

// A diferença entre duas imagens do mesmo tamanho, em dB de PSNR: quanto maior, mais iguais.
function psnr(a: Pixels, b: Pixels): number {
  let squared = 0;
  for (let i = 0; i < a.data.length; i += 1) squared += (a.data[i] - b.data[i]) ** 2;
  return 10 * Math.log10(255 ** 2 / (squared / a.data.length));
}

// O arquivo do sistema de design que uma ilustração servida mostra: o do mesmo tamanho com a
// imagem mais parecida, acima de 35 dB de PSNR (a recodificação do build fica acima de 40 dB).
async function systemFileOf(bytes: Buffer, systemFiles: Map<string, Pixels>): Promise<string> {
  const served = await pixelsOf(bytes);
  let found = { file: "fora do sistema", psnr: 35 };
  for (const [file, pixels] of systemFiles) {
    if (pixels.width !== served.width || pixels.height !== served.height) continue;
    const difference = psnr(served, pixels);
    if (difference > found.psnr) found = { file, psnr: difference };
  }
  return found.file;
}

// Um arquivo servido com hash no nome, como `/_next/static/media/sky-480.25k3w4etqjn7r.webp`.
const hashedWebp = /^\/_next\/static\/media\/[\w-]+\.[\w-]{8,}\.webp$/;

// As ilustrações de um trecho da página, na ordem: o arquivo do sistema de design que cada uma
// mostra na maior largura, o texto alternativo e a carga. Confere que cada largura do `srcset`
// tem hash no nome e é a largura do arquivo servido.
async function servedIllustrations(page: Page, baseURL: string | undefined, scope: Locator) {
  const systemFiles = new Map<string, Pixels>();
  for (const file of readdirSync(illustrationsDir).filter((name) => name.endsWith(".webp"))) {
    systemFiles.set(file, await pixelsOf(path.join(illustrationsDir, file)));
  }
  const images = await scope.locator("img[srcset]").evaluateAll((elements) =>
    elements.map((image) => ({
      alt: image.getAttribute("alt"),
      loading: image.getAttribute("loading"),
      candidates: (image.getAttribute("srcset") ?? "").split(",").map((candidate) => {
        const [url, descriptor] = candidate.trim().split(/\s+/);
        return { url, width: Number.parseInt(descriptor, 10) };
      }),
    })),
  );

  const found = [];
  for (const { alt, loading, candidates } of images) {
    expect(candidates.length, "larguras no srcset").toBeGreaterThan(1);
    for (const { url, width } of candidates) {
      expect(url).toMatch(hashedWebp);
      // A largura declarada no srcset é a do arquivo servido.
      const decoded = await page.evaluate(async (src) => {
        const image = new Image();
        image.src = src;
        await image.decode();
        return image.naturalWidth;
      }, url);
      expect(decoded, url).toBe(width);
    }
    // A maior largura é o arquivo do sistema de design no tamanho dele, recodificado pelo
    // passo das ilustrações.
    const widest = candidates.reduce((a, b) => (b.width > a.width ? b : a));
    const bytes = await (await page.request.get(new URL(widest.url, baseURL).href)).body();
    found.push({ file: await systemFileOf(bytes, systemFiles), alt, loading });
  }
  return found;
}

test("as camadas da abertura vêm do sistema de design, em larguras responsivas com hash no nome", async ({
  page,
  baseURL,
}) => {
  await page.goto("/");

  // De trás para a frente: o céu, que é fundo e leva texto alternativo vazio, e as dunas.
  // Estão na primeira tela: nenhuma espera a rolagem.
  expect(await servedIllustrations(page, baseURL, page.getByRole("banner"))).toEqual([
    { file: "sky.webp", alt: "", loading: null },
    {
      file: "dunes.webp",
      alt: "Ilustração: uma pessoa sentada nas dunas observa um grande mapa celeste.",
      loading: null,
    },
  ]);
});

test("a 404 mostra só o céu da abertura, sem as dunas e sem a figura", async ({
  page,
  baseURL,
}) => {
  await page.goto("/esta-rota-nao-existe");

  expect(await servedIllustrations(page, baseURL, page.locator("body"))).toEqual([
    { file: "sky.webp", alt: "", loading: null },
  ]);
});

test("as ilustrações dos spaces vêm do sistema de design, com o texto alternativo de illustrations.json e carga preguiçosa", async ({
  page,
  baseURL,
}) => {
  const { illustrations } = JSON.parse(
    readFileSync(path.join(illustrationsDir, "illustrations.json"), "utf8"),
  );
  await page.goto("/");

  // Na ordem dos spaces, abaixo da dobra.
  expect(await servedIllustrations(page, baseURL, page.getByRole("main"))).toEqual(
    ["frames", "music", "tech", "ai"].map((key) => ({
      file: `${key}.webp`,
      alt: illustrations[key].alt,
      loading: "lazy",
    })),
  );
});
