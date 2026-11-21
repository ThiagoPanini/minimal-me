// `node scripts/check-action-pins.mjs`: confere, sem rede, que toda action dos workflows está
// fixada duas vezes: pelo SHA completo no próprio `uses:` e no `.github/workflows/actions.lock`,
// que precisa cobrir todos os workflows e todas as actions deles, como o
// `gh actions-lock --verify-local`. O zizmor não cobra o SHA quando há lockfile, e a política
// "Require lockfile" do GitHub recusa um workflow fora dele; a procedência de cada entrada o
// GitHub confere no início de cada job.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const root = path.resolve(import.meta.dirname, "..");
const workflowsDir = path.join(root, ".github/workflows");
const lockPath = path.join(workflowsDir, "actions.lock");
const relock = "Rode `gh actions-lock` na raiz e inclua o actions.lock no commit.";
const fullSha = /@[0-9a-f]{40}$/;

const shaProblems = [];
const lockProblems = [];

/** As actions de um workflow, como escritas no `uses:` dos passos. */
function actionsUsedBy(file) {
  const workflow = parse(readFileSync(path.join(workflowsDir, file), "utf8")) ?? {};
  const uses = new Set();
  for (const job of Object.values(workflow.jobs ?? {})) {
    for (const step of job?.steps ?? []) {
      const ref = step?.uses;
      // Action local (`./`) e imagem (`docker://`) não entram no lockfile.
      if (typeof ref === "string" && !ref.startsWith("./") && !ref.startsWith("docker://")) {
        uses.add(ref);
      }
    }
  }
  return uses;
}

const workflowFiles = readdirSync(workflowsDir).filter((file) => /\.ya?ml$/.test(file));
const lock = existsSync(lockPath) ? (parse(readFileSync(lockPath, "utf8")) ?? {}) : undefined;
if (!lock) lockProblems.push("Falta o .github/workflows/actions.lock.");
const lockedWorkflows = lock?.workflows ?? {};
const dependencies = lock?.dependencies ?? {};

for (const file of workflowFiles) {
  const key = `.github/workflows/${file}`;
  const used = actionsUsedBy(file);
  for (const ref of used) {
    if (!fullSha.test(ref)) shaProblems.push(`${key} usa ${ref} sem o SHA completo.`);
  }
  if (!lock) continue;
  const locked = lockedWorkflows[key];
  if (!Array.isArray(locked)) {
    lockProblems.push(`${key} não está no actions.lock.`);
    continue;
  }
  for (const ref of used) {
    if (!locked.includes(ref))
      lockProblems.push(`${key} usa ${ref}, que não está no actions.lock.`);
  }
  for (const ref of locked) {
    if (!used.has(ref)) lockProblems.push(`${key} não usa mais ${ref}, que segue no actions.lock.`);
  }
}

for (const key of Object.keys(lockedWorkflows)) {
  if (!workflowFiles.some((file) => `.github/workflows/${file}` === key)) {
    lockProblems.push(`O actions.lock ainda lista ${key}, que não existe mais.`);
  }
}

// Toda action listada, direta ou chamada por outra action, precisa da própria entrada.
const listed = new Set(Object.values(lockedWorkflows).flat());
for (const dependency of Object.values(dependencies)) {
  for (const ref of dependency?.uses ?? []) listed.add(ref);
}
for (const ref of listed) {
  if (!dependencies[ref]?.commit)
    lockProblems.push(`${ref} não tem entrada com commit no actions.lock.`);
}

const report = [];
if (shaProblems.length > 0) {
  report.push(
    "Actions sem SHA:",
    ...shaProblems.map((problem) => `- ${problem}`),
    "Fixe cada uma pelo commit completo da versão, com a versão em comentário: `owner/repo@<sha> # v1.2.3`.",
  );
}
if (lockProblems.length > 0) {
  report.push(
    "O actions.lock não cobre os workflows:",
    ...lockProblems.map((problem) => `- ${problem}`),
    relock,
  );
}
if (report.length > 0) {
  console.error(report.join("\n"));
  process.exit(1);
}
console.log(
  `Actions fixadas: ${listed.size} no actions.lock, para ${workflowFiles.length} workflows.`,
);
