// Os passos guiados do roteiro, com terminal e APIs falsos: o que o Autor cola vai só para o
// destino do segredo, nunca para a saída nem para o estado guardado na máquina.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { guides } from "./guides.mjs";

const fixture = (name) => readFileSync(path.join(import.meta.dirname, "fixtures", name), "utf8");

function fakeTerminal({ hidden = [], blocks = [], answers = [], confirms = [] } = {}) {
  const output = [];
  const record = (text) => output.push(text);
  return {
    output,
    io: {
      say: record,
      step: record,
      note: record,
      ok: record,
      warn: record,
      command: record,
      ask: async (prompt) => (record(prompt), answers.shift() ?? ""),
      askHidden: async (prompt) => (record(prompt), hidden.shift() ?? ""),
      askBlock: async (prompt) => (record(prompt), blocks.shift() ?? ""),
      pause: async (prompt) => record(prompt ?? ""),
      confirm: async (question) => (record(question), confirms.shift() ?? false),
    },
  };
}

function fakeGuideContext({
  responses = {},
  state = {},
  terminal = fakeTerminal(),
  mergeApp,
} = {}) {
  const secrets = [];
  const opened = [];
  const context = {
    github: {
      async get(requested) {
        if (!(requested in responses)) throw new Error(`chamada inesperada: GET ${requested}`);
        return responses[requested];
      },
    },
    state: { ...state },
    now: new Date("2026-11-21T12:00:00Z"),
    mcp: { remoteServers: [], status: async () => "connected" },
    io: terminal.io,
    openUrl: (url) => opened.push(url),
    async setSecret(secret) {
      secrets.push(secret);
    },
    async saveState(patch) {
      Object.assign(context.state, patch);
    },
    mergeApp,
  };
  return { context, secrets, opened, output: terminal.output };
}

const printed = (output) => output.join("\n");

