// Como o Autor faz cada passo: abre a página certa, diz o que clicar e o que copiar, recebe
// o que ele cola e grava cada valor só no destino dele. Nenhum segredo é escrito na tela nem
// no estado guardado na máquina; o modo de conferência não importa este módulo.
import {
  cloudflareOriginUrl,
  dynamicConfiguration,
  dynamicConfigurationName,
  hostnames,
  inspectCertificate,
  requestCommand,
  writeCommand,
} from "./origin-certificate.mjs";
import {
  coolifyUpdateFrequency,
  coolifyUrl,
  dependabotSecretsPath,
  installationIsOnlyThisRepository,
  packageName,
  packagePath,
  productionEnvironment,
  repository,
  secretNames,
  secretNamesOf,
} from "./steps.mjs";

/**
 * @typedef {object} Terminal
 * @property {(text: string) => void} say
 * @property {(text: string) => void} step
 * @property {(text: string) => void} note
 * @property {(text: string) => void} ok
 * @property {(text: string) => void} warn
 * @property {(text: string) => void} command
 * @property {(prompt: string) => Promise<string>} ask
 * @property {(prompt: string) => Promise<string>} askHidden
 * @property {(prompt: string) => Promise<string>} askBlock
 * @property {(prompt?: string) => Promise<void>} pause
 * @property {(question: string) => Promise<boolean>} confirm
 *
 * @typedef {{ clientId: string, privateKey: string }} AppCredentials
 * @typedef {{ repositorySelection: string | null, repositories: string[] }} AppInstallation
 *
 * @typedef {import("./steps.mjs").CheckContext & {
 *   io: Terminal,
 *   openUrl: (url: string) => void,
 *   setSecret: (secret: { name: string, value: string, app?: string, environment?: string }) => Promise<void>,
 *   saveState: (patch: Record<string, unknown>) => Promise<void>,
 *   readFile?: (file: string) => Promise<string>,
 *   mergeApp: {
 *     create: () => Promise<{ slug: string, client_id: string, pem: string }>,
 *     verifyInstallation: (credentials: AppCredentials) => Promise<AppInstallation>,
 *   },
 * }} GuideContext
 */

/** @param {GuideContext} context */
async function guideCoolifyToken({ io, openUrl, setSecret }) {
  openUrl(`${coolifyUrl}/security/api-tokens`);
  io.step(
    "Se você tem guardado o token de deploy que já usa, use-o. Se ele é só do Minimal Me, clique em Edit nele, dê acesso só ao Project minimal-me e salve; se é o da frota, deixe-o como está.",
  );
  io.step(
    "Sem o token guardado, crie outro: New API token; Description minimal-me-deploy; Permissions só deploy; acesso só ao Project minimal-me; Expires Never; Create token. Copie o token, que aparece uma vez só.",
  );
  const token = await io.askHidden("Cole o token (ele não aparece na tela; Enter vazio pula):");
  if (!token) return;
  await setSecret({
    name: secretNames.coolifyToken,
    environment: productionEnvironment,
    value: token,
  });
  io.ok(`${secretNames.coolifyToken} gravado no environment ${productionEnvironment}.`);
}

/**
 * Grava o Client ID e a chave privada do App como segredos do Dependabot. Devolve os dois só
 * para a conferência da instalação, na memória deste processo.
 * @returns {Promise<AppCredentials>}
 */
async function storeAppCredentials({ io, setSecret }, { client_id: clientId, pem: privateKey }) {
  await setSecret({ name: secretNames.mergeAppClientId, app: "dependabot", value: clientId });
  await setSecret({ name: secretNames.mergeAppPrivateKey, app: "dependabot", value: privateKey });
  io.ok(
    `${secretNames.mergeAppClientId} e ${secretNames.mergeAppPrivateKey} gravados como segredos do Dependabot.`,
  );
  return { clientId, privateKey };
}

/** A chave privada aparece uma vez só: se os segredos se perderam, o App ganha outra chave. */
async function replacePrivateKey(context, slug, clientId) {
  const { io, openUrl, readFile } = context;
  io.say("O App existe, mas os segredos do Dependabot faltam, e a chave dele não aparece de novo.");
  openUrl(`https://github.com/settings/apps/${slug}`);
  io.step("Em Private keys, clique em Generate a private key; o navegador baixa um arquivo .pem.");
  const file = await io.ask(
    "Caminho do .pem baixado (no WSL, a pasta Downloads do Windows fica em /mnt/c/Users/<você>/Downloads):",
  );
  if (!file || !readFile) return undefined;
  const credentials = await storeAppCredentials(context, {
    client_id: clientId,
    pem: await readFile(file),
  });
  io.note("Apague o .pem baixado e, na mesma página, as chaves antigas do App.");
  return credentials;
}

