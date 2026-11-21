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

// As entradas que movem um elemento: as animações dele e as dos elementos que o contêm (o
// pulso do ponto, em laço, fica de fora). Com `rule`, as do fio de um bloco, desenhado num
// pseudo-elemento dentro dele.
function entrancesOf(element: Locator, { rule = false } = {}): Promise<Entrance[]> {
  return element.evaluate((node, rule) => {
    const animations: Animation[] = [];
    if (rule) {
      animations.push(
        ...node
          .getAnimations({ subtree: true })
          .filter((animation) => (animation.effect as KeyframeEffect).pseudoElement),
      );
    } else {
      for (let current: Element | null = node; current; current = current.parentElement) {
        animations.push(...current.getAnimations());
      }
    }
    return animations
      .filter(
        (animation) =>
          animation instanceof CSSAnimation &&
          animation.effect?.getTiming().iterations !== Infinity,
      )
      .map((animation) => {
        const effect = animation.effect as KeyframeEffect;
        const { duration, delay } = effect.getTiming();
        const [{ easing, offset, composite, computedOffset, ...from }] = effect.getKeyframes();
        // Em ms inteiros: 0,12s + 0,05s não dá 170 exatos em ponto flutuante.
        return {
          duration: Math.round(Number(duration)),
          delay: Math.round(Number(delay)),
          easing: String(easing),
          from: from as Record<string, string>,
        };
      });
  }, rule);
}

// O relógio das animações CSS, pelo protocolo do Chromium: parado em 0, cada entrada fica no
// primeiro quadro até o teste soltá-lo. Ele continua parado depois de um `goto`.
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
  await text.scrollIntoViewIfNeeded();
  const box = await text.boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) throw new Error("texto sem caixa na tela");
  // A área do texto e a de baixo dele, por onde as palavras sobem, dentro da tela.
  const clip = {
    x: box.x,
    y: box.y,
    width: box.width,
    height: Math.min(box.height * 2, viewport.height - box.y),
  };
  // Cada captura espera dois quadros, para mostrar a página como ela está agora.
  const pixels = async () => {
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    return sharp(await page.screenshot({ clip, animations: "allow" }))
      .raw()
      .toBuffer();
  };
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

// Quantas entradas rodam na página (o pulso do ponto, em laço, fica de fora).
function runningEntrances(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation instanceof CSSAnimation &&
            animation.effect?.getTiming().iterations !== Infinity,
        ).length,
  );
}

const spaceNames = ["Frames & Songs", "Music & Feeling", "Code & Share", "Write & Learn"];

