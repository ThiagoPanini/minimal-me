# Coolify e Cloudflare com o layout candidato

Pesquisa do ticket [#8](https://github.com/ThiagoPanini/minimal-me/issues/8), parte do mapa #1. Fatos e restrições extraídos da documentação oficial do Coolify (coolify.io/docs) e da Cloudflare (developers.cloudflare.com), mais o que os projetos `panlabs-tech` documentam sobre o deploy de hoje. Sem decisão: cada afirmação cita URL ou caminho. Onde o texto infere algo que a página não diz com todas as letras, está marcado como **inferência**. Páginas lidas em 2026-11-07.

Layouts candidatos (do ticket): **(A)** monorepo com workspaces pnpm, `apps/web` (Next.js, Dockerfile próprio) e `apps/api` (Python, Dockerfile próprio), molde dos projetos panlabs-tech; **(B)** aplicação única.

## Retomada

- **Estado**: completo.
- **Coberto**: seções 1–15.
- **Pendente**: nada. Lacunas conhecidas registradas no corpo: a doc do Coolify não trata de coordenação de previews entre duas aplicações do mesmo repositório; a doc da Cloudflare consultada não detalha o timeout ocioso de WebSocket em segundos.
- **Data**: 2026-11-07.

## 1. Coolify: aplicação a partir de repositório GitHub público

Fonte: https://coolify.io/docs/knowledge-base/git/github/integration e subpáginas.

- O Coolify oferece **quatro caminhos** para GitHub: repositório público (URL), deploy key ("One private repository or an organization where you cannot install an app"), GitHub App (repositórios públicos ou privados selecionados, "with push and pull request events") e GitHub Actions (o GitHub constrói e publica a imagem; o Coolify só implanta). A GitHub App é descrita como a integração mais completa: "Its repository installation controls which repositories Coolify can list and clone." (https://coolify.io/docs/knowledge-base/git/github/integration)
- **Repositório público via URL** (https://coolify.io/docs/applications/sources/github/public-repository): `+ New` → "Public Repository" → servidor → colar a URL → **Check Repository** → escolher build pack, porta interna, base directory → domínio e variáveis → deploy. A branch padrão é `main`; outra branch entra pela própria URL (`/tree/next`). Em monorepos, "set the Base directory" e usar **Scan again**. Um **Smart Scan** sugere configuração de Dockerfile/Compose.
- **GitHub App** (https://coolify.io/docs/applications/sources/github/app): "A GitHub App gives Coolify access to one repository, selected repositories, or every repository". Permissões: Contents (read-only), Metadata (read-only), Email addresses (read-only), Pull requests (read & write, apenas se houver preview deployments). Eventos: Push e, para previews, Pull request. A instalação automatizada pede a URL base do Coolify para o webhook; a manual usa `https://coolify.example.com/webhooks/source/github/events`. Aviso: "Repository access can work while automatic and preview deployments fail if GitHub cannot reach this endpoint." O recurso criado chama-se "Private Repository (with GitHub App)"; a página não discute o caso de repositório público instalado na App. Em monorepos: "set the correct Base directory before using Smart Scan".
- **GitHub Actions** (https://coolify.io/docs/applications/sources/github/actions): "GitHub Actions builds the image, so Coolify must deploy the published image instead of rebuilding the same source." O Coolify recebe a imagem como aplicação **Docker Image** ou Compose com `image:` em vez de `build:`. O workflow chama a **Deploy webhook URL** (copiada em *Application > Webhooks*) com `Authorization: Bearer <token>`; o token vem de *Keys & Tokens > API Tokens* com permissão **Deploy**. Em self-hosted, a API precisa estar ativa em *Settings > Advanced > API and MCP > API access*. Para imagem privada no GHCR, o servidor de deploy precisa de `docker login ghcr.io`. Recomendações: "Keep the Coolify request after tests, security checks, the image build, and the registry push"; tag por commit para release imutável; "Do not commit either value to the workflow file."
- **Deploy automático por fonte** (https://coolify.io/docs/applications/deployments/automatic-deployments): com GitHub App ou GitLab, "The integration receives provider events for Coolify, so you do not need to copy a manual Git webhook URL." Repositório público ou deploy key "clonam o repositório, mas não configuram eventos automaticamente": exige webhook manual no GitHub com a URL da aba **Webhooks** e secret igual (seção 7).

## 2. Coolify: monorepo e base directory

Fonte principal: https://coolify.io/docs/applications/configuration/general.

- **Base Directory** define o diretório do repositório tratado como raiz da aplicação: "Use `/` for the repository root or a path such as `/apps/api` for a monorepo application."
- **Base Directory também é o contexto de build do Docker**: "Base Directory also defines the build context available to `COPY` and `ADD` instructions." Na página do build pack Dockerfile: "Set **Base Directory** to the repository directory Docker should use as the build context." (https://coolify.io/docs/applications/builds/dockerfile)
- **Dockerfile Location** é combinado com o Base Directory: `Base Directory: /apps/api` + `Dockerfile Location: /docker/Dockerfile` → `/apps/api/docker/Dockerfile`. Ambos começam com `/`. Há **Docker Build Stage Target** para escolher um estágio de Dockerfile multi-stage.
- **Docker Compose Location** segue a mesma combinação (`/deploy` + `/compose.yaml` → `/deploy/compose.yaml`).
- **Consequência para workspaces pnpm (inferência a partir das regras acima)**: um Dockerfile de `apps/web` que precise de `pnpm-workspace.yaml`, `pnpm-lock.yaml` e `package.json` da raiz só os enxerga se o contexto for a raiz. Isso implica `Base Directory = /` e `Dockerfile Location = /apps/web/Dockerfile`, e não `Base Directory = /apps/web`. Os projetos panlabs-tech fazem isso no CI: `context: .` com `file: apps/web/Dockerfile`; o Dockerfile do LUC copia `package.json pnpm-lock.yaml pnpm-workspace.yaml` da raiz e roda `pnpm --filter @luc/web build` (seção 14). Para `apps/api` (Python isolado), `Base Directory = /apps/api` funciona se o Dockerfile não depender de nada da raiz; o ethitorial usa `context: apps/api`, o LUC usa a raiz com `COPY apps/api/...`.
- **Nixpacks** exige manifesto e lockfile dentro do Base Directory: "The manifest and lockfile must be inside the configured Base Directory" (https://coolify.io/docs/applications/builds/nixpacks/overview). Num workspace pnpm, o lockfile fica na raiz, o que conflita com Base Directory `/apps/web` (inferência).
- **Uma aplicação Coolify = um container/imagem** (Nixpacks, Railpack, Static e Dockerfile "geram uma única imagem"; só Docker Compose define vários serviços) (https://coolify.io/docs/applications/builds/overview). Portanto, o layout A com dois Dockerfiles vira **duas aplicações Coolify** apontando para o mesmo repositório com base directory/Dockerfile diferentes, ou **uma aplicação Docker Compose** com dois serviços.
- **Watch Paths** ("Limit deployments by changed paths", https://coolify.io/docs/applications/deployments/automatic-deployments): em *General > Build*, "um padrão por linha"; "Commas do not separate patterns: Coolify reads `apps/api/**,packages/shared/**` as one pattern"; suporta `*`, `**`, `?`, `!`; "The last matching pattern wins." Exemplo da doc: `apps/api/**`, `packages/shared/**`, `!apps/api/**/*.md`. Escopo: "Watch paths filter Git provider webhook events that include changed-file information. They do not block deployments started manually from the dashboard or through the authenticated **Deploy Webhook**." A página General diz que o campo só aparece para fontes GitHub App ou GitLab, "não aparece para URL pública de repositório nem para deploy key" (https://coolify.io/docs/applications/configuration/general). Sem Watch Paths, dois apps no mesmo repositório recebem deploy a cada push, mesmo quando só um mudou; e o fluxo via GitHub Actions + Deploy Webhook nunca é filtrado por Watch Paths (o filtro, se quiser, fica no próprio workflow).
- A página dedicada a monorepo em `coolify.io/docs/knowledge-base/monorepo` retorna 404 hoje; o conteúdo foi absorvido pelas páginas acima.

## 3. Coolify: build packs (Dockerfile, Docker Compose, Nixpacks)

Fonte: https://coolify.io/docs/applications/builds/overview e subpáginas.

| Build pack | Quando se aplica (texto da doc) | Observações |
|---|---|---|
| **Nixpacks** | "The codebase follows a supported language or framework convention." | Gera um Dockerfile a partir do código. "Railway states that Nixpacks is not under active development"; "Coolify still supports Nixpacks." Configuração por `nixpacks.toml`/`nixpacks.json`; variáveis `NIXPACKS_*` precisam de "Available during build". (https://coolify.io/docs/applications/builds/nixpacks/overview) |
| **Railpack (Beta)** | "The repository is supported by Railway's newer automatic build system." | Sucessor recomendado do Nixpacks; `railpack.json`. |
| **Static** | "The repository contains the finished website files." | Serve com `nginx:alpine`; **Publish Directory** obrigatório em modo estático. |
| **Dockerfile** | "The repository contains one custom image definition used with Coolify runtime settings." | Uma imagem por aplicação. Detalhes abaixo. |
| **Docker Compose** | "The application needs a Compose definition with one or more services." | Cada serviço pode fazer `build:` ou puxar `image:`. Detalhes abaixo. |
| **Docker Image** | Sem build: "the image already exists in a registry". | Caminho usado com GitHub Actions + GHCR (o as-built panlabs). |

Regra de decisão da própria doc: Nixpacks/Railpack quando a detecção automática basta; Dockerfile/Compose quando o repositório precisa definir a imagem ou a topologia de serviços. O seletor de build pack fica indisponível depois de criada uma aplicação Docker Image; "para mudar o método, é preciso criar outra aplicação" (https://coolify.io/docs/applications/configuration/general).

**Dockerfile** (https://coolify.io/docs/applications/builds/dockerfile):
- Caminho = Base Directory + Dockerfile Location; Base Directory é o build context (seção 2).
- "Coolify uses the first `EXPOSE` instruction as the initial **Ports Exposes** value." Sem `EXPOSE`, "the initial port is `80`". "The process must listen on `0.0.0.0`, not only `127.0.0.1`, for the Coolify proxy to reach it."
- Build args: em *Advanced > Build*, "Managed manually in Dockerfile" quando o Dockerfile declara todos os `ARG`. "`SOURCE_COMMIT` is excluded from the build by default so commits with unchanged layers can reuse cache." Segredos de build via Docker BuildKit secrets; "Do not copy production secrets into the Dockerfile or image layers."
- Pre-deployment command é pulado quando não há container atual (inclui o primeiro deploy); post-deployment que falha só é registrado no log.
- Health check definido no Dockerfile: "The image must contain the command used by the check." Os Dockerfiles panlabs instalam `curl` só por isso (seção 14).
- "A plain Node.js process uses one CPU core."

**Docker Compose** (https://coolify.io/docs/applications/builds/docker-compose):
- Domínio por serviço: em **Domains** escolhe-se o **Service**, protocolo, hostname, porta interna e caminho; sufixo `:3000` no domínio diz ao proxy qual porta do container recebe a requisição. O Coolify gera as "proxy labels" quando ausentes.
- Variáveis mágicas: `SERVICE_URL_<ID>`, `SERVICE_FQDN_<ID>`, `SERVICE_PASSWORD_<ID>` (32 chars; variantes `_64_`, `WITHSYMBOLS`), `SERVICE_USER_<ID>`, `SERVICE_BASE64_*`, `SERVICE_REALBASE64_*`, `SERVICE_HEX_*`. "Generated values persist between deployments and appear under **Environment Variables**."
- `${VAR}` cria variável editável vazia; `${VAR:-padrão}` define fallback; `${VAR:?}` bloqueia o deploy até haver valor. "Coolify keeps an existing value when the Compose definition is loaded again."
- Cada serviço precisa de `image:` ou `build:`. Build arguments só se aplicam a serviços com `build:`.
- Healthcheck vai no Compose ou no Dockerfile; aplicações Compose "não usam a página padrão de **Healthcheck**". `exclude_from_hc: true` para containers pontuais (migrações).
- Rede: cada recurso Compose recebe uma rede própria; serviços falam pelo nome do serviço. **Connect to predefined network** só para alcançar outros recursos Coolify (ex.: um Postgres gerenciado fora do Compose). "Do not publish a service with `ports:` unless it must be reachable directly on a server interface."
- "Aplicações Git com build pack Compose suportam deploys por branch, webhooks e previews." Compose Empty (sem Git) não.
- **Raw Compose Deployment**: "Raw (deploy file as-is)"; "The definition must provide its own proxy labels, networking, and other required runtime configuration."
- Em previews com Compose, "cada serviço pode ter seu próprio domínio" (https://coolify.io/docs/applications/deployments/preview-deployments).

**Onde o build roda**: por padrão no servidor de deploy; um build server separado "cannot run deployed resources" (https://coolify.io/docs/applications/builds/overview). Com GitHub Actions o build sai da VPS inteiramente (seção 1).

## 4. Coolify: variáveis e segredos

Fonte: https://coolify.io/docs/applications/configuration/environment-variables.

- Seções separadas para **produção** e **preview**. **Normal view** (uma por vez) e **Developer view** (formato `.env`; segredos bloqueados e multilinha não editáveis ali).
- Flags no Developer view: `# coolify: literal buildtime=false` logo acima da variável; `literal` (padrão `false`), `buildtime` (padrão `true`), `runtime` (padrão `true`). "The `# coolify:` line must be directly above the variable line."
- **Build time vs runtime** são independentes; por padrão novas variáveis ficam "Available during build" e "Available in the container". Para segredos lidos só no start, desligar build time.
- **Segredo** = variável **Locked** (sem botão de cópia). **Interpolation** com modo "Literal (keep $ characters as-is)". **Value type: Multiline** para certificados/chaves.
- **Compartilhadas**: `{{environment.DATABASE_URL}}` e escopos team/project/environment/server; `{{vault.KEY}}` para Doppler/Infisical/HashiCorp Vault.
- **Predefinidas**: `COOLIFY_FQDN`, `COOLIFY_URL`, `COOLIFY_BRANCH`, `COOLIFY_RESOURCE_UUID`, `COOLIFY_CONTAINER_NAME`, `SOURCE_COMMIT` (excluída do build por padrão), `PORT` (primeira porta exposta) e `HOST` (`0.0.0.0`).
- Segurança: "Traditional Docker build arguments can appear in image metadata" → Docker BuildKit secrets para valores sensíveis de build. "Redaction is best effort" nos logs (valores curtos, < 8 bytes, podem vazar). A página não trata de `NEXT_PUBLIC_*`.
- Mudança de valor de build exige redeploy; só runtime, **Restart**.
- Restrição do projeto: o repositório minimal-me é público, então nenhum valor real pode viver em arquivo versionado; os projetos panlabs guardam só credenciais de dev local em `docker-compose.yml`/`.env.example` (seção 14). No fluxo GitHub Actions, a imagem publicada no GHCR é pública ou privada conforme o pacote; build args viram metadata da imagem (acima).

## 5. Coolify: bancos gerenciados (Postgres) e alcance pela aplicação

Fonte: https://coolify.io/docs/databases/postgresql.

- O banco é implantado "as a standalone container on the selected server and destination". Fluxo: **New Resource → Databases → PostgreSQL** → servidor → destino de rede Docker → imagem → **Start**. Recebe senha gerada, volume persistente, URL interna e health check.
- Imagens: padrão `postgres:18-alpine`; seletor com 18, 17, 16 e variantes Supabase, PostGIS, PGVector.
- **Postgres URL (internal)**: `postgres://<username>:<password>@<database-container>:5432/<database>`, para aplicações "no mesmo destino de rede do Coolify"; o host é o nome do container do banco. **Postgres URL (public)** só com **Public through TCP proxy** e **Public port**. "Do not expose port `5432` unless an external client requires it; prefer private networking for application connections."
- Backups: `pg_dump` em formato custom por banco; **All databases** usa `pg_dumpall` + gzip; agendamento, retenção e destino S3 em "Database backups". Restauração pelo diálogo **Import backup** (`pg_restore`/`psql`); donos e privilégios só com **Keep owners and privileges**.
- Cuidados: alterar senha/usuário fora do Coolify quebra URLs e backups se não atualizar **General**; scripts de init só em diretório vazio; mudar imagem/porta/config exige reiniciar; SSL `verify-ca`/`verify-full` exige confiar na CA do Coolify.
- Observação operacional registrada pelo ethitorial (`ethitorial/docs/adr/0003-infra-hostinger-vps-coolify.md`, "Invariante de deploy"): bancos recebem `container_name = <uuid>` e são resolvíveis pelo DNS do Docker; aplicações do tipo Docker Image **não** (nome com sufixo aleatório) e só viram host resolvível na rede `coolify` quando **Network Aliases** (*General → Network*) é preenchido com o próprio UUID. Isso importa para `web → api` interno no layout A quando os dois são aplicações separadas. Em Compose, serviços se resolvem pelo nome de serviço sem esse passo (seção 3).
- Independe do layout: nos dois casos o Postgres é um recurso Coolify à parte, com uma database por projeto no mesmo servidor compartilhado (`travelmanager/docs/adr/0008-substrato-compartilhado-e-deploy.md`, camada c).

## 6. Coolify: domínios, proxy (Traefik/Caddy) e certificados

Fontes: https://coolify.io/docs/core/networking/domains, https://coolify.io/docs/core/networking/proxy/overview, https://coolify.io/docs/core/infrastructure/servers/firewall.

**Domínios**
- "The domain's DNS record points to the server running the resource." Portas 80 e 443 abertas; a aplicação escuta na porta de container usada pelo Coolify.
- **Wildcard Domain** por servidor (*Servers > General*) gera `https://<application-id>.<dominio>`. Sem ele, o Coolify gera `sslip.io` em HTTP: "The generated URL always uses `http://`"; não mudar para HTTPS porque o Let's Encrypt "rate-limits the entire shared `sslip.io` zone".
- Vários domínios por aplicação (**Add domain**), redirect www/não-www.
- **Docker Compose**: domínio por serviço (**Service**); bancos não são expostos por domínio.
- **Porta e caminho no domínio**: `https://app.exemplo.com:3000`, `https://exemplo.com:8080/api`; a porta escolhe a porta do container, "It does not create a public host-port mapping". Por padrão o prefixo é removido (`/api/users` chega como `/users`); *Advanced > Proxy* → "Keep paths as-is" mantém. Rotas mais específicas têm prioridade. Isso permite, no layout A, servir `web` em `/` e `api` em `/api` sob o mesmo hostname, ou usar um subdomínio para a api (inferência; ver limite do Universal SSL na seção 11).
- **HTTPS**: valor `https://` faz o proxy configurar TLS; Traefik ou Caddy "requests and renews the certificate". Condições: hostname resolve "para o servidor ou para um CDN configurado", portas 80/443 chegam ao proxy, domínio está na configuração do recurso. A página não diz qual desafio ACME é o padrão; o `docker-compose.yml` do proxy traz `--certificatesresolvers.letsencrypt.acme.httpchallenge=true` (HTTP-01) e o DNS challenge é configuração opcional (https://coolify.io/docs/core/networking/proxy/traefik/dns-challenge).
- **Cloudflare DNS management**: com token de integração Cloudflare do time, o Coolify "pode criar, substituir e remover registros DNS gerenciados" a partir da página Domains.

**Proxy** (https://coolify.io/docs/core/networking/proxy/overview)
- **Traefik**: "The default integrated proxy"; "Coolify generates routes, middleware labels, and TLS certificate settings". **Caddy**: "An integrated alternative to Traefik"; "Coolify generates Caddy Docker labels and manages automatic HTTPS"; "Currently less documented than Traefik in Coolify". **Custom (None)**: "Does not run the Coolify Proxy container"; "You own the complete traffic path".
- "Use Traefik unless you already have a reason to use Caddy." Trocar o proxy "temporarily interrupts every public route on that server"; "An invalid proxy configuration can make every application and service on the server unreachable."
- O ethitorial corrigiu seu ADR de Caddy para Traefik por isso (`ethitorial/docs/adr/0003-...`, "Histórico 2026-05-24").

**DNS challenge no Traefik** (https://coolify.io/docs/core/networking/proxy/traefik/dns-challenge)
- Em *Servers > Proxy > Configuration*: `CF_DNS_API_TOKEN=<token>` no `environment` do serviço `traefik`; trocar `--certificatesresolvers.letsencrypt.acme.httpchallenge=true` por `--certificatesresolvers.letsencrypt.acme.dnschallenge.provider=cloudflare` (+ `delaybeforecheck=0`, subir para `30` se o TXT demorar). Token: "Create a token limited to the DNS zone and record permissions Traefik needs." É o caminho para wildcard. Editar `/data/coolify/proxy/docker-compose.yml` à mão não sincroniza com a UI e pode ser sobrescrito ao reiniciar o proxy.

**Let's Encrypt atrás de proxy de terceiros** (https://coolify.io/docs/troubleshoot/dns-and-domains/lets-encrypt-not-working)
- "you must either use a DNS challenge or stop proxying your domain through the third-party service." "Port 80 (HTTP) needs to be open and accessible from the internet." Erro 403 nos logs do proxy = WAF bloqueando; 429 = rate limit do Let's Encrypt. `rm /data/coolify/proxy/acme.json` + Restart Proxy para regenerar. Registro AAAA sem IPv6 funcional também derruba o desafio.

**Firewall e portas** (https://coolify.io/docs/core/infrastructure/servers/firewall)
- 8000/tcp (dashboard por IP), 6001/tcp (realtime), 6002/tcp (terminal), 22/tcp (SSH), 80/tcp ("HTTP e geração de certificados pelo proxy"), 443/tcp (HTTPS). "Do not open ports that your server does not use."
- Depois que o painel responde por domínio via proxy, pode-se fechar 8000/6001/6002 ao público; "Removing the public port bindings before the domain works can lock you out of Coolify." "Blocking a port with UFW does not guarantee that a Docker-published port is blocked" (usar firewall do provedor ou ufw-docker).

## 7. Coolify: deploy automático por push e webhooks

Fonte: https://coolify.io/docs/applications/sources/github/auto-deploy, https://coolify.io/docs/applications/deployments/automatic-deployments, https://coolify.io/docs/applications/configuration/advanced.

- Em *Advanced > Deployment*, "Deploy on push (webhooks)" "allows supported Git webhook events to start a deployment"; vem ativado por padrão, "mas a conexão com o repositório precisa ter um webhook funcional". Alternativa: **Manual deployments only**.
- Três formas de disparar: **GitHub App** (webhook automático), **GitHub Actions** (workflow chama a Deploy webhook URL após build/push; "não depende de Deploy on push"), **webhook de repositório**: "Use this path for a public repository or a private repository connected through a deploy key."
- **Webhook manual** (repositório público/deploy key): *Webhooks* → "Webhook secret" na seção GitHub → copiar a URL em **Manual Git webhooks** → no GitHub, *Settings > Webhooks > Add webhook* → Payload URL + mesmo Secret → "Enable SSL verification" marcado → "Just the push event" → Active. O deploy dispara em push "to the configured branch". O secret "authenticates webhook deliveries".
- Para o webhook (manual ou da App) funcionar, o painel do Coolify precisa ser alcançável pelo GitHub (seção 1: "fail if GitHub cannot reach this endpoint"), o que implica expor o painel por domínio/HTTPS ou túnel. No as-built panlabs o painel já tem domínio público (seção 14).
- Deploy por API: os três `deploy.yml` panlabs chamam `POST $COOLIFY_URL/api/v1/deploy?uuid=<uuid>&force=true` com Bearer token, um UUID por aplicação (seção 14). A doc oficial manda copiar a URL do painel; o endpoint exige API access habilitado (seção 1).
- No layout A com repositório público via URL (sem GitHub App), **um webhook manual por aplicação** no GitHub (duas Payload URLs) e sem Watch Paths: todo push dispara as duas (seção 2). Com GitHub Actions, o workflow decide o que construir e qual UUID acionar.

## 8. Coolify: preview deployments

Fonte: https://coolify.io/docs/applications/deployments/preview-deployments, https://coolify.io/docs/applications/configuration/advanced.

- Toggle "Enable preview deployments" e acesso: **Repository members only** ("Coolify blocks pull requests from forks unless the author is a repository owner, member, or collaborator") ou **Public (fork PRs allowed)**. "Public previews can run contributor-controlled code"; credenciais de produção não devem ser expostas a previews.
- **GitHub App não é obrigatória**: "Use this path [webhook de repositório] for an application created from a public repository URL or *Private Repository (with deploy key)*." Porém "The UI's pull-request listing and status updates are available for GitHub App sources" e "automated pull-request comments require a GitHub App with the required permissions". Previews também podem ser disparados via API com `pull_request_id`.
- Template de URL: `{{pr_id}}`, `{{random}}`, `{{domain}}`; "The default template is `{{pr_id}}.{{domain}}`"; exemplo `{{pr_id}}.preview.example.com`. Exige DNS wildcard: "create an `A` or `AAAA` record for `*.preview.example.com` that points to the deployment server." Em Compose, cada serviço pode ter domínio próprio.
- Variáveis separadas para preview; "Use non-production credentials for preview databases, storage, and external services." "A preview container is temporary, but data written to an external service can remain after Coolify deletes the preview."
- Limpeza: "Coolify deletes an automatically created preview after its pull request or merge request is closed or merged"; remove só containers/redes/volumes que criou. PRs abertos antes da ativação exigem **Load Pull Requests**.
- Previews de aplicação Docker Image "podem ser criados manualmente com um Preview ID e uma Docker Tag" — ou seja, no fluxo GitHub Actions o preview não é automático por PR.
- Relevante para o layout A: o preview é por aplicação Coolify; um PR que toque `web` e `api` gera dois previews independentes, e a doc não trata de como o preview do `web` descobre o preview do `api` (inferência: variável de preview apontando para o hostname do preview da api, ou para a api de produção). Com Compose, o preview sobe os dois serviços juntos na mesma rede.
- Relevante para a Cloudflare: com `{{domain}}` = `minimal-me.<guarda-chuva>` o preview vira `123.minimal-me.<guarda-chuva>`, subdomínio de **segundo nível**, fora do Universal SSL gratuito quando proxied (seção 11). O template aceita outras formas (o exemplo da doc usa `{{pr_id}}.preview.example.com`), então `{{pr_id}}-minimal-me.<guarda-chuva>` ficaria em primeiro nível (inferência).
- Os três projetos panlabs **deferiram** previews por PR ("entra quando houver código que justifique", `ethitorial/docs/adr/0005-deploy-checks-em-tres-portoes.md`), coerente com o fluxo Docker Image.

## 9. Coolify: recursos mínimos do servidor

Fonte: https://coolify.io/docs/get-started/installation.

- "Coolify needs 2 CPU cores, 2 GB RAM, and 10 GB disk space to run." "Keep additional space for Docker images, volumes, and backups." Arquiteturas amd64 e arm64; "Coolify only runs on Linux-based operating systems".
- "Coolify can run on smaller servers (for example: 1 CPU core, 512 MB RAM, 4 GB disk), but this is not recommended."
- "The resources you need depend on your projects." Se build e Coolify rodam no mesmo servidor, monitorar recursos (o build no GitHub Actions tira esse peso da VPS).
- Instalação: `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash`; painel em `http://<server-ip>:8000`.
- Referência prática panlabs: VPS Hostinger KVM 2 ("2 vCPU, 8 GB RAM, 100 GB NVMe"), Coolify estimado em "~500MB RAM" de overhead, hospedando **vários** projetos, cada um com web + api + Postgres (seção 14). O layout A soma um container a mais por projeto em relação ao B.

## 10. Cloudflare: DNS para a VPS, proxied vs DNS only

Fonte: https://developers.cloudflare.com/dns/proxy-status/, https://developers.cloudflare.com/fundamentals/reference/network-ports/, https://developers.cloudflare.com/fundamentals/concepts/cloudflare-ip-addresses/, https://coolify.io/docs/integrations/security/cloudflare/ddos-protection.

- O proxy status "controls whether HTTP/HTTPS traffic for that record routes through Cloudflare's network". **DNS only** "exposes your origin IP address to anyone who queries the record". Só A, AAAA e CNAME podem ser proxied; "Other record types (such as MX or TXT) are always DNS-only." Recomendação: "proxying all A, AAAA, and CNAME records that serve web traffic"; DNS only para e-mail, verificação de domínio e "non-HTTP services".
- Dependem de proxied: DDoS para a origem, WAF, cache, regras; Universal SSL (o certificado de borda só é servido com registro **Proxied**, https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/limitations/). Proxied força TTL Auto (300 s). Se um nome tem vários A e um é proxied, todos são tratados como proxied.
- **Portas proxied por padrão**: HTTP 80, 8080, 8880, 2052, 2082, 2086, 2095; HTTPS 443, 2053, 2083, 2087, 2096, 8443. SSH (22), Postgres (5432) e o painel do Coolify por IP (8000) **não** passam pelo proxy: ou registro DNS only, ou Spectrum (todas as portas TCP/UDP "only available on the Enterprise plan"). Consequência: o painel do Coolify só fica atrás da Cloudflare se servido por domínio na 443 via Traefik (seção 6), e o Postgres público (se existir) nunca passa pela Cloudflare.
- **Receita do Coolify** (https://coolify.io/docs/integrations/security/cloudflare/ddos-protection): dois registros A, raiz e `*`, para o IP do servidor; "Set the proxy status to Proxied for both records"; "Choose Full (Strict) as the encryption mode"; Origin Certificate no proxy; firewall 443 só para IPs da Cloudflare; Always Use HTTPS. Aviso: o wildcard gratuito "cover just one level of subdomains".
- **IPs da Cloudflare**: lista em https://www.cloudflare.com/ips e API; "Cloudflare's IP ranges do not change frequently" e mudanças "are added to our list of IP ranges before being put into production". Recomendação: "block all traffic that does not come from Cloudflare IP addresses" para impedir "bypassing Cloudflare's security protections entirely". O ethitorial registra isso como "origem fechada aos ranges Cloudflare" (`ethitorial/docs/adr/0003-...`).
- Cuidado para a aplicação: atrás do proxy o IP visto pela origem é da Cloudflare; ler `CF-Connecting-IP` (`ethitorial/docs/adr/0006-cloudflare-na-frente-da-vps.md`, "Implicações operacionais").

## 11. Cloudflare: SSL (Flexible/Full/Full strict), origin certificates e o Traefik do Coolify

Fonte: https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/, https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/, https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/limitations/, https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/, https://coolify.io/docs/knowledge-base/cloudflare/origin-cert.

**Modos**
| Modo | Cloudflare → origem | Valida certificado da origem |
|---|---|---|
| Off | HTTP | n/a |
| Flexible | HTTP ("common for origins that do not support TLS") | n/a |
| Full | HTTPS "without validating the origin's certificate" | não (aceita autoassinado) |
| Full (strict) | HTTPS "with added validation of the origin server's certificate" | sim: "can be issued by a public CA like Let's Encrypt or by Cloudflare Origin CA" |
| Strict (SSL-Only Origin Pull) | "always connects to the origin over HTTPS with certificate validation" | sim |

- Recomendação da Cloudflare: "Full" ou "Full (strict)" "to prevent malicious connections to your origin"; evitar Flexible. **Automatic SSL/TLS** (padrão) escolhe o modo mais seguro possível e "will not change your setting to a less secure encryption mode"; "You must ensure the validity of your origin SSL/TLS configuration at all times."
- **Flexible com o Traefik do Coolify** (inferência a partir das regras): o Coolify redireciona HTTP→HTTPS quando o domínio é `https://` e "Redirect HTTP to HTTPS" está ativo; com Flexible a Cloudflare chega em HTTP, recebe o redirect e gera loop (o mesmo "TOO_MANY_REDIRECTS" que a doc do Coolify cita para o túnel, seção 13). Always Use HTTPS da Cloudflare: "Cloudflare recommends not performing redirects at your origin web server, as this can cause redirect loop errors."

**Duas formas de ter certificado válido na origem para Full (strict)**
1. **Let's Encrypt emitido pelo Traefik** (padrão do Coolify). Com o registro já proxied, o desafio HTTP-01 pode falhar ("you must either use a DNS challenge or stop proxying", seção 6). Saídas documentadas: DNS challenge com `CF_DNS_API_TOKEN` (seção 6) ou deixar DNS only até emitir e depois ligar o proxy (o certificado vale 90 dias e a renovação volta a enfrentar o proxy). Vantagem: também vale para acesso direto sem Cloudflare.
2. **Cloudflare Origin Certificate** (https://coolify.io/docs/knowledge-base/cloudflare/origin-cert): gerar em *SSL/TLS > Origin Server* (RSA 2048, hostnames `dominio` e `*.dominio`, 15 anos, PEM); salvar em `/data/coolify/proxy/certs`; em *Server > Proxy > Dynamic Configuration* adicionar um `.yaml` com `tls.certificates[].certFile/keyFile` (`/traefik/certs/...`); modo **Full (Strict)**; Always Use HTTPS. Limite: "Shows certificate errors if users bypass Cloudflare"; "If you plan to have Cloudflare always in front of your application, use a Cloudflare Origin Certificate." Origin CA: "only encrypt traffic between Cloudflare and your origin server"; até 200 SANs; wildcard cobre um nível; sem notificação de expiração; a chave privada só aparece na criação.

**Universal SSL (borda, gratuito)** (https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/limitations/)
- Cobre o apex e subdomínios de primeiro nível; subdomínios de segundo nível ou mais profundos (ex.: `dev.www.example.com`) "are **not** covered and will not serve a valid certificate." Soluções: Advanced Certificate Manager (pago) ou certificado customizado. Plano Free: só ECDSA.
- Impacto no guarda-chuva `panlabs.tech`: `<projeto>.panlabs.tech` é primeiro nível (coberto); `api.<projeto>.panlabs.tech` e `<pr>.<projeto>.panlabs.tech` são segundo nível (não cobertos). O travelmanager registrou exatamente isso ("subdomínio de **2 níveis**, que o **Universal SSL grátis do Cloudflare não cobre** — foi o que quebrou no domínio antigo", `travelmanager/docs/adr/0004-topologia-de-autenticacao.md`) e manteve a API interna. Para o layout A isso restringe o hostname público da api a: caminho `/api` no mesmo host, hostname de primeiro nível (`minimal-me-api.<guarda-chuva>`), zona própria do projeto, ou api só interna.

## 12. Cloudflare: websockets, tamanho de upload e timeouts atrás do proxy

Fonte: https://developers.cloudflare.com/network/websockets/, https://developers.cloudflare.com/fundamentals/reference/connection-limits/, https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-524/, https://developers.cloudflare.com/support/troubleshooting/http-status-codes/4xx-client-error/error-413/.

- **WebSockets**: "Cloudflare supports proxied WebSocket connections without additional configuration"; "WebSockets are supported on all Cloudflare plans"; há toggle em *Network*. "Cloudflare will close a WebSocket connection when no data is transmitted in either direction for a period of time" (duração não publicada; só Enterprise configura); recomenda heartbeat ping/pong. O WAF inspeciona só o upgrade inicial. Deploys da rede Cloudflare podem derrubar conexões; implementar reconexão.
- **Timeouts da origem**: Proxy Read Timeout 125 s → erro **524** ("the origin did not provide an HTTP response before the default 125 seconds"); só Enterprise aumenta (até 6.000 s). Proxy Write Timeout 30 s (não configurável). Proxy Idle Timeout 900 s → 520. Saída da doc para processos longos: "Implement status polling of large HTTP processes" ou "move those processes behind a subdomain not proxied (DNS-only, grey clouded)". Afeta rotas de SSR/API lentas; não afeta streaming que envie bytes antes do limite (inferência).
- **Upload (request body)**: Free 100 MB, Pro 100 MB, Business 200 MB, Enterprise até 5 GB; acima do limite "receive a 413 Request Entity Too Large error" (página do erro 413). URLs até 16 KB; headers de requisição e de resposta até 128 KB. Limites "não podem ser contornados enquanto o tráfego estiver proxied" (proxy-status). Uploads maiores pedem DNS only no hostname de upload ou upload direto a object storage (os projetos panlabs usam R2 para anexos, `life-under-control/docs/adr/0008-anexos-object-storage-r2.md`).

## 13. Cloudflare Tunnel como alternativa

Fonte: https://developers.cloudflare.com/tunnel/, https://developers.cloudflare.com/tunnel/concepts/routing/, https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/, https://coolify.io/docs/knowledge-base/cloudflare/tunnels/overview, https://coolify.io/docs/knowledge-base/cloudflare/tunnels/all-resource, https://coolify.io/docs/knowledge-base/cloudflare/tunnels/full-tls.

- **O que é**: "Instead of exposing a public IP, you install a lightweight daemon called `cloudflared` on your server"; conexões só de saída ("outbound-only connections"), quatro conexões persistentes a dois data centers; "Available on all plans". Mapeia hostname público → serviço local ("`app.example.com` to `http://localhost:8080`"). DNS: CNAME para `<UUID>.cfargotunnel.com`; "does not proxy traffic unless the tunnel is running". Authenticated Origin Pulls não se aplica: "Origin traffic is already authenticated using your tunnel's connector credentials".
- **Receita do Coolify "All resources"**: criar o túnel (*Networking > Tunnels*, conector Docker, copiar token `eyJ...`); implantar o recurso **Cloudflared** no próprio Coolify com o token; rota **Published Application** com Subdomain `*`, Domain `<dominio>`, Service URL `http://localhost:80` (ou `http://127.0.0.1:80` se `localhost` resolver IPv6); domínio do recurso em `https://...`; **Redirect HTTP to HTTPS = Disabled** porque "Leaving the redirect enabled can cause a **TOO_MANY_REDIRECTS** error"; "if a DNS record for the hostname already exists, Cloudflare won't update existing record".
- **Variante Full TLS**: para "apps that require HTTPS on Coolify to issue JWT tokens or handle callback URLs"; Origin Certificate no Traefik (como na seção 11), rota `https://localhost:443`, **Origin Server Name** com hostname concreto coberto pelo certificado ("Use a concrete hostname, not `*.shadowarcanist.com`"), "No TLS Verify" desligado; "Changing the zone's SSL/TLS mode does not fix a hostname mismatch between cloudflared and the origin."
- **Quando não usar** (doc do Coolify): se quer acesso direto sem proxy; se não quer tráfego pela Cloudflare; "Cloudflare Tunnels bypass all firewall rules"; se precisa de certificado confiável fora da Cloudflare. Também: o túnel elimina a necessidade de abrir 80/443 e de filtrar IPs da Cloudflare no firewall, mas o GitHub webhook e o painel passam a depender do túnel estar de pé (inferência).
- Os limites de 524/upload/WebSocket (seção 12) continuam valendo: o tráfego segue proxied.
- Panlabs: o ethitorial registrou o Tunnel como "opção válida (origem sem porta aberta), reabrir se hardening do firewall ficar incômodo" (`ethitorial/docs/adr/0006-...`, "Opções rejeitadas"); hoje usam proxy convencional + firewall por IP.

## 14. Como os projetos panlabs-tech fazem deploy hoje

Fontes locais (somente leitura): `/home/paninit/workspaces/panlabs-tech/{ethitorial,travelmanager,life-under-control}`.

### Infra documentada (ADRs)

- `ethitorial/docs/adr/0003-infra-hostinger-vps-coolify.md`: VPS Hostinger "KVM 2 — 2 vCPU, 8 GB RAM, 100 GB NVMe" com Ubuntu 24.04; Coolify como PaaS; "Traefik (default do Coolify) como reverse proxy com SSL automático (Let's Encrypt)"; PostgreSQL 17 gerenciado pelo Coolify; backups diários para R2; custo estimado "~$10-25/mês total". Deploy: "GitHub Actions builda imagens → push para GHCR → Coolify recebe webhook → puxa imagem e faz rolling restart com health checks."
- Mesmo ADR, "Substrato compartilhado": a VPS é "infraestrutura compartilhada, não um projeto". Uma instância Coolify hospeda N projetos, cada um com um *Coolify Project*, uma zona DNS própria na Cloudflare ("todas apontando para o IP da VPS, `Full (Strict)`, origem fechada aos ranges Cloudflare") e databases Postgres separadas no mesmo servidor. Painel Coolify num subdomínio `vps` do guarda-chuva; projetos em `<projeto>.panlabs.tech`; imagens em `ghcr.io/<dono-do-repositório>/`.
- Mesmo ADR, "Invariante de deploy": apps Docker Image precisam de **Network Aliases = <uuid>** para serem alcançadas por outra app pela rede `coolify`; aplicado em `ethitorial-api`. "Histórico 2026-05-24": Caddy → Traefik. "Emenda 2026-07-28": namespace GHCR passou a `${{ github.repository_owner }}` após a migração para a org quebrar o push silenciosamente. SSH: "Coolify usa SSH como `root`"; hardening com `Match Address 172.16.0.0/12`, chave em `/root/.ssh/authorized_keys`, `ignoreip` no fail2ban.
- `ethitorial/docs/adr/0006-cloudflare-na-frente-da-vps.md`: Cloudflare como DNS autoritativo, proxy ("orange cloud" ligado), CDN e WAF/DDoS no free tier; "**Modo TLS:** `Full (Strict)`"; "Firewall da VPS aceita 80/443 **somente de IP ranges da Cloudflare**" ou `cloudflared tunnel`; ler `CF-Connecting-IP`; "nunca cachear path com `set-cookie`".
- `ethitorial/docs/adr/0005-deploy-checks-em-tres-portoes.md`: três portões (Lefthook local → `pr-checks.yml` no push → `deploy.yml` no merge em `main`); sem `develop`/`staging`; previews por PR **deferidos**; approvals = 0; PR automático; merge autônomo de PR verde.
- `travelmanager/docs/adr/0008-substrato-compartilhado-e-deploy.md`: mesmas três camadas de nomes; "cada projeto tem o seu **Coolify Project + zona DNS + banco Postgres** próprios"; "A API nunca é pública"; "API pública (`api.panlabs.tech` / `api.travelmanager.panlabs.tech`) — rejeitado: ambíguo no guarda-chuva compartilhado e fora do Universal SSL grátis do Cloudflare (subdomínio de 2 níveis)". Migrations Alembic fora do pipeline (deferido).
- `travelmanager/docs/adr/0004-topologia-de-autenticacao.md`: a API "fica interna (já internalizada na rede `coolify`..., sem rota pública)"; o callback OAuth "mora no web (único host público)".
- **LUC oscilou entre B e A**: `life-under-control/docs/adr/0001-app-unico-next-fullstack.md` (2026-06-26, superseded) adotou "app único Next.js full-stack" com "menos infra (um container + um Postgres no Coolify); deploy e CI mais simples", rejeitando "Monorepo Next + FastAPI. Dois runtimes, contrato OpenAPI e deploy duplo". `life-under-control/docs/adr/0014-backend-python-fastapi.md` (2026-07-11) reverteu por "benefício de portfólio" (fluência em Python, lab-referência, skill `panlabs-python-standards`): "Deploy: dois apps Coolify no mesmo VPS. O api em subdomínio com allowlist de path no proxy — público só `/webhooks/*` e `/health`; todo o resto só pela rede privada (`luc-web → luc-api`)". Consequência aceita: "toda feature vertical futura cruza duas linguagens, um contrato interno e dois deployables; review poliglota; dois pipelines de CI."

### Workflow de deploy (os três repositórios, mesma forma)

- `ethitorial/.github/workflows/deploy.yml`, `travelmanager/.github/workflows/deploy.yml`, `life-under-control/.github/workflows/deploy.yml`: `on: push: branches: [main]`; `build-push` com matriz `[web, api]` (LUC: dois jobs); `docker/build-push-action` para `ghcr.io/${{ github.repository_owner }}/<projeto>-<app>` com tags `latest` e `sha`; cache `type=gha`.
- **Contexto de build**: `context: ${{ matrix.app == 'web' && '.' || format('apps/{0}', matrix.app) }}` e `file: apps/${{ matrix.app }}/Dockerfile` (ethitorial/travelmanager); LUC usa `context: .` para os dois.
- Job `deploy`: guardado por `secrets.COOLIFY_TOKEN != ''`; `curl -X POST -H "Authorization: Bearer $COOLIFY_TOKEN" "$COOLIFY_URL/api/v1/deploy?uuid=$UUID&force=true"` para api e depois web (`COOLIFY_API_UUID`, `COOLIFY_WEB_UUID`); smoke test por `curl` no domínio público (15–30 tentativas).
- Ou seja: hoje o Coolify **não constrói nada**; recebe imagens prontas (aplicações Docker Image) e é acionado pela API. Duas aplicações Coolify por projeto, ambas do mesmo repositório. Sem previews por PR.

### Dockerfiles

- `ethitorial/apps/web/Dockerfile`: "Contexto de build = RAIZ do monorepo (não apps/web), porque o catálogo é MDX-native e lê `content/`"; `node:24-alpine`, pnpm 11, standalone do Next, `HOSTNAME=0.0.0.0`, `EXPOSE 3000`; "curl é exigido pelo healthcheck do Coolify (Portão 3) — roda o check DENTRO do container; a imagem alpine não traz curl/wget."
- `ethitorial/apps/api/Dockerfile`: `python:3.13-slim` + uv; mesmo comentário sobre `curl` ("o container era marcado unhealthy → rollback"); `EXPOSE 8000`; `CMD alembic upgrade head && uvicorn ... --host 0.0.0.0`.
- `life-under-control/apps/web/Dockerfile`: "Build context = raiz do monorepo"; `COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./` + `COPY apps/web/package.json`; `pnpm install --frozen-lockfile`; `pnpm --filter @luc/web build`; standalone em `apps/web/.next/standalone`; migração Drizzle no boot.
- `life-under-control/apps/api/Dockerfile`: "Build context = monorepo root"; multi-stage uv (`ghcr.io/astral-sh/uv:python3.14-bookworm-slim` → `python:3.14-slim-bookworm`), `COPY apps/api/...`, usuário não-root.

### Operação por agente

- `ethitorial/docs/agents/workflow.md`, `travelmanager/docs/agents/workflow.md`, `life-under-control/docs/agents/workflow.md`: o agente "faz deploy/redeploy, mexe em env, ..., cria/dropa recurso próprio no Coolify" e para em quatro casos (trancar-se fora, recriar a VM, segredo de terceiro, "tocaria outro projeto no Coolify compartilhado").
- `.mcp.json` dos três repositórios: servidor MCP `@masonator/coolify-mcp@2.12.0` apontando para o painel (`COOLIFY_BASE_URL`), token via variável de ambiente; há também um servidor `cloudflare`.

### Compose local

- `ethitorial/docker-compose.yml`: `web` (build `context: .`, `dockerfile: apps/web/Dockerfile`, `ETHITORIAL_API_URL: http://api:8000`), `api` (build `./apps/api`, `DATABASE_URL: ...@postgres:5432/...`), `postgres:17`; credenciais de dev versionadas.
- `life-under-control/docker-compose.yml`: Postgres 16 + MinIO; perfil `full` builda a imagem de produção (`apps/web/Dockerfile`, contexto raiz).

## 15. Síntese: restrições que separam os layouts A e B

Fatos acima, reorganizados por layout; sem decisão.

**O que vale igual nos dois layouts**
- Postgres é um recurso Coolify separado, alcançado pela URL interna no mesmo destino de rede (seção 5). Variáveis/segredos ficam no Coolify, nunca no repositório público (seção 4).
- Cloudflare: registro A proxied para o IP da VPS (ou wildcard `*`), modo **Full (strict)**, certificado válido na origem (Let's Encrypt via DNS challenge, ou Origin Certificate carregado no Traefik), Always Use HTTPS na borda, firewall 80/443 só para IPs da Cloudflare, painel do Coolify só por domínio na 443 (seções 6, 10, 11). Limites do proxy: upload 100 MB (Free), 524 após 125 s, WebSocket com idle timeout (seção 12). Tunnel troca porta aberta + filtro de IP por `cloudflared` como recurso Coolify e exige desligar o redirect HTTP→HTTPS (seção 13).
- Universal SSL gratuito cobre só o primeiro nível de subdomínio: qualquer hostname `x.minimal-me.<guarda-chuva>` (api ou preview) fica sem certificado de borda quando proxied (seção 11).
- Coolify mínimo: 2 vCPU, 2 GB RAM, 10 GB; a VPS compartilhada existente (KVM 2, 8 GB) já hospeda web + api + Postgres de três projetos (seções 9, 14).

**Layout A (workspaces pnpm, `apps/web` + `apps/api`, dois Dockerfiles)**
- Duas aplicações Coolify no mesmo repositório (ou uma aplicação Docker Compose com dois serviços). Cada uma com UUID, domínio, variáveis, webhook e preview próprios (seções 2, 3).
- `apps/web` exige **Base Directory `/`** (contexto na raiz para o lockfile/workspace) com `Dockerfile Location /apps/web/Dockerfile`; Nixpacks não casa com lockfile na raiz (seção 2).
- Sem GitHub App não há Watch Paths: todo push dispara as duas aplicações; com GitHub Actions o filtro fica no workflow, e o Deploy Webhook nunca é filtrado (seções 2, 7).
- `web → api` interno: aplicações Docker Image precisam de **Network Aliases = uuid**; em Compose os serviços se veem pelo nome (seções 3, 5).
- Hostname público da api: `/api` no mesmo host (prefixo removido por padrão, "Keep paths as-is" para manter), hostname de primeiro nível, ou api interna como fazem travelmanager e LUC (seções 6, 11, 14).
- Previews: um por aplicação; coordenação web-preview ↔ api-preview não documentada; com Compose sobem juntos (seção 8).
- É o as-built dos três projetos panlabs: matriz `[web, api]` no `deploy.yml`, duas imagens GHCR, dois UUIDs, sem previews (seção 14). LUC pagou "dois deployables, dois pipelines de CI" conscientemente por portfólio (ADR 0014).

**Layout B (aplicação única)**
- Uma aplicação Coolify, um Dockerfile (ou Nixpacks/Railpack com Base Directory `/`, se o repositório for um projeto Next.js convencional), um domínio de primeiro nível, um UUID no `deploy.yml`, um webhook, um preview por PR, sem rede interna entre apps nem Network Aliases (seções 2, 3, 7, 8).
- Preview `{{pr_id}}.{{domain}}` continua caindo em segundo nível sob o guarda-chuva; precisa de template de primeiro nível ou de zona própria (seções 8, 11).
- Foi a escolha do LUC em 2026-06 ("um container + um Postgres no Coolify; deploy e CI mais simples") antes da reversão por motivo de portfólio, não de infra (seção 14).
