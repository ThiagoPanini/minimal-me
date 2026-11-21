// Os arquivos do sistema de design (costura 2 da #57): o `tokens.json` e as variáveis CSS das
// prévias dos componentes.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { assertNone } from "./assert-none.mjs";
import { previewVariableProblems, tokensFile, tokensProblems } from "./design-system.mjs";
import { designSystemDir, previewFiles, root } from "./repository.mjs";

describe("o sistema de design do repositório", () => {
  const tokensText = readFileSync(path.join(root, tokensFile), "utf8");

  test("o tokens.json é válido, com nomes em minúsculas e sem repetição", () => {
    const fontExists = (file) => existsSync(path.join(designSystemDir, file));
    assertNone(tokensProblems(tokensText, fontExists), "Problemas no tokens.json:");
  });

  test("toda var(--x) das prévias é token, família ou propriedade da própria prévia", () => {
    const previews = previewFiles();
    assert.ok(previews.length > 0, "Nenhuma prévia em docs/design/system/components/.");
    let tokens;
    try {
      tokens = JSON.parse(tokensText);
    } catch {
      assert.fail("O tokens.json não abre: o teste dele diz por quê.");
    }
    assertNone(
      previews.flatMap(({ file, text }) => previewVariableProblems(file, text, tokens)),
      "Variáveis CSS das prévias fora do sistema (corrija em docs/design/system/ e republique o Design System):",
    );
  });
});

const validTokens = {
  name: "Minimal Me",
  version: 2,
  color: {
    themes: [{ id: "dark", name: "Escuro" }],
    tokens: [
      { name: "ground", value: "#161616", usage: "Fundo." },
      { name: "status-in-development", value: "#E8B96A", usage: "A única cor." },
    ],
  },
  type: {
    fonts: [{ family: "Jost", file: "fonts/Jost-300.woff2", weight: "300" }],
    families: { sans: '"Jost", sans-serif', mono: '"IBM Plex Mono", monospace' },
    groups: [
      {
        name: "Jost",
        family: "sans",
        styles: [
          {
            name: "label",
            fontSize: "12px",
            lineHeight: 1.4,
            fontWeight: 400,
            sample: "SPACES",
            usage: "Rótulo.",
          },
        ],
      },
    ],
  },
  spacing: { tokens: [{ name: "gap-min", value: "16px", usage: "Vão mínimo." }] },
  radius: { tokens: [{ name: "square", value: "0", usage: "Tudo reto." }] },
  easing: { tokens: [{ name: "ease", value: "cubic-bezier(.22,.61,.36,1)", usage: "Estado." }] },
};

const fontExists = (file) => file === "fonts/Jost-300.woff2";

/** O `tokens.json` válido com uma mudança, como texto. */
function tokensWith(change) {
  const tokens = structuredClone(validTokens);
  change(tokens);
  return JSON.stringify(tokens);
}

