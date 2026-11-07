# Inventário: tfbox (Terraform)

Pesquisa do ticket [#5](https://github.com/ThiagoPanini/minimal-me/issues/5) (parte de #1). Projeto inspecionado: `/home/paninit/workspaces/panlabs-tech/tfbox` (somente leitura; pastas `tmp/` e `node_modules/` ignoradas). Caminhos sem prefixo são relativos à raiz do tfbox. Cada afirmação cita o arquivo-fonte. Nenhum segredo ou valor de `.env` é reproduzido.

Data da leitura: 2026-11-07. Checkout local do tfbox estava no branch `feature/repo-improvement` (1 commit à frente de `main`); há um segundo worktree em `.claude/worktrees/retrofit-anatomia` no branch `feat/retrofit-anatomia-panlabs` (3 commits à frente de `main`, empurrado para `origin`). Onde o branch de retrofit muda uma convenção, o fato é marcado **[retrofit]**.

## Retomada

- **Status**: completo.
- **Coberto**: todas as 11 dimensões; busca cruzada nos 5 projetos de referência; comentário e fechamento da issue.
- **Pendente**: nada.
- **Onde continuar**: se o tfbox mergear `feat/retrofit-anatomia-panlabs`, revisar as seções 5, 8 e 9 (os fatos marcados **[retrofit]** passam a valer em `main`).

## 1. O que o tfbox é e o que provisiona (módulos em `aws/`)

### Identidade

- Remoto `https://github.com/panlabs-tech/tfbox.git` (`git remote -v`). Repositório público, licença MIT, branch default `main`, criado em 2025-02-18, último push em 2026-10-28, Wiki habilitada, homepage cadastrada `https://thiagopanini.github.io/tfbox/` (`gh repo view panlabs-tech/tfbox`). GitHub Pages responde em `panlabs-tech.github.io/tfbox/` (`gh api repos/panlabs-tech/tfbox/pages`).
- Descrição no GitHub: "A collection of production-ready Terraform modules focused on AWS environments" (`gh repo view`).
- Três stacks num repositório só: `aws/` (módulos HCL, "the product"), `scripts/` (TypeScript que parseia `aws/**/*.tf` em `catalog.json`) e `web/` (site Next.js estático publicado no GitHub Pages em `/tfbox`) — `AGENTS.md` §1.
- `main` tem 130 commits; autores: Thiago Panini 113, dependabot[bot] 8, github-actions[bot] 6, copilot-swe-agent[bot] 3 (`git log main --format=%an`). Primeiro commit em 2025-02-17, último em `main` em 2026-04-23 (`git log main --date=short`).

### Consumo dos módulos

- Consumidor referencia por fonte git com tag: `git::https://github.com/ThiagoPanini/tfbox.git//aws/<name>?ref=<tag>` (`README.md` seção "Usage"; `AGENTS.md` §8). Não há publicação no Terraform Registry.
- O builder do catálogo ainda assume `ThiagoPanini/tfbox` como slug padrão (`scripts/build-catalog.ts:103`) e nas URLs de fonte (`scripts/build-catalog.ts:444`), apesar do remoto ser `panlabs-tech/tfbox`.

### Módulos em `main` (6)

| Módulo | Recursos declarados (arquivo:linha) | variáveis / outputs / `validation` |
|---|---|---|
| `aws/dynamodb-table` | `aws_dynamodb_table.this` (`main.tf:16`); data `aws_caller_identity.current`, `aws_region.current` (`data.tf:16-17`) | 8 / 4 / 3 |
| `aws/iam-role` | `template_dir.policies_templates` (`policies.tf:26`), data `local_file.policies_files` (`policies.tf:33`), `aws_iam_policy.policies` (`policies.tf:43`), `aws_iam_role.roles` (`roles.tf:26`), `aws_iam_role_policy_attachment.policies_attachments` (`roles.tf:39`) | 3 / 2 / 0 |
| `aws/lambda-function` | `aws_lambda_function.this` (`lambda_function.tf:15`), `aws_cloudwatch_event_rule.lambda_event_rule`, `aws_lambda_permission.eventbridge_invoke`, `aws_cloudwatch_event_target.lambda_event_target` (`lambda_event_trigger.tf:21,35,49`), `null_resource.zip_lambda_package`, `null_resource.cleanup_lambda_package` (`lambda_package.tf:20,35`) | 16 / 3 / 9 |
| `aws/lambda-layer` | `null_resource.build_layer` (`main.tf:26`), `aws_lambda_layer_version.this` (`main.tf:63`), `null_resource.cleanup_layer_build` (`main.tf:86`) | 2 / 1 / 1 |
| `aws/sns-topic` | `aws_sns_topic.this`, `aws_sns_topic_policy.this`, `aws_sns_topic_subscription.this`, `aws_sns_topic_data_protection_policy.this` (`main.tf:18,27,33,42`) | 13 / 3 / 7 |
| `aws/sqs-queue` | `aws_sqs_queue.source`, `aws_sqs_queue.dlq`, `aws_sqs_queue_redrive_allow_policy.dlq_redrive_allow_policy` (`main.tf:28,61,87`) | 32 / 4 / 19 |

Contagens via `grep -c '^variable '`, `grep -c '^output '`, `grep -c 'validation {'` nos respectivos `variables.tf`/`outputs.tf`.

- `aws/lambda-function` e `aws/lambda-layer` executam comandos locais na máquina que roda o Terraform (`provisioner "local-exec"` em `aws/lambda-function/lambda_package.tf:21,36` e `aws/lambda-layer/main.tf:35,89`): zipar o pacote da função e instalar requirements Python para a layer (cabeçalhos de `lambda_package.tf` e `lambda-layer/main.tf`).
- `aws/iam-role` renderiza políticas a partir de templates em disco (`template_dir` + `data.local_file`, `aws/iam-role/policies.tf:26-43`).

### Módulo não mergeado: `aws/glue-job`

- No working tree, `aws/glue-job/` contém apenas `tmp/` (ignorado por `**tmp/` em `.gitignore`), com um consumidor de teste (`tmp/main.tf`, `tmp/terraform.tfstate`, `tmp/.terraform.lock.hcl` com `hashicorp/aws 6.19.0`).
- Os arquivos do módulo (`data.tf`, `glue_connection.tf`, `glue_job.tf`, `glue_security_config.tf`, `glue_trigger.tf`, `glue_workflow.tf`, `iam.tf`, `locals.tf`, `outputs.tf`, `s3_objects.tf`, `variables.tf`) existem só no branch `feature/glue-job-module` (`git ls-tree -r --name-only feature/glue-job-module -- aws/glue-job`); commits `93a1a8a` e `6a8b763` (`git log --all -- aws/glue-job`). O módulo não está na lista `modules` dos workflows nem no `AGENTS.md` §2.

### Versões publicadas

- 35 tags no formato `aws/<módulo>/vX.Y.Z` (`git tag`). Última por módulo: `dynamodb-table/v0.4.0`, `iam-role/v0.3.0`, `lambda-function/v0.7.0`, `lambda-layer/v0.6.0`, `sns-topic/v0.0.1`, `sqs-queue/v0.2.0`.
- Último release: `aws/lambda-function/v0.7.0` em 2025-09-22 (`gh release list -R panlabs-tech/tfbox`).

### Inconsistências documentais observadas (fatos)

- `README.md` lista 4 módulos (DynamoDB Table, IAM Role, Lambda Layer, SQS Queue); `aws/` tem 6. O logo do README aponta para `ThiagoPanini/tf-modules-showcase` (nome anterior).
- `aws/lambda-function/versions.tf` e `aws/lambda-function/locals.tf` trazem `MODULE: aws/sns-topic` e `MODULE: aws/lambda-layer` no cabeçalho (cópia não ajustada). `aws/iam-role/roles.tf` tem cabeçalho `FILE: role.tf` e lista `aws_iam_role.this`, `inline_attachments`, `existent_attachment`, enquanto o código declara `aws_iam_role.roles` e `aws_iam_role_policy_attachment.policies_attachments` (`roles.tf:26,39`).

## 2. Providers e versões exigidas

- Os seis `aws/<módulo>/versions.tf` declaram o mesmo bloco: `required_version = ">= 1.9"` e `required_providers { aws = { source = "hashicorp/aws", version = "~> 5.50" } }`.
- CI fixa Terraform `1.10.5` (input `terraform_version` default em `.github/workflows/reusable-modules-validation.yml`; `hashicorp/setup-terraform@v4`).
- Nenhum módulo declara bloco `provider "aws" {}` (`grep '^provider' aws/*/*.tf` vazio; regra em `AGENTS.md` §8 "Consumers configure providers").
- Providers usados implicitamente e **não** listados em `required_providers`: `null_resource` (provider `hashicorp/null`) em `aws/lambda-function/lambda_package.tf:20,35` e `aws/lambda-layer/main.tf:26,86`; `data "local_file"` (`hashicorp/local`) em `aws/iam-role/policies.tf:33`; `template_dir` (`hashicorp/template`) em `aws/iam-role/policies.tf:26`.
- Nenhum `.terraform.lock.hcl` é versionado ("consumers own lockfiles", `AGENTS.md` §8; `.gitignore` ignora `**.terraform.**`).
- `AGENTS.md` §12 e `CLAUDE.md` ("Behaviors to follow") proíbem subir `required_version`/pin do provider sem validar todos os módulos.

## 3. Backend de estado

- Não existe bloco `backend` em nenhum `.tf` dos módulos (`grep -n backend aws/*/*.tf` sem ocorrência fora de `tmp/`).
- Regra explícita: "No backend blocks. Modules backend-agnostic; CI uses `init -backend=false`" (`AGENTS.md` §8); "Never run `terraform apply` / `terraform plan` against real accounts. Don't add backends." (`AGENTS.md` §12); "Don't introduce backends or `terraform apply` steps." (`CLAUDE.md`).
- O repositório não contém nenhum *root module* / stack aplicável: só módulos consumidos externamente. Estado, backend e provider são responsabilidade do consumidor.
- `.gitignore` ignora `*.tfstate`, `*.tfstate.*`, `*.tfvars`, `*.tfvars.json`, `.terraform/`, `override.tf`, `.terraformrc`.
- O único `terraform.tfstate` em disco é local e ignorado (`aws/glue-job/tmp/terraform.tfstate`).
- O catálogo renderiza por módulo três exemplos de uso: `minimal`, `advanced` e `withRemoteState` (`catalog.schema.json`, definição `module.examples`; passo 6 do pipeline em `AGENTS.md` §9).

## 4. Testes

- **Terraform**: não há testes nativos (`find . -name '*.tftest.hcl'` vazio). A validação é `terraform fmt -check -recursive`, `terraform init -backend=false`, `terraform validate` por módulo, em matriz (`.github/workflows/reusable-modules-validation.yml`).
- **`scripts/`**: vitest, 7 testes em `scripts/__tests__/parser.test.ts` (`describe("catalog.json")`): cobre cada diretório `aws/<module>`, classificação de `lambda-function` como compute, extração do summary, números de linha de inputs/outputs/resources, exemplo minimal com todas as variáveis obrigatórias, índice de busca e arestas do diagrama. Comando `npm test` (`scripts/package.json`).
- **`web/`**: Playwright, 3 testes em `web/e2e/smoke.spec.ts` (golden path home→detail→copy, viewport 375px sem overflow, command palette ⌘K). Não há testes unitários em `web/` (`find web -name '*.test.*'` vazio). **[retrofit]** `AGENTS.md` §5 registra que `npm test` em `web/` é inutilizável (vitest coleta o spec do Playwright) e que `npm run lint` está quebrado em `main` (ESLint 10 × `eslint-plugin-react` do `eslint-config-next`).
- Portão local **[retrofit]**: `lefthook.yml` roda `terraform fmt -check {staged_files}` em `*.tf` e `gitleaks git --staged --no-banner --redact` no pre-commit; `commitlint --edit` no commit-msg. Decidido não ter hook Node local (comentário em `lefthook.yml`).

## 5. CI (`.github/`)

### Em `main`

| Arquivo | Gatilho | O que faz |
|---|---|---|
| `.github/workflows/feature.yml` | push em `feature**`, `docs**`, `[0-9].[0-9].x`, `v[0-9].[0-9].[0-9]`, `v[0-9].[0-9].x` | chama os dois reusables; job `open-pr-to-main` abre PR para `main` via `actions/github-script@v9` com título `pr(main): <branch> -> main`, corpo de `.github/pull_request_template.md`, label `github-bot` |
| `.github/workflows/pr-gate.yml` | `pull_request` para `main` (`opened, reopened, synchronize, closed`) | chama os dois reusables; job `release` roda `techpivot/terraform-module-releaser@v2` com `semver-mode: keywords`, `default-first-tag: v0.0.1`, `major-keywords: major change,breaking change`, `minor-keywords: feat,feature`, `patch-keywords: fix,hotfix,chore,docs,config,ci`; permissões `contents: write`, `pull-requests: write` |
| `.github/workflows/deploy.yml` | push em `main`, `workflow_dispatch` | `npm ci`+`npm run build` em `scripts/`, copia `catalog.json` para `web/public/`, `npm ci`+`npm run build` em `web/` com `NEXT_PUBLIC_BASE_PATH=/tfbox`, `actions/upload-pages-artifact@v5` + `actions/deploy-pages@v5` |
| `.github/workflows/reusable-modules-validation.yml` | `workflow_call` (inputs `terraform_version` default `1.10.5`, `modules` JSON) | matriz por módulo: `fmt -check -recursive`, `init -backend=false`, `validate` |
| `.github/workflows/reusable-catalog-validation.yml` | `workflow_call` (input `node_version` default `"20"`) | `npm ci`, `npm run build`, `npm test` em `scripts/`; copia catálogo; `npm ci`, `npm run typecheck`, `npm run build` em `web/` |

- Lista de módulos hardcoded (sem autodescoberta) em `feature.yml` e `pr-gate.yml`: `["dynamodb-table","iam-role","lambda-layer","sqs-queue","sns-topic","lambda-function"]`.
- Node 20 (`setup-node@v6`, cache npm com dois lockfiles). Actions: `checkout@v6`, `setup-node@v6`, `setup-terraform@v4`, `github-script@v9`, `upload-pages-artifact@v5`, `deploy-pages@v5`.
- `.github/dependabot.yml`: semanal para `github-actions` (agrupado em `actions`), npm em `/scripts` e npm em `/web`.
- Templates: 5 issue forms (`bug_report.yml`, `documentation.yml`, `feature_request.yml`, `performance_issue.yml`, `question.yml`) + `config.yml` + `README.md` em `.github/ISSUE_TEMPLATE/`; `.github/pull_request_template.md` com Overview, Related Issues, Pre-Merge Checklist, Additional Notes.
- Nomes de workflow em `main` usam emoji ("🚀 Deploy Catalog…", "⚙️ Feature Branch CI", "🚦 Pull Request Gate and Release").

### **[retrofit]** Branch `feat/retrofit-anatomia-panlabs`

- `feature.yml` é removido e substituído por `.github/workflows/pr-checks.yml`: gatilhos ampliados (`feature**`, `docs**`, versões, `feat/**`, `fix/**`, `chore/**`, `config/**`, `ci/**`, `refactor/**`, `test/**`, `worktree/**`, `worktree-**`, `dependabot/**`); jobs `checks-terraform` e `checks-node` (os mesmos reusables locais), rollup `checks` com `if: always()` e agregação explícita de `needs.*.result`, `security-scan` → `panlabs-tech/.github/.github/workflows/security.yml@v1.0.0`, fachada `security`, `open-pr` → `panlabs-tech/.github/.github/workflows/open-pr.yml@v1.0.0` (não roda para `dependabot[bot]`).
- Contrato de status checks de nome fixo `checks` e `security` exigidos pelo ruleset da org (`docs/agents/workflow.md`, seção "O contrato de nomes de status check").
- `pr-gate.yml` continua existindo porque precisa do evento `pull_request: closed` para cortar o release (comentário no topo de `pr-checks.yml`).
- Novos arquivos: `lefthook.yml`, `commitlint.config.mjs`, `.node-version` (= `20`), `LICENSE` (MIT, © 2025 Thiago Panini), `docs/agents/{workflow,design,domain,issue-tracker,triage-labels}.md`, `.claude/context-economy-protocol.md`. `AGENTS.md` §3 passa a dizer que a versão do Node é declarada uma vez em `.node-version` e lida por `node-version-file:`.
- `AGENTS.md` §2 **[retrofit]**: "This repo follows the **panlabs anatomy**, defined in `panlabs-tech/.github`. A compliance checker measures it against that definition".

## 6. Docs

- `README.md`: apresentação, lista de módulos (desatualizada, ver §1), uso via fonte git, versionamento automático pelo `terraform-module-releaser`, link para a Wiki `https://github.com/ThiagoPanini/tfbox/wiki`.
- Wiki do repositório é atualizada pelo releaser a cada release (`README.md` "Automated Module Versioning"; `AGENTS.md` §6 e §13).
- Documentação por módulo não vive em `README.md` dentro de `aws/<módulo>/` (não há nenhum): vive no cabeçalho de bloco `/* ----- FILE/MODULE/DESCRIPTION/RESOURCES ----- */` de cada `.tf` (`AGENTS.md` §8 "File header contract (parser-critical)"), que o parser extrai como summary do catálogo.
- `docs/articles/20250719-tfbox-technical-presentation.md` (127 linhas): artigo de apresentação técnica; `docs/imgs/logo-tfbox.png`.
- `scripts/README.md` e `web/README.md` usam `pnpm` nos exemplos; `AGENTS.md` §3 e `CLAUDE.md` dizem que isso é "stale" e que CI usa `npm ci`. `web/README.md` diz "Next.js 14", enquanto `web/package.json` depende de `next ^16.2.4`. `web/package.json` script `catalog` ainda chama `pnpm build:web`.
- `DESIGN.md`: spec de design do site (ver §7). **[retrofit]** `docs/agents/design.md` aponta para `DESIGN.md` como fonte canônica e mapeia cada decisão para arquivo em `web/`.
- `AGENTS.md`/`CLAUDE.md` descritos em §8.

## 7. Catálogo (`catalog.schema.json`, `scripts/`, `web/`)

### Esquema

- `catalog.schema.json`: JSON Schema draft-07, `$id` `https://tfbox.dev/catalog.schema.json`, título "tfbox Catalog". Raiz exige `schemaVersion` (semver), `generatedAt` (date-time), `repo{name,url,commit,branch}`, `categories[{id,label,hue}]`, `modules[]`, `search.documents[{id,type∈{module,input,output,resource},text}]`.
- Cada `module` exige `id, name, path, category, tags, summary, icon, version{module,terraform,providers[{name,source,version}]}, inputs, outputs, resources, dataSources, moduleDependencies, examples{minimal,advanced,withRemoteState}, diagram{nodes[{id,kind∈{input,resource,output,data},label}],edges[{from,to}]}, files[{path,bytes,sha}], stats{inputCount,outputCount,resourceCount,requiredInputCount}`; opcionais `description`, `maintainers[{name,github}]`.
- `input` exige `name, type, description, required, default, sensitive, nullable, validation[{condition,error_message}], sourceFile, sourceLine`; `output` exige `name, description, sensitive, expression, sourceFile, sourceLine`; `resource` exige `type, name, count, forEach, provider, sourceFile, sourceLine`.
- `web/lib/types.ts` espelha o schema; "Change both together" (`AGENTS.md` §10).

### Builder (`scripts/`)

- `scripts/package.json`: `@tfbox/catalog-builder` 0.1.0, ESM, única dependência de runtime `@cdktf/hcl2json ^0.21.0`; dev: `tsx`, `typescript ^6.0.3`, `vitest ^4.1.4`, `@types/node`. Scripts `build` (→ `../catalog.json`), `build:web` (→ `../web/public/catalog.json`), `typecheck`, `test`.
- Pipeline em 7 passos (`AGENTS.md` §9; `scripts/README.md`): enumerar `../aws/<module>/`, hcl2json + merge, line-scan para recuperar `type` e números de linha, extrair `DESCRIPTION:`, inferir categoria/ícone, renderizar 3 exemplos, emitir diagrama e índice de busca.
- Versão do módulo lida de `git tag -l "aws/<name>/v*"`, fallback `v*`, senão `"unversioned"` (`scripts/build-catalog.ts:336-341`). Mantenedores = top 3 autores por `git log -- <dir>` (`build-catalog.ts:344-347`).
- `scripts/category-map.ts`: regex por prefixo `aws_*` → categorias `compute` (violet), `storage` (emerald), `database` (amber), `messaging` (cyan), `iam` (rose), `networking` (sky), `other` (slate); ícone `aws/<service>` ou `aws/generic`; recursos não-AWS (`null_resource`) pontuam -100 na escolha do recurso primário.
- `catalog.json` na raiz é artefato gerado e gitignorado (`.gitignore`; `AGENTS.md` §7).

### Site (`web/`)

- `web/package.json`: `@tfbox/web` 0.1.0; `next ^16.2.4`, `react ^19.2.5`, `tailwindcss ^4.2.2` + `@tailwindcss/postcss`, Radix (`react-dialog`, `react-tabs`, `react-tooltip`), `cmdk`, `fuse.js`, `reactflow` + `dagre`, `shiki`, `next-themes`, `lucide-react`; dev `eslint ^10.2.1`, `eslint-config-next`, `@playwright/test`, `vitest`, `typescript ^6.0.3`. Script `build` = `next build --webpack`.
- Static export (`output: "export"`), basePath `/tfbox`, sem server runtime (`AGENTS.md` §10). Rotas `app/page.tsx` e `app/modules/[id]/page.tsx` com `generateStaticParams`.
- Componentes: `topbar`, `category-chips`, `home-grid`, `module-card`, `module-detail`, `inputs-table`, `outputs-table`, `resources-table`, `code-block`, `copy-snippet-button`, `command-palette`, `diagram-client`, `theme-provider`, `theme-toggle`, `view-counter` (`web/components/`); `web/lib/view-counter.ts` (commits `pr(main): Fixing view counter on module's cards (#49)`, `feature/fixing-counter-view (#51)`).
- `DESIGN.md`: brief ("Terraform Registry precision, Linear polish, AWS console authority"), tipografia Inter + JetBrains Mono, tokens HSL com dark como default (`--bg`, `--surface`, `--accent` laranja 20 100% 60% etc.), inventário de componentes, checklist e "Deviation log" (parser em TS em vez de `.ts|.py`; arestas do diagrama por heurística; versão de módulo resolvendo para `unversioned` quando não há tags locais).

## 8. Instruções para agentes (`AGENTS.md`, `DESIGN.md`, `CLAUDE.md`, `.agents/`)

- `CLAUDE.md` (3,0 kB) importa `@AGENTS.md` e adiciona: profundidade de validação por "blast radius" (tabela por tipo de mudança), contrato de subject de commit (palavras-chave do releaser), comportamentos (não editar gerados, não introduzir backend/apply, não subir pins, `npm` não `pnpm`, shell bash no Windows, cabeçalho de bloco em todo `.tf`), checklist antes de encerrar e "Uncertainties".
- `AGENTS.md` (14 kB), 13 seções: 1 o que o repo é; 2 layout; 3 gerenciador de pacotes e Node; 4 setup; 5 validação (comandos por stack e "Full local PR gate"); 6 CI/release; 7 convenções do repositório (gerados, prefixo de commit, nomes de branch, título de PR, segredos); 8 convenções de módulo Terraform (layout de arquivos, contrato do cabeçalho, HCL: `this`, `description` em tudo, `validation`, `tags`, `fmt`, sem provider/backend/lockfile; "Adding a new module"); 9 builder; 10 web; 11 invariantes cross-stack; 12 segurança; 13 ponteiros.
- `DESIGN.md` (6,5 kB) cobre só o site `web/` (§7 acima).
- `.agents/skills/`: `ai-dev-setup` (fonte `thiagopanini/aidriven-resources`), `caveman` (`JuliusBrussee/caveman`), `frontend-design` (`anthropics/skills`) — fontes em `skills-lock.json`, que lista também "SVG Logo Designer" (`rknall/claude-skills`), cujo diretório não está mais no working tree (removido no commit `1883b17` de `feature/repo-improvement`). `.claude/skills/` espelha (`ai-dev-setup` é symlink para `../../.agents/skills/ai-dev-setup`). `.claude/settings.local.json` contém apenas a chave `permissions`.
- `CLAUDE.md` em `main`: "`.claude/`, `.agents/`, `.serena/` gitignored; any files there local-only" (seção "Uncertainties"). **[retrofit]** `.gitignore` passa a ignorar `.claude/skills/`, `.claude/agents/`, `.claude/commands/`, `.claude/hooks/`, `.claude/settings*.json`, `.claude/worktrees/`, `.agents/`, `skills-lock.json`, `.serena/`, `.codex/`, `.cursor/`, `.windsurf/`, `.continue/`, `.aider`; `CLAUDE.md` ganha seção "Agent equipment lives globally, not here"; `.serena/` e as skills são removidas do git.
- **[retrofit]** `docs/agents/`: `issue-tracker.md`, `triage-labels.md`, `workflow.md` (esteira "worktree por issue → /tdd → commit → push → checks verdes → PR automático → merge no verde"; dois portões; contrato de status checks; mensagem de commit como entrada do release; merge autônomo com squash), `domain.md` (repo single-context; `AGENTS.md`, `DESIGN.md` e `catalog.schema.json` na raiz), `design.md`. Mesmo trio `issue-tracker`/`triage-labels`/`domain` que o `AGENTS.md` do minimal-me referencia.

## 9. Convenções de commits e branches

### Commits (`git log --format='%s' -30` e histórico)

- Prefixo do subject tem função de release: `techpivot/terraform-module-releaser@v2` lê os subjects dos commits do PR e decide o bump por módulo tocado (`pr-gate.yml`; `AGENTS.md` §6). Major: `major change`, `breaking change`; minor: `feat`, `feature`; patch: `fix`, `hotfix`, `chore`, `docs`, `config`, `ci`. "Don't invent prefixes; releaser ignores unknown ones" (`CLAUDE.md`).
- Formato documentado: `feat(<module>): …` (`AGENTS.md` §7). No histórico, o escopo aparece com prefixo de pasta: `feat(aws/lambda-function): adding source code hash…`, `feat(aws/lambda-layer): improving hash calculation…`, `feat(catalog): building v1…`.
- Merges automáticos: `pr(main): <branch> -> main (#N)` (`feature.yml`; commits `#47`, `#48`, `#50`, `#51`). Também há merges não-squash antigos (`Merge pull request #35 from ThiagoPanini/feature/tfbox-catalog`, `Merge remote-tracking branch 'origin/feature/glue-job-module'…`) e PRs com título livre (`Improving repo setup (#45)`, `pr(main): Fixing view counter on module's cards (#49)`).
- Dependabot: `chore(deps): bump …`, `chore(deps-dev): bump … in /web`.
- Idioma misto: primeiros commits em português (`chore: adicionando template Terraform para gitignore`, 2025-02-17), período intermediário em inglês, branch de retrofit em português (`chore: o tfbox conforme, do portão local ao contrato de status check`).
- **[retrofit]** `commitlint.config.mjs`: estende `@commitlint/config-conventional`, `subject-case` lower-case, `type-enum` = `["feat","feature","fix","hotfix","chore","docs","config","ci"]` (exatamente a lista do releaser; `refactor`/`test` recusados porque "um tipo fora dessa lista muda código e não gera versão nenhuma"). Executado via `npx --package @commitlint/cli@20.1.0 --package @commitlint/config-conventional@20.0.0` no hook `commit-msg` do `lefthook.yml`.

### Branches

- Nomes documentados: `feature/<slug>`, `docs/<slug>`, `v<major>.<minor>.x`, `v<major>.<minor>.<patch>`; "CI only triggers on these patterns" (`AGENTS.md` §7).
- No clone: 21 branches locais `feature/*` (ex.: `feature/lambda-function-v0.3.0`, `feature/sqs-queue-copy-dlq-config-from-source`), `chore/add-context-economy-protocol`, `feat/retrofit-anatomia-panlabs`, `feature/repo-improvement`; no remoto, também `chore/deps-major-upgrades` e 13 `dependabot/*` (`git branch -a`).
- Tags por módulo: `aws/<name>/vX.Y.Z` (`AGENTS.md` §6; `git tag`).
- **[retrofit]** `pr-checks.yml` amplia os gatilhos para `feat/`, `fix/`, `chore/`, `config/`, `ci/`, `refactor/`, `test/`, `worktree/**`, `worktree-**`, `dependabot/**`; `docs/agents/workflow.md` explica que gatilho e `type-enum` divergem de propósito ("Branch que não dispara CI pendura o PR para sempre, então o gatilho erra para o lado de aceitar; tipo fora da lista publica mudança sem versão, então o `type-enum` erra para o lado de recusar").
- **[retrofit]** worktrees aninhados em `.claude/worktrees/<nome>` (`docs/agents/workflow.md`, "A esteira").

## 10. Terraform fora da AWS nos projetos de referência

Busca em `/home/paninit/workspaces/overpower`, `panlabs-tech/life-under-control`, `panlabs-tech/ethitorial`, `panlabs-tech/travelmanager`, `panlabs-docs` (excluindo `node_modules`, `.venv`, `.git`, `.next`, `.terraform`, `tmp`; ocorrências em `.claude/worktrees/*` desconsideradas por serem cópias).

- **Arquivos Terraform**: nenhum `*.tf`, `*.tfvars`, `*.hcl` ou `*.tofu` em nenhum dos cinco projetos (`find … -name '*.tf' -o -name '*.tfvars' -o -name '*.hcl' -o -name '*.tofu'` vazio).
- **overpower**: zero menções a `terraform`/`opentofu`/`pulumi`. Cloudflare, Coolify e Hostinger aparecem como receitas de servidores MCP em `src/overpower/catalog/catalog.yaml`: `cloudflare` (MCP remoto HTTP `https://mcp.cloudflare.com/mcp`, sem segredo no arquivo), `coolify` (stdio, `npx -y @masonator/coolify-mcp@2.12.0`, slot `COOLIFY_ACCESS_TOKEN`), `hostinger-vps` (stdio, `npx -y --package hostinger-api-mcp@0.2.5 hostinger-vps-mcp`, slot `HOSTINGER_API_TOKEN`). `docs/adr/0023-a-fonte-e-endereco-nao-clone.md` trata de fonte git de servidores MCP, não de infra.
- **life-under-control**: única menção a Terraform está em `.claude/worktrees/agent-aa4668bdbd478d753/docs/research/auditoria-b3stocks.md`, auditoria de um outro repositório (`~/workspaces/b3stocks`) que tem `infra/*.tf` **na AWS** (Lambda, SQS, SNS, DynamoDB, Glue, SES, S3). Cloudflare aparece como R2 para anexos (`docs/adr/0008-anexos-object-storage-r2.md`, `apps/web/src/adapters/r2/r2-attachment-store.ts`) e em `.mcp.json`. Deploy: `.github/workflows/deploy.yml` builda imagem para GHCR e dispara redeploy no Coolify via webhook, guardado por UUIDs em secrets.
- **ethitorial**: zero menções a Terraform. `docs/adr/0003-infra-hostinger-vps-coolify.md` (aceito em 2026-05-23): VPS Hostinger KVM 2 (2 vCPU, 8 GB, Ubuntu 24.04), Coolify como PaaS (Traefik, Postgres 17, previews por PR, backups), Cloudflare como DNS/proxy/WAF/CDN e R2; deploy "GitHub Actions builda imagens → push para GHCR → Coolify recebe webhook → puxa imagem"; VPS como substrato compartilhado `panlabs.tech` com um *Coolify Project*, uma zona DNS e um banco por projeto; "Isolamento forte … é o gatilho de revisão". `docs/adr/0006-cloudflare-na-frente-da-vps.md`: TLS `Full (Strict)`, origem fechada aos ranges Cloudflare ou `cloudflared tunnel`. `.github/workflows/deploy.yml`: matriz web/api → `ghcr.io/${{ github.repository_owner }}/ethitorial-<app>` → `deploy (coolify)` só se `COOLIFY_TOKEN` existir → smoke test.
- **travelmanager**: zero menções a Terraform. `docs/adr/0008-substrato-compartilhado-e-deploy.md`: mesma topologia (subdomínio de `panlabs.tech`, Coolify Project + zona DNS + Postgres por projeto, deploy via `POST $COOLIFY_URL/api/v1/deploy?uuid=…&force=true`, smoke em `travelmanager.panlabs.tech`; migrations Alembic fora do pipeline). Emenda de 2026-07-28 registra a quebra do namespace `ghcr.io/thiagopanini/` após a migração para a org `panlabs-tech` em 2026-07-18.
- **panlabs-docs**: menções a Terraform são páginas de conteúdo do site Docusaurus: `content/ferramentas/modulos-terraform/modulo-de-bucket.md` (source `panlabs/bucket/aws`, version `3.1.0`, variáveis `nome`, `proposito`, `retencao`) e `modulo-de-papel-iam.md` (source `panlabs/papel-iam/aws`, variáveis `nome`, `assumido_por`), mais `o-que-o-modulo-provisiona.drawio.svg` e a categoria "Módulos Terraform" em `sidebars-ferramentas.js:114`. Essas fontes de registry e variáveis não correspondem a nenhum módulo do tfbox (que não tem módulo de bucket e é consumido por fonte git, não registry). `README.md` do panlabs-docs: "The content is `panlabs`, a developer's personal learning collection; the product is its **structure** and **visual customization**". `content/ferramentas/skills/scaffold-de-esteira.md` tem um input `linguagem: "python | terraform"`.
- **tfbox**: zero menções a `cloudflare`, `hostinger` ou `coolify` (`grep -rliE` no projeto, fora de `.claude/worktrees`).

Resultado: **não há nenhum uso de Terraform fora da AWS** nos projetos de referência. A VPS Hostinger, o Coolify e a Cloudflare são operados hoje por (a) painel/API do Coolify acionada por webhook de GitHub Actions no merge em `main` (ethitorial, travelmanager, life-under-control `deploy.yml`), (b) servidores MCP para Cloudflare/Coolify/Hostinger (overpower `catalog.yaml`; `.mcp.json` dos três apps) e (c) decisões registradas em ADR, sem IaC declarativa.

## 11. Aplicabilidade a VPS Hostinger + Coolify + Cloudflare

Fatos que delimitam o que do tfbox se transfere:

1. **Nenhum módulo é reaproveitável diretamente.** Os seis módulos declaram só `hashicorp/aws` (`aws/*/versions.tf`) e criam apenas recursos `aws_*` (tabela em §1). Não há recurso de VPS, DNS, container ou proxy.
2. **O tfbox não contém nenhum stack aplicável**: sem root module, sem backend, sem `apply` (`AGENTS.md` §8 e §12; `CLAUDE.md`). Para provisionar a VPS/Cloudflare via Terraform seria necessário criar o que o tfbox proíbe em si mesmo: estado remoto, providers configurados, segredos de API e um pipeline de `plan`/`apply`.
3. **Nenhum dos repositórios inspecionados** declara provider Terraform para Cloudflare, Hostinger ou Coolify, nem referencia um (§10). Essa verificação não foi feita contra o Terraform Registry; está fora do escopo deste inventário.
4. **O deploy atual dos apps da VPS já é automatizado sem Terraform**: imagem → GHCR → webhook Coolify → smoke (`ethitorial/.github/workflows/deploy.yml`, `travelmanager/.github/workflows/deploy.yml`, `life-under-control/.github/workflows/deploy.yml`), com Coolify responsável por Traefik/TLS, Postgres, previews e backups (`ethitorial/docs/adr/0003-infra-hostinger-vps-coolify.md`).
5. **O que se transfere são convenções independentes de provider**, todas citáveis no tfbox:
   - layout por módulo `versions.tf` / `variables.tf` / `main.tf` / `outputs.tf` / `locals.tf` / `data.tf` (`AGENTS.md` §8, tabela "File layout per module");
   - cabeçalho de bloco `FILE/MODULE/DESCRIPTION/RESOURCES` em todo `.tf`, legível por máquina (`AGENTS.md` §8; `CLAUDE.md`);
   - `description` em toda variável e output, `validation` em restrições, `default = null` para opcionais, `variable "tags"` (`AGENTS.md` §8 "HCL conventions");
   - `this` como nome do recurso primário (`AGENTS.md` §8);
   - módulos sem `provider`, sem `backend`, sem lockfile; CI com `fmt -check`, `init -backend=false`, `validate` em matriz (`reusable-modules-validation.yml`);
   - versionamento por tag com caminho (`aws/<name>/vX.Y.Z`) decidido pelo prefixo do commit (`pr-gate.yml`; `commitlint.config.mjs` **[retrofit]**);
   - portão local `lefthook` com `terraform fmt -check` e `gitleaks` no staged **[retrofit]** (`lefthook.yml`);
   - documentação gerada do código, nunca editada à mão (`AGENTS.md` §1, §7; `catalog.schema.json`).
6. **Pontos do tfbox que não se aplicam a uma VPS**: provisioners `local-exec` para zipar código e instalar `pip` (`aws/lambda-function/lambda_package.tf`, `aws/lambda-layer/main.tf`) e `template_dir` para políticas IAM (`aws/iam-role/policies.tf`) são específicos de Lambda/IAM.
