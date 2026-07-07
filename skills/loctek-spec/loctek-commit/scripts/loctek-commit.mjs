#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { relative as pathRelative, resolve, join } from "node:path";

const repo = process.argv[2] || process.cwd();

function git(args) {
  try {
    return execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const branch = git(["branch", "--show-current"]) || "unknown";
const nameStatus = git(["diff", "--cached", "--name-status"]);
const stat = git(["diff", "--cached", "--stat"]);
const diff = git(["diff", "--cached", "--", "."]);

if (!nameStatus) {
  console.error("No staged diff found. Run git add before using loctek-commit.");
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const safeBranch = sanitize(branch);
const intentDir = join(repo, ".changes", "intents", safeBranch);
const prDir = join(repo, ".changes", "pr");
mkdirSync(intentDir, { recursive: true });
mkdirSync(prDir, { recursive: true });

const intentPath = join(intentDir, `${timestamp}-intent.md`);
const prPath = join(prDir, `${safeBranch}.md`);

const intent = `---
type: intent
branch: ${branch}
created_at: ${new Date().toISOString()}
status: draft
---

# Change Intent

## 为什么改

TODO: 根据 staged diff 和相关 issue 补充背景。

## 改了什么

TODO: 总结用户可见行为、业务逻辑、接口、数据结构、测试变化。

## 涉及文件

\`\`\`
${nameStatus}
\`\`\`

TODO: 逐文件说明每个文件承担的改动。

## 必须保留的行为

TODO: 列出合并时不能丢的行为、边界条件、兼容性要求。

## 验证方式

TODO: 写实际运行的测试。未运行则写原因。

## 风险点

TODO: 写影响范围和回滚注意事项。

## 关联 Issue

TODO: 填写 .changes/issues 或 tracker 链接。

## Diff Stat

\`\`\`
${stat}
\`\`\`

## Diff 摘要输入

以下 diff 供 AI 总结，不要在 PR 正文里原样粘贴大段 diff：

\`\`\`diff
${truncate(diff, 30000)}
\`\`\`
`;

const pr = `## Why

TODO

## What Changed

TODO

## Files Changed

\`\`\`
${nameStatus}
\`\`\`

## Behavior To Preserve

TODO

## Validation

TODO

## Risks

TODO

## Rollback Plan

TODO

## Loctek Records

- Intent: ${relative(intentPath, repo)}
`;

if (!existsSync(intentPath)) writeFileSync(intentPath, intent);
writeFileSync(prPath, pr);

console.log(`Created intent: ${relative(intentPath, repo)}`);
console.log(`Updated PR draft: ${relative(prPath, repo)}`);

function sanitize(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}

function truncate(value, max) {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}\n\n[Diff truncated at ${max} chars. Run git diff --cached for full context.]`;
}

function relative(path, base) {
  return pathRelative(resolve(base), resolve(path)) || ".";
}
