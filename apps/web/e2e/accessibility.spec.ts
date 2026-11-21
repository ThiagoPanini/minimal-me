import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

// WCAG A e AA até a 2.2. Os resultados incompletos só informam, como anotação do teste.
const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];

test("a Home passa no axe, com WCAG A e AA até 2.2", async ({ page }, testInfo) => {
  await page.goto("/");

  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();

  for (const { id, help, nodes } of results.incomplete) {
    testInfo.annotations.push({
      type: "axe incompleto",
      description: `${id}: ${help} (${nodes.map(({ target }) => target.join(" ")).join("; ")})`,
    });
  }
  expect(
    results.violations.map(({ id, help, nodes }) => ({
      id,
      help,
      targets: nodes.map(({ target }) => target.join(" ")),
    })),
  ).toEqual([]);
});

// A árvore de acessibilidade da Home, inteira (`deep-equal`): quem muda o que a Home mostra
// atualiza a árvore aqui. O `alert` vazio no fim é o anúncio de troca de rota do Next.
test("a árvore ARIA da Home @webkit", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("body")).toMatchAriaSnapshot(`
    - /children: deep-equal
    - banner:
      - link "Minimal Me, início":
        - /url: "#top"
      - 'img "Ilustração: uma pessoa sentada nas dunas observa um grande mapa celeste."'
      - heading "Minimal Me" [level=1]
      - paragraph: hub pessoal e minimalista
      - paragraph: Uma dinâmica simples e moderna para consumir e gerar conteúdo.
    - contentinfo:
      - paragraph: Minimal Me
      - paragraph:
        - text: © 2026
        - link "voltar ao início ↑":
          - /url: "#top"
    - alert
  `);
});
