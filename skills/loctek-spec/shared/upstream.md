# Upstream Notes

This repository prefers mature upstream skills when they fit Loctek's workflow. The local versions are Chinese-first and add the Loctek `.changes` protocol.

## Adopted

- `loctek-issue` is adapted from `mattpocock/skills@to-issues`.
  - Source: https://github.com/mattpocock/skills/tree/main/skills/engineering/to-issues
  - License: MIT, copyright Matt Pocock.
  - Changes: Chinese workflow, `.changes/issues` output, AFK/HITL labels, risk/test/rollback fields, large-file and high-conflict splitting guidance.

- `loctek-merge` is adapted from `mattpocock/skills@resolving-merge-conflicts`.
  - Source: https://github.com/mattpocock/skills/tree/main/skills/engineering/resolving-merge-conflicts
  - License: MIT, copyright Matt Pocock.
  - Changes: Requires reading `.changes/intents` and `.changes/issues`, analyzes semantic conflicts beyond Git conflict hunks, and writes `.changes/merge-reports`.

## Referenced

- `loctek-test` references the approach of `anthropics/skills@webapp-testing`.
  - Source: https://skills.sh/anthropics/skills/webapp-testing
  - Changes: Loctek keeps the web UI reconnaissance pattern but adds generic repo test discovery and intent-aware regression planning.

## Original

- `loctek-init` and `loctek-commit` are original Loctek workflows designed around semantic change records, hooks, and CI gates.

## Test Design Suite (loctek-test-req / -case / -review / -run)

- Adapted from an internal QA skill reference set (test-oriented requirement analysis, black-box case design, black-box execution, incremental code analysis, white-box walkthrough) plus its black-box/white-box rule libraries.
- Changes: outputs moved from ad-hoc `结果输出-*` paths into `.changes/qa/` protocol directories with `branch`/`issue` frontmatter so the archive skill can collect them; harness-specific tool instructions replaced with agent-neutral wording; PowerShell diff steps replaced by `scripts/loctek-test-diff.mjs`; AI self-check gates replaced by deterministic scripts (`validate-cases.mjs`, `mirror-check.mjs`); findings reflux into `.changes/issues/` bug records after user confirmation; `qa/knowledge/` designated as long-lived knowledge that is never archived.
- Attribution/self-healing execution keeps the mirror-check idea of the reference Midscene.js executor, but targets Playwright as the default engine.

