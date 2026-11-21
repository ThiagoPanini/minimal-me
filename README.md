# Minimal Me

Minimal Me é um hub pessoal e público, de um só Autor, organizado em quatro spaces: Frames & Songs, Music & Feeling, Code & Share e Write & Learn. A Home apresenta os quatro e o Status de cada um, e vai ao ar em `minimalme.dev`.

O que o produto é está em `docs/brief.md`; o vocabulário, em `GLOSSARY.md`; a identidade visual, em `docs/design/`; as decisões de arquitetura, em `docs/adr/`.

## O que há aqui

| Caminho | O que é |
|---|---|
| `apps/web/` | A Home: Next com App Router, exportada como arquivos estáticos e servida por nginx numa imagem de contêiner (ADR 0005). |
| `apps/web/design-system/` | A ponte com o sistema de design: lê tokens e fontes de `docs/design/system/` no build, sem copiar nada. |
| `apps/web/Dockerfile` e `apps/web/nginx/` | A imagem que vai ao ar: o build do Next e o nginx com cache, compressão, 404 e cabeçalhos de segurança. |
| `apps/web/e2e/` | Os testes Playwright, que rodam contra essa imagem. |
| `.github/workflows/` | A esteira: o `ci`, que vira o check `gate`, publica a imagem na `main` e a põe no ar; o `pr-title`; o `rollback`, que volta a Home a um commit; o `auto-merge` e o `retry`, dos PRs do Dependabot; e o `actions.lock`, que fixa as actions de todos os workflows. |
| `.github/dependabot.yml` | As atualizações de dependências (ver "Como as dependências se atualizam"). |
| `scripts/delivery/` | A entrega e o smoke (ver "Como publicar e voltar uma versão"). |
| `scripts/retry/` | A nova tentativa diária do que falhou nos PRs de robô e na `main`. |
| `lefthook.yml`, `compose.tools.yaml` e `scripts/` | Os ganchos do git e as ferramentas que rodam de imagem Docker (gitleaks, actionlint e zizmor), iguais na máquina e na CI. |
| `scripts/author-setup/` | O roteiro da preparação única do Autor (ver "Preparação única do Autor"). |
| `CODING_STANDARDS.md` | Os padrões que a revisão confere: idioma, web, branches, commits, ganchos e workflows. |
| `docs/` | Brief, ADRs, sistema de design e o protótipo do MVP. |

## Como rodar

A máquina só precisa de Node 24, pnpm e Docker. A versão do pnpm vem do campo `packageManager` do `package.json`: um pnpm 11 ou mais novo troca sozinho para ela. As demais ferramentas são pacotes do projeto ou imagens Docker fixadas por digest no `compose.tools.yaml`. O `pnpm install` também instala os ganchos do git, descritos em `CODING_STANDARDS.md`.

```sh
pnpm install
pnpm --filter web dev
```

O servidor de desenvolvimento abre em `http://localhost:3000`. Em produção não há servidor do Next: `pnpm --filter web build` gera o export em `apps/web/out/`.

## Como verificar

| Comando | O que faz |
|---|---|
| `pnpm check` | Biome em modo CI; actionlint, zizmor e a fixação das actions pelo `actions.lock`; os testes dos scripts da raiz (`pnpm test:scripts`); e a checagem de tipos (`next typegen && tsc --noEmit`). |
| `pnpm test:e2e` | Constrói a imagem da Home, sobe-a no Docker Compose com o contêiner oficial do Playwright e roda os testes contra ela. Precisa do Docker de pé. |
| `pnpm verify` | Os dois acima, nessa ordem. Rode antes de abrir ou atualizar um PR. |

No `pnpm test:e2e`, o Playwright roda em Chromium a 390 e a 1440 de largura e, num subconjunto, em WebKit com o iPhone 13. No mesmo contêiner, o Lighthouse mede a primeira visita a 390px, com fator de escala 3 e Slow 4G simulado: o peso trava em 1.000.000 bytes transferidos, e a mediana do LCP em cinco rodadas só aparece na saída. A regressão visual compara a Home e a 404 às capturas de referência de `apps/web/e2e/visual.spec.ts-snapshots/`, que só se refazem no contêiner (ver `CODING_STANDARDS.md`). Cada worktree sobe o próprio projeto do Compose, sem porta no host, então vários worktrees testam ao mesmo tempo. Argumentos extras vão para o `playwright test`, como em `pnpm test:e2e --grep 404`.

