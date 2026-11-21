import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { renderedOpacity } from "./rendering";

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

test("o Acessar de cada space mostra o aviso com o Status e o nome, anunciado por role=status @webkit", async ({
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

// Com o relógio parado, o tempo só anda por `runFor`. O React desenha o que um temporizador
// mudou numa mensagem posta depois dele: três voltas de mensagem garantem o desenho.
async function runFor(page: Page, milliseconds: number): Promise<void> {
  await page.clock.runFor(milliseconds);
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
}

test("o aviso fica 2,6s à vista e sai da página quando some, e acionar de novo reinicia o tempo", async ({
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
// quem entra nela (o aviso, pelo nome que ele leva) e como cada quadro dele muda de opacidade,
// o velho e o novo, com a duração e a curva.
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
          const toast = document.querySelector('[role="status"]');
          const toastName = toast ? getComputedStyle(toast).viewTransitionName : "";
          const names = new Set<string>();
          const fades: Fade[] = [];
          for (const animation of running) {
            const effect = animation.effect as KeyframeEffect;
            const [, snapshot, name] =
              /^(::view-transition-[a-z-]+)\((.*)\)$/.exec(String(effect.pseudoElement)) ?? [];
            if (name) names.add(name === toastName ? "aviso" : name);
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

test("o aviso aparece e some por opacidade em 0,5s, numa transição de vista só dele", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const toast = page.getByRole("status");

  // Só o aviso entra na transição: o quadro velho some e o novo aparece, em 0,5s, com `ease`;
  // o resto da página não é capturado.
  const fade = {
    names: ["aviso"],
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

test("o aviso fica a 20px do pé da tela, centrado e nunca mais largo que a tela menos 32px @webkit", async ({
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
