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
