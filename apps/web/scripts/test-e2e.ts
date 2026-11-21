// `pnpm test:e2e`: constrói a imagem da Home, sobe-a no Docker Compose com o contêiner
// do Playwright e roda os testes contra ela. Argumentos extras vão para o `playwright test`.
// Com WEB_IMAGE definida, testa essa imagem pronta em vez de construir uma: é o que a CI faz
// com a imagem do PR e, na `main`, com o digest publicado no GHCR.
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

const webDir = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(webDir, "../..");
const webImage = process.env.WEB_IMAGE;
const composeFiles = [
  path.join(webDir, "compose.e2e.yaml"),
  ...(webImage ? [path.join(webDir, "compose.e2e.image.yaml")] : []),
];

const docker = spawnSync("docker", ["info", "--format", "{{.ServerVersion}}"], {
  stdio: "ignore",
  timeout: 15_000,
});
if (docker.status !== 0) {
  console.error("O Docker não está respondendo. Ligue o Docker e rode `pnpm test:e2e` de novo.");
  process.exit(1);
}

const playwrightPackage = path.join(webDir, "node_modules/@playwright/test/package.json");
const playwrightVersion: string = JSON.parse(readFileSync(playwrightPackage, "utf8")).version;
const commit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: repoRoot,
  encoding: "utf8",
}).trim();

// Um projeto do Compose por worktree: o nome sai do caminho do repositório.
const projectName = `minimal-me-e2e-${createHash("sha256").update(repoRoot).digest("hex").slice(0, 12)}`;

const env = {
  ...process.env,
  COMMIT: commit,
  PLAYWRIGHT_VERSION: playwrightVersion,
  REPO_ROOT: repoRoot,
  HOST_UID: String(process.getuid?.() ?? 1000),
  HOST_GID: String(process.getgid?.() ?? 1000),
};

function compose(...args: string[]): number {
  const result = spawnSync(
    "docker",
    [
      "compose",
      "--project-name",
      projectName,
      ...composeFiles.flatMap((file) => ["--file", file]),
      ...args,
    ],
    { stdio: "inherit", env },
  );
  return result.status ?? 1;
}

// Ctrl+C chega também ao Docker Compose; este processo segue até derrubar tudo.
process.on("SIGINT", () => {});
process.on("SIGTERM", () => {});

let status = 1;
try {
  status = webImage ? 0 : compose("build", "web");
  if (status === 0) {
    status = compose("run", "--rm", "--quiet-pull", "playwright", ...process.argv.slice(2));
  }
} finally {
  compose("down", "--volumes", "--remove-orphans", "--rmi", "local");
}
process.exit(status);
