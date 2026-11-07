# Coolify e Cloudflare com o layout candidato

Pesquisa do ticket [#8](https://github.com/ThiagoPanini/minimal-me/issues/8), parte do mapa #1. Fatos e restrições extraídos da documentação oficial do Coolify (coolify.io/docs) e da Cloudflare (developers.cloudflare.com), mais o que os projetos `panlabs-tech` documentam sobre o deploy de hoje. Sem decisão: cada afirmação cita URL ou caminho. Onde o texto infere algo que a página não diz com todas as letras, está marcado como **inferência**.

Layouts candidatos (do ticket): **(A)** monorepo com workspaces pnpm, `apps/web` (Next.js, Dockerfile próprio) e `apps/api` (Python, Dockerfile próprio), molde dos projetos panlabs-tech; **(B)** aplicação única.

## Retomada

- **Estado**: em andamento.
- **Coberto**: seções 1, 2, 3, 4, 5, 7, 8, 9 (Coolify), 14 (panlabs, parcial: ethitorial ADRs 0003/0005/0006 e os três `deploy.yml`).
- **Pendente**: 6 (proxy Traefik/Caddy, certificados, Cloudflare na doc do Coolify), 10–13 (Cloudflare), complemento da 14 (travelmanager ADR 0008, LUC ADR 0001/0014, Dockerfiles, `docs/agents/workflow.md`), 15 (síntese).
- **Onde continuar**: buscar `coolify.io/docs` sobre proxy/SSL/Cloudflare e `developers.cloudflare.com` (ssl-modes, origin-ca, proxy-status, connection-limits, websockets, tunnel); depois escrever 10–13 e 15.
- **Data**: 2026-11-07.

## 1. Coolify: aplicação a partir de repositório GitHub público

Fonte: https://coolify.io/docs/knowledge-base/git/github/integration e subpáginas.

- O Coolify oferece **quatro caminhos** para GitHub: repositório público (URL), deploy key ("One private repository or an organization where you cannot install an app"), GitHub App (repositórios públicos ou privados selecionados, "with push and pull request events") e GitHub Actions (o GitHub constrói e publica a imagem; o Coolify só implanta). A GitHub App é descrita como a integração mais completa: "Its repository installation controls which repositories Coolify can list and clone." (https://coolify.io/docs/knowledge-base/git/github/integration)
- **Repositório público via URL** (https://coolify.io/docs/applications/sources/github/public-repository): `+ New` → "Public Repository" → servidor → colar a URL → **Check Repository** → escolher build pack, porta interna, base directory → domínio e variáveis → deploy. A branch padrão é `main`; outra branch entra pela própria URL (`/tree/next`). Em monorepos, "set the Base directory" e usar **Scan again**. Um **Smart Scan** sugere configuração de Dockerfile/Compose. A página não menciona auto-deploy nem previews; isso fica nas páginas próprias (seções 7 e 8).
- **GitHub App** (https://coolify.io/docs/applications/sources/github/app): "A GitHub App gives Coolify access to one repository, selected repositories, or every repository". Permissões: Contents (read-only), Metadata (read-only), Email addresses (read-only), Pull requests (read & write, apenas se houver preview deployments). Eventos: Push e, para previews, Pull request. A instalação automatizada pede a URL base do Coolify para o webhook; a manual usa `https://coolify.example.com/webhooks/source/github/events`. Aviso: "Repository access can work while automatic and preview deployments fail if GitHub cannot reach this endpoint." O recurso criado chama-se "Private Repository (with GitHub App)"; a página não afirma nem nega uso com repositório público (um repositório público pode ser instalado na App, mas a página não discute esse caso). Em monorepos: "set the correct Base directory before using Smart Scan".
- **GitHub Actions** (https://coolify.io/docs/applications/sources/github/actions): "GitHub Actions builds the image, so Coolify must deploy the published image instead of rebuilding the same source." O Coolify recebe a imagem como aplicação **Docker Image** ou Compose com `image:` em vez de `build:`. O workflow chama a **Deploy webhook URL** (copiada em *Application > Webhooks*) com `Authorization: Bearer <token>`; o token vem de *Keys & Tokens > API Tokens* com permissão **Deploy**. Em self-hosted, a API precisa estar ativa em *Settings > Advanced > API and MCP > API access*. Para imagem privada no GHCR, o servidor de deploy precisa de `docker login ghcr.io`. Recomendações: "Keep the Coolify request after tests, security checks, the image build, and the registry push"; usar tag por commit para release imutável; "Do not commit either value to the workflow file."
- **Watch Paths** (filtro de deploy por caminho alterado) só existe para fontes GitHub App ou GitLab; "não aparece para URL pública de repositório nem para deploy key" (https://coolify.io/docs/applications/configuration/general). Relevante para o layout A: com repositório público via URL, qualquer push dispara deploy de **todas** as aplicações ligadas ao repositório.

## 2. Coolify: monorepo e base directory

Fonte principal: https://coolify.io/docs/applications/configuration/general.

- **Base Directory** define o diretório do repositório tratado como raiz da aplicação: "Use `/` for the repository root or a path such as `/apps/api` for a monorepo application."
- **Base Directory também é o contexto de build do Docker**: "Base Directory also defines the build context available to `COPY` and `ADD` instructions." Na página do build pack Dockerfile: "Set **Base Directory** to the repository directory Docker should use as the build context." (https://coolify.io/docs/applications/builds/dockerfile)
- **Dockerfile Location** é combinado com o Base Directory: `Base Directory: /apps/api` + `Dockerfile Location: /docker/Dockerfile` → `/apps/api/docker/Dockerfile`. Ambos começam com `/`. Há **Docker Build Stage Target** para escolher um estágio de Dockerfile multi-stage.
- **Docker Compose Location** segue a mesma combinação (`/deploy` + `/compose.yaml` → `/deploy/compose.yaml`).
- **Consequência para workspaces pnpm (inferência a partir das regras acima)**: um Dockerfile de `apps/web` que precise de `pnpm-workspace.yaml`, `pnpm-lock.yaml` e `package.json` da raiz só os enxerga se o contexto for a raiz. Isso implica `Base Directory = /` e `Dockerfile Location = /apps/web/Dockerfile`, e não `Base Directory = /apps/web`. Os projetos panlabs-tech fazem exatamente isso no CI: `context: .` com `file: apps/web/Dockerfile` (ver seção 14). Para `apps/api` (Python isolado), `Base Directory = /apps/api` funciona se o Dockerfile não depender de nada da raiz; o ethitorial usa `context: apps/api`.
- **Nixpacks** exige manifesto e lockfile dentro do Base Directory: "The manifest and lockfile must be inside the configured Base Directory" (https://coolify.io/docs/applications/builds/nixpacks/overview). Num workspace pnpm, o lockfile fica na raiz, o que conflita com Base Directory `/apps/web` (inferência).
- **Uma aplicação Coolify = um container/imagem** (Nixpacks, Railpack, Static e Dockerfile "geram uma única imagem"; só Docker Compose define vários serviços) (https://coolify.io/docs/applications/builds/overview). Portanto, o layout A com dois Dockerfiles vira **duas aplicações Coolify** apontando para o mesmo repositório com base directory/Dockerfile diferentes, ou **uma aplicação Docker Compose** com dois serviços.
- **Watch Paths**: "um padrão por linha", filtra "quais alterações podem disparar deploy por webhook"; padrões avaliados em ordem, "usam o último que casar", com `*`, `**`, `?` e `!`. Disponível só com GitHub App ou GitLab (https://coolify.io/docs/applications/configuration/general). Sem Watch Paths, dois apps no mesmo repositório recebem deploy a cada push, mesmo quando só um mudou.
- A página dedicada a monorepo que existia em `coolify.io/docs/knowledge-base/monorepo` retorna 404 hoje (verificado em 2026-11-07); o conteúdo foi absorvido pelas páginas acima.

## 3. Coolify: build packs (Dockerfile, Docker Compose, Nixpacks)

Fonte: https://coolify.io/docs/applications/builds/overview e subpáginas.

| Build pack | Quando se aplica (texto da doc) | Observações |
|---|---|---|
| **Nixpacks** | "The codebase follows a supported language or framework convention." | Gera um Dockerfile a partir do código. "Railway states that Nixpacks is not under active development"; "Coolify still supports Nixpacks". Configuração por `nixpacks.toml`/`nixpacks.json` na raiz do diretório de origem; variáveis `NIXPACKS_*` precisam de "Available during build". (https://coolify.io/docs/applications/builds/nixpacks/overview) |
| **Railpack (Beta)** | "The repository is supported by Railway's newer automatic build system." | Sucessor recomendado do Nixpacks; `railpack.json`. |
| **Static** | "The repository contains the finished website files." | Serve com `nginx:alpine`; **Publish Directory** obrigatório em modo estático. |
| **Dockerfile** | "The repository contains one custom image definition used with Coolify runtime settings." | Uma imagem por aplicação. Detalhes abaixo. |
| **Docker Compose** | "The application needs a Compose definition with one or more services." | Cada serviço pode fazer `build:` ou puxar `image:`. Detalhes abaixo. |
| **Docker Image** | Sem build: "the image already exists in a registry". | Caminho usado com GitHub Actions + GHCR. |

Regra de decisão da própria doc: Nixpacks/Railpack quando a detecção automática basta; Dockerfile/Compose quando o repositório precisa definir a imagem ou a topologia de serviços. O seletor de build pack fica indisponível depois de criada uma aplicação Docker Image; "para mudar o método, é preciso criar outra aplicação" (https://coolify.io/docs/applications/configuration/general).

**Dockerfile** (https://coolify.io/docs/applications/builds/dockerfile):
- Caminho = Base Directory + Dockerfile Location; Base Directory é o build context (seção 2).
- "Coolify uses the first `EXPOSE` instruction as the initial **Ports Exposes** value." Sem `EXPOSE`, "the initial port is `80`". "The process must listen on `0.0.0.0`, not only `127.0.0.1`, for the Coolify proxy to reach it."
- Build args: em *Advanced > Build*, "Managed manually in Dockerfile" quando o Dockerfile declara todos os `ARG`. "`SOURCE_COMMIT` is excluded from the build by default so commits with unchanged layers can reuse cache." Segredos de build via Docker BuildKit secrets; "Do not copy production secrets into the Dockerfile or image layers."
- Pre-deployment command é pulado quando não há container atual (inclui o primeiro deploy); post-deployment que falha só é registrado no log.
- "A plain Node.js process uses one CPU core."

**Docker Compose** (https://coolify.io/docs/applications/builds/docker-compose):
- Domínio por serviço: em **Domains** escolhe-se o **Service**, protocolo, hostname, porta interna e caminho; sufixo `:3000` no domínio diz ao proxy qual porta do container recebe a requisição. O Coolify gera as "proxy labels" quando ausentes.
- Variáveis mágicas: `SERVICE_URL_<ID>`, `SERVICE_FQDN_<ID>`, `SERVICE_PASSWORD_<ID>` (32 chars; variantes `_64_`, `WITHSYMBOLS`), `SERVICE_USER_<ID>`, `SERVICE_BASE64_*`, `SERVICE_REALBASE64_*`, `SERVICE_HEX_*`. "Generated values persist between deployments and appear under **Environment Variables**."
- `${VAR}` cria variável editável vazia; `${VAR:-padrão}` define fallback; `${VAR:?}` bloqueia o deploy até haver valor. "Coolify keeps an existing value when the Compose definition is loaded again."
- Cada serviço precisa de `image:` ou `build:`. Build arguments só se aplicam a serviços com `build:`.
- Healthcheck vai no Compose ou no Dockerfile; "Aplicações Git-based [Compose] não usam a página padrão de **Healthcheck**". `exclude_from_hc: true` para containers pontuais (migrações).
- Rede: cada recurso Compose recebe uma rede própria; serviços falam pelo nome do serviço. **Connect to predefined network** só para alcançar outros recursos Coolify. "Do not publish a service with `ports:` unless it must be reachable directly on a server interface."
- "Aplicações Git com build pack Compose suportam deploys por branch, webhooks e previews." Compose Empty (sem Git) não.
- **Raw Compose Deployment**: "Raw (deploy file as-is)" aplica o arquivo quase sem modificações; "The definition must provide its own proxy labels, networking, and other required runtime configuration."
- Em previews com Compose, "cada serviço pode ter seu próprio domínio" (https://coolify.io/docs/applications/deployments/preview-deployments).

**Onde o build roda**: por padrão no servidor de deploy; um build server separado "cannot run deployed resources" (https://coolify.io/docs/applications/builds/overview). Com GitHub Actions o build sai da VPS inteiramente (seção 1).

## 4. Coolify: variáveis e segredos

Fonte: https://coolify.io/docs/applications/configuration/environment-variables.

- Seções separadas para **produção** e **preview**. **Normal view** (uma por vez) e **Developer view** (formato `.env`, cria/atualiza/remove para casar com o texto; segredos bloqueados e multilinha não editáveis ali).
- Flags no Developer view: `# coolify: literal buildtime=false` logo acima da variável; `literal` (padrão `false`), `buildtime` (padrão `true`), `runtime` (padrão `true`). "The `# coolify:` line must be directly above the variable line."
- **Build time vs runtime** são independentes; por padrão novas variáveis ficam "Available during build" e "Available in the container". Para segredos lidos só no start, desligar build time.
- **Segredo** = variável **Locked** (sem botão de cópia). **Interpolation** com modo "Literal (keep $ characters as-is)". **Value type: Multiline** para certificados/chaves.
- **Compartilhadas**: `{{environment.DATABASE_URL}}` e escopos team/project/environment/server; `{{vault.KEY}}` para Doppler/Infisical/HashiCorp Vault.
- **Predefinidas**: `COOLIFY_FQDN`, `COOLIFY_URL`, `COOLIFY_BRANCH`, `COOLIFY_RESOURCE_UUID`, `COOLIFY_CONTAINER_NAME`, `SOURCE_COMMIT` (excluída do build por padrão), `PORT` (primeira porta exposta) e `HOST` (`0.0.0.0`).
- Segurança: "Traditional Docker build arguments can appear in image metadata" → usar Docker BuildKit secrets para valores sensíveis de build. "Redaction is best effort" nos logs (valores curtos, < 8 bytes, podem vazar). A página não trata de `NEXT_PUBLIC_*`.
- Mudança de valor de build exige redeploy; só runtime, **Restart**.
- Restrição do projeto: o repositório minimal-me é público, então nenhum valor real pode viver em arquivo versionado; os projetos panlabs guardam só credenciais de dev local em `docker-compose.yml`/`.env.example` (seção 14).

## 5. Coolify: bancos gerenciados (Postgres) e alcance pela aplicação

Fonte: https://coolify.io/docs/databases/postgresql.

- O banco é implantado "as a standalone container on the selected server and destination". Fluxo: **New Resource → Databases → PostgreSQL** → servidor → destino de rede Docker → imagem → **Start**. Recebe senha gerada, volume persistente, URL interna e health check.
- Imagens: padrão `postgres:18-alpine`; seletor com 18, 17, 16 e variantes Supabase, PostGIS, PGVector.
- **Postgres URL (internal)**: `postgres://<username>:<password>@<database-container>:5432/<database>`, para aplicações "no mesmo destino de rede do Coolify"; o host é o nome do container do banco. **Postgres URL (public)** só com **Public through TCP proxy** e **Public port**. "Do not expose port `5432` unless an external client requires it; prefer private networking for application connections."
- Backups: `pg_dump` em formato custom por banco; **All databases** usa `pg_dumpall` + gzip; agendamento, retenção e destino S3 em "Database backups". Restauração pelo diálogo **Import backup** (`pg_restore`/`psql`); donos e privilégios só com **Keep owners and privileges**.
- Cuidados: alterar senha/usuário fora do Coolify quebra URLs e backups se não atualizar **General**; scripts de init só em diretório vazio; mudar imagem/porta/config exige reiniciar; SSL `verify-ca`/`verify-full` exige confiar na CA do Coolify.
- Observação operacional registrada pelo ethitorial (ADR 0003, seção 14): bancos recebem `container_name = <uuid>` e são resolvíveis pelo DNS do Docker; aplicações do tipo Docker Image **não** (nome com sufixo aleatório) e só viram host resolvível na rede `coolify` quando **Network Aliases** é preenchido com o próprio UUID. Isso importa para `web → api` interno no layout A quando os dois são aplicações separadas.

## 6. Coolify: domínios, proxy (Traefik/Caddy) e certificados

Fonte: https://coolify.io/docs/core/networking/domains (proxy e Cloudflare: pendente, ver Retomada).

- "The domain's DNS record points to the server running the resource." Portas 80 e 443 abertas no servidor; a aplicação escuta na porta de container usada pelo Coolify.
- **Wildcard Domain** por servidor (*Servers > General*) gera `https://<application-id>.<dominio>`. Sem ele, o Coolify gera `sslip.io` em HTTP: "The generated URL always uses `http://`"; não mudar para HTTPS porque o Let's Encrypt "rate-limits the entire shared `sslip.io` zone".
- Vários domínios por aplicação (**Add domain**), redirect www/não-www.
- **Docker Compose**: domínio por serviço (**Service**), bancos não são expostos por domínio.
- **Porta e caminho no domínio**: `https://app.exemplo.com:3000`, `https://exemplo.com:8080/api`; a porta escolhe a porta do container, "It does not create a public host-port mapping". Por padrão o prefixo é removido (`/api/users` chega como `/users`); *Advanced > Proxy* → "Keep paths as-is" mantém. Rotas mais específicas têm prioridade. Isso permite, no layout A, servir `web` em `/` e `api` em `/api` sob o mesmo hostname, ou usar `api.<dominio>` (inferência a partir das regras).
- **HTTPS**: valor `https://` faz o proxy configurar TLS; Traefik ou Caddy "requests and renews the certificate". Condições: hostname resolve "para o servidor ou para um CDN configurado", portas 80/443 chegam ao proxy, domínio está na configuração do recurso. A página não diz qual desafio ACME é o padrão; DNS challenge aparece só nos guias de wildcard.
- **Cloudflare DNS management**: com token de integração Cloudflare do time, o Coolify "pode criar, substituir e remover registros DNS gerenciados" a partir da página Domains.
- Proxy **Custom (None)**: roteamento e TLS por conta própria.
- _(pendente: página de proxies Traefik vs Caddy, Let's Encrypt troubleshooting, páginas Cloudflare do knowledge base do Coolify.)_

## 7. Coolify: deploy automático por push e webhooks

Fonte: https://coolify.io/docs/applications/sources/github/auto-deploy, https://coolify.io/docs/applications/configuration/advanced, https://coolify.io/docs/applications/sources/github/actions.

- Em *Advanced > Deployment*, "Deploy on push (webhooks)" "allows supported Git webhook events to start a deployment"; vem ativado por padrão, "mas a conexão com o repositório precisa ter um webhook funcional". Alternativa: **Manual deployments only**.
- Três formas de disparar: **GitHub App** (webhook automático), **GitHub Actions** (workflow chama a Deploy webhook URL após build/push), **webhook de repositório**: "Use this path for a public repository or a private repository connected through a deploy key."
- **Webhook manual** (repositório público/deploy key): *Webhooks* → "Webhook secret" na seção GitHub → copiar a URL em **Manual Git webhooks** → no GitHub, *Settings > Webhooks > Add webhook* → Payload URL + mesmo Secret → "Enable SSL verification" marcado → "Just the push event" → Active. O deploy dispara em push "to the configured branch". O secret "authenticates webhook deliveries".
- Para o webhook (manual ou da App) funcionar, o painel do Coolify precisa ser alcançável pelo GitHub (seção 1: "fail if GitHub cannot reach this endpoint"), o que implica expor o painel por domínio/HTTPS ou túnel.
- Deploy por API (GitHub Actions): `POST <COOLIFY_URL>/api/v1/deploy?uuid=<uuid>&force=true` com Bearer token, conforme usado pelos três `deploy.yml` panlabs (seção 14); a doc oficial manda copiar a URL do painel.

## 8. Coolify: preview deployments

Fonte: https://coolify.io/docs/applications/deployments/preview-deployments, https://coolify.io/docs/applications/configuration/advanced.

- Toggle "Enable preview deployments" e escolha de acesso: **Repository members only** ("Coolify blocks pull requests from forks unless the author is a repository owner, member, or collaborator") ou **Public (fork PRs allowed)**. Aviso: "Public previews can run contributor-controlled code" e credenciais de produção não devem ser expostas a previews.
- **GitHub App não é obrigatória**: "Use this path [webhook de repositório] for an application created from a public repository URL or *Private Repository (with deploy key)*." Porém "The UI's pull-request listing and status updates are available for GitHub App sources" e "automated pull-request comments require a GitHub App with the required permissions". Previews também podem ser disparados via API com `pull_request_id`.
- Template de URL: `{{pr_id}}`, `{{random}}`, `{{domain}}`; "The default template is `{{pr_id}}.{{domain}}`". Exige DNS wildcard: "create an `A` or `AAAA` record for `*.preview.example.com` that points to the deployment server." Em Compose, cada serviço pode ter domínio próprio.
- Variáveis separadas para preview; "Use non-production credentials for preview databases, storage, and external services." "A preview container is temporary, but data written to an external service can remain after Coolify deletes the preview."
- Limpeza: "Coolify deletes an automatically created preview after its pull request or merge request is closed or merged"; remove só containers/redes/volumes que criou. PRs abertos antes da ativação exigem **Load Pull Requests**.
- Relevante para o layout A: um preview por aplicação, então um PR que toque `web` e `api` gera dois previews independentes (um por recurso Coolify); o preview do `web` precisa saber apontar para o preview do `api` ou para o `api` de produção (inferência; a doc não trata de coordenação entre recursos). Com Compose, o preview sobe os dois serviços juntos.

## 9. Coolify: recursos mínimos do servidor

Fonte: https://coolify.io/docs/get-started/installation.

- "Coolify needs 2 CPU cores, 2 GB RAM, and 10 GB disk space to run." "Keep additional space for Docker images, volumes, and backups." Arquiteturas amd64 e arm64; "Coolify only runs on Linux-based operating systems" (Debian/Ubuntu, família Red Hat, SUSE, Arch, Alpine, Raspberry Pi OS 64 bits).
- "Coolify can run on smaller servers (for example: 1 CPU core, 512 MB RAM, 4 GB disk), but this is not recommended."
- "The resources you need depend on your projects." Se build e Coolify rodam no mesmo servidor, monitorar recursos. Sugestão de economia: começar com 1 core e 1 GB e crescer conforme a carga.
- Instalação: `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash` como root/sudo; painel em `http://<server-ip>:8000`; criar o admin imediatamente.
- Portas: a página cita SSH (22) e 8000; as demais estão na página de firewall (pendente).
- Referência prática panlabs: VPS Hostinger KVM 2 (2 vCPU, 8 GB RAM, 100 GB NVMe) com Coolify estimado em ~500 MB RAM de overhead, hospedando **vários** projetos (seção 14).

## 10. Cloudflare: DNS para a VPS, proxied vs DNS only

_(pendente)_

## 11. Cloudflare: SSL (Flexible/Full/Full strict), origin certificates e o Traefik do Coolify

_(pendente)_

## 12. Cloudflare: websockets, tamanho de upload e timeouts atrás do proxy

_(pendente)_

## 13. Cloudflare Tunnel como alternativa

_(pendente)_

## 14. Como os projetos panlabs-tech fazem deploy hoje

Fontes locais (somente leitura): `/home/paninit/workspaces/panlabs-tech/{ethitorial,travelmanager,life-under-control}`.

### Infra documentada (ethitorial, ADRs)

- `ethitorial/docs/adr/0003-infra-hostinger-vps-coolify.md`: VPS Hostinger "KVM 2 — 2 vCPU, 8 GB RAM, 100 GB NVMe" com Ubuntu 24.04; Coolify como PaaS; "Traefik (default do Coolify) como reverse proxy com SSL automático (Let's Encrypt)"; PostgreSQL 17 gerenciado pelo Coolify; backups diários para R2. Deploy: "GitHub Actions builda imagens → push para GHCR → Coolify recebe webhook → puxa imagem e faz rolling restart com health checks."
- Mesmo ADR, "Substrato compartilhado": a VPS é "infraestrutura compartilhada, não um projeto". Uma instância Coolify hospeda N projetos, cada um com um *Coolify Project*, uma zona DNS própria na Cloudflare ("todas apontando para o IP da VPS, `Full (Strict)`, origem fechada aos ranges Cloudflare") e databases Postgres separadas no mesmo servidor. Painel Coolify em `vps.panlabs.tech`; projetos em `<projeto>.panlabs.tech`; imagens em `ghcr.io/<dono-do-repositório>/`.
- Mesmo ADR, "Invariante de deploy": apps Docker Image precisam de **Network Aliases = <uuid>** para serem alcançadas por outra app pela rede `coolify`; aplicado em `ethitorial-api`.
- Mesmo ADR, "Histórico 2026-05-24": correção de Caddy → Traefik citando a doc do Coolify (Traefik default, Caddy experimental). "Emenda 2026-07-28": a migração para a org `panlabs-tech` quebrou o push para GHCR por namespace cravado; o workflow passou a usar `${{ github.repository_owner }}`.
- Mesmo ADR, SSH: "Coolify usa SSH como `root` para se conectar ao host"; hardening exige `Match Address 172.16.0.0/12` com `PermitRootLogin prohibit-password`, chave do Coolify em `/root/.ssh/authorized_keys` e `ignoreip = 172.16.0.0/12` no fail2ban.
- `ethitorial/docs/adr/0006-cloudflare-na-frente-da-vps.md`: Cloudflare como DNS autoritativo, proxy reverso ("orange cloud" ligado), CDN e WAF/DDoS no free tier; "**Modo TLS:** `Full (Strict)`"; origem escondida: "Firewall da VPS aceita 80/443 **somente de IP ranges da Cloudflare**" ou `cloudflared tunnel`. Implicações: ler `CF-Connecting-IP` em vez de `X-Forwarded-For`; "nunca cachear path com `set-cookie`"; Tunnel registrado como opção válida a reabrir "se hardening do firewall ficar incômodo".
- `ethitorial/docs/adr/0005-deploy-checks-em-tres-portoes.md`: três portões (Lefthook local → `pr-checks.yml` no push → `deploy.yml` no merge em `main`). Sem `develop`/`staging`. Preview por PR foi **deferido** ("entra quando houver código que justifique"). Emendas: approvals = 0 (solo), PR automático, merge autônomo de PR verde.

### Workflow de deploy (os três repositórios, idêntico em forma)

- `ethitorial/.github/workflows/deploy.yml`, `travelmanager/.github/workflows/deploy.yml`, `life-under-control/.github/workflows/deploy.yml`: `on: push: branches: [main]`; job `build-push` com matriz `[web, api]` (LUC usa dois jobs); `docker/build-push-action` com `push: true` para `ghcr.io/${{ github.repository_owner }}/<projeto>-<app>` nas tags `latest` e `sha`; cache `type=gha`.
- **Contexto de build**: `context: ${{ matrix.app == 'web' && '.' || format('apps/{0}', matrix.app) }}` e `file: apps/${{ matrix.app }}/Dockerfile`. Comentário no ethitorial: "web precisa do contexto na raiz para enxergar content/ ...; api segue com contexto próprio". No LUC os dois usam `context: .`.
- Job `deploy`: guardado por `secrets.COOLIFY_TOKEN != ''`; dispara `curl -X POST -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/deploy?uuid=$UUID&force=true"` para o `api` e depois o `web` (um UUID por aplicação Coolify: `COOLIFY_API_UUID`, `COOLIFY_WEB_UUID`); smoke test com `curl` no domínio público em laço de até 15–30 tentativas.
- Ou seja: hoje o Coolify **não constrói** nada; recebe imagens prontas (aplicações do tipo Docker Image) e é acionado pela API. Duas aplicações Coolify por projeto (web e api), ambas no mesmo repositório.

### Compose local

- `ethitorial/docker-compose.yml`: `web` (build `context: .`, `dockerfile: apps/web/Dockerfile`, `ETHITORIAL_API_URL: http://api:8000`), `api` (build `./apps/api`, `DATABASE_URL: postgresql+asyncpg://...@postgres:5432/...`), `postgres:17`. É stack de desenvolvimento; credenciais de dev versionadas.
- `life-under-control/docker-compose.yml`: Postgres 16 + MinIO para o loop local; perfil `full` builda a imagem de produção (`apps/web/Dockerfile`, contexto raiz).

_(pendente: travelmanager ADR 0008, LUC ADRs 0001/0014, Dockerfiles, `docs/agents/workflow.md` sobre Coolify MCP.)_

## 15. Síntese: restrições que separam os layouts A e B

_(pendente)_
