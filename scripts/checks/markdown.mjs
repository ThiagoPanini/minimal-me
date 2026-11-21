// Os checks dos Markdown do repositório (costura 2 da #57): o travessão na prosa e os caminhos
// `docs/...` citados.

const emDash = "—";
// O contador da interface, como "01 — 04": números de dois algarismos (guia do sistema de design).
const interfaceCounter = /\d{2} — \d{2}/g;

/** O texto com cada trecho trocado por espaços do mesmo tamanho: as posições não mudam. */
const blank = (text) => text.replace(/[^\n]/g, " ");

// A cerca de um bloco de código: três ou mais crases ou tis, com qualquer recuo (dentro de lista).
const fence = /^\s*(`{3,}|~{3,})/;

/**
 * O Markdown com o código trocado por espaços, linha a linha no mesmo lugar: os blocos cercados
 * (``` ou ~~~, até a cerca de fechamento do mesmo caractere e pelo menos do mesmo tamanho) e os
 * trechos entre crases (uma sequência de N crases até a próxima de N crases, no mesmo parágrafo).
 * Uma crase sem par fica como prosa.
 */
function proseOf(text) {
  let open;
  const lines = text.split("\n").map((line) => {
    const marker = fence.exec(line)?.[1];
    if (open) {
      if (marker && marker[0] === open[0] && marker.length >= open.length) open = undefined;
      return blank(line);
    }
    if (marker) {
      open = marker;
      return blank(line);
    }
    return line;
  });

  let prose = lines.join("\n");
  const run = /`+/g;
  for (let match = run.exec(prose); match; match = run.exec(prose)) {
    const ticks = match[0].length;
    const start = match.index;
    const paragraphEnd = prose.slice(start).search(/\n\s*\n/);
    const limit = paragraphEnd === -1 ? prose.length : start + paragraphEnd;
    const closing = new RegExp(`(?<!\`)\`{${ticks}}(?!\`)`, "g");
    closing.lastIndex = start + ticks;
    const close = closing.exec(prose);
    if (!close || close.index >= limit) continue;
    const end = close.index + ticks;
    prose = prose.slice(0, start) + blank(prose.slice(start, end)) + prose.slice(end);
    run.lastIndex = end;
  }
  return prose;
}

// As seções que contam a história do repositório: citam caminhos que só existem em commits antigos.
const historicalSections = [{ file: "docs/design/README.md", heading: "Linhagem" }];

// Um caminho `docs/...` citado: começa no início da linha, depois de espaço ou de um delimitador
// (crase, parêntese, colchete, aspas, `<`, `*`, `|`). Depois de `/` é parte de um endereço web ou
// de outra raiz; depois de `:`, é um caminho num commit (`1551e5b:docs/...`).
const docPath = /(?<=^|[\s`(["'<*|])docs\/[^\s`'"()<>[\]|*,;]*/g;

/** O caminho sem a âncora, a linha citada (`:12`) e a pontuação que fecha a frase. */
const cleanPath = (cited) => cited.replace(/[#:].*$/, "").replace(/[.!?]+$/, "");

/**
 * Cada linha de um Markdown com o nível do título que ela abre (0 se não abre), olhando só a
 * prosa: um `#` dentro de um bloco de código não é título.
 */
function headingLevels(text) {
  return proseOf(text)
    .split("\n")
    .map((line) => /^(#{1,6})\s/.exec(line)?.[1].length ?? 0);
}

/** Cada caminho `docs/...` citado num Markdown que não existe, com o arquivo e a linha. */
export function missingDocPaths(file, text, exists) {
  const skipped = historicalSections.filter((section) => section.file === file);
  const levels = headingLevels(text);
  const problems = [];
  let skipUntilLevel = 0;
  text.split("\n").forEach((line, index) => {
    const level = levels[index];
    if (level > 0 && skipUntilLevel > 0 && level <= skipUntilLevel) skipUntilLevel = 0;
    if (level > 0 && skipUntilLevel === 0) {
      const heading = line.replace(/^#+\s+/, "").replace(/\s+#*\s*$/, "");
      if (skipped.some((section) => section.heading === heading)) skipUntilLevel = level;
    }
    if (skipUntilLevel > 0) return;
    for (const [cited] of line.matchAll(docPath)) {
      const cleaned = cleanPath(cited);
      if (!exists(cleaned)) problems.push(`${file}:${index + 1}: cita ${cleaned}, que não existe`);
    }
  });
  return problems;
}

/** Até 40 caracteres de cada lado de uma posição da linha, para a mensagem. */
function excerpt(line, index) {
  const start = Math.max(0, index - 40);
  const end = Math.min(line.length, index + 41);
  return `${start > 0 ? "…" : ""}${line.slice(start, end).trim()}${end < line.length ? "…" : ""}`;
}

/** Cada travessão da prosa de um Markdown, com o arquivo, a linha e o trecho. */
export function emDashProblems(file, text) {
  const prose = proseOf(text).replace(interfaceCounter, blank).split("\n");
  const problems = [];
  text.split("\n").forEach((line, index) => {
    const at = prose[index].indexOf(emDash);
    if (at === -1) return;
    problems.push(`${file}:${index + 1}: travessão na prosa: «${excerpt(line, at)}»`);
  });
  return problems;
}
