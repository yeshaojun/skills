# Loctek `.changes` Protocol

Loctek skills share one project-local protocol. The point is to preserve semantic intent across issue planning, commit, merge, and test phases.

## Directory

```text
.changes/
  config.yml
  issues/
  work-reports/
  intents/
  merge-reports/
  test-reports/
  pr/
  adr/
  releases/
```

## Required Fields

### Issue

Feature issue:

```markdown
---
type: issue
id: ISSUE-001
issue_kind: feature
status: draft
risk: medium
---

# 标题

## 背景
## 目标
## 非目标
## 验收标准
## 影响范围
## 预计改动区域
## 风险点
## 测试计划
## 回滚考虑
## 拆分方案
```

Bug issue:

```markdown
---
type: issue
id: ISSUE-002
issue_kind: bug
status: draft
risk: medium
---

# 标题

## 现象
## 期望行为
## 复现信息
## 已知事实
## 初始假设
## 排查计划
## 修复边界
## 验收标准
## 必须保留的行为
## 回归测试计划
## 需要补充的信息
## 回滚考虑
```

### Commit Intent

```markdown
---
type: intent
branch: feature/example
created_at: 2026-07-07T00:00:00Z
status: draft
---

# Change Intent

## 为什么改
## 改了什么
## 涉及文件
## 必须保留的行为
## 验证方式
## 风险点
## 关联 Issue
```

### Work Report

```markdown
---
type: work-report
issue: ISSUE-001
branch: feature/example
status: draft
---

# Work Report

## Issue
## Understanding
## Investigation
## Implementation
## Acceptance Criteria
## Tests
## Files Changed
## Behavior Preserved
## Bug Details
## Follow-ups
```

### Merge Report

```markdown
---
type: merge-report
current_branch: feature/example
target_branch: main
status: draft
---

# Merge Report

## 合并目标
## 当前分支必须保留
## 目标分支必须保留
## 共同修改文件
## 潜在语义冲突
## 冲突解决记录
## 合并后验证清单
## 剩余风险
```

### Test Report

```markdown
---
type: test-report
branch: feature/example
status: draft
---

# Test Report

## 影响分析
## 必跑测试
## 已运行测试
## 未运行测试
## 手工验证
## 回归风险
```

## Rules

- Prefer many small records over one shared file that causes conflicts.
- Never overwrite existing `.changes` records without explicit user approval.
- Treat `.changes` records as evidence, not truth. Verify against code, tests, PRs, and issues.
- Issue skills must classify each issue as `issue_kind: feature` or `issue_kind: bug` before splitting work.
- Bug issues must stay focused on symptoms, reproduction, hypotheses, fix boundary, and regression tests. Do not expand them into broad module optimization unless the user explicitly asks.
- Work skills must read the selected issue and create/update a work report before handing off to test or commit.
- Merge skills must read relevant issue and intent records before resolving conflicts.
- Test skills must read intent and merge reports before selecting tests.
