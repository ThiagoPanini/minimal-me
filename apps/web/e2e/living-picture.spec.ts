import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Locator, Page, Response } from "@playwright/test";
import { expect, test } from "./fixtures";

// A foto viva (módulo 5 da spec #57 e "Foto viva" no guia da SpaceSlit): a ilustração do space
// com foco acorda, com um movimento feito do que está pintado nela, desenhado sobre a imagem.
// Em repouso nada é desenhado; só a fresta com foco se move, e até 900px a fresta guardada,
// aberta sem foco, fica parada; com movimento reduzido, nenhuma foto viva roda.

const names = ["Frames & Songs", "Music & Feeling", "Code & Share", "Write & Learn"];

function slits(page: Page): Locator {
  return page.getByRole("main").getByRole("region", { name: "Spaces" }).getByRole("listitem");
}

// O que está desenhado sobre a imagem de uma fresta: uma assinatura dos px do canvas, ou
// `null` quando ele está todo transparente.
function drawingOf(slit: Locator): Promise<number | null> {
  return slit.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    if (!canvas.width || !canvas.height) return null;
    const context = canvas.getContext("2d");
    if (!context) return null;
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let signature: number | null = null;
    for (let index = 0; index < data.length; index += 4) {
      if (data[index + 3] === 0) continue;
      signature = ((signature ?? 0) * 31 + index + data[index] + data[index + 3]) | 0;
    }
    return signature;
  });
}

// Quais fotos têm algo desenhado sobre a imagem, na ordem dos spaces.
async function drawnPictures(page: Page): Promise<boolean[]> {
  const items = await slits(page).all();
  return Promise.all(items.map(async (item) => (await drawingOf(item)) !== null));
}

function only(index: number): boolean[] {
  return names.map((_, other) => other === index);
}

// A foto se move: o desenho muda em menos de um segundo.
async function expectMoving(page: Page, slit: Locator, name: string): Promise<void> {
  const samples = new Set<number | null>();
  for (let sample = 0; sample < 3; sample += 1) {
    samples.add(await drawingOf(slit));
    await page.waitForTimeout(300);
  }
  expect(samples.has(null), `${name} desenhada`).toBe(false);
  expect(samples.size, `${name} se move`).toBeGreaterThan(1);
}

test("com o foco, só a foto do space se move, e a que perde o foco volta ao repouso", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const items = slits(page);
  await items.first().scrollIntoViewIfNeeded();

  // Sem foco nada é desenhado: na tela larga nenhuma fresta está aberta e, até 900px, a
  // guardada (Frames & Songs) está aberta, mas parada. O tempo de a foto acordar, se fosse
  // acordar, passa antes da conferência.
  await page.waitForTimeout(1500);
  expect(await drawnPictures(page)).toEqual(only(-1));

  for (const [index, name] of names.entries()) {
    await items.nth(index).hover();
    await expect.poll(() => drawnPictures(page), { message: name }).toEqual(only(index));
    await expectMoving(page, items.nth(index), name);
  }

  // Com o cursor fora da fileira, as quatro voltam ao repouso, inclusive, até 900px, a última
  // com foco, que fica guardada aberta.
  await page.mouse.move(1, 1);
  await expect.poll(() => drawnPictures(page)).toEqual(only(-1));
});

test.describe("em tela de toque", () => {
  // O `tap()` no Chromium só funciona com `hasTouch`; no WebKit do iPhone 13, o toque já chega
  // como `pointerType` `touch`.
  test.use({ hasTouch: true });

  test("a foto da fresta tocada acorda, e a da que estava aberta volta ao repouso @webkit", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    const items = slits(page);
    await items.first().scrollIntoViewIfNeeded();
    // Music & Feeling está fechada em qualquer largura: o toque a escolhe, e ela acorda.
    await items.nth(1).tap();
    await expect.poll(() => drawnPictures(page)).toEqual(only(1));

    await items.nth(3).tap();
    await expect.poll(() => drawnPictures(page)).toEqual(only(3));
    await expectMoving(page, items.nth(3), names[3]);
  });
});

test("com movimento reduzido nenhuma foto viva roda, mesmo com foco, e a preferência vale na hora", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const items = slits(page);
  await items.first().scrollIntoViewIfNeeded();
  await items.nth(3).hover();

  // A fresta abre, mas nada é desenhado sobre a foto.
  await expect(
    items
      .nth(3)
      .getByText("Um agente de IA que escreve por conta própria.")
      .filter({ visible: true }),
  ).toBeVisible();
  await page.waitForTimeout(1500);
  expect(await drawnPictures(page)).toEqual(only(-1));

  // Sem a redução, a foto com foco acorda; com ela de novo, para na hora, sem a volta de um
  // segundo ao repouso.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(() => drawnPictures(page)).toEqual(only(3));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => drawnPictures(page), { timeout: 400 }).toEqual(only(-1));
  await page.waitForTimeout(500);
  expect(await drawnPictures(page)).toEqual(only(-1));
});

