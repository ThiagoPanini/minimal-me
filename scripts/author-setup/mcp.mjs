// O login OAuth dos MCPs remotos: os servidores http do `.mcp.json`, conferidos um a um por
// `claude mcp get`, que só lê o estado da conexão.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

/** @typedef {"connected" | "needs-auth" | "failed" | "unavailable"} McpStatus */

/** @returns {string[]} */
export function remoteServersOf(configText) {
  const servers = JSON.parse(configText).mcpServers ?? {};
  return Object.entries(servers)
    .filter(([, server]) => server.type === "http" || server.type === "sse")
    .map(([name]) => name);
}

/** @returns {McpStatus} */
export function parseMcpStatus(output) {
  const status = output.match(/^\s*Status:\s*(.+)$/m)?.[1] ?? "";
  if (/needs auth/i.test(status)) return "needs-auth";
  if (/\bconnected\b/i.test(status) && !/fail|not connected|disconnected/i.test(status)) {
    return "connected";
  }
  return "failed";
}

/** Lê os MCPs remotos do repositório e o estado de cada um pelo comando `claude`. */
export function createMcpReader(repositoryRoot) {
  const remoteServers = remoteServersOf(
    readFileSync(path.join(repositoryRoot, ".mcp.json"), "utf8"),
  );
  return {
    remoteServers,
    /** @returns {Promise<McpStatus>} */
    async status(name) {
      const result = spawnSync("claude", ["mcp", "get", name], {
        cwd: repositoryRoot,
        encoding: "utf8",
        timeout: 60_000,
      });
      if (result.error?.code === "ENOENT") return "unavailable";
      return parseMcpStatus(`${result.stdout ?? ""}\n${result.stderr ?? ""}`);
    },
  };
}