test("ao rolar, cada bloco entra uma vez: o fio cresce, as fotos se revelam como uma cópia no banho e os textos sobem, uma fresta depois da outra", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const clock = await animationClock(page);
  await clock.stop();
  await page.goto("/");
  const section = page.getByRole("region", { name: "Spaces" });
  const footer = page.getByRole("contentinfo");
  const footerTexts = [
    footer.getByText("Minimal Me", { exact: true }),
    footer.getByRole("link", { name: "voltar ao início ↑" }),
  ];

  // Fora da tela, o rodapé espera a vez dele.
  for (const text of footerTexts) expect(await renderedOpacity(text)).toBe(0);

  // O cabeçalho da seção: o rótulo e a contagem aparecem, e o fio cresce da esquerda.
  const label = section.getByRole("heading", { level: 2, name: "Spaces" });
  await label.scrollIntoViewIfNeeded();
  await expect
    .poll(() => entrancesOf(label))
    .toEqual([{ duration: 900, delay: 0, easing: ease, from: { opacity: "0" } }]);
  expect(await entrancesOf(section.getByText("01 — 04"))).toEqual([
    { duration: 900, delay: 250, easing: ease, from: { opacity: "0" } },
  ]);
  expect(await entrancesOf(label.locator(".."), { rule: true })).toEqual([
    { duration: 1200, delay: 0, easing: easeOut, from: { scale: "0 1" } },
  ]);

  // As frestas, 120ms uma depois da outra: a foto se revela em 1,6s, e o topo e o pé sobem
  // 12px, 0,4s depois de a foto começar.
  const slits = section.getByRole("listitem");
  await slits.first().scrollIntoViewIfNeeded();
  for (const [index, name] of spaceNames.entries()) {
    const slit = slits.nth(index);
    const delay = index * 120;
    await expect
      .poll(() => entrancesOf(slit.getByRole("img")), { message: name })
      .toEqual([
        {
          duration: 1600,
          delay: delay + 50,
          easing: easeOut,
          from: { opacity: "0", filter: "contrast(0.35) brightness(1.6)" },
        },
      ]);
    const rise = [
      {
        duration: 900,
        delay: delay + 400,
        easing: easeOut,
        from: { opacity: "0", translate: "0px 12px" },
      },
    ];
    expect(await entrancesOf(slit.getByRole("heading", { level: 3, name })), name).toEqual(rise);
    expect(await entrancesOf(slit.getByRole("link")), name).toEqual(rise);
  }

  // O rodapé: o fio cresce, e o texto aparece 0,3s depois.
  await footer.scrollIntoViewIfNeeded();
  for (const text of footerTexts) {
    await expect
      .poll(() => entrancesOf(text))
      .toEqual([{ duration: 1000, delay: 300, easing: ease, from: { opacity: "0" } }]);
  }
  expect(await entrancesOf(footer, { rule: true })).toEqual([
    { duration: 1200, delay: 0, easing: easeOut, from: { scale: "0 1" } },
  ]);

  // Uma vez só: de volta ao topo e de novo embaixo, nada entra outra vez, e tudo fica à vista.
  await clock.run();
  await settle(page);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await slits.first().scrollIntoViewIfNeeded();
  await footer.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  expect(await runningEntrances(page)).toBe(0);
  for (const text of [label, ...footerTexts]) expect(await renderedOpacity(text)).toBe(1);
  for (const index of spaceNames.keys()) {
    const opacity = await renderedOpacity(slits.nth(index).getByRole("img"));
    // Até 900px, as fechadas recuam para 60% da luz diante da guardada.
    expect([1, 0.6]).toContain(Math.round(opacity * 100) / 100);
  }
});

// Tudo à vista, sem rolar: o nome, a abertura, o cabeçalho dos Spaces, as fotos e o texto das
// frestas e o rodapé.
async function expectFinalState(page: Page): Promise<void> {
  const name = page.getByRole("heading", { level: 1, name: "Minimal Me" });
  expect(await drawnBy(page, name), "o nome desenhado").toBeGreaterThan(100);
  const { sky, dunes } = openingLayers(page);
  const section = page.getByRole("region", { name: "Spaces" });
  const footer = page.getByRole("contentinfo");
  for (const element of [
    sky,
    dunes,
    page.getByText("hub pessoal e minimalista"),
    page.getByRole("link", { name: "Minimal Me, início" }),
    section.getByRole("heading", { level: 2, name: "Spaces" }),
    section.getByText("01 — 04"),
    footer.getByText("Minimal Me", { exact: true }),
    footer.getByRole("link", { name: "voltar ao início ↑" }),
  ]) {
    expect(await renderedOpacity(element)).toBe(1);
  }
  const slits = section.getByRole("listitem");
  for (const [index, name] of spaceNames.entries()) {
    const slit = slits.nth(index);
    const opacity = await renderedOpacity(slit.getByRole("img"));
    expect([1, 0.6], name).toContain(Math.round(opacity * 100) / 100);
    expect(await renderedOpacity(slit.getByText(`0${index + 1}`, { exact: true })), name).toBe(1);
  }
}

test("com movimento reduzido, tudo aparece no estado final, sem nenhuma animação, nem com foco", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const animations = () => page.evaluate(() => document.getAnimations().length);

  await expectFinalState(page);
  expect(await animations()).toBe(0);

  // Rolando a página e com o foco numa fresta, pelo cursor e pelo teclado.
  const slits = page.getByRole("region", { name: "Spaces" }).getByRole("listitem");
  await slits.nth(2).hover();
  await expect(
    slits.nth(2).getByText("O que eu ando construindo", { exact: false }).filter({ visible: true }),
  ).toBeVisible();
  expect(await animations()).toBe(0);
  await page.getByRole("link", { name: "Acessar Write & Learn" }).focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
  expect(await animations()).toBe(0);
});