async function confirmInstallation(context, slug, credentials) {
  const { io, openUrl, mergeApp, saveState, now } = context;
  let installation;
  if (credentials) {
    const found = await mergeApp.verifyInstallation(credentials);
    if (!installationIsOnlyThisRepository(found)) {
      io.warn(
        `A instalação de ${slug} não está só em ${repository}. Em https://github.com/settings/installations, clique em Configure ao lado do App, escolha Only select repositories, deixe só minimal-me e salve.`,
      );
      return;
    }
    installation = { ...found, checkedBy: "api" };
  } else {
    openUrl("https://github.com/settings/installations");
    io.step(
      `Clique em Configure ao lado de ${slug} e confira: Only select repositories, só com minimal-me.`,
    );
    if (!(await io.confirm("A instalação está só em minimal-me?"))) return;
    installation = {
      repositorySelection: "selected",
      repositories: [repository],
      checkedBy: "author",
    };
  }
  await saveState({
    mergeApp: { slug, installation: { ...installation, checkedAt: now.toISOString() } },
  });
  io.ok(`${slug} instalado só em ${repository}.`);
}

/** @param {GuideContext} context */
async function guideMergeApp(context) {
  const { io, github, openUrl, mergeApp, saveState } = context;
  let slug = context.state.mergeApp?.slug;
  let app = slug ? await github.get(`/apps/${slug}`) : undefined;
  let credentials;
  if (app?.status !== 200) {
    io.say(
      "O navegador abre um formulário do GitHub já preenchido: o App minimal-me-merge, privado, sem webhook, com escrita em conteúdo, PRs e workflows.",
    );
    io.step("Confira e clique em Create GitHub App. Se o nome já existir no GitHub, troque-o ali.");
    const conversion = await mergeApp.create();
    slug = conversion.slug;
    await saveState({ mergeApp: { slug } });
    credentials = await storeAppCredentials(context, conversion);
    app = await github.get(`/apps/${slug}`);
  } else {
    const names = secretNamesOf((await github.get(dependabotSecretsPath)).body);
    if (
      !names.includes(secretNames.mergeAppClientId) ||
      !names.includes(secretNames.mergeAppPrivateKey)
    ) {
      credentials = await replacePrivateKey(context, slug, app.body.client_id);
    }
  }
  if (installationIsOnlyThisRepository(context.state.mergeApp?.installation)) return;
  // Logo depois da criação, a API pode ainda não achar o App: conta como não instalado.
  if (!(app.status === 200 && app.body.installations_count > 0)) {
    openUrl(`https://github.com/apps/${slug}/installations/new`);
    io.step("Escolha Only select repositories, marque só minimal-me e clique em Install.");
    await io.pause("Enter depois de instalar.");
  }
  await confirmInstallation(context, slug, credentials);
}

/** @param {GuideContext} context */
async function guidePackage({ io, github, openUrl }) {
  const response = await github.get(packagePath);
  openUrl(response.body.html_url);
  io.step("Clique em Package settings e, no fim da página, em Danger Zone, em Change visibility.");
  io.step(
    `Escolha Public, digite ${packageName} e confirme em I understand the consequences, change package visibility.`,
  );
  io.note("Um pacote público não volta a ser privado.");
  await io.pause("Enter depois de mudar.");
}

/** @param {GuideContext} context */
async function guideMalwareAlerts({ io, openUrl, saveState, now }) {
  openUrl(`https://github.com/${repository}/settings/security_analysis`);
  io.step(
    "Em Advanced Security, ao lado de Dependabot malware alerts, clique em Enable. Se Dependabot alerts estiver desligado, ligue-o antes.",
  );
  if (await io.confirm("Dependabot malware alerts aparece ligado?")) {
    await saveState({ malwareAlerts: { confirmedAt: now.toISOString() } });
  }
}

