// `node scripts/check-actions-lock.mjs`: confere, sem rede, que o `.github/workflows/actions.lock`
// cobre todos os workflows e todas as actions que eles usam, como o `gh actions-lock
// --verify-local`. Com a política "Require lockfile", o GitHub recusa um workflow fora dele.
// A procedência de cada entrada é do GitHub, que a confere no início de cada job.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const root = path.resolve(import.meta.dirname, "..");
const workflowsDir = path.join(root, ".github/workflows");
const lockPath = path.join(workflowsDir, "actions.lock");
const fix = "Rode `gh actions-lock` na raiz do repositório e inclua o actions.lock no commit.";

const problems = [];

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

if (!existsSync(lockPath)) {
  console.error(`Falta o .github/workflows/actions.lock. ${fix}`);
  process.exit(1);
}

const lock = parse(readFileSync(lockPath, "utf8")) ?? {};
const lockedWorkflows = lock.workflows ?? {};
const dependencies = lock.dependencies ?? {};

for (const file of workflowFiles) {
  const key = `.github/workflows/${file}`;
  const locked = lockedWorkflows[key];
  if (!Array.isArray(locked)) {
    problems.push(`${key} não está no actions.lock.`);
    continue;
  }
  const used = actionsUsedBy(file);
  for (const ref of used) {
    if (!locked.includes(ref)) problems.push(`${key} usa ${ref}, que não está no actions.lock.`);
  }
  for (const ref of locked) {
    if (!used.has(ref)) problems.push(`${key} não usa mais ${ref}, que segue no actions.lock.`);
  }
}

for (const key of Object.keys(lockedWorkflows)) {
  if (!workflowFiles.some((file) => `.github/workflows/${file}` === key)) {
    problems.push(`O actions.lock ainda lista ${key}, que não existe mais.`);
  }
}

// Toda action listada, direta ou chamada por outra action, precisa da própria entrada.
const listed = new Set(Object.values(lockedWorkflows).flat());
for (const dependency of Object.values(dependencies)) {
  for (const ref of dependency?.uses ?? []) listed.add(ref);
}
for (const ref of listed) {
  if (!dependencies[ref]?.commit)
    problems.push(`${ref} não tem entrada com commit no actions.lock.`);
}

if (problems.length > 0) {
  console.error(
    ["O actions.lock não cobre os workflows:", ...problems.map((p) => `- ${p}`), fix].join("\n"),
  );
  process.exit(1);
}
console.log(`actions.lock: ${workflowFiles.length} workflows e ${listed.size} actions cobertos.`);
