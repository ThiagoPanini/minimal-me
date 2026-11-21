import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Route } from "@playwright/test";
import { expect, test } from "./fixtures";

// Costura 1 do sistema de design: cada prévia de `docs/design/system/components/` renderiza sem
// erro de console, como no cartão do Claude Design. A prévia é um fragmento (`<style>` e markup);
// o teste a põe num documento com os tokens do `tokens.json` como variáveis CSS e as fontes de
// `type.fonts`, numa origem respondida inteira por `page.route`, sem a imagem da Home.

const systemDir = path.resolve(import.meta.dirname, "../../../docs/design/system");
const componentsDir = path.join(systemDir, "components");
const origin = "http://design-system.test";

// As prévias chamam as imagens por `/_blob/<id>`, os assets do artefato do Design System no
// claude.ai (ver "No Claude Design" em `docs/design/README.md`). Cada id é um arquivo de
// `assets/`, conferido pelo SHA-256 do índice de assets do artefato em 2026-11-21.
const blobs: Record<string, string> = {
  c2007a56233c7752ec6375195a5e8ff3: "Texture/grain.png",
  "929a0016c2932a47c509bca9aef60ec7": "Illustrations/frames.webp",
  c6c2f6d4b713759710344cc3545c39a8: "Illustrations/music.webp",
  "33a0712f6d1b4118a9bdc03c735e7dbb": "Illustrations/tech.webp",
  "587fea7dad452de96d5789021f21b426": "Illustrations/ai.webp",
};

type DesignTokens = {
  color: { tokens: { name: string; value: string }[] };
  type: {
    fonts: { family: string; file: string; weight: string }[];
    families: Record<string, string>;
  };
  spacing: { tokens: { name: string; value: string }[] };
  radius: { tokens: { name: string; value: string }[] };
  easing: { tokens: { name: string; value: string }[] };
};

const tokens: DesignTokens = JSON.parse(readFileSync(path.join(systemDir, "tokens.json"), "utf8"));

// O que o sistema dá a toda prévia: as fontes e os tokens em `:root`, com os nomes do sistema.
const systemCss = [
  ...tokens.type.fonts.map(
    ({ family, file, weight }) =>
      `@font-face{font-family:"${family}";src:url(/${file}) format("woff2");font-weight:${weight};font-display:block}`,
  ),
  `:root{${[
    ...[tokens.color, tokens.spacing, tokens.radius, tokens.easing].flatMap(({ tokens: group }) =>
      group.map(({ name, value }) => `--${name}:${value};`),
    ),
    ...Object.entries(tokens.type.families).map(([family, stack]) => `--font-${family}:${stack};`),
  ].join("")}}`,
].join("\n");

const components = readdirSync(componentsDir).filter((component) =>
  existsSync(path.join(componentsDir, component, "preview.html")),
);

function previewDocument(component: string): string {
  const fragment = readFileSync(path.join(componentsDir, component, "preview.html"), "utf8");
  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>${component}</title><style>${systemCss}</style></head>
<body>
${fragment}
</body>
</html>`;
}

test("há prévias para renderizar", () => {
  expect(components.length).toBeGreaterThan(0);
});

for (const component of components) {
  test(`a prévia de ${component} renderiza sem erro de console, com as imagens e as fontes`, async ({
    page,
  }) => {
    const unknownBlobs: string[] = [];
    await page.route(`${origin}/**`, async (route: Route) => {
      const { pathname } = new URL(route.request().url());
      if (pathname === `/${component}/preview.html`) {
        return route.fulfill({ contentType: "text/html", body: previewDocument(component) });
      }
      const blob = /^\/_blob\/(\w+)$/.exec(pathname)?.[1];
      if (blob) {
        const file = blobs[blob];
        if (file) return route.fulfill({ path: path.join(systemDir, "assets", file) });
        unknownBlobs.push(blob);
      }
      const systemFile = path.join(systemDir, pathname);
      if (pathname.startsWith("/fonts/") && existsSync(systemFile)) {
        return route.fulfill({ path: systemFile });
      }
      return route.fulfill({ status: 404 });
    });

    await page.goto(`${origin}/${component}/preview.html`);

    expect(unknownBlobs, "ids de /_blob/ sem arquivo de assets/ no mapa deste teste").toEqual([]);
    const card = page.locator("body > :not(style)").first();
    const box = await card.boundingBox();
    expect(box?.width ?? 0, "largura do cartão").toBeGreaterThan(0);
    expect(box?.height ?? 0, "altura do cartão").toBeGreaterThan(0);
    const images = await page.locator("img").evaluateAll((elements) =>
      (elements as HTMLImageElement[]).map((image) => ({
        src: image.getAttribute("src"),
        decoded: image.complete && image.naturalWidth > 0,
      })),
    );
    expect(
      images.filter(({ decoded }) => !decoded),
      "imagens que não carregaram",
    ).toEqual([]);
    const fonts = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].map(({ family, weight, status }) => ({ family, weight, status }));
    });
    expect(
      fonts.filter(({ status }) => status === "error"),
      "fontes que não carregaram",
    ).toEqual([]);
  });
}
