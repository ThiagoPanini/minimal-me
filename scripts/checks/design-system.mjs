// Os checks dos arquivos do sistema de design (costura 2 da #57). Não há check de deriva entre
// os tokens e o CSS da Home: as variáveis saem do `tokens.json` no build.

export const tokensFile = "docs/design/system/tokens.json";

// Nome de token, de estilo de texto e de família: minúsculas, algarismos e hífen entre
// palavras, porque vira variável CSS (`--status-in-development`, `--font-sans`).
const lowercaseName = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

// Os grupos de tokens que viram variáveis CSS com o próprio nome, na ordem do arquivo.
const variableGroups = ["color", "spacing", "radius", "easing"];

/**
 * Cada nome do `tokens.json`, na ordem do arquivo, com onde ele está (`place`, quando o lugar
 * precisa do nome para ser achado) e o que ele vira: a variável CSS (`--ground`, `--font-sans`)
 * ou, no caso de um estilo de texto, só o nome do estilo.
 */
function namesOf(tokens) {
  const names = [];
  const tokenGroup = (group) => {
    for (const [index, token] of (tokens[group]?.tokens ?? []).entries()) {
      names.push({
        where: `${group}.tokens[${index}].name`,
        name: token?.name,
        variable: token?.name,
      });
    }
  };
  tokenGroup("color");
  for (const family of Object.keys(tokens.type?.families ?? {})) {
    names.push({
      where: "type.families",
      place: `type.families "${family}"`,
      name: family,
      variable: `font-${family}`,
    });
  }
  for (const [groupIndex, group] of (tokens.type?.groups ?? []).entries()) {
    for (const [index, style] of (group?.styles ?? []).entries()) {
      names.push({ where: `type.groups[${groupIndex}].styles[${index}].name`, name: style?.name });
    }
  }
  for (const group of variableGroups.slice(1)) tokenGroup(group);
  return names;
}

/** Os nomes que se repetem numa lista de `{ where, key }`: cada repetição com o primeiro lugar. */
function repeated(entries) {
  const first = new Map();
  const repeats = [];
  for (const { where, key } of entries) {
    if (typeof key !== "string") continue;
    if (first.has(key)) repeats.push({ key, first: first.get(key), again: where });
    else first.set(key, where);
  }
  return repeats;
}

const isText = (value) => typeof value === "string" && value.trim() !== "";
const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

/** O que falta na forma do arquivo, na ordem dele, e cada arquivo de fonte que não existe. */
function shapeProblems(tokens, fontExists) {
  const problems = [];
  const need = (ok, where, kind) => {
    if (!ok) problems.push(`${where} falta ou não é ${kind}`);
  };
  const list = (value, where) => {
    if (Array.isArray(value)) return value;
    problems.push(`falta ${where}, que é uma lista`);
    return [];
  };
  const tokenGroup = (group) =>
    list(tokens[group]?.tokens, `${group}.tokens`).forEach((token, index) => {
      for (const field of ["name", "value", "usage"]) {
        need(isText(token?.[field]), `${group}.tokens[${index}].${field}`, "texto");
      }
    });

  tokenGroup("color");
  list(tokens.type?.fonts, "type.fonts").forEach((font, index) => {
    for (const field of ["family", "file", "weight"]) {
      need(isText(font?.[field]), `type.fonts[${index}].${field}`, "texto");
    }
    if (isText(font?.file) && !fontExists(font.file)) {
      problems.push(`type.fonts[${index}].file "${font.file}" não existe em docs/design/system/`);
    }
  });
  const families = tokens.type?.families;
  if (families === null || typeof families !== "object" || Array.isArray(families)) {
    problems.push("falta type.families, que liga cada família à pilha de fontes");
  } else {
    for (const [family, stack] of Object.entries(families)) {
      need(isText(stack), `type.families "${family}"`, "texto");
    }
  }
  list(tokens.type?.groups, "type.groups").forEach((group, groupIndex) => {
    const where = `type.groups[${groupIndex}]`;
    need(isText(group?.name), `${where}.name`, "texto");
    if (!Object.hasOwn(families ?? {}, group?.family)) {
      problems.push(`${where}.family "${group?.family}" não está em type.families`);
    }
    list(group?.styles, `${where}.styles`).forEach((style, index) => {
      for (const field of ["name", "fontSize", "sample", "usage"]) {
        need(isText(style?.[field]), `${where}.styles[${index}].${field}`, "texto");
      }
      for (const field of ["lineHeight", "fontWeight"]) {
        need(isNumber(style?.[field]), `${where}.styles[${index}].${field}`, "número");
      }
      if (style && "letterSpacing" in style) {
        need(isText(style.letterSpacing), `${where}.styles[${index}].letterSpacing`, "texto");
      }
    });
  });
  for (const group of variableGroups.slice(1)) tokenGroup(group);
  return problems;
}

