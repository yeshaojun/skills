---
name: loctek-archive
description: 归档 Loctek .changes 活跃记录的 skill。用于用户要求清理、归档、收束已完成 issue、已合并分支、PR/merge/test 后的语义记录，或担心 .changes 文档越来越多影响 AI 合并上下文时触发。默认先 dry-run，能高置信度匹配 issue/branch 时自动归档，不能确定时给出明确的手动归档命令和原因。
---

# Loctek Archive

把已经完成、已合并、已验证的 Loctek 记录从活跃目录移到 `.changes/archive/`，让后续 merge 只读取当前上下文，避免历史文档越积越多。

归档是整理上下文，不是删除证据。归档后的记录默认不参与 commit/merge/test 的常规读取；只有追溯历史时才进入 archive。

## 工作流

### 1. 判断是否适合归档

适合自动归档：

- issue 已完成，验收标准已验证。
- 分支已经合并，且没有未解决冲突。
- merge report 或 test report 已写明结果。
- 能从 issue id、分支名或 merge report 高置信度匹配相关记录。

不适合自动归档：

- 仍有 unresolved conflict。
- issue 仍是 `draft`、`in_progress` 或验收标准未完成。
- 多个 issue/branch 互相混杂，无法确认哪些记录属于同一工作。
- `.changes` 或 `tools/loctek` 权限异常。
- 用户明确要求只生成归档建议。

不适合自动归档时，不要强行移动文件；给出原因和手动命令。

### 2. 先 dry-run

按 issue 归档：

```bash
node tools/loctek/archive.mjs . --issue ISSUE-001 --dry-run
```

按分支归档：

```bash
node tools/loctek/archive.mjs . --branch feature/order-filter --dry-run
```

按 merge report 归档：

```bash
node tools/loctek/archive.mjs . --from-merge-report .changes/merge-reports/2026-07-09-feature-x-into-main.md --dry-run
```

检查 dry-run 结果只包含本次已完成工作的 Loctek 记录。

### 3. 执行归档

确认后去掉 `--dry-run`：

```bash
node tools/loctek/archive.mjs . --issue ISSUE-001
node tools/loctek/archive.mjs . --branch feature/order-filter
node tools/loctek/archive.mjs . --from-merge-report .changes/merge-reports/2026-07-09-feature-x-into-main.md
```

输出目录：

```text
.changes/archive/YYYY-MM/<issue-or-branch>/
  index.md
  issues/
  work-reports/
  intents/
  test-reports/
  merge-reports/
  pr/
  session-notes/
```

### 4. 归档后处理

- `git status --short` 检查移动结果。
- 如果归档属于本次 merge/test 收尾，后续用 `loctek-commit` 提交归档移动。
- 如果归档失败，不要阻塞合并本身；在 merge/test report 写明失败原因和可执行命令。

## 读取规则

- 常规开发、提交、测试、合并只读取 `.changes/` 活跃目录。
- 不默认读取 `.changes/archive/`。
- 只有用户要求追溯历史、排查旧决策、复盘已合并内容时才读取 archive。

## 完成标准

- 已先 dry-run，或能从 merge/test 上下文高置信度判断归档范围。
- 活跃目录中不再保留已完成工作的历史记录。
- archive 目录有 `index.md`，能说明归档时间、条件和移动文件。
- 无法自动归档时，已写出明确原因和手动命令。
