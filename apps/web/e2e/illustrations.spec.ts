import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "./fixtures";

const illustrationsDir = path.resolve(
  import.meta.dirname,
  "../../../docs/design/system/assets/Illustrations",
);

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

// Um arquivo servido com hash no nome, como `/_next/static/media/sky-480.25k3w4etqjn7r.webp`.
const hashedWebp = /^\/_next\/static\/media\/[\w-]+\.[\w-]{8,}\.webp$/;

test("as camadas da abertura vêm do sistema de design, em larguras responsivas com hash no nome", async ({
  page,
  baseURL,
}) => {
  const systemFiles = new Map(
    readdirSync(illustrationsDir)
      .filter((file) => file.endsWith(".webp"))
      .map((file) => [sha256(readFileSync(path.join(illustrationsDir, file))), file]),
  );
  await page.goto("/");

  const layers = await page
    .getByRole("banner")
    .locator("img[srcset]")
    .evaluateAll((images) =>
      images.map((image) => ({
        alt: image.getAttribute("alt"),
        candidates: (image.getAttribute("srcset") ?? "").split(",").map((candidate) => {
          const [url, descriptor] = candidate.trim().split(/\s+/);
          return { url, width: Number.parseInt(descriptor, 10) };
        }),
      })),
    );

  const found = [];
  for (const { alt, candidates } of layers) {
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
    // A maior largura é o próprio arquivo do sistema de design, sem cópia.
    const widest = candidates.reduce((a, b) => (b.width > a.width ? b : a));
    const bytes = await (await page.request.get(new URL(widest.url, baseURL).href)).body();
    found.push({ file: systemFiles.get(sha256(bytes)) ?? `fora do sistema: ${widest.url}`, alt });
  }

  // De trás para a frente: o céu, que é fundo e leva texto alternativo vazio, e as dunas.
  expect(found).toEqual([
    { file: "sky.webp", alt: "" },
    {
      file: "dunes.webp",
      alt: "Ilustração: uma pessoa sentada nas dunas observa um grande mapa celeste.",
    },
  ]);
});
