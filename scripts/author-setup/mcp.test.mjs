// A conferência do login dos MCPs remotos lê o `.mcp.json` e a saída de `claude mcp get`.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { parseMcpStatus, remoteServersOf } from "./mcp.mjs";

describe("MCPs remotos", () => {
  test("os remotos são os servidores http do .mcp.json", () => {
    const config = JSON.stringify({
      mcpServers: {
        hostinger: { type: "http", url: "https://mcp.hostinger.com" },
        cloudflare: { type: "http", url: "https://mcp.cloudflare.com/mcp" },
        coolify: { type: "stdio", command: "npx" },
      },
    });
    assert.deepEqual(remoteServersOf(config), ["hostinger", "cloudflare"]);
  });

  test("lê conectado, login pendente e falha na saída do claude", () => {
    const output = (status) =>
      `cloudflare:\n  Scope: Project config (shared via .mcp.json)\n  Status: ${status}\n  Type: http\n`;
    assert.equal(parseMcpStatus(output("✔ Connected")), "connected");
    assert.equal(parseMcpStatus(output("△ Needs authentication")), "needs-auth");
    assert.equal(parseMcpStatus(output("✘ Failed to connect")), "failed");
    assert.equal(parseMcpStatus('No MCP server named "cloudflare".'), "failed");
  });
});