/** @param {GuideContext} context */
async function guideCoolifyAutoUpdate({ io, openUrl, saveState, now }) {
  openUrl(`${coolifyUrl}/settings/updates`);
  io.step("Em Automatic updates, escolha Enabled.");
  io.step(
    `Em Update frequency, ponha ${coolifyUpdateFrequency} (domingo, 04:17 no fuso da instância) e salve.`,
  );
  io.note(
    "Se Automatic updates aparecer travado com Controlled by the AUTOUPDATE environment variable, quem decide é a variável AUTOUPDATE de /data/coolify/source/.env na VPS.",
  );
  if (await io.confirm(`Automatic updates está em Enabled, com ${coolifyUpdateFrequency}?`)) {
    await saveState({
      coolifyAutoUpdate: { confirmedAt: now.toISOString(), frequency: coolifyUpdateFrequency },
    });
  }
}

async function requestCertificate(context) {
  const { io, openUrl, saveState, now } = context;
  io.say("1. Gere a chave e o pedido de assinatura (CSR) na VPS. A chave não sai de lá.");
  openUrl(`${coolifyUrl}/servers`);
  io.step("Abra o servidor localhost, clique em Terminal e rode:");
  io.command(requestCommand);
  io.step("Copie o CSR que o comando mostra, da linha BEGIN à linha END.");
  io.say("2. Crie o certificado na Cloudflare a partir do CSR.");
  openUrl(cloudflareOriginUrl);
  io.step("Clique em Create Certificate, escolha Use my private key and CSR e cole o CSR.");
  io.step(
    `Em Hostnames, deixe ${hostnames.join(" e ")}; em Certificate Validity, 15 years; clique em Create.`,
  );
  io.step("Com Key Format em PEM, copie o Origin Certificate.");
  const certificate = await io.askBlock(
    "Cole o certificado (ele é público) e termine com a linha END CERTIFICATE:",
  );
  const inspection = inspectCertificate(certificate, now);
  if (!inspection.ok) {
    for (const problem of inspection.problems) io.warn(`${problem}.`);
    return false;
  }
  await saveState({
    originCertificate: {
      certificate,
      validTo: inspection.validTo,
      fingerprint256: inspection.fingerprint256,
      checkedAt: now.toISOString(),
    },
  });
  io.ok(`Certificado conferido, válido até ${inspection.validTo.slice(0, 10)}.`);
  return true;
}

/** @param {GuideContext} context */
async function guideOriginCertificate(context) {
  const { io, saveState, now } = context;
  if (!context.state.originCertificate?.checkedAt && !(await requestCertificate(context))) return;
  const saved = context.state.originCertificate;
  io.say("3. Grave o certificado ao lado da chave. No mesmo Terminal, rode:");
  io.command(writeCommand(saved.certificate));
  io.step("O comando termina dizendo que o certificado e a chave conferem.");
  io.say("4. Carregue o par na configuração dinâmica do Traefik.");
  io.step(
    `No servidor localhost, abra Proxy e depois Dynamic configurations; clique em Add. Filename: ${dynamicConfigurationName}. Configuration:`,
  );
  io.command(dynamicConfiguration);
  io.step("Clique em Save.");
  if (await io.confirm("O Terminal disse que conferem e a configuração foi salva?")) {
    await saveState({ originCertificate: { ...saved, loadedAt: now.toISOString() } });
  }
}

/** @param {GuideContext} context */
async function guideMcpLogin({ io, mcp, saveState, now }) {
  io.step("Abra o Claude Code na raiz do repositório e rode /mcp.");
  io.step(
    `Em cada servidor remoto que pede login (${mcp.remoteServers.join(", ")}), escolha Authenticate e autorize no navegador com a sua conta.`,
  );
  const statuses = await Promise.all(mcp.remoteServers.map((name) => mcp.status(name)));
  if (statuses.includes("unavailable")) {
    if (await io.confirm("Os servidores remotos aparecem conectados no /mcp?")) {
      await saveState({ mcpLogin: { confirmedAt: now.toISOString() } });
    }
    return;
  }
  await io.pause("Enter depois do login.");
}

/** @type {Record<string, (context: GuideContext) => Promise<void>>} */
export const guides = {
  "coolify-token": guideCoolifyToken,
  "merge-app": guideMergeApp,
  "ghcr-package": guidePackage,
  "malware-alerts": guideMalwareAlerts,
  "coolify-auto-update": guideCoolifyAutoUpdate,
  "origin-certificate": guideOriginCertificate,
  "mcp-login": guideMcpLogin,
};
