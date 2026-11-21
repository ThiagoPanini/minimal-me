import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { renderedOpacity } from "./rendering";

// Os quatro spaces, na ordem e com os textos da tabela "O que a Home mostra" da spec #57.
const spaces = [
  {
    number: "01",
    name: "Frames & Songs",
    status: "Em desenvolvimento",
    sentences: [
      "Meus momentos, em fotos e vídeos.",
      "Posts em carrossel, cada um com a música que ficou daquele momento.",
    ],
  },
  {
    number: "02",
    name: "Music & Feeling",
    status: "Em planejamento",
    sentences: [
      "Eu tocando, de perto.",
      "Vídeos curtos de pequenos trechos de canções, no violão e na guitarra, guardados pelo que me fazem sentir.",
    ],
  },
  {
    number: "03",
    name: "Code & Share",
    status: "Em planejamento",
    sentences: [
      "O que eu ando construindo, sem atualizar nada à mão.",
      "Repositórios, commits e o uso de cada ferramenta de IA chegam sozinhos do meu ambiente de desenvolvimento.",
    ],
  },
  {
    number: "04",
    name: "Write & Learn",
    status: "Em planejamento",
    sentences: [
      "Um agente de IA que escreve por conta própria.",
      "Parte do que me interessa, sugere temas e publica textos para que eu e quem me visita aprendamos juntos.",
    ],
  },
];

// Até 900px a fileira empilha, e sobre a duna só entra a primeira frase da descrição.
function isStacked(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) <= 900;
}

function spacesSection(page: Page) {
  return page.getByRole("main").getByRole("region", { name: "Spaces" });
}

test("a seção Spaces mostra a contagem 01 — 04 e os quatro spaces na ordem, com número, Status, nome, descrição e Acessar @webkit", async ({
  page,
}) => {
  await page.goto("/");

  const section = spacesSection(page);
  await expect(section.getByRole("heading", { level: 2, name: "Spaces" })).toBeVisible();
  await expect(section.getByText("01 — 04")).toBeVisible();

  const items = section.getByRole("listitem");
  await expect(items).toHaveCount(spaces.length);
  for (const [index, { number, name, status, sentences }] of spaces.entries()) {
    const description = isStacked(page) ? sentences[0] : sentences.join(" ");
    // O que o leitor de tela ouve em cada fresta, em qualquer largura.
    await expect(items.nth(index)).toMatchAriaSnapshot(`
      - listitem:
        - paragraph: ${number} ${status}
        - heading "${name}" [level=3]
        - paragraph: ${description}
        - link "Acessar ${name}"
    `);
  }
});

type Box = { x: number; y: number; width: number; height: number };

async function boxOf(element: Locator): Promise<Box> {
  const box = await element.boundingBox();
  if (!box) throw new Error("elemento sem caixa na tela");
  return box;
}

async function slitBoxes(page: Page): Promise<Box[]> {
  const items = spacesSection(page).getByRole("listitem");
  await expect(items).toHaveCount(spaces.length);
  return Promise.all((await items.all()).map(boxOf));
}

test("na tela larga, as quatro frestas dividem a fileira por igual e mostram a foto inteira, em 3:4", async ({
  page,
}) => {
  test.skip(isStacked(page), "a fileira larga só existe acima de 900px");
  await page.goto("/");

  const boxes = await slitBoxes(page);
  for (const box of boxes) {
    expect(box.y).toBeCloseTo(boxes[0].y, 1);
    expect(box.width).toBeCloseTo(boxes[0].width, 1);
    expect(box.height).toBeCloseTo(boxes[0].height, 1);
    expect(box.width / box.height).toBeCloseTo(3 / 4, 2);
  }
  for (const [index, box] of boxes.slice(1).entries()) {
    expect(box.x).toBeGreaterThan(boxes[index].x + boxes[index].width);
  }
});

