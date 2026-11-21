// O cliente REST do GitHub dos scripts, contra um servidor local no lugar da API.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, describe, test } from "node:test";
import { createGitHubApi } from "./github-api.mjs";

// O que o servidor responde em cada caminho: status e corpo.
const routes = {
  "/ok": [200, '{"name":"minimal-me"}'],
  "/created": [201, ""],
  "/missing": [404, '{"message":"Not Found"}'],
  "/gateway": [502, "<html>bad gateway</html>"],
};

describe("GitHub REST client shared by the scripts", () => {
  /** @type {import("node:http").Server} */
  let server;
  let apiUrl = "";
  /** @type {{ method?: string, url?: string, headers: import("node:http").IncomingHttpHeaders, body: string }[]} */
  const requests = [];

  before(async () => {
    server = createServer((request, response) => {
      let body = "";
      request.on("data", (chunk) => {
        body += chunk;
      });
      request.on("end", () => {
        requests.push({ method: request.method, url: request.url, headers: request.headers, body });
        const [status, text] = routes[request.url ?? ""] ?? [500, ""];
        response.writeHead(status, { "Content-Type": "application/json" });
        response.end(text);
      });
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(undefined)));
    const address = /** @type {import("node:net").AddressInfo} */ (server.address());
    apiUrl = `http://127.0.0.1:${address.port}`;
  });

  after(() => server.close());

  test("sends the API version and the token, and reads the JSON body", async () => {
    const github = createGitHubApi({ token: "token-de-teste", apiUrl });

    assert.deepEqual(await github.call("POST", "/ok", { draft: false }), { name: "minimal-me" });
    const [request] = requests.splice(0);
    assert.equal(request.method, "POST");
    assert.equal(request.headers.authorization, "Bearer token-de-teste");
    assert.equal(request.headers["x-github-api-version"], "2022-11-28");
    assert.equal(request.headers.accept, "application/vnd.github+json");
    assert.equal(request.body, '{"draft":false}');
  });

  test("without a token, the request goes without Authorization", async () => {
    await createGitHubApi({ apiUrl }).request("GET", "/ok");
    const [request] = requests.splice(0);
    assert.equal(request.headers.authorization, undefined);
    assert.equal(request.body, "");
  });

  test("request returns any status, with an empty or non-JSON body as null", async () => {
    const github = createGitHubApi({ token: "token-de-teste", apiUrl });

    assert.deepEqual(await github.request("GET", "/missing"), {
      status: 404,
      body: { message: "Not Found" },
      text: '{"message":"Not Found"}',
    });
    assert.equal((await github.request("POST", "/created")).body, null);
    assert.equal((await github.request("GET", "/gateway")).body, null);
    requests.splice(0);
  });

  test("call fails outside 2xx with the method, the path, the status and the start of the answer", async () => {
    const github = createGitHubApi({ token: "token-de-teste", apiUrl });

    assert.equal(await github.call("POST", "/created"), null);
    await assert.rejects(github.call("GET", "/gateway"), {
      message: "GET /gateway respondeu 502: <html>bad gateway</html>",
    });
    requests.splice(0);
  });
});
