// `node scripts/tool.mjs <ferramenta> [argumentos]`: roda uma ferramenta do compose.tools.yaml
// (gitleaks, actionlint ou zizmor) sobre o repositório, na máquina, nos ganchos e na CI.
// O repositório entra no mesmo caminho da máquina, só para leitura, com o usuário dela.
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";

const [tool, ...args] = process.argv.slice(2);
if (!tool) {
  console.error("Uso: node scripts/tool.mjs <gitleaks|actionlint|zizmor> [argumentos]");
  process.exit(2);
}

const root = path.resolve(import.meta.dirname, "..");

// Num worktree, o `.git` é um arquivo que aponta para o diretório comum do repositório, fora
// do worktree. Montar os dois no mesmo caminho deixa o git do contêiner enxergar os commits.
const gitCommonDir = path.resolve(
  root,
  execFileSync("git", ["rev-parse", "--git-common-dir"], { cwd: root, encoding: "utf8" }).trim(),
);
const mounts = gitCommonDir.startsWith(root + path.sep) ? [root] : [root, gitCommonDir];

const docker = spawnSync("docker", ["info", "--format", "{{.ServerVersion}}"], {
  stdio: "ignore",
  timeout: 15_000,
});
if (docker.status !== 0) {
  console.error(`O Docker não está respondendo, e o ${tool} roda nele. Ligue o Docker e repita.`);
  process.exit(1);
}

const result = spawnSync(
  "docker",
  [
    "compose",
    "--progress",
    "quiet",
    "--file",
    path.join(root, "compose.tools.yaml"),
    "run",
    "--rm",
    "--quiet-pull",
    "--no-TTY",
    "--user",
    `${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`,
    ...mounts.flatMap((mount) => ["--volume", `${mount}:${mount}:ro`]),
    "--workdir",
    root,
    tool,
    ...args,
  ],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
