# .changes

This directory stores machine-readable context for AI-assisted development.

Use it to preserve intent:

- `issues/`: feature breakdown and acceptance criteria.
- `work-reports/`: implementation, debugging, and acceptance-criteria progress for one issue.
- `intents/`: per-commit or per-change intent records.
- `merge-reports/`: merge/rebase conflict reports.
- `test-reports/`: risk-based test plans and results.
- `pr/`: PR body drafts.
- `adr/`: architecture decisions.
- `releases/`: release notes and rollback plans.

Do not keep one shared mutable file for all changes. Prefer one small file per issue, change, merge, or test run.
