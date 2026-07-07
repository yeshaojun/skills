#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { relative as pathRelative, resolve, join } from "node:path";

const repo = process.argv[2] || process.cwd();
const title = process.argv.slice(3).join(" ") || "待拆分需求";
const issuesDir = join(repo, ".changes", "issues");
mkdirSync(issuesDir, { recursive: true });

const id = nextIssueId(issuesDir);
const slug = sanitize(title).slice(0, 60) || "issue";
const path = join(issuesDir, `${id.toLowerCase()}-${slug}.md`);

const body = `---
type: issue
id: ${id}
slice_type: AFK
risk: medium
status: draft
---

# ${title}

## 背景

TODO

## 目标

TODO

## 非目标

TODO

## 要构建什么

TODO: 描述端到端行为，不按层拆任务。

## 验收标准

- [ ] TODO

## 被阻塞

无，可以立即开始。

## 影响范围

TODO

## 预计改动区域

TODO

## 必须保留的行为

TODO

## 测试计划

TODO

## 回滚考虑

TODO
`;

if (existsSync(path)) {
  console.error(`Issue file already exists: ${path}`);
  process.exit(1);
}

writeFileSync(path, body);
console.log(`Created ${relative(path, repo)}`);

function nextIssueId(dir) {
  let max = 0;
  try {
    for (const name of readdirSync(dir)) {
      const match = name.match(/^issue-(\d+)/i);
      if (match) max = Math.max(max, Number(match[1]));
    }
  } catch {}
  return `ISSUE-${String(max + 1).padStart(3, "0")}`;
}

function sanitize(value) {
  return value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-").replace(/^-+|-+$/g, "");
}

function relative(path, base) {
  return pathRelative(resolve(base), resolve(path)) || ".";
}