test("se a preferência passa a movimento reduzido no meio da entrada, tudo vai na hora ao estado final, e nada entra de novo quando ela volta", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const clock = await animationClock(page);
  await clock.stop();
  await page.goto("/");
  expect(await runningEntrances(page)).toBeGreaterThan(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await expectFinalState(page);

  await clock.run();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  expect(await runningEntrances(page)).toBe(0);
  await expectFinalState(page);
});

// Com o relógio da página parado, o tempo (e cada quadro) só anda por `runFor`; antes, três
// voltas de mensagem deixam o React terminar o que mudou.
async function runFor(page: Page, milliseconds: number): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const channel = new MessageChannel();
        let hops = 0;
        channel.port1.onmessage = () => {
          hops += 1;
          if (hops === 3) resolve();
          else channel.port2.postMessage(null);
        };
        channel.port2.postMessage(null);
      }),
  );
  await page.clock.runFor(milliseconds);
}

// A página com movimento, depois da entrada da abertura, com o relógio parado.
async function openStill(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install({ time: new Date("2026-11-20T10:00:00Z") });
  await page.goto("/");
  await settle(page);
  await page.clock.pauseAt(new Date("2026-11-20T10:01:00Z"));
  await runFor(page, 100);
}

type Point = { x: number; y: number };

async function positionOf(element: Locator): Promise<Point> {
  const box = await element.boundingBox();
  if (!box) throw new Error("elemento sem caixa na tela");
  return { x: box.x, y: box.y };
}

function shift(from: Point, to: Point): Point {
  return { x: to.x - from.x, y: to.y - from.y };
}

// O ponteiro num canto da tela, até a profundidade assentar.
async function pointTo(page: Page, corner: "top-left" | "bottom-right"): Promise<void> {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("sem tela");
  if (corner === "top-left") await page.mouse.move(1, 1);
  else await page.mouse.move(viewport.width - 1, viewport.height - 1);
  await runFor(page, 4000);
}

test("com o ponteiro, a abertura ganha profundidade: o céu vai até 6px e 3px contra ele, e as dunas até 12px e 5px com ele", async ({
  page,
}) => {
  await openStill(page);
  const { sky, dunes } = openingLayers(page);
  const before = { sky: await positionOf(sky), dunes: await positionOf(dunes) };

  // O ponteiro no canto de baixo, à direita: quase no máximo, nas duas direções.
  await pointTo(page, "bottom-right");
  const skyShift = shift(before.sky, await positionOf(sky));
  const dunesShift = shift(before.dunes, await positionOf(dunes));
  expect(skyShift.x).toBeCloseTo(-6, 0);
  expect(skyShift.y).toBeCloseTo(-3, 0);
  expect(dunesShift.x).toBeCloseTo(12, 0);
  expect(dunesShift.y).toBeCloseTo(5, 0);
});

