import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { renderedOpacity } from "./rendering";

test.use({ javaScriptEnabled: false });

const spaces = [
  { number: "01", name: "Frames & Songs", status: "Em desenvolvimento" },
  { number: "02", name: "Music & Feeling", status: "Em planejamento" },
  { number: "03", name: "Code & Share", status: "Em planejamento" },
  { number: "04", name: "Write & Learn", status: "Em planejamento" },
];

// O texto das frestas que fica à vista em repouso, como com script. Na tela larga, cada
// fresta mostra o número, o Status, o nome e o "Acessar" (a descrição sobe só com o foco). Até
// 900px, Frames & Songs fica aberta, com a primeira frase, e as outras mostram o número.
function spaceTexts(page: Page): Locator[] {
  const stacked = (page.viewportSize()?.width ?? 0) <= 900;
  const items = page.getByRole("main").getByRole("listitem");
  return spaces.flatMap(({ number, name, status }, index) => {
    const item = items.nth(index);
    const shown = [item.getByText(number, { exact: true })];
    if (!stacked || index === 0) {
      shown.push(
        item.getByText(status, { exact: true }),
        item.getByRole("heading", { level: 3, name }),
        item.getByRole("link", { name: `Acessar ${name}` }),
      );
    }
    if (stacked && index === 0) {
      shown.push(item.getByText("Meus momentos, em fotos e vídeos.", { exact: true }));
    }
    return shown;
  });
}

test("sem JavaScript, o texto e as ilustrações aparecem @webkit", async ({ page }) => {
  await page.goto("/");

  const texts = [
    page.getByRole("heading", { level: 1, name: "Minimal Me" }),
    page.getByText("hub pessoal e minimalista"),
    page.getByText("Uma dinâmica simples e moderna para consumir e gerar conteúdo."),
    page.getByRole("heading", { level: 2, name: "Spaces" }),
    page.getByText("01 — 04"),
    ...spaceTexts(page),
    page.getByRole("contentinfo").getByText("Minimal Me", { exact: true }),
    page.getByRole("contentinfo").getByText("© 2026"),
    page.getByRole("link", { name: "voltar ao início ↑" }),
  ];
  for (const text of texts) {
    await expect(text).toBeVisible();
    expect(await renderedOpacity(text), (await text.textContent()) ?? "").toBe(1);
  }

  // Toda imagem da página, o céu, as marcas e as quatro dos spaces inclusive, carregada e à
  // vista: com a luz inteira, ou com 60% dela numa fresta recuada para a aberta (até 900px).
  const images = await page.locator("img").all();
  expect(images.length).toBeGreaterThanOrEqual(8);
  for (const image of images) {
    await expect(image).toBeVisible();
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
    const opacity = Math.round((await renderedOpacity(image)) * 100) / 100;
    expect([1, 0.6], (await image.getAttribute("alt")) ?? "").toContain(opacity);
  }
});

test("sem JavaScript, o Acessar fica na própria fresta @webkit", async ({ page }) => {
  await page.goto("/");
  const slit = page.getByRole("main").getByRole("listitem").first();

  await slit.getByRole("link", { name: "Acessar Frames & Songs" }).click();

  expect(await slit.evaluate((item) => item.matches(":target"))).toBe(true);
  await expect(slit).toBeInViewport();
});
