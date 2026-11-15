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
