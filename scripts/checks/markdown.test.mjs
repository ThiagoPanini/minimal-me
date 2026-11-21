// Os Markdown do repositório (costura 2 da #57): a prosa sem travessão, a não ser no contador da
// interface, e todo caminho `docs/...` citado existindo.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { assertNone } from "./assert-none.mjs";
import { emDashProblems, missingDocPaths } from "./markdown.mjs";
import { markdownFiles, root } from "./repository.mjs";

const repositoryMarkdown = markdownFiles();

describe("the repository Markdown files", () => {
  test("the prose has no em dash, except the interface counter", () => {
    assert.ok(repositoryMarkdown.length > 0, "Nenhum Markdown listado pelo git.");
    assertNone(
      repositoryMarkdown.flatMap(({ file, text }) => emDashProblems(file, text)),
      "Prosa com travessão (troque por vírgula, dois-pontos, parênteses ou ponto, sem mudar o sentido):",
    );
  });

  test("every cited docs/ path exists, except in the Linhagem section of docs/design/README.md", () => {
    const exists = (cited) => existsSync(path.join(root, cited));
    assertNone(
      repositoryMarkdown.flatMap(({ file, text }) => missingDocPaths(file, text, exists)),
      "Caminhos docs/ citados que não existem (corrija o caminho; um arquivo que só existe num commit antigo se cita como `<commit>:docs/...`):",
    );
  });
});

describe("the em dash in prose", () => {
  test("flags the file, the line and the excerpt of each em dash in prose", () => {
    const text = ["# Título", "", "Uma frase — com um aparte.", "Outra linha."].join("\n");

    assert.deepEqual(emDashProblems("docs/exemplo.md", text), [
      "docs/exemplo.md:3: travessão na prosa: «Uma frase — com um aparte.»",
    ]);
  });

  test("the interface counter, like 01 — 04, passes; an em dash on the same line does not", () => {
    const counter = 'Mostre a contagem como "01 — 04", em `number`.';
    const both = "A contagem 01 — 04 fica à direita — e o rótulo à esquerda.";

    assert.deepEqual(emDashProblems("a.md", counter), []);
    assert.deepEqual(emDashProblems("b.md", both), [
      "b.md:1: travessão na prosa: «A contagem 01 — 04 fica à direita — e o rótulo à esquerda.»",
    ]);
  });

  test("code is not prose: neither the backtick excerpt nor the fenced block", () => {
    const text = [
      "Rode `echo a — b` e ``printf '`—`'`` no terminal.",
      "",
      "```sh",
      "echo 'um — dois'",
      "```",
      "",
      "1. Dentro da lista:",
      "",
      "   ~~~",
      "   três — quatro",
      "   ~~~",
      "",
      "Fora do bloco — de novo prosa.",
    ].join("\n");

    assert.deepEqual(emDashProblems("c.md", text), [
      "c.md:13: travessão na prosa: «Fora do bloco — de novo prosa.»",
    ]);
  });

  test("an unpaired backtick does not open code: the em dash after it is prose", () => {
    const text = ["Uma crase solta ` e um travessão — na prosa.", "", "Outro `parágrafo`."].join(
      "\n",
    );

    assert.deepEqual(emDashProblems("d.md", text), [
      "d.md:1: travessão na prosa: «Uma crase solta ` e um travessão — na prosa.»",
    ]);
  });
});

describe("the cited docs/ paths", () => {
  const present = new Set(["docs/brief.md", "docs/adr/", "docs/design/README.md"]);
  const exists = (cited) => present.has(cited);

  test("flags the file, the line and the path that does not exist", () => {
    const text = [
      "O brief está em `docs/brief.md`; as decisões, em `docs/adr/`.",
      "",
      "Veja [o guia](docs/guia.md) e `docs/design/velho/`.",
    ].join("\n");

    assert.deepEqual(missingDocPaths("README.md", text, exists), [
      "README.md:3: cita docs/guia.md, que não existe",
      "README.md:3: cita docs/design/velho/, que não existe",
    ]);
  });

  test("the punctuation after the path, the anchor and the cited line are not part of it", () => {
    const text = [
      "Leia docs/brief.md. Depois, docs/adr/: as decisões.",
      "A seção em docs/design/README.md#linhagem e a linha docs/brief.md:12.",
    ].join("\n");

    assert.deepEqual(missingDocPaths("a.md", text, exists), []);
  });

  test("a web address, a path in a commit and a path from another root are not citations", () => {
    const text = [
      "A [documentação do Next](https://nextjs.org/docs/app/guides/static-exports).",
      "`git show 1551e5b:docs/design/prototype/mvp-2026-11-13/index.html`",
      "Num repositório com contextos, `src/<context>/docs/adr/`.",
    ].join("\n");

    assert.deepEqual(missingDocPaths("b.md", text, exists), []);
  });

  test("the Linhagem section of docs/design/README.md is left out, and only it", () => {
    const text = [
      "# Design",
      "",
      "## Linhagem",
      "",
      "- Antes, a pasta guardava `docs/design/prototype/home-v2.3/`.",
      "",
      "### Detalhe da linhagem",
      "",
      "- E `docs/design/prompts/`.",
      "",
      "## Nomes",
      "",
      "- Agora `docs/design/sumiu.md`.",
    ].join("\n");

    assert.deepEqual(missingDocPaths("docs/design/README.md", text, exists), [
      "docs/design/README.md:13: cita docs/design/sumiu.md, que não existe",
    ]);
    assert.deepEqual(missingDocPaths("docs/outro.md", text, exists), [
      "docs/outro.md:5: cita docs/design/prototype/home-v2.3/, que não existe",
      "docs/outro.md:9: cita docs/design/prompts/, que não existe",
      "docs/outro.md:13: cita docs/design/sumiu.md, que não existe",
    ]);
  });
});
