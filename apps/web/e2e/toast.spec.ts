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
});

test("o aviso fica 2,6s à vista e sai da página quando some, e acionar de novo reinicia o tempo", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/");
  const toast = page.getByRole("status");
  const access = page.getByRole("link", { name: "Acessar Frames & Songs" });
  const shown = () => renderedOpacity(toast);

  await access.press("Enter");
  await page.clock.runFor(2000);
  await expect.poll(shown).toBe(1);

  // De novo aos 2s: o tempo recomeça, e aos 4s o aviso continua à vista.
  await access.press("Enter");
  await page.clock.runFor(2000);
  await expect.poll(shown).toBe(1);
  await page.clock.runFor(700);
  await expect.poll(shown).toBe(0);
  // Com movimento reduzido, some sem transição.
  expect(await toast.evaluate((node) => node.getAnimations().length)).toBe(0);

  // Depois de sumir, o aviso sai da página, e o leitor de tela não o encontra mais.
  await page.clock.runFor(500);
  await expect(toast).toHaveText("");
});

test("o aviso fica a 20px do pé da tela, centrado e nunca mais largo que a tela menos 32px, e aparece por opacidade em 0,5s @webkit", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const toast = page.getByRole("status");

  await page.getByRole("link", { name: "Acessar Frames & Songs" }).press("Enter");

  expect(
    await toast.evaluate((node) =>
      node.getAnimations().map((animation) => ({
        property: (animation as CSSTransition).transitionProperty,
        duration: animation.effect?.getTiming().duration,
      })),
    ),
  ).toEqual([{ property: "opacity", duration: 500 }]);
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
