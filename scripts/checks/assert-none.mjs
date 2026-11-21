// A falha de um check do repositório: o título e cada problema numa linha, com o arquivo.
import assert from "node:assert/strict";

/** Falha com a lista dos problemas, um por linha, depois do título; passa sem problema. */
export function assertNone(problems, title) {
  assert.ok(
    problems.length === 0,
    [title, ...problems.map((problem) => `- ${problem}`)].join("\n"),
  );
}
