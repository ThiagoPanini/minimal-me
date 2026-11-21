# Padrões de código

O que a revisão confere em todo PR, além do que as ferramentas já travam. Vale para pessoas e agentes.

## Idioma

Tudo o que é código tem nome em inglês; toda prosa é em português do Brasil.

- **Inglês**: todo identificador (componentes, tokens do sistema de design, variáveis, funções, tipos, classes CSS e nomes de teste) e os arquivos e diretórios que guardam código ou peças do sistema de design.
- **Português**: documentação, issues, corpo de PR, mensagens de commit, comentários, textos da interface e as notas de uso que descrevem um token ou um componente.
- **Termos do domínio**: o `GLOSSARY.md` dá a forma em inglês de cada termo, em "Em código". Use essa forma nos identificadores e o termo em português na prosa.
- **Exceção de space**: "space" (plural "spaces") é o termo do domínio na prosa, e "Spaces" é o rótulo da seção na interface. Os dois ficam em inglês, como os nomes dos spaces (Frames & Songs, Music & Feeling, Code & Share e Write & Learn). O resto da prosa e dos textos da interface fica em português.
- **Exceção dos arquivos de agente**: `AGENTS.md` e `CLAUDE.md` são escritos em inglês.
- **Exceção dos robôs**: os títulos dos PRs e os commits do Dependabot ficam em inglês, com o prefixo fixo `build(deps)` do `.github/dependabot.yml`. O commitlint solta para eles o limite de 100 caracteres do cabeçalho, que eles passam quando citam o diretório e o grupo.

## Web

`apps/web/` é a Home: Next com App Router, exportada como arquivos estáticos e servida por nginx (ADR 0005).

- **Forma**: `app/` tem as rotas e os metadados por arquivo; `components/` tem um arquivo por componente do sistema de design, com o nome dele em inglês (`Masthead.tsx`); `opening/` tem a ilustração da abertura, que a Home e a 404 usam; `spaces/` tem o catálogo dos spaces, o foco da fileira e a foto viva; `motion/` tem o movimento da página; `design-system/` é a ponte com `docs/design/system/`, lida no build, sem cópia; `e2e/` tem os testes.
- **Imports** pelos aliases `@/` (raiz de `apps/web`) e `@design-system/` (`docs/design/system/`). Um asset do sistema entra por import estático (`@design-system/assets/Brand/mark-ink.svg`), que o Next serve com hash em `/_next/static/media/`, sem cópia na web.
- **Quebras e movimento**: a largura da tela se divide só por `stacked:` (até 900px), `not-stacked:` e `narrow:` (até 760px), de `app/globals.css`. Toda transição e animação vale só com movimento (`motion-safe:` ou as variantes de movimento do `globals.css`); com movimento reduzido, a página nasce e fica no estado final. O `pnpm check` recusa as quebras arbitrárias e o `motion-reduce:transition-none`.
- **Server Component por padrão.** Componente de cliente só onde a interação pede: o foco da fileira, a foto viva, o movimento e o aviso.
- **Fora do export**: Cache Components, Server Actions, `after()`, `proxy` e a otimização de imagem sob demanda. O primeiro space com recurso de servidor reabre a forma de saída (gatilho do ADR 0005).
- **Estilo só com tokens.** O tema do Tailwind não tem paleta, famílias, raios nem curvas padrão: cores, pesos, raios e famílias saem do `tokens.json` (`bg-ground`, `font-light`, `rounded-square`), e espaços e curvas entram por variável (`ease-(--ease)`). Token novo no tema é uma linha no `@theme inline` de `app/globals.css`. Uma variável local é declarada no próprio CSS, como `[--grid-gap:...]`; sem a declaração, o build quebra.
- **Testes pela borda**: contra a imagem que vai ao ar, com seletores por papel e nome acessível, importando `test` e `expect` de `e2e/fixtures.ts`, que falha o teste em qualquer erro de console. A Home não tem teste unitário.
- **Referências visuais** (`e2e/visual.spec.ts-snapshots/`): o agente só atualiza uma quando a mudança visual é o objetivo do PR, ou quando uma versão nova do Playwright muda o desenho, e diz isso no corpo dele; nenhuma mudança visual espera o Autor. Elas se refazem só no contêiner, com `pnpm test:e2e visual.spec.ts --update-snapshots`, nunca na máquina.
- **Versões**: a estável mais nova que funcione com o resto, nunca canary, beta ou alpha. Se o pnpm recusar uma versão por `trustPolicy` (publicada com menos garantia que a anterior), fique na anterior.

## Branches, commits e PRs

- **Branch**: `tipo/slug`, com o tipo do Conventional Commits e um slug curto em português, sem acento, como `feat/marco-1`.
- **Commit**: `tipo(escopo): assunto`, em português, com o escopo opcional, como `ci: revisão de dependências no gate` ou `feat(web): abertura da Home`. O assunto pode começar por nome próprio; o corpo não tem limite de linha. O commitlint confere a mensagem no gancho `commit-msg`.
- **PR**: o título segue a mesma forma e vira o assunto do commit na `main`, no squash; o check `pr-title` o confere.

## Ganchos

O `pnpm install` instala os ganchos do git pelo lefthook (`lefthook.yml`). Eles precisam do Docker de pé.

- `pre-commit`: o Biome corrige e formata os arquivos preparados e os prepara de novo; o gitleaks procura segredos no que foi preparado.
- `commit-msg`: o commitlint confere a mensagem.
- `pre-push`: o `pnpm check` inteiro.

Quando o gitleaks acusa um segredo, tire-o do commit e troque a credencial se ela é real. Um falso positivo leva o comentário `gitleaks:allow` na própria linha.

## Workflows e ferramentas

- **Permissões**: `permissions: {}` no topo de cada workflow e, em cada job, só o que ele usa, com um comentário que diz o uso de cada permissão de escrita. Um job que só um evento usa roda só nesse evento, para não receber permissão sobrando no outro.
- **Actions** fixadas pelo `.github/workflows/actions.lock`, que guarda o commit de cada uma e atende à política de fixação por SHA do GitHub. O `uses:` cita a etiqueta semver completa (`actions/checkout@v7.0.1`), nunca uma etiqueta parcial (`@v7`) nem o SHA. Quem edita um workflow roda `gh actions-lock` (extensão `github/gh-actions-lock`) na raiz, confere o diff do lockfile como o de qualquer dependência e o inclui no mesmo commit. O `pnpm check` falha com uma action fora dessa forma ou com um workflow ou uma action fora do lockfile (`scripts/check-action-pins.mjs`).
- **Expressões** `${{ }}` entram por `env:` ou `with:`, nunca dentro de `run:`.
- **Ferramentas por imagem** (gitleaks, actionlint e zizmor) ficam no `compose.tools.yaml`, fixadas por etiqueta e digest, e rodam por `node scripts/tool.mjs <ferramenta>`, igual na máquina, nos ganchos e na CI. O digest de uma versão sai de `docker buildx imagetools inspect <imagem>:<versão>`.
- O zizmor roda com as regras padrão. Uma exceção é um `# zizmor: ignore[<regra>]` na linha, com o motivo num comentário logo acima.
