import type { Locator } from "@playwright/test";
import { expect, test } from "./fixtures";

test.use({ javaScriptEnabled: false });

// A opacidade que chega à tela: o produto da opacidade do elemento e de cada ancestral.
function renderedOpacity(element: Locator): Promise<number> {
  return element.evaluate((node) => {
    let opacity = 1;
    for (let current: Element | null = node; current; current = current.parentElement) {
      opacity *= Number(getComputedStyle(current).opacity);
    }
    return opacity;
  });
}

test("sem JavaScript, o texto e as ilustrações aparecem @webkit", async ({ page }) => {
  await page.goto("/");

  const texts = [
    page.getByRole("heading", { level: 1, name: "Minimal Me" }),
    page.getByText("hub pessoal e minimalista"),
    page.getByText("Uma dinâmica simples e moderna para consumir e gerar conteúdo."),
    page.getByRole("contentinfo").getByText("Minimal Me", { exact: true }),
    page.getByRole("contentinfo").getByText("© 2026"),
    page.getByRole("link", { name: "voltar ao início ↑" }),
  ];
  for (const text of texts) {
    await expect(text).toBeVisible();
    expect(await renderedOpacity(text), await text.textContent()).toBe(1);
  }

  // Toda imagem da página, o céu e as marcas inclusive, carregada e à vista.
  const images = await page.locator("img").all();
  expect(images.length).toBeGreaterThanOrEqual(4);
  for (const image of images) {
    await expect(image).toBeVisible();
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
    expect(await renderedOpacity(image), await image.getAttribute("src")).toBe(1);
  }
});
