# Validação em esteira para a web em Next: estágios, checks e testes

Pesquisa do ticket [#49](https://github.com/ThiagoPanini/minimal-me/issues/49), parte do mapa [#1](https://github.com/ThiagoPanini/minimal-me/issues/1), que destrava [Esteira de validação e entrega da web (#52)](https://github.com/ThiagoPanini/minimal-me/issues/52). Data de referência: 2026-11-15. Toda versão citada é a vigente nessa data, com a fonte ao lado.

## Retomada

- **Feito**: as seis seções do ticket, a comparação com as recomendações anteriores de #17, o esboço dos workflows, a esteira recomendada, as alternativas descartadas, os exageros e as perguntas abertas. Pesquisa concluída em 2026-11-15.
- **Mudança de escopo (2026-11-15, coordenador)**: a forma da web não está fechada. A recomendação atual para o Marco 1 é `output: "export"` (o Next gera arquivos estáticos no build, servidos por nginx numa imagem de contêiner), com o servidor Node (`standalone`) só quando um space futuro pedir recursos de servidor. Onde a esteira depende da forma, esta pesquisa cobre primeiro a exportação estática e acrescenta uma nota curta sobre o que muda com `standalone`. O "Destrava" do ticket aponta agora para #52, que também pede o nome dos checks no ruleset.
- **Próximo**: nada nesta pesquisa. A decisão segue em #52, junto com a pesquisa de #50.

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
2. **CI no evento `pull_request`, e `push` só na `main`.** O `pull_request` testa o merge do PR com a `main`, traz o título do PR (que vira a mensagem do squash) e alcança PRs de fork, que o `push` nunca alcança; para o Dependabot, os dois eventos têm as mesmas restrições, e a validação não precisa de segredo.
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
| `pnpm check` | `biome ci .`, `next typegen && tsc --noEmit` e os checks do sistema de design (`node --test`) | pre-push, job `quality` da CI |
| `pnpm test:e2e` | build da exportação, imagem nginx, Playwright no contêiner oficial contra ela, Lighthouse | job `e2e` da CI |
| `pnpm verify` | `pnpm check` e depois `pnpm test:e2e` | o agente, antes de abrir ou atualizar o PR |

A checagem de tipos sem build é a que o Next documenta para CI: "`next typegen && tsc --noEmit`", porque sem o `typegen` o `tsc` não valida os tipos de rota ([next CLI](https://nextjs.org/docs/app/api-reference/cli/next), atualizado em 2026-10-15). O `next build` também roda o TypeScript ("Finished TypeScript" na saída, [Next 16](https://nextjs.org/blog/next-16)); a checagem no `pnpm check` existe para falhar em segundos, sem esperar o build.

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

Daí o padrão: um job agregador que depende de todos os outros (`needs`) e roda sempre. Ele precisa de `if: always()`: sem isso, quando uma dependência falha, o resultado do agregador é "skipped" e não "failed", como avisa o README do `re-actors/alls-green` ([alls-green](https://github.com/re-actors/alls-green)), e o GitHub trata job pulado por condição como "Success" ([Troubleshooting required status checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks)). O `always()` "returns `true`, even when canceled" ([Expressions](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions)); num agregador que só lê o resultado dos outros, o risco que a documentação aponta para o `always()` (travar num passo crítico) não existe. Não precisa de action de terceiros: o `jq` já vem no runner ([imagem do runner](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md)).

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

## 3. Camadas de teste

### 3.1 O alvo: a imagem que vai ao ar, testada no contêiner do Playwright

O Next recomenda rodar o Playwright "against your production code to more closely resemble how your application will behave" ([Next, Playwright](https://nextjs.org/docs/app/guides/testing/playwright), atualizado em 2026-10-15). Com `output: "export"`, não existe servidor do Next: o `next build` grava a pasta `out`, com um HTML por rota e um `404.html`, e quem serve é um servidor estático; o exemplo oficial de nginx usa `try_files` e `error_page 404 /404.html` ([Next, Static Exports](https://nextjs.org/docs/app/guides/static-exports), atualizado em 2026-08-09). A mesma página lista `headers`, `redirects` e `rewrites` do `next.config` entre o que a exportação não suporta. Consequência para a esteira: o status 404, o cabeçalho de cache longo dos arquivos com hash e a compressão, que são critérios de aceite, moram no `nginx.conf` e só se provam contra o nginx. Testar a pasta `out` com qualquer servidor estático deixaria esses três de fora.

Recomendação: `pnpm test:e2e` sobe dois contêineres com Docker Compose.

- **`web`**: a imagem do próprio PR, construída com o mesmo Dockerfile que #50 usa para o deploy, mas sem push.
- **`e2e`**: a imagem oficial `mcr.microsoft.com/playwright:v1.65.1-noble`, que traz os navegadores e as dependências de sistema, mas não o pacote do Playwright, que vem do `node_modules` do projeto ([Playwright, Docker](https://playwright.dev/docs/docker)). A mesma página recomenda fixar a versão da imagem, porque com versões diferentes o Playwright pode não achar os navegadores, e recomenda `--init` (processos zumbis) e `--ipc=host` (sem ele, o Chromium "can run out of memory and crash"). A imagem roda como root, o que desliga o sandbox do Chromium; a documentação aceita isso para e2e de sites confiáveis, que é o caso.

A etiqueta da imagem sai da versão instalada de `@playwright/test`, lida pelo script, e não de um número escrito à mão: quando o Dependabot sobe o pacote, a imagem sobe junto. O Playwright 1.65 passou a trazer Node 26 nas imagens ([release notes](https://playwright.dev/docs/release-notes)), a mesma linha da hipótese de #17.

### 3.2 As camadas

| Camada | O que prova (critério de #12) | Como | Bloqueia? |
|---|---|---|---|
| Conteúdo e erros | Os quatro spaces com nome, status e "Acessar"; o "Acessar" mostra o aviso; nenhum erro de console nem `pageerror` (pega erro de hidratação) | Playwright, Chromium | Sim |
| Teclado e foco | Teclado alcança nome, status e "Acessar" dos quatro spaces em 390 e 1440; foco visível; a 390px, as frestas fechadas fora da tabulação | Playwright, `keyboard.press('Tab')` e estilo computado do foco | Sim |
| Acessibilidade automática | Nenhuma violação WCAG A e AA detectável | `@axe-core/playwright` com `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` | Sim, nas violações; os "incomplete" só informam |
| Árvore de acessibilidade | O leitor de tela recebe nome, status e "Acessar" de cada space, nas duas larguras | `toMatchAriaSnapshot` em arquivos `.aria.yml` | Sim |
| Sem JavaScript | Texto e ilustrações aparecem; efeitos vivos são acréscimo | Projeto com `javaScriptEnabled: false` e opacidade computada | Sim |
| Movimento reduzido | Tudo no estado final, sem animação em curso | `reducedMotion: 'reduce'` e `document.getAnimations()` | Sim |
| 404 | Status 404, página no estilo do sistema, caminho de volta | Requisição a uma rota inexistente, contra o nginx | Sim |
| Metadados e arquivos de busca | `lang="pt-BR"`, título "Minimal Me", descrição, imagem de compartilhamento que responde 200 com tipo de imagem, favicon, `robots.txt` liberado, `sitemap.xml` com a Home | `page` e `request` do Playwright | Sim |
| Links internos | Todo `href` da mesma origem responde 200 | `request` do Playwright | Sim; links externos não entram na esteira |
| Cache dos estáticos | Arquivos com hash e cache longo; HTML sem cache longo | Cabeçalhos `Cache-Control` contra o nginx | Sim |
| Peso a 390px | Até 1 MB transferido na primeira visita | Lighthouse `total-byte-weight` com tela de 390px | Sim |
| LCP em 4G | LCP de até 2,5 s | Lighthouse, Slow 4G simulado, mediana de 5 rodadas | Informa, até provar estabilidade |
| Regressão visual | A Home e a 404 não mudam sem querer, em 390 e 1440 | `toHaveScreenshot` em Chromium, no contêiner | Sim |
| WebKit | A página funciona no motor do Safari a 390px | Projeto WebKit com o descritor `iPhone 13`: conteúdo, aviso, sem JavaScript | Sim |
| Prévias do sistema de design | Seção 5 | Playwright | Sim |

Os pontos que cada camada precisa acertar:

**Acessibilidade.** O axe "returns zero false positives (bugs notwithstanding)" e acha "on average 57% of WCAG issues automatically" ([axe-core](https://github.com/dequelabs/axe-core)); zero falso positivo é o que permite bloquear, e 57% é o que obriga a completar. O Playwright recomenda combinar teste automático, avaliação manual e teste com pessoas ([Accessibility testing](https://playwright.dev/docs/accessibility-testing)). As etiquetas `wcag2a` a `wcag22aa` estão na [API do axe](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md); o exemplo do Playwright para em `wcag21aa`, e a Home pede também a 2.2. Um limite importa para a Home: quando o texto está sobre uma imagem de fundo, o axe não decide o contraste e devolve "incomplete", com a mensagem "Element's background color could not be determined due to a background image" ([fonte do axe](https://github.com/dequelabs/axe-core/blob/develop/lib/checks/color/color-contrast.json)). O critério "4,5:1 no pior ponto atrás do texto" fica, então, fora do alcance do axe; a regressão visual impede que ele piore sem aviso depois de conferido, e a conferência inicial é da implementação da Home (pergunta aberta 5). Para a árvore, o `toMatchAriaSnapshot` compara a estrutura acessível com um modelo YAML, aceita correspondência parcial e expressões regulares, e guarda o modelo em arquivo `.aria.yml` ([ARIA snapshots](https://playwright.dev/docs/aria-snapshots)). No 1.65, texto que o navegador não renderiza deixou de entrar nos nomes acessíveis ([release notes](https://playwright.dev/docs/release-notes)), então a árvore testada é a que o Visitante recebe.

**Sem JavaScript.** O Playwright considera visível um elemento com `opacity:0` ("Elements with `opacity:0` **are** considered visible", [Actionability](https://playwright.dev/docs/actionability)). Uma revelação ao rolar que começa em opacidade zero e depende de JavaScript para aparecer passaria num `toBeVisible`. O teste sem JavaScript confere a opacidade computada do texto e das ilustrações, ou tira uma captura da página sem JavaScript, que pega o mesmo defeito.

**Movimento reduzido.** O sistema manda que, "com movimento reduzido, tudo aparece no estado final, sem animação, sem profundidade e sem rolagem suave" ([`docs/design/system/README.md`](../design/system/README.md), "Movimento"), e #12 diz que o movimento das ilustrações para com movimento reduzido. O teste emula `reducedMotion: 'reduce'` ([Emulation](https://playwright.dev/docs/emulation)) e espera nenhuma animação em curso em `document.getAnimations()`. Laços de `canvas` não aparecem nessa lista; a implementação expõe um atributo de estado nos efeitos vivos para o teste ler.

**Peso e LCP com Lighthouse.** Três fatos das fontes moldam a configuração:

- O padrão móvel do Lighthouse emula 412 por 823 pixels com fator 1,75 ([constants.js](https://github.com/GoogleChrome/lighthouse/blob/main/core/config/constants.js)); para o critério de 390px, a configuração define `screenEmulation` com largura 390. O fator de escala muda quais variantes de imagem o navegador baixa e, portanto, o peso: os descritores `iPhone 12`, `iPhone 13` e `iPhone 14` do Playwright usam 390 de largura com fator 3 ([deviceDescriptorsSource.json](https://github.com/microsoft/playwright/blob/main/packages/isomorphic/deviceDescriptorsSource.json)). Qual fator vale para o orçamento é decisão do Autor (pergunta aberta 3).
- O `total-byte-weight` soma o `transferSize` de cada requisição, ou seja, bytes trafegados e não descomprimidos ([total-byte-weight.js](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/byte-efficiency/total-byte-weight.js)). Para uma build fixa e uma tela fixa, o número é determinístico: bloqueia. A Cloudflare mantém a compressão da origem quando o navegador a aceita e, no plano Free, usa Zstandard quando ela mesma comprime ([Cloudflare, Compression](https://developers.cloudflare.com/speed/optimization/content/compression/), atualizado em 2026-04-17); então o peso medido contra o nginx com compressão ligada é uma boa aproximação do que o Visitante recebe. Sem compressão no nginx, o teste superestima texto e CSS, nunca subestima.
- Os orçamentos (`budget.json`) saíram do Lighthouse 12.0.0 ("remove budgets", [changelog](https://github.com/GoogleChrome/lighthouse/blob/main/changelog.md)); no Lighthouse CI, o caminho é `assert.assertions` com `maxNumericValue` e nível `error` ou `warn`, e não o `budgetsFile` ([LHCI, configuração](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md)). O preset `lighthouse:recommended` exige nota perfeita em toda auditoria fora de desempenho (mesma fonte); é mais do que os critérios pedem e fica de fora.

O LCP é estatístico. O padrão do Lighthouse simula Slow 4G (150 ms de RTT, 1,6 Mbps de descida, CPU 4x mais lenta), e a simulação é o modo que dá "both quick evaluation and minimized variance" ([throttling](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md)). Mesmo assim, "Free CI environments and burstable instances are typically quite volatile", e "The median Lighthouse score of 5 runs is twice as stable as 1 run" ([variability](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md)). Recomendação: `numberOfRuns: 5`, `aggregationMethod: "median"` e `largest-contentful-paint` com `maxNumericValue: 2500` em nível `warn`. **Critério para promover a `error`**: depois de umas vinte rodadas na CI, se a dispersão do LCP medido ficar pequena diante da folga até 2,5 s. O Lighthouse CI aceita `chromePath` ([configuração](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md)), então ele roda dentro do mesmo contêiner do Playwright, com o Chromium dele, e local e CI medem com o mesmo navegador.

**Regressão visual.** O que torna as capturas estáveis aqui:

- **Ambiente fixo**: sempre o contêiner do Playwright na versão do pacote, local e CI (seção 3.1). Os nomes das capturas levam navegador e plataforma (`chromium-linux`) ([Visual comparisons](https://playwright.dev/docs/test-snapshots)), e a plataforma é a mesma nos dois lugares.
- **Animação**: o padrão do `toHaveScreenshot` já é `animations: "disabled"`, que leva animações finitas ao fim e volta as infinitas ao início; o cursor de texto fica oculto (`caret: "hide"`); e a asserção espera "until two consecutive page screenshots yield the same result" ([PageAssertions](https://playwright.dev/docs/api/class-pageassertions)). Somado a `reducedMotion: 'reduce'`, que pelo próprio sistema põe tudo no estado final, a captura sai do estado de repouso que o sistema define, e não de um quadro qualquer de uma animação. O `canvas` dos efeitos vivos para pelo mesmo motivo. Se algo ainda variar, o `stylePath` aplica uma folha de estilo só na captura para esconder o que for volátil (mesma fonte).
- **Fontes**: o Playwright espera `document.fonts.ready` antes de capturar ([screenshotter.ts](https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/screenshotter.ts)), e as fontes são servidas pela própria aplicação (recomendação 3 de #17), sem rede de terceiros.
- **Escopo pequeno**: Chromium só, página inteira, Home e 404, em 390 e 1440, mais um estado de foco num space. Umas seis imagens. Tolerância padrão (`threshold` 0,2 e sem `maxDiffPixels`) até aparecer evidência de ruído.
- **Formato PNG**: o Playwright 1.62 passou a aceitar WebP ([release notes](https://playwright.dev/docs/release-notes)), mas o diff de imagem do GitHub, com os modos 2-up, swipe e onion skin, lista PNG, JPG, GIF, PSD e SVG ([GitHub, non-code files](https://docs.github.com/en/repositories/working-with-files/using-files/working-with-non-code-files)). PNG mantém a revisão visual dentro do PR.
- **Atualização de referência**: `--update-snapshots=changed` atualiza só o que não bateu e cria o que falta; no modo padrão, uma captura que falta é criada mas o teste falha, "so that the run does not silently pass in CI" ([TestConfig](https://playwright.dev/docs/api/class-testconfig)). O agente só atualiza referências quando a mudança visual é o objetivo do PR e diz isso no corpo do PR.

Uma limitação do contexto: os agentes abrem PRs com a conta do Autor, e "Pull request authors cannot approve their own pull requests" ([GitHub](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/approving-a-pull-request-with-required-reviews)). Então nenhuma aprovação obrigatória consegue segurar uma referência visual nova; o controle possível é tornar a mudança visível (o diff de imagem no PR e uma seção no corpo). Se o Autor quiser olhar toda mudança visual antes do merge, os agentes precisam de outra identidade (pergunta aberta 4).

**Motores.** Chromium roda tudo. WebKit roda um subconjunto a 390px com o descritor `iPhone 13` (o descritor já usa WebKit, [deviceDescriptorsSource.json](https://github.com/microsoft/playwright/blob/main/packages/isomorphic/deviceDescriptorsSource.json)): conteúdo, aviso, ausência de erros e página sem JavaScript, porque o Safari é o motor dos iPhones de 390px e a Home usa CSS recente (`@property`, `color-mix`, `subgrid`, `mask-composite`, presentes em [`FrontCard/preview.html`](../design/system/components/FrontCard/preview.html)). Teclado e capturas ficam só no Chromium, para não dobrar referências nem depender de diferenças de navegação por Tab entre motores. Firefox fica de fora.

**Instabilidade.** `forbidOnly` na CI, `retries: 1` e `failOnFlakyTests: true`: a segunda tentativa existe só para o relatório separar falha estável de teste instável, e um teste instável ainda reprova a rodada ([TestConfig](https://playwright.dev/docs/api/class-testconfig)). Trace e capturas guardados só nas falhas, como artefato da rodada. `workers: 1` na CI, como o Playwright recomenda "to prioritize stability and reproducibility" ([Playwright, CI](https://playwright.dev/docs/ci)).

### 3.3 O que é estável o bastante para bloquear

- **Bloqueia** o que é determinístico para uma build fixa num ambiente fixo: DOM, árvore ARIA, violações do axe, status e cabeçalhos HTTP, bytes transferidos e pixels capturados no contêiner fixado.
- **Informa** o que é estatístico num runner compartilhado: o LCP de laboratório, até a evidência pedir a promoção.
- **Fica fora da esteira** o que depende de terceiros: links externos (o servidor do outro lado cai ou limita a taxa) e a medição de campo, que mora no Cloudflare Web Analytics.

### 3.4 Nota: o que muda com `standalone`

- **Alvo**: a imagem passa a rodar o `server.js` do Node; o resto da camada não muda, porque o teste já mira a imagem e não a forma. O Next define `Cache-Control: public, max-age=31536000, immutable` para os arquivos imutáveis com hash, sem permitir sobrescrita ([Next, Self-hosting](https://nextjs.org/docs/app/guides/self-hosting), atualizado em 2026-10-15); o teste de cache continua valendo, agora contra o Next.
- **Imagens**: a otimização do `next/image` funciona sem configuração com o servidor (mesma fonte); na exportação, só com um loader próprio ([Static Exports](https://nextjs.org/docs/app/guides/static-exports)). Nos dois casos, é o teste de peso a 390px que prova que as ilustrações chegam em tamanhos responsivos.
- **A Home continua estática**: no Next 16.4, `export const ensureStatic = 'navigation'` no layout raiz faz o build falhar se algum conteúdo dinâmico entrar na página ([Next 16.4](https://nextjs.org/blog/next-16-4)). Com `standalone`, essa linha transforma o build num check. Com a exportação, a guarda já existe: usar um recurso que precisa de servidor dá erro, "similar to setting the `dynamic` option to `error` in the root layout" ([Static Exports](https://nextjs.org/docs/app/guides/static-exports)).
- **Health check e o que o Coolify consulta**: #50.

## 4. Velocidade

O alvo é um tempo de parede de poucos minutos por PR (hipótese, a medir nas primeiras rodadas), sem nada que precise de manutenção própria. Os minutos não custam: o runner padrão é "free and unlimited on public repositories", com 4 CPUs e 16 GB no repositório público ([GitHub-hosted runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)). O que custa é a espera do agente pelo auto-merge.

### 4.1 Caches

| O quê | Como | Fonte |
|---|---|---|
| Store do pnpm | `pnpm/setup@v3` com `cache: true`. A action é do próprio pnpm e é o exemplo atual da documentação de CI dele: instala o pnpm na versão de `packageManager` ou `devEngines.packageManager`, instala o Node de `devEngines.runtime`, roda `pnpm install` e guarda o store. O pnpm entra sozinho em modo `frozen-lockfile` na CI. | [pnpm, CI](https://pnpm.io/continuous-integration); [pnpm/setup](https://github.com/pnpm/setup), v3.2.0 em 2026-11-12 |
| Build do Next | `actions/cache@v6` em `apps/web/.next/cache`, com chave pelo lockfile e pelos fontes e `restore-keys` pelo lockfile. Desde o 16.3, o Turbopack grava um cache persistente do `next build`, ligado por padrão, e "The cache lives in `.next/cache`, so CI builds only get faster if that directory is restored between runs". | [Turbopack no 16.3](https://nextjs.org/blog/next-16-3-turbopack); [Next, CI Build Caching](https://nextjs.org/docs/app/guides/ci-build-caching); [actions/cache](https://github.com/actions/cache) |
| Navegadores do Playwright | Nenhum cache: vêm dentro da imagem do Playwright. O próprio Playwright diz que guardar os binários "is not recommended", porque restaurar leva quase o mesmo tempo que baixar e as dependências de sistema não se guardam. | [Playwright, CI](https://playwright.dev/docs/ci) |

Dois detalhes de comportamento: o `actions/cache` só cria um cache novo quando a chave exata não existe e o job termina bem, e o `restore-keys` restaura por prefixo; o limite é de 10 GB por repositório, com despejo do que fica uma semana sem acesso ([actions/cache](https://github.com/actions/cache); [billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)). Cada job roda numa máquina virtual nova ([GitHub-hosted runners](https://docs.github.com/en/actions/concepts/runners/github-hosted-runners)), então a imagem do Playwright é baixada a cada rodada; é o custo fixo do ambiente fixo.

### 4.2 Paralelismo e sharding

- **Dois jobs em paralelo, mais o agregador.** `quality` (`pnpm check`: Biome, tipos, checks do sistema de design; sem navegador) e `e2e` (build, imagem, Playwright, Lighthouse). O `gate` espera os dois. O Lighthouse roda no mesmo job do e2e, depois do Playwright, porque usa a mesma imagem já de pé; separar só vale se o job crescer.
- **Sem sharding.** O GitHub Actions suporta dividir a suíte entre jobs ([Playwright, CI](https://playwright.dev/docs/ci)), mas uma página com algumas dezenas de testes pagaria a partida de cada job e a junção dos relatórios sem ganho. **Gatilho para rever**: a suíte passar de uns cinco minutos.
- **`workers: 1` na CI**, como o Playwright recomenda (seção 3.2). Se a suíte crescer, testar `2` olhando a instabilidade, já que o runner público tem 4 CPUs.

### 4.3 Rodar só o que mudou

Filtro de caminho no workflow deixa o check obrigatório "Pending" e trava o merge ([Troubleshooting required status checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks)); pular jobs por `if` exige que o `gate` aceite `skipped`, o que reabre a armadilha da seção 2.1. E neste repositório "só documentação" não é inerte: a aplicação lê fontes e tokens de `docs/design/system/` (recomendação 3 de #17). Recomendação: **rodar tudo sempre** no começo. Ferramentas de "afetados" de monorepo (Turborepo, Nx) não têm o que escolher num repositório com um app. **Gatilho para rever**: se PRs só de `docs/research/` ou `docs/adr/` dominarem e a espera incomodar, um job `changes` decide se o `e2e` roda, olhando `apps/**`, `docs/design/system/**`, o lockfile e `.github/**`, e o `gate` passa a aceitar `skipped` só para o `e2e` e só quando `changes` disse que nada disso mudou.

### 4.4 Concurrency e cancelamento

- **Nos PRs**: `concurrency` com `group: ${{ github.workflow }}-${{ github.ref }}` e `cancel-in-progress: true`, o exemplo da documentação ([Control workflow concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)). No `pull_request`, o `github.ref` é o `refs/pull/N/merge` de cada PR, então um push novo cancela a rodada velha do mesmo PR e só dele.
- **Na `main`**: `cancel-in-progress` falso, por expressão (a documentação aceita expressão no campo). Por padrão, cada grupo tem no máximo uma rodada em execução e uma pendente, e uma pendente nova substitui a antiga; existe `queue: max` para manter até 100 pendentes, incompatível com `cancel-in-progress: true` (mesma fonte). Para a validação, perder a rodada pendente de um commit intermediário da `main` é aceitável: o commit mais novo é validado e entregue. A fila da entrega é de #50.
- **`timeout-minutes`** em todo job: o padrão é 360 minutos ([workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)); 15 no `e2e` e 5 nos outros fazem um job travado falhar logo.

## 5. Checks do sistema de design

Os três checks de #17 (recomendação 10) mais o de caminhos (insumo do retro de 2026-11-15 em #17). Os quatro rodam no Node, sem dependência nova: o `node:test` é estável, e o `node --test` já encontra arquivos `*.test.ts` ([Node, test runner](https://nodejs.org/api/test.html)), porque a remoção de tipos está ligada por padrão desde a 23.6.0 e a 22.18.0 e é estável desde a 25.2.0 e a 24.12.0 ([Node, TypeScript](https://nodejs.org/api/typescript.html)).

### 5.1 `tokens.json` válido e com nomes em minúsculas

- **Válido**: `JSON.parse` no teste; o Biome também analisa JSON no `biome ci` (a receita de ganchos dele inclui `json` no `glob`, [Biome, Git Hooks](https://biomejs.dev/recipes/git-hooks/)).
- **Nomes em minúsculas**: o teste olha só os nomes de token, e não todo campo `name`. Em 2026-11-15, o arquivo tem 44 campos `name`, dos quais quatro são nomes de exibição ("Minimal Me", o tema "Escuro" e os grupos "Jost" e "IBM Plex Mono"); os 40 nomes de token (`color`, `spacing`, `radius`, `easing` e os estilos de `type.groups`) seguem todos `^[a-z0-9]+(-[a-z0-9]+)*$` (conferido com um script sobre [`tokens.json`](../design/system/tokens.json)). A mesma passada pode recusar nome repetido, que viraria duas variáveis CSS com o mesmo nome.

### 5.2 Toda `var(--x)` das prévias existe nos tokens

A regra literal falharia hoje sem haver defeito. Conferido em 2026-11-15 sobre `docs/design/system/components/*/preview.html`:

- As prévias declaram propriedades locais de layout: `--g` em `Footer`, `Masthead` e `FrontCard`; `--cl`, `--co`, `--on`, `--pe` e `--pw` em `FrontCard` (esta com `@property --pw`). Não são tokens.
- `--font-sans` e `--font-mono` correspondem às famílias `sans` e `mono` de `type.families`, como a tabela "Nomes" de [`docs/design/README.md`](../design/README.md) registra.

Com essas duas regras, nenhuma referência fica sem token hoje. O check, então: toda `var(--x)` usada numa prévia é um nome de token, ou `font-<família>` de `type.families`, ou uma propriedade declarada na própria prévia. Vale acrescentar que uma declaração local não pode ter nome de token, para que uma prévia não esconda um token com um valor próprio.

### 5.3 As prévias renderizam sem erro

Um projeto do Playwright abre cada `preview.html` e falha em `pageerror` ou erro de console. As prévias pedem imagens por `/_blob/<id>`, que só existem no Claude Design ([`docs/design/README.md`](../design/README.md)); o teste responde a essas requisições com `page.route` em vez de deixá-las falhar, para que a falta das imagens não vire ruído. Roda no job `e2e`, porque precisa de navegador. Capturas das prévias seriam exagero: a fonte visual da verdade é o artefato do Claude Design, e a regressão visual que importa é a da Home.

### 5.4 Caminhos citados existem

Todo caminho `docs/...` citado em Markdown existe, menos a seção "Linhagem" de `docs/design/README.md`, que cita pastas apagadas recuperáveis por commit (insumo do retro em #17). Um verificador de links como o lychee não serve: ele procura "broken hyperlinks and mail addresses", e só olha blocos de código com `--include-verbatim` ([lychee](https://github.com/lycheeverse/lychee)); essas referências são caminhos escritos em trecho de código, não links. Um teste de poucas linhas com `existsSync` faz o trabalho e conhece a exceção.

### 5.5 Onde ficam

`pnpm check` roda 5.1, 5.2 e 5.4 (segundos, no pre-push e no job `quality`); o `e2e` roda 5.3. Os quatro bloqueiam: são determinísticos e protegem a fonte que a implementação lê.

Fora do pedido, um ponto para #40 e #52: se as variáveis CSS da aplicação forem geradas de `tokens.json` no build, não há como divergirem e nenhum check de deriva é necessário; se forem escritas à mão, falta um quinto check comparando as duas.

## Comparação com as recomendações anteriores de #17

O #52 guarda os itens 4, 5, 6 e 10 do corpo de #17 só como referência. Julgados pelo mérito:

| Item de #17 | O que esta pesquisa conclui | Motivo |
|---|---|---|
| 4. CI em `push`, nunca em `pull_request` | **Muda**: `pull_request` nos PRs e `push` só na `main` | Sem `pull_request` não há título do PR para validar, o teste é da ponta do branch e não do merge, e PR de fork nunca recebe o check (seção 1.4) |
| 5. Check obrigatório `gate`, com CI local | **Fica**, por mérito, e ganha o `pr-title` | O nome descreve o papel e sobrevive à troca de jobs; o título precisa de check próprio (seções 2.1 e 2.2) |
| 6. Ganchos só com gitleaks e commitlint | **Muda**: Biome no pre-commit e `pnpm check` no pre-push, além do commitlint; o gitleaks fica com #50 | O argumento da régua de Python não vale para a Home, como o próprio #17 anotou; ganchos de segundos poupam rodadas de CI sem tirar da CI a autoridade (seção 1.1) |
| 10. Primeiros checks | **Fica**, com dois ajustes no check de `var(--x)` e o check de caminhos | As propriedades locais das prévias e o `--font-*` fariam a regra literal falhar sem defeito (seção 5.2) |

## Esboço dos workflows

Só a forma: gatilhos, nomes e grafo de jobs. A fixação de actions por SHA, as permissões e o endurecimento são de #50.

```yaml
# .github/workflows/ci.yml
name: ci
on:
  pull_request:
  push:
    branches: [main]
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
jobs:
  quality:   # pnpm/setup (cache) e pnpm check
  e2e:       # pnpm/setup (cache), cache de apps/web/.next/cache, pnpm test:e2e,
             # relatório do Playwright e do Lighthouse como artefato nas falhas
  gate:      # if: always(); needs: [quality, e2e]; jq exige "success" de todos
```

```yaml
# .github/workflows/pr-title.yml
name: pr-title
on:
  pull_request:
    types: [opened, edited, synchronize, reopened]
jobs:
  pr-title:  # commitlint no título, lido de env: PR_TITLE: ${{ github.event.pull_request.title }}
```

## Esteira recomendada

| Estágio | Check | Bloqueia ou informa | Ferramenta | Por quê |
|---|---|---|---|---|
| Gancho `pre-commit` | Formatação e lint dos arquivos em stage, com correção automática | Bloqueia o commit local; pulável com `--no-verify` | lefthook 2 e Biome 2.6 | Feedback em segundos; a CI repete (seção 1.2) |
| Gancho `commit-msg` | Conventional Commits | Bloqueia o commit local; pulável | lefthook e commitlint (`config-conventional`) | Mesma regra do `pr-title`, aplicada mais cedo |
| Gancho `pre-push` | `pnpm check` | Bloqueia o push local; pulável | lefthook | Evita uma rodada perdida da CI; sem navegador, segundos |
| Agente, antes do PR | `pnpm verify` | Instrução no `AGENTS.md` | pnpm e Docker | Mesmo comando e mesmo ambiente da CI (seção 1.3) |
| CI no PR, job `quality` | `biome ci`, tipos, `tokens.json`, `var(--x)` das prévias, caminhos citados | Bloqueia, via `gate` | Biome, TypeScript, `node --test` | Determinístico e rápido (seção 5) |
| CI no PR, job `e2e` | Conteúdo e erros de console, teclado e foco, axe (WCAG A e AA até 2.2), árvore ARIA, sem JavaScript, movimento reduzido, 404, metadados, `robots` e sitemap, links internos, cache dos estáticos, subconjunto em WebKit, prévias do sistema | Bloqueia, via `gate` | Playwright 1.65 no contêiner oficial, contra a imagem nginx do PR; `@axe-core/playwright` 4.14 | Testa o artefato que vai ao ar, num ambiente fixo (seções 3.1 e 3.2) |
| CI no PR, job `e2e` | Regressão visual da Home e da 404 em 390 e 1440 | Bloqueia, via `gate` | `toHaveScreenshot` em Chromium, PNG | Estável com contêiner fixo, movimento reduzido e fontes locais; o diff aparece no PR |
| CI no PR, job `e2e` | Até 1 MB transferido a 390px | Bloqueia, via `gate` | Lighthouse CI 0.16, `total-byte-weight` com tela de 390px | Determinístico para uma build fixa |
| CI no PR, job `e2e` | LCP de até 2,5 s em Slow 4G simulado | Informa (`warn`), até a evidência pedir `error` | Lighthouse CI, mediana de 5 rodadas | Estatístico num runner compartilhado |
| CI no PR | `gate`: todos os jobs em sucesso | **Bloqueia: check obrigatório** | Job agregador com `if: always()` e `jq` | Um nome estável no ruleset; fecha a armadilha do job pulado |
| CI no PR | `pr-title`: título em Conventional Commits | **Bloqueia: check obrigatório** | commitlint, em workflow próprio | O título vira o commit da `main` (seção 2.2) |
| Merge | Auto-merge com squash, modo solto, sem merge queue | Espera os dois checks | `gh pr merge --auto --squash` | Merge queue indisponível em conta pessoal; strict custa uma rodada por corrida (seção 1.5) |
| Pós-merge | A mesma validação no commit da `main`; a entrega espera o `gate` dela | Bloqueia a entrega | O mesmo `ci.yml` | Valida a árvore exata que vai ao ar (seção 1.6) |
| Pós-deploy | LCP, INP e CLS de visitantes reais, P75 | Informa | Cloudflare Web Analytics | Mede o critério como o web.dev o define, no campo |
| Repositório | `squash_merge_commit_title` em `PR_TITLE`; ruleset com `gate` e `pr-title`, origem fixada no GitHub Actions (`integration_id` 15368) | Configuração | API do GitHub | O que chega à `main` passa pelo `pr-title`; nenhum status de outra origem satisfaz o check |

## Alternativas descartadas

- **CI em `push` em todo branch**: sem título do PR para validar, testa a ponta do branch e não o merge, e PR de fork nunca recebe o check (seção 1.4).
- **`push` e `pull_request` para todo branch**: roda tudo duas vezes por atualização.
- **Merge queue**: só existe em repositório de organização (seção 1.5). Volta à mesa se o repositório mudar de dono.
- **Modo strict**: uma atualização e uma rodada a mais por PR que perde a corrida, para um risco raro que a validação da `main` já segura antes da produção (seção 1.5).
- **Um check obrigatório por job**: o ruleset muda sempre que um job muda, e nomes repetidos entre workflows dão resultado ambíguo (seção 2.1).
- **Um check só, com o título dentro**: ou toda edição do PR roda a validação inteira, ou o `gate` passa com base numa rodada anterior que pode ter falhado (seção 2.1).
- **`re-actors/alls-green`**: uma dependência de terceiros para o que uma linha de `jq` faz; a página do projeto não mostra releases.
- **Título padrão `COMMIT_OR_PR_TITLE`**: o que chega à `main` depende do número de commits, e no caso de um commit só foi conferido apenas pelo gancho pulável (seção 2.2).
- **Ganchos só com gitleaks e commitlint**: o argumento era a régua de Python, que não vale para a Home; ganchos de segundos poupam rodadas sem tirar a autoridade da CI.
- **Ganchos do agente** (os hooks do Claude Code, por exemplo) **em vez de ganchos do Git**: duplicariam configuração entre Claude Code e Codex, armadilha do brief.
- **husky com lint-staged**: dois pacotes para o que o lefthook faz sozinho com `glob`, `{staged_files}` e `stage_fixed`.
- **e2e contra a pasta `out` com um servidor estático qualquer**: deixa de fora o 404, o cache e a compressão, que moram no `nginx.conf` (seção 3.1). `next start` não se aplica à exportação.
- **Playwright direto no runner, sem contêiner**: local e CI renderizariam em ambientes diferentes, e o Playwright pede o mesmo ambiente para as referências (seção 1.3).
- **Serviços de regressão visual** (Chromatic, Percy, Argos): guardam referência e aprovação fora do repositório, e a aprovação seria do mesmo Autor que já vê o diff de imagem no PR.
- **Capturas em WebP**: o diff de imagem do GitHub não lista WebP (seção 3.2).
- **`budgetsFile` e o preset `lighthouse:recommended`**: os orçamentos saíram do Lighthouse 12, e o preset exige nota perfeita em tudo fora de desempenho, além do que os critérios pedem (seção 3.2).
- **LCP bloqueando desde o primeiro dia**: o runner compartilhado é volátil, segundo o próprio Lighthouse (seção 3.2).
- **LCP medido no Playwright com limitação de rede própria**: reimplementa o Lighthouse com mais variância; a limitação por requisição "is not a sufficient model of a slow connection" ([throttling](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md)).
- **Peso medido no Playwright com `request.sizes()`**: funciona (`responseBodySize` é o tamanho codificado, [Request](https://playwright.dev/docs/api/class-request)), mas duplica o número que o Lighthouse já mede na mesma rodada.
- **Verificador de links externos na esteira**: depende de servidores de terceiros; e, para os caminhos de `docs/`, o lychee não serve (seção 5.4).
- **Firefox no `gate`**: ganho marginal pequeno; o WebKit já cobre o motor do Safari.
- **Filtros de caminho, Turborepo e Nx**: travam o check obrigatório ou não têm o que escolher num app só (seção 4.3).
- **Sharding**: custo de partida e de junção de relatório sem ganho numa suíte pequena (seção 4.2).

## Exageros para este contexto

Um mantenedor, um app, repositório público, uma página sem lógica:

- Merge queue, modo strict e regras de aprovação ou `CODEOWNERS`: os agentes abrem PR com a conta do Autor, que não pode aprovar o próprio PR.
- Sharding, runners maiores, runners próprios e matriz de sistemas operacionais.
- Turborepo, Nx e filtros de "afetados".
- Teste unitário ou de componente da Home (Vitest, Storybook, testes de componente do Playwright): todo critério de aceite é observável no navegador; os únicos testes de unidade são os dos checks do sistema de design.
- Limite de cobertura e teste de mutação.
- Serviço externo de regressão visual e capturas das prévias do sistema de design.
- Servidor do Lighthouse CI com histórico, PageSpeed Insights na esteira e Lighthouse em toda variação da página.
- Verificação de links externos a cada PR.
- Robôs de PR (tamanho, rótulos automáticos, Danger).
- Ganchos pesados: build, e2e ou Lighthouse no Git local.

## Perguntas abertas para o Autor

1. **O título do PR passa a ser sempre o commit da `main`?** Recomendação: sim, `squash_merge_commit_title` em `PR_TITLE`, com o check `pr-title`. Impacto: o histórico da `main` fica sempre em Conventional Commits, conferido pela CI e não só pelo gancho; os agentes já escrevem títulos assim.
2. **A esteira aceita o modo solto (sem strict)?** Recomendação: sim, com os gatilhos de revisão da seção 1.5. Impacto: nenhum agente fica preso atualizando branch; o risco que sobra é a `main` ficar vermelha numa corrida rara, sem chegar à produção, porque a entrega espera o `gate` da `main`.
3. **Como se mede o "até 1 MB a 390px"?** Recomendação: fator de escala 3 (o dos descritores `iPhone 12` a `iPhone 14`, que usam 390 de largura) e "primeira visita" como a carga sem rolar a página. Impacto: as ilustrações precisam de variantes responsivas e de carga preguiçosa abaixo da dobra; se o orçamento não couber com fator 3, o que se revê é o critério, não o teste.
4. **Mudança visual exige o olho do Autor antes do merge?** Recomendação: não por enquanto; o diff de imagem fica no PR, o corpo do PR diz por que a referência mudou, e o Autor olha quando quiser. Impacto: um agente pode atualizar uma referência visual e mesclar sozinho. Se o Autor quiser uma trava, os agentes precisam abrir PRs com outra identidade (um GitHub App, por exemplo), para que a aprovação dele possa ser obrigatória; isso é decisão de identidade, não de esteira.
5. **Como se confere o contraste "no pior ponto" do texto sobre as ilustrações?** Recomendação: conferência manual uma vez, registrada no PR da Home, e a regressão visual guarda o resultado depois. Impacto: nenhum código próprio de análise de pixels para manter; uma mudança que mexa no contraste aparece como diff visual. A alternativa automática (capturar a região atrás do texto e calcular o menor contraste) só vale se a implementação da Home já precisar desse cálculo.
6. **O LCP trava o merge desde o primeiro dia?** Recomendação: não; nível `warn`, com promoção a `error` quando umas vinte rodadas mostrarem dispersão pequena diante da folga até 2,5 s. Impacto: um PR pode piorar o LCP sem travar, mas o relatório mostra; o teste de peso, que bloqueia, pega a causa mais provável de piora numa página de ilustrações.
