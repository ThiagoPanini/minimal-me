# Inventário: life-under-control e irmãos (web + API)

Ticket: [#4](https://github.com/ThiagoPanini/minimal-me/issues/4) (parte de #1). Projeto principal, lido somente para registro: `/home/paninit/workspaces/panlabs-tech/life-under-control` (LUC). Irmãos: `ethitorial` e `travelmanager`, na mesma pasta. Caminhos citados são relativos à raiz de cada projeto, salvo indicação. Nenhum valor de `.env`, token ou credencial é reproduzido aqui; só nomes de variáveis. Estado do checkout do LUC no momento da leitura: branch `main`, último commit `8a18846` (2026-07-28).

## Retomada

- **Estado**: em andamento. Seções 1–12 (LUC) escritas; falta a 13 (irmãos) e a 14 (fatos para outros tickets).
- **Coberto**: layout, web, API, banco, auth, Docker, deploy, CI, segredos, `.mcp.json`, docs de agentes, ganchos/convenções.
- **Pendente**: tabela de divergências dos irmãos (seção 13); síntese (seção 14); comentário e fechamento da issue.
- **Onde continuar**: ler `ethitorial/apps/web/package.json`, `ethitorial/apps/api/pyproject.toml`, `ethitorial/docs/adr/0011-auth-better-auth.md`, `travelmanager/apps/web/auth.ts`, `travelmanager/apps/web/middleware.ts`, `travelmanager/docs/adr/0004-topologia-de-autenticacao.md`, `travelmanager/docs/adr/0008-substrato-compartilhado-e-deploy.md`; preencher a seção 13.

## 1. Layout do workspace

- Monorepo **pnpm** com um só glob: `packages: [apps/*]` (`pnpm-workspace.yaml`); `allowBuilds: esbuild, sharp`. Não há `packages/`.
- Raiz `package.json`: `name: life-under-control`, `packageManager: pnpm@11.1.0`, `engines.node >=22`; scripts `lint`/`format` (biome sobre `apps/web`) e `dev:up`/`dev:down`/`dev:reset`/`dev:smoke` (docker compose). Única devDependency: `@biomejs/biome ^2.0.0`.
- Runtimes fixados por arquivo: `.node-version` = `22`; `.python-version` = `3.14` (raiz e `apps/api/.python-version`).
- Dois apps: `apps/web` (pacote `@luc/web`, `apps/web/package.json`) e `apps/api` (projeto `luc-api`, `apps/api/pyproject.toml`). O app Python não é pacote pnpm; o workspace só o enxerga pelo glob.
- Arquivos de raiz: `biome.json`, `commitlint.config.mjs`, `lefthook.yml`, `docker-compose.yml`, `.dockerignore`, `.env.example`, `.mcp.json`, `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, `README.md`, `LICENSE`, `docs/{adr,agents,design,runbooks}`, `.github/{workflows,pull_request_template.md}`, `.claude/`. Ignorados pelo git mas presentes em disco: `prompts/`, `tmp/`, `.backfill/`, `.codex/`, `.env` (`.gitignore`).
- `apps/web/src/`: `core/{domain,ports,use-cases}` (núcleo puro), `adapters/{auth,bedrock,calendar,clock,db,http,r2}`, `app/{(app),api,login}` (App Router), `components/{agenda,areas,brand,ds,financas,painel,shell,whatsapp}`, `lib/`, `styles/`. Alias `@/*` → `./src/*` (`apps/web/tsconfig.json`). O `biome.json` tem override para `apps/web/src/core/**` proibindo importar `next`, `next/*`, `next-auth`, `@auth/core`, `react`, `react-dom`, `drizzle-orm`, `pg` (ADR-0003: núcleo sem borda).
- `apps/api/src/luc_api/`: contextos `shared/`, `finance/`, `identity/`, `whatsapp/`, cada um com `domain/`, `application/`, `adapters/`; borda HTTP em `http/{identity.py,me.py,problems.py}`; `health.py`, `main.py` (composition root `create_app`), `composition.py`, `settings.py`. `apps/api/tests/` espelha `src/` com `__init__.py` por nível e `tests/support/{finance,postgres,whatsapp}.py`.
- Arquitetura declarada: Next full-stack em migração para split (`AGENTS.md` seção "Arquitetura"; `docs/adr/0014-backend-python-fastapi.md` supersede `0001-app-unico-next-fullstack.md`). Durante a migração vale hard-freeze do backend TS (bugfix sim, feature nova não; UI livre).

## 2. Stack web (apps/web)

Fonte: `apps/web/package.json` (specifiers), `apps/web/next.config.ts`, `apps/web/tsconfig.json`, `apps/web/vitest.config.ts`, `biome.json`.

| Peça | Versão (specifier) | Observação |
| --- | --- | --- |
| Next.js | `^15.1.6` | App Router; `output: "standalone"`; `outputFileTracingRoot` = raiz do monorepo; `images.remotePatterns` para `*.r2.cloudflarestorage.com`; `env.LUC_LOCAL_AUTH_BYPASS` embutido (`next.config.ts`) |
| React / react-dom | `^19.0.0` | |
| TypeScript | `^5.7.3` | `strict`, `moduleResolution: bundler`, `verbatimModuleSyntax`, `noEmit` (`tsconfig.json`) |
| next-auth (Auth.js) | `5.0.0-beta.31` (pinado) | ver seção 5 |
| drizzle-orm / drizzle-kit | `^0.45.2` / `^0.31.10` | `drizzle.config.ts`: schema `src/adapters/db/schema.ts`, out `./drizzle`, dialect `postgresql` |
| pg | `^8.22.0` | usado também pelo runner `migrate.mjs` |
| Tailwind CSS | `^4.0.0` via `@tailwindcss/postcss` | `postcss.config.mjs` |
| visx (`@visx/{curve,group,scale,shape}`) | `^4.0.0` | gráficos (ADR-0010) |
| lucide-react | `^1.21.0` | ícones |
| `@anthropic-ai/bedrock-sdk` | `^0.32.0` | extração de comprovante (ADR-0013) |
| `@aws-sdk/client-s3` + `s3-request-presigner` | `^3.1075.0` | R2 (ADR-0008) |
| Vitest | `^3.0.0` | `environment: node`, `include: src/**/*.test.{ts,tsx}`, `esbuild.jsx: automatic`; `@testing-library/{react,jest-dom,user-event}`, `jsdom` |
| Biome | `^2.0.0` (raiz) | `lineWidth 100`, 2 espaços, aspas duplas, `semicolons: asNeeded`, `organizeImports: on`, `vcs.useIgnoreFile` |

- Scripts (`apps/web/package.json`): `dev` (roda `next dev` com `env -u` das variáveis de produção: `DATABASE_URL`, `R2_*`, `GOOGLE_*`, `AUTH_SECRET`), `build`, `start`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `db:generate` (`drizzle-kit generate`), `db:migrate` (`node migrate.mjs` contra o Postgres local).
- `apps/web/.env` é symlink para `../../.env` (raiz); `apps/web/.env.local` é **rastreado** de propósito com valores só de dev (`.gitignore`, exceção `!/apps/web/.env.local`).
- Rotas de borda: `src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/webhooks/whatsapp/route.ts`, `src/app/api/cron/digest-vencimentos/route.ts`; páginas `(app)/{painel,agenda,whatsapp}`, `login`, `page.tsx` raiz.

## 3. Stack API (apps/api)

Fonte: `apps/api/pyproject.toml`, `apps/api/uv.lock`, `apps/api/README.md`, `apps/api/src/luc_api/{main,settings}.py`.

| Peça | Specifier (`pyproject.toml`) | Resolvido (`uv.lock`) |
| --- | --- | --- |
| Python | `>=3.14` | `.python-version` = 3.14 |
| uv | gerenciador (lockfile `uv.lock`); imagem `ghcr.io/astral-sh/uv:python3.14-bookworm-slim` no build | |
| FastAPI | `>=0.116` | 0.139.0 |
| uvicorn[standard] | `>=0.35` | 0.51.0 |
| SQLAlchemy[asyncio] | `>=2.0` | 2.0.51 |
| psycopg[binary] | `>=3.2` | 3.3.4 |
| Alembic | `>=1.14` | 1.18.5 |
| PyJWT | `>=2.10` | 2.13.0 |
| boto3 (+ `boto3-stubs[s3]` dev) | `>=1.43.49` | 1.43.49 |
| pytest / pytest-asyncio | `>=8.3` / `>=0.24` | 9.1.1 / 1.4.0 (`asyncio_mode = "auto"`) |
| httpx (dev) | `>=0.28` | 0.28.1 |
| ruff | `>=0.12` | 0.15.21 |
| pyright | `>=1.1.390` | 1.1.411 (`typeCheckingMode = "strict"`) |
| import-linter | `>=2.1` | 2.13 |

- Build: `hatchling`, src layout (`packages = ["src/luc_api"]`).
- Ruff: `line-length 100`, `target-version py314`, `select` curado (`E W F I B C4 UP SIM N D PTH ASYNC PL TID RUF`), `ignore E501`, docstrings Google, `ban-relative-imports = "all"`, testes isentos de `D` e `PLR2004`; formatter aspas duplas.
- import-linter: contrato `layers` (`adapters` > `application` > `domain`) com containers `luc_api.shared`, `.finance`, `.identity`, `.whatsapp`; contrato `forbidden` impedindo `luc_api.whatsapp` de importar `luc_api.finance.domain`.
- `settings.py`: `Settings.from_env()` fail-closed, recusa boot sem `LUC_INTERNAL_JWT_SECRET`. `main.py`: `create_app(settings)` monta routers `health` e `me` e registra handlers `problem+json` (`http/problems.py`).
- Comandos canônicos (`apps/api/README.md`, `AGENTS.md`): `uv sync`, `uv run pytest`, `uv run ruff format --check .`, `uv run ruff check .`, `uv run pyright`, `uv run lint-imports`, `uv run uvicorn luc_api.main:app --reload`.
- Idioma: todo artefato de código do `apps/api` em inglês (`docs/adr/0016-ingles-codigo-apps-api.md`); forma do domínio em tipos nativos, `dataclass(frozen=True, slots=True)`, ports como `typing.Protocol` (`docs/adr/0015-forma-dominio-python-tipos-nativos.md`, `0014`).

## 4. Banco e migrações

- Banco: **PostgreSQL 16** (`postgres:16-alpine` em `docker-compose.yml` e nos `services` de `.github/workflows/pr-checks.yml`). Object storage S3-compatível: Cloudflare R2 em produção, MinIO local (`docker-compose.yml`; `docs/adr/0008-anexos-object-storage-r2.md`).
- Lado web (dono do DDL): `drizzle-kit generate` emite SQL em `apps/web/drizzle/` (13 migrações `0000_init_households_users.sql` … `0012_plain_ser_duncan.sql`, mais `seed.sql` e `meta/`). O runner é próprio, `apps/web/migrate.mjs` (JS puro com `pg`): aplica cada `.sql` uma vez (tabela `_luc_migrations`), advisory lock para execuções concorrentes, retry de conexão, seed idempotente. Roda no boot do container (`apps/web/Dockerfile`: `CMD node apps/web/migrate.mjs && node apps/web/server.js`) e no dev via `pnpm --filter @luc/web db:migrate`.
- Lado API: Alembic síncrono (`apps/api/alembic/env.py`, `target_metadata = luc_api.shared.adapters.db.metadata`), `alembic.ini` sem `sqlalchemy.url` (URL vem programaticamente de `migrate.py:load_config` ou do fallback `DATABASE_URL`). Única revisão: `apps/api/alembic/versions/baseline.py`, no-op: "the 7 tables already exist — apps/web's Drizzle migrations own their creation". `apps/api/src/luc_api/shared/adapters/db/migrate.py` expõe `migrate_on_boot` (advisory lock + `alembic upgrade head`); o `apps/api/Dockerfile` ainda não o chama no boot (comentário: "Alembic upgrade at boot arrives with persistence — ADR-0014").
- Persistência da API: SQLAlchemy Core async + psycopg3, repositórios como anti-corruption layer com mapeamento Row↔entidade, CAS com `update().where().returning()` (`docs/adr/0014-backend-python-fastapi.md`, commits `4b19f34`, `09a70e8`).

## 5. Autenticação

- **Web: Auth.js v5** (`next-auth 5.0.0-beta.31`), provider **Google** OAuth, `session.strategy: "jwt"` com `maxAge` vindo do domínio (`SESSION_MAX_AGE_SEGUNDOS` em `src/core/domain/access`), `trustHost: true`, `pages.signIn`/`error` = `/login` (`apps/web/src/auth.config.ts`).
- **Allowlist pós-OAuth** (ADR-0004, `docs/adr/0004-lockdown-allowlist-oauth-google.md`): `callbacks.signIn` chama `canSignIn(user.email, process.env.LUC_ALLOWLIST)`; config inválida → nega (fail-closed). `LUC_ALLOWLIST` = exatamente 2 e-mails (`.env.example`).
- **Split edge/Node**: `auth.config.ts` é edge-safe (sem Drizzle/pg/aws-sdk) e é o único módulo que `apps/web/src/middleware.ts` importa; `apps/web/src/auth.ts` estende com `events.signIn` → `mirrorAvatar` (espelha avatar do Google no R2; falha nunca barra login) e exporta `handlers, auth, signIn, signOut` para route handler/server actions/components.
- **Middleware** (`apps/web/src/middleware.ts`): `NextAuth(authConfig)`; `localAuthBypass(NODE_ENV, LUC_LOCAL_AUTH_BYPASS)` só fora de produção; `gateRedirect` (sem sessão → `/login`; logado em `/` ou `/login` → painel); `matcher` exclui `_next/static`, `_next/image`, `favicon.ico` e arquivos com extensão. Rota `/api/webhooks` liberada do gate (commit `9aa90e8`).
- **Bordas sem sessão**: webhook WhatsApp assinado por HMAC-SHA256 com `META_APP_SECRET`; cron do digest por `Authorization: Bearer <DIGEST_CRON_SECRET>` disparado por scheduled task do Coolify (`.env.example`, comentários).
- **API: JWT interno cunhado pelo BFF** (`apps/api/src/luc_api/http/identity.py`): HS256, `iss = "luc-web"`, `aud = "luc-api"`, claims obrigatórios `exp, iat, sub, iss, aud, household`, leeway 5 s, segredo `LUC_INTERNAL_JWT_SECRET` ("never reuse AUTH_SECRET", `apps/api/.env.example`). Dependency `current_identity` → `Identity(user_id, household_id)`; falha vira 401 `problem+json`. TTL previsto ~60 s por chamada (`docs/adr/0014`). Decisão registrada: Python **não** decripta a sessão Auth.js nem assume o login (opções rejeitadas no ADR-0014).

## 6. Dockerfiles e docker-compose

- `apps/web/Dockerfile`: `node:22-alpine` + corepack; estágios `deps` (`pnpm install --frozen-lockfile` só com manifestos), `build` (`pnpm --filter @luc/web build`, `NEXT_TELEMETRY_DISABLED=1`), `runner` (copia `.next/standalone`, `.next/static`, `public`, `drizzle/`, `migrate.mjs`; usuário `nextjs` uid 1001; `PORT=3000`, `HOSTNAME=0.0.0.0`; `CMD` migra e sobe `server.js`). **Contexto de build = raiz do monorepo**.
- `apps/api/Dockerfile`: build em `ghcr.io/astral-sh/uv:python3.14-bookworm-slim` (`uv sync --frozen --no-install-project --no-dev` para a camada de deps, depois `--no-editable`), runner `python:3.14-slim-bookworm` sem uv, copia só `/app/.venv`, usuário `luc` uid 1001, `PORT=8000`, `HEALTHCHECK` em Python contra `/health` (sem curl), `CMD uvicorn luc_api.main:app`. Contexto = raiz. Evidência registrada: imagem ~161 MB (`apps/api/README.md`).
- `.dockerignore` (raiz, compartilhado pelos dois builds): exclui `node_modules`, `.next`, `.git`, `.github`, `docs`, `prompts`, `.agents`, `.claude`, `.codex`, `.env*`, artefatos Python.
- `docker-compose.yml` (`name: luc`): `db` (`postgres:16-alpine`, `:5432`, healthcheck `pg_isready`, volume `db-data`), `minio` (`:9000` API, `:9001` console, volume `minio-data`), `minio-setup` (`minio/mc` cria bucket `luc-attachments` e libera download anônimo, idempotente), `app` (**só com `--profile full`**; `build: apps/web/Dockerfile`; `depends_on` db saudável e setup concluído; `:3000`). Credenciais são de dev local e versionadas de propósito (não reproduzidas aqui). A API Python **não** está no compose.
- Duas camadas documentadas no cabeçalho do compose e em `docs/agents/local-dev.md`: Camada 1 = dependências em container + `next dev` nativo com `LUC_LOCAL_AUTH_BYPASS`; Camada 2 = `pnpm dev:smoke` builda a mesma imagem de produção (`NODE_ENV=production` torna o bypass impossível; valida build/migração/`/login`).

## 7. Deploy atual

- Resumo oficial: "Produção: imagem Docker → GHCR → Coolify" (`README.md`, seção Arquitetura). Portão 3 em `AGENTS.md` ("Os três portões").
- `.github/workflows/deploy.yml`: dispara em `push` para `main` (e `workflow_dispatch`); `concurrency: deploy-main`. Jobs: `build-push` (web → `ghcr.io/${{ github.repository_owner }}/life-under-control`, tags `latest` + `sha` curto, cache GHA) e `build-push-api` (→ `…/life-under-control-api`), ambos com `context: .`; `deploy (coolify)` faz `curl -X POST "${COOLIFY_URL}/api/v1/deploy?uuid=${APP_UUID}&force=true"` com `Authorization: Bearer ${COOLIFY_TOKEN}` para o web (`COOLIFY_APP_UUID`) e para a API (`COOLIFY_API_APP_UUID`); depois smoke `GET https://luc.panlabs.tech/login` esperando 200 (até 15 tentativas). Guardas: se o Dockerfile não existe, pula o build; se `COOLIFY_TOKEN` está vazio, pula o deploy sem falhar. Login no GHCR com `GITHUB_TOKEN` (`permissions: packages: write`).
- Substrato (fatos documentados): VPS na **Hostinger** com painel **Coolify** (`.mcp.json` servidores `hostinger-vps` e `coolify`; `docs/agents/mcps.md`); Postgres de produção é container do Coolify na rede `coolify`, **sem porta pública**, `DATABASE_URL` interno só resolve na rede Docker do VPS; backup diário agendado do Coolify (`0 3 * * *`, retenção 7 dias, local) (`docs/runbooks/vincular-google.md`). **Cloudflare** faz DNS e proxy do LUC e hospeda os anexos no R2 (`docs/adr/0008-anexos-object-storage-r2.md`: "DNS e proxy do LUC já vivem lá"). Em produção as variáveis ficam no Coolify e o Coolify injeta a `DATABASE_URL` do serviço `luc-db` (`.env.example`, comentários). Digest diário dispara por scheduled task do Coolify (`.env.example`). O Coolify é compartilhado com projetos irmãos (panlabs, ethitorial) — ADR-0007, caso 4 de parada (`docs/adr/0007-autonomia-total-do-agente.md`).
- Alvo do split (`docs/adr/0014`): **dois apps Coolify no mesmo VPS**; API em subdomínio com allowlist de path no proxy (públicos só `/webhooks/*` e `/health`), resto só pela rede privada `luc-web → luc-api`. Evidência de execução: commit `b664681` "chore(deploy): imagem GHCR do apps/api + healthcheck + redeploy do luc-api (#186)".
- Autonomia operacional: o agente faz deploy/redeploy, env, segredos auto-geráveis, migration aditiva e merge de PR verde sozinho; para em 4 casos (trancar-se fora, recriar a VM, segredo de terceiro, tocar outro projeto no Coolify) (`AGENTS.md` "Autonomia"; ADR-0007).

## 8. CI

- `.github/workflows/pr-checks.yml` (portão 2, "o gate real"): dispara em `push` para `feat/**`, `fix/**`, `chore/**`, `docs/**`, `refactor/**`, `test/**`, `ci/**`, `worktree/**`, `worktree-**` (branches da ferramenta EnterWorktree) e `dependabot/**`; `concurrency` por ref com cancelamento.
- Jobs: `checks-node` (service `postgres:16-alpine`; `pnpm/action-setup`, `setup-node` com `node-version-file: .node-version` e cache pnpm; `pnpm install --frozen-lockfile`; `node_modules/.bin/biome check apps/web`; `pnpm --filter @luc/web typecheck`; `pnpm --filter @luc/web test` com `DATABASE_URL`), `checks-python` (service Postgres + MinIO via `docker run` porque `services:` não aceita `command:`; `astral-sh/setup-uv` com cache; `uv sync --frozen`; `ruff format --check`, `ruff check`, `pyright`, `lint-imports`, `pytest` com `DATABASE_URL` e `R2_*` de teste), `checks` (rollup `needs` dos dois, `if: always()`, falha se qualquer perna falhou), `security-scan` (`uses: panlabs-tech/.github/.github/workflows/security.yml@v1.0.0`), `security` (fachada para o nome fixo do required check), `open-pr` (`uses: panlabs-tech/.github/.github/workflows/open-pr.yml@v1.0.0`; abre o PR automaticamente; não roda para dependabot).
- `checks` e `security` são os dois required checks de nome fixo da org inteira; a CI compartilhada vive em `panlabs-tech/.github` e é pinada por tag exata (`@v1.0.0`); actions de terceiros pinadas por SHA (commit `946a9a0`). Ainda não há `.github/dependabot.yml` (comentário do workflow).
- `.github/pull_request_template.md`: seções "O que muda", "Checklist" (testes locais, sem segredos no diff, `docs/`/ADR atualizados) e "Notas para o revisor".

## 9. Segredos (nomes de variáveis, sem valores)

- `.env.example` (raiz, consumido pelo `@luc/web`; em produção configurado no Coolify): `DATABASE_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `LUC_ALLOWLIST`, `LUC_LOCAL_AUTH_BYPASS`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` (opcional, só dev/MinIO), `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `BEDROCK_MODEL_ID` (opcional), `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WABA_ID`, `WHATSAPP_VERIFY_TOKEN`, `META_APP_SECRET`, `DIGEST_CRON_SECRET`. Também `AUTH_TRUST_HOST` aparece no compose.
- `apps/api/.env.example`: `LUC_INTERNAL_JWT_SECRET`. A API também lê `DATABASE_URL` e `R2_ENDPOINT`/`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/`R2_BUCKET` (variáveis passadas em `pr-checks.yml` para o `pytest`).
- GitHub Actions secrets referenciados em `deploy.yml`: `COOLIFY_URL`, `COOLIFY_TOKEN`, `COOLIFY_APP_UUID`, `COOLIFY_API_APP_UUID` (mais `GITHUB_TOKEN` automático para o GHCR).
- Ambiente do shell para MCP (não do produto): `COOLIFY_ACCESS_TOKEN` (placeholder `${COOLIFY_ACCESS_TOKEN}` em `.mcp.json`; `docs/agents/mcps.md`), `COOLIFY_BASE_URL`, `AWS_REGION`.
- Política (`.gitignore`, `docs/agents/mcps.md`, `lefthook.yml`): `.env`, `.env.local`, `.env.*.local` ignorados com exceção de `!.env.example` e `!/apps/web/.env.local` (só valores de dev); `.claude/settings.local.json` e `.codex/` ignorados (o `.codex/config.toml` em disco carrega token literal, razão explícita do ignore no `.gitignore`); `gitleaks git --staged --redact` no pre-commit; "Nenhum segredo literal entra no `.mcp.json`". Chaves/certificados (`*.key`, `*.pem`, `id_*`, `*.p12`) ignorados.

## 10. `.mcp.json`

Versionado na raiz, com placeholders de variável de ambiente no lugar de segredos (`.mcp.json`; `docs/agents/mcps.md`; `CLAUDE.md`). Cinco servidores, todos pinados por versão exata:

| servidor | transporte | pacote/URL | variáveis esperadas |
| --- | --- | --- | --- |
| `hostinger-vps` | stdio (`npx`) | `hostinger-api-mcp@0.2.5` → binário `hostinger-vps-mcp` | nenhuma no arquivo (`env: {}`); lê do ambiente |
| `coolify` | stdio (`npx`) | `@masonator/coolify-mcp@2.12.0` | `COOLIFY_BASE_URL`, `COOLIFY_ACCESS_TOKEN` |
| `cloudflare` | http | `https://mcp.cloudflare.com/mcp` | OAuth no primeiro uso |
| `meta-devtools` | http | `https://mcp.facebook.com/devtools` | OAuth no primeiro uso |
| `aws` | stdio (`uvx`) | `awslabs.aws-api-mcp-server@1.4.0` | `AWS_REGION` (credencial IAM vem do ambiente) |

`.claude/settings.local.json` (ignorado) tem chaves `permissions`, `autoCompactWindow` e `disabledMcpjsonServers` (um servidor desabilitado localmente). O `.codex/config.toml` (ignorado) declara os mesmos quatro servidores não-AWS, só `meta-devtools` habilitado.

## 11. Documentação de agentes e prompts

- `AGENTS.md` (~13 KB) é a fonte-da-verdade da orientação de agente; `CLAUDE.md` começa com `@AGENTS.md` e acrescenta só o específico do Claude Code: hooks globais de economia de contexto (`~/.claude/hooks/`, marker-gated pelo arquivo versionado `.claude/context-economy-protocol.md`), skills/subagentes/commands como equipamento global em `~/.agents` (zero redundância; o repo não vendoriza), permissions e statusline globais com override só em `.claude/settings.local.json`, MCPs em `.mcp.json`.
- `CONTEXT.md` (~15 KB): glossário de domínio (Lar, portal, primitivos, vistas transversais, Finanças), fronteira de escopo, ambiguidades e invariantes; "código que viola invariante é bug" (`AGENTS.md` "Fonte-da-verdade").
- `docs/adr/0001`–`0016` com índice em `docs/adr/README.md`; `docs/agents/{design,domain,issue-tracker,local-dev,mcps,triage-labels,workflow}.md`; `docs/design/{README,casca,componentes,fundamentos,gaps-front-end,vocabulario}.md`; `docs/runbooks/vincular-google.md`.
- `prompts/` é **gitignored** (`**prompts` em `.gitignore`), 11 arquivos `YYYYMMDDHHMMSS_slug-kebab-ptBR.md`; convenção em `AGENTS.md` ("Prompts": timestamp via `date +%Y%m%d%H%M%S`, corpo em pt-BR começando por `# Título`, sem frontmatter).
- `.claude/`: `context-economy-protocol.md` (único artefato de equipamento versionado), `design/` e `settings.local.json` (ignorados), `worktrees/` (worktrees de agentes).
- Convenções declaradas em `AGENTS.md` "Convenções (não negociáveis)": prosa, comentários, copy e commits em pt-BR; identificadores de código em inglês (todo o `apps/api` em inglês, ADR-0016); Markdown sem hard-wrap (uma linha por parágrafo); Conventional Commits com subject minúsculo; Biome pelo binário direto. Triagem por labels `status:needs-triage|needs-info|ready-for-agent|hitl|wontfix` e família `needs:*` (`docs/agents/triage-labels.md`). Modo "implementa as issues": worktree por issue → `/tdd` → commit/push → `pr-checks` abre o PR → merge no verde (`AGENTS.md`, `docs/agents/workflow.md`).

## 12. Commitlint, lefthook, convenções de branches e commits

- `lefthook.yml` (portão 1): `pre-commit` paralelo com `api-format` (`root: apps/api/`, `uv run ruff format --check {staged_files}`), `api-lint` (`uv run ruff check`), `web-check` (`node_modules/.bin/biome check {staged_files}` sobre `apps/web/**/*.{ts,tsx,js,jsx,mjs,json,css}`), `gitleaks` (`gitleaks git --staged --no-banner --redact`); `commit-msg` roda `npx --yes --package @commitlint/cli@20.1.0 --package @commitlint/config-conventional@20.0.0 commitlint --edit {1}`. `lefthook`, `gitleaks` e o runtime do `npx` são "equipamento da máquina", provisionados globalmente (`panlabs-tech/.github`, `docs/maquina.md`), não devDependencies; `lefthook install` num clone novo.
- `commitlint.config.mjs`: `extends: @commitlint/config-conventional`, `subject-case: lower-case`. Extensão `.mjs` porque o `package.json` da raiz não declara `type: module`.
- Branches: prefixos aceitos pelo gatilho da CI `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`, `ci/`, `worktree/`, `worktree-`, `dependabot/` (`pr-checks.yml`). `main` protegida; squash-merge com título do PR virando mensagem do commit (`commitlint.config.mjs`, `AGENTS.md`).
- Commits observados (`git log --format='%s' -40`): `tipo(escopo): descrição em pt-BR minúscula (#PR)`, escopos `api`, `financas`, `portal`, `adr`, `env`, `deploy`, `shared`, `skills`; exemplos `feat(api): fastapi base — composition root, problem+json central e dependency de identidade (jwt interno) (#211)`, `chore(deploy): imagem GHCR do apps/api + healthcheck + redeploy do luc-api (#186) (#205)`.

## 13. Irmãos: ethitorial e travelmanager (divergências do molde)

_(pendente)_

## 14. Fatos que afetam outros tickets

_(pendente)_
