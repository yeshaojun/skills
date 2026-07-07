---
name: loctek-issue
description: 中文版功能拆分和 issue 生成 skill。用于把需求、PRD、计划、OpenSpec 变更说明、用户故事或大文件重构计划拆成可独立领取、可测试、可合并的垂直切片 issues，并写入 .changes/issues。优先借鉴 mattpocock/skills 的 to-issues tracer-bullet 方法，同时加入 Loctek 的风险、测试、回滚和大文件拆分规范。
---

# Loctek Issue

把模糊需求拆成小而完整的垂直切片。每个 issue 都要能独立实现、独立验证、独立合并。

本 skill 改造自 `mattpocock/skills@to-issues` 的 tracer-bullet issue 拆分方法，并增加中文输出和 Loctek `.changes/issues` 协议。

## 工作流

### 1. 收集上下文

从对话、PRD、issue 链接、设计文档、OpenSpec、代码库中收集信息。若用户提供 issue 编号、URL 或文件路径，先读取完整正文和评论。

如果项目已经运行过 `loctek-init`，读取：

```text
.changes/config.yml
.changes/issues/
.changes/adr/
```

### 2. 探索代码库

只做足够判断拆分边界的探索：

- 读取目录结构。
- 查找相关模块、路由、接口、schema、测试。
- 查找大文件、高频修改文件、职责混杂文件。
- 读取 ADR 或项目约定。

issue 标题和描述要使用项目自己的领域词，不要用泛泛的技术词。

### 3. 拆垂直切片

每个切片必须是一条窄但完整的路径，穿过必要的层：

- 数据结构或 schema
- 服务/接口
- UI 或调用入口
- 测试
- 文档或迁移说明

不要按“先写数据库、再写接口、再写页面”这种水平层拆分。

### 4. 标记类型

每个 issue 标记：

- `AFK`：AI/开发者可以直接实现，不需要额外人类决策。
- `HITL`：需要人类确认设计、架构、产品口径、安全边界或数据迁移方案。

优先把任务拆到 AFK，但不要把真实决策伪装成 AFK。

### 5. 大文件拆分

如果需求会继续放大某个大文件或高冲突文件，先生成 prefactor issue，让后续变更更容易：

- 抽出纯函数。
- 抽出领域 service。
- 抽出组件。
- 拆路由或状态管理。
- 为现有行为补回归测试。

prefactor issue 也必须可验证，不能是“整理代码”这种空泛任务。

### 6. 让用户确认

先给用户一个编号列表：

- 标题
- 类型：AFK / HITL
- 被哪些任务阻塞
- 覆盖哪些用户故事
- 风险等级
- 验证方式

询问粒度是否合适、依赖是否正确、是否需要合并或继续拆分。用户确认前不要发布到 issue tracker。

### 7. 写入 `.changes/issues`

确认后，为每个 issue 写一个文件：

```text
.changes/issues/<issue-id>-<slug>.md
```

可以用脚本先生成单个 issue 文件骨架：

```bash
node "<skill-dir>/scripts/loctek-issue.mjs" . "Issue 标题"
```

模板：

```markdown
---
type: issue
id: ISSUE-001
slice_type: AFK
risk: medium
status: draft
---

# 标题

## 背景

## 目标

## 非目标

## 要构建什么

## 验收标准

- [ ] ...

## 被阻塞

无，可以立即开始。

## 影响范围

## 预计改动区域

## 必须保留的行为

## 测试计划

## 回滚考虑
```

## 输出要求

- 默认中文。
- 标题短，能进入 issue tracker。
- 不在 issue 正文里堆具体代码片段，除非原型代码本身就是决策依据。
- 不关闭或修改父 issue。
- 发布到外部 issue tracker 前先取得用户确认。
