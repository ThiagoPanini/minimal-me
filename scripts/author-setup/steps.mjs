// Os passos da preparação única do Autor (spec #57, ticket #63). Cada passo diz por que fica
// com o Autor, o que o agente faz em volta dele, como se confere e como se faz.

export const owner = "ThiagoPanini";
export const repository = `${owner}/minimal-me`;
export const packageName = "minimal-me/web";
export const productionEnvironment = "production";
export const coolifyUrl = "https://vps.panlabs.tech";

// Semanal, num minuto qualquer da madrugada de domingo, longe da virada da hora em que outras
// instâncias puxam a imagem do Coolify.
export const coolifyUpdateFrequency = "17 4 * * 0";

export const secretNames = {
  coolifyToken: "COOLIFY_TOKEN",
  mergeAppClientId: "MERGE_APP_CLIENT_ID",
  mergeAppPrivateKey: "MERGE_APP_PRIVATE_KEY",
};

// Escrita em conteúdo e em PRs, como pede a spec, e em workflows: sem ela o App não mescla
// os PRs do Dependabot que mudam `.github/workflows/`, os do ecossistema GitHub Actions.
export const mergeAppPermissions = {
  contents: "write",
  pull_requests: "write",
  workflows: "write",
};

/**
 * @typedef {{ status: number, body: any }} ApiResponse
 * @typedef {{ get: (path: string) => Promise<ApiResponse> }} GitHubReader
 * @typedef {{ github: GitHubReader, state: Record<string, any>, now: Date }} CheckContext
 * @typedef {{ status: "done", summary: string }
 *   | { status: "missing", items: string[] }
 *   | { status: "waiting", reason: string }} StepResult
 * @typedef {object} Step
 * @property {string} id
 * @property {string} title
 * @property {string} where
 * @property {(context: CheckContext) => Promise<StepResult>} check
 */

/** @returns {StepResult} */
const done = (summary) => ({ status: "done", summary });
/** @returns {StepResult} */
const missing = (items) => ({ status: "missing", items });
/** @returns {StepResult} */
const waiting = (reason) => ({ status: "waiting", reason });

const code = (text) => `\`${text}\``;

/**
 * Falha com a rota e o status quando a API responde algo que o passo não sabe ler, para a
 * conferência nunca dar um passo por feito ou por pendente sem ter lido o estado.
 */
function expectStatus(response, path, accepted) {
  if (!accepted.includes(response.status)) {
    throw new Error(`GET ${path} respondeu ${response.status}`);
  }
  return response;
}

async function read(github, path, accepted = [200]) {
  return expectStatus(await github.get(path), path, accepted);
}

export const dependabotSecretsPath = `/repos/${repository}/dependabot/secrets?per_page=100`;

export const secretNamesOf = (body) => (body?.secrets ?? []).map((secret) => secret.name);

async function checkCoolifyToken({ github }) {
  const environmentPath = `/repos/${repository}/environments/${productionEnvironment}`;
  const environment = await read(github, environmentPath, [200, 404]);
  if (environment.status === 404) {
    return waiting(
      `o environment ${code(productionEnvironment)}, que o agente cria na operação da #74`,
    );
  }
  const secrets = await read(github, `${environmentPath}/secrets?per_page=100`);
  if (secretNamesOf(secrets.body).includes(secretNames.coolifyToken)) {
    return done(`${code(secretNames.coolifyToken)} no environment ${code(productionEnvironment)}`);
  }
  return missing([
    `o segredo ${code(secretNames.coolifyToken)} no environment ${code(productionEnvironment)}`,
  ]);
}

export const installationIsOnlyThisRepository = (installation) =>
  installation?.repositorySelection === "selected" &&
  installation.repositories?.length === 1 &&
  installation.repositories[0] === repository;

async function checkMergeApp({ github, state }) {
  const items = [];
  const slug = state.mergeApp?.slug;
  if (!slug) {
    items.push("criar o App pelo formulário já preenchido do roteiro");
  } else {
    const app = await read(github, `/apps/${slug}`, [200, 404]);
    if (app.status === 404) {
      items.push(`o App ${code(slug)}, que não existe mais no GitHub`);
    } else {
      for (const [permission, level] of Object.entries(mergeAppPermissions)) {
        if (app.body.permissions?.[permission] !== level) {
          items.push(`a permissão ${code(`${permission}: ${level}`)} no App`);
        }
      }
      if (!app.body.installations_count) {
        items.push("instalar o App só neste repositório");
      } else if (!installationIsOnlyThisRepository(state.mergeApp.installation)) {
        items.push("conferir que a instalação é só deste repositório");
      }
    }
  }
  const secrets = await read(github, dependabotSecretsPath);
  const names = secretNamesOf(secrets.body);
  const absent = [secretNames.mergeAppClientId, secretNames.mergeAppPrivateKey].filter(
    (name) => !names.includes(name),
  );
  if (absent.length > 0) {
    items.push(`os segredos do Dependabot ${absent.map(code).join(" e ")}`);
  }
  if (items.length > 0) return missing(items);
  return done(`${code(slug)} instalado só em ${code(repository)}, com os segredos do Dependabot`);
}

