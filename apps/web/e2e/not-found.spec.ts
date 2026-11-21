import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { outlineWidth } from "./helpers";

// A página de quem erra o endereço: o nginx a serve, com status 404, a qualquer rota que não
// existe, a partir do `404.html` do export.

// Rotas que não existem, de formas diferentes: um nome, um caminho fundo e um arquivo.
const missingRoutes = ["/esta-rota-nao-existe", "/spaces/frames-and-songs/fotos", "/arquivo.html"];

const phrase = "Este endereço não leva a nenhum lugar do Minimal Me.";

// A família com que o texto pede para ser desenhado: o nome que o `next/font` deu à família do
// sistema (Jost vira `jost`; IBM Plex Mono, `ibmPlexMono`).
function firstFamily(text: Locator): Promise<string> {
  return text.evaluate((element) =>
    getComputedStyle(element)
      .fontFamily.split(",")[0]
      .trim()
      .replace(/^["']|["']$/g, ""),
  );
}

async function openNotFound(page: Page): Promise<void> {
  const response = await page.goto(missingRoutes[0]);
  expect(response?.status()).toBe(404);
}

test("qualquer rota que não existe responde 404 com a página não encontrada @webkit", async ({
  page,
}) => {
  for (const route of missingRoutes) {
    const response = await page.goto(route);

    expect(response?.status(), route).toBe(404);
    await expect(page, route).toHaveTitle("Página não encontrada · Minimal Me");
    await expect(
      page.getByRole("heading", { level: 1, name: "página não encontrada" }),
    ).toBeVisible();
  }
});

test("a 404 mostra a marca, o sobretítulo, a frase, o caminho de volta e o rodapé só com o ano @webkit", async ({
  page,
}) => {
  await openNotFound(page);

  // O céu da abertura, sem as dunas e sem a figura: nenhuma imagem com nome na página.
  await expect(page.getByRole("img")).toHaveCount(0);
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Minimal Me, início" }),
  ).toHaveAttribute("href", "/");

  const content = page.getByRole("main");
  await expect(
    content.getByRole("heading", { level: 1, name: "página não encontrada" }),
  ).toBeVisible();
  await expect(content.getByText(phrase, { exact: true })).toBeVisible();
  await expect(content.getByRole("link", { name: "voltar ao início" })).toHaveAttribute(
    "href",
    "/",
  );

  // A página é curta: o rodapé fica sem o "voltar ao início ↑".
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByText("Minimal Me", { exact: true })).toBeVisible();
  await expect(footer.getByText("© 2026", { exact: true })).toBeVisible();
  await expect(footer.getByRole("link")).toHaveCount(0);
});

test("a 404 cabe numa tela, do céu ao rodapé", async ({ page }) => {
  await openNotFound(page);

  const { scrollHeight, innerHeight } = await page.evaluate(() => ({
    scrollHeight: document.scrollingElement?.scrollHeight ?? 0,
    innerHeight: window.innerHeight,
  }));
  expect(scrollHeight).toBe(innerHeight);
  await expect(page.getByRole("contentinfo").getByText("© 2026")).toBeInViewport();
});

test("o texto da 404 tem os estilos kicker, tagline e link, sobre ground", async ({ page }) => {
  await openNotFound(page);
  const content = page.getByRole("main");

  // Valores de docs/design/system/tokens.json: ground #161616, mist #8E8E89, body #C9C9C4 e
  // light #E9E9E6. kicker: Jost 400, 11px, .3em, em maiúsculas. tagline: IBM Plex Mono 300,
  // de 14px a 16px. link: IBM Plex Mono 400, 11px, .16em, em maiúsculas.
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(22, 22, 22)");
  const kicker = content.getByRole("heading", { level: 1 });
  await expect(kicker).toHaveCSS("color", "rgb(142, 142, 137)");
  await expect(kicker).toHaveCSS("font-weight", "400");
  await expect(kicker).toHaveCSS("font-size", "11px");
  await expect(kicker).toHaveCSS("letter-spacing", "3.3px");
  await expect(kicker).toHaveCSS("text-transform", "uppercase");

  const tagline = content.getByText(phrase, { exact: true });
  await expect(tagline).toHaveCSS("color", "rgb(201, 201, 196)");
  await expect(tagline).toHaveCSS("font-weight", "300");
  const taglineSize = Number.parseFloat(
    await tagline.evaluate((e) => getComputedStyle(e).fontSize),
  );
  expect(taglineSize).toBeGreaterThanOrEqual(14);
  expect(taglineSize).toBeLessThanOrEqual(16);

  const link = content.getByRole("link", { name: "voltar ao início" });
  await expect(link).toHaveCSS("color", "rgb(233, 233, 230)");
  await expect(link).toHaveCSS("font-weight", "400");
  await expect(link).toHaveCSS("font-size", "11px");
  await expect(link).toHaveCSS("letter-spacing", "1.76px");
  await expect(link).toHaveCSS("text-transform", "uppercase");
  expect(await firstFamily(kicker)).toBe("jost");
  expect(await firstFamily(tagline)).toBe("ibmPlexMono");
  expect(await firstFamily(link)).toBe("ibmPlexMono");
});

test("pela tabulação, a marca e o voltar ao início recebem foco visível e levam à Home", async ({
  page,
}) => {
  await openNotFound(page);
  const mark = page.getByRole("banner").getByRole("link", { name: "Minimal Me, início" });
  const backHome = page.getByRole("main").getByRole("link", { name: "voltar ao início" });

  // A marca sobre o céu: 2px em `ink` (#141414), afastado 4px.
  await page.keyboard.press("Tab");
  await expect(mark).toBeFocused();
  await expect(mark).toHaveCSS("outline-width", await outlineWidth(page, 2));
  await expect(mark).toHaveCSS("outline-color", "rgb(20, 20, 20)");

  // O link sobre ground: 1,5px na cor do texto (`light`, #E9E9E6), afastado 3px.
  await page.keyboard.press("Tab");
  await expect(backHome).toBeFocused();
  await expect(backHome).toHaveCSS("outline-style", "solid");
  await expect(backHome).toHaveCSS("outline-width", await outlineWidth(page, 1.5));
  await expect(backHome).toHaveCSS("outline-color", "rgb(233, 233, 230)");
  await expect(backHome).toHaveCSS("outline-offset", "3px");

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/");
  await expect(page).toHaveTitle("Minimal Me");
  await expect(page.getByRole("heading", { level: 1, name: "Minimal Me" })).toBeVisible();
});

test("a marca da 404 leva à Home @webkit", async ({ page }) => {
  await openNotFound(page);

  await page.getByRole("banner").getByRole("link", { name: "Minimal Me, início" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { level: 1, name: "Minimal Me" })).toBeVisible();
});
