# Skills de Matt Pocock e MCPs úteis ao MVP

Pesquisa do ticket [#9](https://github.com/ThiagoPanini/minimal-me/issues/9) (parte de #1). Fontes oficiais; nada presumido instalado. Cada afirmação cita URL ou caminho local. Fatos, sem recomendação. Data da coleta: 2026-11-07.

Abreviação usada abaixo: `<plugin>/` = `/home/paninit/.claude/plugins/cache/claude-plugins-official/mattpocock-skills/1.3.1/` (cópia local, somente leitura).

## Retomada

**Estado**: em andamento.

- Coberto: Parte 1 inteira (1.1 a 1.5), seção 2.5 (declarações dos projetos panlabs-tech) parcial.
- Pendente: 2.1 Hostinger, 2.2 Coolify, 2.3 Cloudflare, 2.4 GitHub/Postgres/Playwright, 2.6 catálogo overpower, Fontes consolidadas, gist na issue, fechar issue.
- Onde continuar: dados já coletados (READMEs via `gh api repos/<owner>/<repo>/readme`, registry npm via `curl https://registry.npmjs.org/<pkg>`); falta redigir as seções 2.x.

## Parte 1 — Skills de Matt Pocock

### 1.1 Versão instalada (1.3.1) e lista de skills

- O plugin `mattpocock-skills@claude-plugins-official` está instalado no escopo `user`, versão `1.3.1`, instalado em `2026-11-07T18:27:46Z`, apontando para o commit `49dd158d1076134a641b33efb035946536778336` do repositório (`/home/paninit/.claude/plugins/installed_plugins.json`, chave `mattpocock-skills@claude-plugins-official`). Só existe uma versão no cache: `ls /home/paninit/.claude/plugins/cache/claude-plugins-official/mattpocock-skills/` → `1.3.1`.
- Esse commit `49dd158` ("wizard: template fixes", 2026-10-09) é **posterior** à tag `v1.3.1` (publicada 2026-10-04) e anterior à `v1.3.2` (2026-10-29). O snapshot instalado carrega, portanto, parte das mudanças que o CHANGELOG atribui à 1.3.2, e a pasta `<plugin>/.changeset/` traz 18 changesets ainda não consolidados (`ask-matt-read-skill-first.md`, `code-review-standards-and-subagents.md`, `handoff-temp-dir.md`, `implement-skill-tool-wording.md`, `to-tickets-sub-issues.md`, `wayfinder-labels-refs-research-prs.md`, etc.). Fontes: `gh api repos/mattpocock/skills/releases`, `gh api 'repos/mattpocock/skills/commits?per_page=12'`, listagem de `<plugin>/.changeset/`.
- `<plugin>/.claude-plugin/plugin.json`: `name` `mattpocock-skills`, `version` `1.3.1`, `license` MIT, `repository` `https://github.com/mattpocock/skills`, `homepage` `https://www.aihero.dev/s/skills-newsletter`. Declara **27 skills**, 20 em `skills/engineering/` e 7 em `skills/productivity/`.
- Engineering (20), com `name` e descrição do frontmatter de cada `<plugin>/skills/engineering/<nome>/SKILL.md`:
  - `ask-matt`: roteador; "Ask which skill or flow fits your situation" (user-invoked).
  - `code-review`: revisão em dois eixos, Standards e Spec, em subagentes paralelos, desde um ponto fixo (commit, branch, tag, merge-base).
  - `codebase-design`: vocabulário compartilhado de módulos profundos (module, interface, depth, seam, adapter, leverage, locality).
  - `diagnosing-bugs`: loop de diagnóstico para bugs difíceis e regressões de performance.
  - `domain-modeling`: constrói e afia o modelo de domínio; dispara ao discutir terminologia, editar `GLOSSARY.md` ou gravar ADR.
  - `grill-with-docs`: entrevista que também cria docs (ADRs e glossário).
  - `implement`: implementa um trabalho a partir de spec ou tickets (user-invoked).
  - `implement-spec`: implementa a spec inteira de `/to-spec` + `/to-tickets` numa integration branch, com subagentes.
  - `improve-codebase-architecture`: varre a base por oportunidades de aprofundamento, gera relatório HTML, grila a escolhida.
  - `pr`: "Use when writing a PR body" (model-invoked).
  - `prototype`: protótipo descartável para responder uma pergunta de design.
  - `research`: investiga contra fontes primárias e grava Markdown citado no repo, em agente de fundo.
  - `retro`: retrospectiva de uma sessão de código (user-invoked).
  - `setup-matt-pocock-skills`: configura o repo (issue tracker, labels de triagem, layout de docs de domínio); "Run once before first use of the other engineering skills".
  - `tdd`: red-green-refactor; testes de integração.
  - `to-spec`: transforma a conversa atual em spec e publica no tracker, sem entrevista.
  - `to-tickets`: quebra plano/spec/conversa em tickets tracer-bullet com arestas de bloqueio, publicados no tracker.
  - `triage`: máquina de estados de papéis de triagem para issues e PRs externos.
  - `wayfinder`: planeja um trabalho grande demais para uma sessão como mapa compartilhado de decision tickets no tracker.
  - `wizard`: gera um wizard bash interativo para passos que só um humano pode dar (infra, credenciais, segredos de CI, dashboards de terceiros).
- Productivity (7), de `<plugin>/skills/productivity/<nome>/SKILL.md`: `grill-me` (entrevista sem estado), `grilling` (a primitiva de entrevista; model-invoked), `handoff` (compacta a conversa num documento de handoff), `teach`, `to-questionnaire`, `wait-what`, `writing-for-agents`.
- O repositório tem ainda `skills/in-progress/` (`chief-of-staff`, `claude-handoff`, `loop-me`, `setup-ts-deep-modules`, `writing-beats`, `writing-fragments`, `writing-shape`) e `skills/misc/` (`git-guardrails-claude-code`, `migrate-to-shoehorn`, `scaffold-exercises`, `setup-pre-commit`); nenhuma dessas está em `plugin.json`, logo não entram no plugin (`<plugin>/.claude-plugin/plugin.json`, campo `skills`; `<plugin>/.agents/install-block.md` chama os dois buckets publicados de "promoted set (27 skills, verified 2026-10-07)").
- Divisão user-invoked vs model-invoked: os `SKILL.md` user-invoked trazem `disable-model-invocation: true` no frontmatter (ex.: `ask-matt`, `setup-matt-pocock-skills`, `to-spec`, `to-tickets`, `wayfinder`, `implement`, `implement-spec`, `retro`, `handoff`). O `README.md` do plugin define a regra: "A user-invoked skill may invoke model-invoked skills, but never another user-invoked one" (`<plugin>/README.md`, seção "Reference"). A convenção para invocar outra skill é a frase literal `Call the Skill tool with "<nome>"`, só válida quando a skill alvo é model-invoked (`<plugin>/CHANGELOG.md`, entradas #878 e #880 da 1.3.0; `<plugin>/.agents/invocation.md`).
- Instalação: "pick one per agent" entre plugin (atualiza sozinho) e skills.sh (arquivos editáveis, atualização manual); para Claude Code, `claude plugin install mattpocock-skills@claude-plugins-official` (`<plugin>/README.md`, "Installation"; `<plugin>/.agents/install-block.md`).

### 1.2 Fluxo setup → wayfinder → to-spec → to-tickets → implement → pr

Fonte principal: `<plugin>/skills/engineering/ask-matt/SKILL.md` (o roteador descreve o "main flow", os "on-ramps" e a higiene de contexto) e os `SKILL.md` de cada skill.

- **Precondição: `/setup-matt-pocock-skills`**, uma vez por repo, antes do primeiro fluxo de engenharia. Escreve `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md` (só se `triage` estiver instalado) e `docs/agents/domain.md`, e um bloco `## Agent skills` em `CLAUDE.md` ou `AGENTS.md` (ver 1.4). `to-spec`, `to-tickets`, `wayfinder`, `code-review`, `implement-spec` começam com "The issue tracker ... should have been provided to you. If not, tell the user to run `/setup-matt-pocock-skills`" (`<plugin>/skills/engineering/{to-spec,to-tickets,wayfinder,code-review,implement-spec}/SKILL.md`).
- **`/wayfinder`** é um dos três "on-ramps", para "a huge, foggy effort: a greenfield project or a huge feature build, too big for one session". Cria no tracker um **mapa** (issue com label `wayfinder:map`, corpo com `## Destination`, `## Notes`, `## Decisions so far`, `## Not yet specified`, `## Out of scope`) e **decision tickets** como sub-issues, cada um com label `wayfinder:<type>` ∈ {`research`, `prototype`, `grilling`, `task`}; os tickets nunca recebem label de triagem como `ready-for-agent`. Bloqueio usa a dependência nativa do tracker; a **frontier** são os tickets abertos, desbloqueados e sem assignee. Dois modos: "Chart the map" (nomeia a destination com `grilling` + `domain-modeling`, grila breadth-first, cria mapa e tickets, dispara subagentes `research` em branches `research/<name>` que são empurradas mas nunca viram PR, e para) e "Work through the map" (carrega o mapa, escolhe/clama um ticket com `gh issue edit --add-assignee @me`, resolve pelo tipo do label, comenta a resolução, fecha, anexa ponteiro ao mapa; "never resolve more than one ticket per session", exceto research). Regra "Plan, don't do": produz decisões, não entregas (`<plugin>/skills/engineering/wayfinder/SKILL.md`).
- **Handoff wayfinder → to-spec**: "When the map clears, it hands off, it doesn't build: merge onto the main flow at `/to-spec`, which collapses the map's linked decisions into a buildable plan, then `/to-tickets` and `/implement` as usual" (`ask-matt/SKILL.md`, seção "On-ramps").
- **`/to-spec`**: sem entrevista; explora o repo, esboça as **seams** de teste (preferir existentes, o mais alto possível, "the ideal number is one") e confirma com o usuário; escreve a spec no template (Problem Statement, Solution, User Stories, Implementation Decisions, Testing Decisions, Out of Scope, Further Notes), publica no tracker e aplica `ready-for-agent`. Sem caminhos de arquivo nem snippets, salvo snippet vindo de protótipo (`<plugin>/skills/engineering/to-spec/SKILL.md`).
- **`/to-tickets`**: quebra em tickets **tracer-bullet** (fatia vertical completa por camada, demonstrável sozinha, dimensionada para "a single fresh context window"), cada um com **blocking edges**; exceção para "wide refactors" (expand–contract). Apresenta a quebra numerada e itera até aprovação; publica em ordem de dependência; em tracker real usa relação nativa de bloqueio, torna cada ticket sub-issue da issue de origem, aplica `ready-for-agent`; em tracker local escreve `.scratch/<feature-slug>/issues/<NN>-<slug>.md`. "Do NOT close or modify any parent issue" (`<plugin>/skills/engineering/to-tickets/SKILL.md`).
- **`/implement`** (por ticket, com `/clear` entre eles): busca o ticket no tracker e declara o título; `Call the Skill tool with "tdd"` nas seams pré-acordadas; typecheck e testes unitários frequentes, suíte completa no fim; `Call the Skill tool with "code-review"`; commit no branch atual (`<plugin>/skills/engineering/implement/SKILL.md`, 17 linhas). Alternativa **`/implement-spec`**: a spec inteira numa integration branch, tickets lidos como task graph, implementer subagents em worktrees próprios chamando `tdd`, merger subagent, um `code-review` na integration branch; abre draft PR só se o tracker fecha trabalho via PR ou o usuário pedir (`<plugin>/skills/engineering/implement-spec/SKILL.md`).
- **`/pr`** é model-invoked: "the agent reaches for it whenever it writes a PR". Template de corpo: `## Summary` (o menor visual que explica a mudança: pseudocódigo, call tree, component tree, file tree, Mermaid ou diff), `## Evidence` (before/after; screenshot é "S-tier", execução é "A-tier"), `## Merge Danger` (door one-way/two-way e blast radius). Usa a linguagem de `GLOSSARY.md`. Crédito ao `show-me` de Dex Horthy (`<plugin>/skills/engineering/pr/SKILL.md`, `<plugin>/skills/engineering/pr/CREDITS.md`).
- **Higiene de contexto**: passos grill → to-spec → to-tickets numa só janela sem `/compact` ou `/clear`; cada `/implement` começa limpo a partir do ticket; `/retro` na sessão que está revisando. Limite chamado de **smart zone** (~150k tokens) (`ask-matt/SKILL.md`, "Context hygiene").

### 1.3 Onde entram handoff, retro, tdd, code-review, domain-modeling

- **`/handoff`** (productivity, user-invoked): escreve um documento de handoff no diretório temporário do SO (`$TMPDIR`, senão `/tmp`; `%TEMP%` no Windows), "not the current workspace"; inclui seção "suggested skills"; referencia specs/ADRs/issues por caminho ou URL em vez de duplicar; redige segredos (`<plugin>/skills/productivity/handoff/SKILL.md`). No fluxo, aparece (a) como ponte de ida e volta para um `/prototype` em outro diretório e (b) como uma das cinco opções em "Phase boundaries": Continue, `/clear`, `/handoff` ("only for a new harness, a new directory, a colleague, or forking a side task mid-phase"), Subagent, `/compact` (o default) (`ask-matt/SKILL.md`; detalhe em `<plugin>/skills/engineering/ask-matt/PHASE-BOUNDARIES.md`).
- **`/retro`** (engineering, user-invoked): "closes the loop", passo 4 do main flow, depois de `code-review`; também recomendado logo após um `/diagnosing-bugs`. Começa com `Call the Skill tool with writing-for-agents`; lê as fontes primárias da sessão; procura candidatos em Navigation, Automated checks, Coding standards (violação mecânica → check determinístico; `CODING_STANDARDS.md` só para julgamento), Global AGENTS.md, Tool economy ("custom tooling (CLI's, MCP's) that is particularly token-inefficient"), No-ops, Information access; apresenta por severidade (`<plugin>/skills/engineering/retro/SKILL.md`).
- **`tdd`** (model-invoked): chamado por `implement` e pelos implementers de `implement-spec`; também usável sozinho. Regras: testar só em seams pré-acordadas e confirmadas com o usuário, red antes de green, uma fatia por ciclo, refatoração fica para a revisão; lê `GLOSSARY.md` para nomear testes; chama `codebase-design` quando a forma da interface está em questão (`<plugin>/skills/engineering/tdd/SKILL.md`, com `tests.md` e `mocking.md` na mesma pasta).
- **`code-review`** (model-invoked): chamado ao fim de `implement` e de `implement-spec`; também sozinho. Fixa o ponto (`git diff <fixed-point>...HEAD`), identifica a spec (referências de issue nos commits via o tracker doc, argumento, `docs/`/`specs/`/`.scratch/`), identifica fontes de standards (`CODING_STANDARDS.md`/`CONTRIBUTING.md` sempre, mais uma baseline fixa de 12 smells de Fowler), roda dois subagentes em paralelo e agrega sob `## Standards` e `## Spec` sem rerankear (`<plugin>/skills/engineering/code-review/SKILL.md`).
- **`domain-modeling`** (model-invoked): "vocabulary underneath"; sempre acompanha `grilling` nas chamadas duplas de `grill-with-docs`, `triage` e `wayfinder` ("Call the Skill tool twice, for grilling and domain-modeling"). Cria `GLOSSARY.md` e `docs/adr/` **lazily**; desafia termos contra o glossário, afia linguagem vaga, testa cenários concretos, cruza com código, atualiza `GLOSSARY.md` inline (formato em `GLOSSARY-FORMAT.md`), oferece ADR só quando a decisão é difícil de reverter, surpreendente sem contexto e fruto de trade-off real (formato em `ADR-FORMAT.md`) (`<plugin>/skills/engineering/domain-modeling/SKILL.md`).
- Mapa das invocações cruzadas no snapshot instalado (`grep -o 'Skill tool ...' <plugin>/skills/*/*/SKILL.md`): `grill-me` → `grilling`; `grill-with-docs` → `grilling` + `domain-modeling`; `triage` → `grilling` + `domain-modeling`; `wayfinder` → `grilling` + `domain-modeling`, `research`, `prototype`; `implement` → `tdd`, `code-review`; `implement-spec` → `tdd`, `code-review`; `improve-codebase-architecture` → `codebase-design`, `grilling`, `domain-modeling`; `tdd` → `codebase-design`; `retro` → `writing-for-agents`.

### 1.4 Convenções de `AGENTS.md` e `docs/agents/` geradas pelo setup

Fonte: `<plugin>/skills/engineering/setup-matt-pocock-skills/SKILL.md` e os templates na mesma pasta (`issue-tracker-github.md`, `issue-tracker-gitlab.md`, `issue-tracker-local.md`, `triage-labels.md`, `domain.md`).

- **Processo**: 1) explorar (`git remote -v`, existência de `AGENTS.md`/`CLAUDE.md` e de um bloco `## Agent skills`, `GLOSSARY.md`/`GLOSSARY-MAP.md`, `docs/adr/`, `docs/agents/`, `.scratch/`, se `triage` está instalada, sinais de monorepo); 2) perguntar por seção, com resposta recomendada primeiro: A) issue tracker (GitHub via `gh`, GitLab via `glab`, local markdown em `.scratch/<feature>/`, ou "Other" descrito em prosa); B) labels de triagem, só se `triage` instalada; default `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`; C) domain docs, default single-context (um `GLOSSARY.md` + `docs/adr/` na raiz), multi-context só com sinais de monorepo; 3) mostrar rascunho e deixar editar; 4) escrever.
- **Qual arquivo editar**: se `CLAUDE.md` existe, edita ele; senão, se `AGENTS.md` existe, edita ele; se nenhum, pergunta qual criar. "Never create `AGENTS.md` when `CLAUDE.md` already exists (or vice versa)". Bloco gerado:

  ```markdown
  ## Agent skills
  ### Issue tracker
  [resumo de uma linha]. See `docs/agents/issue-tracker.md`.
  ### Triage labels
  [resumo]. See `docs/agents/triage-labels.md`.
  ### Domain docs
  [single-context ou multi-context]. See `docs/agents/domain.md`.
  ```

  O sub-bloco `### Triage labels` e o arquivo `triage-labels.md` só existem quando `triage` está instalada. Em GitHub/GitLab, cria os labels que faltam (`gh label create`).
