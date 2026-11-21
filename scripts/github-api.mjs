// O cliente REST do GitHub que os scripts dividem: a preparação única do Autor (a leitura com o
// login do `gh` e o GitHub App do merge automático) e a nova tentativa do workflow `retry`. Só
// `fetch`, sem pacote: o job do `retry` não instala dependências.

export const githubApiUrl = "https://api.github.com";

const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "minimal-me-scripts",
};

/** O corpo em JSON, ou `null` quando vem vazio ou não é JSON (uma página de erro, por exemplo). */
function parseBody(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * @typedef {{ status: number, body: any, text: string }} GitHubResponse
 * @param {{ token?: string, apiUrl?: string }} [options] sem `token`, o pedido vai sem login
 */
export function createGitHubApi({ token, apiUrl = githubApiUrl } = {}) {
  /**
   * Responde com o status e o corpo, qualquer que seja o status: quem chama decide o que aceita.
   * @returns {Promise<GitHubResponse>}
   */
  async function request(method, path, body) {
    const response = await fetch(`${apiUrl}${path}`, {
      method,
      headers: token ? { ...headers, Authorization: `Bearer ${token}` } : headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return { status: response.status, body: parseBody(text), text };
  }

  /** Como `request`, mas falha fora de 2xx, com o começo da resposta, e devolve só o corpo. */
  async function call(method, path, body) {
    const response = await request(method, path, body);
    if (response.status < 200 || response.status > 299) {
      const detail = response.text.slice(0, 200);
      throw new Error(`${method} ${path} respondeu ${response.status}: ${detail}`);
    }
    return response.body;
  }

  return { request, call };
}
