## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues at `ThiagoPanini/minimal-me` (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Conventions

### Language

Name everything that is code in English; write all prose in Brazilian Portuguese.

- **English**: every identifier (components, design tokens, variables, functions, types, CSS classes, test names) and the files and directories that hold code or design-system assets.
- **Portuguese**: documentation, issues, PR bodies, commit messages, interface copy, and the usage notes that describe a token or a component.
- **Domain terms**: `GLOSSARY.md` gives each term's English form under "Em código". Use that form in identifiers and the Portuguese term in prose.
- **Archived prototype**: `docs/design/prototype/` stays as the Author published it, Portuguese names included; `docs/design/README.md` maps them to the English tokens.
