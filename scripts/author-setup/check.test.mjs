// Modo de conferência do roteiro, com respostas falsas das APIs: cada teste parte de tudo
// feito e quebra uma coisa, para provar que a conferência lista exatamente o que falta.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { runCheck } from "./check.mjs";

const repo = "/repos/ThiagoPanini/minimal-me";

function doneResponses() {
  return {
    [`${repo}/environments/production`]: { status: 200, body: { name: "production" } },
    [`${repo}/environments/production/secrets?per_page=100`]: {
      status: 200,
      body: { total_count: 1, secrets: [{ name: "COOLIFY_TOKEN" }] },
    },
    [`${repo}/dependabot/secrets?per_page=100`]: {
      status: 200,
      body: {
        total_count: 2,
        secrets: [{ name: "MERGE_APP_CLIENT_ID" }, { name: "MERGE_APP_PRIVATE_KEY" }],
      },
    },
    "/apps/minimal-me-merge": {
      status: 200,
      body: {
        slug: "minimal-me-merge",
        installations_count: 1,
        permissions: {
          contents: "write",
          metadata: "read",
          pull_requests: "write",
          workflows: "write",
        },
      },
    },
    "/user/packages/container/minimal-me%2Fweb": {
      status: 200,
      body: {
        name: "minimal-me/web",
        visibility: "public",
        html_url:
          "https://github.com/users/ThiagoPanini/packages/container/package/minimal-me%2Fweb",
      },
    },
    [`${repo}/vulnerability-alerts`]: { status: 204, body: null },
  };
}

function doneState() {
  return {
    mergeApp: {
      slug: "minimal-me-merge",
      installation: {
        repositorySelection: "selected",
        repositories: ["ThiagoPanini/minimal-me"],
        checkedAt: "2026-11-21T10:00:00.000Z",
      },
    },
    malwareAlerts: { confirmedAt: "2026-11-21T10:05:00.000Z" },
    coolifyAutoUpdate: { confirmedAt: "2026-11-21T10:10:00.000Z", frequency: "17 4 * * 0" },
    originCertificate: {
      fingerprint256: "AA:BB",
      validTo: "2041-11-17T10:00:00.000Z",
      checkedAt: "2026-11-21T10:20:00.000Z",
      loadedAt: "2026-11-21T10:25:00.000Z",
    },
  };
}

function fakeMcp(statuses = { cloudflare: "connected", hostinger: "connected" }) {
  return {
    remoteServers: Object.keys(statuses),
    async status(name) {
      return statuses[name];
    },
  };
}

function fakeContext({ responses = {}, state = {}, mcp = fakeMcp() } = {}) {
  const calls = [];
  const all = { ...doneResponses(), ...responses };
  return {
    calls,
    context: {
      github: {
        async get(path) {
          calls.push(path);
          if (!(path in all)) throw new Error(`chamada inesperada: GET ${path}`);
          return all[path];
        },
      },
      state: { ...doneState(), ...state },
      mcp,
      now: new Date("2026-11-21T12:00:00Z"),
    },
  };
}

