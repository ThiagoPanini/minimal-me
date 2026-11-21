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
| `docs/` | Brief, ADRs, sistema de design e o protótipo do MVP. |

## Como rodar

A máquina só precisa de Node 24, pnpm e Docker. A versão do pnpm vem do campo `packageManager` do `package.json`: um pnpm 11 ou mais novo troca sozinho para ela. As demais ferramentas são pacotes do projeto.

```sh
pnpm install
pnpm --filter web dev
```

O servidor de desenvolvimento abre em `http://localhost:3000`. Em produção não há servidor do Next: `pnpm --filter web build` gera o export em `apps/web/out/`.

## Como verificar

| Comando | O que faz |
|---|---|
| `pnpm check` | Biome em modo CI e a checagem de tipos (`next typegen && tsc --noEmit`). |
| `pnpm test:e2e` | Constrói a imagem da Home, sobe-a no Docker Compose com o contêiner oficial do Playwright e roda os testes contra ela. Precisa do Docker de pé. |
| `pnpm verify` | Os dois acima, nessa ordem. Rode antes de abrir ou atualizar um PR. |

No `pnpm test:e2e`, o Playwright roda em Chromium a 390 e a 1440 de largura e, num subconjunto, em WebKit com o iPhone 13. Cada worktree sobe o próprio projeto do Compose, sem porta no host, então vários worktrees testam ao mesmo tempo. Argumentos extras vão para o `playwright test`, como em `pnpm test:e2e --grep 404`.

## Licença

O código está sob a licença MIT. Textos, ilustrações, fotos e a marca têm todos os direitos reservados. As fontes seguem a SIL Open Font License. Os detalhes estão em `LICENSE`.
