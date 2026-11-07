# Inventário: panlabs-docs (Docusaurus) e campfire/docs (Mintlify)

Pesquisa do ticket [#6](https://github.com/ThiagoPanini/minimal-me/issues/6), parte de #1. Fatos para a escolha da ferramenta de documentação do wayfinder, sem recomendação. Cada afirmação cita o caminho do arquivo (relativo à raiz do repositório indicado) ou a URL.

## Retomada

**Estado**: em andamento (panlabs-docs coberto; campfire pendente).

| Seção | Estado |
|---|---|
| 1. panlabs-docs: ferramenta e versões | coberto |
| 2. panlabs-docs: configuração (`docusaurus.config.js`) | coberto |
| 3. panlabs-docs: sidebars e modelo de conteúdo | coberto |
| 4. panlabs-docs: pastas (`content/`, `docs/`, `contracts/`, `src/`, `static/`, `.design-sync/`, `ds-bundle/`) | coberto |
| 5. panlabs-docs: documentos de agentes (`CONTEXT.md`, `DECISIONS.md`, `AGENTS.md`, `CLAUDE.md`) e convenções de escrita | coberto |
| 6. panlabs-docs: CI, deploy e custo | coberto |
| 7. campfire/docs: ferramenta, `docs.json` e navegação | pendente |
| 8. campfire/docs: páginas `.mdx`, `.mintignore`, convenções | pendente |
| 9. campfire/docs: publicação, CI, custo e plano | pendente |
| 10. Quadro comparativo de fatos | pendente |
| Comentário na issue e fechamento | pendente |

**Onde continuar**: seção 7, lendo `gh api repos/ThiagoPanini/campfire/contents/docs` e `docs/docs.json` remotos; depois URLs oficiais de custo (Mintlify pricing, GitHub Pages/Actions) para a seção 9 e 10.

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

## 8. campfire/docs: páginas `.mdx`, `.mintignore` e convenções

## 9. campfire/docs: publicação, CI, custo e plano

## 10. Quadro comparativo de fatos