test("até 900px, a fileira continua uma fileira, com Frames & Songs aberta a cinco vezes a largura das outras @webkit", async ({
  page,
}) => {
  test.skip(!isStacked(page), "a fileira empilhada só existe até 900px");
  // Sem movimento, a fileira já está no estado final, sem esperar a vez de entrar na tela.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const boxes = await slitBoxes(page);
  for (const box of boxes) {
    expect(box.y).toBeCloseTo(boxes[0].y, 1);
    expect(box.height).toBeCloseTo(boxes[0].height, 1);
  }
  for (const box of boxes.slice(1)) {
    expect(boxes[0].width / box.width).toBeCloseTo(5, 1);
  }
  // 8px entre as frestas.
  for (const [index, box] of boxes.slice(1).entries()) {
    expect(box.x - (boxes[index].x + boxes[index].width)).toBeCloseTo(8, 0);
  }

  const items = spacesSection(page).getByRole("listitem");
  // A aberta mostra o número, o Status em palavras, o nome, a primeira frase e o "Acessar".
  const open = items.nth(0);
  const { number, name, status, sentences } = spaces[0];
  for (const text of [
    open.getByText(number, { exact: true }),
    open.getByText(status, { exact: true }),
    open.getByRole("heading", { level: 3, name }),
    open.getByText(sentences[0], { exact: true }),
    open.getByRole("link", { name: `Acessar ${name}` }),
  ]) {
    await expect(text).toBeVisible();
    expect(await renderedOpacity(text), (await text.textContent()) ?? "").toBe(1);
  }

  // As fechadas mostram a tira da imagem com o número e o ponto; a palavra do Status, o nome
  // e o "Acessar" saem da vista e continuam para o leitor de tela.
  for (const [index, { number, name, status }] of spaces.entries()) {
    if (index === 0) continue;
    const closed = items.nth(index);
    const slit = boxes[index];
    const numberBox = await boxOf(closed.getByText(number, { exact: true }));
    expect(numberBox.x + numberBox.width).toBeLessThanOrEqual(slit.x + slit.width);
    expect(await renderedOpacity(closed.getByText(number, { exact: true }))).toBe(1);
    expect((await boxOf(closed.getByText(status, { exact: true }))).width).toBeLessThanOrEqual(1);
    expect(await renderedOpacity(closed.getByRole("heading", { level: 3, name }))).toBe(0);
    expect(await renderedOpacity(closed.getByRole("link", { name: `Acessar ${name}` }))).toBe(0);
  }
});

test("com a fileira abaixo de 1240px o Status desce para baixo do número, e abaixo de 1120px só a primeira frase entra", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-1440", "mede larguras da tela larga");
  const first = () => spacesSection(page).getByRole("listitem").first();
  const statusBelowNumber = async () => {
    const number = await boxOf(first().getByText("01", { exact: true }));
    const status = await boxOf(first().getByText(spaces[0].status, { exact: true }));
    return status.y >= number.y + number.height;
  };
  const description = spaces[0].sentences.join(" ");

  // 1440: a fileira tem 1313px.
  await page.goto("/");
  expect(await statusBelowNumber()).toBe(false);
  await expect(first()).toMatchAriaSnapshot(`
    - listitem:
      - paragraph: ${description}
  `);

  // 1280: a fileira tem cerca de 1167px.
  await page.setViewportSize({ width: 1280, height: 900 });
  expect(await statusBelowNumber()).toBe(true);
  await expect(first()).toMatchAriaSnapshot(`
    - listitem:
      - paragraph: ${description}
  `);

  // 1100: a fileira tem cerca de 1003px.
  await page.setViewportSize({ width: 1100, height: 900 });
  expect(await statusBelowNumber()).toBe(true);
  await expect(first()).toMatchAriaSnapshot(`
    - listitem:
      - /children: equal
      - paragraph: 01 ${spaces[0].status}
      - heading "${spaces[0].name}" [level=3]
      - img
      - paragraph: ${spaces[0].sentences[0]}
      - link
  `);
});

