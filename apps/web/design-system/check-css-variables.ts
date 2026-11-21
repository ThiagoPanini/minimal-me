// Passo final do build: toda `var(--x)` sem alternativa no CSS e no HTML exportados
// precisa de uma declaração `--x:` em algum lugar do export. Um token que a Home usa
// e que sumiu do `tokens.json` deixa uma referência solta, e o build quebra aqui.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const exportDir = path.resolve(import.meta.dirname, "../out");

const files = readdirSync(exportDir, { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".css") || file.endsWith(".html"))
  .map((file) => ({ file, text: readFileSync(path.join(exportDir, file), "utf8") }));

const declared = new Set<string>();
const referenced = new Map<string, string>();

for (const { file, text } of files) {
  for (const [, name, value] of text.matchAll(/(--[\w-]+)\s*:([^;}]*)/g)) {
    // `--x: var(--x)` não declara nada: é o tema do Tailwind apontando para fora.
    if (value.trim() !== `var(${name})`) declared.add(name);
  }
  for (const [, name] of text.matchAll(/@property\s+(--[\w-]+)/g)) declared.add(name);
  for (const [, name] of text.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)) {
    if (!referenced.has(name)) referenced.set(name, file);
  }
}

const missing = [...referenced].filter(([name]) => !declared.has(name));
if (files.length === 0 || missing.length > 0) {
  console.error(
    files.length === 0
      ? `Nenhum CSS ou HTML em ${exportDir}: o export não rodou.`
      : "Variáveis CSS usadas pela Home sem declaração (falta um token no tokens.json?):",
  );
  for (const [name, file] of missing) console.error(`  ${name} (em ${file})`);
  process.exit(1);
}
console.log(`Variáveis CSS conferidas: ${referenced.size} referências, todas declaradas.`);
