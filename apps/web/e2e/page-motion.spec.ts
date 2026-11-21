import type { CDPSession, Locator, Page } from "@playwright/test";
import sharp from "sharp";
import { expect, test } from "./fixtures";
import { renderedOpacity } from "./rendering";

// O movimento da página (módulo 6 da spec #57, "Movimento" no guia do sistema de design): a
// abertura entra quando as duas camadas chegam, ou depois de 5s, com o nome subindo por
// máscara, palavra a palavra; ao rolar, cada bloco entra uma vez. Os tempos e as curvas são os
// do protótipo (`docs/design/prototype/mvp/index.html`).

// As curvas do sistema de design (tokens.json): `ease` para mudanças de estado e `ease-out`
// para entradas.
const ease = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const easeOut = "cubic-bezier(0.16, 1, 0.3, 1)";

type Entrance = {
  duration: number;
  delay: number;
  easing: string;
  // De onde a animação parte; ela termina no estado que o elemento já tem.
  from: Record<string, string>;
};

// As animações de entrada de um elemento (o pulso do ponto, em laço, fica de fora).
function entrancesOf(element: Locator): Promise<Entrance[]> {
  return element.evaluate((node) =>
    node
      .getAnimations()
      .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
      .map((animation) => {
        const effect = animation.effect as KeyframeEffect;
        const { duration, delay } = effect.getTiming();
        const [{ easing, offset, composite, computedOffset, ...from }] = effect.getKeyframes();
        return {
          duration: Number(duration),
          delay: Number(delay),
          easing: String(easing),
          from: from as Record<string, string>,
        };
      }),
  );
}

// O relógio das animações CSS, pelo protocolo do Chromium: parado em 0, cada entrada fica no
// primeiro quadro até o teste soltá-lo.
async function animationClock(
  page: Page,
): Promise<{ stop: () => Promise<void>; run: () => Promise<void> }> {
  const session: CDPSession = await page.context().newCDPSession(page);
  await session.send("Animation.enable");
  const rate = (playbackRate: number) =>
    session.send("Animation.setPlaybackRate", { playbackRate });
  return { stop: () => rate(0).then(() => undefined), run: () => rate(1).then(() => undefined) };
}

// Espera as entradas terminarem (o pulso do ponto, em laço, fica de fora).
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

// O maior brilho, de 0 a 255, que um texto deixa na tela: a área dele capturada como está e
// com o texto transparente, comparadas px a px. Zero quando nada dele aparece.
async function drawnBy(page: Page, text: Locator): Promise<number> {
  const box = await text.boundingBox();
  if (!box) throw new Error("texto sem caixa na tela");
  // A área do texto e a de baixo dele, por onde as palavras sobem.
  const clip = { x: box.x, y: box.y, width: box.width, height: box.height * 2 };
  const pixels = async () =>
    sharp(await page.screenshot({ clip, animations: "allow" }))
      .raw()
      .toBuffer();
  const shown = await pixels();
  await text.evaluate((node: HTMLElement) => node.style.setProperty("color", "transparent"));
  const background = await pixels();
  await text.evaluate((node: HTMLElement) => node.style.removeProperty("color"));
  let largest = 0;
  for (let index = 0; index < shown.length; index += 1) {
    largest = Math.max(largest, Math.abs(shown[index] - background[index]));
  }
  return largest;
}

