---
name: loctek-commit
description: 语义提交和 PR 草稿 skill。用于用户准备提交代码、要求生成 commit message、提交前总结 staged diff、生成 .changes/intents、生成 PR 描述、检查提交是否说明 why/what/preserve/validation/risks 时触发。读取 staged diff 和相关 issue，生成中文 change intent，避免后续 AI 合并时丢失业务意图。
---

# Loctek Commit

提交前把“为什么改、改了什么、必须保留什么、怎么验证”写成可被后续合并和测试读取的记录。

## 工作流

### 1. 检查 staged diff

先运行：

```bash
git status --short
git diff --cached --name-status
git diff --cached --stat
```

没有 staged diff 时不要提交。提醒用户先 `git add`。

### 2. 读取上下文

读取：

```text
.changes/config.yml
.changes/issues/
.changes/adr/
```

再看当前分支名：

```bash
git branch --show-current
```

如果分支名包含 issue id，把相关 issue 作为主要上下文。

### 3. 生成 intent 草稿

可以先运行脚本生成文件骨架和 diff 摘要：

```bash
node "<skill-dir>/scripts/loctek-commit.mjs" .
```

脚本会创建：

```text
.changes/intents/<branch>/<timestamp>-intent.md
.changes/pr/<branch>.md
```

### 4. 用 AI 补全语义

根据 staged diff 把 intent 写完整：

```markdown
## 为什么改

说明背景、用户问题、bug、需求或技术债。

## 改了什么

说明用户可见行为、业务逻辑、接口、数据结构、测试的变化。

## 涉及文件

逐文件说明作用，不要只列文件名。

## 必须保留的行为

列出后续合并时不能丢的行为、边界条件、兼容性要求。

## 验证方式

写实际运行的测试或手工验证。没运行必须写原因。

## 风险点

说明可能影响的模块和回滚注意事项。
```

### 5. 生成 commit message

commit message 必须包含：

```text
<type>(<scope>): <summary>

Why:
What:
Preserve:
Validation:
Risks:
```

不要接受只有 `fix bug`、`update`、`wip` 的提交。

### 6. 生成 PR 描述

如果用户准备开 PR，更新：

```text
.changes/pr/<branch>.md
```

PR 草稿必须包含：

- Why
- What Changed
- Files Changed
- Behavior To Preserve
- Validation
- Risks
- Rollback Plan
- Loctek Records

## 提交规则

- 不要自动提交未 staged 的文件。
- 不要把 secrets 写入 intent。
- 不要伪造测试结果。
- 高风险文件必须写 `必须保留的行为` 和 `风险点`。
- 如果 diff 太大，建议拆分提交或回到 `loctek-issue` 做任务拆分。

## 完成标准

- staged diff 已总结。
- `.changes/intents/...md` 已创建或更新。
- commit message 包含必填语义字段。
- PR 草稿可直接复制到平台。
- 未运行测试有明确原因。

