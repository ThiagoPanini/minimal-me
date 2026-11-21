// A nova tentativa diária (seção "Dependências" da #57), que o workflow `retry` roda:
//   node scripts/retry/retry.mjs
// Olha os PRs abertos por robô e a ponta da `main` e roda de novo os jobs que falharam na rodada
// mais recente de cada workflow, até três novas tentativas por rodada. Cobre a falha passageira e
// o PR de segurança barrado pela maturidade de um dia do pnpm, que passa no dia seguinte. O que
// falha depois da terceira fica para a ronda do agente, no começo da sessão (AGENTS.md). Só Node,
// sem dependências: lê GITHUB_REPOSITORY e GITHUB_TOKEN do ambiente.
import { createGitHub } from "./github.mjs";

/** Quantas novas tentativas uma rodada recebe, além da primeira. */
export const retryLimit = 3;

/** Os desfechos de uma rodada terminada que valem nova tentativa. */
const failedConclusions = new Set(["failure", "timed_out", "cancelled"]);

/**
 * @typedef {{ id: number, workflowId: number, workflowName: string, event: string,
 *   headSha: string, runNumber: number, attempt: number, status: string,
 *   conclusion: string | null, url?: string }} Run
 * @typedef {object} GitHub
 * @property {() => Promise<Array<{ number: number, title: string,
 *   author: { login: string, isBot: boolean }, headSha: string }>>} openPullRequests
 * @property {(branch: string) => Promise<string>} headOf
 * @property {(sha: string, event: string) => Promise<Run[]>} runsAt as rodadas do evento no commit.
 * @property {(runId: number) => Promise<void>} rerunFailedJobs
 * @typedef {{ label: string, sha: string, event: string }} Target
 * @typedef {{ target: Target, run: Run }} Entry
 * @typedef {{ rerun: Entry[], exhausted: Entry[], refused: Array<Entry & { reason: string }> }} Report
 */

const failed = (run) => run.status === "completed" && failedConclusions.has(run.conclusion);

/** A rodada mais recente de cada workflow; as anteriores do mesmo commit já foram superadas. */
function latestPerWorkflow(runs) {
  const latest = new Map();
  for (const run of runs) {
    const known = latest.get(run.workflowId);
    if (!known || run.runNumber > known.runNumber) latest.set(run.workflowId, run);
  }
  return [...latest.values()];
}

/**
 * O que a rodada diária olha: cada PR aberto por robô, na ponta dele, e a ponta da `main`, só nas
 * rodadas do evento da validação de cada um. Uma `main` mais antiga fica de fora, porque a nova
 * tentativa da entrega dela poria no ar um commit velho; e o `rollback`, de `workflow_dispatch`,
 * também, porque só volta a Home quando alguém pede.
 * @param {GitHub} github
 * @returns {Promise<Target[]>}
 */
async function targetsOf(github) {
  const pullRequests = await github.openPullRequests();
  const targets = pullRequests
    .filter((pullRequest) => pullRequest.author.isBot)
    .map((pullRequest) => ({
      label: `PR #${pullRequest.number} (${pullRequest.title})`,
      sha: pullRequest.headSha,
      event: "pull_request",
    }));
  targets.push({ label: "main", sha: await github.headOf("main"), event: "push" });
  return targets;
}

/**
 * Roda de novo os jobs que falharam em cada rodada escolhida e diz o que fez. Uma nova tentativa
 * que a API recusa não impede as outras.
 * @param {{ github: GitHub }} ports
 * @returns {Promise<Report>}
 */
export async function retryFailedRuns({ github }) {
  /** @type {Report} */
  const report = { rerun: [], exhausted: [], refused: [] };
  for (const target of await targetsOf(github)) {
    for (const run of latestPerWorkflow(await github.runsAt(target.sha, target.event))) {
      if (!failed(run)) continue;
      if (run.attempt > retryLimit) {
        report.exhausted.push({ target, run });
        continue;
      }
      try {
        await github.rerunFailedJobs(run.id);
        report.rerun.push({ target, run });
      } catch (error) {
        report.refused.push({ target, run, reason: error.message });
      }
    }
  }
  return report;
}

const describe = ({ target, run }) =>
  `${target.label}: ${run.workflowName} terminou em ${run.conclusion} na tentativa ${run.attempt}${run.url ? ` (${run.url})` : ""}`;

/** Uma linha por rodada; no GitHub Actions, a que pede o agente vira anotação. */
function print(report, annotate) {
  for (const entry of report.rerun) {
    console.log(`${describe(entry)}: roda de novo os jobs que falharam.`);
  }
  for (const entry of report.exhausted) {
    const line = `${describe(entry)}: já teve as ${retryLimit} novas tentativas e fica para a ronda do agente.`;
    console.log(annotate ? `::warning title=Nova tentativa::${line}` : line);
  }
  for (const entry of report.refused) {
    const line = `${describe(entry)}: a nova tentativa foi recusada: ${entry.reason}`;
    console.error(annotate ? `::error title=Nova tentativa::${line}` : line);
  }
  if (report.rerun.length + report.exhausted.length + report.refused.length === 0) {
    console.log("Nenhuma rodada falhou nos PRs de robô nem na ponta da main.");
  }
}

async function main() {
  const {
    GITHUB_REPOSITORY: repository,
    GITHUB_TOKEN: token,
    GITHUB_API_URL: apiUrl,
  } = process.env;
  if (!repository || !token) {
    console.error("Faltam no ambiente GITHUB_REPOSITORY e GITHUB_TOKEN, que o workflow define.");
    return 2;
  }
  const report = await retryFailedRuns({ github: createGitHub({ repository, token, apiUrl }) });
  print(report, process.env.GITHUB_ACTIONS === "true");
  return report.refused.length > 0 ? 1 : 0;
}

if (import.meta.main) process.exitCode = await main();
