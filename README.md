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
| `.github/workflows/` | A esteira: o `ci`, que vira o check `gate` e publica a imagem na `main`, o `pr-title` e o `actions.lock`, que fixa as actions de todos os workflows. |
| `lefthook.yml`, `compose.tools.yaml` e `scripts/` | Os ganchos do git e as ferramentas que rodam de imagem Docker (gitleaks, actionlint e zizmor), iguais na máquina e na CI. |
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
| `pnpm check` | Biome em modo CI; actionlint, zizmor e a fixação das actions pelo `actions.lock`; e a checagem de tipos (`next typegen && tsc --noEmit`). |
| `pnpm test:e2e` | Constrói a imagem da Home, sobe-a no Docker Compose com o contêiner oficial do Playwright e roda os testes contra ela. Precisa do Docker de pé. |
| `pnpm verify` | Os dois acima, nessa ordem. Rode antes de abrir ou atualizar um PR. |

No `pnpm test:e2e`, o Playwright roda em Chromium a 390 e a 1440 de largura e, num subconjunto, em WebKit com o iPhone 13. Cada worktree sobe o próprio projeto do Compose, sem porta no host, então vários worktrees testam ao mesmo tempo. Argumentos extras vão para o `playwright test`, como em `pnpm test:e2e --grep 404`.

## Como a CI valida

Todo PR roda a validação inteira, sem filtro de caminho, e o resultado vira dois checks:

| Check | O que exige |
|---|---|
| `gate` | `success` nos mesmos três jobs do workflow `ci`, no PR e na `main`: `quality`, que roda o `pnpm check` e o gitleaks nos commits do PR; `dependency-review`, que falha com vulnerabilidade alta ou crítica trazida pelo PR, no escopo `runtime`; e `e2e`, que roda o `pnpm test:e2e` contra a imagem. O `e2e` só roda depois do job que constrói a imagem do evento: `image` no PR e `publish` na `main`. Um job que falha, é pulado ou é cancelado deixa o `gate` vermelho. |
| `pr-title` | O título do PR em Conventional Commits, conferido pelo commitlint com o `commitlint.config.mjs`. No squash, o título vira o assunto do commit na `main`. |

No PR, o `image` constrói a imagem e ela é testada sem ir ao registro, sem nenhuma permissão de escrita. Na `main`, o `publish` a constrói uma vez e a publica no GHCR como `ghcr.io/thiagopanini/minimal-me/web:sha-<commit>`, com proveniência, SBOM e atestado, e o e2e roda contra esse digest. Uma rodada nova do mesmo PR cancela a anterior; na `main`, nenhuma rodada é cancelada.

Para testar uma imagem pronta em vez de construir uma, como faz a CI, passe a imagem em `WEB_IMAGE`, como em `WEB_IMAGE=ghcr.io/thiagopanini/minimal-me/web:sha-$(git rev-parse HEAD) pnpm test:e2e`. A imagem precisa ser do commit em que você está, porque um teste confere o commit no `version.json`.

## Licença

O código está sob a licença MIT. Textos, ilustrações, fotos e a marca têm todos os direitos reservados. As fontes seguem a SIL Open Font License. Os detalhes estão em `LICENSE`.
