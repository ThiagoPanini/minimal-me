import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

function scrollY(page: Page): () => Promise<number> {
  return () => page.evaluate(() => window.scrollY);
}

// A espessura de um contorno como o navegador a desenha: arredondada para baixo em pixels
// do dispositivo (1,5px vira 1px numa tela de densidade 1).
async function outlineWidth(page: Page, width: number): Promise<string> {
  const ratio = await page.evaluate(() => window.devicePixelRatio);
  return `${Math.floor(width * ratio) / ratio}px`;
}

// Numa tela de 600px de altura, a Home passa da altura da tela em qualquer largura.
async function openOnShortScreen(page: Page): Promise<void> {
  const { width } = page.viewportSize() ?? { width: 1440 };
  await page.setViewportSize({ width, height: 600 });
  await page.goto("/");
}

test("a página rola no documento, pelo teclado, e o voltar do navegador devolve a rolagem @webkit", async ({
  page,
}) => {
  await openOnShortScreen(page);
  const backToTop = page.getByRole("contentinfo").getByRole("link", { name: "voltar ao início ↑" });
  const bottom = await page.evaluate(
    () => (document.scrollingElement?.scrollHeight ?? 0) - window.innerHeight,
  );
  expect(bottom, "quanto a página rola").toBeGreaterThan(0);

  await page.keyboard.press("End");
  await expect.poll(scrollY(page)).toBe(bottom);
  await expect(backToTop).toBeInViewport();

  await backToTop.click();
  await expect.poll(scrollY(page)).toBe(0);

  await page.goBack();
  await expect.poll(scrollY(page)).toBe(bottom);
});

test("pela tabulação, voltar ao início e a marca recebem foco visível e levam ao topo", async ({
  page,
}) => {
  await openOnShortScreen(page);
  const mark = page.getByRole("banner").getByRole("link", { name: "Minimal Me, início" });
  const backToTop = page.getByRole("contentinfo").getByRole("link", { name: "voltar ao início ↑" });

  // O link do rodapé: 1,5px na cor do texto (`body`, #C9C9C4), afastado 3px.
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(backToTop).toBeFocused();
  await expect(backToTop).toHaveCSS("outline-style", "solid");
  await expect(backToTop).toHaveCSS("outline-width", await outlineWidth(page, 1.5));
  await expect(backToTop).toHaveCSS("outline-color", "rgb(201, 201, 196)");
  await expect(backToTop).toHaveCSS("outline-offset", "3px");
  await expect.poll(scrollY(page)).toBeGreaterThan(0);
  await page.keyboard.press("Enter");
  await expect.poll(scrollY(page)).toBe(0);

  // A marca sobre o céu: 2px em `ink` (#141414), afastado 4px. A tabulação recomeça no topo.
  await page.evaluate(() => window.scrollTo({ top: 12, behavior: "instant" }));
  await page.keyboard.press("Tab");
  await expect(mark).toBeFocused();
  await expect(mark).toHaveCSS("outline-style", "solid");
  await expect(mark).toHaveCSS("outline-width", await outlineWidth(page, 2));
  await expect(mark).toHaveCSS("outline-color", "rgb(20, 20, 20)");
  await expect(mark).toHaveCSS("outline-offset", "4px");
  await expect.poll(scrollY(page)).toBe(12);
  await page.keyboard.press("Enter");
  await expect.poll(scrollY(page)).toBe(0);
});

test("a rolagem até o topo é suave só quando há movimento, mesmo se a preferência mudar", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveCSS("scroll-behavior", "smooth");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(html).toHaveCSS("scroll-behavior", "auto");
});
