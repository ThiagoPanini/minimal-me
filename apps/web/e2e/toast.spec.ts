import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { renderedOpacity, runFor } from "./helpers";

// O aviso (Toast): no Marco 1 nenhum space tem página, e o "Acessar" de cada um responde com
// "<Status> · <nome do space> ainda não está disponível.", anunciado por `role="status"`.
const notices = [
  {
    name: "Frames & Songs",
    message: "Em desenvolvimento · Frames & Songs ainda não está disponível.",
  },
  {
    name: "Music & Feeling",
    message: "Em planejamento · Music & Feeling ainda não está disponível.",
  },
  { name: "Code & Share", message: "Em planejamento · Code & Share ainda não está disponível." },
  { name: "Write & Learn", message: "Em planejamento · Write & Learn ainda não está disponível." },
];

test("the Acessar link of each space shows the toast with the Status and the name, announced by role=status @webkit", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const toast = page.getByRole("status");

  for (const { name, message } of notices) {
    await page.getByRole("link", { name: `Acessar ${name}` }).press("Enter");
    await expect(toast).toHaveText(message);
    await expect(toast).toBeVisible();
    expect(await renderedOpacity(toast)).toBe(1);
  }
  // O aviso é a resposta: a página não salta para a fresta.
  expect(new URL(page.url()).hash).toBe("");
  // Com movimento reduzido, ele aparece sem transição nenhuma.
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test("the toast stays 2.6s in view and leaves the page when it fades out, and triggering it again restarts the time", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install({ time: new Date("2026-11-20T10:00:00Z") });
  await page.goto("/");
  await page.clock.pauseAt(new Date("2026-11-20T10:01:00Z"));
  const toast = page.getByRole("status");
  const access = page.getByRole("link", { name: "Acessar Frames & Songs" });
  const shown = () => renderedOpacity(toast);

  await access.press("Enter");
  await runFor(page, 2599);
  expect(await shown()).toBe(1);

  // De novo, 1ms antes de sumir: o tempo recomeça.
  await access.press("Enter");
  await runFor(page, 2599);
  expect(await shown()).toBe(1);
  await runFor(page, 1);
  expect(await shown()).toBe(0);
  // Com movimento reduzido, some sem transição.
  expect(await toast.evaluate((node) => node.getAnimations().length)).toBe(0);

  // Meio segundo depois de sumir, o aviso sai da página, e o leitor de tela não o encontra mais.
  await runFor(page, 499);
  await expect(toast).not.toHaveText("");
  await runFor(page, 1);
  await expect(toast).toHaveText("");
});

// A curva `ease` do sistema de design, para mudanças de estado.
const ease = "cubic-bezier(0.22, 0.61, 0.36, 1)";

type Fade = { snapshot: string; duration: number; easing: string; opacity: string[] };

// A próxima transição de vista da página (`<ViewTransition>` do React), assim que ela começa:
// quem entra nela, pelo nome de cada quadro, e como cada quadro muda de opacidade, o velho e o
// novo, com a duração e a curva. O nome sai do pseudo-elemento, e não do estilo do aviso: o
// React tira o `view-transition-name` do elemento no meio da transição, e a leitura dele
// corria contra essa limpeza.
function nextViewTransition(page: Page): Promise<{ names: string[]; fades: Fade[] }> {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        const look = () => {
          // As do navegador; as que o React acrescenta, sem duração, não animam nada.
          const running = document
            .getAnimations()
            .filter(
              (animation) =>
                animation instanceof CSSAnimation &&
                (animation.effect as KeyframeEffect).pseudoElement?.startsWith("::view-transition"),
            );
          if (running.length === 0) {
            requestAnimationFrame(look);
            return;
          }
          const names = new Set<string>();
          const fades: Fade[] = [];
          for (const animation of running) {
            const effect = animation.effect as KeyframeEffect;
            const [, snapshot, name] =
              /^(::view-transition-[a-z-]+)\((.*)\)$/.exec(String(effect.pseudoElement)) ?? [];
            if (name) names.add(name);
            const keyframes = effect.getKeyframes();
            if (keyframes[0]?.opacity === undefined) continue;
            fades.push({
              snapshot,
              duration: Number(effect.getTiming().duration),
              easing: String(keyframes[0].easing),
              opacity: keyframes.map(({ opacity }) => String(opacity)),
            });
          }
          fades.sort((one, other) => one.snapshot.localeCompare(other.snapshot));
          resolve({ names: [...names], fades });
        };
        look();
      }),
  );
}

// Espera a transição de vista em curso terminar (as animações do navegador acabarem).
async function viewTransitionDone(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter(
              (animation) =>
                animation instanceof CSSAnimation &&
                (animation.effect as KeyframeEffect).pseudoElement?.startsWith("::view-transition"),
            ).length,
      ),
    )
    .toBe(0);
}

test("the toast appears and fades out by opacity in 0.5s, in a view transition of its own", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const toast = page.getByRole("status");

  // Só o aviso entra na transição, pelo nome `toast`: o quadro velho some e o novo aparece, em
  // 0,5s, com `ease`; o resto da página não é capturado.
  const fade = {
    names: ["toast"],
    fades: [
      { snapshot: "::view-transition-new", duration: 500, easing: ease, opacity: ["0", "1"] },
      { snapshot: "::view-transition-old", duration: 500, easing: ease, opacity: ["1", "0"] },
    ],
  };
  const entering = nextViewTransition(page);
  await page.getByRole("link", { name: "Acessar Frames & Songs" }).press("Enter");
  expect(await entering).toEqual(fade);
  await viewTransitionDone(page);
  expect(await renderedOpacity(toast)).toBe(1);

  // 2,6s depois, a saída: de novo só o aviso, que fica transparente.
  expect(await nextViewTransition(page)).toEqual(fade);
  await viewTransitionDone(page);
  expect(await renderedOpacity(toast)).toBe(0);
});

test("the toast sits 20px from the bottom of the screen, centered and never wider than the screen minus 32px @webkit", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const toast = page.getByRole("status");

  await page.getByRole("link", { name: "Acessar Frames & Songs" }).press("Enter");
  await expect.poll(() => renderedOpacity(toast)).toBe(1);

  const viewport = page.viewportSize();
  const box = await toast.boundingBox();
  if (!viewport || !box) throw new Error("sem tela ou sem aviso");
  expect(viewport.height - (box.y + box.height)).toBeCloseTo(20, 0);
  expect(box.x + box.width / 2).toBeCloseTo(viewport.width / 2, 0);
  expect(box.width).toBeLessThanOrEqual(viewport.width - 32);

  // Fundo `toast-bg`, borda de 1px em `toast-border` e texto em `light`, em IBM Plex Mono 300
  // de 12px (tokens.json).
  await expect(toast).toHaveCSS("background-color", "rgba(16, 16, 17, 0.92)");
  await expect(toast).toHaveCSS("border-top-width", "1px");
  await expect(toast).toHaveCSS("border-top-color", "rgba(233, 233, 230, 0.14)");
  await expect(toast).toHaveCSS("color", "rgb(233, 233, 230)");
  await expect(toast).toHaveCSS("font-size", "12px");
  await expect(toast).toHaveCSS("font-weight", "300");
  // O `next/font` dá à família o nome da constante que a carrega.
  await expect(toast).toHaveCSS("font-family", /^ibmPlexMono,/);
});
