# Consolidação do inventário: perfil comum e divergências

Ticket: [#10](https://github.com/ThiagoPanini/minimal-me/issues/10) (parte de #1). Pesquisa, sem decisão: a decisão fica para o ticket "Convenção canônica" (#16). Data da consolidação: 2026-11-07. Nenhum segredo, valor de `.env` ou token é reproduzido; só nomes de variáveis e caminhos.

## Retomada

- **Estado**: **completo** (2026-11-07).
- **Coberto**: insumos lidos (quatro inventários, mapa #1, brief, `docs/agents/` do minimal-me); datas de último commit confirmadas na fonte por `git log`; seção 1 (perfil comum em 13 dimensões), seção 2 (56 divergências D1–D56 com projeto mais recente e impacto), seção 3 (18 lacunas L1–L18), seção 4 (56 perguntas, uma por divergência); comentário e fechamento da issue #10 pelo mesmo agente.
- **Pendente**: nada. Se reabrir: o tfbox pode mergear `feat/retrofit-anatomia-panlabs` (os fatos **[retrofit]** passam a valer em `main`); o ticket #7 (higiene) pode mudar D23 e D24; o ticket #16 responde a seção 4.
- **Onde continuar**: não se aplica. A seção 4 é a entrada do ticket "Convenção canônica" (#16).

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

Cada linha tem um identificador `D<n>` reutilizado na seção 4. "Mais recente" é o projeto com o último commit relevante mais novo entre os que usam cada opção (datas em "Insumos"); quando o trio panlabs-tech empata (2026-07-28), a célula diz "empate". "Impacto" descreve o que a divergência toca no Minimal Me, dado o brief (produto público com autor único, interface completa com toggles, web + API candidata, VPS compartilhada, repositório público em `ThiagoPanini`), sem recomendar.

### 2.1 Linguagens, runtimes e dados

| # | Dimensão | Opções em uso (projetos) | Mais recente | Impacto para o Minimal Me |
|---|---|---|---|---|
| D1 | Piso de Python | `>=3.12`, dev 3.14 (OP, inv-OP §1) · `>=3.13` (ETH, TM, inv-LUC §13) · `>=3.14` (LUC, inv-LUC §3) | OP 2026-08-21 (piso 3.12); maior piso vivo é LUC 3.14 | Imagem base da API (`python:3.14-slim` no LUC, `python:3.13-slim` nos irmãos), `pythonVersion` do pyright e `target-version` do ruff (OP infere do piso; LUC declara `py314`) |
| D2 | Versão do Node | 20 (tfbox `.node-version` [retrofit], PD `engines >=20`) · 22 (LUC `.node-version`; CI do PD e do CF) · 24 (ETH, TM) (inv-LUC §1, §13; inv-TF §5; inv-DOCS §1, §7) | PD 2026-09-03 (CI em 22); entre `.node-version`, ETH/TM 24 empate | Tag da imagem `node:<v>-alpine` do web, `.node-version` lido por `node-version-file:` na CI |
| D3 | Gerenciador Node | pnpm 11.1.0 workspace (LUC, ETH, TM, inv-LUC §1, §13) · npm (tfbox "npm não pnpm", inv-TF §6; PD `package-lock.json` v3, inv-DOCS §1; CF `package.json`, inv-DOCS §7) | PD 2026-09-03 (npm); pnpm empate 2026-07-28 | Com pnpm workspace o Coolify exige Base Directory na raiz e Dockerfile Location por app; Nixpacks não casa com lockfile na raiz (mapa, gist #8) |
| D4 | Layout do repositório | monorepo `apps/*` com web e API (LUC, TM) · `apps/web` + `packages/*`, API fora do glob (ETH) (inv-LUC §1, §13) · pacote Python único em `src/` (OP, inv-OP §3) · três stacks por pasta `aws/`, `scripts/`, `web/` (tfbox, inv-TF §1) | OP 2026-08-21 (`src/`); entre monorepos, empate | Decide quantas aplicações no Coolify (duas por repositório ou um Compose com dois serviços, gist #8), onde ficam os `root:` do lefthook e o contexto de build dos Dockerfiles |
| D5 | Política de versão de dependência web | specifiers `^` (LUC, ETH) · tudo pinado exato em `apps/web/package.json` (TM) (inv-LUC §13); Vitest 3 (LUC, TM) · 4 (ETH; tfbox `scripts/`, inv-TF §7); `jsdom` (LUC) · `happy-dom` (ETH) | empate 2026-07-28 | Reprodutibilidade do build do web e política de atualização (sem Dependabot no molde, D23) |
| D6 | Versão do Postgres | 16 (`postgres:16-alpine`, LUC compose e CI, inv-LUC §4) · 17 (ETH, TM, inv-LUC §13) | empate 2026-07-28 | Versão do serviço de banco no Coolify Project, do compose local e do `services:` da CI |
| D7 | Driver e forma de persistência Python | SQLAlchemy Core async + `psycopg[binary]` 3 + entidades `dataclass(frozen=True, slots=True)` + repositórios como anti-corruption layer (LUC ADR-0014/0015, inv-LUC §3-4; TM psycopg, inv-LUC §13) · `asyncpg` + ORM = entidade, ADR cita SQLModel (ETH, inv-LUC §13) | empate 2026-07-28 | Forma do domínio da API (régua `panlabs-python-standards` é a do LUC) e teste contra Postgres real |
| D8 | Dono do DDL e migrações | Drizzle gera SQL no web, runner próprio `migrate.mjs`; Alembic na API com uma revisão `baseline` no-op (LUC, inv-LUC §4) · Alembic único na API, 4-5 revisões (ETH, TM, inv-LUC §13) | empate 2026-07-28 | Web + API candidata precisa de um único dono de schema; o LUC está no meio dessa migração (hard-freeze do backend TS, inv-LUC §1) |
| D9 | Dockerfile da API | multi-stage `ghcr.io/astral-sh/uv:python3.14-bookworm-slim` → `python:3.14-slim-bookworm`, non-root, `HEALTHCHECK`, ~161 MB, sem Alembic no boot (LUC, inv-LUC §6) · single-stage `python:3.13-slim`, `CMD alembic upgrade head && uvicorn` (ETH, TM, inv-LUC §13) | empate 2026-07-28 | Tamanho da imagem na VPS compartilhada; se a migração roda no boot do container ou fora do pipeline |
| D10 | Ambiente local | deps em container + `next dev` nativo com `LUC_LOCAL_AUTH_BYPASS`, `app` só `--profile full`, API fora do compose, duas camadas documentadas (LUC, inv-LUC §6) · todos os serviços no compose (`web`, `api`, `postgres`/`db`) (ETH, TM, inv-LUC §13) | empate 2026-07-28 | Conteúdo de `docs/agents/local-dev.md` e do smoke local da imagem de produção |
| D11 | Object storage | R2 em produção + MinIO local, bucket criado por `minio-setup` idempotente (LUC ADR-0008, inv-LUC §4, §6) · nenhum (ETH, TM, OP) | LUC 2026-07-28 | Materiais do Autor (arquivos, imagens do blog) precisam de um lugar; só o LUC tem o padrão |

### 2.2 Lint, tipagem e ganchos

| # | Dimensão | Opções em uso (projetos) | Mais recente | Impacto para o Minimal Me |
|---|---|---|---|---|
| D12 | Rigor do ruff e do pyright | `extend-select` com ~35 famílias + `banned-api` + pyright `strict` (OP, inv-OP §5) · `select` curado de 15 famílias + `import-linter` + pyright `strict` (LUC, inv-LUC §3) · 5-6 famílias + pyright `standard`, sem import-linter (ETH, TM, inv-LUC §13) | OP 2026-08-21 | Régua da API; os dois mais rígidos são os que citam `panlabs-python-standards` (inv-OP §13; inv-LUC §14) |
| D13 | Lint e format do TypeScript | Biome 2.x pelo binário direto (LUC, ETH, TM, inv-LUC §2, §12-13) · ESLint 10 + `eslint-config-next`, quebrado em `main` (tfbox `web/`, inv-TF §4) · Prettier (CF, inv-DOCS §8) | trio 2026-07-28 (Biome) | Um formatador para TS/JSON/CSS do web e o que entra no gancho local |
| D14 | Provisionamento de lefthook, commitlint e gitleaks | "equipamento da máquina": binários globais + `npx --yes --package @commitlint/cli@20.1.0 --package @commitlint/config-conventional@20.0.0`, sem devDependency (OP, inv-OP §12; LUC, inv-LUC §12; tfbox [retrofit], inv-TF §9) · devDependencies pinadas + `prepare: lefthook install` + `pnpm exec` (ETH, TM, inv-LUC §13) | OP 2026-08-21 | Onboarding de um clone novo e se o repositório precisa de `package.json` na raiz só para ganchos; LUC chama `pnpm exec biome` de "falso-verde" (inv-LUC §13) |
| D15 | Alcance do gancho local | só arquivos staged, `--check` (OP, LUC, TM, tfbox [retrofit]) · diretório inteiro + `pyright --warnings` + `pytest -m "not integration"` + `web-types` (ETH) (inv-OP §5; inv-LUC §12-13; inv-TF §4) · nenhum gancho (PD, inv-DOCS §5) | PD 2026-09-03 (nenhum); OP 2026-08-21 (staged) | Tempo do commit (OP mede ~2,6 s, 1,9 s de commitlint, inv-OP §12) e o que o agente espera ao commitar |

### 2.3 CI, portões e repositório

| # | Dimensão | Opções em uso (projetos) | Mais recente | Impacto para o Minimal Me |
|---|---|---|---|---|
| D16 | Topologia da CI | jobs locais no repositório (OP, inv-OP §7; PD, inv-DOCS §6; LUC `checks-node`/`checks-python`, inv-LUC §8) · tudo por reusable workflows `panlabs-tech/.github@v1.0.0` (`checks-python.yml`, `checks-node.yml`, `security.yml`, `open-pr.yml`) (ETH, TM, inv-LUC §13) · reusables só para `security` e `open-pr` (LUC; tfbox [retrofit], inv-TF §5) | PD 2026-09-03 e OP 2026-08-21 (locais) | O minimal-me está em `ThiagoPanini`, não em `panlabs-tech`; OP saiu da org na #149 e não consome reusables (inv-OP §12); PD, também em `ThiagoPanini`, idem |
| D17 | Nome do required check | `gate` + `release-ready` (OP, inv-OP §7) · `gate` (PD, inv-DOCS §6) · `checks` + `security` (LUC, ETH, TM, tfbox [retrofit]; "contrato de nomes" da org, inv-LUC §8, §14; inv-TF §5) | PD 2026-09-03 (`gate`) | O nome é o contrato com o ruleset de `main`; muda-se junto |
| D18 | Gatilho da CI | `push` em `branches: ["**"]` (OP) · `push` em tudo exceto `main` (PD) · `push` em lista de prefixos (LUC, tfbox [retrofit]) · `pull_request` + `push` (CF, inv-DOCS §9; tfbox `pr-gate.yml` só para release, inv-TF §5) | PD 2026-09-03 | Branch fora da lista "pendura o PR para sempre" (tfbox `docs/agents/workflow.md`, inv-TF §9); interage com D38 |
| D19 | Abertura do PR | automática por `open-pr.yml` reusable (LUC, ETH, TM, tfbox [retrofit]) · manual `gh pr create --draft` no primeiro push (OP, inv-OP §12; PD, que registra que PR criado com `GITHUB_TOKEN` não dispara outros workflows, inv-DOCS §6) | PD 2026-09-03 (manual) | Autonomia do agente na esteira e se o repositório depende de workflow externo à conta |
| D20 | Método de merge | merge commit observado, ruleset admite `squash`/`merge`/`rebase` (OP, inv-OP §7, §12) · squash com título do PR virando mensagem (LUC, inv-LUC §12; PD `--auto --squash`, inv-DOCS §5; tfbox [retrofit], inv-TF §8) · `pr(main): <branch> -> main` (tfbox `main`, inv-TF §9) | PD 2026-09-03 (squash) | Forma do histórico de `main` e se o commitlint precisa valer para o título do PR |
| D21 | Pin de actions | SHA com versão em comentário (OP; LUC para terceiros, inv-OP §7; inv-LUC §8) · tag (`@v4`, `@v6`) (tfbox, inv-TF §5; PD, inv-DOCS §6; reusables `@v1.0.0`) | PD 2026-09-03 (tag); OP 2026-08-21 (SHA) | Postura de supply chain do repositório público |
| D22 | Security scan na CI | `security.yml` reusable (LUC, ETH, TM, tfbox [retrofit]) · nenhum job de segurança além do gitleaks local (OP, PD) | PD 2026-09-03 (nenhum) | Repositório público com segredos de deploy em Actions |
| D23 | Dependabot | semanal para actions e npm (tfbox, inv-TF §5; CF, inv-DOCS §9) · ausente (OP, inv-OP §13; LUC "ainda não", inv-LUC §8; PD, inv-DOCS §4) | PD 2026-09-03 (ausente) | Coberto pelo ticket de higiene (#7); registrado aqui só como divergência |
| D24 | Templates de issue e PR | 5 issue forms + `config.yml` + PR template (tfbox) · só PR template (LUC) · nenhum (OP, PD) (inv-TF §5; inv-LUC §8; inv-OP §13; inv-DOCS §4) | PD 2026-09-03 (nenhum) | Idem D23 (ticket #7) |

### 2.4 Release, deploy e rede

| # | Dimensão | Opções em uso (projetos) | Mais recente | Impacto para o Minimal Me |
|---|---|---|---|---|
| D25 | Artefato e alvo de publicação | pacote PyPI por OIDC (OP, inv-OP §7) · imagem GHCR + webhook Coolify na VPS (LUC, ETH, TM, inv-LUC §7) · GitHub Pages (PD, inv-DOCS §6; tfbox `web/`, inv-TF §5) · Render (app do CF, inv-DOCS §9) · Mintlify SaaS sem deploy (docs do CF, inv-DOCS §9) | PD 2026-09-03 (Pages); trio 2026-07-28 (Coolify) | Web + API na VPS só tem um caminho vivo na frota (GHCR → Coolify); páginas estáticas têm outro, gratuito |
| D26 | Versionamento e changelog | semver literal em `pyproject.toml`, `uv version --bump`, tag automática, towncrier com 7 tipos e `release-ready` como portão (OP, inv-OP §4, §7) · tag por módulo decidida pelo prefixo do commit (tfbox, inv-TF §9) · só `latest` + SHA, sem semver nem changelog (LUC, ETH, TM, inv-LUC §7) · nenhum (PD) | OP 2026-08-21 (semver + towncrier) | Nenhum produto web da frota tem versão ou changelog; um produto público pode querer dizer "o que mudou" |
| D27 | Aplicações Coolify por produto | uma aplicação (LUC ADR 0001, superada) · duas, web + api, cada uma com UUID, domínio, variáveis e webhook (LUC ADR 0014, ETH, TM) (mapa, gist #8; inv-LUC §7, §13) | trio 2026-07-28 (duas) | Dois UUIDs e dois secrets de deploy; via URL pública todo push dispara as duas; Watch Paths só com GitHub App (gist #8) |
| D28 | Migração no boot | web (`CMD node migrate.mjs && node server.js`) (LUC, inv-LUC §4) · API (`alembic upgrade head` no `CMD`) (ETH, TM, inv-LUC §13) · API do LUC ainda não migra no boot (inv-LUC §4) | empate 2026-07-28 | Qual container é dono do schema em produção (liga com D8) |
| D29 | Smoke pós-deploy | `GET /login` esperando 200, até 15 tentativas (LUC) · 200 + corpo contendo o nome do produto (ETH, TM) (inv-LUC §7, §13) | empate 2026-07-28 | Rota pública de verificação; num produto sem `/login` público a rota muda |
| D30 | Exposição da API | interna na rede `coolify`, web chama por alias de container (ETH) ou `INTERNAL_API_URL` (TM); só o web é público (inv-LUC §13-14) · alvo não executado: subdomínio público com allowlist de path (`/webhooks/*`, `/health`) (LUC ADR-0014, inv-LUC §7) | empate 2026-07-28; só a opção interna está em produção | `api.minimal-me.<domínio>` é subdomínio de 2º nível, sem certificado de borda no Universal SSL; alternativas listadas no gist #8: `/api` no mesmo host, hostname de 1º nível, API interna, zona própria |
| D31 | Rede web → api | alias de container na rede `coolify` + `ipv4first` no resolver (ETH, commit `033ea17`) · `INTERNAL_API_URL` (TM) · `luc-web → luc-api` planejado (LUC) (inv-LUC §13) | empate 2026-07-28 | Nome de serviço e variável que o web usa para falar com a API |
| D32 | Tarefas agendadas e backup | scheduled task do Coolify com Bearer (`DIGEST_CRON_SECRET`) e backup diário local `0 3 * * *` com 7 dias (LUC, inv-LUC §5, §7) · não documentado (ETH, TM) | LUC 2026-07-28 | Consolidação periódica e lembretes do brief precisam de agendamento; backup só local está documentado |

### 2.5 Autenticação e fronteira

| # | Dimensão | Opções em uso (projetos) | Mais recente | Impacto para o Minimal Me |
|---|---|---|---|---|
| D33 | Biblioteca de autenticação no web | Auth.js v5 (`next-auth 5.0.0-beta.31`, pinado) (LUC, TM) · `better-auth 1.6.16` self-hosted, tabelas `auth_*` migradas por Alembic (ETH `docs/adr/0011-auth-better-auth.md`) (inv-LUC §5, §13) | empate 2026-07-28 | O inventário marca o ETH ("hub público com um admin publicador e comentaristas") como o mais próximo do brief (inv-LUC §14); destrava o ticket Fronteira |
| D34 | Provedor de identidade e quem pode entrar | Google OAuth + allowlist fechada de 2 e-mails, fail-closed (LUC ADR-0004) · e-mail+senha, GitHub e Google opcionais por env (ETH) · OTP por e-mail (Resend) + Google via JWKS, cadastro aberto (TM ADR-0004) (inv-LUC §5, §13) | empate 2026-07-28 | Autor único: quem emite a credencial do Autor e se existe cadastro de visitantes |
| D35 | Como a API reconhece o usuário | JWT interno HS256 cunhado pelo BFF (`iss luc-web`, `aud luc-api`, TTL ~60 s, `LUC_INTERNAL_JWT_SECRET` nunca igual a `AUTH_SECRET`) (LUC) · API lê `auth_session` do better-auth direto no Postgres (ETH) · API é a autoridade: token opaco HMAC com `SESSION_PEPPER`, kill-switch `is_active` (TM) (inv-LUC §5, §13). Comum: Python não decripta a sessão do Auth.js | empate 2026-07-28 | Visitantes anônimos e o Autor autenticado chamando a mesma API; nenhuma das três opções foi desenhada para chamadas anônimas |
| D36 | Gate de rota no web | `middleware.ts` "tudo menos estáticos", split edge-safe/Node, bypass local fora de produção, `/api/webhooks` liberado (LUC) · sem middleware (ETH) · `matcher: ["/app/:path*"]` com decisão pura em `lib/auth/route-guard.ts` (TM) (inv-LUC §5, §13) | empate 2026-07-28 | Área pública + área do Autor pede gate parcial (como TM) ou nenhum (como ETH), não "tudo" (LUC) |
| D37 | Organização do `.env.example` | produto na raiz (21 nomes) + `apps/api/.env.example` (LUC) · infra e produto misturados na raiz (`HOSTINGER_API_TOKEN`, `CLOUDFLARE_API_TOKEN` junto de `GOOGLE_*`), sem por app (ETH) · raiz só (TM) (inv-LUC §9, §13) | empate 2026-07-28 | Separação entre segredos de operação (MCP/infra) e de produto num repositório público |

### 2.6 Commits, branches e idioma

| # | Dimensão | Opções em uso (projetos) | Mais recente | Impacto para o Minimal Me |
|---|---|---|---|---|
| D38 | Nome de branch | `feat/<issue>-<slug>`, `fix/<issue>-<slug>`, `research/<slug>` (OP, inv-OP §12) · `feat/<slug>` com lista de prefixos aceitos pela CI (LUC, inv-LUC §8) · `feature/<slug>` (tfbox `main`, inv-TF §9; PD `feature/<slug-em-inglês>`, inv-DOCS §5) · `NNN-slug` → `develop` → `main` (CF, inv-DOCS §7) | PD 2026-09-03 (`feature/`); OP 2026-08-21 (`feat/<issue>-`) | Gatilho da CI por prefixo (D18); o minimal-me já usa `research/<slug>` (mapa) |
| D39 | Escopo no subject do commit | sem escopo, `(#N)` no fim (OP, 0 ocorrências de `type(scope)`, inv-OP §12) · `tipo(escopo):` com escopos `api`, `portal`, `adr`, `deploy`, `shared` (LUC, ETH, TM, inv-LUC §12) · `feat(aws/<módulo>)` com escopo de pasta (tfbox, inv-TF §9) | OP 2026-08-21 (sem escopo) | Com dois apps, escopo é a forma de dizer qual mudou; sem escopo, o subject carrega isso em prosa |
| D40 | `type-enum` do commitlint | padrão `@commitlint/config-conventional` (OP, LUC, ETH, TM) · restrito a `feat feature fix hotfix chore docs config ci`, recusando `refactor`/`test` porque não geram versão (tfbox [retrofit], inv-TF §9) | OP 2026-08-21 (padrão) | Só importa se o tipo do commit alimentar release (D26) |
| D41 | Local dos worktrees | `.claude/worktrees/` ignorado (OP, inv-OP §12; LUC, inv-LUC §11; tfbox [retrofit], inv-TF §9) · `.worktrees/` ignorado (minimal-me, commit `a304a08`) | OP 2026-08-21 (`.claude/worktrees/`) | O minimal-me já diverge do molde; `.gitignore` e `docs/agents/workflow.md` precisam dizer o mesmo |
| D42 | Idioma dos arquivos de agente | pt-BR: `CLAUDE.md` do OP (inv-OP §13), `AGENTS.md` de LUC/ETH/TM (inv-LUC §11), `docs/agents/` de todos · inglês: `AGENTS.md`, `CONTEXT.md`, `DECISIONS.md`, `README.md` do PD (inv-DOCS §5); `AGENTS.md`/`CLAUDE.md` do tfbox (inv-TF §8); tudo no CF (inv-DOCS §8) | PD 2026-09-03 (inglês nos de topo); OP 2026-08-21 (pt-BR) | O brief pede uma fonte de instruções sem conflito; a regra do PD "pt-BR em tudo que humano lê" convive com `AGENTS.md`/`CONTEXT.md` em inglês no mesmo repositório |
| D43 | Idioma dos commits | pt-BR (OP, LUC, ETH, TM, PD, tfbox [retrofit]) · inglês (CF "conventional-style encouraged, not enforced", inv-DOCS §8; tfbox período intermediário, inv-TF §9) | PD 2026-09-03 (pt-BR) | Commitlint não checa idioma; é convenção de prosa |
| D44 | Travessão (`—`) em prosa | proibido em prosa publicada, verificação manual por `grep` (PD, inv-DOCS §5) · usado em subjects de commit (LUC `feat(api): fastapi base — composition root…`, inv-LUC §12) e em 29/67 páginas (CF, inv-DOCS §8) | PD 2026-09-03 (proibido) | Regra de escrita do blog e das telas públicas; nenhuma ferramenta cobra |
| D45 | README | inglês, 32 linhas, sem comandos de dev (OP, inv-OP §8) · inglês (tfbox, PD) · com seção "Arquitetura" e comandos canônicos (LUC `README.md`, `apps/api/README.md`, inv-LUC §3, §7) | PD 2026-09-03 (inglês) | Repositório público: o README é a primeira página para terceiros |

### 2.7 Instruções para agentes e documentação

| # | Dimensão | Opções em uso (projetos) | Mais recente | Impacto para o Minimal Me |
|---|---|---|---|---|
| D46 | `AGENTS.md` vs `CLAUDE.md` | `CLAUDE.md` = `@AGENTS.md` + seção específica do Claude Code (LUC, TM, inv-LUC §11, §13; tfbox, inv-TF §8) · `CLAUDE.md` de 1-2 linhas (ETH, inv-LUC §13; PD "See AGENTS.md", inv-DOCS §5) · só `CLAUDE.md`, com "Agent skills" embutido, sem `AGENTS.md` (OP, inv-OP §13) | PD 2026-09-03 (1 linha); OP 2026-08-21 (só `CLAUDE.md`) | O minimal-me já é `CLAUDE.md` → `@AGENTS.md` (brief); falta decidir o que, se algo, fica só no `CLAUDE.md` |
| D47 | Arquivo do glossário | `CONTEXT.md` na raiz (LUC, TM, inv-LUC §11, §13; PD, inv-DOCS §5) · `docs/CONTEXT.md` (ETH, inv-LUC §13) · vocabulário dentro de `docs/agents/domain.md` de 46 KB (OP, inv-OP §13) · nenhum (tfbox); aba Glossary no site (CF, inv-DOCS §7) | PD 2026-09-03 (`CONTEXT.md` raiz) | As skills ≥ 1.3.0 leem `GLOSSARY.md`, que nenhum projeto tem; o `docs/agents/domain.md` do minimal-me ainda diz `CONTEXT.md` (mapa, gist #9) |
| D48 | Registro de decisões | `docs/adr/NNNN-slug.md` em pt-BR, "parágrafo, Decidido em, `## A razão`, `## Considered Options`" (OP, 25, dois `0013`, inv-OP §8) · `docs/adr/` com `README.md` índice (LUC 16; ETH; TM, inv-LUC §11, §13) · `DECISIONS.md` único em inglês, "Rule / Why it binds" (PD, inv-DOCS §5) · `docs/sdd/adrs/*.mdx` em inglês (CF, inv-DOCS §8) · nenhum (tfbox) | PD 2026-09-03 (`DECISIONS.md`); OP 2026-08-21 (ADRs) | `docs/agents/domain.md` do minimal-me já aponta `docs/adr/`; formato interno do ADR ainda não existe aqui |
| D49 | Conjunto de `docs/agents/` | núcleo (`domain`, `issue-tracker`, `triage-labels`, `workflow`) + `testing` (OP) · núcleo + `design`, `local-dev`, `mcps` (LUC) · núcleo + `design` (tfbox [retrofit]) · núcleo + `conventions` (ETH) · núcleo (PD) · 3 arquivos, sem `workflow.md` (minimal-me) (inv-OP §13; inv-LUC §11, §13; inv-TF §8; inv-DOCS §5) | PD 2026-09-03 (núcleo) | Quais arquivos o minimal-me ganha antes do spec (`workflow.md`, `mcps.md`, `local-dev.md`, `testing.md`) |
| D50 | Labels de triagem | canônicos verbatim `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix` (OP, inv-OP §13; PD, inv-DOCS §5; minimal-me) · `status:needs-triage|needs-info|ready-for-agent|hitl|wontfix` + família `needs:*` (LUC, inv-LUC §11) | PD 2026-09-03 (canônico) | O OP registra que "scripts de frota devem ler o valor declarado" em `triage-labels.md` |
| D51 | Equipamento de agente no repositório | global em `~/.agents`/`~/.claude`, repo só com marker `.claude/context-economy-protocol.md` (LUC, inv-LUC §11; tfbox [retrofit], inv-TF §8; OP, inv-OP §13) · `.agents/skills/` + `skills-lock.json` vendorizados (tfbox `main`; CF, inv-DOCS §7) · skills vendorizadas como conteúdo do produto em `src/overpower/content/` (OP) | OP 2026-08-21 (global + marker) | O brief pede "sem regras duplicadas ou conflitantes" entre Claude Code e Codex; o mapa quer herdar `.mcp.json`, não skills |
| D52 | `.claude/rules/*.md` com `paths:` | sim: `tests.md` (OP, inv-OP §13); `conteudo`, `css-tokens`, `swizzle-theme` (PD, inv-DOCS §4) · não (LUC, ETH, TM, tfbox) | PD 2026-09-03 (sim) | Regras por caminho são só do Claude Code; o Codex não as lê |
| D53 | Pasta `prompts/` | gitignored, `YYYYMMDDHHMMSS_slug.md` em pt-BR (LUC 11, ETH 5, TM 15, inv-LUC §11, §13) · inexistente (OP, PD, tfbox) | trio 2026-07-28 | Onde ficam prompts de sessão que não são spec nem ticket |
| D54 | Documento de design | `DESIGN.md` na raiz (tfbox, inv-TF §7; CF, inv-DOCS §8) · `docs/design/{README,casca,componentes,fundamentos,gaps-front-end,vocabulario}.md` (LUC, inv-LUC §11) · `docs/design/tokens.json` + `as-built.md` (TM, inv-LUC §13) · `.design-sync/` → design system publicável (PD, inv-DOCS §4) · `docs/design/references/` com `docs/README.md` (minimal-me) | PD 2026-09-03 | O briefing de design via `/handoff` precisa de um lugar e de um formato de tokens |
| D55 | Ferramenta e lugar da documentação de usuário | Docusaurus 3.10.2 self-hosted em pt-BR, GitHub Pages, custo zero (PD, inv-DOCS §1, §6) · Mintlify SaaS em inglês, nunca publicado (CF, inv-DOCS §9) · site Next estático próprio + Wiki (tfbox, inv-TF §6) · fora do repo, no PD (OP, inv-OP §8) · nenhuma além de README e `docs/` internos (LUC, ETH, TM) | PD 2026-09-03 (Docusaurus) | O blog do Minimal Me é componente do produto, não da documentação (`blog: false` no PD); documentação de usuário de um produto público ainda não tem lugar |
| D56 | Catálogo de componentes de conteúdo | fechado, 16 componentes globais sem `import`, nomes espelhando o Mintlify (PD, inv-DOCS §4) · embutidos do Mintlify + HTML com classes `cf-*` (CF, inv-DOCS §8) | PD 2026-09-03 | Só importa se o blog reusar MDX; registrado para o ticket de documentação |

## 3. Lacunas que nenhum projeto cobre

Cada item é uma **lacuna**: algo que o brief ou o mapa exige do Minimal Me e que nenhum dos projetos de referência tem, segundo os inventários. Registro de ausência com a evidência; nenhuma solução é proposta aqui.

| # | Lacuna | Evidência de ausência na frota | Por que o Minimal Me precisa |
|---|---|---|---|
| L1 | **Camada de IA conversacional**: chat sobre materiais, recuperação (embeddings ou contexto), citação de Fontes, declaração de falta de evidência | O único uso de LLM na frota é extração de comprovante via `@anthropic-ai/bedrock-sdk` no LUC (ADR-0013, inv-LUC §2); nenhum inventário registra chat, RAG, embeddings, vetor no Postgres ou citação | Produto é "assistente fundamentado nos Materiais do Autor e que cita Fontes" (mapa, "Produto em uma linha"); itens listados em "Not yet specified: Camada de IA da v1" |
| L2 | **Teto de custo por chamada e defesa contra instruções maliciosas** (em documentos e em perguntas de visitantes) | Nenhum projeto tem limite de custo de LLM, orçamento por requisição, filtro de prompt ou sanitização de conteúdo de terceiros (inv-OP, inv-LUC, inv-TF, inv-DOCS, busca por `bedrock`/`anthropic`/`openai` só acha o adapter do LUC) | Requisitos confirmados que nenhum ticket reabre: "limite de custo por chamada" e "proteção contra instruções maliciosas em documentos e em perguntas de visitantes" (mapa, "Notes") |
| L3 | **Superfície pública anônima com abuso controlado**: rate limiting, quota por visitante, antibot | Cloudflare aparece como DNS, proxy, "WAF/CDN" e R2 (ETH ADR-0003, inv-TF §10), mas nenhum inventário registra regra de WAF, rate limit ou captcha configurado; os três apps são logados (LUC allowlist de 2 e-mails, inv-LUC §5) | "Visitantes leem e interagem", inclusive com o Assistente (brief, "O produto"); "Chat com visitantes: abuso, limites de uso, custo" (mapa, "Not yet specified"); limites do proxy Cloudflare (upload 100 MB, 524 após 100 s, WebSocket com idle timeout, gist #8) tocam streaming de chat |
| L4 | **Autenticação de um só Autor com área pública anônima** | Os três padrões assumem que todo usuário loga: gate em "tudo menos estáticos" (LUC), cadastro aberto com onboarding (TM), hub com admin e comentaristas autenticados (ETH) (inv-LUC §5, §13-14). Nenhum tem "visitante não loga; só o Autor loga" e nenhuma das três formas de a API reconhecer o usuário (D35) prevê chamada anônima | Brief: "Autor único (eu), com área de administração autenticada. Leitura e interação com a interface abertas ao público"; destrava o ticket Fronteira |
| L5 | **Funcionalidades ligadas e desligadas por toggle** (feature flags) | Nenhum projeto tem flags por funcionalidade; o mais perto é `LUC_LOCAL_AUTH_BYPASS` por variável, só fora de produção (inv-LUC §5), e `--profile full` do compose (inv-LUC §6) | Hipótese do MVP: "interface completa da visão, com funcionalidades e integrações ligadas ou desligadas por toggle" (brief); termo candidato "Funcionalidade desligada" (mapa) |
| L6 | **Observabilidade em VPS compartilhada**: logs centralizados, métricas, alertas, uptime, rastreio de erros | Só `HEALTHCHECK` no container da API e smoke `GET` pós-deploy (inv-LUC §6-7, §13); nenhum inventário registra Sentry, Grafana, Loki, uptime checker, alerta ou dashboard | "Observabilidade, backup e operação solo" (mapa, "Not yet specified"); a VPS KVM 2 de 8 GB já hospeda três projetos (gist #8) |
| L7 | **Backup fora da VPS e restauração testada** | Backup documentado é o do Coolify, diário, local, retenção 7 dias (LUC `docs/runbooks/vincular-google.md`, inv-LUC §7); nada off-site, nada para objetos no R2, nenhum runbook de restore em nenhum projeto | Materiais e memória do Autor são o ativo do produto; "material excluído não é mais recuperável pelo Assistente" exige saber o que o backup retém (mapa, "Requisitos confirmados") |
| L8 | **Publicação pública de conteúdo autoral**: blog com fluxo rascunho → revisão → publicar, sitemap, RSS, metadados sociais | PD é site estático com `blog: false` (inv-DOCS §1); LUC/ETH/TM são apps logados sem superfície pública de conteúdo (inv-LUC); CF docs nunca publicado (inv-DOCS §9). Nenhum inventário cita sitemap, RSS ou Open Graph | "Blog como componente público" e "nada publicado automaticamente pela IA: ela sugere ou rascunha, eu reviso e publico" (brief); 46 artigos em `hashnode-backup` aguardam destino (mapa) |
| L9 | **Modelo de dados de Material e Espaço**, exclusão irrecuperável pelo Assistente, preservação de fontes, memória editável | Nenhum projeto modela documentos/materiais; o LUC tem anexos no R2 com espelho de avatar (inv-LUC §4-5), sem semântica de exclusão ou de fonte | "Modelo de dados de Material e Espaço" e "memória sobre o Autor transparente, editável e removível" (mapa) |
| L10 | **Lembretes por e-mail** como funcionalidade agendada do produto (parcial) | TM lê `RESEND_API_KEY` e `EMAIL_FROM` só para OTP (inv-LUC §13); LUC tem digest diário agendado pelo Coolify, mas por WhatsApp (inv-LUC §5, §7). Nenhum tem e-mail agendado por conteúdo | "E-mail antes de WhatsApp" (brief, hipóteses); "Lembretes por e-mail: se entram na v1, como e por qual provedor" (mapa) |
| L11 | **Hostname público para a API em domínio de produto** | Universal SSL cobre só o 1º nível de subdomínio; por isso as APIs dos irmãos são internas e o alvo do LUC (subdomínio com allowlist de path) não foi executado (inv-LUC §7, §14; gist #8). Nenhum projeto exerceu `/api` no mesmo host, hostname de 1º nível para a API ou zona própria | Web + API candidata exposta ao público; o nome do domínio depende da tarefa manual de confirmar a zona Cloudflare (brief, "Tarefas manuais") |
| L12 | **IaC para VPS, Coolify e Cloudflare** | Zero Terraform fora da AWS; nenhum provider para Cloudflare, Hostinger ou Coolify em nenhum repositório; a VPS é operada por webhook, MCPs e ADRs (inv-TF §10-11). A configuração do Coolify (apps, variáveis, domínios) vive só no painel | O mapa prefere MCPs ("usar os MCPs de Hostinger, Coolify e Cloudflare sempre que possível"); fica registrado que não há estado declarativo em nenhum projeto para reproduzir a hospedagem |
| L13 | **Contrato de CI para repositórios da conta `ThiagoPanini`** | Os reusables, o `security.yml` e o contrato `checks`/`security` vivem em `panlabs-tech/.github` (inv-LUC §8, §14; inv-TF §5); OP e PD, ambos em `ThiagoPanini`, têm CI local com check `gate` e não consomem a org (inv-OP §7; inv-DOCS §6). Não há `.github` de conta em `ThiagoPanini` | O minimal-me é `ThiagoPanini/minimal-me`; herdar a "anatomia panlabs" exige decidir de onde vem o contrato (D16, D17) |
| L14 | **`GLOSSARY.md` e `docs/agents` alinhados às skills instaladas** | Skills ≥ 1.3.0 leem `GLOSSARY.md`, não `CONTEXT.md`; nenhum projeto tem `GLOSSARY.md`; `AGENTS.md` e `docs/agents/domain.md` do minimal-me dizem `CONTEXT.md` e o `issue-tracker.md` é de template anterior (gist #9; `docs/agents/domain.md` deste repositório) | Brief: "`CONTEXT.md` e ADRs nascem preguiçosamente pela skill domain-modeling"; a skill procura outro nome |
| L15 | **Testes de interface e de celular no molde web** | Playwright só no tfbox (3 testes, um com viewport 375 px, inv-TF §4); LUC/ETH/TM só Vitest unitário com DOM simulado (inv-LUC §2, §13). Nenhum inventário registra teste de acessibilidade | "Navegação, mapa de telas, estados e jornadas do MVP, incluindo uso no celular"; "boa tipografia, legibilidade e acessibilidade" (brief) |
| L16 | **Sistema visual preto e branco** com tokens e auditoria de acessibilidade | Tokens existem (PD `tokens.css` com três camadas, inv-DOCS §4; TM `docs/design/tokens.json`, inv-LUC §13; tfbox `DESIGN.md` com HSL e laranja, inv-TF §7), mas nenhum é monocromático nem registra verificação de contraste | Direção visual do brief: fundo preto puro, linhas brancas, sem cor, cinzas só por hachura; fora da stack, registrado porque o `/handoff` de design vai precisar de um formato de tokens (D54) |
| L17 | **Orçamento de recursos por aplicação na VPS compartilhada** | Coolify pede 2 vCPU/2 GB mínimos; a VPS (KVM 2, 8 GB) já hospeda três projetos (gist #8). Nenhum inventário registra limite de CPU/memória por container, nem medição de uso | Duas aplicações novas (web + API) mais um Postgres entram numa máquina já ocupada; ticket Hospedagem e orçamento |
| L18 | **Versão e changelog de produto web público** | O trio publica `latest` + SHA sem versão nem changelog (D26); só o OP (pacote) e o tfbox (módulos) versionam | Produto público com visitantes recorrentes; registrado como lacuna porque nenhum produto web da frota responde "o que mudou" |

## 4. Perguntas para o ticket "Convenção canônica"

Uma pergunta por divergência da seção 2, com o mesmo identificador. Nenhuma é respondida aqui. As lacunas L1–L18 não geram pergunta de convenção: são requisitos sem precedente na frota e seguem para os tickets que o mapa já lista (Camada de IA, Fronteira, Hospedagem e orçamento, Estrutura do repositório).

### Linguagens, runtimes e dados

- **D1.** Qual é o piso de Python do Minimal Me (`>=3.12`, `>=3.13` ou `>=3.14`) e ele é também a versão de desenvolvimento e da imagem base?
- **D2.** Qual versão de Node vai em `.node-version` (20, 22 ou 24) e na imagem `node:<v>-alpine`?
- **D3.** O repositório usa pnpm workspace (molde web) ou npm (PD, tfbox)?
- **D4.** O layout é monorepo `apps/web` + `apps/api` (LUC/TM), `apps/web` + `packages/*` (ETH) ou outro, e esse layout vira duas aplicações Coolify ou um Compose?
- **D5.** Dependências do web com specifier `^` (LUC, ETH) ou pinadas exatas (TM)? Vitest 3 ou 4? `jsdom` ou `happy-dom`?
- **D6.** Postgres 16 (LUC) ou 17 (ETH, TM) no Coolify, no compose e na CI?
- **D7.** Persistência Python com SQLAlchemy Core + psycopg3 + `dataclass(frozen)` e repositórios (LUC, régua `panlabs-python-standards`) ou ORM = entidade com asyncpg (ETH)?
- **D8.** Quem é dono do DDL: Drizzle no web (LUC hoje), Alembic na API (ETH, TM) ou outro arranjo?
- **D9.** Dockerfile da API multi-stage com `HEALTHCHECK` e non-root (LUC) ou single-stage (ETH, TM)? A migração roda no boot do container?
- **D10.** Ambiente local em duas camadas (deps em container + `next dev` nativo, LUC) ou tudo no compose (ETH, TM)?
- **D11.** O Minimal Me adota R2 + MinIO (LUC) para os Materiais do Autor desde o MVP, ou object storage fica fora da v1?

### Lint, tipagem e ganchos

- **D12.** Rigor do ruff e do pyright: `extend-select` amplo (OP), `select` curado + `import-linter` (LUC) ou mínimo (ETH, TM)? Pyright `strict` ou `standard`?
- **D13.** Biome 2 pelo binário direto é o único formatador do web?
- **D14.** Lefthook, commitlint e gitleaks como "equipamento da máquina" (npx pinado, binários globais) ou como devDependencies com `prepare`?
- **D15.** O gancho local roda só `--check` em arquivos staged (OP, LUC) ou também tipagem e testes rápidos (ETH)?

### CI, portões e repositório

- **D16.** A CI é local ao repositório (OP, PD) ou consome reusables de `panlabs-tech/.github`, estando o minimal-me em `ThiagoPanini`?
- **D17.** Qual é o nome do required check: `gate` (OP, PD) ou `checks` + `security` (trio, tfbox)?
- **D18.** O gatilho da CI é `push` em todas as branches (OP), em tudo exceto `main` (PD) ou numa lista de prefixos (LUC, tfbox)?
- **D19.** O PR é aberto automaticamente por workflow (`open-pr.yml`) ou manualmente em `--draft` no primeiro push (OP, PD)?
- **D20.** Método de merge: squash com título do PR (LUC, PD, tfbox) ou merge commit (OP)? O commitlint vale para o título do PR?
- **D21.** Actions fixadas por SHA com comentário (OP, LUC) ou por tag (tfbox, PD)?
- **D22.** Há job de segurança na CI (`security.yml` ou equivalente) além do gitleaks local?
- **D23.** Dependabot (ou equivalente) ligado desde o início, como no tfbox, ou ausente, como no molde? (decisão compartilhada com o ticket #7)
- **D24.** Templates de issue e PR como no tfbox, só PR como no LUC, ou nenhum? (idem #7)

### Release, deploy e rede

- **D25.** O deploy do web e da API é GHCR → webhook Coolify → smoke (trio) e há alguma peça estática que vai para GitHub Pages?
- **D26.** O produto web tem versão e changelog (semver + towncrier como o OP) ou só `latest` + SHA como o trio?
- **D27.** Duas aplicações Coolify (web e api) com dois UUIDs e dois webhooks (LUC ADR 0014, ETH, TM) ou um Compose único?
- **D28.** Migração no boot do web (LUC), no boot da API (ETH, TM) ou fora do pipeline?
- **D29.** Qual rota pública o smoke pós-deploy verifica num produto cuja raiz é pública e não `/login`?
- **D30.** A API fica interna na rede `coolify` (ETH, TM) ou exposta em hostname público com allowlist de path (alvo do LUC), dado o limite do Universal SSL?
- **D31.** O web fala com a API por alias de container (ETH) ou por `INTERNAL_API_URL` (TM)?
- **D32.** Tarefas agendadas pelo Coolify com Bearer secret (LUC) e backup diário local de 7 dias são a convenção herdada, ou isso fica para o ticket de Hospedagem?

### Autenticação e fronteira

- **D33.** Auth.js v5 (LUC, TM) ou better-auth self-hosted (ETH) no web? (insumo do ticket Fronteira)
- **D34.** O Autor entra por Google OAuth com allowlist (LUC), e-mail+senha (ETH) ou OTP por e-mail (TM)? Existe cadastro de visitantes?
- **D35.** A API reconhece o Autor por JWT interno cunhado pelo BFF (LUC), lendo a sessão no Postgres (ETH) ou sendo ela a autoridade (TM)? Como ela trata chamadas anônimas?
- **D36.** O gate de rota é parcial por matcher (TM), ausente (ETH) ou total com exceções (LUC)?
- **D37.** `.env.example` separa produto (raiz + por app, LUC) de infra/MCP, ou mistura (ETH)?

### Commits, branches e idioma

- **D38.** Nome de branch: `feat/<issue>-<slug>` (OP), `feat/<slug>` (trio) ou `feature/<slug>` (tfbox, PD)? `research/<slug>` continua?
- **D39.** O subject do commit leva escopo (`tipo(escopo):`, trio) ou não (OP), dado que há dois apps?
- **D40.** `type-enum` do commitlint padrão (OP, trio) ou restrito a tipos que geram versão (tfbox)?
- **D41.** Worktrees em `.worktrees/` (minimal-me hoje) ou `.claude/worktrees/` (OP, LUC, tfbox)?
- **D42.** `AGENTS.md`, glossário e registro de decisões em pt-BR (OP, trio) ou em inglês (PD, tfbox)?
- **D43.** Commits em pt-BR, como em toda a frota panlabs?
- **D44.** O travessão é proibido na prosa publicada do produto (regra do PD) e nos commits?
- **D45.** README em inglês para terceiros (OP, PD, tfbox) ou em pt-BR com arquitetura e comandos (LUC)?

### Instruções para agentes e documentação

- **D46.** O `CLAUDE.md` fica em uma linha (`@AGENTS.md`, como ETH e PD) ou importa e acrescenta uma seção específica do Claude Code (LUC, TM, tfbox)?
- **D47.** O glossário se chama `CONTEXT.md` (frota) ou `GLOSSARY.md` (o que as skills ≥ 1.3.0 leem), e fica na raiz?
- **D48.** Decisões em `docs/adr/NNNN-slug.md` com o formato do OP ("A razão / Considered Options"), com índice `README.md` (LUC), ou em `DECISIONS.md` único (PD)?
- **D49.** Quais arquivos de `docs/agents/` o minimal-me ganha antes do spec: `workflow.md`, `mcps.md`, `local-dev.md`, `testing.md`, `design.md`?
- **D50.** Labels de triagem canônicos verbatim (OP, PD, minimal-me hoje) ou dialeto `status:*` (LUC)?
- **D51.** Skills e subagentes ficam globais na máquina, com o repo carregando só o marker (LUC, tfbox retrofit), ou vendorizados em `.agents/skills/` com `skills-lock.json` (tfbox main, CF)?
- **D52.** O repositório usa `.claude/rules/*.md` com `paths:` (OP, PD), sabendo que o Codex não as lê?
- **D53.** Existe `prompts/` gitignored com arquivos timestampados (trio) ou não?
- **D54.** O documento de design vive em `DESIGN.md` na raiz (tfbox, CF), em `docs/design/*.md` (LUC) ou em tokens JSON (TM), e `docs/design/references/` continua onde está?
- **D55.** A documentação de usuário do Minimal Me fica no PD (como o OP), num site próprio (Docusaurus ou Mintlify) ou não existe na v1?
- **D56.** Se o blog usar MDX, o catálogo de componentes é fechado e global (PD) ou livre?
