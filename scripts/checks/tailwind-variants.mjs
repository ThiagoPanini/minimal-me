// As variantes do Tailwind que a web recusa, porque erram em silêncio: as quebras arbitrárias de
// largura da tela e o `motion-reduce:transition-none`. As quebras da Home e as variantes de
// movimento estão em `apps/web/app/globals.css`.

const rules = [
  {
    // `max-[900px]:` e `min-[901px]:`, também depois de outra variante ou negadas. As consultas
    // de contêiner (`@max-[…]:` e `@min-[…]:`) medem o contêiner, não a tela, e passam.
    pattern: /(?<![@\w])(?:max|min)-\[[^\]\s]*\]:/g,
    problem:
      "deixa um buraco: `max-[N]:` vale abaixo de N, e a 900px exatos nem `max-[900px]:` nem `min-[901px]:` valem",
    use: "use `stacked:` (até 900px), `not-stacked:` (acima de 900px) ou `narrow:` (até 760px)",
  },
  {
    pattern: /motion-reduce:transition-none/g,
    problem:
      "perde para as variantes que vêm depois no CSS, como as `slit-*`, e a transição volta com movimento reduzido",
    use: "ponha a transição em `motion-safe:`, como `motion-safe:[transition:…]`",
  },
];

/** Cada variante recusada num arquivo da web, com o arquivo, a linha e o que usar no lugar. */
export function tailwindVariantProblems(file, text) {
  const problems = [];
  text.split("\n").forEach((line, index) => {
    for (const { pattern, problem, use } of rules) {
      for (const [found] of line.matchAll(pattern)) {
        problems.push(`${file}:${index + 1}: \`${found}\` ${problem}; ${use}.`);
      }
    }
  });
  return problems;
}
