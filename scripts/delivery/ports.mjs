// As portas reais da entrega: o registro pelo `docker buildx imagetools`, o atestado pelo
// `gh attestation verify` e o Coolify pela API (rota POST /api/v1/deploy do Coolify 4.7.6). Os
// binários vêm do runner; nenhum recebe o token do Coolify no ambiente.
import { spawn } from "node:child_process";

/** @typedef {{ status: number, stdout: string, stderr: string }} RunResult */
/** @typedef {(command: string, args: string[]) => Promise<RunResult>} Run */

/** @type {Run} */
export function runCommand(command, args) {
  const { COOLIFY_TOKEN: _token, ...env } = process.env;
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (status) => resolve({ status: status ?? 1, stdout, stderr }));
  });
}

/**
 * As tags da imagem no registro. Mover uma tag não muda o digest: com uma fonte só e
 * `--prefer-index=false`, o `imagetools create` copia o manifesto como está, e o atestado e a
 * SBOM continuam presos a ele. Sem a opção, um manifesto simples ganharia um índice novo, com
 * outro digest.
 * @param {{ image: string, run?: Run }} options
 */
export function createRegistry({ image, run = runCommand }) {
  async function digestOf(tag) {
    const reference = `${image}:${tag}`;
    const result = await run("docker", [
      "buildx",
      "imagetools",
      "inspect",
      reference,
      "--format",
      "{{.Manifest.Digest}}",
    ]);
    if (result.status === 0) return result.stdout.trim();
    if (/\bnot found\b/i.test(result.stderr)) return undefined;
    throw new Error(`Não consegui ler ${reference}: ${errorLines(result)}`);
  }

  return {
    digestOf,
    async point(tag, digest) {
      const reference = `${image}:${tag}`;
      // A tag passa a apontar para o mesmo digest: sem `--prefer-index=false`, um manifesto
      // simples ganharia um índice novo, com outro digest.
      const result = await run("docker", [
        "buildx",
        "imagetools",
        "create",
        "--prefer-index=false",
        "--tag",
        reference,
        `${image}@${digest}`,
      ]);
      if (result.status !== 0) {
        throw new Error(`Não consegui apontar ${reference} para ${digest}: ${errorLines(result)}`);
      }
      const pointed = await digestOf(tag);
      if (pointed !== digest) {
        throw new Error(`${reference} aponta para ${pointed ?? "nada"}, não para ${digest}.`);
      }
    },
  };
}

/**
 * O atestado de proveniência que o job `publish` do `ci.yml` grava para cada digest da `main`.
 * @param {{ image: string, repository: string, run?: Run }} options
 */
export function createAttestation({ image, repository, run = runCommand }) {
  return {
    async verify(digest, commit) {
      const result = await run("gh", [
        "attestation",
        "verify",
        `oci://${image}@${digest}`,
        "--repo",
        repository,
        "--signer-workflow",
        `${repository}/.github/workflows/ci.yml`,
        "--source-ref",
        "refs/heads/main",
        "--source-digest",
        commit,
        "--deny-self-hosted-runners",
      ]);
      if (result.status !== 0) throw new Error((result.stderr || result.stdout).trim());
    },
  };
}

/**
 * A aplicação da Home no Coolify. O token precisa da permissão `deploy`.
 * @param {{ url: string, token?: string, applicationUuid?: string }} options
 */
export function createCoolify({ url, token, applicationUuid }) {
  return {
    assertConfigured() {
      const missing = [];
      if (!token) missing.push("o segredo COOLIFY_TOKEN");
      if (!applicationUuid) missing.push("a variável COOLIFY_APP_UUID");
      if (missing.length > 0) {
        throw new Error(`Falta no environment production: ${missing.join(" e ")}.`);
      }
    },

    /**
     * Pede uma entrega nova. `force` evita que o Coolify a descarte por já haver outra na fila
     * da mesma aplicação, que puxaria a imagem antes de a tag mudar.
     */
    async deploy() {
      const endpoint = new URL("/api/v1/deploy", url);
      endpoint.searchParams.set("uuid", applicationUuid ?? "");
      endpoint.searchParams.set("force", "true");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal: AbortSignal.timeout(30_000),
      });
      const text = await response.text();
      const body = parseJson(text);
      if (!response.ok) {
        const detail = body?.message ?? (text.trim() || "sem corpo");
        throw new Error(`O Coolify recusou o /deploy com ${response.status}: ${detail}`);
      }
      const entries = Array.isArray(body?.deployments) ? body.deployments : [];
      const queued = entries.find(
        (entry) => entry?.resource_uuid === applicationUuid && entry?.deployment_uuid,
      );
      if (!queued) {
        const detail = entries.map((entry) => entry?.message).filter(Boolean);
        throw new Error(
          `O Coolify não enfileirou a entrega: ${detail.join(" ") || text.trim() || "sem corpo"}`,
        );
      }
      return `O Coolify enfileirou a entrega ${queued.deployment_uuid}: ${queued.message}`;
    },
  };
}

/** Só as linhas de erro do buildx, sem o progresso da cópia. */
function errorLines({ stderr }) {
  const errors = stderr.split("\n").filter((line) => line.startsWith("ERROR"));
  return (errors.length > 0 ? errors.join("\n") : stderr).trim();
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