describe("o tokens.json", () => {
  test("válido, não tem problema", () => {
    assert.deepEqual(tokensProblems(JSON.stringify(validTokens), fontExists), []);
  });

  test("acusa o JSON que não abre", () => {
    const problems = tokensProblems('{ "color": { "tokens": [ }', fontExists);

    assert.equal(problems.length, 1);
    assert.match(problems[0], /^docs\/design\/system\/tokens\.json: não é JSON válido \(.+\)$/);
  });

  test("acusa o que falta na forma do arquivo e a fonte que não existe", () => {
    const text = tokensWith((tokens) => {
      delete tokens.color.tokens[1].value;
      tokens.type.fonts[0].file = "fonts/Sumiu.woff2";
      tokens.type.groups[0].family = "serif";
      tokens.type.groups[0].styles[0].lineHeight = "1.4";
      delete tokens.spacing;
    });

    assert.deepEqual(tokensProblems(text, fontExists), [
      "docs/design/system/tokens.json: color.tokens[1].value falta ou não é texto",
      'docs/design/system/tokens.json: type.fonts[0].file "fonts/Sumiu.woff2" não existe em docs/design/system/',
      'docs/design/system/tokens.json: type.groups[0].family "serif" não está em type.families',
      "docs/design/system/tokens.json: type.groups[0].styles[0].lineHeight falta ou não é número",
      "docs/design/system/tokens.json: falta spacing.tokens, que é uma lista",
    ]);
  });

  test("acusa cada nome fora das minúsculas, de token, de estilo de texto e de família", () => {
    const text = tokensWith((tokens) => {
      tokens.color.tokens[0].name = "Ground";
      tokens.easing.tokens[0].name = "easeOut";
      tokens.type.groups[0].styles[0].name = "Label";
      tokens.type.families = { Sans: '"Jost", sans-serif' };
      tokens.type.groups[0].family = "Sans";
    });

    assert.deepEqual(tokensProblems(text, fontExists), [
      'docs/design/system/tokens.json: color.tokens[0].name "Ground" não está em minúsculas (letras, algarismos e hífen entre palavras)',
      'docs/design/system/tokens.json: type.families "Sans" não está em minúsculas (letras, algarismos e hífen entre palavras)',
      'docs/design/system/tokens.json: type.groups[0].styles[0].name "Label" não está em minúsculas (letras, algarismos e hífen entre palavras)',
      'docs/design/system/tokens.json: easing.tokens[0].name "easeOut" não está em minúsculas (letras, algarismos e hífen entre palavras)',
    ]);
  });

  test("acusa a variável CSS que sai de dois nomes e o estilo de texto repetido", () => {
    const text = tokensWith((tokens) => {
      tokens.spacing.tokens.push({ name: "ground", value: "8px", usage: "Repete a cor." });
      tokens.radius.tokens.push({ name: "font-sans", value: "0", usage: "Repete a família." });
      tokens.type.groups.push({
        name: "IBM Plex Mono",
        family: "mono",
        styles: [{ ...tokens.type.groups[0].styles[0] }],
      });
    });

    assert.deepEqual(tokensProblems(text, fontExists), [
      "docs/design/system/tokens.json: a variável --ground sai de color.tokens[0].name e de spacing.tokens[1].name",
      'docs/design/system/tokens.json: a variável --font-sans sai de type.families "sans" e de radius.tokens[1].name',
      'docs/design/system/tokens.json: o estilo de texto "label" se repete em type.groups[0].styles[0].name e em type.groups[1].styles[0].name',
    ]);
  });
});

describe("as variáveis CSS das prévias", () => {
  const file = "docs/design/system/components/Exemplo/preview.html";

  test("token, família de type.families e propriedade declarada na prévia passam", () => {
    const html = `<!-- @dsCard height=100 -->
<style>
  body{background:var(--ground,#161616);font:300 12px/1.6 var(--font-mono,monospace)}
  .row{--g:24px;gap:var(--g);transition:flex-grow .9s var(--ease)}
  .slit.is-focus{--open:1.9}
  .slit{flex:var(--open,1) 1 0;padding:var( --gap-min )}
  .par img{object-position:calc(var(--x,.5) * 100%) 0}
</style>
<div class="row"><div class="slit" style="--x:.5;--y:1;color:var(--status-in-development)"></div></div>`;

    assert.deepEqual(previewVariableProblems(file, html, validTokens), []);
  });

  test("acusa a variável que não é token, família nem propriedade da prévia, uma vez cada", () => {
    const html = `<style>
  body{background:var(--chao,#161616);color:var(--light)}
  .a{border-color:var(--chao)}
  .b{font-family:var(--font-serif,serif)}
</style>
<p style="margin:var(--pad)">x</p>`;

    assert.deepEqual(previewVariableProblems(file, html, validTokens), [
      `${file}: usa var(--chao), que não é token, família de type.families nem propriedade declarada na prévia`,
      `${file}: usa var(--light), que não é token, família de type.families nem propriedade declarada na prévia`,
      `${file}: usa var(--font-serif), que não é token, família de type.families nem propriedade declarada na prévia`,
      `${file}: usa var(--pad), que não é token, família de type.families nem propriedade declarada na prévia`,
    ]);
  });

  test("acusa a declaração local com nome de token ou de família", () => {
    const html = `<style>
  .in{--ground:#000;--font-sans:"Jost";--g:24px}
</style>
<div class="in" style="--gap-min:8px"></div>`;

    assert.deepEqual(previewVariableProblems(file, html, validTokens), [
      `${file}: declara --ground, que é nome de token: use o token, sem redeclarar`,
      `${file}: declara --font-sans, que é a família "sans" de type.families: use-a, sem redeclarar`,
      `${file}: declara --gap-min, que é nome de token: use o token, sem redeclarar`,
    ]);
  });

  test("comentário não conta, de HTML nem de CSS", () => {
    const html = `<!-- antes era var(--chao); --ground:#000 -->
<style>
  /* var(--nevoa) saiu; --mist:#fff */
  body{color:var(--ground)}
</style>`;

    assert.deepEqual(previewVariableProblems(file, html, validTokens), []);
  });
});
