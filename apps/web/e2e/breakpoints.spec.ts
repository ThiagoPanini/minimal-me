import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

// As quebras da Home valem "até N px", com N incluído, como no protótipo (`max-width`): a
// 900px exatos a página inteira já empilha, e a 760px exatos as camadas da abertura já usam a
// posição estreita. Um pixel acima, nenhuma das duas vale.

type Box = { x: number; y: number; width: number; height: number };

async function boxOf(element: Locator): Promise<Box> {
  const box = await element.boundingBox();
  if (!box) throw new Error("elemento sem caixa na tela");
  return box;
}

function dunes(page: Page): Locator {
  return page.getByRole("img", {
    name: "Ilustração: uma pessoa sentada nas dunas observa um grande mapa celeste.",
  });
}

async function layoutAt(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  const banner = page.getByRole("banner");
  const name = await boxOf(banner.getByRole("heading", { level: 1, name: "Minimal Me" }));
  const kicker = await boxOf(banner.getByText("hub pessoal e minimalista"));
  const footerName = await boxOf(page.getByRole("contentinfo").getByText("Minimal Me"));
  const credit = await boxOf(page.getByRole("contentinfo").getByText("© 2026"));
  const slits = await Promise.all(
    (await page.getByRole("main").getByRole("listitem").all()).map(boxOf),
  );
  return {
    bannerHeight: (await boxOf(banner)).height,
    // A camada das dunas cobre a ilustração com 3% de folga em cada borda.
    illustrationHeight: (await boxOf(dunes(page))).height / 1.06,
    kickerBelowName: kicker.y >= name.y + name.height,
    creditBelowName: credit.y >= footerName.y + footerName.height,
    firstSlitToSecond: slits[0].width / slits[1].width,
  };
}

test("a 900px exatos a Home inteira empilha, e a 901px nada empilha", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1440", "mede larguras da tela larga");
  // Sem transição, a fresta guardada já está aberta quando a tela estreita.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  // Empilhada: a abertura tem 66% da altura da tela, o bloco de texto desce para baixo do
  // nome, o crédito do rodapé desce para baixo da marca e Frames & Songs fica aberta.
  const stacked = await layoutAt(page, 900);
  expect(stacked.illustrationHeight).toBeCloseTo(594, 0);
  expect(stacked.kickerBelowName).toBe(true);
  expect(stacked.creditBelowName).toBe(true);
  expect(stacked.firstSlitToSecond).toBeCloseTo(5, 1);

  // Larga: a abertura e o Masthead ocupam a tela, o bloco de texto fica ao lado do nome, o
  // crédito ao lado da marca, e as quatro frestas dividem a fileira por igual.
  const wide = await layoutAt(page, 901);
  expect(wide.bannerHeight).toBeCloseTo(900, 0);
  expect(wide.kickerBelowName).toBe(false);
  expect(wide.creditBelowName).toBe(false);
  expect(wide.firstSlitToSecond).toBeCloseTo(1, 2);
});

test("a 760px exatos as camadas da abertura já usam a posição estreita, e a 761px a larga", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1440", "mede larguras da tela larga");
  await page.goto("/");

  // `position` das dunas em illustrations.json: estreita 36% 100%, larga 40% 100%.
  await page.setViewportSize({ width: 760, height: 900 });
  await expect(dunes(page)).toHaveCSS("object-position", "36% 100%");
  await page.setViewportSize({ width: 761, height: 900 });
  await expect(dunes(page)).toHaveCSS("object-position", "40% 100%");
});
