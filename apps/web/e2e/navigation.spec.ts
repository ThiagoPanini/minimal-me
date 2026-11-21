import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { outlineWidth } from "./helpers";

function scrollY(page: Page): () => Promise<number> {
  return () => page.evaluate(() => window.scrollY);
}

// Espera a rolagem parar fora do topo. Com movimento, a rolagem que o foco faz é suave, e um
// Enter no meio dela deixa o Chromium no fim da página em vez de levar ao topo.
async function scrollSettled(page: Page): Promise<void> {
  let previous = -1;
  await expect
    .poll(async () => {
      const current = await scrollY(page)();
      const settled = current > 0 && current === previous;
      previous = current;
      return settled;
    })
    .toBe(true);
}

test("the page scrolls in the document, by keyboard, and the browser's back button restores the scroll @webkit", async ({
  page,
}) => {
  await page.goto("/");
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

test("by tabbing, the back-to-top link and the mark get a visible focus and lead to the top", async ({
  page,
}) => {
  await page.goto("/");
  const mark = page.getByRole("banner").getByRole("link", { name: "Minimal Me, início" });
  const backToTop = page.getByRole("contentinfo").getByRole("link", { name: "voltar ao início ↑" });

  // O link do rodapé, depois da marca e dos quatro "Acessar": 1,5px na cor do texto (`body`,
  // #C9C9C4), afastado 3px.
  for (let link = 0; link < 6; link++) await page.keyboard.press("Tab");
  await expect(backToTop).toBeFocused();
  await expect(backToTop).toHaveCSS("outline-style", "solid");
  await expect(backToTop).toHaveCSS("outline-width", await outlineWidth(page, 1.5));
  await expect(backToTop).toHaveCSS("outline-color", "rgb(201, 201, 196)");
  await expect(backToTop).toHaveCSS("outline-offset", "3px");
  await scrollSettled(page);
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

test("scrolling to the top is smooth only with motion, even if the preference changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveCSS("scroll-behavior", "smooth");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(html).toHaveCSS("scroll-behavior", "auto");
});