## Como a CI valida

Todo PR roda a validação inteira, sem filtro de caminho, e o resultado vira dois checks:

| Check | O que exige |
|---|---|
| `gate` | `success` nos mesmos três jobs do workflow `ci`, no PR e na `main`: `quality`, que roda o `pnpm check` e o gitleaks nos commits do PR; `dependency-review`, que falha com vulnerabilidade alta ou crítica trazida pelo PR, no escopo `runtime`; e `e2e`, que roda o `pnpm test:e2e` contra a imagem. O `e2e` só roda depois do job que constrói a imagem do evento: `image` no PR e `publish` na `main`. Um job que falha, é pulado ou é cancelado deixa o `gate` vermelho. |
| `pr-title` | O título do PR em Conventional Commits, conferido pelo commitlint com o `commitlint.config.mjs`. No squash, o título vira o assunto do commit na `main`. |

No PR, o `image` constrói a imagem e ela é testada sem ir ao registro, sem nenhuma permissão de escrita. Na `main`, o `publish` a constrói uma vez e a publica no GHCR como `ghcr.io/thiagopanini/minimal-me/web:sha-<commit>`, com proveniência, SBOM e atestado, e o e2e roda contra esse digest. Uma rodada nova do mesmo PR cancela a anterior; na `main`, nenhuma rodada é cancelada.

Para testar uma imagem pronta em vez de construir uma, como faz a CI, passe a imagem em `WEB_IMAGE`, como em `WEB_IMAGE=ghcr.io/thiagopanini/minimal-me/web:sha-$(git rev-parse HEAD) pnpm test:e2e`. A imagem precisa ser do commit em que você está, porque um teste confere o commit no `version.json`.

## Como publicar e voltar uma versão

Publicar é mesclar. Na `main`, depois do `gate`, o job `deploy` do `ci` põe no ar o mesmo digest que passou nos testes. Ele roda no environment `production` do GitHub, que guarda o histórico de deploys, cada um com o commit, e faz isto pelo `scripts/delivery/deliver.mjs`:

1. confere o atestado do digest com o `gh attestation verify`, exigindo que ele venha do `ci` da `main` e do commit que vai ao ar;
2. aponta a tag `production` da imagem no GHCR para esse digest;
3. chama o `/deploy` do Coolify, que puxa a tag `production` e troca o contêiner;
4. roda o smoke contra `https://minimalme.dev`: espera o `version.json` mostrar o commit novo, por até 10 minutos, e confere a Home com 200, uma rota inexistente com 404 servindo o `404.html`, um arquivo de `/_next/static/` com cache longo e o cabeçalho `Server` sem versão.

Se o `/deploy` ou o smoke falham, o job devolve `production` ao digest que estava no ar, chama o `/deploy` de novo e termina vermelho, com o que falhou e o que o rollback fez na anotação da rodada. Na primeira entrega não há digest anterior, e o job só termina vermelho.

Para voltar a Home a um commit, rode o workflow `rollback` pela `main` com o SHA completo de um commit que a `main` já publicou:

```sh
gh workflow run rollback.yml --ref main -f commit=$(git rev-parse <commit>)
gh run list --workflow rollback.yml --limit 1
```

O rollback passa pelos mesmos passos, com o digest da imagem `sha-<commit>`, e também volta ao que estava no ar se o smoke falhar. Ele fica até o próximo merge na `main`, que publica de novo. A entrega e o rollback dividem o grupo de concurrency `production`: um por vez, com no máximo um esperando, e nenhum cancelado no meio.

O que a entrega lê do environment `production`, restrito à `main`, sem revisor nem espera:

| Nome | Tipo | O que é |
|---|---|---|
| `COOLIFY_TOKEN` | segredo | O token de API do Coolify com a permissão `deploy`, gravado pelo roteiro da preparação única. |
| `COOLIFY_APP_UUID` | variável | O UUID da aplicação da Home no Coolify, que nasce na operação do primeiro deploy. |

