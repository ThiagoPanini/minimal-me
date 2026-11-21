import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Locator } from "@playwright/test";
import { expect, test } from "./fixtures";

const systemFontsDir = path.resolve(import.meta.dirname, "../../../docs/design/system/fonts");

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

// O arquivo da face com que o texto é desenhado: a regra @font-face da família e do peso
// calculados do texto, desde que a face esteja carregada; null se ele cai numa alternativa.
function renderedFontUrl(text: Locator): Promise<string | null> {
  return text.evaluate(async (element) => {
    await document.fonts.ready;
    const style = getComputedStyle(element);
    const unquote = (family: string) => family.trim().replace(/^["']|["']$/g, "");
    const family = unquote(style.fontFamily.split(",")[0]);
    const loaded = [...document.fonts].some(
      (face) =>
        unquote(face.family) === family &&
        face.weight === style.fontWeight &&
        face.status === "loaded",
    );
    if (!loaded) return null;
    for (const sheet of document.styleSheets) {
      for (const rule of sheet.cssRules) {
        if (
          rule instanceof CSSFontFaceRule &&
          unquote(rule.style.getPropertyValue("font-family")) === family &&
          rule.style.getPropertyValue("font-weight") === style.fontWeight
        ) {
          const url = rule.style.getPropertyValue("src").match(/url\(["']?([^"')]+)/)?.[1];
          if (url) return new URL(url, sheet.href ?? document.baseURI).href;
        }
      }
    }
    return null;
  });
}

test("the Home opens in pt-BR with the title Minimal Me and the Masthead @webkit", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Minimal Me");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.getByRole("heading", { level: 1, name: "Minimal Me" })).toBeVisible();
  await expect(page.getByText("hub pessoal e minimalista")).toBeVisible();
  await expect(
    page.getByText("Uma dinâmica simples e moderna para consumir e gerar conteúdo."),
  ).toBeVisible();
});

test("the opening shows the dunes illustration, the mark that leads to the top and the name @webkit", async ({
  page,
}) => {
  await page.goto("/");

  const opening = page.getByRole("banner");
  await expect(opening.getByRole("link", { name: "Minimal Me, início" })).toBeVisible();
  await expect(
    opening.getByRole("img", {
      name: "Ilustração: uma pessoa sentada nas dunas observa um grande mapa celeste.",
    }),
  ).toBeVisible();
  await expect(opening.getByRole("heading", { level: 1, name: "Minimal Me" })).toBeVisible();
});

test("the footer shows the mark, the name, the year and the link back to the top @webkit", async ({
  page,
}) => {
  await page.goto("/");

  const footer = page.getByRole("contentinfo");
  await expect(footer.getByText("Minimal Me", { exact: true })).toBeVisible();
  await expect(footer.getByText("© 2026")).toBeVisible();
  await expect(footer.getByRole("link", { name: "voltar ao início ↑" })).toBeVisible();
});

test("the Masthead sits on ground, with the design system colors", async ({ page }) => {
  await page.goto("/");

  const name = page.getByRole("heading", { level: 1, name: "Minimal Me" });
  // Valores de docs/design/system/tokens.json: ground #161616, light #E9E9E6,
  // mist #8E8E89 e body #C9C9C4.
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(22, 22, 22)");
  await expect(name).toHaveCSS("color", "rgb(233, 233, 230)");
  await expect(page.getByText("hub pessoal e minimalista")).toHaveCSS(
    "color",
    "rgb(142, 142, 137)",
  );
  await expect(
    page.getByText("Uma dinâmica simples e moderna para consumir e gerar conteúdo."),
  ).toHaveCSS("color", "rgb(201, 201, 196)");
});

test("the Masthead is drawn with the system fonts, served by the Home itself", async ({
  page,
  baseURL,
}) => {
  const systemFonts = new Map(
    readdirSync(systemFontsDir)
      .filter((file) => file.endsWith(".woff2"))
      .map((file) => [sha256(readFileSync(path.join(systemFontsDir, file))), file]),
  );
  // O arquivo do sistema de design com que o texto é desenhado, se vier da própria Home.
  async function systemFontOf(text: Locator): Promise<string> {
    const url = await renderedFontUrl(text);
    if (!url) return "nenhuma face carregada";
    if (new URL(url).origin !== new URL(baseURL ?? "").origin) return `outra origem: ${url}`;
    const bytes = await (await page.request.get(url)).body();
    return systemFonts.get(sha256(bytes)) ?? `fora do sistema: ${url}`;
  }
  await page.goto("/");

  // Masthead (docs/design/system): o nome em Jost 300, o sobretítulo em Jost 400
  // e a frase em IBM Plex Mono 300.
  expect(await systemFontOf(page.getByRole("heading", { level: 1, name: "Minimal Me" }))).toBe(
    "Jost-300.woff2",
  );
  expect(await systemFontOf(page.getByText("hub pessoal e minimalista"))).toBe("Jost-400.woff2");
  expect(
    await systemFontOf(
      page.getByText("Uma dinâmica simples e moderna para consumir e gerar conteúdo."),
    ),
  ).toBe("IBMPlexMono-300.woff2");
});
