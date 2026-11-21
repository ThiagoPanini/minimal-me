import type { Page, TestInfo } from "@playwright/test";
import { measureTextsOverIllustrations } from "./contrast";
import { expect, test } from "./fixtures";

// Contraste no pior ponto (spec #57, Testing Decisions; guia do sistema de design, Acessibilidade):
// todo texto sobre uma ilustração fica em 4,5:1 ou mais, ou 3:1 para texto de 24px ou mais, no
// pior ponto da imagem atrás dele e no estado em que ele aparece. Mede a Home em repouso e com
// o foco em cada space, e a 404, a 1440, 1280, 1100 e 390 de largura, com movimento reduzido:
// sem transição, sem foto viva e sem aproximação, cada estado é uma imagem só. O foco vem do
// teclado, como o Visitante o põe. O método está em `contrast.ts`.

test.use({ reducedMotion: "reduce" });

// As larguras rodam no projeto do Chromium com a tela mais parecida.
const widths = [
  { width: 1440, height: 900, project: "chromium-1440" },
  { width: 1280, height: 900, project: "chromium-1440" },
  { width: 1100, height: 900, project: "chromium-1440" },
  { width: 390, height: 844, project: "chromium-390" },
];

const spaces = [
  {
    number: "01",
    name: "Frames & Songs",
    status: "Em desenvolvimento",
    lead: "Meus momentos, em fotos e vídeos.",
  },
  {
    number: "02",
    name: "Music & Feeling",
    status: "Em planejamento",
    lead: "Eu tocando, de perto.",
  },
  {
    number: "03",
    name: "Code & Share",
    status: "Em planejamento",
    lead: "O que eu ando construindo, sem atualizar nada à mão.",
  },
  {
    number: "04",
    name: "Write & Learn",
    status: "Em planejamento",
    lead: "Um agente de IA que escreve por conta própria.",
  },
];

type Space = (typeof spaces)[number];

const decimal = (value: number) => value.toFixed(2).replace(".", ",");

// Os textos que a fresta mostra, para conferir que a medição achou cada um: aberta (com foco
// ou, até 900px, guardada), o topo, a descrição (ou a primeira frase dela) e o "Acessar";
// fechada, até 900px, só o número; nas outras larguras, o topo e o "Acessar". A descrição só
// aparece com a fresta aberta: achá-la confirma que o foco chegou.
function slitTexts({ number, name, status, lead }: Space, open: boolean, stacked: boolean) {
  if (stacked && !open) return [`"${number}" em ${name}`];
  return [
    `"${number}" em ${name}`,
    `"${status}" em ${name}`,
    `"${name}"`,
    ...(open ? [expect.stringContaining(`"${lead}`)] : []),
    `"Acessar" em ${name}`,
  ];
}

async function expectReadable(
  page: Page,
  testInfo: TestInfo,
  state: string,
  expected: unknown[],
): Promise<void> {
  const results = await measureTextsOverIllustrations(page);
  await testInfo.attach("contraste", {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  });
  const width = page.viewportSize()?.width;
  expect(
    results.map(({ text }) => text),
    "os textos sobre ilustração que a página mostra",
  ).toEqual(expect.arrayContaining(expected));
  const failures = results
    .filter(({ ratio, minimum }) => ratio < minimum)
    .map(
      ({ text, ratio, minimum, at }) =>
        `${text}, a ${width}px, ${state}: ${decimal(ratio)}:1 no pior ponto (${at.x}, ${at.y}), abaixo de ${decimal(minimum)}:1`,
    );
  expect(failures, "textos sobre ilustração abaixo do mínimo").toEqual([]);
}

// O foco de teclado no "Acessar" de um space: a tabulação anda até ele.
async function focusWithKeyboard(page: Page, { name }: Space): Promise<void> {
  const link = page.getByRole("link", { name: `Acessar ${name}` });
  for (let step = 0; step < 8; step++) {
    if (await link.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(link).toBeFocused();
}

for (const { width, height, project } of widths) {
  const stacked = width <= 900;
  // Até 900px, o nome do Masthead sobe sobre o pé escuro das dunas.
  const masthead = stacked ? ['"Minimal Me"'] : [];

  test.describe(`a ${width}px`, () => {
    test.use({ viewport: { width, height } });

    test.beforeEach(({ page: _ }, testInfo) => {
      test.skip(testInfo.project.name !== project, `${width}px roda no projeto ${project}`);
    });

    test("na Home em repouso, todo texto sobre ilustração fica legível no pior ponto", async ({
      page,
    }, testInfo) => {
      await page.goto("/");
      // Até 900px, a primeira fresta fica guardada aberta.
      const expected = [
        ...masthead,
        ...spaces.flatMap((space, index) => slitTexts(space, stacked && index === 0, stacked)),
      ];
      await expectReadable(page, testInfo, "em repouso", expected);
    });

    for (const space of spaces) {
      test(`com foco em ${space.name}, todo texto sobre ilustração fica legível no pior ponto`, async ({
        page,
      }, testInfo) => {
        await page.goto("/");
        await focusWithKeyboard(page, space);
        const expected = [
          ...masthead,
          ...spaces.flatMap((other) => slitTexts(other, other === space, stacked)),
        ];
        await expectReadable(page, testInfo, `com foco em ${space.name}`, expected);
      });
    }

    test("na 404, todo texto sobre ilustração fica legível no pior ponto", async ({
      page,
    }, testInfo) => {
      await page.goto("/pagina-que-nao-existe");
      await expectReadable(page, testInfo, "na 404", []);
    });
  });
}