// Cores fora dos cinzas do sistema: o texto, o fundo e a sombra de cada elemento, com o nome
// do space em que ele está.
function colorsOutOfGray(page: Page) {
  return page.evaluate(() => {
    const channels = (color: string): number[] => {
      const values = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      return color.startsWith("color(") ? values.map((value) => value * 255) : values;
    };
    const isGray = (color: string) => {
      const [red, green, blue] = channels(color);
      return Math.max(red, green, blue) - Math.min(red, green, blue) <= 12;
    };
    const found: { space: string; text: string; property: string; color: string }[] = [];
    for (const element of document.body.querySelectorAll("*")) {
      const style = getComputedStyle(element);
      const ownText = [...element.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent?.trim())
        .join("");
      const painted: [string, string][] = [["background-color", style.backgroundColor]];
      if (ownText) painted.push(["color", style.color]);
      if (style.boxShadow !== "none") {
        painted.push(["box-shadow", style.boxShadow.match(/^(rgba?|color)\([^)]*\)/)?.[0] ?? ""]);
      }
      for (const [property, color] of painted) {
        if (color && color !== "rgba(0, 0, 0, 0)" && !isGray(color)) {
          const space =
            element.closest("li")?.querySelector("h3")?.textContent ?? "fora dos spaces";
          found.push({ space, text: ownText, property, color });
        }
      }
    }
    return found;
  });
}

test("só Em desenvolvimento tem cor na página: o ponto e a palavra, em status-in-development @webkit", async ({
  page,
}) => {
  await page.goto("/");

  // status-in-development: #E8B96A.
  expect(await colorsOutOfGray(page)).toEqual([
    {
      space: "Frames & Songs",
      text: "",
      property: "background-color",
      color: "rgb(232, 185, 106)",
    },
    {
      space: "Frames & Songs",
      text: "Em desenvolvimento",
      property: "color",
      color: "rgb(232, 185, 106)",
    },
  ]);
});

// O ponto da StatusLine: o elemento logo antes da palavra.
function dotOf(word: Locator): Locator {
  return word.locator("xpath=preceding-sibling::*[1]");
}

function runningLoops(element: Locator) {
  return element.evaluate((node) =>
    node
      .getAnimations()
      .filter((animation) => animation.playState === "running")
      .map((animation) => {
        const { duration, iterations } = animation.effect?.getTiming() ?? {};
        return { duration, iterations };
      }),
  );
}

test("o ponto diz o Status: cheio e pulsando em Em desenvolvimento, vazado em Em planejamento, e o pulso para com movimento reduzido @webkit", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const items = spacesSection(page).getByRole("listitem");
  const developing = dotOf(items.nth(0).getByText("Em desenvolvimento", { exact: true }));
  const planned = dotOf(items.nth(1).getByText("Em planejamento", { exact: true }));

  await expect(developing).toHaveCSS("background-color", "rgb(232, 185, 106)");
  await expect(developing).toHaveCSS("border-radius", "50%");
  expect(await boxOf(developing)).toMatchObject({ width: 5, height: 5 });
  // Vazado: um anel de 1px na cor do texto (`body`, #C9C9C4).
  await expect(planned).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(planned).toHaveCSS("box-shadow", "rgb(201, 201, 196) 0px 0px 0px 1px inset");

  // O pulso: 2,6s, em laço, só no ponto de "Em desenvolvimento".
  expect(await runningLoops(developing)).toEqual([{ duration: 2600, iterations: Infinity }]);
  expect(await runningLoops(planned)).toEqual([]);

  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await runningLoops(developing)).toEqual([]);
});

test("pela tabulação, os quatro Acessar são alcançados na ordem, com o foco visível por dentro da fresta", async ({
  page,
}) => {
  await page.goto("/");
  const items = spacesSection(page).getByRole("listitem");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Minimal Me, início" })).toBeFocused();
  for (const [index, { name }] of spaces.entries()) {
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: `Acessar ${name}` })).toBeFocused();
    // Um contorno de 1px em `mist` (#8E8E89) por dentro da borda da fresta.
    await expect(items.nth(index)).toHaveCSS("outline-style", "solid");
    await expect(items.nth(index)).toHaveCSS("outline-width", "1px");
    await expect(items.nth(index)).toHaveCSS("outline-color", "rgb(142, 142, 137)");
    await expect(items.nth(index)).toHaveCSS("outline-offset", "-1px");
  }
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "voltar ao início ↑" })).toBeFocused();
});
