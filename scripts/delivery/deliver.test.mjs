// A entrega com portas falsas: um registro que guarda as tags na memória, um Coolify que conta os
// /deploy e lembra para onde `production` apontava em cada um, e um smoke que responde o que o
// teste manda. Cada teste parte da entrega boa e quebra uma coisa.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { deliver } from "./deliver.mjs";

const commit = "1".repeat(40);
const previousCommit = "2".repeat(40);
const digest = `sha256:${"a".repeat(64)}`;
const previous = `sha256:${"b".repeat(64)}`;

function fakePorts({
  tags = { production: previous, [`sha-${commit}`]: digest, [`sha-${previousCommit}`]: previous },
  attestationFailure,
  missingConfig,
  deployFailures = [],
  smokeFailures = [],
} = {}) {
  const registry = { tags: { ...tags } };
  const deployed = [];
  const smoked = [];
  const verified = [];
  const lines = [];
  const ports = {
    registry: {
      async digestOf(tag) {
        return registry.tags[tag];
      },
      async point(tag, target) {
        registry.tags[tag] = target;
      },
    },
    attestation: {
      async verify(target, source) {
        verified.push({ digest: target, commit: source });
        if (attestationFailure) throw new Error(attestationFailure);
      },
    },
    coolify: {
      assertConfigured() {
        if (missingConfig) throw new Error(missingConfig);
      },
      async deploy() {
        const failure = deployFailures[deployed.length];
        deployed.push(registry.tags.production);
        if (failure) throw new Error(failure);
        return `O Coolify enfileirou a entrega ${deployed.length}.`;
      },
    },
    async smoke(expected) {
      smoked.push(expected);
      return smokeFailures;
    },
    log: (line) => lines.push(line),
  };
  return { ports, registry, deployed, smoked, verified, lines };
}

describe("a entrega da `main`", () => {
  test("confere o atestado, aponta production para o digest, chama o /deploy e roda o smoke", async () => {
    const fake = fakePorts();

    await deliver({ commit, digest }, fake.ports);

    assert.deepEqual(fake.verified, [{ digest, commit }]);
    assert.equal(fake.registry.tags.production, digest);
    assert.deepEqual(fake.deployed, [digest]);
    assert.deepEqual(fake.smoked, [commit]);
  });

  test("com o atestado que não confere, nada muda", async () => {
    const fake = fakePorts({ attestationFailure: "nenhum atestado do ci.yml para este digest" });

    await assert.rejects(
      deliver({ commit, digest }, fake.ports),
      /O atestado de sha256:a+ não confere com o commit 1{40}: nenhum atestado do ci\.yml/,
    );
    assert.equal(fake.registry.tags.production, previous);
    assert.deepEqual(fake.deployed, []);
  });

  test("sem o token ou a aplicação do Coolify, falha antes de mover production", async () => {
    const fake = fakePorts({ missingConfig: "Falta o segredo COOLIFY_TOKEN." });

    await assert.rejects(deliver({ commit, digest }, fake.ports), /Falta o segredo COOLIFY_TOKEN/);
    assert.deepEqual(fake.verified, [{ digest, commit }]);
    assert.equal(fake.registry.tags.production, previous);
    assert.deepEqual(fake.deployed, []);
  });

  test("se o smoke falha com a versão nova, devolve production ao digest anterior, chama o /deploy de novo e falha", async () => {
    const fake = fakePorts({ smokeFailures: ['O cabeçalho Server diz a versão: "nginx/1.31.9".'] });

    await assert.rejects(deliver({ commit, digest }, fake.ports), (error) => {
      assert.match(error.message, /O smoke falhou/);
      assert.match(error.message, /O cabeçalho Server diz a versão: "nginx\/1\.31\.9"\./);
      assert.match(error.message, /production voltou ao digest anterior, sha256:b+/);
      return true;
    });
    assert.equal(fake.registry.tags.production, previous);
    assert.deepEqual(fake.deployed, [digest, previous]);
  });

  test("se o /deploy falha, também devolve production ao digest anterior", async () => {
    const fake = fakePorts({ deployFailures: ["O Coolify recusou o /deploy com 500."] });

    await assert.rejects(
      deliver({ commit, digest }, fake.ports),
      /O Coolify recusou o \/deploy com 500\.[\s\S]*production voltou ao digest anterior/,
    );
    assert.equal(fake.registry.tags.production, previous);
    assert.deepEqual(fake.deployed, [digest, previous]);
    assert.deepEqual(fake.smoked, []);
  });

  test("na primeira entrega, sem digest anterior, não há para onde voltar", async () => {
    const fake = fakePorts({
      tags: { [`sha-${commit}`]: digest },
      smokeFailures: ["A Home respondeu 502, não 200 com HTML."],
    });

    await assert.rejects(
      deliver({ commit, digest }, fake.ports),
      /A Home respondeu 502[\s\S]*Não havia digest em production antes desta entrega: nada a voltar\./,
    );
    assert.deepEqual(fake.deployed, [digest]);
  });

  test("se o rollback também falha, a mensagem diz as duas falhas", async () => {
    const fake = fakePorts({
      deployFailures: [
        "O Coolify recusou o /deploy com 500.",
        "O Coolify recusou o /deploy com 503.",
      ],
    });

    await assert.rejects(
      deliver({ commit, digest }, fake.ports),
      /com 500\.[\s\S]*O rollback para sha256:b+ também falhou: O Coolify recusou o \/deploy com 503\./,
    );
  });
});

describe("o rollback manual", () => {
  test("volta ao digest publicado para o commit pelo mesmo caminho da entrega", async () => {
    const fake = fakePorts({ tags: { production: digest, [`sha-${previousCommit}`]: previous } });

    await deliver({ commit: previousCommit }, fake.ports);

    assert.deepEqual(fake.verified, [{ digest: previous, commit: previousCommit }]);
    assert.equal(fake.registry.tags.production, previous);
    assert.deepEqual(fake.deployed, [previous]);
    assert.deepEqual(fake.smoked, [previousCommit]);
  });

  test("com um commit que a `main` não publicou, nada muda", async () => {
    const unknown = "3".repeat(40);
    const fake = fakePorts();

    await assert.rejects(
      deliver({ commit: unknown }, fake.ports),
      /Não há imagem sha-3{40} no registro/,
    );
    assert.deepEqual(fake.verified, []);
    assert.equal(fake.registry.tags.production, previous);
    assert.deepEqual(fake.deployed, []);
  });

  test("se o smoke falha, volta ao digest que estava no ar antes do rollback", async () => {
    const fake = fakePorts({
      tags: { production: digest, [`sha-${previousCommit}`]: previous },
      smokeFailures: ["A Home respondeu 500, não 200 com HTML."],
    });

    await assert.rejects(
      deliver({ commit: previousCommit }, fake.ports),
      /voltou ao digest anterior/,
    );
    assert.equal(fake.registry.tags.production, digest);
    assert.deepEqual(fake.deployed, [previous, digest]);
  });
});
