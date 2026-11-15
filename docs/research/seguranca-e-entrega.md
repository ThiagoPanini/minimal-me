# Segurança da cadeia e entrega contínua da web em Next

Pesquisa do ticket [#50](https://github.com/ThiagoPanini/minimal-me/issues/50), parte do mapa [#1](https://github.com/ThiagoPanini/minimal-me/issues/1), que alimenta a decisão de [Esteira de validação e entrega da web](https://github.com/ThiagoPanini/minimal-me/issues/52). A validação de qualidade e os testes ficam no ticket irmão [#49](https://github.com/ThiagoPanini/minimal-me/issues/49); aqui eles só aparecem onde tocam a segurança ou a entrega. Consultei a documentação e o changelog do GitHub (Actions, Dependabot, CodeQL, secret scanning, rulesets, environments, atestados, GHCR), o banco de advisories do GitHub pela API, o código-fonte do Coolify na versão da VPS, a documentação do Next.js, do Renovate, do pnpm, do OpenSSF, do Sigstore, do Docker e das imagens do nginx, e o catálogo KEV da CISA.

## Retomada

- **Estado**: em andamento.
- **Mudança de escopo (2026-11-15)**: a forma da web deixou de ser dada. A recomendação atual para o Marco 1 é `output: "export"`, com os arquivos estáticos servidos por um nginx sem privilégio, numa imagem pública no GHCR, com 64 MiB e 0,25 vCPU. O servidor Node do Next (`standalone`, 384 MiB e 0,5 vCPU) só vem quando um space futuro pedir recursos de servidor. Onde a recomendação depende da forma, esta pesquisa cobre primeiro a exportação estática e acrescenta uma nota curta sobre o que muda com `standalone`.
- **Coberto**: seção 0 (estado do repositório e superfície de ataque de cada forma).
- **Próximo**: seções 1 a 6 na ordem do ticket, depois a recomendação, as alternativas descartadas, os exageros e as perguntas ao Autor.
- **Data**: 2026-11-15.

Convenções: o que não vem de fonte está marcado como **inferência**. Datas de documentos são as que a página mostra; quando a página não mostra data, cito a data da leitura (2026-11-15).

## 0. Ponto de partida

### Estado do repositório, lido pela API em 2026-11-15

Fontes: `gh api repos/ThiagoPanini/minimal-me` e os endpoints `actions/permissions`, `actions/permissions/workflow`, `rulesets`, `environments`, `code-scanning/default-setup`, `private-vulnerability-reporting`, `vulnerability-alerts` e `automated-security-fixes` do mesmo repositório.

- Repositório público, de conta pessoal (`owner.type: User`). Merge só por squash, com auto-merge permitido (`allow_auto_merge: true`) e branch apagado depois do merge.
- `security_and_analysis`: secret scanning e push protection ligados; padrões sem provedor (`secret_scanning_non_provider_patterns`) e checagem de validade (`secret_scanning_validity_checks`) desligados; atualizações de segurança do Dependabot ligadas. Os alertas do Dependabot estão ligados (o endpoint `vulnerability-alerts` responde 204) e as correções automáticas também (`enabled: true, paused: false`).
- Relato privado de vulnerabilidade: desligado.
- Actions: token padrão só de leitura (`default_workflow_permissions: read`), workflows não aprovam PRs (`can_approve_pull_request_reviews: false`), qualquer action permitida (`allowed_actions: all`) e fixação por SHA não exigida (`sha_pinning_required: false`).
- Ruleset `panlabs`, ativo no branch padrão: proíbe exclusão e force-push, exige histórico linear, commits assinados e PR com zero aprovações e merge por squash. Não há check obrigatório nem ator com bypass.
- Nenhum `environment`. Code scanning sem configuração (`state: not-configured`).

### A forma da web decide a urgência de um patch do Next

O repositório do Next.js publicou 55 advisories entre 2025-12-03 (React2Shell) e 2026-11-15: 6 críticos, 17 altos, 29 médios e 3 baixos (`gh api repos/vercel/next.js/security-advisories`, lido em 2026-11-15; lista pública em https://github.com/vercel/next.js/security/advisories). Os seis críticos são execução remota de código:

| Publicado | Advisory | O que é preciso para ser atingido |
|---|---|---|
| 2025-12-03 | [GHSA-9qr9-h5gf-34mp](https://github.com/vercel/next.js/security/advisories/GHSA-9qr9-h5gf-34mp) (CVE-2025-55182, React2Shell) | App Router servindo React Server Components |
| 2026-08-25 | [GHSA-p293-qw3h-jr36](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36) (CVE-2026-75604) | servidor hospedado em Windows |
| 2026-08-25 | [GHSA-2xp9-vwfh-vxw4](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4) | API de otimização de imagem com AVIF |
| 2026-09-22 | [GHSA-vcvr-r3jv-pc5j](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j) (CVE-2026-94545) | `ImageResponse` de `next/og` recebendo valor do atacante |
| 2026-10-14 | [GHSA-2464-fhr4-w9xw](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw) (CVE-2026-96889) | API de otimização de imagem com SVG |
| 2026-10-14 | [GHSA-673q-mjm6-r5xr](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr) | funções `use cache` que devolvem typed arrays |

No React, os dez advisories publicados desde 2025-12-03 estão todos nos pacotes de servidor `react-server-dom-webpack`, `-turbopack` e `-parcel`, dois deles críticos: CVE-2025-55182 e [GHSA-xqc2-xf4c-x3h3](https://github.com/facebook/react/security/advisories/GHSA-xqc2-xf4c-x3h3) (CVE-2026-126187, 2026-10-14) (`gh api repos/facebook/react/security-advisories`, lido em 2026-11-15).

- **Exportação estática.** O guia do Next lista como não suportado, por exigir "a Node.js server": Proxy, Server Actions, ISR, Image Optimization com o `loader` padrão, rewrites, redirects, headers, cookies e Draft Mode; os Server Components rodam durante o `next build` (https://nextjs.org/docs/app/guides/static-exports, atualizado em 2026-08-09). Nenhum dos seis críticos acima tem por onde entrar quando não há servidor do Next em produção: o nginx só entrega arquivos. O `next/og` gera as imagens no build, com o conteúdo do Autor, e não com valor de quem acessa (**inferência**). Os advisories do servidor de desenvolvimento, como [GHSA-39w2-rjm5-chcv](https://github.com/vercel/next.js/security/advisories/GHSA-39w2-rjm5-chcv) e [GHSA-jcc7-9wpm-mj36](https://github.com/vercel/next.js/security/advisories/GHSA-jcc7-9wpm-mj36), atingem só o `next dev`, isto é, a máquina do Autor e dos agentes. Com a exportação, um CVE crítico do Next ou do React vira atualização na cadência normal, e a urgência muda de lugar: a imagem do nginx e do Alpine, a esteira de build (um pacote malicioso no build injeta código no JavaScript que vai ao Visitante) e o JavaScript de cliente (XSS, raro).
- **`standalone`.** A corrida volta a ser de horas. Foram seis RCEs críticos em pouco mais de onze meses, cerca de um a cada dois meses. O React2Shell teve tentativas de exploração observadas "within hours" da divulgação (https://aws.amazon.com/blogs/security/china-nexus-cyber-threat-groups-rapidly-exploit-react2shell-vulnerability-cve-2025-55182/, 2025-12-04) e entrou no catálogo de vulnerabilidades exploradas da CISA em 2025-12-05, dois dias depois (https://www.cisa.gov/known-exploited-vulnerabilities-catalog, versão 2026.11.13 do feed JSON). Nenhum outro CVE do Next ou do React está nesse catálogo.

## 1. Segredos

Fontes: https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning · https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection · https://docs.github.com/en/code-security/secret-scanning/using-advanced-secret-scanning-and-push-protection-features/non-provider-patterns · https://github.com/gitleaks/gitleaks (README e `.pre-commit-hooks.yaml` da v8.30.1) · https://github.com/betterleaks/betterleaks · https://github.com/gitleaks/gitleaks-action · https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository (todas lidas em 2026-11-15)

**O que o GitHub já faz neste repositório**
- Em repositório público, o secret scanning "runs automatically for free" e varre "your entire Git history on all branches", além de issues, PRs, Discussions e wikis. A configuração dos padrões de parceiros em repositório público não pode ser mudada.
- A push protection do repositório está ligada (seção 0). Ela barra no `git push`, nos commits pela interface e nas chamadas da API REST, e cobre os padrões de parceiros cujo provedor aderiu à push protection. Quem tem escrita pode contornar o bloqueio dando um motivo; cada contorno gera alerta, entrada no log de auditoria e e-mail. Os agentes usam a credencial do Autor, então têm esse poder: a regra "agente nunca contorna a push protection" precisa estar escrita no `AGENTS.md` (**inferência**: nenhuma configuração impede um contorno com motivo).
- A push protection do usuário vem ligada por padrão e "Stops you from pushing secrets to public repositories on GitHub", mas o contorno dela só gera alerta quando a do repositório também está ligada, como aqui.

**A lacuna: segredo genérico**
- Chaves privadas, strings de conexão e senhas não são padrões de parceiro. Os padrões genéricos e os segredos detectados por IA precisam ser ligados à parte, e a página de padrões não ligados a provedor listava como elegíveis só repositórios de organização com GitHub Secret Protection; a versão atual da página, que passou a chamar o recurso de "generic patterns", não diz mais quem é elegível. O campo `secret_scanning_non_provider_patterns` aparece desligado neste repositório. Até prova em contrário, o GitHub não vê segredo genérico aqui, e o gancho local é a única barreira antes do push.

**gitleaks, e o que mudou com ele em 2026**
- O README diz: "Gitleaks is feature complete. I'm not merging new features into Gitleaks. Future releases will be security patches only. I'm shifting my focus to Betterleaks". A última versão é a v8.30.1, de 2026-03-21. Regras novas para formatos novos de credencial deixam de chegar.
- O Betterleaks é "maintained by the folks who made Gitleaks, including the original author", sob licença MIT, com desenvolvimento patrocinado pela Aikido Security, e acrescenta validação do segredo encontrado (`--validate`). A linha estável é a v1.10.1 (2026-11-12) e a v2.0.0 está em release candidate (rc.8 em 2026-11-13), com guia de migração para mudanças de CLI, configuração e relatório.
- No gancho, o comando é o do próprio projeto: `gitleaks git --pre-commit --redact --staged --verbose` (`.pre-commit-hooks.yaml` da v8.30.1). Os comandos `detect` e `protect` estão obsoletos desde a v8.19.0.
- Na CI, o binário roda direto sobre os commits empurrados, sem a `gitleaks/gitleaks-action`: a action pede chave de licença só para organizações ("not required for user accounts"), mas desde a v2 deixou de ser MIT.

**O que cada camada compra num repositório público**
- O gancho de pre-commit é a única camada que impede a exposição de um segredo genérico. Ele falha quando não roda: clone novo sem `lefthook install`, agente em ambiente remoto, `git commit --no-verify` (**inferência**).
- A varredura na CI roda depois do push. Num repositório público, o branch já está visível quando ela termina, então ela não evita a exposição: só avisa. O valor está no aviso chegar onde o agente olha (o check vermelho no PR, e não um alerta na aba de segurança) e em cobrir os commits que passaram sem o gancho (**inferência**). A resposta a um alerta é sempre girar o segredo; apagar o commit não o tira de circulação.
- Relato privado de vulnerabilidade: está desligado. A página do GitHub diz que donos de repositórios públicos podem ligá-lo para que pesquisadores relatem "securely"; custa um clique e não gera trabalho até alguém relatar.

## 2. Dependências

Fontes: https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference · https://github.blog/changelog/2026-07-14-dependabot-version-updates-introduce-default-package-cooldown/ · https://github.blog/security/supply-chain-security/tame-dependabot-group-your-updates-slow-the-cadence-keep-security-fast/ (2026-07-29) · https://github.blog/security/supply-chain-security/disrupting-supply-chain-attacks-on-npm-and-github-actions/ (2026-07-28) · https://docs.github.com/en/code-security/dependabot/working-with-dependabot/automating-dependabot-with-github-actions · https://docs.github.com/en/code-security/dependabot/troubleshooting-dependabot/troubleshooting-dependabot-on-github-actions · https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow · https://github.com/peter-evans/enable-pull-request-automerge (README) · https://docs.renovatebot.com/key-concepts/automerge/ e https://docs.renovatebot.com/mend-hosted/overview/ (Renovate 44.239.1) · `docs/usage/configuration-options.md` e `docs/usage/key-concepts/minimum-release-age.md` do Renovate no commit `9ac3811` · https://pnpm.io/settings/dependency-resolution · https://pnpm.io/cli/audit · notas das versões v11.0.0 e v12.16.0 do pnpm (https://github.com/pnpm/pnpm/releases) · `npm_and_yarn/lib/dependabot/npm_and_yarn/file_updater/pnpm_lockfile_updater.rb` do dependabot-core no commit `1a0125f` · https://github.com/actions/dependency-review-action (v5.0.0) · https://google.github.io/osv-scanner/github-action/ (v2.7.1) · https://github.blog/changelog/2026-03-17-dependabot-now-detects-malware-in-npm-dependencies/ · https://docs.github.com/en/code-security/concepts/supply-chain-security/malware-alerts

### 2.1 O que mudou em 2026 e já protege sem configurar

- **Dependabot**: desde 2026-07-14, as atualizações de versão esperam 3 dias depois da publicação ("Apply a default cooldown period of 3 days to version updates, even when cooldown is not configured"), e "This default cooldown does not apply to security updates". O próprio GitHub resume: "Security updates still open immediately, so critical fixes are never held back by the cooldown".
- **pnpm 11** (2026-04-28): `minimumReleaseAge` passou a valer 1440 minutos (1 dia), com `minimumReleaseAgeStrict: false`; `strictDepBuilds` e `blockExoticSubdeps` passaram a `true`; e nenhum pacote roda script de instalação sem constar em `allowBuilds`. O pnpm 12 (2026-08-26) manteve isso; a versão corrente é a 12.21.0, de 2026-11-13. O Dependabot suporta pnpm da v7 à v12.
- **npm 12**: desliga os scripts de instalação por padrão (post do GitHub de 2026-07-28). Não afeta este projeto, que usa pnpm, mas confirma a direção.
- **Alertas de malware do Dependabot**: desde 2026-03-17, opcionais ("Malware alerting is opt-in"), ligados em Settings, Code security, Dependabot, "Malware alerts". Em julho de 2026 passaram a usar também o projeto de pacotes maliciosos da OpenSSF. Só geram alerta, não PR. Este repositório não tem o recurso ligado (não aparece em `security_and_analysis`; **inferência** de que está no padrão, desligado).

### 2.2 A armadilha do merge automático: "publicar é mergear" quebra em silêncio

- O exemplo oficial de merge automático do Dependabot roda em `pull_request`, com `permissions: contents: write, pull-requests: write`, `dependabot/fetch-metadata` e `gh pr merge --auto` usando o `GITHUB_TOKEN`. Workflows disparados pelo Dependabot em `push` e `pull_request` recebem `GITHUB_TOKEN` só de leitura e só os segredos do Dependabot, mas a chave `permissions` pode ampliar o token.
- A regra do GitHub: "events triggered by the `GITHUB_TOKEN` will not create a new workflow run", com exceção de `workflow_dispatch` e `repository_dispatch`; para disparar outros workflows, a documentação indica "a GitHub App installation access token or a personal access token". O README da action que liga o auto-merge nativo do GitHub é explícito: "if you use the default `GITHUB_TOKEN`, as in the example, the merge will not trigger further workflow runs".
- Consequência para este projeto: um PR do Dependabot mesclado com o `GITHUB_TOKEN` chega à `main`, mas o workflow de `push` que constrói a imagem e chama o Coolify não roda. A correção fica no repositório e não vai ao ar, sem nenhum check vermelho (**inferência** a partir das duas fontes; conferir no primeiro merge automático).
- Saídas: um token de GitHub App do próprio Autor no workflow de merge automático (o app só precisa de `contents` e `pull_requests` de escrita neste repositório; ID e chave privada como segredos do Dependabot), ou o Renovate, cujo app mescla com a própria identidade e por isso dispara os workflows (**inferência**: a supressão vale só para eventos do `GITHUB_TOKEN`).

### 2.3 Dependabot ou Renovate

| | Dependabot | Renovate (app Mend, Community Cloud) |
|---|---|---|
| Instalação | nativo, já ligado para segurança | app de terceiro; pede `contents`, `workflows`, `pull_requests`, `checks` e `statuses` de escrita (`gh api apps/renovate`) |
| PR de segurança | "raised as soon as a vulnerability with a fix is disclosed" | lê os mesmos alertas do Dependabot (exige grafo de dependências, alertas ligados e permissão de leitura de alertas no app); o PR "skip the line", mas só sai quando um job roda: a cada 4 horas em repositórios ativos, ou antes, por webhook; um job por vez por conta |
| Espera de maturidade | 3 dias por padrão nas versões; zero na segurança | `minimumReleaseAge` só se configurado (o `config:best-practices` liga `security:minimumReleaseAgeNpm`); nulo na segurança |
| Merge automático | não existe opção no `dependabot.yml`; exige workflow próprio e o token da seção 2.2 | nativo (`automerge`, `platformAutomerge` ligado por padrão), espera os checks passarem |
| Agrupamento | `groups` com `applies-to`, `dependency-type`, `update-types`, `patterns`; `multi-ecosystem-groups` | `group:monorepos`, `group:recommended` e regras livres |
| Actions e imagens | ecossistemas `github-actions` e `docker`; atualiza o lockfile de actions no mesmo PR (seção 3) | `helpers:pinGitHubActionDigests` e `docker:pinDigests` no `config:best-practices` |

O Renovate é mais capaz e resolve o merge automático sem token extra. O Dependabot é nativo, não dá escrita em `workflows` a um terceiro e abre o PR de segurança sem esperar ciclo de 4 horas. Para um app, um mantenedor e uma Home estática, a diferença de recursos não paga a dependência de um app externo com escrita no repositório; o que o Dependabot não tem (merge automático que dispara o deploy) custa um GitHub App pequeno do próprio Autor (**inferência**, julgamento desta pesquisa).

### 2.4 O pnpm segura a correção de segurança por até um dia (medido)

O que as fontes dizem:
- O pnpm aplica `minimumReleaseAge` "to all dependencies, including transitive ones", e a instalação reaplica a regra a cada entrada do lockfile, a menos que `trustLockfile` seja `true`. Desde a v12.16.0, `pnpm install` "fails with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` when a locked version is too new".
- O Dependabot, numa atualização de segurança, passa `--config.minimum-release-age=0` ao pnpm "unconditionally", porque a correção "must not be blocked by a release-age gate", e devolve os arquivos de workspace que ele mesmo calculou, e não as exceções que o pnpm grava (comentários e código de `pnpm_lockfile_updater.rb`).
- O Renovate não passa idade mínima ao pnpm: "pnpm applies its own config", e um pnpm que recusa a versão falha "and Renovate does not retry".

O que medi (pnpm 12.21.0, 2026-11-15, num diretório vazio, com `@biomejs/biome@2.6.8` publicado havia 5,6 horas fazendo o papel de um patch recém-saído):

| Caso | Resultado |
|---|---|
| Resolver a versão nova com a configuração padrão (não estrita) | instala e grava sozinho 11 entradas `nome@versão` em `minimumReleaseAgeExclude` no `pnpm-workspace.yaml` ("Added 11 entries to minimumReleaseAgeExclude") |
| `install --frozen-lockfile` com essas exceções no arquivo | passa |
| `install --frozen-lockfile` sem as exceções, store e cache vazios (como num runner) | falha: "The lockfile contains entries that the active policies reject" |
| O mesmo com `minimumReleaseAge: 1440` explícito (estrito) | falha igual na instalação; e a resolução nova falha com "within the minimumReleaseAge cutoff" |
| Instalação sem as exceções, mas com o store local que já tinha o pacote | passa (efeito de cache; não vale como prova) |

Consequência (**inferência** das fontes e da medição; conferir no primeiro PR de segurança): um PR de segurança do Dependabot para uma versão com menos de 24 horas chega com o lockfile novo e sem a exceção, e a instalação congelada da CI falha até a versão completar um dia. O caminho automático leva, então, até um dia. O caminho rápido é o do agente: `pnpm up next@<versão corrigida>` (ou `pnpm audit --fix`, que "adds each advisory's minimum patched version to `minimumReleaseAgeExclude`") grava a exceção no mesmo commit, a CI passa e o agente mescla com a credencial do Autor, o que dispara o deploy.

### 2.5 Auditoria: o que bloqueia e o que informa

- `pnpm audit` consulta o endpoint `/-/npm/v1/security/advisories/bulk` do registro e "exits with `1` when an advisory at or above the audit level remains". Como check obrigatório, ele reprova qualquer PR quando sai um advisory novo para o que já está na `main`, inclusive o PR que corrige outra coisa, e depende da rede do registro (**inferência** a partir da semântica de saída). Serve ao agente como ferramenta (`--fix`), não como gate.
- `actions/dependency-review-action` (v5.0.0, gratuita em repositório público) falha só quando a mudança "introduce[s] vulnerabilities" de severidade igual ou maior que `fail-on-severity`, no escopo `runtime` por padrão, e aceita `base-ref` e `head-ref` "for event types other than `pull_request`", o que serve a uma CI disparada por `push`. É o bloqueio certo: compara com a base e não reprova um PR pelo que ele não mudou.
- OSV-Scanner (v2.7.1): o modo de PR "fails if the feature branch introduces vulnerabilities that the target branch doesn't have", mas o workflow reutilizável de PR roda só em `pull_request` e `merge_group`. O banco do OSV traz os registros `MAL-` de pacotes maliciosos, alguns vindos do próprio GitHub (o `MAL-2025-46966`, do `ansi-regex`, tem origem `ghsa-malware`). Com os alertas de malware do Dependabot usando o mesmo projeto da OpenSSF desde julho de 2026, o OSV-Scanner repete dados que o GitHub já entrega (**inferência**).
- Dependabot alerts e alertas de malware: informam o estado da `main` sem bloquear nada, que é o que se quer para um advisory novo sobre código já publicado.

### 2.6 Configuração do pnpm que vale a pena

- Manter os padrões do pnpm 12: um dia de maturidade, não estrito, `strictDepBuilds`, `blockExoticSubdeps` e `allowBuilds` vazio enquanto nenhum pacote precisar de script. A exceção que o pnpm grava aparece no diff do PR, o que deixa a decisão visível. O modo estrito obriga a aprovar à mão cada versão nova e quebra as atualizações automáticas sem ganho de segurança proporcional para um mantenedor (**inferência**).
- Ligar `trustPolicy: no-downgrade` (padrão `off`): "Install fails if a package's trust level has decreased compared with earlier releases". É o sinal típico de uma versão publicada por conta sequestrada, sem a proveniência das anteriores. Custa uma entrada em `trustPolicyExclude` quando um pacote legítimo regredir.
- Não ligar `trustLockfile`: ele desliga a verificação que pega um lockfile gerado fora da política, e a página do pnpm recomenda mantê-lo `false` se outros editam o lockfile; aqui editam dois robôs e vários agentes.

### 2.7 Tempo até a produção de uma correção crítica

| Etapa | Exportação estática | `standalone` |
|---|---|---|
| Advisory e versão corrigida publicados | o Next publica os dois juntos (as páginas de advisory listam a versão corrigida) | igual |
| PR de segurança do Dependabot | minutos (**inferência**: "as soon as ... disclosed") | igual |
| Gate verde | só depois de 24 horas da publicação, pela seção 2.4 | igual, o que é tarde: o React2Shell teve exploração em horas |
| Merge e deploy | merge automático com token de GitHub App, depois build, deploy e smoke (seção 5) | igual |
| Caminho rápido | desnecessário: nenhum dos seis RCEs críticos de 2026 chega a um site exportado | o agente atualiza com a exceção, a CI passa, o agente mescla; dezenas de minutos (**inferência**) |

Para `standalone`, há uma alternativa que encurta o caminho automático sem agente: pôr `next`, `react` e `react-dom` em `minimumReleaseAgeExclude` de forma permanente. As atualizações de versão continuam esperando os 3 dias do Dependabot, e só a verificação do pnpm deixa de segurar esses três pacotes; o custo é perder a camada do pnpm justamente nos pacotes mais visados (**inferência**).

## 3. Código e workflows

Fontes: https://docs.github.com/en/code-security/code-scanning/enabling-code-scanning/configuring-default-setup-for-code-scanning · https://github.blog/changelog/2025-04-22-github-actions-workflow-security-analysis-with-codeql-is-now-generally-available/ · https://docs.github.com/en/code-security/concepts/code-scanning/merge-protection · https://docs.github.com/en/actions/reference/security/secure-use · https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository · https://docs.github.com/en/actions/concepts/security/workflow-dependency-lockfiles · https://github.blog/changelog/2026-10-28-github-actions-workflow-lockfiles-are-generally-available/ · https://github.blog/changelog/2025-08-15-github-actions-policy-now-supports-blocking-and-sha-pinning-actions/ · https://github.com/aquasecurity/trivy/security/advisories/GHSA-69fq-xp46-6x23 · https://github.com/actions/checkout (README da v7.0.1) · https://github.blog/changelog/2026-09-17-workflow-execution-protections-in-github-actions-generally-available/ · https://github.com/zizmorcore/zizmor (`docs/audits.md`, v1.32.0) · https://github.com/rhysd/actionlint (v1.7.12) · https://github.com/step-security/harden-runner (README, v2.22.4) · https://github.blog/news-insights/product-news/whats-coming-to-our-github-actions-2026-security-roadmap/ (2026-03-26) · https://github.com/ossf/scorecard (`docs/checks.md`, v5.6.0) · esquema `repository-rule-params-status-check-configuration` em https://github.com/github/rest-api-description

### 3.1 CodeQL

- O default setup exige Actions ligado e repositório "publicly visible, or GitHub Code Security is enabled"; não pede arquivo de workflow e roda também numa agenda semanal. A análise de workflows do GitHub Actions com CodeQL está disponível desde 2025-04-22 e entra sozinha no default setup quando há arquivos de workflow no branch padrão. Hoje o default setup deste repositório não está configurado.
- Para uma Home exportada, sem servidor e sem entrada de usuário, a análise de JS/TS acha pouco; o valor real está nos workflows, onde CodeQL procura injeção de script e permissões faltando (**inferência**). O custo é zero de manutenção: não há arquivo nem action para fixar.
- A regra de ruleset "Require code scanning results" barra o merge quando "A required tool finds a code scanning alert of a severity that is defined in the ruleset", enquanto a análise "is still in progress", ou quando a ferramenta não está configurada. Um alerta só conta se "all the lines of code identified by an alert must exist in the pull request diff", e a regra não se aplica a "Dependabot pull requests analyzed by default setup". Ela "is not related to status checks". Na prática: o PR de segurança do Dependabot não espera o CodeQL, e o PR de um agente espera alguns minutos de análise (**inferência** sobre a duração).

### 3.2 Permissões do `GITHUB_TOKEN`

- A referência de uso seguro do GitHub: "It's good security practice to set the default permission for the `GITHUB_TOKEN` to read access only for repository contents", aumentando por job o que cada um precisa. O padrão do repositório já é só leitura (seção 0), e workflows não aprovam PRs.
- Padrão de escrita (**inferência**, aplicação da regra): `permissions: {}` no topo de cada workflow e, por job, só o necessário. O job de build da imagem pede `contents: read` e `packages: write` (mais `id-token: write` e `attestations: write` se atestar, seção 4.4); o job de deploy pede só `contents: read`; o merge automático do Dependabot pede `contents: write` e `pull-requests: write`.
- `actions/checkout` v7: recusa por padrão o código de fork em `pull_request_target` e `workflow_run`, e `persist-credentials` agora guarda a credencial "in a separate file under `$RUNNER_TEMP`" em vez do `.git/config`. A credencial continua persistida durante o job; `persist-credentials: false` vale onde o job não precisa de git autenticado.
- As proteções de execução de workflow (GA em 2026-09-17) permitem dizer quem e que evento dispara cada workflow. Para repositório público sem política de evento, o GitHub acrescenta uma regra padrão que desliga `pull_request_target`, com aplicação automática a partir de 2026-12-02. A esteira proposta não usa esse gatilho.

### 3.3 Fixação das actions: SHA e lockfile

- O caso que ensina: em 2026-03-19, credenciais roubadas permitiram "force-push 76 of 77 version tags in `aquasecurity/trivy-action` to credential-stealing malware" e trocar "all 7 tags in `aquasecurity/setup-trivy`"; a janela do `trivy-action` foi de cerca de 12 horas (GHSA-69fq-xp46-6x23, CVE-2026-33634, no catálogo KEV da CISA desde 2026-03-26). Não foi atingido quem usava as imagens "referenced by digest" ou fixou o `trivy-action` por SHA depois de 2025-04-09. Quem fixou por SHA um commit anterior a essa data recebeu "a safe trivy-action but it would get a malicious setup-trivy", porque a action composta chamava a outra por tag. Fixar por SHA protege a primeira camada, não a transitiva.
- O lockfile de workflow (`.github/workflows/actions.lock`, gerado pela extensão `gh actions-lock`) registra "the exact commit for every action your workflows depend on, including transitive dependencies", confere a identidade de cada repositório de origem na execução, e a referência de uso seguro diz que ele "is the strongest protection available, and supersedes SHA pinning for repositories that adopt it". Está GA desde 2026-10-28, inclusive no plano Free; o Dependabot regenera a entrada do lockfile no mesmo PR que atualiza a action; e existe a política "Require lockfile" para repositórios. Ele não cobre workflows reutilizáveis chamados por `jobs.<id>.uses`.
- A política de fixação por SHA existe desde 2025-08-15 e, ligada, impede o uso de action não fixada ("all actions must be pinned to a full-length commit SHA to be used"). Neste repositório está desligada (`sha_pinning_required: false`). Um workflow com lockfile já satisfaz essa política.
- As actions compostas que a esteira usaria fixam por SHA as actions internas: `actions/attest-build-provenance` v4.2.2 chama `actions/attest@508db95…` e `zizmorcore/zizmor-action` v0.8.1 chama `github/codeql-action/upload-sarif@9b32540…`; as demais (`actions/checkout` v7.0.1, `pnpm/action-setup` v6.1.1, `docker/build-push-action` v7.4.0) são actions `node24`, sem dependência transitiva de action (leitura dos `action.yml` nas versões citadas). O lockfile garante que isso continue verdade quando uma delas mudar (**inferência**).
- O zizmor ainda não fala do lockfile: o `unpinned-uses` exige, por padrão desde a v1.20.0, "hash-pinning on *all* actions". Manter o SHA nos arquivos, além do lockfile, deixa o zizmor passar sem configuração (**inferência**).

### 3.4 Linters de workflow

- actionlint (v1.7.12, 2026-03-30) confere sintaxe, expressões e os scripts de `run`. zizmor (v1.32.0, 2026-11-02, MIT) é auditoria de segurança: `template-injection`, `excessive-permissions`, `unpinned-uses`, `artipacked`, `cache-poisoning`, `dangerous-triggers`, `bot-conditions`, `secrets-outside-env`, `dependabot-cooldown`, entre outras, quase todas "Works offline". Os dois rodam em segundos e com o mesmo comando no agente e na CI (**inferência**), o que cabe no gate como bloqueio.
- A análise de workflows do CodeQL se sobrepõe em parte ao zizmor, mas roda só no GitHub e depois do push; o zizmor pega o problema antes, na máquina do agente (**inferência**).

### 3.5 harden-runner e a saída de rede do runner

- O harden-runner (v2.22.4) tem um nível Community "free for **public repositories on GitHub-hosted runners**", com modo de auditoria, bloqueio por lista de domínios e uma lista global de domínios maliciosos "enforced even in `egress-policy: audit` mode". O README relata detecções do tj-actions, do Trivy, do nx e do Shai-Hulud.
- O próprio GitHub tem um firewall de rede do Actions em prévia técnica, que só registra o tráfego de saída por enquanto (post de 2026-07-28); o roteiro de 2026-03-26 prevê um firewall nativo de saída para os runners hospedados, com prévia pública em 6 a 9 meses.
- Aqui, o job que roda código de terceiros (instalação do pnpm e `next build`) não vê o segredo de deploy, que fica no environment (seção 5.5); o pior que ele faz é sobrescrever uma tag no GHCR com `packages: write` (**inferência** do desenho). O harden-runner acrescenta um terceiro com acesso de root ao runner e uma lista de domínios para manter no modo de bloqueio. Vale reavaliar quando o firewall nativo sair da prévia.

### 3.6 OpenSSF Scorecard

- O Scorecard (v5.6.0) pontua, entre outras, `Code-Review` (se "the most recent changes (over the last ~30 commits) have an approval"), `Contributors`, `Fuzzing`, `CII-Best-Practices`, `Packaging` e `Signed-Releases`. Um repositório de um mantenedor, com zero aprovações por desenho, tira zero em `Code-Review` para sempre, e as outras não se aplicam a um site.
- As checagens que importam aqui (`Token-Permissions`, `Pinned-Dependencies`, `Dangerous-Workflow`, `Branch-Protection`, `SAST`, `Vulnerabilities`) já estão cobertas pelo zizmor, pela política de lockfile, pelo ruleset, pelo CodeQL e pelo Dependabot (**inferência**). Como workflow recorrente, é um placar sem leitor.

### 3.7 O check obrigatório amarrado ao GitHub Actions

- No ruleset, cada check obrigatório aceita `integration_id`, "The optional integration ID that this status check must originate from"; o app do GitHub Actions é o 15368 (`gh api apps/github-actions`). Sem isso, qualquer integração com escrita em `statuses` pode publicar um status de mesmo nome no commit (**inferência** do esquema). O nome do check é decisão do #52; a amarração vale para qualquer nome.

## 4. Imagem

Fontes: https://github.com/nginx/docker-nginx-unprivileged (README e `mainline/alpine*/Dockerfile`, último commit em 2026-10-23) · manifesto e configuração de `ghcr.io/nginx/nginx-unprivileged:1.30-alpine-slim`, lidos pela API do registro em 2026-11-15 (índice `sha256:931bec1e41a3a643f2672162405093fe04002dd20e41d04faf67d700b7556b49`) · tags de `nginx/nginx-unprivileged` na API do Docker Hub · https://docs.docker.com/dhi/ · https://docs.docker.com/dhi/get-started/ · https://hub.docker.com/hardened-images/catalog/dhi/nginx/guides · https://www.docker.com/blog/docker-hardened-images-for-every-developer/ (2025-12-17) · https://coolify.io/docs/knowledge-base/health-checks · `app/Jobs/ApplicationDeploymentJob.php` do Coolify na tag v4.1.0 (commit `49656aa`) · https://nextjs.org/docs/app/guides/static-exports · https://nodejs.org/docs/latest-v24.x/api/corepack.html · https://docs.docker.com/build/ci/github-actions/attestations/ · https://docs.docker.com/build/metadata/attestations/sbom/ · https://docs.docker.com/build/cache/backends/gha/ · https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching · https://docs.github.com/en/actions/concepts/security/artifact-attestations · https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry · https://docs.github.com/en/billing/concepts/product-billing/github-packages · versões das ferramentas pela API de releases do GitHub em 2026-11-15

### 4.1 Forma da imagem para a exportação estática

- **Dois estágios.** Um estágio de build com Node e pnpm roda `pnpm install --frozen-lockfile` e `next build`, que gera a pasta `out` com um HTML por rota e um `404.html`. O estágio final copia `out` para um nginx. O Node e o `node_modules` não entram na imagem final (**inferência** do desenho multi-stage).
- **Base do estágio final: `nginx-unprivileged` em Alpine slim.** Conferido na imagem `1.30-alpine-slim`: `User: 101`, porta `8080/tcp`, sem `HEALTHCHECK`, `CMD nginx -g 'daemon off;'`, 5,74 MB comprimidos (amd64), com `/bin/sh` e `/usr/bin/wget` (ambos busybox) e sem `curl`. A variante `alpine` (23,4 MB) acrescenta `curl` "to make registering on DNS SD easier"; a `alpine-slim` basta. O projeto troca as tags "whenever there is a new NGINX release or a critical CVE is found and fixed" e toda segunda-feira, e recomenda "use the specific image digest instead of the tag" para estabilidade. O Docker Hub mudou de namespace: a partir do nginx 1.31.7 (mainline) e 1.30.6 (stable) a imagem é `nginx/nginx-unprivileged`, e não mais `nginxinc/nginx-unprivileged`; ela também sai no GHCR como `ghcr.io/nginx/nginx-unprivileged`, o que deixa a esteira inteira num registro só (**inferência**).
- **Por que não uma imagem endurecida sem shell.** As Docker Hardened Images ficaram gratuitas (Apache 2.0) em 2025-12-17, rodam sem root e têm proveniência SLSA nível 3; o nginx delas escuta em 8080. Mas a variante de runtime não tem shell, e o pull exige `docker login dhi.io` com conta Docker. O health check do Coolify roda dentro do container como `CMD-SHELL` com `curl ... || wget ... || exit 1` (código da v4.1.0), então uma imagem sem `/bin/sh` reprova todo deploy. Pelo mesmo motivo ficam de fora as imagens distroless.
- **pnpm no estágio de build.** O Node deixou de distribuir o Corepack a partir da v25 ("Corepack will no longer be distributed starting with Node.js v25"). Com Node 26, o pnpm entra por `npm install -g pnpm@<versão exata>` ou pela action `pnpm/action-setup` na CI, fixado na versão do campo `packageManager` (**inferência** de procedimento).
- **Configuração do nginx.** A do guia do Next: `try_files $uri $uri.html $uri/ =404;` e `error_page 404 /404.html;`. Acrescentar `server_tokens off` e cache longo só para `/_next/static/`, cujos nomes têm hash (**inferência**; o cache de borda é decisão do #18).

### 4.2 Health check que o Coolify usa

O que o código do Coolify 4.1.0 faz, lido em `ApplicationDeploymentJob.php`:
- Com o health check desligado e sem `HEALTHCHECK` detectado, `newVersionIsHealthy = true` na hora, e o container antigo sai. Ou seja, sem health check o Coolify troca o container às cegas.
- Com o health check ligado, ele espera o `start_period`, consulta `docker inspect` até `healthy` ou `unhealthy` e, se o novo não fica saudável, registra "New container is not healthy, rolling back to the old container", marca o deploy como falho e remove o container novo. O antigo continua no ar.
- A troca sem queda ("rolling update") não acontece se houver porta mapeada no host, nome de container fixo, nome interno próprio ou IP próprio.
- A documentação acrescenta que o `HEALTHCHECK` do Dockerfile vale para apps sem Compose só "while the dashboard Healthcheck is disabled", e que os campos de código e texto esperados "the generated check doesn't compare responses against them".

Para esta imagem: health check HTTP ligado, `GET http://localhost:8080/`, sem porta mapeada (o Traefik roteia). O `wget` do busybox responde quando o `curl` falta. `GET /` prova que o `index.html` está lá, não só que o processo responde (**inferência**).

### 4.3 Build com buildx e cache

- `docker/build-push-action` (v7.4.0) com `cache-from: type=gha` e `cache-to: type=gha,mode=max`, com um `scope` por imagem, porque sem ele "each build will overwrite the cache of the previous".
- Envenenamento de cache: "Workflow runs cannot restore caches created for child branches or sibling branches", então um branch não alimenta o cache que a `main` restaura. O build da imagem que vai ao ar roda só na `main`, e só a `main` escreve o cache que ela mesma lê (**inferência** da regra).
- Proveniência nos argumentos: em repositório público, o build-push-action já anexa proveniência `mode=max`, e ela "can include build argument values". Segredo nunca entra como `--build-arg`.

### 4.4 Varredura, SBOM, proveniência e assinatura

- **Superfície.** Na exportação, a imagem final tem pacotes do Alpine e o nginx. As dependências npm que chegam ao Visitante viram JavaScript empacotado, que um scanner de imagem não enxerga; elas estão cobertas pelo Dependabot sobre o lockfile (**inferência**).
- **Scanner.** Trivy (v0.76.2, com releases imutáveis desde o incidente) e Grype (v0.121.3) cobrem Alpine. O SBOM do BuildKit usa por padrão o "BuildKit Syft scanner (docker/buildkit-syft-scanner)", de Anchore, e segue SPDX; o Grype é do mesmo fabricante e lê esse formato (**inferência** de compatibilidade). Um scanner basta.
- **O que bloqueia.** Nada no caminho de deploy. Um CVE novo sem correção na base faria o scan reprovar todos os deploys, inclusive o de uma correção crítica (**inferência**). O remédio de uma base com CVE é trocar a base, o que o Dependabot do ecossistema `docker` faz ao atualizar o digest. O scan informa: no resumo do job e numa varredura semanal da imagem em produção.
- **SBOM.** Não é anexado por padrão; `sbom: true` liga. O BuildKit "only scans the final stage of an image" por padrão; `ARG BUILDKIT_SBOM_SCAN_STAGE=true` no estágio de build acrescenta as dependências npm que produziram o JavaScript, que é o inventário que interessa numa exportação (**inferência**).
- **Atestado de proveniência do GitHub.** Em repositório público, usa a instância pública do Sigstore com log de transparência; sozinho dá SLSA v1.0 Build Level 2, e um workflow reutilizável compartilhado chega ao nível 3. A página avisa: "artifact attestations are *not* a guarantee that an artifact is secure". O Coolify 4.1.0 só faz `docker compose pull` e não verifica assinatura nem atestado (código da v4.1.0). O único verificador possível é o próprio job de deploy, com `gh attestation verify` sobre o digest que ele vai promover: isso garante que só imagem construída pelo workflow da `main` chega à tag de produção (**inferência**).
- **cosign.** O atestado do GitHub já é uma assinatura Sigstore; uma segunda assinatura com cosign (v3.1.4) não teria quem a conferisse.
- **GHCR.** O primeiro push cria o pacote privado ("the default visibility is private"), então a visibilidade pública é um passo manual único, como o #18 previa. Publicar pelo `GITHUB_TOKEN` liga o pacote ao repositório, e o repositório que publica recebe `admin` sobre o pacote: as tags são mutáveis para qualquer workflow com `packages: write` (**inferência**). Pacote público não tem custo de armazenamento nem de banda.

### 4.5 O que muda com `standalone`

- O estágio final passa a ser Node, com o `server.js` do `standalone`, usuário sem root e porta própria. A base sem shell continua fora pelo health check do Coolify; uma base Alpine ou Debian slim com `wget` ou `curl` resolve (**inferência**).
- A superfície do scan passa a incluir o `node_modules` rastreado pelo Next e o binário do Node. Os seis RCEs críticos da seção 0 voltam a valer, e o caminho rápido de correção da seção 2.7 vira obrigatório.
- Se houver otimização de imagem do Next, entra o `sharp`, que pede `allowBuilds` no pnpm e esteve em dois dos RCEs críticos de 2026 (AVIF e SVG).

## 5. Entrega

Fontes: `app/Jobs/ApplicationDeploymentJob.php`, `routes/api.php`, `app/Http/Controllers/Api/DeployController.php`, `app/Http/Middleware/ApiAbility.php`, `app/Livewire/Security/ApiTokens.php` e `app/Livewire/Project/Application/Rollback.php` do Coolify na tag v4.1.0 (commit `49656aa`) · https://coolify.io/docs/api/endpoints/deployments/deploy-by-tag-or-uuid · https://coolify.io/docs/api/authorization · https://coolify.io/docs/applications/deployments/docker-image · advisories do Coolify (`gh api repos/coollabsio/coolify/security-advisories`, lido em 2026-11-15) · https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency · https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments · https://developers.cloudflare.com/cache/concepts/default-cache-behavior/ · https://docs.docker.com/reference/cli/docker/buildx/imagetools/create/ · `docs/adr/0001-dominio-proprio.md` · [#18](https://github.com/ThiagoPanini/minimal-me/issues/18)

### 5.1 Tag imutável ou móvel, e como o Coolify roda a nova

O que o Coolify 4.1.0 faz numa aplicação por imagem:
- Monta a imagem como `nome:tag`, ou como `nome@sha256:<hash>` quando a tag começa com `sha256-`; em cada deploy roda `docker compose pull` e depois `up -d`. Uma tag móvel é baixada de novo a cada deploy.
- `/deploy` exige a habilidade `deploy`; ler o estado de um deploy (`GET /deployments/{uuid}`) exige `read`; mudar a tag da aplicação (`PATCH /applications/{uuid}`) exige `write`. Só `root` passa por cima de tudo (`ApiAbility.php`).
- O token é de um time e expira: as opções da v4.1.0 são 7, 30, 60, 90 ou 365 dias, com 30 de padrão.

| | Tag móvel (`production`) | Tag por commit ou digest |
|---|---|---|
| Token no GitHub | `deploy` | `write` |
| Raio de dano do token vazado | disparar deploys do time | reconfigurar qualquer aplicação do time na VPS, inclusive comando e variáveis (**inferência** de `write`) |
| Rastreio da versão | o job registra o digest promovido; a imagem também tem a tag `sha-<commit>` | a própria configuração do Coolify |
| Rollback | mover a tag de volta e chamar `/deploy` | `PATCH` para a tag anterior e `/deploy` |

A VPS hospeda outros projetos no mesmo Coolify (#18). Em 2026 o Coolify publicou dezenas de advisories, entre eles uma checagem de habilidade que deixava um token `read` alterar recursos ([GHSA-f47p-xrgc-977v](https://github.com/coollabsio/coolify/security/advisories/GHSA-f47p-xrgc-977v)), tokens sem expiração ([GHSA-c83f-5ph7-x8xv](https://github.com/coollabsio/coolify/security/advisories/GHSA-c83f-5ph7-x8xv)) e um disparo de deploy sem autenticação por webhook ([GHSA-w8wm-r924-f65v](https://github.com/coollabsio/coolify/security/advisories/GHSA-w8wm-r924-f65v)), todos corrigidos antes da 4.1.0. O menor privilégio aqui é o token `deploy` com a tag móvel. Cada build empurra `sha-<commit>` (imutável por convenção, para rastreio e rollback), e o job de deploy move `production` para o digest verificado (seção 4.4) logo antes de chamar o Coolify.

### 5.2 Ordem dos deploys

- Um grupo de `concurrency` tem "at most one running job or workflow" e, por padrão, um pendente; um novo pendente cancela o anterior. `cancel-in-progress: true` também cancela o que está rodando. A opção `queue: max` deixa até 100 pendentes, em ordem, e a página usa justamente um deploy de produção como exemplo.
- Para este caso, o grupo `production` no nível do workflow da `main`, com o padrão de um pendente e sem `cancel-in-progress` (**inferência**): os deploys saem na ordem dos pushes, um commit mais velho não sobrescreve um mais novo, e um deploy nunca é cortado entre mover a tag e rodar o smoke. O `queue: max` faria a correção crítica esperar o deploy de cada commit anterior da fila.

### 5.3 Smoke que prova a versão no ar

- O build grava a versão num arquivo servido pelo nginx, por exemplo `version.json` com o commit. A Cloudflare "does not cache HTML or JSON by default", e o #18 decidiu não cachear HTML; a resposta vem da origem (**inferência** sobre a configuração final da zona).
- O job chama `/deploy` e consulta a URL pública até o commit bater com o do workflow, com limite de alguns minutos. Com um token só `deploy`, o job não lê o estado do deploy no Coolify; a versão na URL pública é a prova que importa (**inferência**).
- Depois da versão, poucas conferências de entrega: `/` com 200, uma rota inexistente com 404 servindo o `404.html`, um arquivo de `/_next/static/` com 200 e cache longo, e o cabeçalho `Server` sem versão. Testes de conteúdo e de navegador são do #49.
- Se o health check do Coolify reprovar, o container antigo continua no ar (seção 4.2) e o smoke estoura o tempo com o commit antigo: job vermelho, sem estrago. Se a versão nova estiver no ar e uma conferência falhar, entra o rollback.

### 5.4 Rollback

- O painel de rollback do Coolify reenfileira um deploy por commit (`rollbackImage($commit)`), o que casa com as imagens de build Git, marcadas pelo commit, e não com uma aplicação que segue uma tag (**inferência** do código).
- Rollback pela esteira: o job de deploy guarda o digest que `production` apontava antes de mover; se o smoke falhar com a versão nova no ar, ele devolve a tag a esse digest (`docker buildx imagetools create`, que faz "a carbon copy" de um índice já existente no registro), chama `/deploy` e roda o smoke de novo. Uma tentativa só, e o job termina vermelho de qualquer jeito, para alguém olhar (**inferência**).
- Rollback manual: o mesmo workflow com `workflow_dispatch` e o commit desejado, que promove `sha-<commit>`. Se o Actions estiver fora, o painel do Coolify troca a tag à mão.

### 5.5 Environment `production`

- No plano Free, environments existem só em repositório público, que é o caso. Os segredos de um environment ficam disponíveis "only to workflow jobs that use the environment" e só depois que as regras passam; a opção de branches e tags restringe quem pode fazer deploy.
- Configuração: environment `production` com deploy só a partir da `main`, o token do Coolify como segredo do environment, sem revisores obrigatórios e sem espera. Revisor obrigatório quebraria "publicar é mergear", porque o Autor não aprova PRs. O zizmor tem uma auditoria para isso (`secrets-outside-env`), que aponta segredo usado fora de environment.
- O ganho: o job que instala dependências e roda o build, onde código de terceiros executa, nunca vê o token de deploy; e um branch de agente ou de robô não consegue usar o environment (**inferência** do desenho).

### 5.6 Previews por PR

- A API do Coolify aceita previews de aplicação por imagem (`pull_request_id` e `docker_tag`), e "Opening a preview or changing its tag also requires write permission". O ADR 0001 deixou hostnames de primeiro nível e o certificado de origem coringa prontos para isso.
- Para um mantenedor que não revisa PRs, e com agentes que testam contra o build de produção na CI (#49), um preview custa um container por PR na VPS e um token `write` no GitHub sem ninguém para olhar o resultado (**inferência**). Fica fora do Marco 1, como o #17 já propunha.

### 5.7 O canal do Coolify

- A VPS roda o Coolify 4.1.0, de 2026-05-18; a versão corrente é a v4.7.5, de 2026-11-10 (`gh api repos/coollabsio/coolify/releases`). Nenhum advisory publicado até 2026-11-15 atinge a 4.1.0, mas a distância cresce e o token de deploy atravessa a internet até o painel. Atualizar o Coolify afeta a frota inteira e fica fora deste ticket.
- O token expira (no máximo 365 dias). A falha é ruidosa: `/deploy` devolve 401 e o job fica vermelho.

### 5.8 O que muda com `standalone`

- Nada no desenho de entrega. Muda a porta e o caminho do health check, o limite de recursos do #18 e a urgência do caminho rápido (seção 2.7).

## 6. Exageros para este contexto

Um mantenedor, um app, repositório público, Home exportada:

- **SLSA Build Level 3** por workflow reutilizável isolado: o nível 2 do atestado padrão, verificado na promoção, já responde à única pergunta que alguém faz aqui ("esta imagem saiu da `main`?").
- **Assinatura com cosign** além do atestado do GitHub: duas assinaturas Sigstore e nenhum verificador a mais.
- **OpenSSF Scorecard** como workflow: placar que pune o desenho escolhido (zero aprovações) e repete o que zizmor, ruleset e CodeQL já cobrem.
- **harden-runner em modo de bloqueio**: lista de domínios para manter, num job que não vê o segredo de deploy; o firewall nativo do GitHub está a caminho.
- **Previews por PR**: um container e um token `write` por PR, sem revisor.
- **Revisor obrigatório ou espera no environment**: quebra "publicar é mergear".
- **OSV-Scanner** junto do Dependabot: repete dados que o GitHub já ingere desde julho de 2026, e o modo de PR exige `pull_request`.
- **`pnpm audit` como gate**: reprova PRs por advisories que eles não trouxeram.
- **Modo estrito do `minimumReleaseAge`**: aprovação manual de cada versão nova, sem ganho proporcional sobre o padrão.
- **Scan de imagem bloqueando o deploy**: pode segurar uma correção crítica por um CVE sem correção na base.
- **Imagem endurecida paga ou com login** (DHI Select ou Enterprise, Chainguard): a imagem final tem 5,74 MB de nginx e Alpine, reconstruída toda semana.
- **Imagem multiplataforma**: a VPS é amd64 (**inferência** do plano KVM do #18).
- **Checagem de licença na revisão de dependências**: um site pessoal sem distribuição de binário não tem política de licença a impor.
- **Canary, blue-green ou rollback progressivo**: o Coolify já mantém o container antigo até o novo ficar saudável, e o rollback de uma tentativa cobre o resto.