test("a abertura entra como no protótipo: o nome sobe por máscara, palavra a palavra, e o sobretítulo, a frase e a marca entram depois", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const clock = await animationClock(page);
  await clock.stop();
  await page.goto("/");
  const name = page.getByRole("heading", { level: 1, name: "Minimal Me" });

  // Cada palavra sobe 105% da própria altura em 1,25s, a segunda 150ms depois da primeira.
  expect(await entrancesOf(name.getByText("Minimal", { exact: true }))).toEqual([
    { duration: 1250, delay: 450, easing: easeOut, from: { translate: "0px 105%" } },
  ]);
  expect(await entrancesOf(name.getByText("Me", { exact: true }))).toEqual([
    { duration: 1250, delay: 600, easing: easeOut, from: { translate: "0px 105%" } },
  ]);
  // Por máscara: antes de subir, nada do nome aparece, nem abaixo dele.
  expect(await drawnBy(page, name)).toBeLessThan(8);

  expect(await entrancesOf(page.getByText("hub pessoal e minimalista"))).toEqual([
    { duration: 1000, delay: 950, easing: ease, from: { opacity: "0" } },
  ]);
  expect(
    await entrancesOf(
      page.getByText("Uma dinâmica simples e moderna para consumir e gerar conteúdo."),
    ),
  ).toEqual([
    { duration: 1000, delay: 1050, easing: easeOut, from: { opacity: "0", translate: "0px 12px" } },
  ]);
  const mark = page.getByRole("link", { name: "Minimal Me, início" });
  expect(await entrancesOf(mark)).toEqual([
    { duration: 1200, delay: 1200, easing: ease, from: { opacity: "0" } },
  ]);

  // Solto o relógio, tudo termina no estado de repouso.
  await clock.run();
  await settle(page);
  expect(await drawnBy(page, name)).toBeGreaterThan(100);
  for (const text of [name, page.getByText("hub pessoal e minimalista"), mark]) {
    expect(await renderedOpacity(text)).toBe(1);
  }
});

// As camadas da abertura: o céu (decorativo, sem texto alternativo) e as dunas.
function openingLayers(page: Page): { sky: Locator; dunes: Locator } {
  return {
    sky: page.getByRole("banner").locator('img[src*="/media/sky"]'),
    dunes: page.getByRole("img", {
      name: "Ilustração: uma pessoa sentada nas dunas observa um grande mapa celeste.",
    }),
  };
}

// Segura as dunas na rede até o teste soltá-las.
async function holdDunes(page: Page): Promise<() => void> {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/\/_next\/static\/media\/dunes[-.]/, async (route) => {
    await held;
    await route.continue();
  });
  return release;
}

function arrived(image: Locator): Promise<boolean> {
  return image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0);
}

const skyEntrance = {
  duration: 2400,
  delay: 0,
  easing: easeOut,
  from: { opacity: "0", scale: "1.045" },
};
const dunesEntrance = {
  duration: 1900,
  delay: 150,
  easing: easeOut,
  from: { opacity: "0", translate: "0px 4%" },
};

test("a ilustração da abertura espera as duas camadas: o céu fica escondido até as dunas chegarem", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const clock = await animationClock(page);
  await page.clock.install({ time: new Date("2026-11-20T10:00:00Z") });
  const releaseDunes = await holdDunes(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.clock.pauseAt(new Date("2026-11-20T10:00:01Z"));
  const { sky, dunes } = openingLayers(page);

  // O céu chegou, mas não aparece sem as dunas.
  await expect.poll(() => arrived(sky)).toBe(true);
  expect(await renderedOpacity(sky)).toBe(0);
  expect(await entrancesOf(sky)).toEqual([]);

  // Com as dunas, as duas entram: o céu em 2,4s, as dunas em 1,9s, 150ms depois.
  await clock.stop();
  releaseDunes();
  await expect.poll(() => entrancesOf(sky)).toEqual([skyEntrance]);
  expect(await entrancesOf(dunes)).toEqual([dunesEntrance]);

  await clock.run();
  await settle(page);
  expect(await renderedOpacity(sky)).toBe(1);
  expect(await renderedOpacity(dunes)).toBe(1);
});

test("a abertura aparece mesmo se uma camada não chegar em 5s", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const clock = await animationClock(page);
  await page.clock.install({ time: new Date("2026-11-20T10:00:00Z") });
  const releaseDunes = await holdDunes(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.clock.pauseAt(new Date("2026-11-20T10:00:01Z"));
  const { sky } = openingLayers(page);
  await expect.poll(() => arrived(sky)).toBe(true);

  // A espera conta desde o começo da página: 4s depois, o céu ainda está escondido; 6s
  // depois, já entrou.
  await page.clock.runFor(3000);
  expect(await renderedOpacity(sky)).toBe(0);
  await clock.stop();
  await page.clock.runFor(2000);
  await expect.poll(() => entrancesOf(sky)).toEqual([skyEntrance]);

  await clock.run();
  await settle(page);
  expect(await renderedOpacity(sky)).toBe(1);
  releaseDunes();
});
