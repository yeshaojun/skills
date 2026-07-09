---
name: loctek-commit
description: commit-first 的语义提交 skill。用于用户要求提交代码、生成 commit、提交当前改动、生成 commit message、生成 .changes/intents、生成 PR 描述、或检查提交是否说明 why/what/preserve/validation/risks 时触发。默认读取当前工作区改动并提交安全相关文件，除非用户明确要求 --prepare、不提交、--exclude 排除文件或 --only 限定文件；自动生成中文 change intent 和 PR 草稿，避免后续 AI 合并时丢失业务意图。
---

# Loctek Commit

默认完成一次语义提交：选择相关改动、生成 intent、生成 PR 草稿、生成 commit message，并执行 `git commit`。只有用户明确要求“只准备/不要提交”时才停在 prepare 模式。

本 skill 采用轻治理：能自动提交就提交；缺少测试报告不阻止 commit，但必须在 intent 里记录验证状态。真正强门禁放在 merge/PR 阶段。

## 工作流

### 1. 检查当前改动

先运行：

```bash
git status --short
git diff --name-status
git diff --cached --name-status
```

没有任何改动时不要提交。有 merge conflict 时不要提交。

### 2. 读取上下文

读取：

```text
.changes/config.yml
.changes/issues/
.changes/work-reports/
.changes/test-reports/
.changes/session-notes/
.changes/adr/
```

再看当前分支名：

```bash
git branch --show-current
```

如果分支名、work report 或用户上下文能推断 issue，就自动关联。多个 issue 可以一起提交，但 intent 要简单说明为什么属于同一次提交。

只读取活跃目录，不默认读取 `.changes/archive/`。如果需要追溯历史，必须说明原因后再读取 archive。

### 3. 选择提交范围

默认提交当前工作区里与本次工作相关的安全文件。用户明确说“不提交某些文件”时用 `--exclude`；用户明确说“只提交这些文件”时用 `--only`。

不要使用 `git add .`。必须让脚本用显式文件列表执行 `git add -- <files>`。

自动拦截：

- `.env`、`.env.*`
- 私钥、证书、credential/secret 路径
- log、tmp、bak、swap 文件
- `node_modules/`
- 大于 5MB 的文件
- 已 staged 但不在本次选择范围内的文件

高风险但不自动拦截的文件要写入 intent 风险点：lockfile、package.json、`.github/`、migration、auth、permission、payment、route 等。

### 4. 生成 intent、PR 草稿并提交

默认提交：

```bash
node "<skill-dir>/scripts/loctek-commit.mjs" . \
  --summary "修复订单筛选为空" \
  --why "订单筛选后列表为空，影响用户查看筛选结果。" \
  --what "修正筛选参数映射，并提交对应 Loctek 记录。" \
  --validation "git diff --cached --check"
```

脚本会创建：

```text
.changes/intents/<branch>/<timestamp>-intent.md
.changes/pr/<branch>.md
```

然后把业务改动和 Loctek 记录一起 commit。

只准备不提交：

```bash
node "<skill-dir>/scripts/loctek-commit.mjs" . --prepare
```

排除文件：

```bash
node "<skill-dir>/scripts/loctek-commit.mjs" . --exclude .env debug.log
```

只提交指定文件：

```bash
node "<skill-dir>/scripts/loctek-commit.mjs" . --only src/orders/filter.ts tests/orders/filter.test.ts
```

多 issue 提交：

```bash
node "<skill-dir>/scripts/loctek-commit.mjs" . \
  --issue ISSUE-001 --issue ISSUE-002 \
  --multi-issue-reason "筛选和导出共用同一套查询参数修复"
```

### 5. 用 AI 补全语义

作为 AI 执行时，提交前先根据 diff、issue、work report、test report、session notes 形成下面这些语义，并通过 `--why`、`--what`、`--validation`、`--risks` 传给脚本；不确定时先用 `--prepare`。

当前 intent 的来源是项目内可审计材料：代码 diff、分支名、`.changes` 活跃记录、用户在本轮对话里明确说出的信息，以及 `.changes/session-notes/` 里的关键决策。不要直接读取或依赖 Codex、Claude、Cursor 的私有会话数据库；如果某个关键决策只存在于聊天里，先把它整理进 work report 或 session note。

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

## 会话决策记录

列出相关 session notes 的关键内容。没有匹配记录时写“未发现相关 session notes”，不要编造。
```

### 6. Commit message

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

### 7. PR 描述

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

- 默认提交当前安全相关改动，除非用户明确要求 prepare、exclude 或 only。
- 不要使用 `git add .`。
- 不要自动 `git push`。
- 不要把 secrets 写入 intent。
- 不要伪造测试结果。
- 不要提交危险文件；发现已 staged 的危险文件时停止。
- 多 issue commit 允许，但要在 intent 或 commit message 里说明原因。
- 高风险文件必须写 `必须保留的行为` 和 `风险点`；缺少测试报告时提醒 merge 前补 `loctek-test`。
- 如果 diff 太大，建议拆分提交或回到 `loctek-issue` 做任务拆分。

## 完成标准

- 当前相关改动已提交，或用户明确选择 prepare。
- `.changes/intents/...md` 已创建或更新。
- commit message 包含必填语义字段。
- PR 草稿可直接复制到平台。
- 未运行测试有明确原因。