- **`docs/agents/issue-tracker.md` (template GitHub, 1.3.1)**: convenções com `gh` (`gh issue create`, `gh issue view <n> --json number,title,body,labels,comments`, `gh issue list ... --json`, `gh issue comment`, `gh issue edit --add-label`, `gh issue close`), sub-issue via `gh issue create --parent <parent>` ou `gh issue edit <parent> --add-sub-issue <child>` (`gh` 2.94+), flag "PRs as a request surface: no", seção "When a skill says publish to the issue tracker → create a GitHub issue", e "Wayfinding operations" (map com label `wayfinder:map`, child como sub-issue, bloqueio por dependência nativa via `gh api ... /dependencies/blocked_by -F issue_id=<database id>`, frontier query, claim `gh issue edit <n> --add-assignee @me`, resolve = comentar, fechar, apontar no mapa).
- **`docs/agents/domain.md` (template 1.3.1)**: ler `GLOSSARY.md` (ou `GLOSSARY-MAP.md` → um `GLOSSARY.md` por contexto) e `docs/adr/` antes de explorar; se não existirem, "proceed silently", pois `domain-modeling` cria lazily; usar o vocabulário do glossário; sinalizar conflito com ADR. Zero menções a `CONTEXT.md` (`grep -c CONTEXT <plugin>/skills/engineering/setup-matt-pocock-skills/domain.md` → 0; `GLOSSARY` → 8).
- **`docs/agents/triage-labels.md`**: tabela "Label in mattpocock/skills" × "Label in our tracker" × "Meaning" para os cinco papéis.
- **Estado no minimal-me** (worktree, commit `fe8168e` de 2026-11-07, único que tocou `docs/agents/`, `AGENTS.md` e `CLAUDE.md`): `CLAUDE.md` contém só `@AGENTS.md`; `AGENTS.md` traz o bloco `## Agent skills` com tracker GitHub `ThiagoPanini/minimal-me`, labels default e "Single-context: one `CONTEXT.md` and `docs/adr/`". Diferenças contra o template 1.3.1 instalado (`diff`):
  - `docs/agents/domain.md` fala em `CONTEXT.md`/`CONTEXT-MAP.md` em todas as 8 posições onde o template diz `GLOSSARY.md`/`GLOSSARY-MAP.md`, e usa travessões que a 1.3.0 removeu. O CHANGELOG 1.3.0 avisa: "the skills only look for `GLOSSARY.md`/`GLOSSARY-MAP.md` going forward"; quem tem `CONTEXT.md` deve fazer `git mv` (`<plugin>/CHANGELOG.md`, entrada #1120/`006a52b`).
  - `docs/agents/issue-tracker.md` segue um template anterior à 1.3.1: "Read an issue: `gh issue view <number> --comments`" (template: `--json ...`), sem a linha "Make an issue a sub-issue of a parent", e a listagem de PRs externos usa `gh pr list ... authorAssociation` (template usa `gh api --paginate 'repos/{owner}/{repo}/pulls?state=open'`, correção do #1187).
  - `docs/agents/triage-labels.md` difere só na frase final ("right-hand column" vs "'Label in our tracker' column").
  - Não existem `GLOSSARY.md`, `CONTEXT.md` nem `docs/adr/` no repo (listagem do worktree).

### 1.5 O que mudou entre 1.3.1 e a versão atual

- Versão atual do repositório: `plugin.json` em `main` diz `1.3.2`, mesmas 27 skills; release `v1.3.2` publicada em 2026-10-29 (`gh api repos/mattpocock/skills/contents/.claude-plugin/plugin.json`; `gh api repos/mattpocock/skills/releases/latest`). Histórico de releases: v1.0.0 (2026-06-17), v1.1.0 (07-08), v1.2.0/1.2.2/1.2.3 (08-05 a 08-06), v1.3.0 e v1.3.1 (10-04), v1.3.2 (10-29).
- **Entradas do CHANGELOG 1.3.2** (https://github.com/mattpocock/skills/blob/main/CHANGELOG.md), todas patch: `ask-matt` lê o `SKILL.md` antes de descrever uma skill (#1194); `chief-of-staff` com memória em wiki datada (#1304); `code-review` sempre entrega `CODING_STANDARDS.md`/`CONTRIBUTING.md` ao subagente, roda ambos em foreground e resolve o tracker pelo doc (#1208); `diagnosing-bugs` prova a mutação forçada por `diff` (#1209); correção da listagem de PRs externos do template GitHub (#1187); template GitHub manda abrir issues só no repo do usuário, nunca em `mattpocock/skills` (#1169); `grilling` formula perguntas para que "yes" aceite a recomendação (#1193); `handoff` nomeia o diretório temporário (#1184); `implement` chama o Skill tool para `tdd`/`code-review` (#1189) e busca o ticket pela referência (#1196); `setup-matt-pocock-skills` garante remote git alcançável, oferece `git mv` de `CONTEXT.md` legado para `GLOSSARY.md`, template GitHub comenta antes de fechar, move **Blocking** para Conventions com flags nativas do `gh` (`gh issue create --blocked-by`, `gh issue edit --add-blocked-by`, `gh` 2.94+) e nomeia o comando que conta bloqueadores abertos (#1228); setup cria labels faltantes e lê issues com `--json` (#1197); skills que despacham subagentes pedem janela de contexto nova em vez de fork (#1341); `tdd` anota o que cada seam pega e perde (#1192); `teach` (#1183); `to-tickets` faz cada ticket sub-issue da issue de origem e omite `## Blocked by` quando as arestas são nativas (#1188); `wayfinder` não rotula `ready-for-agent`, só referencia ids reais, não abre PR de branches de research, resolve pelo tipo do label (#1181); correções do template do `wizard` (#1237, #1198).
- **Já presentes no snapshot instalado** (commit `49dd158`, 2026-10-09), apesar do rótulo 1.3.1: #1194, #1208, #1209, #1187, #1193, #1184, #1189, #1196, #1197, #1192, #1183, #1188, #1181, #1237, #1198 (verificado nos `SKILL.md` locais: `handoff` já cita `$TMPDIR`; `implement` já diz "Call the Skill tool with tdd"; `to-tickets` já faz sub-issue; `wayfinder` já diz "open no PR"; e os 18 changesets em `<plugin>/.changeset/`).
- **Ausentes do snapshot instalado** (commits de main entre 2026-10-19 e 2026-10-29): #1304 (chief-of-staff, bucket in-progress), #1228 e #1169 (setup e template GitHub; `diff` entre `<plugin>/skills/engineering/setup-matt-pocock-skills/{SKILL.md,issue-tracker-github.md}` e os mesmos arquivos em `main` mostra exatamente essas adições), #1341 (subagentes com contexto novo) e o bump para 1.3.2.
- **Depois da 1.3.2, ainda sem release** (`gh api repos/mattpocock/skills/contents/.changeset` em `main`): `implementer-fresh-per-ticket.md` (commit `a496f55`, "implement-spec: a fresh implementer subagent per ticket", 2026-10-29), `chief-of-staff-shared-wiki-procedures.md` (`5ae4816`, 2026-10-31) e `software-factory-skill.md` (`4ae2317`, "software-factory: glossary skill for designing a factory", 2026-10-31). Último push em `main`: 2026-11-05 (`gh api repos/mattpocock/skills --jq .pushed_at`).
- Mudanças da **1.3.0** que ainda afetam este repo: graduação de `implement-spec`, `pr` e `retro` para o plugin; remoção de `resolving-merge-conflicts`; renomeação `CONTEXT.md`→`GLOSSARY.md`; padronização "Call the Skill tool"; remoção de travessões (`<plugin>/CHANGELOG.md`, seção 1.3.0).

## Parte 2 — MCPs com utilidade concreta no MVP

### 2.1 Hostinger (servidor MCP oficial)

### 2.2 Coolify (`@masonator/coolify-mcp`)

### 2.3 Cloudflare (MCP remoto oficial)

### 2.4 Outros: GitHub, Postgres, navegador/Playwright

### 2.5 O que os projetos panlabs-tech já declaram

### 2.6 Receitas do catálogo overpower

## Fontes
