# Agente agendado de manutenção da esteira

Pesquisa do ticket [#54](https://github.com/ThiagoPanini/minimal-me/issues/54), parte do mapa [#1](https://github.com/ThiagoPanini/minimal-me/issues/1). Ela estuda como um agente, sem sessão aberta e sem o Autor, faz toda semana a ronda de manutenção que a decisão 12 de [Esteira de validação e entrega da web (#52)](https://github.com/ThiagoPanini/minimal-me/issues/52) pôs no começo de toda sessão de agente: PRs de robô vermelhos, falhas da `main` e alertas de segurança. Data de referência: 2026-11-20.

## Retomada

- **Estado**: em andamento.
- **Coberto**: ponto de partida (seção 0), onde roda (seção 1) e identidade e assinatura (seção 2).
- **Falta**: custo (3), ambiente (4), limites (5), exageros (6), a recomendação, a preparação única e as perguntas ao Autor.
- **Próximos passos**: fechar as estimativas de custo com os preços da API e escrever a recomendação aplicando o duplo cheque de travas.

Convenções: cada afirmação traz a fonte (URL ou caminho). O que não vem de fonte está marcado como **inferência** ou **hipótese**; decisão que só o Autor toma está marcada como **pendente**. As páginas foram lidas em 2026-11-20, salvo indicação.

## 0. Ponto de partida

### O que está decidido

Da resolução de [#52](https://github.com/ThiagoPanini/minimal-me/issues/52#issuecomment-6965504246) (2026-11-17), as decisões que a ronda toca:

- Checks obrigatórios `gate` (agregador do workflow de validação) e `pr-title` (commitlint no título do PR), com origem no GitHub Actions; o título do PR vira o assunto do commit da `main` (decisão 2).
- O `gate` roda `quality`, revisão de dependências e `e2e` (Playwright 1.65 no contêiner oficial contra a imagem nginx do PR, e Lighthouse CI) (decisão 3).
- `pnpm verify` roda `pnpm check` e `pnpm test:e2e`; o segundo sobe por Docker Compose a imagem `web` e o contêiner do Playwright. A máquina só precisa de Node, pnpm e Docker (decisão 7).
- Dependabot semanal para npm, GitHub Actions e Docker. **Merge automático de tudo que passa no `gate`, inclusive major**, por um workflow com o token de um GitHub App do Autor, instalado só neste repositório, com escrita em conteúdo e PRs, e com o ID e a chave privada como segredos do Dependabot. Exceção: a major do Node (decisão 8).
- **Nova tentativa automática**: um workflow diário roda de novo o que falhou nos PRs de robô e na última rodada da `main`, até três tentativas (decisão 8).
- CodeQL em default setup, sem trava; alertas de malware do Dependabot e relato privado de vulnerabilidade passam a ligados (decisão 9).
- Manutenção sem o Autor: (a) toda sessão de agente começa pela ronda; (b) o agente agendado é este estudo (decisão 12).
- Princípio: "Toda trava só dispara com problema real e é resolvível por agente; sinal que ninguém lê sai da esteira."

Do mapa [#1](https://github.com/ThiagoPanini/minimal-me/issues/1) (seção Notes): orçamento incremental até US$ 2 por mês, e item pago novo é decisão do Autor ([#18](https://github.com/ThiagoPanini/minimal-me/issues/18)); a Home é export estático do Next servido por nginx ([ADR 0005](../adr/0005-home-em-export-estatico.md)), o que tira dela a urgência de patch dos RCEs do servidor do Next.

### O que existe hoje, lido pela API em 2026-11-20

Fontes: `gh api repos/ThiagoPanini/minimal-me`, `.../rulesets/26774429`, `.../actions/permissions`, `.../actions/permissions/workflow`, `.../code-scanning/default-setup`, `.../vulnerability-alerts`; `git ls-tree -r origin/main`.

- **Nada da esteira está implementado.** A `main` tem só documentação, `AGENTS.md`, `CLAUDE.md` e `.mcp.json`; não há `.github/`, nenhum workflow, nenhum `dependabot.yml`, nenhum GitHub App do Autor e nenhum environment.
- Ruleset `panlabs` (id 26774429), ativo no branch padrão, sem `bypass_actors`: `deletion`, `non_fast_forward`, `required_linear_history`, `required_signatures` e `pull_request` com zero aprovações e `allowed_merge_methods: ["squash"]`. Ainda sem check obrigatório. O parâmetro `require_extra_approval_for_unattributed_changes` está `true` (seção 2.4).
- Repositório público, só squash, auto-merge permitido, branch apagado ao mesclar. Secret scanning e push protection ligados; atualizações de segurança do Dependabot ligadas; alertas do Dependabot ligados (`vulnerability-alerts` responde 204).
- Actions: token padrão só leitura, workflows não aprovam PR, qualquer action permitida, fixação por SHA não exigida.
- CodeQL: `state: not-configured`.

## 1. Onde roda

### 1.1 Rotina agendada do Claude Code na nuvem ("scheduled tasks", antes "routines")

Fonte principal: https://code.claude.com/docs/en/routines (a página se chama "Automate work with scheduled tasks").

- **O que é**: "a saved Claude Code configuration: a prompt, one or more repositories, and a set of connectors, packaged once and run automatically", executada "on Anthropic-managed cloud infrastructure", que segue rodando com o computador desligado. Está em "research preview. Behavior, limits, and the API surface may change."
- **Planos**: Pro, Max, Ultra, Team e Enterprise. Cria-se em claude.ai/code/routines ou com `/schedule` na CLI.
- **Gatilhos**: agenda (por hora, diária, semanal, ou cron personalizado; "Expressions that run more often than once per hour are rejected"), chamada de API e eventos do GitHub. Um horário cheio "can start several minutes late".
- **Cada execução** é "a full Claude Code cloud session", que roda comandos de shell, usa skills do repositório clonado e chama os conectores incluídos. Todos os conectores da conta entram por padrão; a página manda remover os que a tarefa não usa.
- **Identidade**: a tarefa pertence à conta claude.ai do Autor; "Anything a scheduled task does through your connected GitHub identity or connectors appears as you."
- **Permissões durante a execução**: a sessão começa em auto mode, em que um classificador decide as ações que pediriam aprovação. O prompt salvo é a tarefa, mas "The fired prompt is therefore not live user input and can't act as approval or consent for actions during the run." Depois de bloqueios repetidos, "a permission prompt appears in the run's session and waits until someone answers it" (seção 2.5).
- **Limites de frequência**: 100 execuções agendadas por hora por conta, 30 por hora por tarefa para "Run now" e API; "None of these hourly limits has overage." Não há mais cota diária de execuções na página atual.
- **Consumo**: "Scheduled tasks draw down subscription usage the same way interactive sessions do." Sem créditos de uso ligados, "additional runs are rejected until your usage window resets".
- **Conexão com o GitHub**: se a conexão estiver ausente ou expirada, a tarefa pula execuções por até 72 horas e depois "turns off", e precisa ser religada à mão.
- **Duração**: a página das rotinas não fixa duração máxima de sessão. O ambiente fixa o tempo por comando: 2 minutos por padrão, até 10 a pedido, e mais 30 minutos em segundo plano (https://code.claude.com/docs/en/cloud-environments, "Time limits"). Uma sessão "stop[s] after a period of inactivity" (https://code.claude.com/docs/en/claude-code-on-the-web).

**Autenticação no GitHub** (https://code.claude.com/docs/en/claude-code-on-the-web, "GitHub authentication options"; https://code.claude.com/docs/en/cloud-environments, "GitHub proxy"):

- Duas formas: autorizar o **Claude GitHub App** ("Any public repository, and private repositories that the Claude GitHub App is installed on") ou **`/web-setup`**, que envia o token local do `gh` à conta Claude ("Any repository your `gh` token can access").
- A credencial "never enter[s] a session's VM"; um proxy a anexa do lado do servidor. O proxy recusa deleção de branch e push de tag, e "doesn't limit which branches a push can update".
- **O proxy recusa a API GraphQL** do GitHub: "`gh` subcommands that use GraphQL, such as `gh pr` and `gh issue`, get the same 403". Sobra a REST por `gh api repos/{owner}/{repo}/...`.
- O Claude GitHub App pede, entre outras, Actions, Checks, Contents, Issues, Pull requests e Workflows com escrita, e Dependabot alerts com leitura (https://code.claude.com/docs/en/github-actions, "GitHub App permissions"). A lista não tem "Code scanning alerts", permissão que o GitHub exige para `GET /repos/{owner}/{repo}/code-scanning/alerts` com token de app (https://docs.github.com/en/rest/authentication/permissions-required-for-github-apps). **Hipótese**: pela conexão do app, a rotina não lê os alertas do CodeQL; por `/web-setup`, lê, porque o token do `gh` do Autor tem o escopo `repo` (`gh auth status`, 2026-11-20) e a REST aceita `public_repo` para repositório público (https://docs.github.com/en/rest/code-scanning/code-scanning).

### 1.2 Claude Code num workflow agendado do GitHub Actions

Fontes: https://code.claude.com/docs/en/github-actions e o repositório `anthropics/claude-code-action` no commit `c84e279` de 2026-11-19 (`action.yml`, `docs/security.md`, `docs/setup.md`, `docs/usage.md`, `docs/solutions.md`); a tag mais recente é `v1.0.284`.

- **Agendamento**: "With a `prompt` input, the Claude Code GitHub Action runs in automation mode on any GitHub event, including a cron schedule." O `docs/solutions.md` traz um exemplo "Weekly Maintenance" com `schedule` e `workflow_dispatch`.
- **Regras do `schedule` no GitHub** (https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows): roda só no branch padrão; o intervalo mínimo é de 5 minutos; pode atrasar sob carga, sobretudo na virada da hora, e "some queued jobs may be dropped"; "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days."
- **Duração**: até 6 horas por job em runner hospedado (https://docs.github.com/en/actions/reference/limits).
- **Autenticação na Anthropic**: `ANTHROPIC_API_KEY` (Claude Console), `CLAUDE_CODE_OAUTH_TOKEN` (assinatura Pro, Max, Ultra, Team ou Enterprise, gerado por `claude setup-token`), ou federação de identidade (WIF), em que a action troca o token OIDC do workflow por acesso à API "through a Claude Console service account", sem segredo de longa duração.
- **Autenticação no GitHub**: por padrão, o Claude GitHub App oficial, por OIDC (`id-token: write`). Ou um **GitHub App próprio**, cujo token entra no input `github_token` (`docs/setup.md`, "Using a Custom GitHub App"; permissões mínimas: Contents, Issues e Pull requests com escrita). Instalar o app oficial aceita o conjunto inteiro de permissões: "GitHub doesn't let you accept a subset."
- **Quem pode disparar**: "Events that no user authors, such as a `schedule` trigger, skip this check."
- **Permissões do Claude no job**: auto mode por padrão; o `docs/security.md` recomenda `--permission-mode acceptEdits` ou `default` "For a strict list of what Claude may run".
- **GitHub CLI e GraphQL**: funcionam no runner; nada no caminho as recusa.

### 1.3 Outras opções

| Opção | Por que não serve aqui | Fonte |
|---|---|---|
| Automações do Copilot cloud agent (agenda por hora, dia ou semana) | "The repository must be private or internal. Automations are not available in public repositories." Exige plano Copilot pago e cobra créditos de IA e minutos de Actions. | https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-automations |
| Tarefas agendadas do Codex/ChatGPT | No app de desktop, "Keep the computer on and the app running when a scheduled task needs local files"; a página não documenta execução na nuvem sobre um repositório do GitHub. | https://developers.openai.com/codex/app/automations.md |
| `openai/codex-action` num workflow agendado | Mesma forma da opção 1.2, com cobrança na API da OpenAI; não acrescenta nada e foge do agente que o projeto já usa. **Inferência.** | — |
| Tarefas agendadas do Claude Code Desktop e `/loop` | Rodam "on your machine instead of in the cloud". | https://code.claude.com/docs/en/routines |

Restam duas candidatas: a rotina na nuvem (1.1) e o workflow agendado (1.2).

## 2. Identidade e assinatura

### 2.1 O squash exige commits assinados no branch do PR

A documentação do GitHub responde de forma direta (https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets, "Require signed commits"; o mesmo texto em https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches):

> When GitHub evaluates whether a pull request can be merged, it creates a test merge commit whose parents are the latest commit on the base branch and the pull request's head commit. GitHub checks the commits introduced by this test merge, including commits from the head branch. As a result, unsigned commits on the head branch can block a squash merge, even though GitHub would sign the final squash commit. This restriction can also apply to the author of the pull request.

Consequência: todo commit que o agente põe num branch de PR precisa sair assinado e verificado, mesmo que o ruleset só mire a `main`. O commit de squash, o GitHub assina.

Os commits do Dependabot já chegam assinados: numa amostra lida pela API em 2026-11-20, o committer é `GitHub <noreply@github.com>` com `verification.verified: true` e `reason: valid`.

### 2.2 Como cada opção produz commits verificados

**Rotina na nuvem.** A documentação diz só que "git credentials and signing keys stay outside the sandbox" (https://code.claude.com/docs/en/claude-code-on-the-web, "Security and isolation"). O resto vem de medição e de relatos:

- **Medido** (API do GitHub, 2026-11-20, nos cinco commits mais recentes de sessões na nuvem num repositório privado do Autor, de 2026-11-18): autor e committer `Claude <noreply@anthropic.com>`, ligados ao usuário `claude` do GitHub, com assinatura SSH e `verification.verified: true`, `reason: valid`. A mensagem traz o trailer `Claude-Session:` com o link da sessão.
- **Relatos no repositório oficial** mostram que essa assinatura passa por um serviço (`gpg.ssh.program=/tmp/code-sign`) e já falhou: entre julho e agosto de 2026, os commits saíam sem assinatura por uma chave vazia ([anthropics/claude-code#78787](https://github.com/anthropics/claude-code/issues/78787), [#83609](https://github.com/anthropics/claude-code/issues/83609)), e em março e abril o serviço devolvia erro 400 e impedia qualquer commit ([#31276](https://github.com/anthropics/claude-code/issues/31276), [#44373](https://github.com/anthropics/claude-code/issues/44373)). As issues foram fechadas por inatividade, sem nota de correção.
- Conclusão: hoje a rotina produz commits que o ruleset aceita, mas por um mecanismo não documentado, que já quebrou duas vezes em 2026. Uma quebra silenciosa deixaria o PR do agente impossível de mesclar (2.1). **Inferência.**

**Workflow com a `claude-code-action`** (`docs/security.md`, "Commit Signing"; `action.yml`):

- `use_commit_signing: true`: "This uses GitHub's API to create commits, which automatically signs them as verified from the GitHub App". Limite declarado: "Simple but cannot perform complex git operations like rebasing" (`docs/usage.md`).
- `ssh_signing_key`: assina com uma chave SSH guardada como segredo; "Commits will show as verified and attributed to the GitHub account that owns the signing key", com `bot_id` e `bot_name` dessa conta.
- A regra geral do GitHub para bots: "If a commit or tag has a bot signature that is cryptographically verifiable, GitHub marks the commit or tag as verified", desde que a requisição seja autenticada como o app e não traga autor, committer nem assinatura personalizados (https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification).
- Para atualizar um branch atrasado sem rebase local, a REST tem `PUT /repos/{owner}/{repo}/pulls/{pull_number}/update-branch`, que cria o commit de merge no servidor (https://docs.github.com/en/rest/pulls/pulls). **Hipótese**: esse commit sai assinado pelo GitHub, como os da interface web.

### 2.3 Com que identidade abre e mescla PRs

| | Rotina na nuvem | Workflow com app próprio | Workflow com o app oficial do Claude |
|---|---|---|---|
| Autor dos commits | `claude` (medido) | o bot do app do Autor | `claude[bot]` (`bot_name` padrão em `action.yml`) |
| Quem empurra e abre o PR | a conta do Autor, pelo proxy ("appears as you") | o app do Autor | o app oficial |
| Quem mescla | a conta do Autor, só pela REST (2.5) | o app do Autor | o app oficial |
| O merge dispara a entrega? | sim: não é evento do `GITHUB_TOKEN` | sim | sim |

A regra que decide a última linha: "events triggered by the `GITHUB_TOKEN` will not create a new workflow run"; um PR criado ou atualizado com o `GITHUB_TOKEN` gera execuções "in an **approval-required** state", que esperam alguém clicar "Approve workflows to run"; "a GitHub App installation access token or a personal access token" evita as duas coisas (https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow). Então o agente nunca usa o `GITHUB_TOKEN` para empurrar, abrir PR ou mesclar: seria trava humana em todo PR dele.

O app próprio pode ser o mesmo GitHub App que #52 decidiu para o merge automático do Dependabot, com mais permissões (lista na seção "Preparação única"). **Inferência**: um app só, do Autor, instalado só neste repositório, cobre os dois robôs.

### 2.4 A aprovação extra para PR "não atribuído"

O ruleset traz `require_extra_approval_for_unattributed_changes: true`. A regra é do Copilot: "When Copilot opens a pull request that isn't attributed to a person, the ruleset requires one more approval than the number you configured", e "This setting has no effect if the ruleset requires zero approvals" (https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets, recurso em prévia pública). Com zero aprovações, não afeta nenhuma das opções.

### 2.5 O auto mode bloqueia o merge feito pelo próprio agente

Na lista do que o classificador do auto mode bloqueia por padrão está "Merging a pull request no human has approved, approving Claude's own pull request, or disabling CI checks"; empurrar para qualquer branch do repositório e abrir PR são permitidos (https://code.claude.com/docs/en/permission-modes, "What the classifier blocks by default"). A intenção explícita do usuário libera um bloqueio brando, mas na rotina o prompt salvo "can't act as approval or consent" (seção 1.1). Três bloqueios seguidos ou vinte no total pausam o auto mode e deixam um pedido de aprovação esperando alguém (mesma página, "Repeated-block thresholds"). Regras de permissão (`allow`) resolvem antes do classificador (mesma página, "How the classifier evaluates actions"), mas o classificador "doesn't read `autoMode` from project settings in `.claude/settings.json`" (https://code.claude.com/docs/en/auto-mode-config).

Consequência (**inferência**): o merge não deve ser uma ação do modelo. Nas duas opções ele sai do agente e vai para a esteira:

- **Rotina**: o agente só empurra e abre o PR pela REST; um workflow do repositório, com o token do app do Autor, liga o auto-merge (`gh pr merge --auto --squash`) nos PRs do agente, como o de #52 faz nos do Dependabot. A rotina nem conseguiria ligar o auto-merge sozinha: o `gh pr merge` usa GraphQL, que o proxy recusa (seção 1.1).
- **Workflow**: um passo determinístico depois do Claude, com o token do app, abre o PR e liga o auto-merge. Ou uma regra `--allowedTools "Bash(gh pr merge:*)"` em `claude_args`, que resolve antes do classificador.

Assim o `gate` decide o merge, como em todo PR, e o modelo nunca aprova o próprio trabalho.

### 2.6 Empurrar no branch do Dependabot ou abrir PR próprio

O que acontece quando o agente empurra um conserto no branch de um PR do Dependabot:

- **O Dependabot para de rebasear**: "By default, Dependabot will stop rebasing a pull request once extra commits have been pushed to it." As marcas `[dependabot skip]` e afins na mensagem autorizam o Dependabot a "force push over commits added to its branches", isto é, a apagar o conserto no próximo rebase (https://docs.github.com/en/code-security/dependabot/working-with-dependabot/managing-pull-requests-for-dependency-updates). `@dependabot recreate` "Recreates the pull request, overwriting any edits" (https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-pull-request-comment-commands).
- **A rodada deixa de ser "do Dependabot"**: as execuções "triggered by Dependabot" recebem `GITHUB_TOKEN` só de leitura e "the only secrets available to the workflow are Dependabot secrets" (https://docs.github.com/en/code-security/dependabot/troubleshooting-dependabot/troubleshooting-dependabot-on-github-actions). Um push do agente faz a rodada ser dele, com os segredos de Actions. O workflow de merge automático de #52 guarda o ID e a chave do app como segredos do Dependabot; na rodada disparada pelo agente, eles não estariam lá, e o merge automático falharia (**inferência**).
- **Depois do merge de um PR próprio**: "Dependabot will close pull requests for dependency updates, once it detects these updates have been committed to the default branch. However, in rare circumstances, the pull request may remain open" (https://docs.github.com/en/code-security/reference/supply-chain-security/troubleshoot-dependabot/dependabot-errors).

Recomendação desta pesquisa: **PR próprio**, criado a partir do branch do Dependabot (os commits assinados dele mais o conserto do agente), com título em Conventional Commits e o corpo citando o PR original. O PR do Dependabot fica intacto e se fecha sozinho quando a versão chega à `main`; se continuar aberto, a próxima ronda o fecha. O agente não precisa de rebase do Dependabot nem de segredo duplicado.

## 3. Custo

### 3.1 Preços e regras que entram na conta

- **API da Anthropic, por milhão de tokens** (https://platform.claude.com/docs/en/about-claude/pricing): Opus 5.5 a US$ 4 de entrada e US$ 20 de saída, escrita no cache de 5 minutos a US$ 5 e leitura do cache a US$ 0,20; Sonnet 5.5 a US$ 2, US$ 10, US$ 2,50 e US$ 0,10; Haiku 5.5 (até 100 mil tokens de prompt) a US$ 0,10, US$ 0,50, US$ 0,125 e US$ 0,01.
- **Créditos da API**: comprados antes do uso, "Credits expire one year from the purchase date", "All credit purchases are non-refundable", e a recarga automática "purchases additional credits automatically when your balance falls below a threshold you set" (https://support.claude.com/en/articles/8977456-how-do-i-pay-for-my-claude-api-usage). A página não diz o valor mínimo de compra. Um limite de gasto mensal por organização ou por workspace corta as requisições com HTTP 400 quando atingido (https://platform.claude.com/docs/en/api/rate-limits, "Setting your own spend limit"; https://platform.claude.com/docs/en/manage-claude/workspaces, "Setting workspace limits").
- **Créditos inclusos nos planos Max e Ultra** (US$ 100 e US$ 200 por mês) **não cobrem o Claude Code**: a tabela de cobertura diz "Claude Code: No", e uma sessão do Claude Code numa organização só com esses créditos recebe "Credit balance too low" (https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers). A `claude-code-action` roda o Claude Code, então pagaria com crédito comprado (**inferência**).
- **Token da assinatura** (`claude setup-token`): "a one-year OAuth token", que "authenticates with your Claude subscription and requires a Pro, Max, Ultra, Team, or Enterprise plan" (https://code.claude.com/docs/en/authentication, "Generate a long-lived token"). Com ele, "runs use your Claude subscription instead of API billing" (https://code.claude.com/docs/en/github-actions, "Manage costs").
- **O que os termos permitem**: o OAuth "is intended exclusively for purchasers of Claude Free, Pro, Max, Ultra, Team, and Enterprise subscription plans and is designed to support ordinary use of Claude Code and other native Anthropic applications", e "Advertised usage limits for Pro, Max, and Ultra plans assume ordinary, individual usage of Claude Code and the Agent SDK" (https://code.claude.com/docs/en/legal-and-compliance). A própria documentação da action manda usar o token da assinatura num segredo do repositório. A ronda semanal do próprio repositório do Autor, com o binário oficial, cabe nesse uso (**inferência**); o que os termos vedam é terceiro intermediar ou revender o acesso.
- **Rotina na nuvem**: consome a assinatura "the same way interactive sessions do", "there's no separate charge for the cloud VM" (https://code.claude.com/docs/en/routines; https://code.claude.com/docs/en/claude-code-on-the-web).
- **Minutos do GitHub Actions**: os runners padrão em repositório público são gratuitos e não consomem a cota (https://docs.github.com/en/billing/concepts/product-billing/github-actions).
- **Classificador do auto mode**: as chamadas dele "count on accounts that use the Claude API" (https://code.claude.com/docs/en/permission-modes, "Cost and latency"). Uma lista fixa de ferramentas, sem auto mode, evita esse custo.
- **Planos** (https://claude.com/pricing, 2026-11-20): Pro a US$ 20 por mês (US$ 17 no anual), Max a US$ 100, Ultra a US$ 200. O Autor já roda sessões do Claude Code na nuvem pela própria conta (seção 2.2), recurso que exige pelo menos o Pro (https://code.claude.com/docs/en/feature-availability), então a assinatura já existe (**inferência**); qual plano é, esta pesquisa não leu.

### 3.2 Quanto custa uma ronda

Não há medição de uma ronda desta esteira; ela não existe. A estimativa usa o perfil de sessão que a documentação mostra como exemplo do `/cost` (1,2 mil tokens de entrada, 5,3 mil de saída, 940 mil de leitura de cache e 50 mil de escrita de cache, https://code.claude.com/docs/en/costs), repreçado com a tabela atual. **Hipótese**: um conserto típico (um PR de robô que quebrou um teste ou um tipo) cabe nesse perfil.

| Modelo | Uma sessão no perfil do exemplo |
|---|---|
| Haiku 5.5 | ≈ US$ 0,02 |
| Sonnet 5.5 | ≈ US$ 0,27 |
| Opus 5.5 | ≈ US$ 0,55 |

A conta do Sonnet 5.5: 0,0012 × 2 + 0,0053 × 10 + 0,94 × 0,10 + 0,05 × 2,50 = US$ 0,27.

O que decide o custo mensal é **chamar o modelo só quando há trabalho**. No workflow, um passo de triagem em shell (`gh api` sobre PRs, rodadas e alertas) decide se há algo vermelho; sem nada, o job termina sem chamar o modelo. Cenários, com o Sonnet 5.5 e a triagem:

| Mês | Sessões do modelo | Custo na API |
|---|---|---|
| Calmo: tudo verde ou resolvido pelos robôs | 0 | US$ 0 |
| Típico (**hipótese**: um conserto) | 1 | ≈ US$ 0,27 |
| Pesado (**hipótese**: dois consertos de quatro vezes o perfil, como uma major do Next que muda API) | 2 | ≈ US$ 2,20; o limite de US$ 2 corta o segundo e a ronda relata (seção 5) |

Com o Opus 5.5, os números dobram; com o Haiku 5.5, caem a um vigésimo, mas é o modelo mais fraco para entender uma quebra de major (**inferência**). Sem a triagem, cada semana pagaria ao menos uma sessão curta de leitura.

### 3.3 Custo por opção, diante do teto de US$ 2

| Opção | Custo incremental | Observação |
|---|---|---|
| Rotina na nuvem | US$ 0 | consome os limites da assinatura do Autor, os mesmos das sessões dele; sem triagem determinística, toda semana abre uma sessão |
| Workflow com token da assinatura | US$ 0 | mesmo consumo da assinatura; o token vence em um ano e só o Autor gera outro |
| Workflow com a API (chave ou WIF) | ≈ US$ 0 a 0,30 por mês no típico, cortado em US$ 2 pelo limite | item pago novo: compra de créditos, decisão do Autor; os créditos vencem em um ano, e a recarga automática repõe |
| Minutos de Actions | US$ 0 | repositório público |

## 4. Ambiente

**Rotina na nuvem** (https://code.claude.com/docs/en/cloud-environments):

- Cada sessão ganha uma VM nova com Ubuntu 24.04 x86_64, 4 vCPUs, 16 GB de RAM e 30 GB de disco.
- Vêm instalados Docker ("docker, dockerd, docker compose"), Node 20, 21 e 22 (22 no `PATH`), pnpm, `gh`, `jq` e Chrome. **Não há Node 24**: o projeto o instalaria num script de setup, e `nodejs.org` está na lista de domínios liberados por padrão.
- A lista padrão inclui Docker Hub, `ghcr.io`, `mcr.microsoft.com` (imagem do Playwright) e `registry.npmjs.org`.
- O script de setup vira um retrato do disco quando termina em uns cinco minutos, com as imagens já baixadas; serviços em execução não entram no retrato.
- Tempo por comando: 2 minutos por padrão, até 10 a pedido, e mais 30 em segundo plano; ajustável por `BASH_DEFAULT_TIMEOUT_MS` e `BASH_MAX_TIMEOUT_MS`.
- **Hipótese a testar**: o `pnpm verify` roda inteiro na VM. Nada na documentação o impede, mas o build da imagem chama `pnpm install` dentro do Docker, atrás do proxy de segurança, e o contêiner do Playwright pede `--ipc=host`; nenhum dos dois foi provado.
- A favor: as credenciais do GitHub ficam fora da VM, então o código das dependências que o `pnpm verify` executa não alcança o token.

**Workflow do GitHub Actions**:

- O runner `ubuntu-24.04` (imagem 20261111.370.1) traz Docker 28.0.4, Compose 2.38.2, Node 22.23.4 como padrão e o Node 24.22.2 em cache (https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md). O runner padrão de repositório público tem 4 CPUs e 16 GB (https://docs.github.com/en/actions/reference/runners/github-hosted-runners, citado em [validacao-em-esteira.md](https://github.com/ThiagoPanini/minimal-me/blob/research/validacao-em-esteira/docs/research/validacao-em-esteira.md)).
- É a mesma máquina do job `e2e` da CI. O `pnpm verify` roda aqui pelo mesmo motivo que a CI roda (**inferência** forte).
- Contra: o código das dependências roda no job que tem o token do app e a credencial da Anthropic. A action avisa: "A command that runs repository code (`npm install`, `bun test`, `make`) runs whatever the checkout contains, in a job that holds your workflow's tokens", e em `schedule` a restrição automática de comandos não se aplica (`docs/security.md`, "Running code from pull requests"). O que reduz o risco: o pnpm 12 não roda script de instalação fora de `allowBuilds` (decisão 8 de #52), o token do app "will expire after 1 hour" (https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app) e o token federado da Anthropic também é de curta duração (https://platform.claude.com/docs/en/manage-claude/workload-identity-federation).
- Um detalhe de implementação: no modo de automação, os commits por API caem no branch de `CLAUDE_BRANCH`, ou, sem ele, no `GITHUB_REF_NAME` (`src/modes/agent/index.ts` no commit `c84e279`). Numa execução agendada isso é a `main`, que o ruleset recusa; o workflow cria antes um branch por problema e o passa em `CLAUDE_BRANCH` (**inferência**).

**Precisa rodar o `pnpm verify`?** A CI do PR do agente roda o `gate` de graça (seção 3.1) e é quem decide o merge. O `pnpm verify` antes do push só poupa voltas de CI. A decisão 13 de #52 põe o `pnpm verify` no ciclo de todo agente, e o workflow cumpre isso sem custo extra; na rotina, depende da hipótese acima.

## 5. Limites

### 5.1 A ronda

1. **Triagem, sem modelo** (passo em shell, com o token do app):
   - PRs abertos do Dependabot com o `gate` vermelho depois das três tentativas da nova tentativa diária (decisão 8 de #52). O critério de "defeito real" vem daí: o que falhou três vezes não é instabilidade passageira.
   - A última rodada da `main` vermelha depois das três tentativas.
   - Alertas abertos do Dependabot (inclusive malware) sem PR que os corrija, e alertas abertos do CodeQL.
   - Issues abertas pela própria ronda que ainda não fecharam.
   - Lista vazia: o job termina verde, sem modelo, sem issue e sem comentário.
2. **Conserto, um problema por vez**, cada um num branch próprio: o agente lê a falha, corrige, roda o `pnpm verify`, empurra com commit assinado e abre um PR próprio (seção 2.6). Um passo determinístico liga o auto-merge com o token do app; o `gate` decide.
3. **Teto por ronda**: `timeout-minutes` no job, `--max-turns` no Claude e no máximo duas tentativas de conserto por problema; o que sobra vira relato. (Os valores saem da implementação.)

### 5.2 O que mescla sozinho (pelo `gate`, sem ninguém)

- O conserto de código, teste, configuração ou lockfile que faz passar uma atualização de robô, inclusive major. Exceção mantida de #52: a major do Node, que o `dependabot.yml` passa a ignorar até o Next suportar o 26, para não gerar PR nem relato.
- O conserto da `main` vermelha, inclusive por corrida entre PRs.
- A correção de alerta do Dependabot que o robô não abriu, com `pnpm up` ou override, gravando a exceção de maturidade do pnpm no mesmo commit (seção 2.4 de [seguranca-e-entrega.md](https://github.com/ThiagoPanini/minimal-me/blob/research/seguranca-e-entrega/docs/research/seguranca-e-entrega.md)).
- A correção de alerta do CodeQL no código.
- A atualização de referência visual quando a causa é a troca de versão do navegador ou do Playwright, dita no corpo do PR (regra da decisão 5 de #52: nenhuma mudança visual espera o Autor).

### 5.3 O que só relata

| Situação | Por quê | Para onde vai |
|---|---|---|
| O conserto exigiria mudar uma decisão: relaxar tolerância visual, orçamento de peso ou LCP, desligar um teste ou check, mexer no ruleset, nas permissões de workflow, nos segredos ou na entrega | decisão registrada não muda em manutenção | issue `needs-triage`, lida pela próxima sessão de agente |
| Duas tentativas sem `gate` verde | o agente agendado não conseguiu; um agente com sessão pode | issue `ready-for-agent` com o diagnóstico e o branch |
| Alerta de segredo vazado (secret scanning) | girar a credencial exige a conta do Autor | issue `ready-for-human` que menciona o Autor |
| Alerta de malware numa dependência que entrou no build | o agente remove ou fixa o pacote e mescla, mas uma imagem já publicada pode ter levado o código; avaliar e girar segredos é do Autor | conserto mesclado e issue `ready-for-human` |
| Alerta alto ou crítico do CodeQL que o agente julga falso positivo | dispensar alerta de segurança é decisão | issue `needs-triage`; médio e baixo o agente dispensa com a justificativa no próprio alerta (pergunta 6) |

Os rótulos são os do vocabulário do repositório ([docs/agents/triage-labels.md](../agents/triage-labels.md)). Cada problema tem uma issue só: a ronda procura a aberta antes de criar outra e a fecha quando o problema some.

**Quem lê**: a regra (a) da decisão 12 de #52 faz toda sessão de agente começar pela ronda; ela passa a incluir as issues abertas pela ronda. A issue `ready-for-human` menciona o Autor, e ter o nome mencionado é um dos motivos de notificação do GitHub (https://docs.github.com/en/subscriptions-and-notifications/concepts/about-notifications); é o único caso em que ele é chamado.

### 5.4 Como avisa quando não consegue rodar

- **O job falha** (credencial vencida, limite de gasto, erro do runner): "Notifications for scheduled workflows are sent to the user who initially created the workflow" (https://docs.github.com/en/actions/concepts/workflows-and-actions/notifications-for-workflow-runs), por e-mail ou na web, conforme a configuração dele. Um passo final `if: failure()` abre ou atualiza uma issue `ready-for-agent` com o motivo, para a próxima sessão.
- **O agendamento atrasa ou cai sob carga**: a próxima semana cobre; a nova tentativa diária segue rodando. Escolher um minuto fora da hora cheia reduz o risco (https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).
- **O agendamento é desligado por 60 dias sem atividade**: com o Dependabot semanal em três ecossistemas e o merge automático, a `main` recebe commits toda semana (**inferência**). Não vale montar vigia para isso.
- **Na rotina**, as falhas aparecem só no histórico da tarefa em claude.ai ("**Error**", "**Cancelled**" ou nada), e "These outcomes say how the session ended, not whether Claude completed the work"; uma execução recusada por limite de uso ou pulada por conexão do GitHub vencida não deixa rastro no repositório (https://code.claude.com/docs/en/routines). Para ter leitor, a rotina precisaria de um vigia no GitHub que conferisse a data da última ronda: uma peça a mais.

### 5.5 Duplo cheque das travas

Critério do Autor: trava só fica se disparar com problema real e um agente puder resolver; sinal sem leitor sai; o que exige a conta dele vira preparação única.

| Possível trava ou sinal | Rotina na nuvem | Workflow agendado | Veredito |
|---|---|---|---|
| Merge feito pelo modelo, bloqueado pelo auto mode e esperando aprovação | existe; contornado por workflow de auto-merge | não existe: o merge é passo determinístico | tirar o merge do modelo nas duas |
| `GITHUB_TOKEN` exigindo "Approve workflows to run" | não se aplica | evitado com o token do app | nunca usar `GITHUB_TOKEN` para escrever |
| Serviço de assinatura da sessão fora do ar (já aconteceu duas vezes) | trava sem defeito: PR impossível de mesclar | não se aplica: a API do GitHub assina | ponto contra a rotina |
| Limite de uso da assinatura esgotado | trava sem defeito, sem rastro | só com o token da assinatura; falha visível | ponto contra a rotina |
| Conexão do GitHub vencida | desliga a tarefa em 72 horas, e só o Autor religa | não se aplica | ponto contra a rotina |
| Token da assinatura vencido em um ano | não se aplica | só com o token da assinatura: trava anual que só o Autor resolve | preferir WIF |
| Limite de gasto da API atingido | não se aplica | falha visível; relata; volta no mês seguinte | aceitável: só dispara em mês de muito conserto |
| Falha passageira ou de terceiro | — | — | fica com a nova tentativa diária; a ronda só olha o que falhou três vezes |
| Relatório semanal "tudo verde" | — | — | sinal sem leitor: não existe |
| Issue de problema não resolvido | — | — | tem leitor: a próxima sessão de agente |

## 6. Exageros

Para um site pessoal, estático e não crítico, com um mantenedor:

- **Rodar mais de uma vez por semana, ou a cada falha** (gatilho por evento, como o auto-fix de PR da nuvem ou um workflow em `workflow_run` falho): a nova tentativa diária já cobre o passageiro, e o export estático tira a pressa dos patches do Next ([ADR 0005](../adr/0005-home-em-export-estatico.md)). Reagir a cada falha brigaria com a nova tentativa e gastaria mais.
- **Rodar as duas opções** (rotina e workflow) ou dois fornecedores de agente: dois robôs mexendo nos mesmos PRs, sem ganho.
- **Um segundo agente revisor** do conserto, ou aprovação humana no PR do agente: o `gate` é o juiz, e o ruleset tem zero aprovações por decisão.
- **Vigia externo** (healthchecks, painel, notificação em Slack ou Telegram): no workflow, a falha já vira e-mail e issue.
- **Relatório semanal, comentário em PR ou issue de "tudo em ordem"**: sinal sem leitor.
- **Opus 5.5 como modelo padrão** e modo rápido: o dobro do custo para consertos que, em geral, são de versão e tipo.
- **Runner próprio ou agente na VPS**: manutenção de máquina para economizar minutos que já são gratuitos.
- **Assinar commits com a chave SSH do Autor num segredo** (`ssh_signing_key`): um segredo de longa duração com a identidade dele no job que roda código de terceiros, quando a API do GitHub assina como o app sem segredo nenhum.
- **Memória própria entre execuções** (banco, artefatos de grupo de automação): as issues abertas e os PRs já guardam o estado.
- **Automações do Copilot**: não existem para repositório público (seção 1.3).
