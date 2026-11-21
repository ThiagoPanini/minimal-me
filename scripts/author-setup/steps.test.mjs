// A URL do Coolify mora numa constante dos scripts (`coolifyUrl`). Os workflows da entrega e do
// rollback a escrevem no COOLIFY_URL, porque o YAML não importa do script: este teste prende as
// duas cópias à constante.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { coolifyUrl } from "./steps.mjs";

const workflowsDir = path.resolve(import.meta.dirname, "../../.github/workflows");

test("every workflow that delivers uses the Coolify URL of the scripts", () => {
  const found = readdirSync(workflowsDir)
    .filter((file) => file.endsWith(".yml"))
    .flatMap((file) =>
      [
        ...readFileSync(path.join(workflowsDir, file), "utf8").matchAll(/COOLIFY_URL:\s*(\S+)/g),
      ].map(([, url]) => ({ file, url })),
    );

  assert.ok(found.length > 0, "Nenhum workflow define COOLIFY_URL.");
  for (const { file, url } of found) {
    assert.equal(url, coolifyUrl, `${file} entrega num Coolify diferente do de steps.mjs`);
  }
});