test("as fotos dos spaces ganham profundidade: até 14px com a rolagem e até 3px com o ponteiro", async ({
  page,
}) => {
  await openStill(page);
  const slit = page.getByRole("region", { name: "Spaces" }).getByRole("listitem").nth(2);
  const picture = slit.getByRole("img");
  const offset = async () => shift(await positionOf(slit), await positionOf(picture));
  // Rola e espera o evento de rolagem chegar à página, antes de andar o relógio: com o relógio
  // parado, o `scroll` só chega no quadro real seguinte, e o `runFor` sem ele não vê a rolagem.
  const scrollTo = async (top: number) => {
    await page.evaluate(
      (top) =>
        new Promise<void>((resolve) => {
          window.addEventListener("scroll", () => resolve(), { once: true });
          window.scrollTo({ top, behavior: "instant" });
        }),
      top,
    );
    await runFor(page, 100);
  };
  const viewport = page.viewportSize();
  const box = await slit.boundingBox();
  if (!viewport || !box) throw new Error("sem tela ou sem fresta");
  const top = box.y + (await page.evaluate(() => window.scrollY));

  // A rolagem leva a foto por 14px: ela desce 7px quando a fresta entra pelo pé da tela, fica
  // no lugar com a fresta no meio da tela e subiria 7px com ela saindo pelo topo (a página
  // acaba antes disso).
  await scrollTo(top - viewport.height + 1);
  const entering = await offset();
  await scrollTo(top - (viewport.height - box.height) / 2);
  const centered = await offset();
  expect(entering.y - centered.y).toBeCloseTo(7, 0);

  // Com a fresta no meio da tela, o ponteiro de um canto ao outro, fora da fileira: a foto vai
  // 3px para cada lado, contra ele, e 2px para cima e para baixo.
  await pointTo(page, "top-left");
  const fromTopLeft = await offset();
  await pointTo(page, "bottom-right");
  const pointerShift = shift(fromTopLeft, await offset());
  expect(pointerShift.x / 2).toBeCloseTo(-3, 0);
  expect(pointerShift.y / 2).toBeCloseTo(-2, 0);
});

test("com movimento reduzido nada ganha profundidade, e a troca da preferência vale na hora", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install({ time: new Date("2026-11-20T10:00:00Z") });
  await page.goto("/");
  await page.clock.pauseAt(new Date("2026-11-20T10:01:00Z"));
  const { dunes } = openingLayers(page);
  const slit = page.getByRole("region", { name: "Spaces" }).getByRole("listitem").nth(2);
  const pictureOffset = async () =>
    shift(await positionOf(slit), await positionOf(slit.getByRole("img")));
  const still = { dunes: await positionOf(dunes), picture: await pictureOffset() };

  await pointTo(page, "bottom-right");
  expect(await positionOf(dunes)).toEqual(still.dunes);
  expect(await pictureOffset()).toEqual(still.picture);

  // Sem a redução, a profundidade volta (a camada chega 2% mais perto), e as dunas seguem o
  // ponteiro; com ela de novo, voltam na hora ao lugar.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect
    .poll(async () => {
      await runFor(page, 50);
      return positionOf(dunes);
    })
    .not.toEqual(still.dunes);
  const rest = await positionOf(dunes);
  await pointTo(page, "top-left");
  expect(shift(rest, await positionOf(dunes)).x).toBeCloseTo(-12, 0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => positionOf(dunes), { timeout: 400 }).toEqual(still.dunes);
  expect(await pictureOffset()).toEqual(still.picture);
});

test("em repouso, o laço da página para, e nenhum quadro é pedido", async ({ page }) => {
  await page.addInitScript(() => {
    const request = window.requestAnimationFrame.bind(window);
    const counter = window as unknown as { frameRequests: number };
    counter.frameRequests = 0;
    window.requestAnimationFrame = (callback) => {
      counter.frameRequests += 1;
      return request(callback);
    };
  });
  const frameRequests = () =>
    page.evaluate(() => (window as unknown as { frameRequests: number }).frameRequests);
  // O laço parou: logo passa um segundo inteiro sem nenhum quadro pedido.
  const expectNoFrames = (message: string) =>
    expect
      .poll(
        async () => {
          const before = await frameRequests();
          await page.waitForTimeout(1000);
          return (await frameRequests()) - before;
        },
        { message, timeout: 8000 },
      )
      .toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await settle(page);
  await expectNoFrames("depois da entrada");

  // Seguindo o ponteiro, a página pede quadros; quando o alcança, para.
  await page.mouse.move(8, 8);
  const following = await frameRequests();
  await page.waitForTimeout(300);
  expect(await frameRequests(), "seguindo o ponteiro").toBeGreaterThan(following);
  await expectNoFrames("depois de alcançar o ponteiro");

  // A rolagem pede um quadro de cada vez (pouca, para nenhuma foto viva acordar).
  await page.evaluate(() => window.scrollBy({ top: 20, behavior: "instant" }));
  await expectNoFrames("depois da rolagem");
});
