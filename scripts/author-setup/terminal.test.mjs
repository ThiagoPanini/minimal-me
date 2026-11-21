// A leitura do bloco colado, com a entrada de um terminal falso: ela para na linha END mesmo
// quando o terminal põe as marcas de colagem nela ou junta o bloco numa linha só.
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { describe, test } from "node:test";
import { readBlock } from "./terminal.mjs";

describe("pasted block", () => {
  test("stops at the END line that carries the terminal paste mark", async () => {
    const input = Readable.from([
      "\u001b[200~-----BEGIN CERTIFICATE-----\r\nMIIC\r\n-----END CERTIFICATE-----\u001b[201~\n",
      "o que vem depois\n",
    ]);
    const block = await readBlock(input);
    assert.match(block, /END CERTIFICATE/);
    assert.ok(!block.includes("o que vem depois"));
  });

  test("stops at a block pasted on one line", async () => {
    const input = Readable.from([
      "-----BEGIN CERTIFICATE-----MIIC-----END CERTIFICATE-----\n",
      "o que vem depois\n",
    ]);
    assert.equal(
      await readBlock(input),
      "-----BEGIN CERTIFICATE-----MIIC-----END CERTIFICATE-----\n",
    );
  });
});
