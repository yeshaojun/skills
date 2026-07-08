---
name: loctek-work
description: 按 Loctek issue 执行开发、排查 bug、重构或验证的工作流 skill。用于用户要求“根据某个 .changes/issues issue 开发/实现/修复/排查/继续做”、需要从 issue 验收标准出发探索代码、制定实现计划、修改代码、记录 work report、准备测试和提交时触发。承接 loctek-issue，产出 .changes/work-reports，并为 loctek-test 和 loctek-commit 提供上下文。
---

# Loctek Work

按 issue 做真实工作：理解、排查、实现、验证、记录。它承接 `loctek-issue`，并为 `loctek-test` 和 `loctek-commit` 准备上下文。

## 工作流

### 1. 选择 issue

优先从用户指定的 issue 文件开始：

```text
.changes/issues/<issue-id>-<slug>.md
```

如果用户没有指定，先自动推断：

- 分支名包含 issue id：高置信度，直接使用并说明原因。
- 最近创建或 `in_progress` 的 issue 与改动路径匹配：中置信度，给出推荐。
- 多个 issue 都可能相关：列出候选，让用户选择。

不要因为低风险的不确定性中断工作太久；无法确定时在 work report 写明“未关联 issue”并继续用户明确要求的排查/实现。

### 2. 读取上下文

读取：

```text
.changes/config.yml
.changes/issues/<selected>.md
.changes/adr/
.changes/intents/
.changes/test-reports/
```

只读取与当前 issue 相关的上下文，避免把无关历史带入实现。

### 3. 建立工作记录

先生成 work report 骨架：

```bash
node "<skill-dir>/scripts/loctek-work.mjs" . ".changes/issues/<issue-file>.md"
```

输出：

```text
.changes/work-reports/<issue-id>-<date>.md
```

工作过程中持续更新它。

### 4. 探索代码

围绕 issue 的“目标、非目标、验收标准、影响范围、必须保留的行为”探索代码：

- 先用 `rg` 和目录结构找入口。
- 读取相关路由、service、schema、组件、测试。
- 查找现有模式，优先沿用项目已有风格。
- 如果是 bug，先找复现路径和可疑提交/模块。

不要一上来大范围改代码。

### 5. 制定实现或排查计划

动手前写一个短计划：

- 要改哪些模块。
- 为什么这样改。
- 哪些行为不能动。
- 哪些验收标准会被覆盖。
- 需要补哪些测试。

如果发现 issue 本身拆错了、验收标准不清、需要产品/架构决策，优先在 work report 写明建议；只有会导致错误实现时才停止并回到 `loctek-issue` 更新 issue。

### 6. 执行

按 issue 的最小闭环完成工作：

- 新功能：实现一条可演示的端到端路径。
- bug：先复现或定位根因，再修复，再补回归验证。
- 重构：先保护现有行为，再做小步迁移。

不要把不属于当前 issue 的顺手优化塞进来。

### 7. 更新 work report

写清楚：

```markdown
## Issue
## Understanding
## Investigation
## Implementation
## Acceptance Criteria
## Tests
## Files Changed
## Behavior Preserved
## Follow-ups
```

bug 还要写：

```markdown
## Reproduction
## Root Cause
## Fix
## Regression Test
```

### 8. 触发后续流程

完成实现后：

1. 使用 `loctek-test` 生成/运行测试计划。
2. 使用 `loctek-commit` 生成 intent 和 PR 草稿。
3. 如果 issue 没做完，在 work report 里写清楚剩余工作。

普通改动可以提交后再补更完整测试；高风险改动先触发 `loctek-test`。

## 完成标准

- 选定 issue 已读取。
- 验收标准逐条检查。
- 代码改动只覆盖当前 issue 的范围。
- `.changes/work-reports/...md` 已生成并更新。
- 测试已运行，或明确写出未运行原因。
- 后续 commit 能引用 issue 和 work report。
