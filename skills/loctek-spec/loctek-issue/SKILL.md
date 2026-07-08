---
name: loctek-issue
description: 中文版 issue 生成 skill。用于把需求、PRD、计划、OpenSpec 变更说明、用户故事或大文件重构计划拆成可独立领取、可测试、可合并的垂直切片 issues；也用于用户说要 bug 调试、排查问题、修复报错、定位线上异常、某功能不生效时，生成症状、复现、假设、定位、修复、回归测试导向的 bug investigation issues。写入 .changes/issues，避免把 bug 排查误拆成整个模块的功能优化。
---

# Loctek Issue

把模糊工作转成可执行 issue。功能需求走垂直切片；bug 调试走排查闭环。每个 issue 都要能独立验证、独立合并。

本 skill 改造自 `mattpocock/skills@to-issues` 的 tracer-bullet issue 拆分方法，并增加中文输出和 Loctek `.changes/issues` 协议。

## 工作流

### 1. 先判定模式

根据用户输入先选一种模式：

- **Feature Mode**：用户在描述新需求、PRD、用户故事、OpenSpec、重构计划或大文件拆分。
- **Bug Mode**：用户在描述 bug、报错、异常、不生效、回归、线上问题、调试过程或“遇到了什么问题”。

如果是 Bug Mode，不要默认对整个模块做功能拆分或优化建议。先围绕用户给出的症状建立排查路径。

### 2. 收集上下文

从对话、PRD、issue 链接、设计文档、OpenSpec、代码库中收集信息。若用户提供 issue 编号、URL 或文件路径，先读取完整正文和评论。

如果项目已经运行过 `loctek-init`，读取：

```text
.changes/config.yml
.changes/issues/
.changes/adr/
```

Bug Mode 额外收集：

- 观察到的现象和期望行为。
- 复现步骤、输入数据、环境、账号/权限、浏览器/设备、时间范围。
- 错误日志、截图、接口响应、控制台输出、trace id。
- 最近相关改动、已尝试的排查动作、已排除的假设。
- 影响范围：单用户/部分用户/全部用户，稳定复现/偶现。

信息不足时，先生成“补齐复现信息”或“建立最小复现”的 HITL/AFK issue，不要臆测大范围改造。

### 3. 探索代码库

只做足够判断拆分边界的探索：

- 读取目录结构。
- 查找相关模块、路由、接口、schema、测试。
- 查找大文件、高频修改文件、职责混杂文件。
- 读取 ADR 或项目约定。

issue 标题和描述要使用项目自己的领域词，不要用泛泛的技术词。

Bug Mode 只沿症状链路探索：入口、数据、状态、权限、接口、渲染、异步任务、缓存、边界条件、最近变更。不要把“顺便重构模块”作为 bug issue。

### 4. 拆 issue

#### Feature Mode：拆垂直切片

每个切片必须是一条窄但完整的路径，穿过必要的层：

- 数据结构或 schema
- 服务/接口
- UI 或调用入口
- 测试
- 文档或迁移说明

不要按“先写数据库、再写接口、再写页面”这种水平层拆分。

#### Bug Mode：拆排查闭环

Bug issue 要围绕排查和修复闭环拆，不围绕模块功能清单拆。优先生成 1 个窄的 bug investigation issue；只有范围明显过大时才拆成多个：

- 复现/证据：建立稳定复现、补日志、确认输入和环境。
- 定位/假设：验证最可能的 1-3 条根因假设。
- 修复：修正最小问题点，并说明不做哪些顺手优化。
- 回归：补自动化测试或手工回归清单，覆盖原始症状。

每个 bug issue 必须写清：

- 现象是什么，期望是什么。
- 如何复现，不能复现时下一步要拿什么证据。
- 当前假设和排除顺序。
- 需要保护的既有行为。
- 修复完成的判断标准。
- 回归测试如何证明问题没有复发。

不要生成“重构整个 X 模块”“优化 X 流程”“梳理 X 架构”这类 issue，除非用户明确要求重构，或 bug 已定位到必须先做 prefactor。

### 5. 标记类型

每个 issue 标记：

- `AFK`：AI/开发者可以直接实现，不需要额外人类决策。
- `HITL`：需要人类确认设计、架构、产品口径、安全边界或数据迁移方案。

优先把任务拆到 AFK，但不要把真实决策伪装成 AFK。

Bug Mode 下，如果缺少复现信息、生产权限、敏感数据、产品期望或错误样本，标记为 `HITL`。

### 6. 大文件拆分

如果需求会继续放大某个大文件或高冲突文件，先生成 prefactor issue，让后续变更更容易：

- 抽出纯函数。
- 抽出领域 service。
- 抽出组件。
- 拆路由或状态管理。
- 为现有行为补回归测试。

prefactor issue 也必须可验证，不能是“整理代码”这种空泛任务。

Bug Mode 下，只有当大文件本身阻碍定位或测试时才生成 prefactor issue，并且标题要写成“为定位/回归某 bug 提取最小测试点”，不要扩散成模块优化。

### 7. 轻量确认

默认给出编号列表并继续写入 `.changes/issues`。只有下面情况才停下来问用户：

- 需要产品/架构/安全口径决策。
- 同一个需求能拆成多种明显不同方案。
- 可能引入大范围重构或数据迁移。
- 用户明确要求“先不要生成文件”。

输出列表包含：

- 标题
- 模式：Feature / Bug
- 类型：AFK / HITL
- 被哪些任务阻塞
- Feature 覆盖哪些用户故事；Bug 覆盖哪个症状和哪条假设
- 风险等级
- 验证方式

不要发布到外部 issue tracker，除非用户明确要求。

### 8. 写入 `.changes/issues`

为每个 issue 写一个文件：

```text
.changes/issues/<issue-id>-<slug>.md
```

可以用脚本先生成单个 issue 文件骨架。

Feature Mode：

```bash
node "<skill-dir>/scripts/loctek-issue.mjs" . "Issue 标题"
```

Bug Mode：

```bash
node "<skill-dir>/scripts/loctek-issue.mjs" . --bug "Issue 标题"
```

Feature 模板：

```markdown
---
type: issue
id: ISSUE-001
issue_kind: feature
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

Bug 模板：

```markdown
---
type: issue
id: ISSUE-001
issue_kind: bug
slice_type: AFK
risk: medium
status: draft
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

- [ ] ...

## 必须保留的行为

## 回归测试计划

## 需要补充的信息

## 回滚考虑
```

## 输出要求

- 默认中文。
- 标题短，能进入 issue tracker。
- 不在 issue 正文里堆具体代码片段，除非原型代码本身就是决策依据。
- 不关闭或修改父 issue。
- 生成 `.changes/issues` 文件可以自动进行；发布到外部 issue tracker 前先取得用户确认。
- Bug Mode 必须聚焦用户报告的问题，不主动扩大成模块重构或功能优化。
