// O GitHub App do merge automático pelo fluxo de manifesto: um servidor local entrega ao
// navegador o formulário já preenchido, o GitHub devolve um código de uso único, e a troca
// desse código traz o App com a chave privada direto para este processo, que a grava nos
// segredos do Dependabot sem mostrá-la.
import { createSign, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { githubHeaders } from "./adapters.mjs";
import { mergeAppPermissions, owner, repository } from "./steps.mjs";

const githubApi = "https://api.github.com";
const repositoryUrl = `https://github.com/${repository}`;
const codeLifetime = 60 * 60 * 1000;

export function buildManifest(redirectUrl) {
  return {
    name: "minimal-me-merge",
    url: repositoryUrl,
    description: "Mescla sozinho os PRs de robô do Minimal Me que passam no gate.",
    public: false,
    redirect_url: redirectUrl,
    hook_attributes: { url: repositoryUrl, active: false },
    default_permissions: mergeAppPermissions,
    default_events: [],
  };
}

const escapeHtml = (text) =>
  text.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);

function formPage(manifest, state) {
  const action = `https://github.com/settings/apps/new?state=${state}`;
  return `<!doctype html>
<html lang="pt-BR">
<meta charset="utf-8">
<title>Minimal Me: GitHub App</title>
<form method="post" action="${escapeHtml(action)}">
  <input type="hidden" name="manifest" value="${escapeHtml(JSON.stringify(manifest))}">
  <p>O formulário do GitHub abre já preenchido.</p>
  <button type="submit">Abrir o formulário do GitHub</button>
</form>
<script>document.forms[0].submit()</script>
</html>`;
}

const donePage = `<!doctype html>
<html lang="pt-BR"><meta charset="utf-8"><title>Minimal Me: GitHub App</title>
<p>App criado. Volte ao terminal do roteiro.</p></html>`;

/**
 * Sobe o servidor local, abre o formulário e espera o GitHub voltar com o código. Devolve a
 * resposta da troca, que traz `slug`, `client_id` e `pem`; o chamador não a mostra.
 */
export async function createFromManifest({ openUrl }) {
  const state = randomBytes(16).toString("hex");
  let resolveCode;
  let rejectCode;
  const codeArrived = new Promise((resolve, reject) => {
    resolveCode = resolve;
    rejectCode = reject;
  });
  let manifest;
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (url.pathname === "/") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(formPage(manifest, state));
      return;
    }
    const code = url.searchParams.get("code") ?? "";
    if (url.pathname === "/created" && url.searchParams.get("state") === state) {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(donePage);
      if (/^[A-Za-z0-9_-]+$/.test(code)) resolveCode(code);
      else rejectCode(new Error("o GitHub voltou sem um código válido"));
      return;
    }
    response.writeHead(404);
    response.end();
  });
  await new Promise((resolve) => server.listen(0, "localhost", resolve));
  const { port } = /** @type {import("node:net").AddressInfo} */ (server.address());
  manifest = buildManifest(`http://localhost:${port}/created`);
  const timer = setTimeout(
    () => rejectCode(new Error("o código do GitHub não chegou em uma hora")),
    codeLifetime,
  );
  try {
    openUrl(`http://localhost:${port}/`);
    const code = await codeArrived;
    return await exchangeCode(code);
  } finally {
    clearTimeout(timer);
    server.close();
  }
}

async function exchangeCode(code) {
  const response = await fetch(`${githubApi}/app-manifests/${code}/conversions`, {
    method: "POST",
    headers: githubHeaders,
  });
  if (response.status !== 201) {
    throw new Error(`a troca do código pelo App respondeu ${response.status}`);
  }
  return response.json();
}

const base64url = (value) => Buffer.from(value).toString("base64url");

/** JWT do App, assinado com a chave privada, válido por nove minutos. */
function appJwt({ clientId, privateKey }) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: clientId }));
  const signature = createSign("RSA-SHA256")
    .update(`${header}.${payload}`)
    .sign(privateKey, "base64url");
  return `${header}.${payload}.${signature}`;
}

async function call(method, apiPath, token, body) {
  const response = await fetch(`${githubApi}${apiPath}`, {
    method,
    headers: { ...githubHeaders, Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`${method} ${apiPath} respondeu ${response.status}`);
  return response.status === 204 ? null : response.json();
}

/**
 * Lê, como o App, em que repositórios ele está instalado. O token de instalação dura só a
 * leitura: ele nasce com `metadata: read` e é revogado em seguida.
 * @returns {Promise<import("./guides.mjs").AppInstallation>}
 */
export async function verifyInstallation(credentials) {
  const jwt = appJwt(credentials);
  const installations = await call("GET", "/app/installations", jwt);
  const installation = installations.find((item) => item.account?.login === owner);
  if (!installation) return { repositorySelection: null, repositories: [] };
  const { token } = await call("POST", `/app/installations/${installation.id}/access_tokens`, jwt, {
    permissions: { metadata: "read" },
  });
  try {
    const listed = await call("GET", "/installation/repositories?per_page=100", token);
    return {
      repositorySelection: installation.repository_selection,
      repositories: listed.repositories.map((item) => item.full_name),
    };
  } finally {
    await call("DELETE", "/installation/token", token);
  }
}
