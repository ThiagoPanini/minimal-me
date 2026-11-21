// `node scripts/check-action-pins.mjs`: confere, sem rede e sem o `gh`, que toda action dos
// workflows está fixada na forma do `gh actions-lock`: o `uses:` cita a etiqueta semver completa
// (`owner/repo@v1.2.3`), e o `.github/workflows/actions.lock` cobre todos os workflows e todas as
// actions deles, com o commit de cada uma, como o `gh actions-lock --verify-local`. O lockfile
// atende à política de fixação por SHA do GitHub, que confere a procedência de cada entrada no
// início de cada job.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const root = path.resolve(import.meta.dirname, "..");
const workflowsDir = path.join(root, ".github/workflows");
const lockPath = path.join(workflowsDir, "actions.lock");
const fullSemver = /@v?\d+\.\d+\.\d+$/;
const lockedCommit = /^sha1-[0-9a-f]{40}$/;

const refProblems = [];
const lockProblems = [];

/** As actions de outros repositórios num workflow, como escritas no `uses:` dos passos. */
function actionsUsedBy(file) {
  const workflow = parse(readFileSync(path.join(workflowsDir, file), "utf8")) ?? {};
  const uses = new Set();
  for (const job of Object.values(workflow.jobs ?? {})) {
    for (const step of job?.steps ?? []) {
      const ref = step?.uses;
      // Action do próprio repositório (`./` ou `$/`) e imagem (`docker://`) ficam fora do lockfile.
      if (typeof ref === "string" && !/^(\.\/|\$\/|docker:\/\/)/.test(ref)) uses.add(ref);
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
    if (!fullSemver.test(ref)) refProblems.push(`${key} usa ${ref}.`);
  }
  if (!lock) continue;
  const locked = lockedWorkflows[key];
  if (!Array.isArray(locked)) {
    lockProblems.push(`${key} não está no actions.lock.`);
    continue;
  }
  for (const ref of used) {
    if (!locked.includes(ref)) {
      lockProblems.push(`${key} usa ${ref}, que não está no actions.lock.`);
    }
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
  if (!lockedCommit.test(dependencies[ref]?.commit ?? "")) {
    lockProblems.push(`${ref} não tem entrada com o commit no actions.lock.`);
  }
}

const report = [];
if (refProblems.length > 0) {
  report.push(
    "Actions sem a etiqueta semver completa:",
    ...refProblems.map((problem) => `- ${problem}`),
    "Cite a etiqueta da versão (`owner/repo@v1.2.3`); o commit fica no actions.lock.",
  );
}
if (refProblems.length > 0 || lockProblems.length > 0) {
  if (lockProblems.length > 0) {
    report.push(
      "O actions.lock não cobre os workflows:",
      ...lockProblems.map((problem) => `- ${problem}`),
    );
  }
  report.push("Rode `gh actions-lock` na raiz e inclua o actions.lock no commit.");
  console.error(report.join("\n"));
  process.exit(1);
}
console.log(
  `Actions fixadas: ${listed.size} no actions.lock, para ${workflowFiles.length} workflows.`,
);
