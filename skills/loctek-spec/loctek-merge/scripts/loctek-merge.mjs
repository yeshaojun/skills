#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { relative as pathRelative, resolve, join } from "node:path";

const repo = process.argv[2] || process.cwd();
const target = process.argv[3] || "main";

function git(args) {
  try {
    return execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const current = git(["branch", "--show-current"]) || "unknown";
const base = git(["merge-base", "HEAD", target]);
const conflicted = git(["diff", "--name-only", "--diff-filter=U"]);
const currentFiles = base ? git(["diff", "--name-status", `${base}..HEAD`]) : "";
const targetFiles = base ? git(["diff", "--name-status", `${base}..${target}`]) : "";
const currentLog = base ? git(["log", "--reverse", "--format=%h %s", `${base}..HEAD`]) : "";
const targetLog = base ? git(["log", "--reverse", "--format=%h %s", `${base}..${target}`]) : "";

const reportDir = join(repo, ".changes", "merge-reports");
mkdirSync(reportDir, { recursive: true });

const filename = `${new Date().toISOString().slice(0, 10)}-${sanitize(current)}-into-${sanitize(target)}.md`;
const reportPath = join(reportDir, filename);

const report = `---
type: merge-report
current_branch: ${current}
target_branch: ${target}
status: draft
---

# Merge Report

## 合并目标

将 ${current} 合并到 ${target}，并保留双方语义意图。

## Git 上下文

- merge-base: ${base || "unknown"}

### 当前分支提交

\`\`\`
${currentLog || "No log available."}
\`\`\`

### 目标分支提交

\`\`\`
${targetLog || "No log available."}
\`\`\`

### 当前分支改动文件

\`\`\`
${currentFiles || "No changed files detected."}
\`\`\`

### 目标分支改动文件

\`\`\`
${targetFiles || "No changed files detected."}
\`\`\`

### Git 冲突文件

\`\`\`
${conflicted || "No unresolved conflict files at generation time."}
\`\`\`

## 当前分支必须保留

TODO: 从 .changes/intents、commit message、PR、issue 中提取。

## 目标分支必须保留

TODO: 从 .changes/intents、commit message、PR、issue 中提取。

## 共同修改文件

TODO: 对比双方 changed files，列出语义冲突候选。

## 潜在语义冲突

TODO

## 冲突解决记录

TODO

## 合并后验证清单

TODO

## 已运行测试

TODO

## 剩余风险

TODO
`;

if (!existsSync(reportPath)) writeFileSync(reportPath, report);
console.log(`Created ${relative(reportPath, repo)}`);

function sanitize(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}

function relative(path, base) {
  return pathRelative(resolve(base), resolve(path)) || ".";
}
