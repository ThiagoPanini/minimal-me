// Os títulos de PR contra o commitlint da raiz, pelo mesmo binário que o `pr-title` e o gancho
// `commit-msg` chamam. Os do Dependabot seguem os formatos reais dele (grupo, uma atualização no
// grupo, major em PR próprio, digest, diretório) com as dependências deste repositório, nos três
// ecossistemas do `.github/dependabot.yml`.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { parse } from "yaml";

const root = path.resolve(import.meta.dirname, "..");
const commitlint = path.join(root, "node_modules/@commitlint/cli/cli.js");

/** Roda o commitlint com o título na entrada, como o `pr-title`. */
function lint(title) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [commitlint], { cwd: root });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    child.on("error", reject);
    child.on("close", (status) => resolve({ title, status, output }));
    child.stdin.end(`${title}\n`);
  });
}

async function failuresOf(titles) {
  const results = await Promise.all(titles.map(lint));
  return results
    .filter((result) => result.status !== 0)
    .map((result) => `${result.title}\n${result.output}`);
}

const robotTitles = {
  npm: [
    "build(deps): bump the npm group with 7 updates",
    "build(deps): bump @playwright/test from 1.65.1 to 1.66.0 in the npm group",
    "build(deps): bump typescript from 7.0.2 to 8.0.0",
    "build(deps): bump babel-plugin-react-compiler from 1.0.0 to 2.0.0",
    "build(deps): bump undici from 7.10.0 to 7.10.1",
  ],
  "github-actions": [
    "build(deps): bump the github-actions group with 3 updates",
    "build(deps): bump actions/dependency-review-action from 5.0.1 to 5.0.12 in the github-actions group",
    "build(deps): bump actions/checkout from 7.0.1 to 8.0.0",
  ],
  docker: [
    "build(deps): bump the docker group in /apps/web with 2 updates",
    "build(deps): bump node from 24.22.3-trixie-slim to 24.23.0-trixie-slim in /apps/web in the docker group",
    "build(deps): bump ghcr.io/nginx/nginx-unprivileged from 1.31.9-alpine-slim to 1.31.10-alpine-slim in /apps/web in the docker group",
    "build(deps): bump ghcr.io/nginx/nginx-unprivileged from 1.31.9-alpine-slim to 2.0.0-alpine-slim in /apps/web",
    "build(deps): bump the docker-compose group with 3 updates",
    "build(deps): bump ghcr.io/gitleaks/gitleaks from v8.30.1 to v8.31.0 in the docker-compose group",
    "build(deps): bump rhysd/actionlint from `b1934ee` to `3c1f2a9` in the docker-compose group",
  ],
};

describe("os títulos de PR no commitlint", () => {
  test("todo ecossistema do Dependabot usa o prefixo fixo build(deps)", () => {
    const config = parse(readFileSync(path.join(root, ".github/dependabot.yml"), "utf8"));
    const prefixes = Object.fromEntries(
      config.updates.map((update) => [update["package-ecosystem"], update["commit-message"]]),
    );

    assert.deepEqual(prefixes, {
      npm: { prefix: "build(deps)" },
      "github-actions": { prefix: "build(deps)" },
      docker: { prefix: "build(deps)" },
      "docker-compose": { prefix: "build(deps)" },
    });
  });

  for (const [ecosystem, titles] of Object.entries(robotTitles)) {
    test(`os títulos do Dependabot para ${ecosystem} passam, mesmo acima de 100 caracteres`, async () => {
      assert.deepEqual(await failuresOf(titles), []);
    });
  }

  test("os títulos de gente seguem o Conventional Commits, com até 100 caracteres", async () => {
    const accepted = [
      "feat(web): abertura da Home",
      "ci: merge automático e nova tentativa diária dos PRs de robô",
    ];
    const refused = [
      "Atualiza o Next",
      "feat(web): a fileira dos spaces ganha o foco por teclado, o aviso, a foto viva e o movimento de entrada",
      "build(deps): o Next sobe para a versão nova, com o React, o TypeScript e o Tailwind que vieram junto dele",
    ];

    assert.deepEqual(await failuresOf(accepted), []);
    const results = await Promise.all(refused.map(lint));
    assert.deepEqual(
      results.filter((result) => result.status === 0).map((result) => result.title),
      [],
    );
  });
});
