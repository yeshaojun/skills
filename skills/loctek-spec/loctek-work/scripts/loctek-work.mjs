#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, relative as pathRelative, resolve } from "node:path";

const repo = process.argv[2] || process.cwd();
const issueArg = process.argv[3] || "";

if (!issueArg) {
  console.error("Usage: node loctek-work.mjs <repo> <.changes/issues/issue-file.md>");
  process.exit(1);
}

const issuePath = resolve(repo, issueArg);
if (!existsSync(issuePath)) {
  console.error(`Issue file not found: ${issueArg}`);
  process.exit(1);
}

function git(args) {
  try {
    return execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const issueText = readFileSync(issuePath, "utf8");
const issueId = extract(issueText, /^id:\s*(.+)$/m) || basename(issuePath).replace(/\.md$/, "");
const title = extract(issueText, /^#\s+(.+)$/m) || basename(issuePath);
const branch = git(["branch", "--show-current"]) || "unknown";
const status = git(["status", "--short"]);
const changed = git(["diff", "--name-status"]) || git(["diff", "--cached", "--name-status"]);

const outDir = join(repo, ".changes", "work-reports");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `${sanitize(issueId)}-${new Date().toISOString().slice(0, 10)}.md`);

const report = `---
type: work-report
issue: ${issueId}
branch: ${branch}
status: draft
---

# Work Report: ${title}

## Issue

- File: ${pathRelative(resolve(repo), issuePath)}
- ID: ${issueId}

## Understanding

TODO: 用自己的话说明这个 issue 要解决什么，以及非目标是什么。

## Investigation

TODO: 记录阅读了哪些文件、发现了什么。

## Implementation

TODO: 记录改了什么、为什么这样改。

## Acceptance Criteria

TODO: 逐条复制 issue 的验收标准，并标记完成情况。

## Tests

TODO: 记录已运行测试、未运行测试和原因。

## Files Changed

\`\`\`
${changed || status || "No working tree changes at report creation time."}
\`\`\`

## Behavior Preserved

TODO: 记录必须保留的行为是否仍然成立。

## Bug Details

### Reproduction

TODO: 如果这是 bug，记录复现方式；不是 bug 可写 N/A。

### Root Cause

TODO

### Fix

TODO

### Regression Test

TODO

## Follow-ups

TODO
`;

if (!existsSync(outPath)) writeFileSync(outPath, report);
console.log(`Created ${pathRelative(resolve(repo), outPath)}`);

function extract(text, regex) {
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

function sanitize(value) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "issue";
}

