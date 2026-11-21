// As portas reais do roteiro: a API do GitHub com o login do `gh`, a gravação de segredos
// pelo `gh secret set` (que cifra o valor antes de enviá-lo), o estado guardado na máquina,
// fora do repositório, e o navegador.
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { createGitHubApi } from "../github-api.mjs";
import { repository } from "./steps.mjs";

/** Só leitura: a única porta da API que o modo de conferência recebe. */
export function createGitHubReader() {
  let token;
  try {
    token = execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim();
  } catch {
    throw new Error("o `gh` não está logado: rode `gh auth login` e tente de novo");
  }
  const github = createGitHubApi({ token });
  return {
    /** @returns {Promise<import("./steps.mjs").ApiResponse>} */
    async get(apiPath) {
      const { status, body } = await github.request("GET", apiPath);
      return { status, body };
    },
  };
}

/**
 * Grava um segredo pelo `gh`, com o valor pela entrada padrão: ele não aparece na linha de
 * comando nem na saída.
 */
export async function setSecret({ name, value, app, environment }) {
  const args = ["secret", "set", name, "--repo", repository];
  if (app) args.push("--app", app);
  if (environment) args.push("--env", environment);
  const result = spawnSync("gh", args, {
    input: value,
    encoding: "utf8",
    stdio: ["pipe", "ignore", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(`gh secret set ${name} falhou: ${(result.stderr ?? "").trim()}`);
  }
}

/** O estado do roteiro: confirmações do Autor e dados públicos, nunca segredo. */
export function stateFile() {
  const base = process.env.XDG_STATE_HOME || path.join(homedir(), ".local", "state");
  return path.join(base, "minimal-me", "author-setup.json");
}

export async function loadState(file = stateFile()) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

/** Devolve a porta que grava no arquivo e atualiza o estado que os passos leem. */
export function createStateSaver(state, file = stateFile()) {
  return async (patch) => {
    Object.assign(state, patch);
    await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    await writeFile(file, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  };
}

/** Abre a página no navegador do Autor, também no WSL; sem navegador, ele abre à mão. */
export function openUrl(url, io) {
  io.say(`Abrindo ${url}`);
  const openers = [["wslview"], ["explorer.exe"], ["xdg-open"], ["open"]];
  for (const [command] of openers) {
    const found = spawnSync("sh", ["-c", `command -v ${command}`], { stdio: "ignore" });
    if (found.status === 0) {
      spawn(command, [url], { stdio: "ignore", detached: true }).unref();
      return;
    }
  }
  io.warn(`Não achei um navegador para abrir; abra à mão: ${url}`);
}