describe("passos guiados", () => {
  test("o token do Coolify vai só para o environment `production`, sem aparecer", async () => {
    const token = "coolify-token-de-teste-0123456789";
    const terminal = fakeTerminal({ hidden: [token] });
    const { context, secrets, output } = fakeGuideContext({ terminal });
    await guides["coolify-token"](context);
    assert.deepEqual(secrets, [{ name: "COOLIFY_TOKEN", environment: "production", value: token }]);
    assert.ok(!printed(output).includes(token));
    assert.ok(!JSON.stringify(context.state).includes(token));
  });

  test("sem token colado, nada é gravado", async () => {
    const { context, secrets } = fakeGuideContext();
    await guides["coolify-token"](context);
    assert.deepEqual(secrets, []);
  });

  test("o App novo grava Client ID e chave como segredos do Dependabot, sem mostrá-los", async () => {
    const conversion = {
      id: 4242,
      slug: "minimal-me-merge",
      client_id: "Iv23-client-id-de-teste",
      client_secret: "client-secret-de-teste",
      webhook_secret: "webhook-secret-de-teste",
      pem: "-----BEGIN RSA PRIVATE KEY-----\nchave-de-teste\n-----END RSA PRIVATE KEY-----\n",
    };
    const installation = {
      repositorySelection: "selected",
      repositories: ["ThiagoPanini/minimal-me"],
    };
    const verified = [];
    const { context, secrets, output } = fakeGuideContext({
      responses: {
        "/apps/minimal-me-merge": {
          status: 200,
          body: { slug: "minimal-me-merge", installations_count: 0 },
        },
      },
      mergeApp: {
        create: async () => conversion,
        verifyInstallation: async (credentials) => (verified.push(credentials), installation),
      },
    });
    await guides["merge-app"](context);
    assert.deepEqual(secrets, [
      { name: "MERGE_APP_CLIENT_ID", app: "dependabot", value: conversion.client_id },
      { name: "MERGE_APP_PRIVATE_KEY", app: "dependabot", value: conversion.pem },
    ]);
    assert.deepEqual(verified, [{ clientId: conversion.client_id, privateKey: conversion.pem }]);
    assert.equal(context.state.mergeApp.slug, "minimal-me-merge");
    assert.deepEqual(context.state.mergeApp.installation.repositories, ["ThiagoPanini/minimal-me"]);
    const visible = `${printed(output)}\n${JSON.stringify(context.state)}`;
    for (const secret of ["client_id", "client_secret", "webhook_secret", "pem"]) {
      assert.ok(!visible.includes(conversion[secret]), `${secret} apareceu`);
    }
  });

  test("uma instalação em todos os repositórios não passa na conferência", async () => {
    const { context, output } = fakeGuideContext({
      responses: {
        "/apps/minimal-me-merge": {
          status: 200,
          body: { slug: "minimal-me-merge", installations_count: 1 },
        },
      },
      mergeApp: {
        create: async () => ({ slug: "minimal-me-merge", client_id: "c", pem: "k" }),
        verifyInstallation: async () => ({ repositorySelection: "all", repositories: [] }),
      },
    });
    await guides["merge-app"](context);
    assert.equal(context.state.mergeApp.installation, undefined);
    assert.match(printed(output), /Only select repositories/);
  });

  test("o Origin Certificate colado é conferido e guardado sem chave", async () => {
    const certificate = fixture("origin-certificate.pem");
    const terminal = fakeTerminal({ blocks: [certificate], confirms: [true] });
    const { context, output } = fakeGuideContext({ terminal });
    await guides["origin-certificate"](context);
    const saved = context.state.originCertificate;
    assert.equal(saved.validTo.slice(0, 10), "2041-11-17");
    assert.equal(saved.certificate, certificate);
    assert.ok(saved.checkedAt && saved.loadedAt);
    assert.match(printed(output), /openssl req -new/);
    assert.match(printed(output), /certFile: \/traefik\/certs\/minimalme\.dev\.cert/);
    assert.ok(!printed(output).includes("PRIVATE KEY"));
  });

  test("um certificado de outro emissor e outros nomes é recusado", async () => {
    const terminal = fakeTerminal({ blocks: [fixture("other-certificate.pem")] });
    const { context, output } = fakeGuideContext({ terminal });
    await guides["origin-certificate"](context);
    assert.equal(context.state.originCertificate, undefined);
    assert.match(printed(output), /não foi emitido pela Origin CA da Cloudflare/);
    assert.match(printed(output), /não cobre `minimalme\.dev` e `\*\.minimalme\.dev`/);
    assert.match(printed(output), /vale menos de 14 anos/);
  });

  test("o pacote privado abre a página do pacote no GHCR", async () => {
    const htmlUrl =
      "https://github.com/users/ThiagoPanini/packages/container/package/minimal-me%2Fweb";
    const { context, opened } = fakeGuideContext({
      responses: {
        "/user/packages/container/minimal-me%2Fweb": {
          status: 200,
          body: { visibility: "private", html_url: htmlUrl },
        },
      },
    });
    await guides["ghcr-package"](context);
    assert.deepEqual(opened, [htmlUrl]);
  });

  test("os alertas de malware ficam confirmados só com o sim do Autor", async () => {
    const no = fakeGuideContext({ terminal: fakeTerminal({ confirms: [false] }) });
    await guides["malware-alerts"](no.context);
    assert.equal(no.context.state.malwareAlerts, undefined);
    const yes = fakeGuideContext({ terminal: fakeTerminal({ confirms: [true] }) });
    await guides["malware-alerts"](yes.context);
    assert.equal(yes.context.state.malwareAlerts.confirmedAt, "2026-11-21T12:00:00.000Z");
  });

  test("a atualização do Coolify guarda a frequência semanal confirmada", async () => {
    const { context } = fakeGuideContext({ terminal: fakeTerminal({ confirms: [true] }) });
    await guides["coolify-auto-update"](context);
    assert.equal(context.state.coolifyAutoUpdate.frequency, "17 4 * * 0");
  });
});
