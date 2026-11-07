# Inventário: overpower (Python)

Pesquisa do ticket [#3](https://github.com/ThiagoPanini/minimal-me/issues/3) (parte de #1). Inventário de stack e convenções do repositório `/home/paninit/workspaces/overpower`, com fonte primária no próprio código e configuração. Fatos, não opiniões; cada afirmação cita o caminho do arquivo. Nenhum valor de `.env`, token ou segredo é copiado, só o caminho.

## Retomada

**Estado**: em andamento.

**Coberto**: 1 (linguagem), 2 (bibliotecas), 4 (gerenciador/lock), 5 (lint/format/tipagem).

**Falta**: 3 (estrutura de pastas), 6 (testes), 7 (CI/release), 8 (documentação), 9 (deploy), 10 (segredos), 11 (MCPs), 12 (commits/branches), 13 (instruções para agentes).

**Onde continuar**: fontes já lidas e não gravadas: `.github/workflows/{ci,release,tag}.yml`, `docs/agents/*.md`, `CLAUDE.md`, `.claude/`, `lefthook.yml` (commit-msg/post-merge), `git log`. Falta ler `tests/conftest.py`, docstrings de `src/overpower/*.py`, `docs/research/`, `prototype/`, `CHANGELOG.md` (cabeçalho).

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

_pendente_

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

_pendente_

### 7. CI e release

_pendente_

### 8. Documentação

_pendente_

### 9. Deploy

_pendente_

### 10. Segredos

_pendente_

### 11. MCPs declarados

_pendente_

### 12. Convenções de commits e branches

_pendente_

### 13. Arquivos de instrução para agentes

_pendente_
