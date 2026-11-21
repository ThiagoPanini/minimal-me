import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { renderedOpacity } from "./rendering";

// O foco da fileira de spaces: vale o space sob o cursor, sob o teclado ou, em tela de toque,
// o último tocado. A fresta com foco abre (1,9 vez as outras na tela larga; até 900px, cinco
// vezes), as outras recuam para 60% da luz, e a descrição e o traço de 40px do "Acessar"
// aparecem. Os valores vêm de "Como a Home responde" da spec #57 e do guia da SpaceSlit.

const spaces = [
  { name: "Frames & Songs", lead: "Meus momentos, em fotos e vídeos." },
  { name: "Music & Feeling", lead: "Eu tocando, de perto." },
  { name: "Code & Share", lead: "O que eu ando construindo, sem atualizar nada à mão." },
  { name: "Write & Learn", lead: "Um agente de IA que escreve por conta própria." },
];

// A curva `ease` do sistema de design, para mudanças de estado.
const ease = "cubic-bezier(0.22, 0.61, 0.36, 1)";

function isStacked(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) <= 900;
}

// Quantas vezes a fresta aberta é mais larga que uma fechada.
function openToClosed(page: Page): number {
  return isStacked(page) ? 5 : 1.9;
}

// A descrição que a fresta mostra: a inteira ou, numa fileira com menos de 1120px, só a
// primeira frase (a outra fica fora da página).
function descriptionOf(item: Locator, lead: string): Locator {
  return item.getByText(lead).filter({ visible: true });
}

function slits(page: Page): Locator {
  return page.getByRole("main").getByRole("region", { name: "Spaces" }).getByRole("listitem");
}

type Box = { x: number; y: number; width: number; height: number };

async function boxOf(element: Locator): Promise<Box> {
  const box = await element.boundingBox();
  if (!box) throw new Error("elemento sem caixa na tela");
  return box;
}

// Espera as transições terminarem (o pulso do ponto, em laço, fica de fora).
async function settle(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}

type Transition = { property: string; duration: number; delay: number; easing: string };

// As transições que estão rodando num elemento.
function transitionsOf(element: Locator): Promise<Transition[]> {
  return element.evaluate((node) =>
    node
      .getAnimations()
      .filter((animation) => animation instanceof CSSTransition)
      .map((animation) => {
        const { duration, delay, easing } = animation.effect?.getTiming() ?? {};
        return {
          property: (animation as CSSTransition).transitionProperty,
          duration: Number(duration),
          delay: Number(delay),
          easing: String(easing),
        };
      }),
  );
}

// O que diz que uma fresta está aberta: a largura em relação às outras, a luz da foto, a
// descrição (ou a primeira frase dela) e o traço do "Acessar".
async function expectOpen(page: Page, index: number): Promise<void> {
  const items = slits(page);
  const boxes = await Promise.all((await items.all()).map(boxOf));
  const item = items.nth(index);
  const { name, lead } = spaces[index];
  for (const [other, box] of boxes.entries()) {
    expect(box.height, "a altura da fileira não muda").toBeCloseTo(boxes[0].height, 1);
    if (other === index) continue;
    expect(boxes[index].width / box.width, `${name} diante de ${spaces[other].name}`).toBeCloseTo(
      openToClosed(page),
      1,
    );
    expect(await renderedOpacity(items.nth(other).getByRole("img")), spaces[other].name).toBe(0.6);
  }
  expect(await renderedOpacity(item.getByRole("img")), name).toBe(1);
  const description = descriptionOf(item, lead);
  await expect(description).toBeVisible();
  expect(await renderedOpacity(description), name).toBe(1);
  const link = item.getByRole("link", { name: `Acessar ${name}` });
  expect(await renderedOpacity(link), name).toBe(1);
  // O traço do "Acessar" vai de 22px a 40px.
  expect((await boxOf(link.locator("span").last())).width).toBe(40);
}

test("o cursor abre a fresta sob ele, como no protótipo, e a fileira volta quando ele sai", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const items = slits(page);
  const music = items.nth(1);

  await music.hover();

  // A fresta vai a 1,9 vez as outras (até 900px, cinco vezes) em 0,9s, e a descrição sobe
  // 0,38s depois de a fresta começar a abrir.
  expect(await transitionsOf(music)).toContainEqual({
    property: "flex-grow",
    duration: 900,
    delay: 0,
    easing: ease,
  });
  const description = descriptionOf(music, spaces[1].lead);
  expect(
    (await transitionsOf(description)).map(({ property, delay }) => [property, delay]),
  ).toEqual(
    expect.arrayContaining([
      ["opacity", 380],
      ["translate", 380],
    ]),
  );
  await settle(page);
  await expectOpen(page, 1);

  // Fora da fileira: na tela larga, as quatro voltam a dividir a fileira por igual; até 900px,
  // a última com foco fica aberta.
  await page.mouse.move(1, 1);
  await settle(page);
  const boxes = await Promise.all((await items.all()).map(boxOf));
  if (isStacked(page)) {
    await expectOpen(page, 1);
  } else {
    for (const box of boxes) expect(box.width).toBeCloseTo(boxes[0].width, 1);
    expect(await renderedOpacity(items.nth(0).getByRole("img"))).toBe(1);
  }
});

test("a 390 e a 1440, o foco de teclado num Acessar abre a fresta dele e fica visível", async ({
  page,
}) => {
  // Sem transição, cada fresta já está no estado final quando o foco chega.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const items = slits(page);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Minimal Me, início" })).toBeFocused();
  for (const [index, { name }] of spaces.entries()) {
    await page.keyboard.press("Tab");
    const link = items.nth(index).getByRole("link", { name: `Acessar ${name}` });
    await expect(link).toBeFocused();
    await settle(page);
    await expectOpen(page, index);
    await expect(link).toBeInViewport();
  }

  // Fora da fileira: na tela larga, as quatro voltam ao repouso; até 900px, a última com foco
  // fica aberta.
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "voltar ao início ↑" })).toBeFocused();
  await settle(page);
  if (isStacked(page)) {
    await expectOpen(page, spaces.length - 1);
  } else {
    const boxes = await Promise.all((await items.all()).map(boxOf));
    for (const box of boxes) expect(box.width).toBeCloseTo(boxes[0].width, 1);
  }
});

test("com movimento reduzido a fresta abre sem transição e o foco continua valendo, mesmo se a preferência mudar com a página aberta", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.emulateMedia({ reducedMotion: "reduce" });

  await slits(page).nth(2).hover();

  // Nada roda na página, nem o pulso do ponto, e a fresta já está aberta.
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await expectOpen(page, 2);
});
