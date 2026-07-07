#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { relative as pathRelative, resolve, join } from "node:path";

const repo = process.argv[2] || process.cwd();
const args = process.argv.slice(3);
const isBug = args.includes("--bug") || args.includes("--kind=bug");
const title = args.filter((arg) => arg !== "--bug" && !arg.startsWith("--kind=")).join(" ") || (isBug ? "待排查问题" : "待拆分需求");
const issuesDir = join(repo, ".changes", "issues");
mkdirSync(issuesDir, { recursive: true });

const id = nextIssueId(issuesDir);
const slug = sanitize(title).slice(0, 60) || "issue";
const path = join(issuesDir, `${id.toLowerCase()}-${slug}.md`);

const body = isBug ? bugTemplate({ id, title }) : featureTemplate({ id, title });

if (existsSync(path)) {
  console.error(`Issue file already exists: ${path}`);
  process.exit(1);
}

writeFileSync(path, body);
console.log(`Created ${relative(path, repo)}`);

function featureTemplate({ id, title }) {
  return `---
type: issue
id: ${id}
issue_kind: feature
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
}

function bugTemplate({ id, title }) {
  return `---
type: issue
id: ${id}
issue_kind: bug
slice_type: AFK
risk: medium
status: draft
---

# ${title}

## 现象

TODO: 用户实际看到了什么错误、异常或不符合预期的行为。

## 期望行为

TODO: 正常情况下应该发生什么。

## 复现信息

TODO: 复现步骤、输入数据、环境、账号/权限、时间范围；不能复现时写需要补什么证据。

## 已知事实

TODO: 日志、截图、接口响应、控制台输出、trace id、已尝试动作、已排除假设。

## 初始假设

- [ ] TODO: 最可能根因 1，以及如何验证/排除。

## 排查计划

TODO: 按症状链路写最小排查顺序，不做整个模块优化。

## 修复边界

TODO: 只修什么；明确不做哪些顺手重构或功能优化。

## 验收标准

- [ ] 原始症状被修复或根因被明确定位。
- [ ] 修复不改变必须保留的既有行为。

## 被阻塞

无，可以立即开始；如果缺少复现信息或生产证据，请改为 HITL 并写明。

## 影响范围

TODO: 单用户/部分用户/全部用户，稳定复现/偶现，影响哪些入口。

## 预计改动区域

TODO

## 必须保留的行为

TODO

## 回归测试计划

TODO: 自动化测试、手工验证、日志/监控验证。

## 需要补充的信息

TODO: 没有则写“无”。

## 回滚考虑

TODO
`;
}

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
