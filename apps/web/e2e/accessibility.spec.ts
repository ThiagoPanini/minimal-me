import AxeBuilder from "@axe-core/playwright";
import type { Page, TestInfo } from "@playwright/test";
import { expect, test } from "./fixtures";

// WCAG A e AA até a 2.2. Os resultados incompletos só informam, como anotação do teste.
const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];

// O axe numa página aberta: as violações falham o teste.
async function expectNoAxeViolations(page: Page, testInfo: TestInfo): Promise<void> {
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
}

// As páginas da Home: ela mesma e a 404, que o nginx serve a qualquer rota que não existe.
const pages = [
  { name: "the Home", route: "/" },
  { name: "the 404", route: "/esta-rota-nao-existe" },
];

for (const { name, route } of pages) {
  test(`${name} passes axe, with WCAG A and AA up to 2.2`, async ({ page }, testInfo) => {
    await page.goto(route);
    await expectNoAxeViolations(page, testInfo);
  });
}

test("with a slit opened by the keyboard and the toast in view, the Home passes axe", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  // A marca e depois o "Acessar" de Music & Feeling.
  for (let link = 0; link < 3; link++) await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Acessar Music & Feeling" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText(
    "Em planejamento · Music & Feeling ainda não está disponível.",
  );

  await expectNoAxeViolations(page, testInfo);
});

// A descrição de um space como o leitor de tela a ouve: a inteira na tela larga e, até 900px,
// só a primeira frase.
function description(page: Page, ...sentences: string[]): string {
  return (page.viewportSize()?.width ?? 0) <= 900 ? sentences[0] : sentences.join(" ");
}

// A árvore de acessibilidade da Home, inteira (`deep-equal`): quem muda o que a Home mostra
// atualiza a árvore aqui. O `status` vazio é o aviso (Toast), à espera de uma mensagem; o
// `alert` vazio no fim é o anúncio de troca de rota do Next. No YAML, nome com ":" vai entre
// aspas simples.
test("the ARIA tree of the Home @webkit", async ({ page }) => {
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
    - main:
      - region "Spaces":
        - heading "Spaces" [level=2]
        - text: 01 — 04
        - list:
          - listitem:
            - paragraph: 01 Em desenvolvimento
            - heading "Frames & Songs" [level=3]
            - 'img "Ilustração: no alto de uma duna, uma pessoa agachada fotografa com tripé o sol que nasce atrás das montanhas."'
            - paragraph: ${description(page, "Meus momentos, em fotos e vídeos.", "Posts em carrossel, cada um com a música que ficou daquele momento.")}
            - link "Acessar Frames & Songs":
              - /url: "#frames-and-songs"
          - listitem:
            - paragraph: 02 Em planejamento
            - heading "Music & Feeling" [level=3]
            - 'img "Ilustração: no alto de uma duna, ao lado de um amplificador, uma pessoa sentada toca guitarra diante do sol que nasce."'
            - paragraph: ${description(page, "Eu tocando, de perto.", "Vídeos curtos de pequenos trechos de canções, no violão e na guitarra, guardados pelo que me fazem sentir.")}
            - link "Acessar Music & Feeling":
              - /url: "#music-and-feeling"
          - listitem:
            - paragraph: 03 Em planejamento
            - heading "Code & Share" [level=3]
            - 'img "Ilustração: de costas, uma pessoa programa numa mesa com dois monitores, entre duas fileiras de servidores."'
            - paragraph: ${description(page, "O que eu ando construindo, sem atualizar nada à mão.", "Repositórios, commits e o uso de cada ferramenta de IA chegam sozinhos do meu ambiente de desenvolvimento.")}
            - link "Acessar Code & Share":
              - /url: "#code-and-share"
          - listitem:
            - paragraph: 04 Em planejamento
            - heading "Write & Learn" [level=3]
            - 'img "Ilustração: no alto de uma duna, uma pessoa sentada lê um livro enquanto folhas de papel flutuam ao redor."'
            - paragraph: ${description(page, "Um agente de IA que escreve por conta própria.", "Parte do que me interessa, sugere temas e publica textos para que eu e quem me visita aprendamos juntos.")}
            - link "Acessar Write & Learn":
              - /url: "#write-and-learn"
    - contentinfo:
      - paragraph: Minimal Me
      - paragraph:
        - text: © 2026
        - link "voltar ao início ↑":
          - /url: "#top"
    - status
    - alert
  `);
});

// A árvore de acessibilidade da 404, inteira: a marca no céu, o texto com o caminho de volta e
// o rodapé só com o ano.
test("the ARIA tree of the 404 @webkit", async ({ page }) => {
  await page.goto("/esta-rota-nao-existe");

  await expect(page.locator("body")).toMatchAriaSnapshot(`
    - /children: deep-equal
    - banner:
      - link "Minimal Me, início":
        - /url: /
    - main:
      - heading "página não encontrada" [level=1]
      - paragraph: Este endereço não leva a nenhum lugar do Minimal Me.
      - link "voltar ao início":
        - /url: /
    - contentinfo:
      - paragraph: Minimal Me
      - paragraph: © 2026
    - alert
  `);
});
