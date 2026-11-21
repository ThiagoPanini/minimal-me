// `pnpm author-setup`: o roteiro da preparação única do Autor (spec #57, ticket #63).
//   pnpm author-setup           guia os passos que faltam, um por tela, e confere cada um
//   pnpm author-setup --check   só confere: lista o que falta e não muda nada
//   pnpm author-setup --plan    o duplo cheque: por que cada passo é do Autor e o que o agente faz
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  createGitHubReader,
  createStateSaver,
  loadState,
  openUrl,
  setSecret,
  stateFile,
} from "./adapters.mjs";
import { formatPlan, runCheck } from "./check.mjs";
import { guides } from "./guides.mjs";
import { createMcpReader } from "./mcp.mjs";
import { createFromManifest, verifyInstallation } from "./merge-app.mjs";
import { steps } from "./steps.mjs";
import { createTerminal } from "./terminal.mjs";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");

const usage = `Uso: pnpm author-setup [--check | --plan]

  (sem opção)  guia os passos que faltam, um por tela, e confere cada um
  --check      só confere: lista o que falta e não muda nada
  --plan       o duplo cheque: por que cada passo é do Autor e o que o agente faz

O estado das confirmações fica em ${stateFile()}, fora do repositório e sem segredo.`;

/** A conferência recebe só portas de leitura e um estado congelado. */
async function createCheckContext() {
  return {
    github: createGitHubReader(),
    state: Object.freeze(await loadState()),
    mcp: createMcpReader(repositoryRoot),
    now: new Date(),
  };
}

async function createGuideContext(io) {
  const state = await loadState();
  const open = (url) => openUrl(url, io);
  return {
    github: createGitHubReader(),
    state,
    mcp: createMcpReader(repositoryRoot),
    now: new Date(),
    io,
    openUrl: open,
    setSecret,
    saveState: createStateSaver(state),
    readFile: (file) => readFile(file, "utf8"),
    mergeApp: { create: () => createFromManifest({ openUrl: open }), verifyInstallation },
  };
}

async function guideStep(context, step, number) {
  const { io } = context;
  let result = await step.check(context);
  if (result.status === "done") return;
  io.clear();
  io.heading(`Passo ${number} de ${steps.length} · ${step.title}`);
  io.note(`Por que é seu: ${step.reason}.`);
  io.note(`O agente: ${step.agent}.`);
  io.say("");
  if (result.status === "waiting") {
    io.warn(`Este passo espera ${result.reason}. Rode o roteiro de novo depois.`);
    await io.pause();
    return;
  }
  for (const item of result.items) io.say(`Falta: ${item}.`);
  io.say("");
  for (;;) {
    await guides[step.id](context);
    result = await step.check(context);
    if (result.status === "done") {
      io.ok(`Feito: ${result.summary}.`);
      await io.pause();
      return;
    }
    if (result.status === "waiting") return;
    for (const item of result.items) io.warn(`Ainda falta: ${item}.`);
    if (!(await io.confirm("Tentar de novo este passo?"))) return;
  }
}

async function runGuided() {
  const io = createTerminal();
  const context = await createGuideContext(io);
  const before = await runCheck(context);
  io.clear();
  io.heading("Preparação única do Autor");
  io.say("O roteiro abre cada página, diz o que fazer e confere o resultado.");
  io.say("Pare quando quiser com Ctrl-C: rodar de novo mostra só o que falta.");
  io.say("");
  if (before.pendingCount === 0) {
    io.ok(`Nada falta: os ${steps.length} passos estão feitos.`);
    return 0;
  }
  io.say(
    `${before.pendingCount === 1 ? "Falta" : "Faltam"} ${before.pendingCount} de ${steps.length} passos.`,
  );
  await io.pause("Enter para começar.");
  for (const [index, step] of steps.entries()) await guideStep(context, step, index + 1);
  const after = await runCheck(context);
  io.clear();
  process.stdout.write(`${after.text}\n`);
  return after.pendingCount === 0 ? 0 : 1;
}

async function main(args) {
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`${usage}\n`);
    return 0;
  }
  if (args.includes("--plan")) {
    process.stdout.write(`${formatPlan()}\n`);
    return 0;
  }
  if (args.includes("--check")) {
    const result = await runCheck(await createCheckContext());
    process.stdout.write(`${result.text}\n`);
    return result.pendingCount === 0 ? 0 : 1;
  }
  return runGuided();
}

try {
  process.exitCode = await main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`Erro: ${error.message}\n`);
  process.exitCode = 2;
}
