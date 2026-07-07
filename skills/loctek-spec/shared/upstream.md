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

