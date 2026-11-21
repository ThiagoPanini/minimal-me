// Modo de conferência: lê o estado de cada passo do Autor e lista só o que falta, sem mudar
// nada. Recebe as portas de leitura prontas, para ser testado com respostas falsas das APIs.
import { steps as allSteps, doubleCheck } from "./steps.mjs";

/**
 * @param {import("./steps.mjs").CheckContext} context
 * @param {import("./steps.mjs").Step[]} [steps]
 * @returns {Promise<{ pendingCount: number, text: string }>}
 */
export async function runCheck(context, steps = allSteps) {
  const pending = [];
  for (const [index, step] of steps.entries()) {
    const result = await step.check(context);
    if (result.status !== "done") pending.push({ number: index + 1, step, result });
  }
  return { pendingCount: pending.length, text: formatReport(pending, steps.length) };
}

function formatReport(pending, total) {
  const lines = ["Preparação única do Autor: conferência, sem mudar nada.", ""];
  if (pending.length === 0) {
    lines.push(`Nada falta: os ${total} passos do Autor estão feitos.`);
    return lines.join("\n");
  }
  const verb = pending.length === 1 ? "Falta" : "Faltam";
  lines.push(`${verb} ${pending.length} de ${total} passos:`, "");
  for (const { number, step, result } of pending) {
    lines.push(`${number}. ${step.title}`);
    if (result.status === "waiting") {
      lines.push(`   Espera: ${result.reason}.`);
    } else {
      for (const item of result.items) lines.push(`   Falta: ${item}.`);
      lines.push(`   Onde: ${step.where}`);
    }
  }
  lines.push("", "Para fazer o que falta: pnpm author-setup");
  return lines.join("\n");
}

/** O resultado do duplo cheque: o que fica com o Autor, por quê, e o que o agente faz. */
export function formatPlan(steps = allSteps) {
  const lines = [
    "Preparação única do Autor: o duplo cheque.",
    "",
    `Conferido em ${doubleCheck.checkedOn}, só por leitura, ${doubleCheck.sources}: ${doubleCheck.outcome}.`,
    "",
  ];
  for (const [index, step] of steps.entries()) {
    lines.push(
      `${index + 1}. ${step.title}`,
      `   Fica com o Autor: ${step.reason}.`,
      `   O agente: ${step.agent}.`,
    );
  }
  return lines.join("\n");
}
