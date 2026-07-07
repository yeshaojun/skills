#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repo = process.argv[2] || process.cwd();
const now = new Date().toISOString();
const created = [];
const skipped = [];

function ensureDir(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
    created.push(path);
  }
}

function writeNew(rel, content) {
  const path = join(repo, rel);
  ensureDir(dirname(path));
  if (existsSync(path)) {
    skipped.push(rel);
    return;
  }
  writeFileSync(path, content);
  created.push(rel);
}

function template(name) {
  return readFileSync(join(__dirname, "..", "assets", name), "utf8");
}

ensureDir(join(repo, ".changes"));
for (const dir of ["issues", "work-reports", "intents", "merge-reports", "test-reports", "pr", "adr", "releases"]) {
  ensureDir(join(repo, ".changes", dir));
  writeNew(join(".changes", dir, ".gitkeep"), "");
}

writeNew(".changes/config.yml", template("changes-config.yml"));
writeNew(".changes/README.md", template("changes-readme.md"));
writeNew(".gitmessage", template("gitmessage.txt"));
writeNew(".github/pull_request_template.md", template("pull_request_template.md"));
writeNew(".github/workflows/loctek-intent-check.yml", template("loctek-intent-check.yml"));
writeNew("CODEOWNERS", template("CODEOWNERS"));
writeNew("tools/loctek/validate-intent.mjs", template("validate-intent.mjs"));
writeNew("tools/loctek/collect-context.mjs", template("collect-context.mjs"));
writeNew("tools/loctek/install-git-hooks.mjs", template("install-git-hooks.mjs"));
writeNew("tools/loctek/hooks/commit-msg", template("commit-msg-hook"));

const report = `# Loctek Init Report

Created at: ${now}
Repository: ${repo}

## Created

${created.length ? created.map((item) => `- ${item}`).join("\n") : "- None"}

## Skipped Existing Files

${skipped.length ? skipped.map((item) => `- ${item}`).join("\n") : "- None"}

## Next Steps

- Review .changes/config.yml.
- Run: node tools/loctek/install-git-hooks.mjs
- Configure branch protection so CI must pass before merging.
- Ask an agent to use $loctek-issue for the first feature breakdown.
`;

writeNew(".changes/init-report.md", report);

console.log(report);
