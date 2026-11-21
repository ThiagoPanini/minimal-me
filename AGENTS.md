## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues at `ThiagoPanini/minimal-me` (via `gh`), and tickets are sliced for `/implement-spec`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Python backend

The Python API follows the `panlabs-python-standards` skill: load it before creating, reviewing or reshaping Python code. See `docs/adr/0002-backend-em-python.md`.

## Conventions

### Language

Name everything that is code in English; write all prose in Brazilian Portuguese.

- **English**: every identifier (components, design tokens, variables, functions, types, CSS classes, test names) and the files and directories that hold code or design-system assets.
- **Portuguese**: documentation, issues, PR bodies, commit messages, interface copy, and the usage notes that describe a token or a component.
- **Domain terms**: `GLOSSARY.md` gives each term's English form under "Em código". Use that form in identifiers and the Portuguese term in prose.
- **Exception**: "space" (plural "spaces") is the domain term in prose, and "Spaces" is the section label in the interface. Both stay in English, like the spaces' own names (Frames & Songs, Music & Feeling, Code & Share, Write & Learn). Everything else in prose and interface copy stays in Portuguese.

### Infrastructure facts

Before stating a Cloudflare or Coolify fact in a resolution or an ADR, check it in the docs through the MCP (`docs` for Cloudflare, `search_docs` for Coolify). Both are deferred tools: load them with ToolSearch first.

## Agent cycle

Every change reaches `main` as a squash of its PR, and the PR title becomes the commit subject on `main`. The `gate` and `pr-title` checks decide; `README.md` ("Como a CI valida") says what each one runs.

1. Run `pnpm verify` and get it green on the branch.
2. Push the branch and open the PR with `gh pr create`, titled in Conventional Commits, in Portuguese (`tipo(escopo): assunto`).
3. Queue the merge with `gh pr merge --auto --squash` and nothing else: never pass `--subject`, so the PR title stays the subject.
4. Follow `gh pr checks --watch` until `gate` and `pr-title` finish. A red check is fixed with a new commit on the branch, and a bad title by editing the PR title.
