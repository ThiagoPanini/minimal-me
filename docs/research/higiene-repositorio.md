# Higiene de repositório nos projetos de referência

Pesquisa do ticket [#7](https://github.com/ThiagoPanini/minimal-me/issues/7) (parte de #1). Pergunta: o que os repositórios de referência já fazem de higiene, e o que a documentação oficial do GitHub oferece para as lacunas? Fatos, não recomendações. Cada afirmação cita caminho de arquivo (relativo ao clone local indicado), comando `gh` ou URL. Coleta em 2026-11-07, com `gh` autenticado como `ThiagoPanini` (escopos `admin:org`, `repo`, `project`, `workflow`; `gh auth status`), então nenhuma consulta abaixo foi negada por permissão.

## Retomada

- **Estado**: em andamento. Seis repositórios e o repo meta cobertos; tabela preenchida.
- **Coberto**: overpower, life-under-control, ethitorial, travelmanager, tfbox, panlabs-docs, `panlabs-tech/.github` (contexto), GitHub Projects, rulesets, segurança, hooks locais.
- **Pendente**: (1) confirmar via API a árvore `.github/` e a raiz do `main` remoto de `tfbox` e `panlabs-docs`, cujos clones locais estão atrás do remoto; (2) confirmar quais check-runs o `main` do tfbox publica de fato; (3) seção "Lacunas" com a documentação oficial do GitHub (CODEOWNERS, arquivos de saúde comunitária e defaults de org, SECURITY/CONTRIBUTING, merge queue, rulesets de org/tag/workflows obrigatórios, Projects, code scanning, labels padrão de org).
- **Onde continuar**: preencher a seção "Lacunas" no fim; depois comentar e fechar a issue #7.

## Clones locais usados

| Repositório | Clone local (somente leitura) | `origin/main` local × `main` remoto |
|---|---|---|
| `ThiagoPanini/overpower` | `/home/paninit/workspaces/overpower` | igual (`ff0168a`, 2026-08-21) |
| `panlabs-tech/life-under-control` | `/home/paninit/workspaces/panlabs-tech/life-under-control` | igual (`8a18846`, 2026-07-28) |
| `panlabs-tech/ethitorial` | `/home/paninit/workspaces/panlabs-tech/ethitorial` | igual (`3a97571`, 2026-07-28) |
| `panlabs-tech/travelmanager` | `/home/paninit/workspaces/panlabs-tech/travelmanager` | igual (`e337ce0`, 2026-07-28) |
| `panlabs-tech/tfbox` | `/home/paninit/workspaces/panlabs-tech/tfbox` (checkout em `feature/repo-improvement`) | local `0ffff2f` atrás do remoto `7486a50` (2026-07-28); fatos lidos de `origin/main` local e conferidos via API |
| `ThiagoPanini/panlabs-docs` | `/home/paninit/workspaces/panlabs-docs` | local `fe22e5f` atrás do remoto `1c3c7f2` (2026-09-08); idem |
| `panlabs-tech/.github` (repo meta, contexto) | `/home/paninit/workspaces/panlabs-tech/.github` | local `f178395` atrás do remoto `7bb5cb2` (2026-11-02); lista de workflows conferida via API |

Comparação: `gh api repos/<r>/commits/main --jq .sha` contra `git -C <clone> rev-parse origin/main`. Nenhum `git fetch` foi executado nos clones.

## Tabela repositório × prática

| Prática | overpower | life-under-control | ethitorial | travelmanager | tfbox | panlabs-docs |
|---|---|---|---|---|---|---|
| Templates de issue (`.github/ISSUE_TEMPLATE/`) | não | não | 1 form (`task.yml`) | não | 5 forms + `config.yml` + `README.md` | não |
| Template de PR (`.github/pull_request_template.md`) | não | sim | sim | sim | sim | não |
| Workflows de CI (`.github/workflows/`) | 3 próprios: `ci.yml`, `tag.yml`, `release.yml` | 2: `pr-checks.yml` (caller parcial), `deploy.yml` | 2: `pr-checks.yml` (caller), `deploy.yml` | 2: `pr-checks.yml` (caller), `deploy.yml` | 5 próprios: `feature.yml`, `pr-gate.yml`, `deploy.yml`, 2 `reusable-*.yml` locais | 2: `ci.yml`, `deploy.yml` |
| Referencia a CI compartilhada `panlabs-tech/.github@v1.0.0` | não | parcial (`security.yml`, `open-pr.yml`; pernas Python/Node locais) | sim (4 workflows) | sim (4 workflows) | não | não |
| Actions pinadas por SHA (com comentário de versão) | sim, todas | só em `pr-checks.yml`; `deploy.yml` usa tags `@v4`/`@v5` | idem (`deploy.yml` com `@v6`/`@v7`) | idem (`deploy.yml` com `@v4`/`@v6`) | não (tags `@v4`, `@v5`, `@v6`, `@v9`) | não (tags `@v3`, `@v4`, `@v5`) |
| Dependabot version updates (`.github/dependabot.yml`) | não | não | não | não | sim (github-actions, npm `/scripts`, npm `/web`) | não |
| Dependabot security updates (configuração do repo) | desligado | ligado (pausado) | ligado (pausado) | ligado (pausado) | ligado (pausado) | desligado |
| Dependabot alerts (`vulnerability-alerts`) | ligado | ligado | ligado | ligado | ligado | ligado |
| Secret scanning + push protection | desligados | ligados | ligados | ligados | ligados | desligados |
| Renovate (`renovate.json`) | não | não | não | não | não | não |
| CODEOWNERS (raiz, `.github/`, `docs/`) | não | não | não | não | não | não |
| Labels (total) | 20 | 29 | 25 | 30 | 21 | 18 |
| Vocabulário de triagem do wayfinder (`needs-triage`… + `wayfinder:*`) | sim, verbatim | com prefixo `status:` e `wayfinder:*` | dialeto próprio (`proposed`, `agent-ready`, `hitl`, `blocked`); sem `wayfinder:*` | com prefixo `status:`; sem `wayfinder:*` | verbatim os 5 de triagem; sem `wayfinder:*` | sim, verbatim |
| Ruleset na branch default | sim (2 regras) | sim, padrão `panlabs` (6 regras) | idem | idem | idem | sim (4 regras) |
| Required status checks (contexts) | `gate`, `release-ready` (strict off) | `checks`, `security` (strict on) | idem | idem | idem | `gate` (strict off) |
| Assinatura de commit obrigatória (`required_signatures`) | não | sim | sim | sim | sim | não |
| Histórico linear + sem force-push + sem deleção | não | sim | sim | sim | sim | só deleção e force-push |
| Métodos de merge permitidos pelo ruleset | squash, merge, rebase | squash | squash | squash | squash | squash |
| Proteção de branch clássica | nenhuma | nenhuma | nenhuma | nenhuma | nenhuma | nenhuma |
| `bypass_actors` no ruleset | vazio | vazio | vazio | vazio | vazio | vazio |
| GitHub Projects vinculados | 0 | 0 | 0 | 0 | 0 | 0 |
| Hooks locais | `lefthook.yml` + `commitlint.config.mjs` (commitlint via `npx` pinado) | idem | `lefthook.yml` + commitlint como devDependencies, `prepare: lefthook install` | `lefthook.yml` + devDependencies pinadas | não | não |
| Scan de segredos local (`gitleaks git --staged`) | sim | sim | sim | sim | não | não |
| `.editorconfig` | sim | não | não | não | não | não |
| LICENSE | MIT | MIT | MIT | MIT | MIT | nenhuma |
| CONTRIBUTING / SECURITY.md / CODE_OF_CONDUCT | não | não | não | não | não | não |
| `docs/agents/{issue-tracker,triage-labels,workflow}.md` | sim | sim | sim | sim | a confirmar no remoto | sim |
| Auto-merge permitido (`allow_auto_merge`) | sim | sim | sim | sim | sim | sim |
| Apagar branch no merge | não | sim | sim | sim | sim | sim |
| Wiki / Discussions | off / off | off / off | off / off | off / off | **on** / off | off / off |

Fontes por linha: inventário com `find <clone>/.github -type f` e `ls -A <clone>`; metadados com `gh repo view <r> --json ...` e `gh api repos/<r>`; labels com `gh label list -R <r> --limit 100`; rulesets com `gh api repos/<r>/rulesets` e `gh api repos/<r>/rulesets/<id>`; proteção clássica com `gh api repos/<r>/branches/main/protection` (404 "Branch not protected" nos seis); segurança com `gh api repos/<r> --jq .security_and_analysis`, `gh api -i repos/<r>/vulnerability-alerts` (204 nos seis) e `gh api repos/<r>/automated-security-fixes`; CODEOWNERS com `gh api repos/<r>/contents/{CODEOWNERS,.github/CODEOWNERS,docs/CODEOWNERS}` (404 nos 18 caminhos); perfil de comunidade com `gh api repos/<r>/community/profile`; Projects com `gh api graphql` em `repository.projectsV2`.

## Detalhe por repositório

### ThiagoPanini/overpower

Público, MIT, default `main`, topics `ai, cli, cli-tool, python` (`gh api repos/ThiagoPanini/overpower`). Projeto Python gerido por `uv` (`pyproject.toml`, `.python-version`).

- **Templates**: `.github/` contém apenas `workflows/` (`find .github -type f`). `gh api repos/ThiagoPanini/overpower/community/profile` reporta `issue_template` e `pull_request_template` ausentes.
- **`.github/workflows/ci.yml`** (466 linhas): gatilho `push` em `branches: ["**"]`, deliberadamente sem `pull_request` (comentário nas linhas 7-13: o check run é do SHA, e o gatilho `pull_request` criaria runs em `approval-required` quando o PR é aberto com `GITHUB_TOKEN`). Jobs: `static` (`uv sync --locked --all-groups`, `ruff format --check`, `ruff check`, `pyright`, e três guardas de empacotamento P1/P2/P3), `test` (matriz `ubuntu/macos/windows` × Python, `uv run pytest`), `release-ready` (só fora de `main`; falha se o merge publicaria versão que o PyPI já tem) e `gate` (`needs: [static, test]`, `if: always()`, verifica `result == success` de cada perna). `UV_VERSION` pinada (`0.12.1`). Actions pinadas por SHA com comentário de versão (`actions/checkout@3d3c42e5… # v7.0.1`).
- **`.github/workflows/tag.yml`** (94 linhas): `push` em `main`, `permissions: contents: write`; lê `uv version --short`, cria a tag `v*` quando o bump moveu a versão e dispara `release.yml` via `workflow_dispatch` (comentário linhas 16-25: tag criada com `GITHUB_TOKEN` não dispara `push: tags`). Decisão em `docs/adr/0012-o-bump-e-ato-do-autor-e-o-portao-o-ensina.md`.
- **`.github/workflows/release.yml`** (71 linhas): `push` em `tags: ["v*"]` e `workflow_dispatch`; `environment: pypi`, `permissions: id-token: write, contents: read`; `uv build --no-sources`, smoke do wheel e do sdist, `uv publish` (trusted publisher; o nome do arquivo faz parte da credencial, linhas 1-5).
- **Dependabot/Renovate**: sem `.github/dependabot.yml` nem `renovate.json` (local e `gh api .../contents`). `security_and_analysis`: `dependabot_security_updates`, `secret_scanning`, `secret_scanning_push_protection` todos `disabled`. Alerts ligados (`vulnerability-alerts` → 204). Zero PRs de `app/dependabot`.
- **Labels** (20): os 9 padrão do GitHub (`bug`, `documentation`, `duplicate`, `enhancement`, `good first issue`, `help wanted`, `invalid`, `question`, `wontfix`), os 5 `wayfinder:{map,research,prototype,grilling,task}`, os 4 de triagem `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, e `v0.2`. Vocabulário declarado em `docs/agents/triage-labels.md`.
- **Ruleset** `20562986` "main: PR obrigatorio e gate verde" (`gh api repos/ThiagoPanini/overpower/rulesets/20562986`): `target: branch`, `~DEFAULT_BRANCH`, `bypass_actors: []`; regras `pull_request` (`allowed_merge_methods: [squash, merge, rebase]`, `required_approving_review_count: 0`) e `required_status_checks` com contexts `gate` e `release-ready`, `strict: false`. Proteção clássica: 404. Repo: `merge/squash/rebase` todos permitidos, `deleteBranchOnMerge: false`, `allow_auto_merge: true`, `default_workflow_permissions: write`. Environments: `pypi` (sem regra de proteção) e `github-pages`.
- **Hooks locais**: `lefthook.yml` com `pre-commit` paralelo (`uv run ruff format --check {staged_files}`, `uv run ruff check`, guarda `content-tracked`, `gitleaks git --staged --no-banner --redact`), `commit-msg` (`npx --yes --package @commitlint/cli@20.1.0 --package @commitlint/config-conventional@20.0.0 commitlint --edit {1}`) e `post-merge` (`./scripts/overpower-docs-update.sh`, nunca bloqueia). Cabeçalho registra a escolha de lefthook em vez de pre-commit (pre-commit pina versões num `rev:` paralelo ao lockfile). `lefthook` e `gitleaks` são equipamento global da máquina, não dependência do repo. `commitlint.config.mjs`: `extends config-conventional` + `subject-case: lower-case`.
- **`.editorconfig`**: `root = true`, `utf-8`, `lf`, `insert_final_newline`, `trim_trailing_whitespace`, 2 espaços (4 em `*.py`, `tab` em `Makefile`, sem trim em `*.md`); `max_line_length` ausente de propósito (o dono é o ruff em `pyproject.toml`).
- **Outros**: `.vscode/{extensions,settings}.json`; `docs/agents/{issue-tracker,triage-labels,workflow}.md`; `docs/adr/0001…0025`; changelog por `towncrier` (`[tool.towncrier]` em `pyproject.toml`); code scanning `not-configured` (`gh api .../code-scanning/default-setup`).

### panlabs-tech/life-under-control

Público, MIT, monorepo `apps/web` (Next.js, pnpm) + `apps/api` (FastAPI, uv). `.node-version` = `22`, `.python-version` = `3.14`.

- **Templates**: sem `ISSUE_TEMPLATE/`. `.github/pull_request_template.md` (13 linhas): seções "O que muda", "Checklist" (testes locais, sem segredos no diff, `docs/` ou `docs/adr/` atualizados) e "Notas para o revisor".
- **`.github/workflows/pr-checks.yml`** (231 linhas): gatilho `push` em `feat/**, fix/**, chore/**, docs/**, refactor/**, test/**, ci/**, worktree/**, worktree-**, dependabot/**`; `permissions: contents: read`; `concurrency` por ref com cancelamento. Jobs `checks-node` e `checks-python` **locais** (com `services: postgres:16-alpine` e MinIO via `docker run`; motivo nas linhas 16-23: `services` não é parametrizável em reusable workflow), rollup `checks` (`needs` nas duas pernas, `if: always()`, reprova se alguma perna não for `success`/`skipped`), `security-scan` → `uses: panlabs-tech/.github/.github/workflows/security.yml@v1.0.0`, fachada `security` (necessária porque job que chama reusable publica `<caller> / <chamado>`), `open-pr` → `open-pr.yml@v1.0.0` com `if: github.actor != 'dependabot[bot]'`. Comentário nas linhas 26-31 registra que a tag `@v1.0.0` só será bumpada sozinha quando houver `.github/dependabot.yml` com ecossistema `github-actions`, que "ainda não existe aqui".
- **`.github/workflows/deploy.yml`** (173 linhas): `push` em `main` + `workflow_dispatch`; build e push de `apps/web` e `apps/api` para GHCR (`ghcr.io/${{ github.repository_owner }}/…`), redeploy no Coolify via `curl` guardado pela presença de `secrets.COOLIFY_TOKEN`, smoke em `https://luc.panlabs.tech/login`. Actions por tag flutuante (`actions/checkout@v4`, `docker/build-push-action@v6`).
- **Dependabot**: sem `dependabot.yml`. `dependabot_security_updates: enabled`; `automated-security-fixes` → `{"enabled": true, "paused": true}`. 7 PRs de `app/dependabot` (ex.: `#252 chore(deps): bump urllib3 … in /apps/api`), com labels `dependencies`, `python:uv`, `javascript` (criadas pelo bot). `secret_scanning` e `push_protection`: `enabled`.
- **Labels** (29): famílias `status:{needs-triage,needs-info,ready-for-agent,hitl,wontfix,blocked}`, `needs:mcp`, `area:{financas,saude,gastronomia,imovel,supermercado,carro,casca}`, `boundary:{nucleo,borda}`, `type:{feature,fix,chore,docs}`, `wayfinder:{map,research,grilling,prototype,task}`, mais `dependencies`, `javascript`, `python:uv`.
- **Ruleset** `19922234` "panlabs": `deletion`, `non_fast_forward`, `required_linear_history`, `required_signatures`, `pull_request` (`allowed_merge_methods: [squash]`, 0 aprovações), `required_status_checks` `checks` + `security` com `strict: true`. Repo: só squash, `deleteBranchOnMerge: true`, `allow_auto_merge: true`, `default_workflow_permissions: read`. Proteção clássica: 404.
- **Hooks locais**: `lefthook.yml` (75 linhas) com `pre-commit` (`api-format`/`api-lint` com `root: apps/api/` e `uv run ruff …`, `web-check` com `node_modules/.bin/biome check` — binário direto porque `pnpm exec biome` sai verde quando o filtro não casa —, `gitleaks git --staged --no-banner --redact`) e `commit-msg` (commitlint via `npx` pinado, igual ao overpower). `commitlint.config.mjs`: conventional + `subject-case lower-case`. `package.json` da raiz não lista lefthook nem commitlint (equipamento da máquina). Formatter Node: `biome.json`.
- **Sem** `.editorconfig`. `docs/agents/{issue-tracker,triage-labels,workflow}.md` e `docs/adr/0001…0016` presentes.

### panlabs-tech/ethitorial

Público, MIT, monorepo `apps/web` + `apps/api` + `content/` (MDX).

- **Templates**: `.github/ISSUE_TEMPLATE/task.yml` (issue form "Task", `title: "[task]: "`, `labels: ["proposed"]`; campos `Contexto` e `Criterio de aceite` obrigatórios, `Notas para o agente`, `Dependencias`, dropdowns `Phase` 0-4 e `Owner` Human/Agent/Pairing obrigatórios, `Priority` P0-P2). Sem `config.yml`. `.github/pull_request_template.md` (28 linhas): "Issue / Closes #", "Resumo", "Checks executados", "Impacto", "Riscos", "Screenshots" (obrigatório em mudança de UI) e checklist "Seguranca e producao". `.github/copilot-instructions.md` delega a `AGENTS.md`.
- **`.github/workflows/pr-checks.yml`** (141 linhas): mesmos prefixos de branch do life-under-control (inclui `dependabot/**`); `checks-python` → `checks-python.yml@v1.0.0` (`working-directory: apps/api`, `pytest-args: -m "not integration" -q`, `pyright-args: --warnings`), `checks-node` → `checks-node.yml@v1.0.0` (`package-manager: pnpm`), rollup `checks`, `security-scan`/`security`, `open-pr`. Cabeçalho cita ADR-0005 e a medição "quatro arquivos de CI da frota divergiram entre 48% e 86% em sete semanas".
- **`.github/workflows/deploy.yml`** (104 linhas): matriz `app: [web, api]`, GHCR, Coolify guardado por `COOLIFY_TOKEN`, smoke em `ethitorial.panlabs.tech`. Tags flutuantes (`actions/checkout@v6`, `docker/build-push-action@v7`).
- **Dependabot**: sem `dependabot.yml`; security updates `enabled`/pausado; 9 PRs do bot. Secret scanning e push protection `enabled`.
- **Labels** (25): `infra`, `ci`, `web`, `api`, `docs`, `content`, boundaries `catalog`, `identity`, `engagement`, `narration`, `shared`, `platform`, estados `proposed`, `agent-ready`, `hitl`, `blocked`, tipos `feature`, `bug`, `chore`, `design`, mais `needs-info`, `wontfix`, `dependencies`, `python:uv`, `javascript`. Não há `needs-triage`, `ready-for-agent`, `ready-for-human` nem `wayfinder:*`: o mapa de papéis vive em `docs/agents/triage-labels.md`.
- **Ruleset** `17319154` "panlabs": as mesmas 6 regras do life-under-control (ordem diferente no JSON). Repo: só squash, apaga branch, auto-merge.
- **Hooks locais**: `lefthook.yml` (44 linhas) com `pre-commit` apenas `gitleaks git --staged --redact --no-banner`, `commit-msg` `pnpm exec commitlint --edit {1}`, e `pre-push` paralelo (`ruff format --check`, `ruff check`, `pyright --warnings`, `pytest -m "not integration" -q` em `apps/api`; `biome check apps/web`; `typecheck`). Instalação automática por `"prepare": "lefthook install"` em `package.json`; `lefthook`, `@commitlint/cli`, `@commitlint/config-conventional` e `@biomejs/biome` como `devDependencies` (`^` ranges). `commitlint.config.mjs`: `type-enum` restrito a `feat, fix, chore, docs, refactor, test`.
- ADRs relacionados: `docs/adr/0005-deploy-checks-em-tres-portoes.md`, `docs/adr/0010-desenvolvimento-autonomo-afk.md`. Sem `.editorconfig`.

### panlabs-tech/travelmanager

Público, MIT, monorepo `apps/web` + `apps/api`.

- **Templates**: sem `ISSUE_TEMPLATE/`. `.github/pull_request_template.md` idêntico ao do life-under-control (13 linhas, mesmas três seções).
- **`.github/workflows/pr-checks.yml`** (127 linhas): gatilho `push` em `feat/**, fix/**, chore/**, docs/**, refactor/**, test/**, worktree/**` (sem `ci/**`, `worktree-**` nem `dependabot/**`, ao contrário dos dois anteriores); `checks-node` → `checks-node.yml@v1.0.0` (`working-directory: .`), `checks-python` → `checks-python.yml@v1.0.0` (`-m "not integration"`), rollup `checks`, `security-scan`/`security`, `open-pr` com exclusão do Dependabot.
- **`.github/workflows/deploy.yml`** (112 linhas): matriz `web/api`, GHCR, Coolify, smoke em `travelmanager.panlabs.tech`. Tags flutuantes.
- **Dependabot**: sem `dependabot.yml`; security updates `enabled`/pausado; 10 PRs do bot (ex.: `#263 chore(deps): bump certifi … in /apps/api`, 2026-10-26). Secret scanning e push protection `enabled`.
- **Labels** (30): `type:{docs,feat,fix,chore,test,refactor}`, `status:{ready-for-agent,hitl,blocked,needs-info,needs-triage,wontfix}`, `phase:{1,2,3}`, `area:{infra,ci,web,api}`, `boundary:{identity,trips,fares,shared,platform,collaboration,budget,notifications}`, mais `dependencies`, `javascript`, `python:uv`. Sem `wayfinder:*`.
- **Ruleset** `19925180` "panlabs": as mesmas 6 regras. Repo: só squash, apaga branch, auto-merge.
- **Hooks locais**: `lefthook.yml` (48 linhas) com `pre-commit` (`node_modules/.bin/biome check --no-errors-on-unmatched {staged_files}`, `ruff format --check`/`ruff check` em `apps/api`, `gitleaks`) e `commit-msg` `pnpm exec commitlint --edit {1}`. `commitlint.config.mjs` só `extends config-conventional` (sem regra de caixa). `package.json`: `devDependencies` com versões exatas (`@biomejs/biome 2.1.2`, `@commitlint/cli 19.6.1`, `lefthook 1.10.10`), sem script `prepare`.
- ADRs: `docs/adr/0007-autonomia-total-do-agente.md`, `docs/adr/0008-substrato-compartilhado-e-deploy.md`. Sem `.editorconfig`.

### panlabs-tech/tfbox

Público, MIT, topics `aws, terraform`; módulos Terraform + catálogo web (`web/`, `scripts/`, npm). Único dos seis com **wiki ligado** (exceção declarada em `config/org.json` do repo meta: o wiki é gerado pela automação de release). Clone local está em `feature/repo-improvement`; os fatos abaixo vêm de `git -C <clone> show origin/main:<arquivo>` e `git ls-tree origin/main`.

- **Templates de issue** (`.github/ISSUE_TEMPLATE/`): cinco issue forms em inglês, `bug_report.yml` (`labels: ["bug", "triage"]`), `feature_request.yml` (`["enhancement", "feature-request"]`), `documentation.yml` (`["documentation"]`), `question.yml` (`["question", "help-wanted"]`), `performance_issue.yml` (`["performance", "optimization"]`); `config.yml` com `blank_issues_enabled: false` e `contact_links` apontando para `ThiagoPanini/tech-playground/discussions`; `README.md` descrevendo os templates "for the tech-playground repository". Os labels `triage`, `feature-request`, `help-wanted`, `performance`, `optimization`, `documentation` que os forms aplicam **não existem** na lista de labels do repo (`gh label list -R panlabs-tech/tfbox`).
- **Template de PR**: `.github/pull_request_template.md` em inglês com emojis: "Pull Request Overview", "Related Issues", "Pre-Merge Checklist" (5 itens) e "Additional Notes".
- **Workflows** (5): `feature.yml` ("⚙️ Feature Branch CI", `push` em branches de feature; chama `./.github/workflows/reusable-modules-validation.yml` e `reusable-catalog-validation.yml`; job abre PR para `main` com `actions/github-script@v9`); `pr-gate.yml` ("🚦 Pull Request Gate and Release", `pull_request` para `main`; mesmas validações; release com `techpivot/terraform-module-releaser@v2`); `deploy.yml` ("🚀 Deploy Catalog to GitHub Pages", `push` em `main` + dispatch; `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`, environment `github-pages`); `reusable-modules-validation.yml` (`workflow_call`, matriz por módulo, `hashicorp/setup-terraform@v4`); `reusable-catalog-validation.yml` (`workflow_call`). Nenhum referencia `panlabs-tech/.github`; actions por tag flutuante.
- **Dependabot**: `.github/dependabot.yml` com três entradas semanais: `github-actions` em `/` (grupo `actions` com `patterns: ["*"]`), `npm` em `/scripts`, `npm` em `/web`. 75 PRs de `app/dependabot` (ex.: `#120 chore(deps): bump next from 16.2.4 to 16.4.1 in /web`, 2026-10-28), labels `dependencies`, `javascript`, `github_actions`. Security updates `enabled`/pausado; secret scanning e push protection `enabled`.
- **Labels** (21): com emoji (`github-bot 🤖`, `app 💻`, `breaking-change 🛠️`, `bug 🐞`, `config ⚙️`, `doc 🖍️`, `enhancement 🍀`, `feature 🚀`, `infra 🧱`, `observability 👁️‍🗨️`, `tests 🛡️`, `in-progress 🔎`), `dependencies`, `javascript`, `github_actions`, `github-bot`, e os cinco de triagem verbatim (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). Sem `wayfinder:*`.
- **Ruleset** `6659325` "panlabs" (criado 2025-07-12, atualizado 2026-07-28): as mesmas 6 regras, com required checks `checks` e `security`. Os workflows lidos em `origin/main` local não publicam jobs com esses nomes (ver Pendente).
- **Hooks locais**: raiz de `origin/main` (`git ls-tree --name-only origin/main`) sem `lefthook.yml`, `commitlint.config.mjs`, `.editorconfig`, `.node-version` ou `.python-version`; há `.agents`, `.claude`, `.serena`, `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`, `skills-lock.json`.
- Environments: `github-pages` e `copilot`. `default_workflow_permissions: read`.

### ThiagoPanini/panlabs-docs

Público, **sem LICENSE** (`gh api repos/ThiagoPanini/panlabs-docs --jq .license` → null; community profile `license` ausente), topics `css, design-system, documentation, docusaurus`; site Docusaurus em npm (`package-lock.json`).

- **Templates**: nenhum (`.github/` só com `workflows/`).
- **`.github/workflows/ci.yml`** (54 linhas): `push` com `branches-ignore: [main]` + `workflow_dispatch` (comentário: `pull_request` duplicaria o report; não restringe a `feature/**` porque uma branch fora da convenção ficaria sem check e o PR "pendurado para sempre"); `permissions: contents: read`; `concurrency` por ref com cancelamento; único job `gate` **sem `name:`** de propósito (o id é o contrato com o ruleset); `npm ci` + `npm run build` (com `onBrokenLinks: 'throw'` e `prebuild` que regenera a referência).
- **`.github/workflows/deploy.yml`** (57 linhas): `push` em `main` + dispatch; `permissions: pages: write, id-token: write`; `concurrency: group: pages` sem cancelamento; `actions/configure-pages@v5`, `upload-pages-artifact@v3`, `deploy-pages@v4`; environment `github-pages`.
- **Dependabot**: sem `dependabot.yml`; security updates, secret scanning e push protection `disabled`; alerts ligados; zero PRs do bot.
- **Labels** (18): 9 padrão do GitHub + 5 `wayfinder:*` + `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`.
- **Ruleset** `21058093` "main": `deletion`, `non_fast_forward`, `pull_request` (`allowed_merge_methods: [squash]`, 0 aprovações), `required_status_checks` com context `gate`, `strict: false`. Sem `required_signatures` nem `required_linear_history`. Repo: `merge/squash/rebase` permitidos nas configurações (o ruleset restringe a squash), `deleteBranchOnMerge: true`, `allow_auto_merge: true`, `default_workflow_permissions: write`.
- **Hooks locais**: nenhum (`ls -A`: sem `lefthook.yml`, `commitlint.config.mjs`, `.editorconfig`). `docs/agents/{issue-tracker,triage-labels,workflow}.md` presentes; `DECISIONS.md` na raiz.

## O repo meta `panlabs-tech/.github` (contexto da frota)

Os quatro repositórios `panlabs-tech` acima respondem a este repositório (`README.md`: "Todo repo da org `panlabs-tech` responde a alguma coisa que está definida aqui"). Fatos relevantes para higiene:

- **Reusable workflows** (`.github/workflows/README.md`, lista confirmada por `gh api repos/panlabs-tech/.github/contents/.github/workflows`): `security.yml` (gitleaks binário, versão e checksum pinados), `checks-python.yml` (`uv sync --frozen` → `ruff format --check` → `ruff check` → `pyright` → `pytest`; inputs `working-directory`, `pytest-args`, `pyright-args`), `checks-node.yml` (`npm`/`pnpm`: install → `lint` → `typecheck` → `test` → `build` se existir), `open-pr.yml`, `code-scanning.yml` (CodeQL **advisory**, nunca required), `dependabot-auto-merge.yml` (auto-merge em bump minor/patch, major nunca). Três callers internos: `pr-checks.yml`, `pr-code-scanning.yml`, `pr-dependabot-auto-merge.yml`. Única tag: `v1.0.0` (`gh api repos/panlabs-tech/.github/tags`). Todas as actions pinadas por SHA.
- **Contrato de status checks**: todo consumidor publica os nomes fixos `checks` (rollup com `needs` + `if: always()`) e `security` (fachada), modelado em `scripts/panlabs/ci/rollup.py`. `open-pr` nunca é required (seria circular).
- **`config/ruleset.json`**: o corpo exato do ruleset "panlabs" aplicado pelo script `panlabs-ruleset` (`deletion`, `non_fast_forward`, `required_linear_history`, `required_signatures`, `pull_request` squash-only com 0 aprovações, `required_status_checks` `checks`+`security` strict); `repo_settings` (`allow_squash_merge` only, `delete_branch_on_merge`, `allow_auto_merge`); `retire_classic_protection: true`. Nota do arquivo: `bypass_actors` vazio porque "numa org de um mantenedor, um ator de bypass faz a regra inteira virar teatro"; squash-only é a outra metade de `required_signatures` (quem assina o commit que aterrissa é o GitHub).
- **`config/org.json`**: `secret_scanning`, `push_protection`, `dependabot_alerts`, `dependabot_security_updates` ligados em todo repo; wiki desligado com exceção `panlabs-tech/tfbox`; 2FA na org; defaults de segurança para repo novo; `pinned_repos`, `repo_descriptions`, `repo_topics` como dado.
- **`.github/dependabot.yml`** do meta: ecossistemas `github-actions` e `uv`, semanal às segundas, `open-pull-requests-limit: 5`, `commit-message: prefix chore, include scope`, `labels: []` (para não criar um sexto termo fora do vocabulário de triagem), grupos `minor`+`patch` (major fora, um PR por dependência).
- **`ANATOMY.md`, Eixo 1 (invariantes de org)**: `readme-exists`, `license-exists`, `license-uniform` (valor ainda `null`), `repo-description-declared`, `repo-topics-declared`, `wiki-off-unless-declared`, `agent-guidance-generic-exists` (`AGENTS.md`), `agent-guidance-primary-defers-to-generic` (`CLAUDE.md` referencia e não duplica), `agent-doc-{issue-tracker,triage-labels,workflow,domain}` (quatro documentos de nome fixo em `docs/agents/`), condicionais `design`, `local-dev`, `mcps`, `triage-vocabulary-declared` (**slot**: cobra o mapa dos cinco papéis, não o label), `no-stale-tool-config`, `no-vendored-agent-equipment`, `local-commit-gate-exists`, `commit-message-standard-declared`, `secret-scan-before-commit` (gitleaks, valor decidido), `ci-references-shared-workflows`, `status-rollup-contract`. Eixo 2 por superfície: `.python-version`/`.node-version` na raiz (slots), ruff declarado, lockfile Node na raiz, pernas `checks-python`/`checks-node` "equivalentes" (compartilhada por tag, local `./.github/workflows/...`, ou pinada por SHA de 40 caracteres; tag flutuante reprova).
- **Arquivos de saúde comunitária no nível da org**: o repo `.github` tem `profile/README.md`, mas não tem `.github/ISSUE_TEMPLATE/`, `PULL_REQUEST_TEMPLATE`, `CONTRIBUTING.md`, `SECURITY.md` nem `CODE_OF_CONDUCT.md` (`gh api repos/panlabs-tech/.github/contents` e `/contents/.github`). O repositório `ThiagoPanini/.github` **não existe** (`gh repo view ThiagoPanini/.github` → "Could not resolve to a Repository").

## GitHub Projects

- `gh project list --owner ThiagoPanini --limit 50`: dois projetos abertos, `#4 talkingpres — roadmap` e `#3 talkingpres skill smoke 20260527214916`, nenhum ligado aos repositórios desta pesquisa.
- `gh project list --owner panlabs-tech --limit 50`: nenhum.
- `gh api graphql` com `repository(owner, name) { projectsV2(first:10) { totalCount } }` → `totalCount: 0` nos seis repositórios.
- `hasProjectsEnabled: true` nos seis (`gh repo view --json hasProjectsEnabled`), ou seja, a aba existe, mas sem projeto.

## Lacunas e o que a documentação oficial do GitHub oferece

(em construção; ver Retomada)
