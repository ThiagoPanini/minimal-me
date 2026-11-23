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

Coding standards (language, web, branches, commits, hooks and workflows) live in `CODING_STANDARDS.md`:

@CODING_STANDARDS.md

### Infrastructure facts

Before stating a Cloudflare or Coolify fact in a resolution or an ADR, check it in the docs through the MCP (`docs` for Cloudflare, `search_docs` for Coolify). Both are deferred tools: load them with ToolSearch first. The `Operação: ...` tickets, the MCP quirks and the public-URL checks are in `docs/agents/operations.md`.

## Session start

Open every session with a sweep of the pipeline, and fix what it finds before the task at hand:

1. Robot PRs with a red check: `gh pr list --author app/dependabot`, then `gh pr checks <number>`.
2. Failures in the latest runs on `main`: `gh run list --branch main --limit 5`, and in Dependabot's own update jobs, which leave that list within a day: `gh run list --workflow 'Dependabot Updates' --limit 4`.
3. Open alerts: `gh api 'repos/{owner}/{repo}/<kind>/alerts?state=open'` for `dependabot`, `code-scanning` and `secret-scanning`.

The daily `retry` workflow reruns each failure up to three times, so what is still red needs its cause fixed. Fix a robot PR with a commit on its branch: its auto-merge stays on.

## Agent cycle

Every change reaches `main` as a squash of its PR, and the PR title becomes the commit subject on `main`. The `gate` and `pr-title` checks decide; `README.md` ("Como a CI valida") says what each one runs.

1. Run `pnpm verify` and get it green on the branch.
2. Push the branch and open the PR with `gh pr create`, titled in Conventional Commits, in Portuguese (`tipo(escopo): assunto`).
3. Queue the merge with `gh pr merge --auto --squash` and nothing else: never pass `--subject`, so the PR title stays the subject.
4. Follow `gh pr checks --watch` until `gate` and `pr-title` finish. A red check is fixed with a new commit on the branch, and a bad title by editing the PR title.

The git hooks run on every commit and push: fix what they report with a new change. Never pass `--no-verify`; the CI runs the same checks, so a skipped hook only moves the failure to the PR.

When push protection blocks a push, take the secret out of the unpushed commits and rotate it if it is real. Never bypass the block.
