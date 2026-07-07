---
name: loctek-merge
description: 意图感知的 Git 合并和冲突解决 skill。用于用户要求合并分支、rebase、解决 merge conflict、避免 AI 合并时丢功能时触发。基于 mattpocock/skills 的 resolving-merge-conflicts 流程，增强为先读取 .changes/issues、.changes/intents、commit messages 和 PR 说明，再分析语义冲突、解决文本冲突、生成 .changes/merge-reports。
---

# Loctek Merge

合并时先合并“业务意图”，再合并文本。不要只看 `<<<<<<<` 冲突块。

本 skill 改造自 `mattpocock/skills@resolving-merge-conflicts`，加入 Loctek `.changes` 语义记录和 merge report。

## 工作流

### 1. 查看合并状态

运行：

```bash
git status --short
git branch --show-current
git diff --name-only --diff-filter=U
```

如果正在 rebase，也检查：

```bash
git status
```

### 2. 找共同祖先和双方改动

如果目标分支是 `main`：

```bash
BASE=$(git merge-base HEAD main)
git log --reverse --format=fuller "$BASE"..HEAD
git log --reverse --format=fuller "$BASE"..main
git diff --name-status "$BASE"..HEAD
git diff --name-status "$BASE"..main
```

如果目标分支不同，替换 `main`。

### 3. 读取语义来源

优先读取：

```text
.changes/issues/
.changes/intents/
.changes/pr/
.changes/merge-reports/
```

再读取：

- commit message
- PR 描述
- issue/ticket
- ADR
- 测试说明

目标是理解双方为什么改，不是只理解代码怎么写。

### 4. 生成合并计划

动手改代码前，先写出：

```markdown
## 当前分支必须保留
## 目标分支必须保留
## 双方共同修改文件
## Git 未报冲突但可能有语义冲突的文件
## 合并策略
## 合并后验证清单
```

### 5. 解决冲突

规则：

- 尽量保留双方意图。
- 不能保留时，按本次合并目标选择，并记录取舍。
- 不发明新行为。
- 不删除自己没理解的逻辑。
- 不使用 destructive git 命令。
- 对双方都改过但未冲突的文件也做语义检查。

必要时查看三方版本：

```bash
git show :1:path/to/file
git show :2:path/to/file
git show :3:path/to/file
```

### 6. 运行检查

发现项目测试命令，通常顺序：

```bash
typecheck
test
lint
build
```

如果项目有 `loctek-test`，合并后触发它生成测试计划。

### 7. 写 merge report

写入：

```text
.changes/merge-reports/<date>-<current>-into-<target>.md
```

可以先用脚本生成 Git 上下文和报告骨架：

```bash
node "<skill-dir>/scripts/loctek-merge.mjs" . main
```

模板：

```markdown
---
type: merge-report
current_branch: feature/x
target_branch: main
status: complete
---

# Merge Report

## 合并目标

## 当前分支必须保留

## 目标分支必须保留

## 共同修改文件

## 潜在语义冲突

## 冲突解决记录

## 合并后验证清单

## 已运行测试

## 剩余风险
```

## 完成标准

- 没有未解决冲突。
- 合并计划已经覆盖双方 intent。
- 共同修改文件已检查。
- merge report 已生成。
- 相关测试已运行，或明确说明没运行及原因。
