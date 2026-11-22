# Operações: Coolify e Cloudflare

Referência dos tickets `Operação: ...` (fora do `/implement-spec`). O agente os executa pelos MCPs do Coolify e da Cloudflare e lê o resultado de volta. O que está aqui é o que nenhuma configuração confessa.

## Receita

1. Ler o ticket e a seção da #57 que ele cita.
2. Conferir cada fato de Cloudflare ou Coolify nas docs (seção "Docs").
3. Escrever o teste de aceitação contra a URL pública (a costura 3 dos tickets) e rodá-lo até ver vermelho.
4. Aplicar pelo MCP e ler de volta da API.
5. Rodar o teste até ficar verde. O que o Visitante vê no navegador (console, CSP, beacon) pede um Chromium de verdade.
6. Fechar com um comentário, no modelo dos fechamentos do #76 e do #77: o que foi feito, a prova de cada critério, cada hipótese do ticket como confirmada, não testada ou com desvio, e os achados. Depois `gh issue close`.

Pronto quando cada critério de aceitação tem a sua prova no comentário.

## Ferramentas

Os MCPs são ferramentas deferidas e voltam a sê-lo depois de uma compactação. Carregue a família inteira de uma vez com `ToolSearch`:

- Cloudflare: `select:mcp__cloudflare__docs,mcp__cloudflare__search,mcp__cloudflare__execute`
- Coolify: `select:mcp__coolify__search_docs,mcp__coolify__application,mcp__coolify__get_application,mcp__coolify__projects,mcp__coolify__environments,mcp__coolify__logs,mcp__coolify__list_servers,mcp__coolify__get_server,mcp__coolify__diagnose_server`

## Docs

- **Cloudflare `docs`**: cada consulta devolve de 19 a 31 KB (medido em 2026-11-22), com trechos de produtos sem relação. Faça uma consulta por fato, com o produto e o termo exato.
- **Uma página conhecida**: o agente `web-fetch` devolve só a resposta, cerca de 100 palavras (testado em `developers.cloudflare.com/web-analytics/faq/`). Quando a resposta precisa ser exaustiva, peça a lista completa: nesse teste o resumo deixou de fora uma das duas causas que a página dá.
- **Coolify**: `search_docs` acha a página; o detalhe vem da URL, pelo `web-fetch`, ou do código da tag que roda na VPS.

## Coolify

Vistas na 4.7.6. A VPS atualiza o Coolify sozinha, então confira o que mudou antes de confiar numa linha.

- O `create_dockerimage` do MCP descarta `limits_*`. Aplique por `curl -X PATCH <URL do Coolify>/api/v1/applications/<uuid>` com o `COOLIFY_ACCESS_TOKEN` de `~/.config/secrets/mcp.env` e leia de volta.
- A `description` não aceita dois-pontos.
- O `health_check_host` é `127.0.0.1`. O nginx escuta só em IPv4 e o `localhost` do Alpine resolve para `::1`: com `localhost` o contêiner fica `unhealthy` e o smoke vê 503.
- O `traefik_certificate_resolver` da aplicação é `"none"`. Com `null` ela herda o `letsencrypt` do servidor, e o certificado da origem é o Origin Certificate já carregado no Traefik.
- Logo depois de um deploy o status ainda é o anterior (`exited:unhealthy`) por alguns segundos: releia antes de concluir.

## Cloudflare

- **Nome sem origem** (`www.minimalme.dev`, `minimal-me.panlabs.tech`): registro A proxied para `192.0.2.1`, que nunca recebe tráfego, e uma Regra de Redirecionamento dinâmica na fase `http_request_dynamic_redirect` da zona.
- **Beacon do Web Analytics**: entra na resposta só quando a requisição pede HTML. Um `curl` puro, ou só com `User-Agent`, vê a página sem o script; use `-H 'Accept: text/html'`. O `Cache-Control: no-transform` também o barra, e o HTML precisa ser válido.
- O comentário de um registro DNS tem no máximo 100 caracteres.
- **Analytics por API**: `POST /graphql` pelo `cloudflare.request` do `execute`. O `siteTag` vem de `GET /accounts/<conta>/rum/site_info/list`, e o LCP sai em microssegundos (2608000 é 2,6 s).

  ```graphql
  query ($account: String!, $site: String!, $since: Time!) {
    viewer { accounts(filter: { accountTag: $account }) {
      rumPageloadEventsAdaptiveGroups(filter: { siteTag: $site, datetime_geq: $since }, limit: 20) {
        count
        sum { visits }
      }
      rumWebVitalsEventsAdaptiveGroups(filter: { siteTag: $site, datetime_geq: $since }, limit: 5) {
        count
        quantiles { largestContentfulPaintP75 }
      }
    } }
  }
  ```

## Conferir a URL pública daqui

- O resolvedor local guarda o NXDOMAIN de um nome recém-criado. Resolva por `dig +short @1.1.1.1 <nome> A` e fixe o IP com `curl --resolve <nome>:443:<ip>`; no Chromium, com `--host-resolver-rules="MAP <nome> <ip>"`.
- Chromium: o `playwright-core` do pnpm store (`node_modules/.pnpm/playwright-core@<versão>/node_modules/playwright-core/`, por `createRequire`) com os navegadores de `~/.cache/ms-playwright`. Ouça `console`, `pageerror`, `requestfailed` e o evento `securitypolicyviolation` da página.
