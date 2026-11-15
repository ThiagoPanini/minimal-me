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
