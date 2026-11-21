// O terminal do roteiro: uma tela por passo, instruções numeradas e as perguntas ao Autor.
// O que é segredo se digita sem eco e nunca volta para a tela.
import { createInterface } from "node:readline";
import { createInterface as createPromiseInterface } from "node:readline/promises";

const colors = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (text) => (colors ? `\u001b[${code}m${text}\u001b[0m` : text);
const bold = paint("1");
const dim = paint("2");
const blue = paint("34");
const green = paint("32");
const yellow = paint("33");

async function question(prompt) {
  const reader = createPromiseInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await reader.question(`  ${bold(prompt)} `)).trim();
  } finally {
    reader.close();
  }
}

/** Lê sem eco, tecla a tecla; Ctrl-C encerra o roteiro. */
function questionHidden(prompt) {
  process.stdout.write(`  ${bold(prompt)} `);
  const input = process.stdin;
  if (!input.isTTY) return question("");
  return new Promise((resolve) => {
    let value = "";
    const finish = () => {
      input.setRawMode(false);
      input.pause();
      input.off("data", onData);
      process.stdout.write("\n");
    };
    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === "\r" || character === "\n") {
          finish();
          resolve(value.trim());
          return;
        }
        if (character === "\u0003") {
          finish();
          process.exit(130);
        }
        if (character === "\u007f" || character === "\b") value = value.slice(0, -1);
        else value += character;
      }
    };
    input.setRawMode(true);
    input.setEncoding("utf8");
    input.on("data", onData);
    input.resume();
  });
}

/**
 * Lê as linhas coladas até a que traz o END de um bloco PEM. O END vale em qualquer ponto da
 * linha: o terminal pode pôr a marca de fim de colagem depois dele ou juntar o bloco numa
 * linha só. Quem confere o bloco tira o que o terminal acrescentou.
 * @param {NodeJS.ReadableStream} input
 */
export function readBlock(input) {
  const reader = createInterface({ input, terminal: false });
  const lines = [];
  return new Promise((resolve) => {
    reader.on("line", (line) => {
      lines.push(line.trim());
      if (/-----END [A-Z0-9 ]+-----/.test(line)) reader.close();
    });
    reader.on("close", () => resolve(`${lines.filter(Boolean).join("\n")}\n`));
  });
}

function questionBlock(prompt) {
  process.stdout.write(`  ${bold(prompt)}\n`);
  return readBlock(process.stdin);
}

/** @returns {import("./guides.mjs").Terminal & { clear: () => void, heading: (text: string) => void }} */
export function createTerminal() {
  const write = (text) => process.stdout.write(`${text}\n`);
  return {
    clear() {
      if (process.stdout.isTTY) process.stdout.write("\u001b[2J\u001b[3J\u001b[H");
    },
    heading: (text) => write(`\n${bold(blue(text))}\n`),
    say: (text) => write(`  ${text}`),
    step: (text) => write(`  ${blue("•")} ${text}`),
    note: (text) => write(`  ${dim(text)}`),
    ok: (text) => write(`  ${green("✓")} ${text}`),
    warn: (text) => write(`  ${yellow("!")} ${text}`),
    command: (text) => write(`\n${text}\n`),
    ask: question,
    askHidden: questionHidden,
    askBlock: questionBlock,
    async pause(prompt = "Enter para seguir.") {
      await question(dim(prompt));
    },
    async confirm(text) {
      return /^s/i.test(await question(`${yellow("?")} ${text} [s/N]`));
    },
  };
}
