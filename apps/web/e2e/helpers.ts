import type { Locator, Page } from "@playwright/test";

// Os ajudantes que mais de um teste usa: medidas da página, a fileira de spaces e o tempo.

export type Box = { x: number; y: number; width: number; height: number };

// A caixa de um elemento na tela; falha o teste se ele não tem caixa.
export async function boxOf(element: Locator): Promise<Box> {
  const box = await element.boundingBox();
  if (!box) throw new Error("elemento sem caixa na tela");
  return box;
}

// A opacidade que chega à tela: o produto da opacidade do elemento e de cada ancestral.
export function renderedOpacity(element: Locator): Promise<number> {
  return element.evaluate((node) => {
    let opacity = 1;
    for (let current: Element | null = node; current; current = current.parentElement) {
      opacity *= Number(getComputedStyle(current).opacity);
    }
    return opacity;
  });
}

// A espessura de um contorno como o navegador a desenha: arredondada para baixo em pixels
// do dispositivo (1,5px vira 1px numa tela de densidade 1).
export async function outlineWidth(page: Page, width: number): Promise<string> {
  const ratio = await page.evaluate(() => window.devicePixelRatio);
  return `${Math.floor(width * ratio) / ratio}px`;
}

// Até 900px a página empilha (a variante `stacked`): a fileira de spaces fica com uma fresta
// sempre aberta, e sobre a duna só entra a primeira frase da descrição.
export function isStacked(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) <= 900;
}

// As frestas da fileira de spaces, na ordem.
export function slits(page: Page): Locator {
  return page.getByRole("main").getByRole("region", { name: "Spaces" }).getByRole("listitem");
}

// Espera as animações e transições em curso terminarem (o pulso do ponto, em laço, fica de fora).
export async function settle(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}

// Três voltas de mensagem: o React termina o que mudou nelas, e não pelo relógio da página.
function reactTurns(page: Page): Promise<void> {
  return page.evaluate(
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
}

// Com o relógio da página parado (`page.clock.pauseAt`), o tempo, os temporizadores e cada
// quadro só andam por aqui. Antes, o React termina o que o teste mudou (o cursor, um clique);
// depois, desenha o que um temporizador mudou.
export async function runFor(page: Page, milliseconds: number): Promise<void> {
  await reactTurns(page);
  await page.clock.runFor(milliseconds);
  await reactTurns(page);
}