export const packagePath = `/user/packages/container/${encodeURIComponent(packageName)}`;

async function checkPackage({ github }) {
  const response = await read(github, packagePath, [200, 403, 404]);
  if (response.status === 404) {
    return waiting("a primeira publicação da imagem na `main`, que o agente confere na #74");
  }
  if (response.status === 403) {
    return missing([
      "a permissão de ler pacotes no `gh`, para conferir: rode `gh auth refresh -s read:packages`",
    ]);
  }
  if (response.body.visibility === "public") {
    return done(`${code(packageName)} público no GHCR`);
  }
  return missing([`tornar público o pacote ${code(packageName)}`]);
}

const confirmedOn = (iso) => `confirmado pelo Autor em ${iso.slice(0, 10)}`;

async function checkMalwareAlerts({ github, state }) {
  const items = [];
  const alerts = await read(github, `/repos/${repository}/vulnerability-alerts`, [204, 404]);
  if (alerts.status === 404) {
    items.push("ligar os alertas do Dependabot, que vêm antes dos de malware");
  }
  const confirmedAt = state.malwareAlerts?.confirmedAt;
  if (!confirmedAt) {
    items.push(
      "ligar os alertas de malware do Dependabot e confirmar no roteiro, porque nenhuma API os lê",
    );
  }
  if (items.length > 0) return missing(items);
  return done(`ligados, ${confirmedOn(confirmedAt)}`);
}

async function checkCoolifyAutoUpdate({ state }) {
  const confirmation = state.coolifyAutoUpdate;
  if (confirmation?.confirmedAt && confirmation.frequency === coolifyUpdateFrequency) {
    return done(
      `toda semana (${code(coolifyUpdateFrequency)}), ${confirmedOn(confirmation.confirmedAt)}`,
    );
  }
  return missing([
    `ligar Automatic updates com Update frequency ${code(coolifyUpdateFrequency)} e confirmar no roteiro, porque a API do Coolify não lê essa configuração`,
  ]);
}

async function checkOriginCertificate({ state }) {
  const certificate = state.originCertificate;
  const items = [];
  if (!certificate?.checkedAt) {
    items.push(
      "criar o Origin Certificate a partir de um CSR gerado na VPS e colá-lo no roteiro, que o confere",
    );
  }
  if (!certificate?.loadedAt) {
    items.push("gravar o certificado na VPS e carregá-lo na configuração dinâmica do Traefik");
  }
  if (items.length > 0) return missing(items);
  return done(
    `válido até ${certificate.validTo.slice(0, 10)}, ${confirmedOn(certificate.loadedAt)}`,
  );
}

async function checkMcpLogin({ mcp, state }) {
  const names = mcp.remoteServers;
  const statuses = await Promise.all(names.map(async (name) => [name, await mcp.status(name)]));
  if (statuses.some(([, status]) => status === "unavailable")) {
    if (state.mcpLogin?.confirmedAt) return done(confirmedOn(state.mcpLogin.confirmedAt));
    return missing([
      `fazer o login OAuth de ${names.map(code).join(" e ")} e confirmar no roteiro, porque o comando \`claude\` não está no PATH para conferir`,
    ]);
  }
  const pending = statuses.filter(([, status]) => status !== "connected");
  if (pending.length === 0) {
    return done(names.length > 0 ? `${names.map(code).join(" e ")} conectados` : "nenhum");
  }
  return missing(
    pending.map(([name, status]) =>
      status === "needs-auth"
        ? `o login OAuth de ${code(name)}`
        : `${code(name)} conectar; o erro aparece em \`claude mcp get ${name}\``,
    ),
  );
}

/** @type {Step[]} */
export const steps = [
  {
    id: "coolify-token",
    title: "Token do Coolify no environment `production`",
    where: `${coolifyUrl}/security/api-tokens`,
    check: checkCoolifyToken,
  },
  {
    id: "merge-app",
    title: "GitHub App do merge automático",
    where: "o formulário que `pnpm author-setup` abre no navegador",
    check: checkMergeApp,
  },
  {
    id: "ghcr-package",
    title: "Pacote do GHCR público",
    where: `https://github.com/users/${owner}/packages/container/package/${encodeURIComponent(packageName)}`,
    check: checkPackage,
  },
  {
    id: "malware-alerts",
    title: "Alertas de malware do Dependabot",
    where: `https://github.com/${repository}/settings/security_analysis`,
    check: checkMalwareAlerts,
  },
  {
    id: "coolify-auto-update",
    title: "Atualização automática semanal do Coolify",
    where: `${coolifyUrl}/settings/updates`,
    check: checkCoolifyAutoUpdate,
  },
  {
    id: "origin-certificate",
    title: "Origin Certificate na configuração dinâmica do Traefik",
    where: `o Terminal e o Proxy do servidor localhost em ${coolifyUrl}/servers, e o Origin Server da zona minimalme.dev na Cloudflare`,
    check: checkOriginCertificate,
  },
  {
    id: "mcp-login",
    title: "Login OAuth dos MCPs remotos",
    where: "`/mcp` no Claude Code, aberto na raiz do repositório",
    check: checkMcpLogin,
  },
];
