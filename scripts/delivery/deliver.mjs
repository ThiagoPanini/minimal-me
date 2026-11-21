// A entrega (seção "Entrega" da #57). Na `main`, depois do `gate`:
//   node scripts/delivery/deliver.mjs --commit <sha> --digest <sha256:...>
// No rollback manual, o digest vem da tag `sha-<commit>` que a `main` publicou:
//   node scripts/delivery/deliver.mjs --commit <sha>
// Os dois caminhos passam pelo mesmo `deliver`: confere o atestado do digest, aponta a tag
// `production` para ele, chama o /deploy do Coolify e roda o smoke contra a URL pública. Se o
// /deploy ou o smoke falham, devolve `production` ao digest anterior pelo mesmo passo, chama o
// /deploy de novo e termina com erro. Só Node e os binários do runner (`docker` e `gh`), sem
// dependências: o job que o roda não instala pacotes e é o único que vê o token do Coolify.
import { parseArgs } from "node:util";
import { createAttestation, createCoolify, createRegistry } from "./ports.mjs";
import { smoke } from "./smoke.mjs";

/** A tag que o Coolify puxa a cada /deploy. */
export const productionTag = "production";

/**
 * @typedef {object} Ports
 * @property {{ digestOf(tag: string): Promise<string | undefined>,
 *   point(tag: string, digest: string): Promise<void> }} registry
 * @property {{ verify(digest: string, commit: string): Promise<void> }} attestation
 * @property {{ assertConfigured(): void, deploy(): Promise<string> }} coolify
 * @property {(commit: string) => Promise<string[]>} smoke as falhas; vazio quando passa.
 * @property {(line: string) => void} log
 */

/**
 * Põe no ar o digest publicado para o commit. Resolve quando o smoke passa; rejeita com a
 * explicação do que falhou e do que o rollback fez.
 * @param {{ commit: string, digest?: string }} target
 * @param {Ports} ports
 */
export async function deliver({ commit, digest }, ports) {
  const { registry, attestation, coolify, log } = ports;
  const target = digest ?? (await registry.digestOf(`sha-${commit}`));
  if (!target) {
    throw new Error(
      `Não há imagem sha-${commit} no registro: só vai ao ar um commit que a main publicou.`,
    );
  }

  try {
    await attestation.verify(target, commit);
  } catch (error) {
    throw new Error(`O atestado de ${target} não confere com o commit ${commit}: ${error.message}`);
  }
  log(`O atestado de ${target} confere com o commit ${commit}.`);
  coolify.assertConfigured();

  const previous = await registry.digestOf(productionTag);
  log(`${productionTag}: ${previous ?? "sem digest"} → ${target}.`);

  /** O passo comum à entrega e aos dois rollbacks: aponta `production` e chama o /deploy. */
  async function release(to) {
    await registry.point(productionTag, to);
    log(await coolify.deploy());
  }

  try {
    await release(target);
    const failures = await ports.smoke(commit);
    if (failures.length > 0) {
      throw new Error(`O smoke falhou:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
    }
  } catch (error) {
    throw new Error(`${error.message}\n${await rollBack(previous, target, release, log)}`);
  }
  log(`${target} está no ar, com o commit ${commit}.`);
}

async function rollBack(previous, target, release, log) {
  if (!previous) return `Não havia digest em ${productionTag} antes desta entrega: nada a voltar.`;
  if (previous === target) {
    return `${productionTag} já apontava para ${target} antes desta entrega: nada a voltar.`;
  }
  log(`A entrega falhou: ${productionTag} volta a ${previous}.`);
  try {
    await release(previous);
    return `${productionTag} voltou ao digest anterior, ${previous}, e o Coolify recebeu o /deploy dele.`;
  } catch (error) {
    return `O rollback para ${previous} também falhou: ${error.message}`;
  }
}

const usage =
  "Uso: node scripts/delivery/deliver.mjs --commit <sha de 40 caracteres> [--digest sha256:<64 hex>] [--smoke-timeout <s>]";

/**
 * A linha de comando do job de entrega e do rollback manual. Do ambiente vêm a imagem, a URL
 * pública, o Coolify e o repositório, que o workflow define, e o token e o UUID da aplicação, que
 * moram no environment `production`.
 */
async function main() {
  let values;
  try {
    ({ values } = parseArgs({
      options: {
        commit: { type: "string" },
        digest: { type: "string" },
        "smoke-timeout": { type: "string", default: "600" },
      },
    }));
  } catch (error) {
    console.error(`${error.message}\n${usage}`);
    return 2;
  }
  const smokeTimeout = Number(values["smoke-timeout"]);
  if (
    !/^[0-9a-f]{40}$/.test(values.commit ?? "") ||
    (values.digest !== undefined && !/^sha256:[0-9a-f]{64}$/.test(values.digest)) ||
    !(smokeTimeout > 0)
  ) {
    console.error(usage);
    return 2;
  }
  const env = process.env;
  const missing = ["IMAGE", "PRODUCTION_URL", "COOLIFY_URL", "GITHUB_REPOSITORY"].filter(
    (name) => !env[name],
  );
  if (missing.length > 0) {
    console.error(`Faltam no ambiente ${missing.join(", ")}, que o workflow define.`);
    return 2;
  }

  /** @type {Ports} */
  const ports = {
    registry: createRegistry({ image: env.IMAGE }),
    attestation: createAttestation({ image: env.IMAGE, repository: env.GITHUB_REPOSITORY }),
    coolify: createCoolify({
      url: env.COOLIFY_URL,
      token: env.COOLIFY_TOKEN,
      applicationUuid: env.COOLIFY_APP_UUID,
    }),
    smoke: async (commit) => {
      const log = (line) => console.log(`smoke: ${line}`);
      console.log(`smoke: ${env.PRODUCTION_URL}, esperando o commit ${commit}.`);
      const { failures } = await smoke({
        url: env.PRODUCTION_URL,
        commit,
        timeoutSeconds: smokeTimeout,
        log,
      });
      return failures;
    },
    log: (line) => console.log(line),
  };

  try {
    await deliver({ commit: values.commit, digest: values.digest }, ports);
    return 0;
  } catch (error) {
    reportError(error.message);
    return 1;
  }
}

/** No GitHub Actions, a falha vira uma anotação da rodada, com as linhas preservadas. */
function reportError(message) {
  if (process.env.GITHUB_ACTIONS !== "true") {
    console.error(message);
    return;
  }
  const escaped = message.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
  console.error(`::error title=Entrega::${escaped}`);
}

if (import.meta.main) process.exitCode = await main();