describe("modo de conferência", () => {
  test("com tudo feito, diz que nada falta", async () => {
    const { context } = fakeContext();
    const result = await runCheck(context);
    assert.equal(result.pendingCount, 0);
    assert.match(result.text, /Nada falta/);
  });

  test("sem o token no environment, lista só o token", async () => {
    const { context } = fakeContext({
      responses: {
        [`${repo}/environments/production/secrets?per_page=100`]: {
          status: 200,
          body: { total_count: 0, secrets: [] },
        },
      },
    });
    const result = await runCheck(context);
    assert.equal(result.pendingCount, 1);
    assert.match(result.text, /Token do Coolify no environment `production`/);
    assert.match(result.text, /Falta: o segredo `COOLIFY_TOKEN` no environment `production`/);
  });

  test("sem o environment `production`, o token espera o agente", async () => {
    const { context, calls } = fakeContext({
      responses: { [`${repo}/environments/production`]: { status: 404, body: null } },
    });
    const result = await runCheck(context);
    assert.equal(result.pendingCount, 1);
    assert.match(result.text, /Espera: o environment `production`, que o agente cria/);
    assert.ok(!calls.includes(`${repo}/environments/production/secrets?per_page=100`));
  });

  test("sem o App criado pelo roteiro, lista o App e os dois segredos", async () => {
    const { context } = fakeContext({
      state: { mergeApp: undefined },
      responses: {
        [`${repo}/dependabot/secrets?per_page=100`]: {
          status: 200,
          body: { total_count: 0, secrets: [] },
        },
      },
    });
    const result = await runCheck(context);
    assert.equal(result.pendingCount, 1);
    assert.match(result.text, /GitHub App do merge automático/);
    assert.match(result.text, /Falta: criar o App pelo formulário já preenchido do roteiro/);
    assert.match(
      result.text,
      /Falta: os segredos do Dependabot `MERGE_APP_CLIENT_ID` e `MERGE_APP_PRIVATE_KEY`/,
    );
  });

  test("com o App criado e não instalado, lista só a instalação", async () => {
    const { context } = fakeContext({
      state: { mergeApp: { slug: "minimal-me-merge" } },
      responses: {
        "/apps/minimal-me-merge": {
          status: 200,
          body: {
            slug: "minimal-me-merge",
            installations_count: 0,
            permissions: { contents: "write", pull_requests: "write", workflows: "write" },
          },
        },
      },
    });
    const result = await runCheck(context);
    assert.equal(result.pendingCount, 1);
    const falta = result.text.split("\n").filter((line) => line.includes("Falta:"));
    assert.deepEqual(falta, ["   Falta: instalar o App só neste repositório."]);
  });

  test("com o App instalado sem a conferência da instalação, pede a conferência", async () => {
    const { context } = fakeContext({ state: { mergeApp: { slug: "minimal-me-merge" } } });
    const result = await runCheck(context);
    assert.match(result.text, /Falta: conferir que a instalação é só deste repositório/);
  });

  test("com o App sem a permissão de workflows, lista a permissão", async () => {
    const { context } = fakeContext({
      responses: {
        "/apps/minimal-me-merge": {
          status: 200,
          body: {
            slug: "minimal-me-merge",
            installations_count: 1,
            permissions: { contents: "write", pull_requests: "write" },
          },
        },
      },
    });
    const result = await runCheck(context);
    assert.match(result.text, /Falta: a permissão `workflows: write` no App/);
  });

  test("com o App apagado no GitHub, diz que ele não existe mais", async () => {
    const { context } = fakeContext({
      responses: { "/apps/minimal-me-merge": { status: 404, body: null } },
    });
    const result = await runCheck(context);
    assert.match(result.text, /Falta: o App `minimal-me-merge`, que não existe mais no GitHub/);
  });

  test("antes da primeira publicação da `main`, o pacote espera o agente", async () => {
    const { context } = fakeContext({
      responses: { "/user/packages/container/minimal-me%2Fweb": { status: 404, body: null } },
    });
    const result = await runCheck(context);
    assert.equal(result.pendingCount, 1);
    assert.match(result.text, /Pacote do GHCR público/);
    assert.match(result.text, /Espera: a primeira publicação da imagem na `main`/);
  });

  test("com o pacote privado, lista a visibilidade", async () => {
    const { context } = fakeContext({
      responses: {
        "/user/packages/container/minimal-me%2Fweb": {
          status: 200,
          body: { name: "minimal-me/web", visibility: "private" },
        },
      },
    });
    const result = await runCheck(context);
    assert.equal(result.pendingCount, 1);
    assert.match(result.text, /Falta: tornar público o pacote `minimal-me\/web`/);
  });

  test("sem a permissão de ler pacotes no gh, diz como pedi-la", async () => {
    const { context } = fakeContext({
      responses: { "/user/packages/container/minimal-me%2Fweb": { status: 403, body: {} } },
    });
    const result = await runCheck(context);
    assert.match(result.text, /gh auth refresh -s read:packages/);
  });

  test("sem a confirmação dos alertas de malware, lista os alertas", async () => {
    const { context } = fakeContext({ state: { malwareAlerts: undefined } });
    const result = await runCheck(context);
    assert.equal(result.pendingCount, 1);
    assert.match(result.text, /Alertas de malware do Dependabot/);
    assert.match(result.text, /Falta: ligar os alertas de malware do Dependabot e confirmar/);
  });

  test("com os alertas do Dependabot desligados, pede-os antes dos de malware", async () => {
    const { context } = fakeContext({
      responses: { [`${repo}/vulnerability-alerts`]: { status: 404, body: null } },
    });
    const result = await runCheck(context);
    assert.match(result.text, /Falta: ligar os alertas do Dependabot, que vêm antes/);
  });

  test("sem a confirmação da atualização semanal do Coolify, lista a atualização", async () => {
    const { context } = fakeContext({ state: { coolifyAutoUpdate: undefined } });
    const result = await runCheck(context);
    assert.equal(result.pendingCount, 1);
    assert.match(result.text, /Atualização automática semanal do Coolify/);
    assert.match(result.text, /Falta: ligar Automatic updates com Update frequency `17 4 \* \* 0`/);
  });

  test("com a atualização confirmada em outra frequência, pede a semanal", async () => {
    const { context } = fakeContext({
      state: { coolifyAutoUpdate: { confirmedAt: "2026-11-21T10:10:00.000Z", frequency: "daily" } },
    });
    const result = await runCheck(context);
    assert.equal(result.pendingCount, 1);
  });

  test("sem o Origin Certificate, lista o certificado e a carga no Traefik", async () => {
    const { context } = fakeContext({ state: { originCertificate: undefined } });
    const result = await runCheck(context);
    assert.equal(result.pendingCount, 1);
    assert.match(result.text, /Origin Certificate na configuração dinâmica do Traefik/);
    assert.match(result.text, /Falta: criar o Origin Certificate a partir de um CSR gerado na VPS/);
    assert.match(result.text, /Falta: gravar o certificado na VPS e carregá-lo na configuração/);
  });

  test("com o certificado conferido e não carregado, lista só a carga", async () => {
    const { context } = fakeContext({
      state: {
        originCertificate: {
          fingerprint256: "AA:BB",
          validTo: "2041-11-17T10:00:00.000Z",
          checkedAt: "2026-11-21T10:20:00.000Z",
        },
      },
    });
    const result = await runCheck(context);
    const falta = result.text.split("\n").filter((line) => line.includes("Falta:"));
    assert.deepEqual(falta, [
      "   Falta: gravar o certificado na VPS e carregá-lo na configuração dinâmica do Traefik.",
    ]);
  });

  test("com um MCP remoto sem login, lista só o login dele", async () => {
    const { context } = fakeContext({
      mcp: fakeMcp({ cloudflare: "connected", hostinger: "needs-auth" }),
    });
    const result = await runCheck(context);
    assert.equal(result.pendingCount, 1);
    assert.match(result.text, /Login OAuth dos MCPs remotos/);
    const falta = result.text.split("\n").filter((line) => line.includes("Falta:"));
    assert.deepEqual(falta, ["   Falta: o login OAuth de `hostinger`."]);
  });

  test("sem o comando claude para conferir, vale a confirmação do Autor", async () => {
    const unavailable = fakeMcp({ cloudflare: "unavailable", hostinger: "unavailable" });
    const pending = await runCheck(fakeContext({ mcp: unavailable }).context);
    assert.match(pending.text, /Falta: fazer o login OAuth de `cloudflare` e `hostinger`/);
    const confirmed = await runCheck(
      fakeContext({
        mcp: unavailable,
        state: { mcpLogin: { confirmedAt: "2026-11-21T10:30:00.000Z" } },
      }).context,
    );
    assert.equal(confirmed.pendingCount, 0);
  });

  test("do zero, lista os sete passos e os dois que esperam o agente", async () => {
    const { context } = fakeContext({
      state: {
        mergeApp: undefined,
        malwareAlerts: undefined,
        coolifyAutoUpdate: undefined,
        originCertificate: undefined,
      },
      mcp: fakeMcp({ cloudflare: "needs-auth", hostinger: "needs-auth" }),
      responses: {
        [`${repo}/environments/production`]: { status: 404, body: null },
        [`${repo}/dependabot/secrets?per_page=100`]: {
          status: 200,
          body: { total_count: 0, secrets: [] },
        },
        "/user/packages/container/minimal-me%2Fweb": { status: 404, body: null },
      },
    });
    const result = await runCheck(context);
    assert.equal(result.pendingCount, 7);
    assert.match(result.text, /Faltam 7 de 7 passos/);
    const titles = result.text.split("\n").filter((line) => /^\d\. /.test(line));
    assert.deepEqual(titles, [
      "1. Token do Coolify no environment `production`",
      "2. GitHub App do merge automático",
      "3. Pacote do GHCR público",
      "4. Alertas de malware do Dependabot",
      "5. Atualização automática semanal do Coolify",
      "6. Origin Certificate na configuração dinâmica do Traefik",
      "7. Login OAuth dos MCPs remotos",
    ]);
    assert.equal(result.text.match(/Espera:/g).length, 2);
  });

  test("não muda nada: só lê, sem gravar segredo, estado nem abrir o navegador", async () => {
    const writes = [];
    const trap = (name) => () => writes.push(name);
    const { context } = fakeContext({ state: { mergeApp: undefined } });
    await runCheck({
      ...context,
      setSecret: trap("setSecret"),
      saveState: trap("saveState"),
      openUrl: trap("openUrl"),
    });
    assert.deepEqual(writes, []);
  });
});