// Com o relógio parado, o tempo só anda por `runFor`; antes, três voltas de mensagem deixam o
// React terminar o que o cursor mudou.
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

test("a foto que perde o foco volta ao repouso em cerca de um segundo", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install({ time: new Date("2026-11-20T10:00:00Z") });
  await page.goto("/");
  await page.clock.pauseAt(new Date("2026-11-20T10:01:00Z"));
  const items = slits(page);
  const write = items.nth(3);
  await items.first().scrollIntoViewIfNeeded();
  await write.hover();
  await expect
    .poll(async () => {
      await runFor(page, 100);
      return drawingOf(write);
    })
    .not.toBeNull();
  await runFor(page, 3000);

  // O foco passa a Music & Feeling: Write & Learn ainda está voltando 0,6s depois e, 1,5s
  // depois, já está em repouso.
  await items.nth(1).hover();
  await runFor(page, 600);
  expect(await drawingOf(write), "0,6s depois").not.toBeNull();
  await runFor(page, 900);
  expect(await drawingOf(write), "1,5s depois").toBeNull();
});

test("em repouso ou fora da vista, o laço para e nenhum quadro é pedido", async ({ page }) => {
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
  // O laço parou: logo passa um segundo inteiro sem nenhum quadro pedido. A profundidade da
  // página (motion/depth.tsx) ainda segue o ponteiro por uns 3s depois que ele para.
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
  const write = slits(page).nth(3);
  await write.scrollIntoViewIfNeeded();

  // Sem foco, as fotos ficam em repouso, inclusive, até 900px, a da fresta guardada aberta.
  await expectNoFrames("em repouso, antes do foco");

  // Com o cursor fora da fileira, a foto que tinha o foco volta ao repouso; até 900px, a fresta
  // dela fica guardada aberta, parada.
  await write.hover();
  await expect.poll(() => drawnPictures(page)).toEqual(only(3));
  await page.mouse.move(1, 1);
  await expect.poll(() => drawnPictures(page)).toEqual(only(-1));
  await expectNoFrames("em repouso, depois do foco");

  // Acordada, ela pede quadros; fora da vista, não se move.
  await write.hover();
  await expect.poll(() => drawnPictures(page)).toEqual(only(3));
  const awake = await frameRequests();
  await page.waitForTimeout(300);
  expect(await frameRequests(), "acordada").toBeGreaterThan(awake);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expectNoFrames("fora da vista");
});

// O atlas das folhas de Write & Learn, como está no sistema de design.
const sheetsAtlas = createHash("sha256")
  .update(
    readFileSync(
      path.resolve(
        import.meta.dirname,
        "../../../docs/design/system/assets/Illustrations/ai-sheets.webp",
      ),
    ),
  )
  .digest("hex");

// O que a página pediu à rede: os scripts e quantas vezes o atlas das folhas chegou.
function watchNetwork(page: Page) {
  const scripts = new Set<string>();
  const images: Response[] = [];
  page.on("response", (response) => {
    const type = response.request().resourceType();
    if (type === "script") scripts.add(response.url());
    if (type === "image") images.push(response);
  });
  return {
    scripts: () => new Set(scripts),
    atlasResponses: async () => {
      const hashes = await Promise.all(
        images.map(async (image) =>
          createHash("sha256")
            .update(await image.body())
            .digest("hex"),
        ),
      );
      return hashes.filter((hash) => hash === sheetsAtlas).length;
    },
  };
}

test("na primeira visita, nem o desenho da foto viva nem o atlas das folhas são pedidos; chegam quando a foto acorda", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const network = watchNetwork(page);
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const firstVisit = network.scripts();
  expect(await network.atlasResponses(), "atlas na primeira visita").toBe(0);

  // Frames & Songs acorda: o desenho chega num script que a primeira visita não pediu, e o
  // atlas das folhas continua de fora.
  const items = slits(page);
  await items.first().scrollIntoViewIfNeeded();
  await items.first().hover();
  await expect.poll(() => drawnPictures(page)).toEqual(only(0));
  const arrived = [...network.scripts()].filter((script) => !firstVisit.has(script));
  expect(arrived.length, "scripts pedidos quando a foto acorda").toBeGreaterThan(0);
  expect(await network.atlasResponses(), "atlas com Frames & Songs acordada").toBe(0);

  // Write & Learn acorda: o atlas é pedido uma vez.
  await items.nth(3).hover();
  await expect.poll(() => drawnPictures(page)).toEqual(only(3));
  await expect.poll(() => network.atlasResponses()).toBe(1);
});