/** Cada nome fora das minúsculas e cada repetição: de variável CSS e de estilo de texto. */
function nameProblems(tokens) {
  const names = namesOf(tokens);
  const problems = names
    .filter(({ name }) => typeof name === "string" && !lowercaseName.test(name))
    .map(
      ({ where, name }) =>
        `${where} "${name}" não está em minúsculas (letras, algarismos e hífen entre palavras)`,
    );
  const variables = names
    .filter((entry) => "variable" in entry)
    .map(({ where, place, variable }) => ({ where: place ?? where, key: variable }));
  for (const { key, first, again } of repeated(variables)) {
    problems.push(`a variável --${key} sai de ${first} e de ${again}`);
  }
  const styles = names
    .filter((entry) => !("variable" in entry))
    .map(({ where, name }) => ({ where, key: name }));
  for (const { key, first, again } of repeated(styles)) {
    problems.push(`o estilo de texto "${key}" se repete em ${first} e em ${again}`);
  }
  return problems;
}

/**
 * Os problemas do `tokens.json`, cada um com o arquivo e o que está errado: o JSON que não abre,
 * a forma, os nomes fora das minúsculas e os repetidos. `fontExists` diz se um arquivo de fonte,
 * relativo a `docs/design/system/`, existe.
 */
export function tokensProblems(text, fontExists) {
  let tokens;
  try {
    tokens = JSON.parse(text);
  } catch (error) {
    return [`${tokensFile}: não é JSON válido (${error.message})`];
  }
  if (tokens === null || typeof tokens !== "object" || Array.isArray(tokens)) {
    return [`${tokensFile}: não é um objeto JSON`];
  }
  return [...shapeProblems(tokens, fontExists), ...nameProblems(tokens)].map(
    (problem) => `${tokensFile}: ${problem}`,
  );
}

/** O texto com cada trecho trocado por espaços do mesmo tamanho. */
const blank = (text) => text.replace(/[^\n]/g, " ");

/**
 * Os problemas de variável CSS de uma prévia de componente, cada um com o arquivo: toda
 * `var(--x)` é um token, um `font-<família>` de `type.families` ou uma propriedade declarada na
 * própria prévia (no `<style>` ou num atributo `style`), e nenhuma declaração local usa o nome de
 * um token ou de uma família. Comentários de HTML e de CSS não contam.
 */
export function previewVariableProblems(file, html, tokens) {
  const tokenNames = new Set(
    variableGroups.flatMap((group) => (tokens[group]?.tokens ?? []).map((token) => token.name)),
  );
  const familyOf = new Map(
    Object.keys(tokens.type?.families ?? {}).map((family) => [`font-${family}`, family]),
  );
  const code = html.replace(/<!--[\s\S]*?-->/g, blank).replace(/\/\*[\s\S]*?\*\//g, blank);

  const declared = new Set();
  const problems = [];
  for (const [, name] of code.matchAll(/(?<![\w-])--([\w-]+)\s*:/g)) {
    if (declared.has(name)) continue;
    declared.add(name);
    if (tokenNames.has(name)) {
      problems.push(`${file}: declara --${name}, que é nome de token: use o token, sem redeclarar`);
    } else if (familyOf.has(name)) {
      problems.push(
        `${file}: declara --${name}, que é a família "${familyOf.get(name)}" de type.families: use-a, sem redeclarar`,
      );
    }
  }
  const used = new Set();
  for (const [, name] of code.matchAll(/var\(\s*--([\w-]+)/g)) {
    if (used.has(name)) continue;
    used.add(name);
    if (!tokenNames.has(name) && !familyOf.has(name) && !declared.has(name)) {
      problems.push(
        `${file}: usa var(--${name}), que não é token, família de type.families nem propriedade declarada na prévia`,
      );
    }
  }
  return problems;
}
