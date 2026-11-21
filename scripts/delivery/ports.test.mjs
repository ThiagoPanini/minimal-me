// As portas reais da entrega: o Coolify contra um servidor HTTP falso, com as respostas da rota
// POST /api/v1/deploy do Coolify 4.7.6; o registro e o atestado contra um `docker` e um `gh`
// falsos, que respondem como os de verdade.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, describe, test } from "node:test";
import { createAttestation, createCoolify, createRegistry } from "./ports.mjs";

const image = "ghcr.io/thiagopanini/minimal-me/web";
const digest = `sha256:${"a".repeat(64)}`;
const other = `sha256:${"b".repeat(64)}`;
const commit = "1".repeat(40);

describe("Coolify", () => {
  const token = "token-de-teste-0123456789";
  const applicationUuid = "app-uuid-1";
  const requests = [];
  let reply = () => ({ status: 200, body: {} });
  let server;
  let url;

  before(async () => {
    server = createServer((request, response) => {
      requests.push({
        method: request.method,
        url: request.url,
        authorization: request.headers.authorization,
      });
      const { status, body } = reply();
      response.writeHead(status, { "content-type": "application/json" });
      response.end(JSON.stringify(body));
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    url = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => new Promise((resolve) => server.close(resolve)));

  test("/deploy goes by POST with the token and the UUID and always asks for a new delivery", async () => {
    requests.length = 0;
    reply = () => ({
      status: 200,
      body: {
        deployments: [
          {
            message: "Application web deployment queued.",
            resource_uuid: applicationUuid,
            deployment_uuid: "deployment-1",
          },
        ],
      },
    });

    const message = await createCoolify({ url, token, applicationUuid }).deploy();

    assert.deepEqual(requests, [
      {
        method: "POST",
        url: `/api/v1/deploy?uuid=${applicationUuid}&force=true`,
        authorization: `Bearer ${token}`,
      },
    ]);
    assert.match(message, /deployment-1/);
    assert.match(message, /Application web deployment queued\./);
  });

  test("a 200 without a queued delivery is a failure, with the Coolify message", async () => {
    reply = () => ({
      status: 200,
      body: {
        deployments: [
          { message: "Unauthorized to deploy this application.", resource_uuid: applicationUuid },
        ],
      },
    });

    await assert.rejects(
      createCoolify({ url, token, applicationUuid }).deploy(),
      /O Coolify não enfileirou a entrega: Unauthorized to deploy this application\./,
    );
  });

  test("a refusal carries the status and the Coolify message, never the token", async () => {
    reply = () => ({ status: 404, body: { message: "No resources found." } });

    await assert.rejects(createCoolify({ url, token, applicationUuid }).deploy(), (error) => {
      assert.match(error.message, /O Coolify recusou o \/deploy com 404: No resources found\./);
      assert.ok(!error.message.includes(token));
      return true;
    });
  });

  test("without the token and the application UUID, says what is missing in the production environment", () => {
    assert.throws(
      () => createCoolify({ url, token: "", applicationUuid: undefined }).assertConfigured(),
      /Falta no environment production: o segredo COOLIFY_TOKEN e a variável COOLIFY_APP_UUID\./,
    );
    assert.doesNotThrow(() => createCoolify({ url, token, applicationUuid }).assertConfigured());
  });
});

/** Um `docker buildx imagetools` falso sobre um registro na memória. */
function fakeDocker(tags) {
  return async (command, args) => {
    assert.equal(command, "docker");
    const [buildx, imagetools, action, ...rest] = args;
    assert.deepEqual([buildx, imagetools], ["buildx", "imagetools"]);
    if (action === "inspect") {
      const tag = rest[0].slice(`${image}:`.length);
      const found = tags[tag];
      if (!found) return { status: 1, stdout: "", stderr: `ERROR: ${rest[0]}: not found\n` };
      assert.deepEqual(rest.slice(1), ["--format", "{{.Manifest.Digest}}"]);
      return { status: 0, stdout: found, stderr: "" };
    }
    if (action === "create") {
      // Sem `--prefer-index=false`, um manifesto simples ganharia um índice novo, com outro digest.
      assert.deepEqual(rest.slice(0, 2), ["--prefer-index=false", "--tag"]);
      const tag = rest[2].slice(`${image}:`.length);
      tags[tag] = rest[3].slice(`${image}@`.length);
      return { status: 0, stdout: "", stderr: "" };
    }
    throw new Error(`imagetools ${action} não está no falso`);
  };
}

describe("the registry", () => {
  test("reads the digest of a tag and does not find a tag that does not exist", async () => {
    const registry = createRegistry({ image, run: fakeDocker({ production: digest }) });

    assert.equal(await registry.digestOf("production"), digest);
    assert.equal(await registry.digestOf("sha-nao-publicado"), undefined);
  });

  test("an error other than a missing tag becomes a failure", async () => {
    const run = async () => ({ status: 1, stdout: "", stderr: "ERROR: denied: denied\n" });

    await assert.rejects(
      createRegistry({ image, run }).digestOf("production"),
      /Não consegui ler ghcr\.io\/thiagopanini\/minimal-me\/web:production: ERROR: denied: denied/,
    );
  });

  test("points the tag to the digest, the same one the registry returns afterwards", async () => {
    const tags = { production: other };
    const registry = createRegistry({ image, run: fakeDocker(tags) });

    await registry.point("production", digest);

    assert.equal(tags.production, digest);
  });

  test("fails if the tag does not point to the digest after being moved", async () => {
    const tags = {};
    const docker = fakeDocker(tags);
    // Um registro que guarda outro digest no lugar do pedido.
    const run = async (command, args) => {
      const result = await docker(command, args);
      if (args[2] === "create") tags.production = other;
      return result;
    };

    await assert.rejects(
      createRegistry({ image, run }).point("production", digest),
      /ghcr\.io\/thiagopanini\/minimal-me\/web:production aponta para sha256:b+, não para sha256:a+/,
    );
  });
});

describe("the attestation", () => {
  const repository = "ThiagoPanini/minimal-me";

  test("requires the ci.yml of main, at the delivery commit, on a GitHub runner", async () => {
    const calls = [];
    const run = async (command, args) => {
      calls.push([command, ...args]);
      return { status: 0, stdout: "", stderr: "" };
    };

    await createAttestation({ image, repository, run }).verify(digest, commit);

    assert.deepEqual(calls, [
      [
        "gh",
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
      ],
    ]);
  });

  test("a failing verification carries the gh output", async () => {
    const run = async () => ({
      status: 1,
      stdout: "",
      stderr: "Error: no attestations found for subject\n",
    });

    await assert.rejects(createAttestation({ image, repository, run }).verify(digest, commit), {
      message: "Error: no attestations found for subject",
    });
  });
});
