import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

// Regressão visual (spec #57, Testing Decisions): a Home e a 404 inteiras, a 390 e a 1440, e a
// fileira dos spaces com o foco de teclado em Music & Feeling, a 1440, comparadas às capturas
// de referência em `visual.spec.ts-snapshots/`. As referências nasceram depois da conferência
// da Home contra o protótipo por estrutura (#73) e só se refazem no contêiner do Playwright,
// quando a mudança visual é o objetivo do PR (CODING_STANDARDS.md).
//
// Com movimento reduzido nada se move: a página nasce no estado final, sem a profundidade e
// sem a foto viva, que não desenha.

test.use({ reducedMotion: "reduce" });

// A tolerância, calibrada no #73: um pixel conta como diferente quando a cor dele muda mais que
// `threshold` (a distância YIQ do pixelmatch, de 0 a 1, o padrão do Playwright), e a captura
// falha quando mais de `maxDiffPixels` pixels mudam assim. Trocar o Chromium 159 (Playwright
// 1.65) pelo 156 (Playwright 1.64) não mudou nenhum pixel das cinco capturas; a menor mudança
// de layout provocada, o ponto do Status 1px mais baixo, mudou 3, e um texto 1px fora do lugar
// muda de 30 a 900.
const tolerance = { threshold: 0.2, maxDiffPixels: 2 };

// As fontes prontas e todas as imagens carregadas e decodificadas, inclusive as de carga
// preguiçosa abaixo da dobra: a página rola até o fim e volta ao topo.
async function everythingLoaded(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const images = [...document.images];
          if (!images.every((image) => image.complete && image.naturalWidth > 0)) return false;
          await Promise.all(images.map((image) => image.decode()));
          return true;
        }),
      { message: "as imagens da página não carregaram" },
    )
    .toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
}

test("the whole Home, at rest", async ({ page }) => {
  await page.goto("/");
  await everythingLoaded(page);

  await expect(page).toHaveScreenshot("home.png", { fullPage: true, ...tolerance });
});

test("the whole 404", async ({ page }) => {
  const response = await page.goto("/esta-rota-nao-existe");
  expect(response?.status()).toBe(404);
  await everythingLoaded(page);

  await expect(page).toHaveScreenshot("not-found.png", { fullPage: true, ...tolerance });
});

test("the row with keyboard focus on Music & Feeling", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1440", "um estado de foco, na tela larga");
  await page.goto("/");
  await everythingLoaded(page);

  // Pela tabulação, como o Visitante põe o foco: a marca, o "Acessar" de Frames & Songs e o de
  // Music & Feeling.
  const link = page.getByRole("link", { name: "Acessar Music & Feeling" });
  for (let step = 0; step < 3; step++) await page.keyboard.press("Tab");
  await expect(link).toBeFocused();

  const spaces = page.getByRole("main").getByRole("region", { name: "Spaces" });
  await expect(spaces).toHaveScreenshot("space-focus.png", tolerance);
});
