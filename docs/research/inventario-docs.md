# Inventário: panlabs-docs (Docusaurus) e campfire/docs (Mintlify)

Pesquisa do ticket [#6](https://github.com/ThiagoPanini/minimal-me/issues/6), parte de #1. Fatos para a escolha da ferramenta de documentação do wayfinder, sem recomendação. Cada afirmação cita o caminho do arquivo (relativo à raiz do repositório indicado) ou a URL.

## Retomada

**Estado**: **completo** (pesquisa encerrada em 2026-11-07; resta só o comentário na issue e o fechamento, feitos pelo mesmo agente).

| Seção | Estado |
|---|---|
| 1. panlabs-docs: ferramenta e versões | coberto |
| 2. panlabs-docs: configuração (`docusaurus.config.js`) | coberto |
| 3. panlabs-docs: sidebars e modelo de conteúdo | coberto |
| 4. panlabs-docs: pastas (`content/`, `docs/`, `contracts/`, `src/`, `static/`, `.design-sync/`, `ds-bundle/`) | coberto |
| 5. panlabs-docs: documentos de agentes (`CONTEXT.md`, `DECISIONS.md`, `AGENTS.md`, `CLAUDE.md`) e convenções de escrita | coberto |
| 6. panlabs-docs: CI, deploy e custo | coberto |
| 7. campfire/docs: ferramenta, `docs.json` e navegação | coberto |
| 8. campfire/docs: páginas `.mdx`, `.mintignore`, convenções | coberto |
| 9. campfire/docs: publicação, CI, custo e plano | coberto |
| 10. Quadro comparativo de fatos | coberto |
| Comentário na issue e fechamento | coberto |

**Onde continuar**: nada pendente. Se o campfire ganhar deploy no Mintlify ou o `develop` for promovido, a seção 9 (estado da publicação) e a contagem de páginas da seção 7 ficam defasadas.

## 1. panlabs-docs: ferramenta e versões

Repositório `ThiagoPanini/panlabs-docs`, branch `main`, último commit local `d344c81 chore: improve landing page (#193)` (`git log` em `/home/paninit/workspaces/panlabs-docs`). Pastas `node_modules/`, `build/`, `.docusaurus/` e `tmp/` ignoradas nesta leitura.

| Fato | Valor | Fonte |
|---|---|---|
| Gerador | Docusaurus, preset `classic` | `package.json` → `dependencies["@docusaurus/core"]`, `["@docusaurus/preset-classic"]` |
| Versão do Docusaurus | **3.10.2**, fixada sem `^` (core, preset, `module-type-aliases`, `types`) | `package.json`; confirmado em `package-lock.json` linhas 3488-3489 (`"node_modules/@docusaurus/core": {"version": "3.10.2"`) |
| React | `^19.0.0` (`react`, `react-dom`) | `package.json` |
| MDX | `@mdx-js/react ^3.0.0` (MDX 3) | `package.json` |
| Outras dependências | `clsx ^2`, `prism-react-renderer ^2.3`, `lucide-static 1.30.0` (fixada; fonte dos ícones da sidebar) | `package.json` |
| Node exigido | `engines.node: ">=20.0"`; não há `.nvmrc`, `.node-version`, `.tool-versions` nem `mise.toml` na raiz | `package.json`; `ls` da raiz |
| Node no CI | `actions/setup-node@v4` com `node-version: 22`, `cache: npm` (ver seção 6) | `.github/workflows/ci.yml`, `.github/workflows/deploy.yml` |
| Node na máquina local | `v24.18.0` | `node --version` |
| Gerenciador de pacotes | npm, `package-lock.json` com `lockfileVersion: 3`; README manda `npm ci` | `package-lock.json` linha 4; `README.md` seção "Run" |
| Scripts | `start`, `build`, `serve`, `swizzle`, `clear`, `write-heading-ids`, `generate:reference`; `prebuild` e `prestart` rodam `node scripts/generate-reference.mjs` | `package.json` → `scripts` |
| Blog | desligado (`blog: false`) | `docusaurus.config.js` linha 164 |
| Pacote | `"private": true`, `"version": "0.0.0"` | `package.json` |
| Browserslist | produção `>0.5%, not dead, not op_mini all`; dev últimas 3 Chrome/Firefox, 5 Safari | `package.json` → `browserslist` |

Restrições travadas pelo próprio projeto: "Docusaurus is non-negotiable"; "a new npm dependency lands only for new capability" (`README.md` seção "Locked constraints"; `AGENTS.md` seção "What not to do").

## 2. panlabs-docs: configuração (`docusaurus.config.js`)

Arquivo único de 445 linhas, ESM (`export default config`), com `// @ts-check` e comentários longos que justificam cada chave (`docusaurus.config.js`). Regra que atravessa o arquivo: "NO color value enters here" (linhas 6-8); o tema do Prism é um *shim* que só referencia `var(--pd-code-*)` (linhas 28-63).

**Identidade e hospedagem** (linhas 88-95): `title: 'panlabs'`, `tagline: 'O acervo de aprendizado de um desenvolvedor'`, `url: 'https://thiagopanini.github.io'`, `baseUrl: '/panlabs-docs/'`, `organizationName: 'ThiagoPanini'`, `projectName: 'panlabs-docs'`. Comentário: "GitHub Pages, this repository's own" (linha 91).

**URLs e links quebrados**:
- `trailingSlash: false` (linha 115), com quatro razões documentadas (linhas 97-114): preserva a convenção de anexar `.md` à URL, colapsa permalink e rota, não quebra o link `llms.txt` do rodapé, `static/` é imune de qualquer jeito.
- `onBrokenLinks: 'throw'`, `onBrokenAnchors: 'throw'`, `markdown.hooks.onBrokenMarkdownLinks: 'throw'` (linhas 117-127). Consequência declarada: toda âncora citada é declarada com `{#id}` no heading (linhas 120-121).
- `future.v4` fica desligado de propósito para não ativar `useCssCascadeLayers` (linhas 129-132).

**Locale**: `i18n.defaultLocale: 'pt-BR'`, `locales: ['pt-BR']`; sem pasta `i18n/`, sem dropdown (linhas 141-144).

**Preset classic** (linhas 146-212):
- `docs`: `path: 'content/jornadas'`, `routeBasePath: 'jornadas'`, `sidebarPath: './sidebars-jornadas.js'`. Comentário: "The collection lives in `content/`, not `docs/`: `docs/` is this repository's OWN documentation, the one agents read" (linhas 151-159).
- `blog: false` (linha 164).
- `svgr.svgrConfig.svgoConfig`: desliga `removeTitle`, `removeViewBox`, `moveElemsAttrsToGroup`, `convertColors` para que `.drawio.svg` importados sejam pintados por seletor de atributo (linhas 165-198).
- `theme.customCss`: cinco arquivos em ordem, `tokens.css`, `custom.css`, `chrome.css`, `components.css`, `focus.css` (linhas 199-209).

**Plugins** (linhas 218-275):
- Três instâncias extras de `@docusaurus/plugin-content-docs`, uma por aba: `id: 'procedures'` → `content/procedimentos` → `/procedimentos`; `id: 'tools'` → `content/ferramentas` → `/ferramentas`; `id: 'teams'` → `content/times` → `/times`. Cada uma com seu `sidebarPath`. Razão: "`routeBasePath` is per instance" (linhas 214-217).
- Quatro plugins locais, nenhum do npm: `./src/plugins/sidebar-icons` (resolve slug Lucide e emite CSS mask), `./src/plugins/diagram-tabs` (escolhe a aba de um `.drawio.svg` via `?aba=<slug>`; em `build` só verifica, os desenhos gerados são commitados), `./src/plugins/search` e `./src/plugins/ai-era`, ambos recebendo `{tabs: TABS}` (linhas 250-274). Não há Algolia nem serviço externo de busca: "Neither is an npm dependency or an external service" (linhas 264-266).
- `TABS = ['tools', 'default', 'procedures', 'teams']` é a fonte única da ordem das abas, usada pela navbar, pelo desempate da busca e pela ordem de seções do `llms.txt` (linhas 65-81).

**`clientModules: ['./src/clientModules/lightbox.js']`** para o lightbox de diagramas (linhas 277-290).

**`themeConfig`** (linhas 292-442):
- `colorMode`: `defaultMode: 'dark'`, `respectPrefersColorScheme: true`, `disableSwitch: false`.
- `navbar.title: 'panlabs'` sem `logo`; itens: um `type: 'html'` com `value: '<!--quebra-->'` que quebra a linha da faixa de abas (linhas 325-345), quatro `type: 'docSidebar'` (Ferramentas, Jornadas, Procedimentos, Times), `{type: 'search', position: 'right'}` e link GitHub.
- `footer`: sem `style`, `links` lista plana com dois itens, `Changelog` e `llms.txt` (`href: 'pathname:///llms.txt'`, `target: '_self'`), `copyright: '© 2026 panlabs'` (linhas 395-431). "The company is NEVER named, and the developer has NO name either" (linhas 409-411).
- `prism`: `theme: temaPrism`, `additionalLanguages: ['bash']` (linhas 432-441).

## 3. panlabs-docs: sidebars e modelo de conteúdo

### Os seis arquivos

| Arquivo | Exporta | Papel | Fonte |
|---|---|---|---|
| `sidebars-ferramentas.js` | `{tools: [...]}` | Aba Ferramentas, instância `tools`; a única árvore que colapsa | linhas 9-17 |
| `sidebars-jornadas.js` | `{journeys: [...]}` | Aba Jornadas, instância `default`; placeholder de uma jornada com três seções | linhas 5-13 |
| `sidebars-procedimentos.js` | `{procedures: [...]}` | Aba Procedimentos; uma única folha `work-in-progress` | linhas 5-18 |
| `sidebars-times.js` | `{teams: [...]}` | Aba Times; uma única folha `work-in-progress` | linhas 5-18 |
| `sidebars-referencia.js` | `referencia` (array de itens, fragmento) | GERADO por `scripts/generate-reference.mjs` a partir de `contracts/overpower.json`; "Edit the contract, not this file" | linhas 5-8 |
| `sidebars-icons.js` | `icon(slug)` → `{className: 'sidebar-icon sidebar-icon--<slug>'}` | Helper único de ícone; o plugin `src/plugins/sidebar-icons` resolve o slug contra `lucide-static` e quebra o build se não existir | linhas 3-13 |

### O que os sidebars expressam

- **Listas explícitas, nunca `autogenerated`**: com lista explícita, `sidebar_position` do front matter é ignorado (`sidebars-jornadas.js` linhas 8-10). Não existe nenhum `_category_.json` em `content/` (`find content -name '_category_.json'` retornou vazio).
- **Separador**: nó de topo é `type: 'category'`, `collapsible: false`, sem `link` e sem ícone; "a top node is a plain heading — no link, no caret" (`sidebars-ferramentas.js` linhas 19-26; `CONTEXT.md` verbete "Separator"; `DECISIONS.md#a-sidebar-category-is-not-a-destination`).
- **Ícone em tudo abaixo do separador**, folha ou grupo, via `...icon('<slug lucide>')` (`sidebars-jornadas.js` linhas 26-30).
- **Folha de abertura com `slug: /`** para a raiz de cada instância responder 200 sem redirect (`sidebars-ferramentas.js` linhas 36-38; `sidebars-procedimentos.js` linhas 15-17).
- **Profundidade**: máximo 4 níveis, confinado a `Ferramentas › Bibliotecas › overpower › Comandos`; nada mais passa de nível 2 (`sidebars-ferramentas.js` linhas 10-13, 31-40). Jornadas tem profundidade 3: separador, seção, folha (`sidebars-jornadas.js` linhas 25-28).
- **Ferramentas**: quatro separadores, `Bibliotecas` (com `overpower` → `visao-geral`, `instalacao`, `conceitos`, `Comandos` gerados, `Alvos`, `Referência`, `Contribuir`), `Módulos Terraform` (2 folhas), `Skills` (2), `Servidores MCP` (1) (`sidebars-ferramentas.js` linhas 18-139).
- **Jornadas**: separador `API Owner` → `Visão Geral` (2 folhas), `Conteúdo Teórico` (1), `Conteúdo Prático` (1) (`sidebars-jornadas.js` linhas 19-60).

### Modelo de conteúdo

- **Quatro abas = quatro instâncias de `plugin-content-docs`**, um para um, "because `routeBasePath` and versioning are per instance" (`CONTEXT.md` verbete "Tab"). O eixo de navegação é a natureza do conteúdo (`docusaurus.config.js` linhas 347-349).
- **Inventário de `content/`**: 33 `.md`, 4 `.mdx`, 6 `.svg` (`find content -type f`). Os 4 `.mdx` são exatamente as páginas geradas de comando (`content/ferramentas/bibliotecas/overpower/comandos/{overpower,list,install,doctor}.mdx`); todo o conteúdo autoral é `.md`.
- **Diagramas**: fonte `.drawio.svg` ao lado da página (ex.: `content/ferramentas/bibliotecas/overpower/contribuir/fluxo-de-uma-invocacao.drawio.svg`) e render por aba commitado (`fluxo-de-uma-invocacao.fluxo-de-uma-invocacao.svg`); três modelos na raiz de `content/` com prefixo `_` (`_modelo.drawio.svg`, `_diagrama-abas.drawio.svg`, `_diagrama-grande.drawio.svg`).
- **Jornada** é "a role the author put on — not a topic", com começo, meio e lição (`CONTEXT.md` verbete "Jornada").
- **Page type** é convenção de conteúdo, nunca de layout: "no type owns its own CSS, front matter, or component. Each has a template" (`CONTEXT.md` verbete "Page type"). Tipos citados nos sidebars: `Receita` ("minimal-prose, maximal-code fixture", `sidebars-ferramentas.js` linha 126).
- **Subtítulo = `description` do front matter**, obrigatório: "a missing `description` breaks the build" (`CONTEXT.md` verbete "Subtitle").
- **Componentes de conteúdo**: catálogo fechado de dezesseis, registrados globalmente em `@theme/MDXComponents`; "no content file imports anything, and there's no escape hatch" (`CONTEXT.md` verbete "Content component"; `AGENTS.md` tabela "Rules nothing charges"). Lista em `src/theme/MDXComponents/index.js` (ver seção 4).
- **Referência gerada de contrato**: `contracts/overpower.json` → `prebuild` → páginas `.mdx` de comando + `sidebars-referencia.js` (`AGENTS.md` seção "What the machine charges"; `package.json` → `prebuild`).

## 4. panlabs-docs: pastas

Inventário por `find <pasta> -type f` em `/home/paninit/workspaces/panlabs-docs`, cruzado com `git ls-files` e `git check-ignore -v` para separar o que é versionado do que é gerado.

| Pasta | O que é | Versionada? | Fonte |
|---|---|---|---|
| `content/` | O acervo publicado: `jornadas/`, `procedimentos/`, `ferramentas/`, `times/` (uma subpasta por aba). 43 arquivos: 33 `.md`, 4 `.mdx`, 6 `.svg`. Detalhe na seção 3. | sim | `README.md` tabela "Where things live"; `find content -type f` |
| `docs/` | Documentação **deste repositório**, para agentes; não entra no build. Quatro arquivos: `docs/agents/{domain,issue-tracker,triage-labels,workflow}.md`. "`docs/` é a documentação deste repositório e não entra no build: o site sai de `content/`." | sim | `docs/agents/domain.md` linha 27; `docusaurus.config.js` linhas 153-155 |
| `contracts/` | Um arquivo, `contracts/overpower.json`: contrato de assinatura (`"contract": "signature"`, `"version": 2`, `"citesToolOutput": true`) com `labels` em pt-BR e `entries` (aplicação + comandos `list`, `install`, `doctor`). Fonte das quatro páginas `.mdx` de comando e do `sidebars-referencia.js`. | sim | `contracts/overpower.json` linhas 1-40; `scripts/generate-reference.mjs` linhas 1-26 |
| `scripts/` | `generate-reference.mjs` (lê, valida e escreve as 4 páginas + fragmento de sidebar; roda em `prebuild`/`prestart`) e `lib/{signature,drawio,drawio-render}.mjs`. | sim | `find scripts`; `package.json` → `scripts.prebuild` |
| `src/` | 38 arquivos. `clientModules/lightbox.js`; `components/` (11 componentes JS + `catalog.module.css`); `css/` (`tokens.css`, `custom.css`, `chrome.css`, `components.css`, `focus.css`); `icons/registry.js` (gerado a cada build, gitignored); `pages/` (`index.js`, `index.module.css`, `hero-panlabs.jpg`: a landing em `/`); `plugins/` (`ai-era/`, `diagram-tabs/`, `search/`, `sidebar-icons/`, `pages.js` compartilhado); `theme/` (`Admonition/Types.js`, `MDXComponents/{index.js,CommandPanel.js,CopyPage.js,line.mjs}`, `SearchBar/`). | sim, exceto `src/icons/registry.js` | `find src -type f`; `.gitignore` linha "`/src/icons/registry.js`" |
| `static/` | Só quatro arquivos: `fonts/Inter-Variable.woff2`, `fonts/PaperMono-Variable.woff2`, `fonts/OFL.txt`, `icons/LICENSE.txt` (copiado do `lucide-static` a cada build). Fontes auto-hospedadas; nenhuma imagem. | sim | `find static -type f`; `README.md` linha de `static/icons/` |
| `.design-sync/` | Insumos que publicam o catálogo de componentes no claude.ai/design: `config.json` (`"shape": "package"`, `"buildCmd": "node .design-sync/build-dist.mjs"`, `componentSrcMap` com 14 componentes + `ThemeRoot` como provider, `dtsPropsFor` transcrito à mão), `build-dist.mjs`, `entry.js`, `conventions.md` (`readmeHeader`), `NOTES.md`, `docs/` (14 `.md`, um por componente), `previews/` (14 `.tsx`), `shims/`. `.cache/` e `learnings/` gitignored. 35 arquivos rastreados. | parcial | `.design-sync/config.json`; `.design-sync/NOTES.md`; `AGENTS.md` tabela "Where things live"; `git ls-files .design-sync`; `.gitignore` linhas 39-44 |
| `ds-bundle/` | **Saída gerada** do design-sync, inteiramente gitignored (0 arquivos rastreados): `_ds_bundle.{css,js}`, `components/<categoria>/<Nome>/{.jsx,.d.ts,.html,.prompt.md}` (categorias `disclosure`, `highlight`, `presentation`, `reference`, `sequence`), `_preview/`, `_screenshots/`, `_vendor/react*.js`, `README.md` (cópia de `conventions.md`). `.ds-build-meta.json`: `"namespace": "PanlabsDocs"`, `"componentCount": 14`, `"provider": "ThemeRoot"`. | não | `.gitignore` linha 40 (`ds-bundle/`); `git ls-files ds-bundle` = 0; `ds-bundle/.ds-build-meta.json` |
| `.ds-sync/` | Conversor em *staging* do design-sync; gitignored. | não | `.gitignore` linha 39 e comentário "design-sync: staged converter, regenerated bundle, machine state" |
| `.claude/` | `rules/{conteudo,css-tokens,swizzle-theme}.md`, cada um com front matter `paths:` que o escopa a globs (`content/**/*.md`, `src/css/*.css`, `src/theme/**`). `settings.local.json` e `worktrees/` gitignored. | parcial | `.claude/rules/*.md` linhas 1-7; `.gitignore` seção "agentes" |
| `.github/` | Só `workflows/ci.yml` e `workflows/deploy.yml`. Sem templates de issue/PR, sem `dependabot.yml`. | sim | `find .github -type f` |
| `build/`, `.docusaurus/`, `tmp/`, `node_modules/` | Saída de build, cache, temporários, dependências. | não | `.gitignore` |

Duas observações para a escolha da ferramenta:
- O repositório carrega **dois produtos**: o site (Docusaurus) e um design system publicável (`.design-sync/` → `ds-bundle/`), e o segundo existe porque o catálogo de componentes MDX do site é também um design system para o claude.ai/design (`.design-sync/NOTES.md` linhas 1-4: "`panlabs-docs` não é uma biblioteca de componentes: é um site Docusaurus com um design system dentro").
- O catálogo de componentes de conteúdo replica nomes do Mintlify: `Accordion`, `AccordionGroup`, `Callout`, `Card`, `CardGroup`, `CodeGroup`, `Expandable`, `Frame`, `Icon`, `ParamField`, `ResponseField`, `Steps`, `Step`, `Table`, `Update`, mais `Tabs`/`TabItem` do Docusaurus (`src/theme/MDXComponents/index.js` linhas 49-67). O glossário diz por quê: o **Anchor** visual é "**Mintlify**, in the `mint` theme, with **Devin** as its one reference — the system panlabs-docs inherits by default" (`CONTEXT.md` verbete "Anchor").

## 5. panlabs-docs: documentos de agentes e convenções de escrita

### Os quatro documentos de topo

| Arquivo | Idioma | Conteúdo | Fonte |
|---|---|---|---|
| `CLAUDE.md` | - | Uma linha: "See [`AGENTS.md`](AGENTS.md)." | `CLAUDE.md` |
| `AGENTS.md` | inglês, 38 linhas | Quatro seções: "What the machine charges" (só `npm run build`; `prebuild` regenera a referência), "Rules nothing charges" (tabela de cinco regras sem gate: tokens como fonte única de literais, zero travessão em prosa publicada, voz `you` + imperativo, catálogo fechado de dezesseis componentes, props do design-sync transcritas à mão), "Where things live", "What not to do" (sem dependência npm para reescrever o que funciona; não editar página gerada; `outline` só em `focus.css`). | `AGENTS.md` |
| `CONTEXT.md` | inglês, 6,9 KB | O glossário, em três grupos: **The collection** (panlabs, House voice, Tab, Page type, Jornada, Sweep, Drift, Verdict), **The visual system** (Anchor, Skin, Swap surface, Layer, Derivation rule, `pd`, Adapter, Parts contract), **The frame** (Chrome, Content component, Subtitle, Separator, Native substrate). Cada verbete tem definição e, quando cabe, linha `_Avoid_:` com sinônimos proibidos. | `CONTEXT.md` |
| `DECISIONS.md` | inglês, 27 KB | Onze decisões travadas, cada uma com **Rule**, **Why it binds** e alternativas rejeitadas: CSS in Three Layers, One Source of Literals; The Swizzle Ladder, and a Zero-Unsafe Budget; Movement Lives in the Token Layer; The Entry-State Contract; No Trailing Slash; A Sidebar Category Is Not a Destination; Reference Is Generated From Contract; Search Is a Local Index, No External Service; The Diagram Lightbox; A Diagram Tab Is Selected in the Import; The Root Is a Page, and the Anchor Doesn't Reach It. | `grep -n '^#' DECISIONS.md` |

`docs/agents/` (pt-BR): `domain.md` (single-context, `CONTEXT.md` + `DECISIONS.md`; usar o vocabulário do glossário; sinalizar conflito com decisão), `issue-tracker.md` (GitHub Issues via `gh`; wayfinder com sub-issues e dependências nativas; labels `wayfinder:map|research|prototype|grilling|task`; pesquisa em branch descartável `research/<nome>` registrada na issue), `triage-labels.md` (vocabulário canônico verbatim), `workflow.md` (extensão local: `/wayfinder → /to-spec → /to-tickets → implementação → PR → merge no verde`; modo `implementa as issues`; worktree obrigatório por sessão; branch `feature/<slug-em-inglês>`; commit em pt-BR com trailer `Closes #N`; PR `--draft` no primeiro push; `gh pr merge --auto --squash`).

**Divisão de idiomas**: "Inglês só no que a máquina casa — nome de branch, de check, de diretório; pt-BR em tudo que humano lê" (`docs/agents/workflow.md` linha 30). Na prática: `AGENTS.md`, `CONTEXT.md`, `DECISIONS.md`, `README.md`, comentários de código e workflows em inglês; `docs/agents/`, `.design-sync/NOTES.md`, `conventions.md`, `contracts/overpower.json` (labels e prosa) e todo `content/` em pt-BR.

### Convenções de escrita do conteúdo

Nada é cobrado por máquina além do build: "Não há portão, régua, varredura nem hook de commit — eles existiram, e saíram" (`docs/agents/workflow.md` linhas 15-17; `.claude/rules/conteudo.md` linha 11).

| Regra | Enunciado | Fonte |
|---|---|---|
| Voz | `you` + imperativo, zero primeira pessoa, em tudo que documenta. Exceção única: a landing em `src/pages/`, escrita em primeira pessoa. | `.claude/rules/conteudo.md` seção "Voice"; `CONTEXT.md` verbete "House voice" |
| Travessão | Zero `—` em prosa publicada (`content/`, `contracts/`, `src/pages/`), inclusive em `.drawio.svg` co-localizado. Exceção: citar saída de ferramenta (fence, `api_exemplos`, `"message"`). Não alcança `AGENTS.md`, `CONTEXT.md`, `DECISIONS.md`, `docs/agents/`. Verificação manual: `grep -rn '—' content/ contracts/ src/pages/`. | `.claude/rules/conteudo.md` seção "Em dash" |
| Proibição por localização | `<Steps>` é a espinha de `Procedimentos` e não entra em `Jornadas`; `<CardGroup>` não entra em índice de jornada. | `.claude/rules/conteudo.md` seção "Prohibition by location" |
| Teto de profundidade | 4, confinado a `content/ferramentas/bibliotecas/overpower/` (fecha em 4) e `content/jornadas/api-owner/` (fecha em 3); fora deles nada passa do nível 2. | `.claude/rules/conteudo.md` seção "The depth ceiling" |
| Front matter | Só três chaves em uso: `title` e `description` em todas as 64 páginas contadas, `slug` em 6 (as folhas de abertura com `slug: /`). `description` é obrigatória: vira o subtítulo sob o `h1`, o `<meta name="description">`, o índice de busca e o `llms.txt`; sua ausência quebra o build. Páginas geradas acrescentam `api_exemplos` (JSON do modelo de linha). | `grep` de chaves em `content/**`; `CONTEXT.md` verbete "Subtitle"; `src/theme/MDXComponents/index.js` linhas 69-76; `src/plugins/ai-era/index.js` função `withSubtitle`; `content/ferramentas/bibliotecas/overpower/comandos/list.mdx` linhas 1-7 |
| Corpo | A primeira linha não vazia do corpo é o `# título` (o plugin ai-era lança erro se não for). | `src/plugins/ai-era/index.js` função `withSubtitle` |
| Âncoras | Toda âncora citada em link é declarada com `{#id}` no heading, por causa de `onBrokenAnchors: 'throw'`. | `docusaurus.config.js` linhas 118-122 |
| Componentes | Uso direto no `.md`, sem `import` (registro global): ex. `<Steps><Step title="...">` em `visao-geral.md`; `<ParamField name= type=>` e `<CommandPanel />` nas páginas geradas. Admonições são as nativas `:::note`, com tipos em `src/theme/Admonition/Types.js`. | `content/ferramentas/bibliotecas/overpower/visao-geral.md` linhas 17-25; `comandos/list.mdx`; `src/theme/MDXComponents/index.js` linhas 17-21, 40-44 |
| Diagramas | `.drawio.svg` ao lado da página; aba escolhida no import com `?aba=<slug>`; irmão gerado `arquivo.<slug>.svg` commitado; build recusa irmão desatualizado. | `.claude/rules/conteudo.md` seção "Which tab of a diagram a page renders" |
| Idioma do conteúdo | pt-BR, locale único. | `docusaurus.config.js` linhas 141-144; `README.md` "Content in pt-BR" |
| Nomes de arquivo e rota | slugs em pt-BR sem acento, hifenizados (`visao-geral.md`, `codigos-de-saida.md`, `solucao-de-problemas.md`); rota = caminho do arquivo sem extensão, sem barra final. | `find content -type f`; `docusaurus.config.js` linha 115 |

### Artefatos para leitores-máquina

O plugin local `ai-era` emite, em `postBuild`, um `.md` por rota (corpo MDX sem front matter, com o subtítulo como blockquote sob o `h1`), `llms.txt` (seções na ordem de `TABS`) e `llms-full.txt` (documentos separados por `--- [Document source](url) ---`), escritos em `outDir`, nunca em `static/` (`src/plugins/ai-era/index.js` linhas 1-8, 87-147). O `trailingSlash: false` existe em parte para que `URL + ".md"` seja concatenação pura (`docusaurus.config.js` linhas 100-102). A busca é um índice local embarcado no bundle, com teto auto-imposto de 64 KB serializados e 200 caracteres de corpo por página (`src/plugins/search/index.js` linhas 1-23; `DECISIONS.md` seção "Search Is a Local Index, No External Service").

## 6. panlabs-docs: CI, deploy e custo

### CI (`.github/workflows/ci.yml`)

- Gatilho: `push` em qualquer branch exceto `main`, mais `workflow_dispatch`. Sem `pull_request`, para não reportar o mesmo SHA duas vezes (linhas 11-23).
- `permissions: contents: read`; `concurrency: ci-${{ github.ref }}` com `cancel-in-progress: true` (linhas 25-33).
- Um único job, `gate`, sem `name:` de propósito: o id é o contrato com o ruleset da `main` (`required_status_checks.contexts`) (linhas 36-41).
- Passos: `actions/checkout@v4`, `actions/setup-node@v4` com `node-version: 22` e `cache: npm`, `npm ci`, `npm run build` (linhas 44-54). "`npm run build` is the only validation" (linha 3). Nenhum lint, teste ou verificação de prosa.

### Deploy (`.github/workflows/deploy.yml`)

- Gatilho: `push` em `main`, mais `workflow_dispatch` (linhas 8-12).
- `permissions: contents: read, pages: write, id-token: write` (linhas 14-17); `concurrency: group: pages`, `cancel-in-progress: false` (um deploy por vez, novo push entra na fila) (linhas 19-23).
- Job `build`: checkout, Node 22, `npm ci`, `npm run build`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3` com `path: build` (linhas 26-46).
- Job `deploy` (`Publicar`): `needs: build`, `environment: github-pages`, `actions/deploy-pages@v4` (linhas 48-57).
- Publica em **GitHub Pages do próprio repositório**: `https://thiagopanini.github.io/panlabs-docs/`. API do GitHub: `build_type: "workflow"`, `public: true`, `https_enforced: true`, `cname: null` (sem domínio customizado) (`gh api repos/ThiagoPanini/panlabs-docs/pages`). O repositório é público (`visibility: PUBLIC`), `has_pages: true`, `homepageUrl` igual ao Pages (`gh repo view`, `gh api repos/ThiagoPanini/panlabs-docs`).
- Últimas três execuções de `deploy.yml`: `success`, a mais recente em 2026-09-08 (`gh run list -R ThiagoPanini/panlabs-docs --workflow deploy.yml -L 3`).
- Proteção da `main`: ruleset com `bypass_actors` vazio e check `gate` obrigatório; "A `main` não aceita push direto de ninguém, inclusive do dono" (`docs/agents/workflow.md` linha 25). Nenhum workflow abre PR, porque PR criado com `GITHUB_TOKEN` não dispara outros workflows (linha 38).

### Custo

- **R$ 0 / US$ 0 de serviço**: repositório público, GitHub Actions em runner padrão e GitHub Pages, ambos gratuitos para repositórios públicos (ver seção 10 para as URLs oficiais e os limites). O próprio `ci.yml` registra a premissa: "A public repo's runner is free" (linha 17).
- Nenhuma dependência paga ou externa em runtime: busca local (não Algolia), fontes auto-hospedadas em `static/fonts/`, diagramas renderizados localmente e commitados (`DECISIONS.md` seções "Search Is a Local Index, No External Service" e "A Diagram Tab Is Selected in the Import"; `static/fonts/`).
- Custo em tempo de máquina: dois workflows por mudança que chega à `main` (o `gate` no branch e o `Deploy` no merge), cada um com `npm ci` + `npm run build`.

## 7. campfire/docs: ferramenta, `docs.json` e navegação

### Repositório e branches

- `ThiagoPanini/campfire`, público, default branch `main`, descrição "🔥 A web app that helps groups of friends organize and enjoy their music jam sessions." (`gh repo view ThiagoPanini/campfire`). HEAD de `main`: `d354d18`, 2026-04-30, "chore(release): promote develop to main (...) (#35)"; HEAD de `develop`: `8d81c42`, 2026-05-02, "feat: 007-auth-hardening-wave1 (#40)" (`gh api repos/ThiagoPanini/campfire/commits/HEAD`; `.../branches/develop`). Fluxo: branches `NNN-slug` → `develop` → `main`; o CI recusa PR para `main` que não venha de `develop` (`.github/workflows/ci.yml` linhas 264-274).
- **O clone local está fora do branch canônico**: `/home/paninit/workspaces/campfire` está em `mvp/lofi-style` (`10fc345`, 2026-05-17), com árvore suja, e seu `docs/` contém `decisions/`, `deploy/`, `mvp-scope.md`, Markdown puro, **sem `docs.json`** (`git -C /home/paninit/workspaces/campfire log -1`, `branch --show-current`, `ls docs`). Os branches remotos `mvp/lofi-style` e `mvp/notebook-style` (2026-05-16/17) também têm `docs/` sem Mintlify (`gh api .../contents/docs?ref=mvp/...`). A documentação Mintlify vive em `main` e `develop`. Esta pesquisa leu `main` via `gh api repos/ThiagoPanini/campfire/tarball/main`, extraído no scratchpad; caminhos abaixo são relativos à raiz desse snapshot (`d354d18`).
- `develop` está à frente: `docs/docs.json` tem blob diferente (`8e03fe9` vs `8601c2e` em `main`), 74 `.mdx` contra 67, e duas pastas a mais, `docs/identity/` e `docs/operations/` (`gh api .../contents/docs?ref=develop`; `git/trees/<sha>?recursive=1`).

### Ferramenta e versões

| Fato | Valor | Fonte |
|---|---|---|
| Plataforma | Mintlify (SaaS), tema `mint`, `"$schema": "https://mintlify.com/docs.json"` | `docs/docs.json` linhas 1-3 |
| Primeiro commit do `docs.json` | `1bce698`, 2026-04-20, "docs: add mintlify documentation site with guides and examples" | `gh api "repos/ThiagoPanini/campfire/commits?path=docs/docs.json"` |
| Dependência npm | `"mintlify": "4.2.542"` em `dependencies` do `package.json` da raiz (bump do Dependabot, PRs #20 e #28, de 4.2.531); `overrides` fixando `react: 19.2.5` para `@mintlify/previewing` e `@mintlify/cli` | `package.json` linhas 17, 24-31; `gh pr list -R ThiagoPanini/campfire` |
| Script local | `"docs:dev": "cd docs && mint dev"` | `package.json` linha 11; `docs/development/local-development.mdx` linhas 63-68 ("Mintlify serves from `docs/docs.json`") |
| CLI oficial hoje | pacote `mint` (`npm i -g mint`), Node "v20.17.0+ (LTS versions recommended)"; "Do not install the legacy `mintlify` package in install scripts or CI pipelines". Comandos: `mint dev`, `mint validate`, `mint format`, `mint update`, `mint new`, `mint deploy`/`mint claim`, `mint agent setup` | https://www.mintlify.com/docs/installation |
| Skill de agente instalada | `.agents/skills/mintlify/SKILL.md` (autor `mintlify`), que manda consultar mintlify.com/docs e usar `mint dev` / `mint broken-links`; `skills-lock.json` registra `"source": "mintlify.com"` | `.agents/skills/mintlify/SKILL.md` linhas 1-61; `skills-lock.json` linhas 55-56 |
| `mint.json` legado | não existe (`404`) | `gh api repos/ThiagoPanini/campfire/contents/docs/mint.json` |
| Node no CI | `actions/setup-node@v6`, `node-version: 22` | `.github/workflows/ci.yml` linhas 36-40 |

### `docs/docs.json` (7,5 KB)

| Chave | Valor no campfire | Semântica oficial | Fonte oficial |
|---|---|---|---|
| `theme` | `mint` | "The layout theme for your site"; valores `mint`, `maple`, `palm`, `willow`, `linden`, `almond`, `aspen`, `sequoia`, `luma` | https://www.mintlify.com/docs/organize/settings-reference |
| `name`, `description` | `Campfire`; "Private music hub for small circles — track what you know, see what you are learning, share with the room." | `name` obrigatório | idem; https://www.mintlify.com/docs/organize/settings |
| `colors` | `primary #E8813A`, `light #FFFFFF`, `dark #131313` | `colors.primary` obrigatório | idem |
| `appearance` | `default: dark`, `strict: false` | `strict: true` "hides the light/dark mode toggle" | settings-reference |
| `background.color` | `dark #131313`, `light #F5F5F5` | "Custom background colors" | settings-reference |
| `styling.eyebrows` | `section` | "Page eyebrow style shown at the top of the page"; `section` ou `breadcrumbs`, padrão `section` | settings-reference |
| `contextual.options` | `["copy", "view"]` | "Actions available in the contextual menu. The first item is the default action"; outras: `chatgpt`, `claude`, ... | settings-reference |
| `navbar` | `title: campfire`; `primary: {type: github, href: github.com/ThiagoPanini/campfire}` | `type: github` é um estilo de botão | settings-reference |
| `footer.socials` | `github`, `website: https://thiagopanini.dev/` | "Each key is a platform name, each value is your profile URL" | settings-reference |
| `fonts` | `heading: Anton 400`, `body: Space Grotesk 300` | `family`, `weight`, `source`, `format` | settings-reference |
| `icons.library` | `lucide` | "All icon names in your docs must come from the selected library"; `fontawesome` (padrão), `lucide`, `tabler` | settings-reference |

Não há no `docs.json` campo de domínio, branch de deploy ou diretório: isso fica no dashboard do Mintlify (ver seção 9).

### Navegação

- Padrão raiz: `navigation.tabs`, **3 abas**: `Docs` (ícone `flame`), `Specs` (`file-text`), `Glossary` (`book-open-text`) (`docs/docs.json` → `navigation.tabs`).
- **29 grupos**, 3 deles aninhados (nível > 1); **67 páginas referenciadas = 67 `.mdx` em disco, 0 órfãs, 0 faltando** (script Node sobre o snapshot, cruzando `navigation` com `find docs -name '*.mdx'`).
  - `Docs`: 5 grupos, 28 páginas: `INTRODUCTION` (5), `ARCHITECTURE` (5), `DEVELOPMENT` (6, mistura `development/*` e `contributors/*`), `IMPLEMENTATION REFERENCE` (1 grupo `Backend` com `icon: server`, `expanded: true`, contendo `backend/architecture` + subgrupos `Operations` (`icon: workflow`), `Identity context` (`icon: id-card`, `root: backend/identity/overview`, `expanded: false`, 4 páginas), `Repertoire context` (`icon: music`)), `AI DEVELOPMENT` (4).
  - `Specs`: 6 grupos, 19 páginas: `OVERVIEW` (2), `METHODOLOGY` (3), `SPECS` (2), `ADRS` (10), `ARTIFACTS` (1), `TRACEABILITY` (1). Espelha a pasta `specs/` do Spec Kit na raiz do repo.
  - `Glossary`: 14 grupos, 20 páginas: `OVERVIEW` (1) e um grupo por letra inicial (`A`, `B`, `C`, `D`, `E`, `F`, `H`, `J`, `M`, `O`, `R`, `S`, `T`).
- Rótulos de grupo de topo em CAIXA ALTA; subgrupos em Title case (`docs/docs.json`).
- Semântica oficial: "Tabs create distinct sections of your documentation with separate URL paths"; grupos exigem `group` e `pages`; "When a group has a root page, clicking the group title in the sidebar navigation opens the root page"; `expanded` controla o estado inicial de grupos aninhados e "Top-level groups always expand and you cannot collapse them"; "You can nest groups within each other, label them with tags, and style them with icons"; "Each navigation element can contain one type of child element at each level"; `pages`: "Each entry must reference the path to a page file" (https://www.mintlify.com/docs/organize/navigation).

## 8. campfire/docs: páginas `.mdx`, `.mintignore` e convenções

### Inventário de `docs/`

67 `.mdx`, 1 `docs.json`, 1 `custom.css`, 1 `.mintignore`; **nenhum `.md`** e **nenhum `import`** em página alguma (`find docs -type f`; `grep -rl '^import ' docs`). Pastas: `get-started/{introduction,architecture}/`, `development/`, `contributors/`, `backend/{identity,ops}/`, `ai-development/`, `sdd/{methodology,specs,adrs,artifacts}/`, `glossary/` (árvore via `gh api .../git/trees/HEAD?recursive=1`). Maior página: `docs/backend/architecture.mdx`, 16,6 KB; as 19 do glossário têm 470-720 bytes cada.

### Front matter

| Chave | Páginas (de 67) | Exemplo | Fonte |
|---|---|---|---|
| `title` | 67 | `"ADR-0001 — PostgreSQL as engine"` | contagem por `awk` sobre o snapshot; `docs/sdd/adrs/0001-postgresql-as-engine.mdx` |
| `description` | 67 | `"What Campfire is, who it's for, and how these docs are organized."` | `docs/get-started/introduction/overview.mdx` |
| `icon` | 47 | `"flame"`, `"database"`, `"git-branch"` (slugs Lucide) | idem |
| `sidebarTitle` | 34 | `"0001 · PostgreSQL"`, `"CI/CD"`, `"Architecture playbook"` | `docs/sdd/adrs/0001-...mdx`; `docs/get-started/architecture/ci-cd.mdx` |
| `keywords` | 8 | `["campfire", "introduction", "music", "repertoire"]` | `docs/get-started/introduction/overview.mdx` |
| `tag` | 2 | | contagem |

Oficialmente "All frontmatter fields are optional"; sem `title`, "The last segment of the path becomes the title" (https://www.mintlify.com/docs/organize/pages). Outros campos disponíveis e não usados: `mode`, `url`, `noindex`, `hidden`, `searchable`, `boost`, `deprecated`, `related`, `contextual`, `openapi`/`api`.

### Padrões de página e estilo

- **Kicker**: 65 das 67 páginas abrem o corpo com `<p className="cf-kicker">SEÇÃO · RÓTULO</p>` (ex.: `CAMPFIRE · OVERVIEW`, `GLOSSARY · SPECS`, `ADR · ACCEPTED`, `RECIPE · CANONICAL`, `STAGE 5 · PLANNED`), classe definida em `docs/custom.css` como "Mono kicker — primary information scent" (`grep -rl cf-kicker docs`; `docs/custom.css` linhas 42-56).
- **Badges de status**: 11 páginas usam `<span className="cf-badge cf-badge--planned">PLANNED</span>` e variantes `--live`, `--partial` (`docs/custom.css` linhas 58-93; `docs/get-started/architecture/ci-cd.mdx` linha 10).
- `docs/custom.css` (3,2 KB): cabeçalho "Campfire docs — rehearsal-room brutalism. See DESIGN.md"; `@import` de Google Fonts (`Space Mono`); tokens `--cf-*` com hex literais (`#e8813a`, `#131313`...); `!important` em `h1`/`h2`/`h3` e em `code, pre, kbd`; utilitários `cf-swatch`, `cf-rule`, `cf-label` (`docs/custom.css`).
- **Componentes embutidos usados** (ocorrências de tag): `<Step>` 43, `<Card>` 31, `<Accordion>` 23, `<CardGroup>` 9 (`cols={3}`), `<Steps>` 8, `<AccordionGroup>` 4, `<Note>` 3, `<Tip>` 2, `<Warning>` 1, `<Info>` 1. Nenhum componente próprio; o que não é componente é HTML com classe (`grep -rhoE '<[A-Z][A-Za-z]+' docs`). As 5 ocorrências de `<Context` são texto dentro de blocos de código em `docs/backend/architecture.mdx`.
- **Tipos de página observados**: visão geral com `CardGroup` de três cartões; verbete de glossário com seções fixas em prosa ("Why it matters here", "Where it appears", "Related terms"); ADR curto (kicker `ADR · ACCEPTED`, decisão em um parágrafo, linha `Related:`); *playbook*/receita longa; páginas de spec que espelham `specs/NNN-*/` (`docs/glossary/adr.mdx`; `docs/sdd/adrs/0001-...mdx`; `docs/backend/architecture.mdx`; `docs/sdd/specs/`).
- **Links**: internos absolutos à raiz do site (`/sdd/adrs/index`, `/glossary/sdd`); para fonte de spec, link externo ao GitHub (`docs/backend/architecture.mdx` linhas 13-16).
- **Idioma**: inglês em todas as páginas e no `docs.json`. **Travessão** `—` presente em 29 dos 67 arquivos, inclusive em `title` (`grep -rl '—' docs`).

### `.mintignore` (`docs/.mintignore`, 117 bytes)

Conteúdo: `node_modules/**`, `apps/**`, `specs/**`, `tmp/**`, `.agents/**`, `.claude/**`, `.serena/**`, `.specify/**`, `.vscode/**`, `.git/**`, `*.md`, `**/*.md` (`gh api .../contents/docs/.mintignore | base64 -d`). As entradas `apps/**`, `specs/**`, `.agents/**` etc. nomeiam pastas da raiz do repositório que não existem sob `docs/`. Oficialmente o arquivo fica "na raiz do diretório de documentação", "uses the same pattern syntax as `.gitignore`", e o que ele exclui não é publicado, não entra na busca e "Visitors cannot access them by URL"; `.git`, `.github`, `.claude`, `.agents`, `.idea`, `.vscode`, `.cursor`, `node_modules`, `README.md`, `LICENSE.md`, `CHANGELOG.md`, `CONTRIBUTING.md` já são ignorados por padrão (https://www.mintlify.com/docs/organize/mintignore).

### Convenções declaradas

- Nenhuma menção a `docs/`, `documentation` ou `mdx` em `AGENTS.md`, `CLAUDE.md`, `DESIGN.md` ou `.github/pull_request_template.md` (`grep` no snapshot). As convenções de documentação estão **dentro da própria documentação**:
  - Constituição, princípio III "Boring, proven stack": "Mintlify for docs"; princípio V "Docs-as-code, continuously": "Every user-facing or architectural change ships its Mintlify update in the same change set. If a change needs no doc update, that must be obvious from the change itself." (`docs/sdd/methodology/constitution.mdx` linhas 34-56).
  - Definition of done, passo "Docs are updated": "Mintlify reflects the change in the **same** change set." (`docs/contributors/workflow.mdx` linhas 30-40).
  - "Prettier handles JS, TS, JSON, MD, MDX, and CSS"; "Commit messages: conventional-style is encouraged, not enforced" (`docs/contributors/code-style.mdx` linhas 10-13, 44-46). `.prettierignore` não exclui `docs/`.
- **CI sobre a documentação**: no job `docs-and-repo-hygiene`, o passo "Validate docs navigation" roda um script Node inline que percorre `navigation.tabs` (`root` e `pages`) e falha se algum alvo não existir como `docs/<caminho>.mdx` (`.github/workflows/ci.yml` linhas 254-316). Não há `mint validate`, `mint broken-links` nem Prettier `--check` sobre `docs/` nos workflows (`grep -n -i 'mint' .github/workflows/*.yml` sem resultado além desse passo). O script valida navegação → arquivo, não arquivo → navegação (órfãs passariam; hoje são zero).

## 9. campfire/docs: publicação, CI, custo e plano

### Como o Mintlify publica (fatos oficiais)

- O **GitHub App do Mintlify** sincroniza o repositório: "automatically sync your documentation with your GitHub repository"; instala-se em Git Settings do dashboard, escolhendo o repositório; pushes para a branch configurada disparam deploy; a branch de build é trocada no dashboard. Permissões: leitura de `metadata`; leitura e escrita de `checks`, `code`, `deployments`, `pull requests`. "If you have branch protection rules enabled, the app can't push directly to protected branches." (https://www.mintlify.com/docs/deploy/github)
- **Subdiretório** (caso do campfire, `docs/`): no dashboard, ativar "docs.json is in a subdirectory" e informar `/docs`; "Do not include a trailing slash in the path."; o `docs.json` fica dentro do diretório de documentação (https://www.mintlify.com/docs/deploy/monorepo).
- **Preview em PR**: gerado para PRs contra a branch de deploy, link postado pelo bot, atualizado a cada commit; "Preview deployments require a Pro or Enterprise plan"; "Preview URLs are publicly viewable by default" (https://www.mintlify.com/docs/deploy/preview-deployments).
- **Domínio**: endereço padrão `<subdomain>.mintlify.site`, que "stays reachable after you add a custom domain"; domínio próprio via `TXT` de verificação e `CNAME` para `cname.mintlify.builders`, TLS automático; hospedagem em subpath (`/docs`) via toggle "Host at", por DNS direto ou proxy reverso, "not supported for documentation with authentication enabled" (https://www.mintlify.com/docs/customize/custom-domain).
- **Artefatos para IA**: "Mintlify automatically hosts an `llms.txt` file at the root of your project", idem `llms-full.txt`; "Page links in the `llms.txt` file include a `.md` extension so AI tools can fetch the Markdown version of each page directly"; `markdown.instructions` e `seo.indexing` no `docs.json` ajustam isso (https://www.mintlify.com/docs/ai/llmstxt). O menu `contextual.options: ["copy", "view"]` do campfire usa esse mecanismo.

### Estado real da publicação do campfire

- O GitHub App do Mintlify **está instalado** no repositório: há check-suite do app `mintlify` nos HEADs de `main` e `develop`, ao lado de `codecov`, `infracost`, `vercel`, `render` e `github-actions` (`gh api repos/ThiagoPanini/campfire/commits/<sha>/check-suites`).
- **Nenhum deploy foi registrado**: em todos os 13 commits que tocaram `docs/` no histórico de `main` (2026-04-20 a 2026-04-30) e nos 9 amostrados em `develop` (até 2026-05-02), o check run "Mintlify Deployment" tem `conclusion: skipped`, título "Skipping deployment", resumo "No eligible deployments found for changes", `details_url: https://mintlify.com` (`gh api repos/ThiagoPanini/campfire/commits/<sha>/check-runs`). Nenhum PR tem comentário de preview (lista de 53 PRs, `gh pr list`). A própria doc diz que o site ainda não foi publicado: "Replace with a site-specific config (`npx mint-mcp add <siteId>`) once the docs site is published." (`docs/ai-development/mcp-servers.mdx` linha 19).
- **URL hospedada: não encontrada.** `https://campfire.mintlify.app` responde 200, mas é o site de outra organização ("Campfire API Docs", `llms.txt` apontando para `docs.campfire.ai`, 426 URLs no sitemap), não este projeto (`curl -s https://campfire.mintlify.app | grep '<title>'`; `/llms.txt`). `thiagopanini.mintlify.app`, `campfire-docs.mintlify.app` e `thiagopanini-campfire.mintlify.app` respondem 404; `docs.thiagopanini.dev` não resolve. O repositório não tem `homepageUrl` (`gh repo view`). Nada no repositório nomeia o subdomínio.
- Hospedagem do **app** (não da doc): Render, decidido em ADR-0010 e `render.yaml` na raiz; deploy por `.github/workflows/deploy-develop.yml` e `deploy-production.yml` (`docs/sdd/adrs/0010-render-as-deployment-platform.mdx`; listagem da raiz remota).

### CI do repositório (contexto)

`ci.yml`: `pull_request` para `develop`/`main` e `push` em `develop`, `main`, `[0-9][0-9][0-9]-*`; jobs de frontend, backend (lint, unit, integração Postgres, migrações/contratos), `docs-and-repo-hygiene` e agregador "CI status (aggregate)" (`.github/workflows/ci.yml` linhas 1-30; `gh api .../check-runs` do HEAD). Dependabot semanal para `github-actions`, `npm` (é por aí que o `mintlify` sobe de versão) e `pip`, com alvo `develop` (`.github/dependabot.yml`).

### Custo e plano (https://mintlify.com/pricing, lida em 2026-11-07)

| Plano | Preço | O que inclui, segundo a página |
|---|---|---|
| **Starter** | US$ 0; "Starter is free forever for up to five editors" | hospedagem gerenciada, busca, domínio customizado, Git sync, editor web, autenticação, servidor MCP, API playground; 5 "editor seats" |
| **Pro** | US$ 450/mês (anual) ou US$ 540/mês (mensal) | editores ilimitados, analytics de plataforma e de Agent, Agent incluído, Assistant a 25 créditos por resposta com 10.000 créditos/mês, preview deployments, feedback de usuários |
| **Enterprise** | sob consulta | self-hosting e EU hosting, insights avançados, créditos customizados |

- **OSS Program**: Pro gratuito para projeto open source não comercial com "a recognized open source license", não financiado por VC ou receita, não mantido principalmente por empresa com fins lucrativos. A listagem da raiz remota do campfire **não mostra arquivo `LICENSE`** (`gh api repos/ThiagoPanini/campfire/contents`).
- **Startup Program**: 50% de desconto no Pro por 12 meses.
- O plano em que o campfire está **não é determinável pelo repositório**; como nenhum deploy aconteceu, não há evidência de uso de recurso pago.
- Custo de máquina no GitHub: só o passo de validação de navegação dentro do job `docs-and-repo-hygiene` (`timeout-minutes: 5`), em repositório público (runners gratuitos, ver seção 10).

## 10. Quadro comparativo de fatos

Fatos lado a lado, sem recomendação. Fontes: seções 1-9 deste arquivo e as URLs listadas ao fim.

| Dimensão | panlabs-docs (Docusaurus) | campfire/docs (Mintlify) |
|---|---|---|
| Gerador / versão | Docusaurus 3.10.2 fixado; React 19; MDX 3; npm; Node `>=20` (CI: 22) | Mintlify SaaS; CLI local `mintlify` 4.2.542 (pacote legado segundo a doc oficial; o atual é `mint`); Node 22 no CI; CLI pede Node v20.17+ |
| Licença / modelo | MIT (`facebook/docusaurus`), self-hosted estático | Plataforma proprietária hospedada; plano Starter gratuito até 5 editores |
| Onde o conteúdo mora | `content/` (4 abas = 4 instâncias de `plugin-content-docs`); `docs/` é doc do repo | `docs/` com `docs.json` na raiz do diretório; `.mintignore` exclui `*.md` |
| Formato das páginas | 33 `.md` autorais + 4 `.mdx` gerados de contrato | 67 `.mdx`, nenhum `.md`, nenhum gerado |
| Configuração | `docusaurus.config.js`, 445 linhas comentadas, ESM, zero literal de cor | `docs.json`, 7,5 KB, JSON com `$schema`; cores e fontes em literais |
| Navegação | 6 `sidebars-*.js` explícitos; separador de topo não clicável; teto de profundidade 4; `slug: /` por aba; 1 fragmento gerado | `navigation.tabs` com 3 abas, 29 grupos (3 aninhados, com `root`/`expanded`/`icon`), 67 páginas; CI valida que cada entrada existe |
| Front matter | `title`, `description` (obrigatória, vira subtítulo/meta/busca/llms), `slug` | `title`, `description`, `icon`, `sidebarTitle`, `keywords`, `tag`; tudo opcional pela doc oficial |
| Componentes | catálogo fechado de 16 registrados globalmente, nomes espelhando o Mintlify (`Steps`, `Card`, `Accordion`, `ParamField`...); sem `import` | embutidos do Mintlify (`Steps`, `Card`, `Accordion`, `Note`...); sem `import`; HTML com classes `cf-*` para kicker e badges |
| Tema / CSS | 5 arquivos CSS em 3 camadas, tokens `--pd-*`, único arquivo com literais; dark canônico | `docs.json` (`colors`, `appearance`, `background`, `fonts`) + `custom.css` com `--cf-*`, `!important`, Google Fonts |
| Ícones | Lucide via `lucide-static` fixado, resolvidos em build (falha se o slug não existe) | `icons.library: lucide`, resolvidos pela plataforma |
| Fontes | auto-hospedadas (`Inter`, `Paper Mono` em `static/fonts/`) | `Anton`, `Space Grotesk` via `fonts` do `docs.json`; `Space Mono` via `@import` Google Fonts |
| Diagramas | `.drawio.svg` co-localizado, abas via `?aba=`, irmãos gerados commitados, lightbox próprio | nenhum diagrama em `docs/` (0 svg/png) |
| Links quebrados | `onBrokenLinks`, `onBrokenAnchors`, `onBrokenMarkdownLinks` todos `throw`, só no `build` | não verificados no CI (`mint broken-links` existe na CLI, não roda) |
| Busca | índice local embarcado, teto 64 KB, sem serviço externo | busca da plataforma (incluída no Starter) |
| `llms.txt` / `.md` por rota | plugin local `ai-era` emite `.md` por rota, `llms.txt`, `llms-full.txt` | automático pela plataforma; `contextual.options: copy, view` |
| Idioma do conteúdo | pt-BR, locale único | inglês |
| Regras de escrita | voz `you` + imperativo, zero travessão em prosa publicada, `description` obrigatória, `{#id}` em âncoras; em prosa, sem gate | Prettier sobre MDX; "docs no mesmo change set" (constituição e DoD); travessão em 29/67 páginas |
| Docs para agentes | `AGENTS.md`, `CONTEXT.md` (glossário), `DECISIONS.md` (11 decisões), `docs/agents/` (4), `.claude/rules/` (3, escopadas por `paths`) | `AGENTS.md`/`CLAUDE.md`/`DESIGN.md` sem menção a `docs/`; convenções dentro das próprias páginas; skill `mintlify` em `.agents/skills/` |
| CI | `gate`: `npm ci` + `npm run build` (único check, obrigatório pelo ruleset da `main`) | passo "Validate docs navigation" num job de higiene; sem `mint validate` |
| Deploy | `deploy.yml` → GitHub Pages (`build_type: workflow`), um deploy por vez | GitHub App do Mintlify instalado; **nenhum deploy registrado** ("No eligible deployments found for changes") |
| Hospedagem / URL | `https://thiagopanini.github.io/panlabs-docs/`, sem domínio próprio, HTTPS forçado | sem URL conhecida; padrão seria `<subdomain>.mintlify.site`; domínio próprio e subpath disponíveis |
| Custo | US$ 0: repo público, Actions e Pages gratuitos; sem serviço externo | US$ 0 no Starter (5 editores); preview em PR só no Pro (US$ 450-540/mês) ou OSS Program (exige licença OSS; repo sem `LICENSE`) |
| Estado | publicado, último deploy 2026-09-08 com sucesso | escrito (67 páginas em `main`, 74 em `develop`), não publicado; clone local em branch sem Mintlify |

### Fontes externas consultadas (2026-11-07)

- Mintlify, preços: https://mintlify.com/pricing
- Mintlify, instalação e CLI: https://www.mintlify.com/docs/installation
- Mintlify, GitHub App: https://www.mintlify.com/docs/deploy/github
- Mintlify, monorepo/subdiretório: https://www.mintlify.com/docs/deploy/monorepo
- Mintlify, preview deployments: https://www.mintlify.com/docs/deploy/preview-deployments
- Mintlify, domínio customizado: https://www.mintlify.com/docs/customize/custom-domain
- Mintlify, `.mintignore`: https://www.mintlify.com/docs/organize/mintignore
- Mintlify, navegação: https://www.mintlify.com/docs/organize/navigation
- Mintlify, configurações globais e referência do `docs.json`: https://www.mintlify.com/docs/organize/settings e https://www.mintlify.com/docs/organize/settings-reference
- Mintlify, front matter de páginas: https://www.mintlify.com/docs/organize/pages
- Mintlify, `llms.txt`: https://www.mintlify.com/docs/ai/llmstxt
- Docusaurus, instalação (Node "version 20.0 or above"): https://docusaurus.io/docs/installation
- Docusaurus, deploy (GitHub Pages: `organizationName`, `projectName`, `deploymentBranch`, `trailingSlash`; workflows separados de teste e deploy; lista de hosts alternativos): https://docusaurus.io/docs/deployment
- GitHub Pages, limites ("no larger than 1 GB"; "soft bandwidth limit of 100 GB per month"; "soft limit of 10 builds per hour", que "does not apply if you build and publish your site with a custom GitHub Actions workflow"; não permitido como hospedagem gratuita para operar negócio): https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- GitHub Actions, cobrança (uso em runners padrão em repositórios públicos "remains free independently and does not reduce the included compute usage"): https://docs.github.com/en/billing/concepts/product-billing/github-actions
