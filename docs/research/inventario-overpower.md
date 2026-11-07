# Inventário: overpower (Python)

Pesquisa do ticket [#3](https://github.com/ThiagoPanini/minimal-me/issues/3) (parte de #1). Inventário de stack e convenções do repositório `/home/paninit/workspaces/overpower`, com fonte primária no próprio código e configuração. Fatos, não opiniões; cada afirmação cita o caminho do arquivo. Nenhum valor de `.env`, token ou segredo é copiado, só o caminho.

## Retomada

**Estado**: completo (2026-11-07).

**Coberto**: as 13 dimensões e a síntese final.

**Falta**: nada. Se for retomar para revisão, os dois pontos que merecem releitura na fonte são `docs/agents/domain.md` (46 KB, lido só pelos cabeçalhos) e `docs/auditoria-75.md` (69 KB, lido só pelo cabeçalho); nenhum dos dois altera as dimensões de stack e convenção.

## Dimensões

### 1. Linguagem e versão

- **Linguagem**: Python, só Python 3 (`pyproject.toml:38`, classifier `Programming Language :: Python :: 3 :: Only`). Não há `package.json`; o único toque em Node é o `npx` que roda o commitlint (`commitlint.config.mjs:4-6`, `lefthook.yml:89-96`).
- **Piso suportado**: `requires-python = ">=3.12"` (`pyproject.toml:15`). O pyright checa contra esse piso, não contra a versão de desenvolvimento: `pythonVersion = "3.12"` (`pyproject.toml:252-254`).
- **Interpretador de desenvolvimento**: `.python-version` contém `3.14` (`.python-version:1`).
- **`target-version` do ruff deliberadamente ausente**: inferido de `requires-python` para não haver segunda fonte do piso (`pyproject.toml:177-178`).
- **Idioma**: todo artefato de código em inglês (identificador, comentário, docstring, log, nome de módulo e de arquivo); prosa (commit, ticket, ADR, `CLAUDE.md`, `docs/agents/`) em português (`CLAUDE.md:27-33`; `commitlint.config.mjs:10-11`). Os nomes de arquivo em `docs/adr/` são a "dívida conhecida" dessa regra (`CLAUDE.md:33`).

### 2. Frameworks e bibliotecas centrais

**Produto**: CLI publicada no PyPI com três comandos, `list`, `install` e `doctor` (`CLAUDE.md:3`; `README.md:10-13`). Entry point `overpower = "overpower.cli:main"`, com nome de pacote igual ao do comando para `uvx overpower` resolver sem `--from` (`pyproject.toml:100-104`). Uso típico: `uvx overpower@latest install --ai-framework matt-pocock --runtime claude-code,cursor` (`README.md:6-8`).

**Dependências de runtime** (`pyproject.toml:46-82`), cada uma com o motivo em comentário no próprio arquivo:

| Pacote | Piso | Papel declarado |
| --- | --- | --- |
| `typer` | `>=0.27` | CLI (`pyproject.toml:47`) |
| `rich` | `>=15` | telas/renderização (`pyproject.toml:48`) |
| `questionary` | `>=2.1` | prompts interativos do wizard (`pyproject.toml:49`) |
| `prompt-toolkit` | `>=3.0.53` | pin direto para corrigir `OSError` sem TTY no macOS (`pyproject.toml:50-53`) |
| `json-five` | `>=1.1.2` | leitor e escritor JSONC do enxerto, para preservar o diff aditivo (ADR 0016; `pyproject.toml:54-64`) |
| `pyyaml` | `>=6.0.3` | formato do `catalog.yaml` e do manifesto federado (`pyproject.toml:65-81`) |

**Sem framework web, sem banco, sem ORM.** O lock resolve 29 pacotes no total (`uv.lock`, contagem de `[[package]]`).

**Grupos de desenvolvimento** (`pyproject.toml:144-149`): `dev = ["pytest>=9", "pytest-randomly", "ruff", "towncrier"]` e `typecheck = ["pyright"]` (grupo separado porque pyright traz um runtime Node e a matriz de testes não deve pagar por ele).

**Ausências declaradas como decisão** (`pyproject.toml:151-156`): `pytest-cov` (cobertura é diagnóstico efêmero, nunca portão), `syrupy` (comparador de snapshot tem ~15 linhas em `tests/support/snapshots.py`), `freezegun` (o produto não lê relógio).

**Build backend**: `hatchling>=1.27` (`pyproject.toml:1-3`).

### 3. Estrutura de pastas

Layout `src/` com pacote único e plano (sem subpacotes de código; `catalog/` e `content/` são dados). Árvore observada na raiz (ignorando `.git/`, `.venv/`, `dist/`, caches e `.claude/worktrees/`):

```
overpower/
├── .claude/                    # context-economy-protocol.md e rules/tests.md rastreados; settings.local.json ignorado
├── .github/workflows/          # ci.yml, release.yml, tag.yml (nada mais em .github/)
├── .vscode/                    # settings.json, extensions.json
├── changelog.d/                # fragmentos towncrier; hoje só .gitkeep
├── docs/
│   ├── adr/                    # 25 ADRs, 0001–0025 (dois arquivos numerados 0013)
│   ├── agents/                 # domain.md, issue-tracker.md, testing.md, triage-labels.md, workflow.md
│   ├── research/               # hook-formats.md, mcp-config-formats.md
│   └── auditoria-75.md
├── licenses/                   # LICENSE dos conteúdos vendorizados (mattpocock-skills, panlabs-tech-skills)
├── prototype/terminal-experience/   # nada rastreado; só __pycache__ local
├── scripts/overpower-docs-update.sh
├── src/overpower/              # 18 módulos .py, ~12,4k linhas (wc -l)
│   ├── catalog/catalog.yaml    # chaves de topo: bundles, frameworks, mcp
│   └── content/                # 82 arquivos: frameworks/matt-pocock/skills, pool/skills/panlabs-python-standards
├── tests/                      # ~16,6k linhas; 663 funções test_; support/; snapshots/ (32 .txt)
├── CHANGELOG.md  CLAUDE.md  README.md  LICENSE  NOTICE
└── pyproject.toml  uv.lock  .python-version  .editorconfig  lefthook.yml  commitlint.config.mjs  .gitignore
```

**Módulos de `src/overpower/`** (primeira linha do docstring de cada um; "no código, o índice é o docstring", `CLAUDE.md:25`):

| Módulo | Responsabilidade declarada |
| --- | --- |
| `cli.py` | parsing, gate `isatty()`, códigos de saída, handler de topo |
| `discovery.py` | "the tree is the catalog": `list` e `install` descobrem olhando |
| `errors.py` | a única exceção que o produto levanta de propósito |
| `grafting.py` | inserção cirúrgica em documento alheio: texto entra, texto sai |
| `inspection.py` | o `doctor`: o que está no disco do alvo e o que está errado |
| `jsonio.py` / `yamlio.py` | o único caminho sancionado para ler JSON/YAML, tipado como `object` |
| `packaged.py` | onde as duas raízes irmãs vivem dentro do pacote |
| `planning.py` | `Request` → `Plan`: o único lugar onde um destino é decidido |
| `recipes.py` | subárvore do manifesto → `Recipe`, com toda a validação |
| `remote.py` | `--from <url>`: qualquer repositório GitHub como raiz de busca |
| `rendering.py` | `(Recipe, document)` → enxertos; função pura |
| `runtimes.py` | a tabela de caminhos por runtime de IA |
| `scope.py` | se `cwd` está dentro de um repo git |
| `screens.py` | o que o produto desenha (variante "F — Herdada · bloco") |
| `wizard.py` | o wizard interativo |
| `writing.py` | a única fronteira de escrita |
| `written.py` | o único arquivo que o overpower escreve sobre o próprio conteúdo |

**Testes espelham `src/`**: um `tests/test_<módulo>.py` por módulo (`test_catalog`, `test_cli`, `test_inspection`, `test_planning`, `test_recipes`, `test_remote`, `test_rendering`, `test_runtimes`, `test_scope`, `test_screens`, `test_wizard`, `test_writing`), andaime em `tests/support/` (`project.py`, `screens.py`, `snapshots.py`, `git_remote.py`, `gates.py`) e `tests/snapshots/` com um arquivo por tela em duas larguras (`*-60.txt`, `*-80.txt`) (`.claude/rules/tests.md:13-20`; `docs/agents/testing.md:30`).

### 4. Gerenciador de pacotes e lock

- **Gerenciador**: `uv`. `[tool.uv] required-version = ">=0.11"` (`pyproject.toml:138-142`). A CI fixa `UV_VERSION: "0.12.1"` para que CI e release usem o mesmo resolvedor (`.github/workflows/ci.yml:22-25`).
- **Lock**: `uv.lock` versionado na raiz, `version = 1`, `revision = 3`, `requires-python = ">=3.12"` (`uv.lock:1-3`); 29 pacotes. A CI instala com `uv sync --locked` e o hook local usa `uv run ruff`, de modo que o ruff local e o da CI saem do mesmo lock (`lefthook.yml:12-14`).
- **Versão**: literal em `pyproject.toml:12` (`version = "0.31.0"`), movida só por `uv version --bump`; o bump é o gatilho de publicação. Versionamento dinâmico (`hatch-vcs`) foi medido e rejeitado por publicar versão inventada em clone raso (`pyproject.toml:7-11`, `139-141`).
- **Build**: `hatchling`; o sdist é allowlist `include = ["src/"]` (`pyproject.toml:131-132`; ADR `docs/adr/0013-o-sdist-declara-o-que-carrega.md`). As quatro chaves que furam o `.gitignore` (`force-include`, `artifacts`, `packages`, `ignore-vcs`) são proibidas por ADR 0004 (`pyproject.toml:106-116`).
- **Licenças no pacote**: `license-files = ["LICENSE", "NOTICE", "licenses/*"]` segue PEP 639; `NOTICE` e `licenses/mattpocock-skills.LICENSE`, `licenses/panlabs-tech-skills.LICENSE` carregam atribuição dos conteúdos vendorizados (`pyproject.toml:17-24`; ADR 0003).
- **Sem task runner** (sem Makefile, `justfile`, `tox`, `nox`): "the four commands in README.md are the whole loop" (`pyproject.toml:146-147`). O `.editorconfig` tem uma seção `[Makefile]`, mas não existe Makefile no repo (`.editorconfig:28-29`).
- **Node**: nenhum `package.json`; `commitlint` roda por `npx --yes --package @commitlint/cli@20.1.0 --package @commitlint/config-conventional@20.0.0` (`lefthook.yml:91-96`).

### 5. Lint, format e tipagem

**Ruff é o único dono do estilo Python** (`.editorconfig:7-9`; `.vscode/settings.json:7-8`). Configuração em `pyproject.toml:162-243`:

- `line-length = 100` (decidido contra espécime real da org, `pyproject.toml:163-168`); `src = ["src"]`; `extend-exclude = ["*.md"]` porque `ruff format` reescreveria blocos Python dentro de ADRs (`pyproject.toml:170-176`).
- `extend-select` (nunca `select`, medido: `select` com as mesmas famílias fica 160 regras mais frouxo que o padrão) com as famílias `E W F I N UP B SIM RUF PTH ANN TC S PT D EM TRY RSE RET T20 ARG SLF TID INP C4 C90 PERF FURB PIE PL DTZ LOG G A ERA FBT` (`pyproject.toml:180-192`).
- `ignore = ["D203", "D213", "FBT002", "TRY003"]` (`pyproject.toml:193-198`); `allowed-confusables = ["›"]` porque `›` é a pontuação do produto para "chave dentro de documento" (`pyproject.toml:199-205`).
- `pydocstyle.convention = "google"` (`pyproject.toml:207-208`); `format.docstring-code-format = true` (`pyproject.toml:242-243`).
- **Tripwire de leitura**: `flake8-tidy-imports.banned-api` proíbe `json.load`, `json.loads`, `yaml.load` e `yaml.safe_load`; os módulos sancionados são `overpower.jsonio` e `overpower.yamlio`, que devolvem `object` e são os únicos com `TID251` liberado (`pyproject.toml:210-234`).
- `per-file-ignores` para `tests/**`: `S101 D ANN SLF001 PLR2004 INP001` (`pyproject.toml:235-240`).

**Tipagem**: `pyright` em `typeCheckingMode = "strict"`, `include = ["src", "tests"]`, `pythonVersion = "3.12"` (o piso), `venvPath = "."`, `venv = ".venv"` (`pyproject.toml:249-256`). Grupo `typecheck` separado do `dev` (`pyproject.toml:149`). Roda só na CI, não no hook local (`lefthook.yml:17-20`).

**Whitespace**: `.editorconfig` com `utf-8`, `lf`, newline final, trim de trailing whitespace, 2 espaços por padrão e 4 em `*.py`; `*.md` mantém trailing whitespace (quebra dura); `max_line_length` ausente de propósito para não duplicar o 100 do ruff (`.editorconfig:11-29`).

**Editor**: `.vscode/settings.json` aponta o interpretador para `.venv`, habilita pytest, define `charliermarsh.ruff` como formatador padrão com `formatOnSave` e `fixAll`/`organizeImports` explícitos (`.vscode/settings.json:11-26`). `.vscode/extensions.json` recomenda `charliermarsh.ruff`, `ms-python.python`, `ms-python.vscode-pylance`, `EditorConfig.EditorConfig`, `tamasfe.even-better-toml` e marca `ms-python.pylint` como indesejada (`.vscode/extensions.json:6-15`).

**Hook local**: `lefthook.yml` `pre-commit` paralelo com `uv run ruff format --check {staged_files}` e `uv run ruff check {staged_files}` restritos a `*.py` (`lefthook.yml:40-52`). `--check` e não reescrita, para o índice não divergir do que o autor revisou (`lefthook.yml:43-45`).

### 6. Testes e cobertura

**Runner**: `pytest>=9` (lock: 9.1.1), com `pytest-randomly` como `required_plugins` (ordem aleatória obrigatória) (`pyproject.toml:148`, `277`). Configuração em `pyproject.toml:262-277`: `testpaths = ["tests"]`, `addopts = "-ra --import-mode=importlib"` (mantém `sys.path` intacto para o teste não importar `src/` pela porta dos fundos), `strict = true`, `filterwarnings = ["error"]`, um único marker declarado, `network`.

**Volume**: 663 funções `test_` em `tests/*.py`; 32 snapshots em `tests/snapshots/` (contagem direta).

**Doutrina** (`docs/agents/testing.md:7-19`, § Resumo executável), posição por posição:

| Pergunta | Resposta no repo |
| --- | --- |
| Dublê de filesystem | não existe; `tmp_path` sempre (ADR 0010) |
| `git` do `--from` | subprocesso real contra remoto local em `tmp_path` (`tests/support/git_remote.py`) |
| GitHub de verdade | fora de todo portão; só com `OVERPOWER_NETWORK_TESTS=1` (`tests/support/gates.py:20-26`) |
| Plano × tela × disco | uma asserção só, "identidade de três vias", nas 9 células da matriz |
| Saída visual | estrutura no portão; snapshot por tela, sem cor, a 80 e 60 colunas |
| Seleção interativa | seam do wizard é stub; um teste de PTY prova a fiação, só em POSIX |
| Cobertura | diagnóstico efêmero, nada no `pyproject.toml` |

Não há `tests/fakes.py` nem `tests/contracts/`, por condição declarada da régua (`docs/agents/testing.md:35`). Nomes `test_<cenario>_<esperado>`, AAA, `parametrize` com `ids` (`docs/agents/testing.md:31`).

**Snapshots sem plugin**: `tests/conftest.py:15-28` declara a opção `--snapshot-update`; o comparador vive em `tests/support/snapshots.py` (~15 linhas segundo `pyproject.toml:155`).

**Cobertura**: sem `pytest-cov` no projeto, sem threshold, nunca portão (`pyproject.toml:153-154`; `docs/agents/testing.md:17`). O comentário em `pyproject.toml:153-154` diz que o comando de cobertura "lives in README.md"; o `README.md` atual (32 linhas) não contém nenhum comando de desenvolvimento, só uso e links para a documentação externa.

**Na CI**: job `test` em matriz `fail-fast: false`, `os: [ubuntu-latest, macos-latest, windows-latest]` × `python: ["3.12", "3.13", "3.14"]`, `uv sync --locked` e `uv run pytest` (`.github/workflows/ci.yml:210-236`). Pyright, pytest e P2 rodam só na CI; o hook local carrega só o que é instantâneo e offline (`lefthook.yml:17-20`).

**Regra de agente para testes**: `.claude/rules/tests.md` tem frontmatter `paths: ["tests/*.py", "tests/**/*.py"]` e manda ler `testing.md` § Resumo executável e clonar o andaime de `tests/support/` (`.claude/rules/tests.md:1-22`).

### 7. CI e release

Três workflows em `.github/workflows/`: `ci.yml`, `release.yml`, `tag.yml`. Actions fixadas por SHA com a versão em comentário: `actions/checkout` v7.0.1 e `astral-sh/setup-uv` v9.0.0 (`ci.yml:35-36`; `release.yml:32-33`; `tag.yml:39-44`). Nenhum workflow usa `secrets.*` (grep sobre `.github/workflows/`).

**`ci.yml`** (`name: CI`): gatilho `push` com `branches: ["**"]` e deliberadamente sem `pull_request`, porque o check run é do SHA e o trigger extra criaria runs em `approval-required` (`ci.yml:7-20`). `UV_VERSION: "0.12.1"` (`ci.yml:25`). Quatro jobs:

| Job | Conteúdo | Fonte |
| --- | --- | --- |
| `static` | ubuntu; `uv sync --locked --all-groups`; `ruff format --check .`; `ruff check .`; `uv run --group typecheck pyright`; **P1** (nada ignorado dentro de `src/overpower/content/`); **P2** (`uv build --no-sources` e o wheel carrega exatamente o que o git rastreia em `content/`); **P3** (o sdist carrega exatamente o que declarou, comparado com `git ls-files`) | `ci.yml:31-203` |
| `test` | matriz 3 SOs × 3 Pythons, `uv run pytest` | `ci.yml:210-236` |
| `release-ready` | só fora de `main`; `fetch-depth: 0`; script Python compara `pyproject.toml` com o merge-base, calcula o nível de bump exigido pelos fragmentos de `changelog.d/` ou pelos títulos da seção do `CHANGELOG.md` (`breaking`/`removed` → major, `added`/`changed`/`deprecated` → minor, `fixed`/`security` → patch; major vira minor enquanto 0.x), recusa versão já taggeada, exige seção `## [versão]` no CHANGELOG e `changelog.d/` vazio; imprime os dois comandos de correção | `ci.yml:254-432` |
| `gate` | `needs: [static, test]`, `if: always()`, assere `needs.*.result == success` (job pulado reportaria como sucesso) | `ci.yml:453-466` |

**`tag.yml`** ("Tag a version bump"): `push` em `main`; `permissions: contents: write, actions: write`; lê `uv version --short`; três ramos: versão sem tag → `git tag vX && git push && gh workflow run release.yml --ref vX`; tag já no HEAD → `::notice::`; tag em outro commit → `::error::` com `exit 1` (`tag.yml:26-94`). Dispara por `gh workflow run` porque tag criada com `GITHUB_TOKEN` não dispara workflow (`docs/agents/workflow.md:29`).

**`release.yml`** ("Publish release to PyPI"): `push: tags: ["v*"]` e `workflow_dispatch`; `environment: pypi` com `url: https://pypi.org/p/overpower`; `permissions: id-token: write, contents: read` (trusted publishing por OIDC, sem token no repo); checa tag == `uv version --short`; `uv build --no-sources`; inventário do wheel; smoke test do wheel e do sdist com `uv run --isolated --no-project --with dist/* -- overpower`; `uv publish` (`release.yml:6-71`). Não roda lint nem teste: toda tag sai de um commit que passou pelo portão (`docs/agents/workflow.md:27`).

**Proteção de branch**: ruleset ativo `main: PR obrigatorio e gate verde` sobre `~DEFAULT_BRANCH`, com regra `pull_request` (`required_approving_review_count: 0`, métodos `squash`, `merge`, `rebase`) e `required_status_checks` = `gate` e `release-ready`; `bypass_actors: []` (API `repos/ThiagoPanini/overpower/rulesets/20562986`; `CLAUDE.md:37`; `docs/agents/workflow.md:21-25`).

**Changelog**: towncrier com fragmentos `changelog.d/<issue>.<type>.md`, sete tipos (`breaking` primeiro, depois os seis do Keep a Changelog: `added`, `changed`, `deprecated`, `removed`, `fixed`, `security`); montagem com `uv run towncrier build --version "$(uv version --short)"`; `issue_format` linka a issue do GitHub (`pyproject.toml:304-345`; `CHANGELOG.md:1-20`). O tipo do fragmento é também o nível mínimo do bump (ADR 0012).

**Histórico de release**: tags `v0.1.0` … `v0.31.0` em 158 commits entre 2026-07-30 e 2026-08-21 (`git tag`, `git log`). `gh release list` vazio: não há GitHub Releases, a publicação é só PyPI. Ambientes do GitHub: `pypi` (sem regra de proteção) e `github-pages` (`branch_policy`), este sem nenhum workflow no repo que publique nele.

### 8. Documentação

- **README.md**: 32 linhas, em inglês; one-liner, exemplo de `uvx`, exemplo de tela e link para a documentação externa (`README.md:1-32`). Nenhum comando de desenvolvimento.
- **Site de documentação fora do repo**: `Homepage` e `Documentation` apontam para `https://thiagopanini.github.io/panlabs-docs/ferramentas`; a documentação migrou para `ThiagoPanini/panlabs-docs` na #151 e `website/` saiu junto, para não haver duas fontes de um texto (`pyproject.toml:84-98`; `README.md:27-32`). O site tem pt-BR como locale padrão e páginas em inglês.
- **Acoplamento de volta, por fora**: `lefthook.yml` estágio `post-merge` roda `scripts/overpower-docs-update.sh`, que lança uma varredura de documentação no repositório irmão `../panlabs-docs` se existirem o irmão, a skill `.claude/skills/varredura-overpower/SKILL.md` dentro dele, `claude` e `npm` no `PATH`; pergunta `npm run pino -- --verificar` (0 em dia, 1 atrasado, 2 sem rede) e sai 0 em todo caminho; não é portão (`lefthook.yml:98-118`; `scripts/overpower-docs-update.sh:1-45`).
- **CHANGELOG.md**: 78 KB, gerado por towncrier, Keep a Changelog 1.1.0 + SemVer 2.0.0 §4, com a seção extra **Breaking** (`CHANGELOG.md:1-20`).
- **ADRs**: 25 arquivos em `docs/adr/`, pt-BR, nome de arquivo em kebab-case sem acento, título como frase ("O segredo é escrito onde o git não alcança, e nunca onde alcança"). Estrutura observada: parágrafo de decisão, linha "Decidido em …", `## A razão`, `## Considered Options` (`docs/adr/0024-…:1-25`; `docs/adr/0022-…:1-15`). Há **dois ADRs numerados 0013** (`0013-a-chave-alheia-e-sobrescrita.md` e `0013-o-sdist-declara-o-que-carrega.md`).
- **`docs/agents/`**: cinco arquivos, pt-BR: `domain.md` 46 KB, `testing.md` 23 KB, `workflow.md` 12 KB, `issue-tracker.md` 3,6 KB, `triage-labels.md` 1,4 KB (`wc -c`).
- **`docs/research/`**: dois relatórios de research (~48 KB cada) com cabeçalho **Ticket** / **Data** / **Insumo** (`docs/research/hook-formats.md:1-5`; `docs/research/mcp-config-formats.md:1-5`).
- **`docs/auditoria-75.md`**: auditoria pós-entrega da spec #75 (69 KB), construída sobre 16 tickets, sem editar `src/` nem `tests/` (`docs/auditoria-75.md:1-7`).
- **Documentação no código**: docstrings Google obrigatórios por ruff `D` (`pyproject.toml:207-208`); todo módulo abre com uma linha de responsabilidade (verificado por `ast.get_docstring` nos 18 módulos). Os arquivos de configuração (`pyproject.toml`, `lefthook.yml`, `ci.yml`, `.editorconfig`, `.vscode/*`) carregam comentários longos com a decisão, a medição e o link da issue.
- **Licenças**: `LICENSE` MIT, `NOTICE` com atribuições, `licenses/*.LICENSE` dos conteúdos vendorizados, todos embarcados no wheel por PEP 639 (`pyproject.toml:17-24`).

### 9. Deploy

- **Não há servidor, container nem infraestrutura.** O artefato de entrega é o pacote PyPI `overpower`, consumido por `uvx overpower@latest` (`README.md:6-8`). Não existe Dockerfile, Terraform, `fly.toml` ou equivalente na árvore.
- **"Publicar é mergear"** (`CLAUDE.md:38`; `docs/agents/workflow.md:29`): merge em `main` que muda `version` em `pyproject.toml` → `tag.yml` cria `vX.Y.Z` e dispara `release.yml` → build, smoke test e `uv publish` com OIDC para o ambiente `pypi` (`tag.yml:85-94`; `release.yml:22-29, 51-71`). Merge sem bump não publica nada.
- **Pré-condição de publicação é portão, não disciplina**: `release-ready` reprova PR que muda o wheel (`src/`, `README.md`, `NOTICE`, `LICENSE`, `licenses/`, `[project]`) sem bump compatível com os fragmentos (`ci.yml:301, 338-376`).
- **Documentação** é publicada por outro repositório (`panlabs-docs`, GitHub Pages); neste repo o ambiente `github-pages` existe na API mas nenhum workflow o usa.

### 10. Segredos

- **Nenhum arquivo de credencial rastreado**: `git ls-files | grep -Ei '\.env|secret|credential'` não devolve nada. `.gitignore` ignora `.env`, `.envrc`, `.pypirc`, `.streamlit/secrets.toml` e `.claude/settings.local.json` (`.gitignore:152-154` e bloco final).
- **Gitleaks no staged**: `gitleaks git --staged --no-banner --redact` no `pre-commit`, binário global (não a action, que exige licença em org); justificado pelo repo ser público (`lefthook.yml:69-78`).
- **CI sem segredos**: nenhum `secrets.*` nos três workflows; `tag.yml` usa `GH_TOKEN: ${{ github.token }}` (`tag.yml:89`) e `release.yml` publica por OIDC (`id-token: write`), sem token PyPI (`release.yml:25-29`).
- **O produto e os segredos do usuário**: ADR 0024, "o segredo é escrito onde o git não alcança, e nunca onde alcança": em escopo de máquina o overpower pergunta o valor do slot e escreve literal (`~/.claude.json` etc.); em escopo de projeto o slot fica `${VAR}`; no VS Code mantém `inputs[]` com `password: true` (`docs/adr/0024-…:1-18`). Código em `src/overpower/cli.py:979-1098` (`_gathered_secrets`, `_pending_secrets`, `_announce_secrets`); o único toque em `os.environ` do pacote é `Environment.from_process` em `src/overpower/runtimes.py:350-355`.
- **Variável de ambiente de testes**: `OVERPOWER_NETWORK_TESTS=1` libera os testes que falam com o GitHub (`tests/support/gates.py:20-26`); `OVERPOWER_DOCS_REPO` sobrescreve o caminho do irmão `panlabs-docs` (`scripts/overpower-docs-update.sh:36`).
- **Configuração local do Claude Code** (`.claude/settings.local.json`, ignorada): `defaultMode: bypassPermissions` e allowlist `Bash`, `WebFetch`, `WebSearch`; o `.gitignore` explica que isso é decisão da máquina, não do projeto.

### 11. MCPs declarados

- **O repositório não declara MCP para os próprios agentes**: não existem `.mcp.json`, `.cursor/`, `.codex/` nem `.vscode/mcp.json` (`ls` na raiz).
- `.claude/settings.local.json` (ignorado, local à máquina) tem `disabledMcpjsonServers: ["hostinger-vps"]`, referindo um servidor declarado fora do repo (nível de usuário); só o nome é citado aqui.
- **O produto instala servidores MCP**: `src/overpower/catalog/catalog.yaml` tem chaves de topo `bundles`, `frameworks` e `mcp` (`catalog.yaml:62-71`); ADR 0022 "Servidor MCP é artefato, e o bundle o alcança" (itens com prefixo `skill:` / `mcp:`); a tabela de runtimes em `src/overpower/runtimes.py` cobre "three root keys, three file names and three secret spellings across three" runtimes (`runtimes.py:914`), com o levantamento em `docs/research/mcp-config-formats.md` (Claude Code, Cursor, VS Code, Devin e outros).
- **Hooks de máquina do Claude Code referenciados**: `~/.claude/hooks/context-economy-injector.py`, hook `UserPromptSubmit` armado pelo marker `.claude/context-economy-protocol.md` (`.claude/context-economy-protocol.md:3`; `lefthook.yml:111`; `scripts/overpower-docs-update.sh:17`). O hook vive fora do repo; o repo só carrega o marker.

### 12. Convenções de commits e branches

**Commits**: Conventional Commits com subject em minúsculas e prosa em pt-BR; `commitlint.config.mjs` estende `@commitlint/config-conventional` e adiciona `"subject-case": [2, "always", "lower-case"]` (`commitlint.config.mjs:12-17`). Cobrado no `commit-msg` por `npx --yes --package @commitlint/cli@20.1.0 --package @commitlint/config-conventional@20.0.0 commitlint --edit {1}` (`lefthook.yml:80-96`). Dissenso registrado: custa 1,9 s dos ~2,6 s do hook e não alimenta automação, porque o changelog vem dos fragmentos towncrier e não das mensagens (`lefthook.yml:82-87`).

Estatística de `git log --format='%s'` (158 commits): `feat` 46, `fix` 27, `chore` 25, `docs` 20, `test` 3, `refactor` 2, `build` 1, `merge` 1; 34 merge commits "Merge pull request #N from …". **Escopo `type(scope):` não é usado** (zero ocorrências). O número da issue vai como sufixo `(#N)` no subject. Os subjects são frases completas, por exemplo `feat: a fonte vira endereço, e o comando quem resolve é o ferramental (#165)` e `fix: o gatilho de pós-merge procurava a skill no caminho errado (#162) (#168)`.

**Branches** (`git branch -a`): `feat/<issue>-<slug>`, `fix/<issue>-<slug>`, `chore/<issue>-<slug>`, `docs/<slug>`, `research/<slug>`, `prototype/<slug>`, `feature/<slug>` (uma ocorrência), além de `worktree-issue-<n>-<slug>`, `worktree-<slug>` e `worktree-agent-<hash>` criados por agentes. Worktrees aninhados em `.claude/worktrees/` (ignorado, `.gitignore` bloco final; `docs/agents/workflow.md:40`). O repo saiu da org `panlabs-tech` para `ThiagoPanini` na #149: merges até o PR #148 vêm de `panlabs-tech/…`, do #150 em diante de `ThiagoPanini/…` (`git log`; `docs/agents/issue-tracker.md:5`).

**Fluxo de PR** (`docs/agents/workflow.md:35-46`): um worktree por issue; `/tdd`; PR aberto `--draft` no primeiro push (guarda de idempotência `gh pr list --head "$BRANCH" --state open`); corpo escrito no fim e `gh pr ready`; se o PR muda o wheel, bump e `towncrier build` no mesmo PR; merge no verde, `gh pr merge --auto` admitido. `gh pr merge --delete-branch` falha porque `main` costuma estar num worktree; apaga-se a branch remota por `gh api -X DELETE` (`CLAUDE.md:39`). Método de merge observado: merge commit (34 "Merge pull request"), embora o ruleset admita `squash`, `merge` e `rebase`.

**Hooks locais**: `lefthook` com `pre-commit` (format, lint, P1, gitleaks, em paralelo), `commit-msg` (commitlint) e `post-merge` (varredura de docs); armados por `lefthook install` uma vez por clone, herdados pelos worktrees (`lefthook.yml:35-38`); presentes em `.git/hooks/{pre-commit,commit-msg,post-merge}` na máquina inspecionada. Escolha de lefthook sobre pre-commit: executor em vez de gerenciador de ambiente, para não haver segunda fonte de versão de ferramenta (`lefthook.yml:8-16`).

**Changelog**: `changelog.d/` com `.gitkeep` e fragmentos `<issue>.<type>.md` consumidos a cada release (ver dimensão 7).

### 13. Arquivos de instrução para agentes

**`CLAUDE.md`** (3,9 KB, pt-BR, raiz; `CLAUDE.md:1-49`). Seções: one-liner do produto; "O reconhecimento sai da janela" (implementação começa delegando a um subagente `Explore` e agindo sobre o digest; medido em 46 sessões: 152k tokens até o primeiro `Edit` explorando na própria janela contra ~4k de um digest); tabela "Onde perguntar antes de procurar" apontando **seções** de `docs/agents/*.md` e `docs/adr/`; "O código é em inglês" (regra 43 do padrão panlabs, conferida em review); "Pegadinhas" (ruleset sem bypass, publicar é mergear, `gh pr merge --delete-branch` falha); "Agent skills" com `### Issue tracker` e `### Domain docs`. **Não existe `AGENTS.md`**: a seção "Agent skills" mora no próprio `CLAUDE.md`.

**`.claude/` rastreado** (`git ls-files .claude`): `context-economy-protocol.md` e `rules/tests.md`.
- `.claude/context-economy-protocol.md` (`:1-39`): injetado pelo hook `UserPromptSubmit` quando uma implementação começa, e marker de opt-in dos hooks de economia de contexto. Ordem: primeira ferramenta é `Agent`; digest de schema fixo com teto ~2,5k tokens (arquivos relevantes, vizinho mais próximo verbatim, padrão a espelhar, seams de TDD); agir sobre o digest; ir direto ao RED; narrar com `/caveman` ultra; issue enxuta via `gh issue view N --json title,body,labels`. Checklist pré-merge: suíte inteira verde, ruff limpo, fragmento em `changelog.d/`, bump se muda o wheel, PR `--draft` no primeiro push.
- `.claude/rules/tests.md` (`:1-22`): regra com escopo por `paths` para `tests/`, aponta para `testing.md` § Resumo executável e para o andaime de `tests/support/`.

**`docs/agents/`** (cinco arquivos, pt-BR):
- `domain.md`: single-context; vocabulário (unidades, onde o conteúdo mora, como aterrissa, enxerto de MCP, termos aposentados), regras do modelo, critério de curadoria, axiomas, registro histórico (cabeçalhos `domain.md:1-146`).
- `issue-tracker.md`: issues no GitHub `ThiagoPanini/overpower` via `gh`; "este tracker não é o da org"; operações de wayfinding com labels `wayfinder:map|research|prototype|grilling|task`, sub-issues e `blocked_by` nativos via `gh api`, reivindicação com `gh issue edit <N> --add-assignee @me`, resolução por comentário + fechar + linha em "Decisions so far" do mapa (`issue-tracker.md:1-64`).
- `triage-labels.md`: vocabulário canônico verbatim `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`, sem alias nem namespace; nota de que outros repos da org usam dialetos com prefixo e que scripts de frota devem ler o valor declarado (`triage-labels.md:1-17`).
- `workflow.md`: `/wayfinder → /to-spec → /to-tickets → /tdd → worktree → PR → merge no verde`; política de branch (ruleset observado); modo de implementação autônoma em 8 passos; portões (tabela de jobs, armadilhas medidas); referência de padrão Python `panlabs-python-standards`, "onde ele e uma decisão do mapa divergirem, vence o mapa e a divergência vira ADR" (`workflow.md:1-86`).
- `testing.md`: doutrina de teste adjudicada posição por posição contra `panlabs-python-standards/references/05-doutrina-de-testes.md`, zero divergências (`testing.md:7-35`).

**ADRs**: 25 em `docs/adr/`, listados na dimensão 8. A régua de forma de código é o `panlabs-python-standards`, vendorizado em `src/overpower/content/pool/skills/panlabs-python-standards/` (é também conteúdo que o produto instala).

**Labels do tracker** (`gh label list`): os nove padrão do GitHub, cinco `wayfinder:*`, quatro de triagem (`wontfix` compartilhado com o padrão) e `v0.2` ("fora do escopo da v0.1.0; reabrir na v0.2").

**Ausentes**: `AGENTS.md`, `.cursorrules`, `.github/copilot-instructions.md`, `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/`, `CODEOWNERS` (árvore de `.github/` contém só `workflows/`).

**Estado do repo no GitHub** (`gh repo view`, `gh issue list`, `gh pr list`): público, MIT, criado em 2026-07-30, último push 2026-08-21, 0 issues abertas, 0 PRs abertos.

## Síntese: o que pesa para decidir a stack do Minimal Me

Fatos extraídos acima, reunidos sem opinião:

1. **Stack mínima e justificada linha a linha**: Python `>=3.12` (dev em 3.14), `uv` + `uv.lock`, `hatchling`, `typer`/`rich`/`questionary` para CLI, `ruff` (100 colunas, `extend-select` amplo, docstrings Google) e `pyright strict`; sem task runner, sem `pytest-cov`, sem plugin de snapshot.
2. **Portão é mecanismo, não disciplina**: ruleset em `main` sem bypass (nem para o dono), checks `gate` e `release-ready`; lefthook local é atalho. Publicação por merge com bump, tag automática e PyPI por OIDC, sem segredo no repo.
3. **Changelog por fragmentos towncrier** com sete tipos, e o tipo decide o nível do bump (ADR 0012).
4. **Commits**: Conventional Commits, subject minúsculo, pt-BR, sem escopo, `(#N)` no fim; branches `tipo/<issue>-<slug>`; um worktree por issue; PR draft no primeiro push.
5. **Código em inglês, prosa em pt-BR** (commits, tickets, ADRs, `docs/agents/`, `CLAUDE.md`); README em inglês.
6. **Instruções de agentes**: `CLAUDE.md` com a seção "Agent skills" embutida e **sem `AGENTS.md`**, o que diverge do `minimal-me` (`CLAUDE.md` → `@AGENTS.md`); `.claude/rules/*.md` com escopo por `paths`; protocolo de economia de contexto rastreado como marker de hooks de máquina.
7. **Triagem**: vocabulário canônico verbatim (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) e labels `wayfinder:*`, iguais aos do `minimal-me`.
8. **Documentação de usuário fora do repo** (`panlabs-docs`), com acoplamento restaurado por um `post-merge` que lança um agente; `docs/` no repo guarda só ADRs, docs de agentes, research e auditoria.
9. **Inconsistências observadas**: dois ADRs numerados 0013; `pyproject.toml:146-147, 153-154` cita "os quatro comandos do README" que o README atual não contém (a documentação migrou na #151); `prototype/` sem nada rastreado.
