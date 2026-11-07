# Consolidação do inventário: perfil comum e divergências

Ticket: [#10](https://github.com/ThiagoPanini/minimal-me/issues/10) (parte de #1). Pesquisa, sem decisão: a decisão fica para o ticket "Convenção canônica" (#16). Data da consolidação: 2026-11-07. Nenhum segredo, valor de `.env` ou token é reproduzido; só nomes de variáveis e caminhos.

## Retomada

- **Estado**: em andamento.
- **Coberto**: insumos lidos (quatro inventários, mapa #1, brief, `docs/agents/` do minimal-me); datas de último commit confirmadas na fonte; seção 1 (perfil comum) escrita.
- **Pendente**: seções 2 (divergências), 3 (lacunas) e 4 (perguntas); comentário e fechamento da issue.
- **Onde continuar**: seção 2, usando as dimensões da seção 1 como índice; as datas de recência estão em "Insumos".

## Insumos e forma de citar

| Sigla | Arquivo (somente leitura) | Projetos cobertos | Último commit relevante (confirmado por `git log -1 --date=short` em 2026-11-07) |
|---|---|---|---|
| **inv-OP** | `.worktrees/inventario-overpower/docs/research/inventario-overpower.md` (branch `research/inventario-overpower`) | `overpower` (Python, CLI) | `ff0168a` 2026-08-21 (`/home/paninit/workspaces/overpower`, `main`) |
| **inv-LUC** | `.worktrees/inventario-life-under-control/docs/research/inventario-life-under-control.md` (branch `research/inventario-life-under-control`) | `life-under-control` (LUC, molde), `ethitorial` (ETH), `travelmanager` (TM) | LUC `8a18846`, ETH `3a97571`, TM `e337ce0`, todos 2026-07-28 (`/home/paninit/workspaces/panlabs-tech/<projeto>`) |
| **inv-TF** | `.worktrees/inventario-tfbox/docs/research/inventario-tfbox.md` (branch `research/inventario-tfbox`) | `tfbox` (Terraform) | `main` `02b1d5a` 2026-04-23; branch não mergeado `feat/retrofit-anatomia-panlabs` `84a3e12` 2026-07-27, marcado **[retrofit]**; último push ao remoto 2026-10-28 (inv-TF §1) |
| **inv-DOCS** | `.worktrees/inventario-docs/docs/research/inventario-docs.md` (branch `research/inventario-docs`) | `panlabs-docs` (PD, Docusaurus), `campfire/docs` (CF, Mintlify) | PD `d344c81` 2026-09-03 (`/home/paninit/workspaces/panlabs-docs`); CF `main` `d354d18` 2026-04-30, `develop` `8d81c42` 2026-05-02 (inv-DOCS §7) |
| **mapa** | `gh issue view 1 -R ThiagoPanini/minimal-me`, seção "Decisions so far" | gists dos tickets #3, #4, #5, #6, #8 (Coolify e Cloudflare), #9 (skills e MCPs) | 2026-11-07 |
| **brief** | `docs/brief.md` (este repositório) | Minimal Me | commit `0b94b9a` |

Convenção de citação: `inv-OP §5` significa "inventário do overpower, seção 5"; caminhos de arquivo sem prefixo são relativos à raiz do projeto citado. Ordem de recência dos projetos (do mais novo ao mais antigo): PD (2026-09-03) › OP (2026-08-21) › LUC = ETH = TM (2026-07-28) › tfbox [retrofit] (2026-07-27, não mergeado) › CF (2026-05-02) › tfbox `main` (2026-04-23). O trio panlabs-tech recebeu no mesmo dia os mesmos commits de frota ("retrofit de conformidade/anatomia"), o que explica a convergência de CI, `lefthook.yml`, `commitlint.config.mjs` e `CLAUDE.md` entre os três (inv-LUC §13).

Estado do próprio `minimal-me` (worktree, `git ls-files`): `AGENTS.md`, `CLAUDE.md` (`@AGENTS.md`), `docs/agents/{domain,issue-tracker,triage-labels}.md`, `docs/brief.md`, `docs/README.md`, `docs/design/references/*.png`, `.gitignore` (ignora `.worktrees/`, commit `a304a08`). Nenhum código, CI, lockfile ou `.mcp.json` ainda.

## 1. Perfil comum por dimensão

O que vale em todos (ou em todos os projetos onde a dimensão existe), com os projetos em que foi observado. Onde um projeto foge, a fuga está na seção 2.

### 1.1 Linguagem e versões

- **Python 3 moderno, piso ≥ 3.12, desenvolvimento em 3.13/3.14, versão fixada em `.python-version` na raiz.** OP: `requires-python >=3.12`, `.python-version` 3.14 (inv-OP §1). LUC: `>=3.14`, `.python-version` 3.14 na raiz e em `apps/api/` (inv-LUC §1, §3). ETH e TM: `>=3.13`, 3.13 (inv-LUC §13).
- **Node LTS ≥ 20 declarado uma vez em arquivo lido pela CI.** LUC `.node-version` = 22 com `engines.node >=22`; ETH/TM 24 (inv-LUC §1, §13). tfbox [retrofit] `.node-version` = 20, "declarada uma vez em `.node-version` e lida por `node-version-file:`" (inv-TF §5). PD só `engines.node >=20.0`, sem arquivo de versão; CI em 22 (inv-DOCS §1). CF CI em 22 (inv-DOCS §7).
- **Web: Next.js App Router + React 19 + TypeScript `strict`.** LUC Next `^15.1.6` (resolvido 15.5.19), React 19, TS `strict`, `verbatimModuleSyntax` (inv-LUC §2); ETH/TM idem na família 15 (inv-LUC §13); tfbox `web/` Next 16 em `output: "export"` (inv-TF §7). React 19 também no PD (inv-DOCS §1).
- **API Python: FastAPI + uvicorn + SQLAlchemy 2 async + Alembic + PyJWT, src layout, `hatchling`.** LUC `apps/api/pyproject.toml` (inv-LUC §3); ETH e TM na mesma família (inv-LUC §13).
- **Terraform só na AWS**: `required_version >= 1.9`, `hashicorp/aws ~> 5.50`, CI em 1.10.5; é o único projeto com `.tf` (inv-TF §2, §10).
- **Idioma do código: inglês em tudo** (identificador, comentário, docstring, log, nome de módulo e arquivo). OP `CLAUDE.md:27-33` (inv-OP §1); LUC `docs/adr/0016-ingles-codigo-apps-api.md` (inv-LUC §3, §11); tfbox e PD com código e configuração em inglês (inv-TF §8; inv-DOCS §5).

### 1.2 Gerenciadores de pacotes e lock

- **Python: `uv` com `uv.lock` versionado e instalação travada (`--locked`/`--frozen`).** OP `[tool.uv] required-version >=0.11`, CI `UV_VERSION 0.12.1`, `uv sync --locked` (inv-OP §4). LUC `uv sync --frozen` no Dockerfile e na CI (inv-LUC §6, §8). Sem `pip`, `poetry` ou `pipenv` em nenhum inventário.
- **Build backend Python: `hatchling`** (OP `pyproject.toml:1-3`, inv-OP §4; LUC `apps/api`, inv-LUC §3).
- **Node no molde web: pnpm workspace com um só glob `apps/*`, `packageManager` fixado (`pnpm@11.1.0`), `--frozen-lockfile`.** LUC `pnpm-workspace.yaml`, raiz com uma só devDependency (`@biomejs/biome`) (inv-LUC §1, §6); TM idem (inv-LUC §13).
- **Lockfile sempre versionado** (`uv.lock`, `pnpm-lock.yaml`, `package-lock.json` v3 no PD, inv-DOCS §1). Única exceção de propósito: tfbox não versiona `.terraform.lock.hcl` porque "consumers own lockfiles" (inv-TF §2).
- **Sem task runner** (sem Makefile, `justfile`, `tox`, `nox`): OP declara isso em `pyproject.toml:146-147` (inv-OP §4); LUC usa só `scripts` do `package.json` e comandos `uv run` listados no `README.md`/`AGENTS.md` (inv-LUC §1, §3). Nenhum inventário registra Makefile.
- **Dependências de dev separadas por função**: OP grupos `dev` e `typecheck` (pyright isolado porque traz runtime Node) (inv-OP §2); LUC `boto3-stubs`, `httpx` só em dev (inv-LUC §3).
- **Ausências justificadas no próprio arquivo**: OP recusa `pytest-cov`, `syrupy`, `freezegun` com o motivo em comentário (inv-OP §2); PD "a new npm dependency lands only for new capability" (inv-DOCS §1).

### 1.3 Lint, format e tipagem

- **Python: `ruff` é o único dono de formato e lint, `line-length = 100`, docstrings Google, formatter com aspas duplas; `pyright` como type checker.** OP `pyproject.toml:162-243`, pyright `strict` (inv-OP §5). LUC `line-length 100`, `pydocstyle google`, pyright `strict`, mais `import-linter` (inv-LUC §3). ETH/TM ruff + pyright (modo `standard`) (inv-LUC §13). Nenhum projeto usa black, isort, flake8 ou mypy.
- **TypeScript no molde: Biome 2.x pelo binário direto (`node_modules/.bin/biome check`), `lineWidth 100`, 2 espaços, aspas duplas; `tsc --noEmit` como typecheck.** LUC `biome.json`, script `typecheck` (inv-LUC §2, §12); ETH/TM Biome 2.1.x (inv-LUC §13). Largura 100 coincide com o ruff.
- **Terraform: `terraform fmt -check -recursive` + `init -backend=false` + `validate`** (inv-TF §4, §5).
- **Fronteira de arquitetura cobrada por ferramenta**: LUC `biome.json` com override que proíbe `apps/web/src/core/**` de importar `next`, `react`, `drizzle-orm`, `pg` (ADR-0003) e `import-linter` com contrato `layers` na API (inv-LUC §1, §3); OP `flake8-tidy-imports.banned-api` proibindo `json.load`/`yaml.safe_load` fora dos módulos sancionados (inv-OP §5).
- **Whitespace por `.editorconfig`** (`utf-8`, `lf`, newline final; OP com `*.md` preservando trailing whitespace) (inv-OP §5). Só o OP registra o arquivo; os demais inventários não citam `.editorconfig`.
- **Gancho local roda só `--check` sobre arquivos staged, nunca reescreve** (OP `lefthook.yml:40-52`, inv-OP §5; LUC `api-format`/`api-lint`/`web-check` com `{staged_files}`, inv-LUC §12; tfbox [retrofit] `terraform fmt -check {staged_files}`, inv-TF §4). Tipagem (pyright) roda só na CI, não no gancho (OP inv-OP §5; LUC inv-LUC §12).
- **Prosa sem portão de máquina**: PD "Não há portão, régua, varredura nem hook de commit — eles existiram, e saíram" (inv-DOCS §5); OP `extend-exclude = ["*.md"]` (inv-OP §5); CF só Prettier sobre MDX (inv-DOCS §8).

### 1.4 Testes

- **Python: `pytest` com `tests/` espelhando `src/`, andaime em `tests/support/`, sem threshold de cobertura.** OP `pytest>=9`, `pytest-randomly` obrigatório, `strict = true`, `filterwarnings = ["error"]`, `--import-mode=importlib`, 663 testes, cobertura "diagnóstico efêmero, nunca portão" (inv-OP §6). LUC `apps/api/tests/` espelha `src/` com `tests/support/{finance,postgres,whatsapp}.py`, `pytest-asyncio` em `asyncio_mode = "auto"` (inv-LUC §1, §3). Nenhum inventário registra `pytest-cov` nem threshold.
- **Doutrina Python comum: `panlabs-python-standards`.** OP `docs/agents/testing.md` adjudicado "posição por posição" contra a skill, zero divergências (inv-OP §6, §13); LUC extrai sua régua para a mesma skill (`docs/adr/0014`, inv-LUC §14). Posições comuns: sem dublê de filesystem (`tmp_path`), banco real em teste (LUC Postgres como `service` na CI, inv-LUC §8), nomes `test_<cenario>_<esperado>`, AAA.
- **Web: Vitest com Testing Library e DOM simulado, `include: src/**/*.test.{ts,tsx}`.** LUC Vitest 3 + `jsdom` (inv-LUC §2); ETH Vitest 4 + `happy-dom`; TM Vitest 3.0.2 (inv-LUC §13); tfbox `scripts/` Vitest 4 (inv-TF §4).
- **CI testa contra serviços reais** (Postgres 16 + MinIO em `pr-checks.yml` do LUC, inv-LUC §8) e **em matriz** quando o artefato é multiplataforma (OP 3 SOs × 3 Pythons, inv-OP §6).
- **Testes sempre atrás do portão, nunca só locais**: OP pytest e pyright só na CI, gancho local carrega "só o que é instantâneo e offline" (inv-OP §6); ETH é o único que roda `pytest -m "not integration"` no pre-commit (inv-LUC §13).
- **Teste de rede/terceiros fora do portão**: OP `OVERPOWER_NETWORK_TESTS=1` (inv-OP §6); tfbox "Never run `terraform apply`/`plan` against real accounts" (inv-TF §3).
- **E2E só no tfbox** (Playwright, 3 testes em `web/e2e/smoke.spec.ts`, inv-TF §4); nenhum inventário do molde web registra e2e.

### 1.5 CI e portões

- **GitHub Actions em todos**, com um **job de rollup de nome fixo que é o único required check** do ruleset de `main`: OP `gate` (+ `release-ready`) (inv-OP §7); PD `gate` "sem `name:` de propósito: o id é o contrato com o ruleset" (inv-DOCS §6); trio panlabs-tech e tfbox [retrofit] `checks` + `security`, "contrato de nomes de status check" da org (inv-LUC §8, §14; inv-TF §5).
- **Rollup com `needs` + `if: always()` + asserção explícita de `needs.*.result == success`**, porque job pulado reportaria sucesso (OP `ci.yml:453-466`, inv-OP §7; LUC job `checks`, inv-LUC §8; tfbox [retrofit], inv-TF §5).
- **Gatilho em `push` de branch, deliberadamente sem `pull_request`**, porque o check run é do SHA e o gatilho duplo cria runs em `approval-required` ou reporta o mesmo SHA duas vezes: OP `branches: ["**"]` (inv-OP §7); PD "qualquer branch exceto `main`" (inv-DOCS §6); LUC e tfbox [retrofit] por lista de prefixos `feat/**`, `fix/**`, `chore/**`, `docs/**`, `refactor/**`, `test/**`, `ci/**`, `worktree/**`, `worktree-**`, `dependabot/**` (inv-LUC §8; inv-TF §5).
- **Ruleset em `main` sem bypass, nem para o dono; PR obrigatório, 0 aprovações.** OP ruleset `20562986`, `bypass_actors: []`, `required_approving_review_count: 0` (inv-OP §7); PD "A `main` não aceita push direto de ninguém, inclusive do dono" (inv-DOCS §6); LUC "`main` protegida" (inv-LUC §12); tfbox [retrofit] ruleset da org (inv-TF §5).
- **Portão local = `lefthook.yml`** com `pre-commit` paralelo (format `--check`, lint, `gitleaks git --staged --no-banner --redact`) e `commit-msg` (commitlint), armado por `lefthook install` uma vez por clone e herdado pelos worktrees. OP (inv-OP §12), LUC/ETH/TM (inv-LUC §12, §13), tfbox [retrofit] (inv-TF §4). Lefthook escolhido sobre pre-commit por ser "executor em vez de gerenciador de ambiente" (OP `lefthook.yml:8-16`). Única exceção: PD, sem gancho (inv-DOCS §5).
- **Gancho local é atalho, não portão**: "lefthook só como atalho" (mapa, gist #3); o portão real é a CI (LUC "`pr-checks.yml` (portão 2, 'o gate real')", inv-LUC §8).
- **Actions fixadas**: por SHA com a versão em comentário (OP `actions/checkout` v7.0.1, `astral-sh/setup-uv` v9.0.0, inv-OP §7; LUC "actions de terceiros pinadas por SHA", inv-LUC §8) ou por tag exata para reusables da org (`panlabs-tech/.github/...@v1.0.0`, inv-LUC §8).
- **`concurrency` por ref com cancelamento na CI; sem cancelamento no deploy** (LUC `pr-checks.yml`, inv-LUC §8; PD `ci-${{ github.ref }}` com `cancel-in-progress: true` e `pages` com `false`, inv-DOCS §6).
- **Varredura de segurança**: `gitleaks` local em todos com lefthook; na CI, `security.yml` reusable da org no trio e tfbox [retrofit] (inv-LUC §8; inv-TF §5). OP e PD sem job de segurança na CI (inv-OP §7; inv-DOCS §6).
- **PR template**: LUC ("O que muda", "Checklist" com "sem segredos no diff", "Notas para o revisor", inv-LUC §8) e tfbox (inv-TF §5). OP e PD sem templates (inv-OP §13; inv-DOCS §4).

### 1.6 Release e deploy

- **"Publicar é mergear": push em `main` é o único gatilho de publicação, com `workflow_dispatch` como fallback manual.** OP `tag.yml` em push de `main` → `release.yml` (inv-OP §7, §9); LUC/ETH/TM `deploy.yml` em push de `main` (inv-LUC §7, §13); PD `deploy.yml` em push de `main` (inv-DOCS §6); tfbox `deploy.yml` idem (inv-TF §5). Nenhum projeto publica de branch nem tem ambiente de preview (mapa, gist #8: "as-built panlabs é GitHub Actions → GHCR → webhook de deploy, sem previews").
- **O release não roda lint nem teste**: "toda tag sai de um commit que passou pelo portão" (OP `docs/agents/workflow.md:27`, inv-OP §7).
- **Molde web + API: um Dockerfile por app, contexto de build na raiz do monorepo, imagem no GHCR com tags `latest` + SHA curto, login com `GITHUB_TOKEN` (`packages: write`), depois `POST ${COOLIFY_URL}/api/v1/deploy?uuid=<APP_UUID>&force=true` com Bearer, depois smoke HTTP na URL pública.** LUC `deploy.yml` (inv-LUC §7); ETH e TM com `matrix.app` (inv-LUC §13); registrado como padrão da frota em inv-LUC §14 e inv-TF §10. Guardas: sem Dockerfile pula o build; sem `COOLIFY_TOKEN` pula o deploy sem falhar (inv-LUC §7).
- **Imagens**: Next em `output: "standalone"` sobre `node:<versão>-alpine`, usuário não-root uid 1001, `PORT`/`HOSTNAME` explícitos (inv-LUC §6, §13); API Python com `uv sync --frozen --no-dev` (inv-LUC §6). `.dockerignore` único na raiz excluindo `docs`, `.github`, `.env*`, `.claude`, `.codex`, `prompts` (inv-LUC §6).
- **Migração de banco no boot do container** (`migrate.mjs` no `CMD` do web do LUC; `alembic upgrade head` no `CMD` da API de ETH e TM), com advisory lock para execuções concorrentes (inv-LUC §4, §13).
- **Sites estáticos no GitHub Pages do próprio repositório** com `build_type: workflow`, `actions/upload-pages-artifact` + `deploy-pages`, `id-token: write` (PD inv-DOCS §6; tfbox `web/` inv-TF §5). Custo zero em repositório público (inv-DOCS §6).
- **Publicação de pacote sem token no repo**: OP trusted publishing OIDC para PyPI, `environment: pypi`, versão literal em `pyproject.toml` movida por `uv version --bump`, tag `vX.Y.Z` criada por workflow (inv-OP §4, §7).
- **Versionamento decidido por metadado do commit/fragmento, não à mão**: OP tipo do fragmento towncrier = nível mínimo do bump (ADR 0012) e job `release-ready` como portão (inv-OP §7); tfbox prefixo do subject decide o bump por módulo via `terraform-module-releaser` (inv-TF §9).

### 1.7 Segredos e `.env`

- **Nenhum segredo literal versionado; `.env`, `.env.local`, `.env.*.local`, chaves (`*.key`, `*.pem`, `id_*`, `*.p12`), `.claude/settings.local.json` e `.codex/` no `.gitignore`.** OP (inv-OP §10); LUC (inv-LUC §9); tfbox [retrofit] amplia para `.cursor/`, `.windsurf/`, `.continue/`, `.aider`, `.serena/` (inv-TF §8).
- **`.env.example` só com nomes de variáveis**, exceção `!.env.example` no `.gitignore` (LUC raiz e `apps/api/.env.example`, inv-LUC §9; ETH e TM na raiz, inv-LUC §13). OP não tem `.env` porque o produto não lê ambiente além de `Environment.from_process` (inv-OP §10).
- **`gitleaks git --staged --no-banner --redact` no `pre-commit`, binário global e não a action** ("exige licença em org"; justificado pelo repo ser público) (OP `lefthook.yml:69-78`, inv-OP §10; LUC/ETH/TM, inv-LUC §12-13; tfbox [retrofit], inv-TF §4).
- **CI com o mínimo de `secrets.*`**: OP zero (`github.token` + OIDC) (inv-OP §10); PD só `GITHUB_TOKEN` (inv-DOCS §6); LUC quatro secrets de deploy `COOLIFY_URL`, `COOLIFY_TOKEN`, `COOLIFY_APP_UUID`, `COOLIFY_API_APP_UUID` (inv-LUC §9).
- **Em produção as variáveis vivem no Coolify**, que injeta a `DATABASE_URL` do serviço de banco; o Postgres de produção não tem porta pública (inv-LUC §7, §9).
- **Segredo do MCP vem do shell, nunca do `.env` do produto**: placeholders `${VAR}` no `.mcp.json`, "Nenhum segredo literal entra no `.mcp.json`" (LUC `docs/agents/mcps.md`, inv-LUC §9-10). OP ADR 0024: "o segredo é escrito onde o git não alcança, e nunca onde alcança" (inv-OP §10).
- **Fail-closed na leitura de configuração**: LUC `Settings.from_env()` recusa boot sem `LUC_INTERNAL_JWT_SECRET`; allowlist inválida nega login (inv-LUC §3, §5).
- **Segredos de borda sem sessão**: HMAC-SHA256 em webhook (`META_APP_SECRET`) e Bearer em cron (`DIGEST_CRON_SECRET`) (inv-LUC §5).

### 1.8 MCPs declarados

- **No molde web, `.mcp.json` versionado na raiz com placeholders `${VAR}` e versões exatas; mínimo comum `hostinger-vps`, `coolify`, `cloudflare`.** LUC 5 servidores (mais `meta-devtools` e `aws`), ETH e TM 3 (inv-LUC §10, §13). `cloudflare` é remoto HTTP com OAuth no primeiro uso, sem segredo no arquivo (inv-LUC §10).
- **As mesmas três receitas vivem no catálogo do OP** (`src/overpower/catalog/catalog.yaml`: `cloudflare` remoto, `coolify` via `npx -y @masonator/coolify-mcp@2.12.0` com slot `COOLIFY_ACCESS_TOKEN`, `hostinger-vps` via `hostinger-api-mcp@0.2.5` com slot `HOSTINGER_API_TOKEN`) (inv-TF §10; inv-OP §11). O OP em si não declara `.mcp.json` para os próprios agentes (inv-OP §11).
- **Versões fixadas são antigas**: `hostinger-api-mcp@0.2.5` e `@masonator/coolify-mcp@2.12.0` contra `@hostinger/mcp` 3.31.1 e `@masonator/coolify-mcp` 3.9.0 atuais; a sintaxe `${VAR:-default}` só funciona no Claude Code (mapa, gist #9).
- **Override local em `.claude/settings.local.json` (ignorado)** com `disabledMcpjsonServers` (OP e LUC, inv-OP §11; inv-LUC §10). `.codex/config.toml` em disco e ignorado (LUC, ETH) porque carrega token literal (inv-LUC §9).
- **tfbox, PD e CF não declaram `.mcp.json`** (inv-TF §10; inv-DOCS §4; CF cita `npx mint-mcp add <siteId>` como futuro, inv-DOCS §9).

### 1.9 Commits e branches

- **Conventional Commits, subject em minúsculas, prosa em pt-BR, cobrado por commitlint no `commit-msg`.** `commitlint.config.mjs` estende `@commitlint/config-conventional` e adiciona `subject-case: lower-case` em OP (inv-OP §12), LUC/ETH/TM (inv-LUC §12-13) e tfbox [retrofit] (inv-TF §9). Extensão `.mjs` porque a raiz não declara `type: module` (inv-LUC §12).
- **Número do PR como sufixo `(#N)` no subject** (OP, LUC, ETH, TM: inv-OP §12; inv-LUC §12-13).
- **Subjects como frases completas em pt-BR**, por exemplo `feat: a fonte vira endereço, e o comando quem resolve é o ferramental (#165)` (OP) e `fix: o namespace do registry derivado do dono, e não cravado (#247)` (LUC, ETH, TM, mesmo subject nos três em 2026-07-28, confirmado por `git log -1` em cada projeto).
- **Trailers `Co-authored-by` com modelos Claude** em 28 dos últimos 40 commits do LUC (inv-LUC §13); os commits deste repositório seguem `Co-Authored-By` (ver `git log` do minimal-me).
- **Branches por prefixo de tipo, `main` como única branch longa**: `feat/`, `fix/`, `chore/`, `docs/`, `research/` aparecem em OP (inv-OP §12), LUC (inv-LUC §8) e tfbox [retrofit] (inv-TF §9); PD `feature/<slug>` e `research/<nome>` (inv-DOCS §5). Nenhum projeto panlabs usa `develop`; só o CF (`NNN-slug` → `develop` → `main`, inv-DOCS §7).
- **Um worktree por issue, aninhado dentro do repositório e ignorado** (`.claude/worktrees/` em OP, LUC e tfbox [retrofit]: inv-OP §12; inv-LUC §11; inv-TF §9; o minimal-me usa `.worktrees/`, commit `a304a08`).
- **Esteira comum**: `/wayfinder → /to-spec → /to-tickets → /tdd → worktree → PR → merge no verde` (OP `docs/agents/workflow.md`, inv-OP §13; tfbox [retrofit] `docs/agents/workflow.md`, inv-TF §8; PD `docs/agents/workflow.md`, inv-DOCS §5; LUC "implementa as issues", inv-LUC §11).
- **Merge autônomo no verde admitido** (`gh pr merge --auto` em OP, inv-OP §12; `gh pr merge --auto --squash` em PD, inv-DOCS §5; "merge autônomo com squash" tfbox [retrofit], inv-TF §8; "merge de PR verde sozinho" LUC ADR-0007, inv-LUC §7).
- **Branch remota apagada por `gh api -X DELETE`** porque `gh pr merge --delete-branch` falha com `main` em worktree (OP `CLAUDE.md:39`, inv-OP §12).
- **Changelog não vem das mensagens de commit**: OP usa fragmentos towncrier e registra que o commitlint "não alimenta automação" (inv-OP §12); tfbox é a exceção, onde o subject decide o release (inv-TF §9).

### 1.10 Idioma de código e prosa

- **Código em inglês, prosa para humanos em pt-BR**: commits, tickets, ADRs, `docs/agents/`, `CLAUDE.md`/`AGENTS.md` do molde. OP `CLAUDE.md:27-33`, regra 43 do padrão panlabs "conferida em review" (inv-OP §1, §13); LUC `AGENTS.md` "Convenções (não negociáveis)": prosa, comentários, copy e commits em pt-BR; identificadores em inglês (inv-LUC §11); PD `docs/agents/workflow.md:30`: "Inglês só no que a máquina casa — nome de branch, de check, de diretório; pt-BR em tudo que humano lê" (inv-DOCS §5).
- **Nomes de arquivo e rota em pt-BR sem acento, kebab-case**: ADRs do OP (inv-OP §8), `content/` do PD (`visao-geral.md`, `codigos-de-saida.md`) (inv-DOCS §5).
- **Markdown sem hard-wrap, uma linha por parágrafo** (LUC `AGENTS.md`, inv-LUC §11); OP `.editorconfig` preserva trailing whitespace em `*.md` para quebra dura, mas é a única menção (inv-OP §5).
- **Conteúdo publicado em pt-BR, locale único** (PD `i18n.defaultLocale: 'pt-BR'`, inv-DOCS §2).
- **README em inglês quando o artefato é público para terceiros**: OP `README.md` 32 linhas em inglês (inv-OP §8); tfbox `README.md` inglês (inv-TF §6); PD `README.md` inglês (inv-DOCS §5).

### 1.11 Instruções para agentes

- **Uma fonte de instruções em `AGENTS.md`, `CLAUDE.md` só importa (`@AGENTS.md`) e acrescenta o específico do Claude Code.** LUC (`AGENTS.md` ~13 KB; `CLAUDE.md` com hooks globais, equipamento em `~/.agents`, permissions locais, MCPs em `.mcp.json`) (inv-LUC §11); TM idem; ETH `CLAUDE.md` de 2 linhas (inv-LUC §13); tfbox `CLAUDE.md` importa `@AGENTS.md` e adiciona blast radius, contrato de commit e comportamentos (inv-TF §8); PD `CLAUDE.md` = "See AGENTS.md" (inv-DOCS §5); minimal-me `CLAUDE.md` = `@AGENTS.md` (brief, "Desenvolvimento assistido"). Única exceção: OP, sem `AGENTS.md` (inv-OP §13).
- **`docs/agents/` em pt-BR com um núcleo repetido**: `issue-tracker.md`, `triage-labels.md`, `domain.md`, `workflow.md` presentes em OP (5 arquivos, mais `testing.md`), LUC (7, mais `design`, `local-dev`, `mcps`), tfbox [retrofit] (5, mais `design`), PD (4) (inv-OP §13; inv-LUC §11; inv-TF §8; inv-DOCS §5). O minimal-me tem 3 (`domain`, `issue-tracker`, `triage-labels`), sem `workflow.md` (`git ls-files` do worktree).
- **`issue-tracker.md` com as mesmas operações de wayfinding**: labels `wayfinder:map|research|prototype|grilling|task`, sub-issues e `blocked_by` nativos via `gh api`, reivindicação com `gh issue edit <N> --add-assignee @me`, resolução por comentário + fechar + linha em "Decisions so far" (OP inv-OP §13; PD inv-DOCS §5; minimal-me `docs/agents/issue-tracker.md`).
- **Pesquisa em branch `research/<slug>` descartável, arquivo `docs/research/<slug>.md`, registrada na issue** (OP `docs/research/` com cabeçalho Ticket/Data/Insumo, inv-OP §8; PD `docs/agents/issue-tracker.md`, inv-DOCS §5; mapa, "Pesquisa").
- **Decisões em ADR numerado de 4 dígitos, pt-BR, kebab-case sem acento, título como frase, em `docs/adr/`.** OP 25 ADRs com estrutura "parágrafo de decisão, 'Decidido em …', `## A razão`, `## Considered Options`" (inv-OP §8); LUC 0001–0016 com `docs/adr/README.md` como índice; ETH ≥ 0011; TM ≥ 0008 (inv-LUC §11, §13). "Onde a skill e uma decisão do mapa divergirem, vence o mapa e a divergência vira ADR" (OP `docs/agents/workflow.md`, inv-OP §13).
- **Glossário de domínio num arquivo de topo, single-context**: `CONTEXT.md` na raiz em LUC (~15 KB, "código que viola invariante é bug"), TM e PD (inv-LUC §11, §13; inv-DOCS §5). Nenhum projeto tem `GLOSSARY.md`, que é o que as skills leem desde a 1.3.0 (mapa, gist #9).
- **`.claude/` rastreado só com marcadores e regras, nunca equipamento**: `context-economy-protocol.md` (marker de hooks de máquina) em OP, LUC e tfbox [retrofit] (inv-OP §13; inv-LUC §11; inv-TF §8); `.claude/rules/*.md` com frontmatter `paths:` em OP (`tests.md`) e PD (`conteudo`, `css-tokens`, `swizzle-theme`) (inv-OP §13; inv-DOCS §4). Skills, subagentes e commands "como equipamento global em `~/.agents`, zero redundância; o repo não vendoriza" (LUC `CLAUDE.md`, inv-LUC §11; tfbox [retrofit] "Agent equipment lives globally, not here", inv-TF §8).
- **Triagem por cinco papéis canônicos** (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) em OP, PD e minimal-me (inv-OP §13; inv-DOCS §5; `docs/agents/triage-labels.md`).
- **Comentários longos com a decisão e a medição dentro dos arquivos de configuração** (`pyproject.toml`, `lefthook.yml`, `ci.yml` do OP, inv-OP §8; `docusaurus.config.js` de 445 linhas do PD, inv-DOCS §2).
- **Autonomia do agente com casos de parada nomeados**: LUC ADR-0007 (para em 4 casos: trancar-se fora, recriar a VM, segredo de terceiro, tocar outro projeto no Coolify) (inv-LUC §7); tfbox proíbe `apply`, backend e subir pins (inv-TF §2, §8).

### 1.12 Documentação

- **`docs/` dentro do repositório é documentação para agentes e decisões, não para usuários**: `docs/{adr,agents,research}` em OP (inv-OP §3); `docs/{adr,agents,design,runbooks}` em LUC (inv-LUC §1); PD "`docs/` é a documentação deste repositório e não entra no build: o site sai de `content/`" (inv-DOCS §4).
- **Documentação de usuário fora do repositório do produto ou num site estático próprio**: OP migrou `website/` para `panlabs-docs` "para não haver duas fontes de um texto" (inv-OP §8); tfbox publica `web/` no GitHub Pages e a Wiki pelo releaser (inv-TF §6).
- **Docusaurus é o gerador em uso e publicado** (PD 3.10.2 fixado, pt-BR, GitHub Pages, custo zero, último deploy 2026-09-08, inv-DOCS §1, §6); Mintlify existe só no CF, escrito e nunca publicado (inv-DOCS §9).
- **Documentação gerada do código ou de contrato, nunca editada à mão**: tfbox cabeçalho de bloco em todo `.tf` extraído pelo parser (inv-TF §6); PD `contracts/overpower.json` → páginas `.mdx` + fragmento de sidebar em `prebuild` (inv-DOCS §3); OP docstrings Google obrigatórios e módulo abre com linha de responsabilidade (inv-OP §8).
- **Artefatos para leitores-máquina**: PD emite `.md` por rota, `llms.txt`, `llms-full.txt` (plugin `ai-era`) (inv-DOCS §5); Mintlify faz o mesmo automaticamente (inv-DOCS §9).
- **Regras de escrita do PD** (voz `you` + imperativo, zero travessão em prosa publicada, `description` obrigatória, `{#id}` em âncoras) são "prosa sem gate" (inv-DOCS §5).

### 1.13 Infraestrutura

- **Substrato compartilhado: VPS Hostinger KVM 2 (2 vCPU, 8 GB, Ubuntu 24.04) com Coolify como PaaS (Traefik, Postgres, backups) e Cloudflare como DNS, proxy, WAF/CDN e R2.** ETH `docs/adr/0003-infra-hostinger-vps-coolify.md` (inv-TF §10); LUC (inv-LUC §7); TM `docs/adr/0008` (inv-TF §10). A VPS já hospeda três projetos (mapa, gist #8).
- **Um Coolify Project por produto, com uma zona DNS e um Postgres próprio**, no painel compartilhado; "isolamento forte é o gatilho de revisão" (ETH ADR-0003; TM ADR-0008; LUC ADR-0007 caso 4) (inv-TF §10; inv-LUC §14).
- **Postgres como container do Coolify na rede `coolify`, sem porta pública; backup diário agendado `0 3 * * *`, retenção 7 dias, local** (LUC `docs/runbooks/vincular-google.md`, inv-LUC §7).
- **Cloudflare na frente: registro A proxied, TLS Full (strict), origem fechada aos ranges Cloudflare ou `cloudflared tunnel`** (ETH `docs/adr/0006-cloudflare-na-frente-da-vps.md`, inv-TF §10; mapa, gist #8).
- **Limite registrado duas vezes: o Universal SSL grátis não cobre subdomínio de segundo nível (`api.<projeto>.panlabs.tech`)**, por isso as APIs dos irmãos ficam internas na rede `coolify` e só o web é público (TM `docs/adr/0004`, `0008`; inv-LUC §14; mapa, gist #8).
- **Nenhum Terraform fora da AWS, nenhum provider para Cloudflare, Hostinger ou Coolify em nenhum repositório inspecionado**; a VPS é operada por webhook do Coolify, MCPs e ADRs, sem IaC declarativa (inv-TF §10-11; mapa, gist #5).
- **Tarefas agendadas pelo Coolify** (scheduled task do digest diário do LUC) (inv-LUC §5, §7).
- **Object storage S3-compatível: R2 em produção, MinIO local** (LUC ADR-0008, inv-LUC §4, §6).

## 2. Tabela de divergências

(pendente)

## 3. Lacunas que nenhum projeto cobre

(pendente)

## 4. Perguntas para o ticket "Convenção canônica"

(pendente)
