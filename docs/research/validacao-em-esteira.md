# Validação em esteira para a web em Next: estágios, checks e testes

Pesquisa do ticket [#49](https://github.com/ThiagoPanini/minimal-me/issues/49), parte do mapa [#1](https://github.com/ThiagoPanini/minimal-me/issues/1), que destrava [Esteira de validação e entrega da web (#52)](https://github.com/ThiagoPanini/minimal-me/issues/52). Data de referência: 2026-11-15. Toda versão citada é a vigente nessa data, com a fonte ao lado.

## Retomada

- **Feito**: contexto (ticket #49, Base técnica #17, fronteira com #50, critérios da Home em #12, `docs/design/`, ruleset e configurações do repositório); seções 1 (estágios) e 2 (checks obrigatórios).
- **Mudança de escopo (2026-11-15, coordenador)**: a forma da web não está fechada. A recomendação atual para o Marco 1 é `output: "export"` (o Next gera arquivos estáticos no build, servidos por nginx numa imagem de contêiner), com o servidor Node (`standalone`) só quando um space futuro pedir recursos de servidor. Onde a esteira depende da forma, esta pesquisa cobre primeiro a exportação estática e acrescenta uma nota curta sobre o que muda com `standalone`. O "Destrava" do ticket aponta agora para #52, que também pede o nome dos checks no ruleset.
- **Próximo**: seção 3 (camadas de teste), seção 4 (velocidade), seção 5 (checks do sistema de design), seção 6 (exageros), esteira recomendada, alternativas descartadas e perguntas abertas.

## Pergunta

Qual é a estratégia mais moderna e eficiente de validação em esteira para a web do Minimal Me, do gancho local ao merge, julgada por fontes primárias e pelas práticas atuais, e não pelo que os projetos da frota fazem hoje?

Fora: segurança da cadeia de suprimentos e entrega (gitleaks, Dependabot, permissões de workflow, Dockerfile, imagem, deploy, smoke), que estão em [#50](https://github.com/ThiagoPanini/minimal-me/issues/50). Esta pesquisa só toca nesses temas onde a validação depende deles, e diz quando isso acontece.

## Contexto: confirmado, hipótese e pendente

**Confirmado** (lido no repositório e na API do GitHub em 2026-11-15):

- O repositório é público e pertence à conta pessoal, não a uma organização (`gh repo view --json isInOrganization,visibility` devolve `false` e `PUBLIC`).
- O ruleset `panlabs` da `main` exige PR com squash como único método, histórico linear, commits assinados e zero aprovações, e não tem check obrigatório (`gh api repos/ThiagoPanini/minimal-me/rulesets/26774429`).
- O auto-merge está ligado; o título padrão do squash é `COMMIT_OR_PR_TITLE` e a mensagem padrão é `COMMIT_MESSAGES` (`gh api repos/ThiagoPanini/minimal-me`).
- Os critérios de aceite da Home estão na [resolução de #12](https://github.com/ThiagoPanini/minimal-me/issues/12): larguras de aceite 390 e 1440; teclado e leitor de tela alcançam nome, status e "Acessar" dos quatro spaces; texto sobre ilustração com contraste de 4,5:1 (3:1 se grande) no pior ponto; sem JavaScript, texto e ilustrações aparecem; movimento reduzido para tudo; 404 no estilo do sistema; título, descrição, imagem de compartilhamento, favicon, `robots` e sitemap; arquivos estáticos com hash e cache longo; até 1 MB transferido na primeira visita a 390px e LCP de até 2,5 s em 4G.
- O sistema de design mora em `docs/design/system/` (`tokens.json`, `components/*/preview.html`, `fonts/`), e as prévias chamam imagens por `/_blob/<id>`, que só existem no Claude Design ([`docs/design/README.md`](../design/README.md), passo 5 de "Para republicar").

**Hipóteses de trabalho** (de #17 e do coordenador, a confirmar em #52):

- Forma: `output: "export"` servido por nginx num contêiner; `standalone` só quando um space pedir servidor.
- Versões estáveis mais novas em 2026-11-15: Next 16.4 ([blog do Next, 2026-10-06](https://nextjs.org/blog/next-16-4)), com o lançamento de segurança de 2026-11-03 ([blog do Next](https://nextjs.org/blog)); React 19.3 (no Next 16.4, mesma fonte); Node 26 LTS "Lithium", 26.13.1 ([nodejs.org](https://nodejs.org/en/about/previous-releases)); pnpm 12.21.0 ([releases do pnpm](https://github.com/pnpm/pnpm/releases), 2026-11-13); Biome 2.6.8 ([releases do Biome](https://github.com/biomejs/biome/releases), 2026-11-15); Playwright 1.65.1 ([releases do Playwright](https://github.com/microsoft/playwright/releases), 2026-11-13); Lighthouse 13.6.0 e Lighthouse CI 0.16.1 ([Lighthouse](https://github.com/GoogleChrome/lighthouse/releases), [LHCI](https://github.com/GoogleChrome/lighthouse-ci/releases)); axe-core 4.14.0 e `@axe-core/playwright` 4.14.0 ([axe-core](https://github.com/dequelabs/axe-core/releases), [axe-core-npm](https://github.com/dequelabs/axe-core-npm/releases)); lefthook 2.2.2 ([releases](https://github.com/evilmartians/lefthook/releases)); commitlint 21.2.4 ([releases](https://github.com/conventional-changelog/commitlint/releases)).

**Pendente** (fora desta pesquisa): a forma final e as versões (#17 e #52); Dockerfile, `nginx.conf`, health check, deploy e smoke (#50); o sistema de design v2 ([#40](https://github.com/ThiagoPanini/minimal-me/issues/40)).

## Resposta curta

1. **A CI é a autoridade; o gancho é atalho.** Ganchos locais rápidos (formatação no pre-commit, Conventional Commits no commit-msg, checagens de segundos no pre-push) economizam uma volta de CI para o agente, mas nada que precise valer depende deles, porque todos se pulam com `--no-verify`.
2. **CI no evento `pull_request`, e `push` só na `main`.** O `pull_request` testa o merge do PR com a `main`, traz o título do PR (que vira a mensagem do squash) e roda igual para o Dependabot.
3. **Dois checks obrigatórios com nome estável: `gate` e `pr-title`.** O `gate` agrega os jobs da validação e falha se algum não terminou em sucesso; o `pr-title` valida o título que vira o commit da `main`. Fonte fixada no app GitHub Actions.
4. **Sem modo strict e sem merge queue.** A merge queue não existe para repositório de conta pessoal; o strict cobra uma atualização e uma nova rodada a cada PR que perde a corrida. Em troca, a mesma validação roda de novo na `main` e segura o deploy.
5. **Testar o artefato que vai ao ar.** O e2e roda o Playwright no contêiner oficial dele contra a imagem nginx do próprio PR, localmente e na CI, com o mesmo comando. Bloqueiam: funcional, acessibilidade (axe e árvore ARIA), sem JavaScript, movimento reduzido, 404, metadados, cache, peso transferido e regressão visual em Chromium. Informa: LCP do Lighthouse, até provar estabilidade.

## 1. Estágios

### 1.1 Princípio: o que precisa valer mora na CI

O Git deixa pular os ganchos de cliente: o pre-commit e o commit-msg "can be bypassed with the `--no-verify` option" ([githooks](https://git-scm.com/docs/githooks)), e no push "With `--no-verify`, the hook is bypassed completely" ([git-push](https://git-scm.com/docs/git-push)). O lefthook ainda aceita `LEFTHOOK=0 git ...` para desligar tudo ([LEFTHOOK](https://github.com/evilmartians/lefthook/blob/master/docs/usage/envs/LEFTHOOK.md)). Então o gancho não é controle; é um atalho de feedback. A regra que sai daí:

- **Bloqueia de verdade** só o que roda na CI e entra no check obrigatório.
- **No gancho** fica só o que é rápido (segundos), determinístico e repetido na CI. O ganho para um mantenedor com agentes é concreto: uma falha de formatação pega no gancho custa segundos; pega na CI, custa uma rodada inteira (alguns minutos) e uma nova volta do agente.

### 1.2 Ganchos locais

Recomendação, com lefthook (binário único, configuração em YAML e execução paralela; [jobs](https://github.com/evilmartians/lefthook/blob/master/docs/configuration/jobs.md), [parallel](https://github.com/evilmartians/lefthook/blob/master/docs/configuration/parallel.md)):

| Gancho | O que roda | Por quê |
|---|---|---|
| `pre-commit` | `biome check --write` nos arquivos em stage, com `stage_fixed: true` | Corrige formatação e lint antes do commit. A receita oficial do Biome para lefthook usa `{staged_files}`, `--no-errors-on-unmatched` e `stage_fixed: true`, que "adds again the staged files" ([Biome, Git Hooks](https://biomejs.dev/recipes/git-hooks/)); o lefthook falha o gancho se o `git add` falhar ([stage_fixed](https://github.com/evilmartians/lefthook/blob/master/docs/configuration/stage_fixed.md)). O gitleaks, se entrar aqui, é decisão de #50. |
| `commit-msg` | `commitlint --edit {1}` com `@commitlint/config-conventional` | Valida Conventional Commits no próprio commit. A mesma configuração valida o título do PR na CI (seção 2.2). |
| `pre-push` | `pnpm check` (Biome em modo CI, tipos e checks do sistema de design; seção 1.3) | Segundos, sem navegador. Evita empurrar o que a CI vai recusar. |

Três detalhes de configuração que as fontes mostram:

- **pnpm 11+ bloqueia scripts de instalação.** O pacote npm `lefthook` instala os ganchos no `postinstall`, e a documentação do lefthook ainda manda liberar o pacote em `onlyBuiltDependencies` ([instalação Node](https://github.com/evilmartians/lefthook/blob/master/docs/installation/node.md)). Essa chave saiu no pnpm 11 e virou `allowBuilds`; pacote fora da lista "are disallowed by default", e com `strictDepBuilds` (padrão `true`) a instalação falha ([pnpm, Build settings](https://pnpm.io/settings/build)). Então: `allowBuilds: { lefthook: true }` no `pnpm-workspace.yaml`.
- **Na CI os ganchos não se instalam**: com `CI=true`, o pacote não instala ganchos no `postinstall` ([CI](https://github.com/evilmartians/lefthook/blob/master/docs/usage/envs/CI.md)), e o GitHub Actions define `CI`.
- **`config-conventional` e português.** As regras do preset exigem cabeçalho de até 100 caracteres, proíbem assunto em `sentence-case`, `start-case`, `pascal-case` e `upper-case`, e tratam como erro linha de corpo acima de 100 caracteres ([código do preset](https://github.com/conventional-changelog/commitlint/blob/master/%40commitlint/config-conventional/src/index.ts)). O histórico do repositório já começa o assunto em minúscula (`docs(adr): hospedagem da Home ...`, `git log`), então a primeira regra não muda nada. A última pega corpos em prosa sem quebra de linha; vale desligar `body-max-line-length` ou rebaixá-la a aviso, porque o corpo não é o que a esteira protege (seção 2.2).

Ganchos são do Git, não do agente: servem ao Claude Code e ao Codex sem configuração duplicada, o que o brief lista como armadilha ([`docs/brief.md`](../brief.md), "Armadilhas").

### 1.3 Um comando, o mesmo da CI

O agente precisa de um comando que responda "a CI vai passar?" sem adivinhar. Recomendação de scripts na raiz:

| Script | O que faz | Onde roda |
|---|---|---|
| `pnpm check` | `biome ci .`, checagem de tipos e os checks do sistema de design (`node --test`) | pre-push, job `quality` da CI |
| `pnpm test:e2e` | build da exportação, imagem nginx, Playwright no contêiner oficial contra ela, Lighthouse | job `e2e` da CI |
| `pnpm verify` | `pnpm check` e depois `pnpm test:e2e` | o agente, antes de abrir ou atualizar o PR |

O que torna "o mesmo comando" verdadeiro é o ambiente, não o nome do script. O Playwright diz que a renderização "can vary based on the host OS, version, settings, hardware, power source" e que, para capturas consistentes, se roda "in the same environment where the baseline screenshots were generated" ([Visual comparisons](https://playwright.dev/docs/test-snapshots)); a página de CI acrescenta que rodar num contêiner dá um ambiente consistente para comparação de capturas ([Playwright, CI](https://playwright.dev/docs/ci)). Por isso o e2e roda dentro da imagem `mcr.microsoft.com/playwright:v1.65.1-noble` nos dois lugares (detalhes na seção 3.1). A máquina do Autor tem Docker 29.1.3 (`docker --version`, 2026-11-15) e o runner `ubuntu-24.04` tem Docker 28.0.4 e Compose 2.38.2 ([imagem do runner, versão 20261111](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md)).

O ciclo do agente fica: `pnpm verify`, push, `gh pr create`, `gh pr merge --auto --squash` (merge "only after necessary requirements are met", [gh pr merge](https://cli.github.com/manual/gh_pr_merge)) e `gh pr checks --watch --fail-fast` para acompanhar (`gh pr checks --help`). O `AGENTS.md` ganha uma linha com isso.

### 1.4 CI na branch: `pull_request`, não `push`

| Critério | `pull_request` | `push` em todo branch |
|---|---|---|
| O que testa | O merge do PR com a base: `GITHUB_REF` é `refs/pull/N/merge` e `GITHUB_SHA` o "Last merge commit" ([eventos](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)) | Só a ponta do branch ("Tip commit pushed to the ref", mesma fonte) |
| Contexto do PR | Tem `github.event.pull_request.title`; o título pode ser validado | Não tem; o título não pode ser validado |
| PR com conflito | Não roda: "Workflows will not run on `pull_request` activity if the pull request has a merge conflict" (mesma fonte) | Roda, mas o PR não mescla de qualquer jeito |
| Dependabot | Mesmas restrições nos dois: `GITHUB_TOKEN` só leitura e só segredos do Dependabot, para `push`, `pull_request` e afins ([Dependabot no Actions](https://docs.github.com/en/code-security/dependabot/troubleshooting-dependabot/troubleshooting-dependabot-on-github-actions)) | Idem |
| PR de fork (repositório público) | Roda com `GITHUB_TOKEN` só leitura e sem segredos; de quem contribui pela primeira vez, pode pedir aprovação do mantenedor ([eventos, forks](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)). Os PRs do Dependabot são tratados "as though they are from a forked repository" (mesma fonte) | Nunca roda no repositório base; o check obrigatório nunca chega e o PR fica parado |
| Custo | Uma rodada por atualização do PR | Uma rodada por push, com ou sem PR |

A validação não usa segredo nenhum, então as restrições de Dependabot e de fork não tiram nada dela. Recomendação: o workflow de validação dispara em `pull_request` (tipos padrão `opened`, `synchronize`, `reopened`) e em `push` só para `main`. O `push` em todo branch perde o título do PR (que a seção 2.2 precisa) e testa a ponta do branch em vez do resultado do merge; combinar os dois gatilhos para todo branch roda tudo duas vezes.

### 1.5 Merge: sem strict e sem merge queue

- **Merge queue não está disponível.** "Pull request merge queues are available in any public repository owned by an organization, or in private repositories owned by organizations using GitHub Enterprise Cloud" ([fonte da documentação do GitHub](https://github.com/github/docs/blob/main/data/reusables/gated-features/merge-queue.md)). O Minimal Me é de conta pessoal. Ela seria a resposta moderna: dá "the same benefits as the Require branches to be up to date before merging" sem obrigar o autor do PR a atualizar o branch e esperar os checks ([Managing a merge queue](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue)).
- **Strict tem custo certo para um risco raro.** No modo strict o branch "must be up to date with the base branch before merging", e "More builds may be required"; no modo solto há menos rodadas, mas os checks podem falhar depois do merge se houver mudanças incompatíveis ([About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)). A documentação do auto-merge não diz que ele atualiza o branch sozinho ([Automatically merging](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request)); o agente teria de rodar `gh pr update-branch` ([manual](https://cli.github.com/manual/gh_pr_update-branch)) e esperar outra rodada a cada PR que perde a corrida.
- **Recomendação: modo solto, com a rede na `main`.** Com um mantenedor e um app, PRs de código em paralelo que se quebram mutuamente são raros; o `pull_request` já testa o merge com a `main` do momento da rodada; e a mesma validação roda de novo no commit da `main` (seção 1.6) e segura o deploy, então uma quebra por corrida para na `main` e não chega à produção. **Gatilho para rever**: a `main` ficar vermelha uma vez por corrida, ou agentes passarem a mesclar PRs de código em paralelo como rotina. Aí liga-se o strict no ruleset e o agente aprende `gh pr update-branch`; e, se o repositório um dia for para uma organização, a merge queue.

### 1.6 Pós-merge

- **A mesma validação na `main`.** O `push` em `main` roda o mesmo workflow e o mesmo `gate`. Com squash, o commit da `main` é novo; com o modo solto, a árvore dele pode diferir da que o PR testou. O job de entrega (#50) depende do `gate` dessa rodada (`needs: gate`), então nada vai ao ar sem a validação da árvore exata que vai ao ar.
- **Medição de campo, informativa.** O Cloudflare Web Analytics, já escolhido em #12, mede LCP, INP e CLS de visitantes reais, com P75 por padrão; o CLS só em navegadores Chromium ([Core Web Vitals no Cloudflare](https://developers.cloudflare.com/web-analytics/data-metrics/core-web-vitals/), atualizado em 2026-10-13). É a medida que responde ao critério como o web.dev o define, no percentil 75 das visitas ([LCP](https://web.dev/articles/lcp)); não entra na esteira, mas é o que confirma, depois do ar, o que a esteira mediu em laboratório.

## 2. Checks obrigatórios

### 2.1 Um agregador por gatilho, com nome estável

Os fatos que decidem o desenho:

- O ruleset exige checks por nome, e os nomes de job devem ser únicos entre workflows, porque nomes repetidos "can cause ambiguous status check results" ([About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)).
- Um workflow pulado por filtro de caminho, de branch ou de mensagem deixa o check "Pending" e bloqueia o merge; um job pulado por condição `if` reporta "Success" ([Troubleshooting required status checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks)).
- Os checks precisam passar no último commit do PR: "Checks from earlier commits don't satisfy the requirement" (mesma fonte).
- O ruleset deixa escolher o app de origem do check; com a origem fixada, "If the status is set by any other person or integration, merging won't be allowed" ([Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)). O app GitHub Actions tem id `15368` (`gh api apps/github-actions`).

Daí o padrão: um job agregador que depende de todos os outros (`needs`) e roda sempre. Ele precisa de `if: always()`, porque sem isso uma falha numa dependência faz o agregador ser pulado, e pulado vira "Success"; o README do `re-actors/alls-green` descreve exatamente essa armadilha ([alls-green](https://github.com/re-actors/alls-green)). O `always()` "returns `true`, even when canceled" ([Expressions](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions)); num agregador que só lê o resultado dos outros, o risco que a documentação aponta para o `always()` (travar num passo crítico) não existe. Não precisa de action de terceiros: o `jq` já vem no runner ([imagem do runner](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md)).

```yaml
gate:
  if: always()
  needs: [quality, e2e]
  runs-on: ubuntu-24.04
  timeout-minutes: 5
  steps:
    - name: Todos os jobs terminaram em sucesso
      env:
        NEEDS: ${{ toJSON(needs) }}
      run: echo "$NEEDS" | jq -e 'all(.[]; .result == "success")'
```

Exigir `success` de todos (e não só "nenhum `failure`") fecha também o caso de um job cancelado ou pulado por engano.

**Recomendação**: dois checks obrigatórios no ruleset, com origem fixada no GitHub Actions:

- **`gate`**: o agregador do workflow de validação. O nome diz o papel e não a ferramenta, então o ruleset não muda quando os jobs mudam; a escolha não vem da frota, vem disso.
- **`pr-title`**: o check do título (seção 2.2), num workflow próprio, porque tem gatilho próprio.

Por que não um check só: o título pertence ao evento do PR, não ao commit. Para validar a edição de um título no mesmo workflow, ele teria de disparar em `edited`, e cada edição do título ou do corpo rodaria a validação inteira de novo; pular os jobs pesados nesse evento faria o `gate` passar com base numa rodada anterior, que pode ter falhado. Um segundo check barato evita as duas coisas.

### 2.2 O título do PR vira o commit da `main`

Hoje o padrão do squash é `COMMIT_OR_PR_TITLE` (seção de contexto). Segundo o GitHub, a mensagem padrão "uses the commit title and message if the pull request contains only 1 commit, or the pull request title and list of commits if the pull request contains 2 or more commits" ([Configuring commit squashing](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/configuring-commit-squashing-for-pull-requests)). Então o assunto que chega à `main` depende de quantos commits o PR tem: com um commit, vale a mensagem que só o gancho (pulável) conferiu; com dois ou mais, vale o título que ninguém conferiu. O commit de squash é criado pelo GitHub, e nenhum gancho local roda nele.

Recomendação:

- Trocar o título padrão para `PR_TITLE` ("default to the pull request's title", [REST, Update a repository](https://docs.github.com/en/rest/repos/repos#update-a-repository)): o assunto da `main` passa a ser sempre o título do PR.
- Validar o título no check `pr-title`, com a mesma configuração do commitlint do gancho. Ele dispara em `pull_request` com `types: [opened, edited, synchronize, reopened]`: o `edited` não está entre os tipos padrão e precisa ser declarado ([eventos](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)), e o `synchronize` é obrigatório porque checks de commits anteriores não valem para o commit novo (seção 2.1). O job lê o título por variável de ambiente, nunca interpolado direto no `run`, para não executar texto do título como comando (o endurecimento dos workflows é tema de #50).
- O agente não passa `--subject` no `gh pr merge`, que trocaria o assunto na hora do merge ([gh pr merge](https://cli.github.com/manual/gh_pr_merge)) e driblaria o check. Uma linha no `AGENTS.md`.
- A mensagem do corpo (`COMMIT_MESSAGES` hoje, ou `PR_BODY`) não muda a validação; fica como está.

**Dependabot.** O título do PR do Dependabot também vira o assunto da `main` e também passa pelo `pr-title`. Por padrão, as mensagens dele "follow similar patterns to those detected in the repository"; para não depender dessa detecção, `commit-message` com `prefix` e `include: scope` fixa o prefixo e acrescenta `deps` ou `deps-dev` ([Dependabot options reference](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference)). A configuração do `dependabot.yml` é de #50; o que esta pesquisa pede é só esse campo. O título do Dependabot fica em inglês: o check confere o formato, não o idioma, e essa exceção é de um robô.