Até os dois existirem, a entrega confere o atestado e termina vermelha dizendo o que falta, sem mexer na tag. Os jobs que instalam dependências nunca veem o token: a entrega e o rollback não instalam pacotes, e o smoke e a entrega usam só o Node e os binários do runner.

O smoke também roda à mão contra qualquer URL, e no `pnpm test:e2e` contra a imagem local:

```sh
node scripts/delivery/smoke.mjs --url https://minimalme.dev --commit <sha de 40 caracteres>
```

## Como as dependências se atualizam

Ninguém atualiza dependência à mão. Toda segunda, às 6h de Brasília, o Dependabot abre um PR por ecossistema com as atualizações patch e minor das versões publicadas há pelo menos 3 dias, e um PR para cada major. Os ecossistemas são o npm, as actions dos workflows, as imagens do `apps/web/Dockerfile` e as das ferramentas no `compose.tools.yaml`. As atualizações de segurança chegam sem esperar, uma por PR. Os títulos ficam em inglês, com o prefixo `build(deps)`, como exceção de robô à regra de idioma, e passam no `pr-title` como qualquer outro.

- **Merge automático**: o workflow `auto-merge` liga o auto-merge em squash de todo PR que o Dependabot abre, e o GitHub o mescla quando o `gate` e o `pr-title` passam, inclusive major. Quem liga é o GitHub App do Autor, com o token dele, porque um merge pelo `GITHUB_TOKEN` não dispararia o `ci` da `main` nem a entrega. A exceção é a major do Node, que fica no 24 até o Next suportar o 26: o Dependabot não a pede, nem para a imagem `node` nem para os tipos `@types/node`, e o `auto-merge` não a mescla.
- **Nova tentativa**: todo dia, às 7h37 de Brasília, o workflow `retry` roda de novo os jobs que falharam na rodada mais recente de cada workflow dos PRs abertos por robô e na ponta da `main`, até três novas tentativas por rodada. Cobre a falha passageira e o PR de segurança barrado pela maturidade de um dia do pnpm. O que continua vermelho fica para a ronda do agente no começo da sessão (`AGENTS.md`). Para rodar à mão: `gh workflow run retry.yml --ref main`.

O `auto-merge` lê o Client ID e a chave privada do App dos segredos do Dependabot `MERGE_APP_CLIENT_ID` e `MERGE_APP_PRIVATE_KEY`, gravados pelo roteiro da preparação única. Até eles existirem, o `auto-merge` termina vermelho ao gerar o token, e os PRs do Dependabot esperam um merge.

## Preparação única do Autor

Os passos que só o Autor faz, porque exigem a conta dele, estão num roteiro guiado em `scripts/author-setup/`. Ele roda numa sessão só, depois do merge do Marco 1 na `main` e da operação que liga a esteira (#74):

```sh
pnpm author-setup           # guia os passos que faltam, um por tela, e confere cada um
pnpm author-setup --check   # só confere: lista exatamente o que falta e não muda nada
pnpm author-setup --plan    # o duplo cheque: por que cada passo é do Autor e o que o agente faz
```

São sete passos: o token do Coolify no environment `production`; o GitHub App do merge automático, criado por um formulário já preenchido e instalado só neste repositório; o pacote do GHCR público; os alertas de malware do Dependabot; a atualização automática semanal do Coolify; o Origin Certificate na configuração dinâmica do Traefik; e o login OAuth dos MCPs remotos. Rodar de novo mostra só o que falta.

O roteiro precisa do `gh` logado e, para conferir o login dos MCPs, do comando `claude`. Nenhum segredo passa pelo repositório, pelas issues nem pela saída do roteiro: o que é segredo se digita sem eco e vai direto para o segredo de destino pelo `gh secret set`, a chave do App vai do GitHub para os segredos do Dependabot sem aparecer, e a chave do Origin Certificate nasce e fica na VPS. As confirmações do que nenhuma API lê ficam em `~/.local/state/minimal-me/author-setup.json`, fora do repositório e sem segredo.

## Licença

O código está sob a licença MIT. Textos, ilustrações, fotos e a marca têm todos os direitos reservados. As fontes seguem a SIL Open Font License. Os detalhes estão em `LICENSE`.
