# Loctek Spec — AI 代理协作规则

本项目使用 `.changes/` 记录 AI 辅助开发的语义上下文，目的是避免提交、测试、合并时丢失用户意图。

## 1. 读取规则

- 开始处理需求、bug、重构或合并前，优先读取相关活跃记录：`.changes/issues/`、`.changes/work-reports/`、`.changes/intents/`、`.changes/test-reports/`、`.changes/merge-reports/`、`.changes/pr/`、`.changes/session-notes/`。
- 常规工作不要默认读取 `.changes/archive/`；只有用户要求追溯历史时才读取。
- 不确定某项行为是否已有记录时，先搜索 `.changes/` 目录。

## 2. 写入规则

- 当用户确认关键决策、调整范围、解释为什么这么做、否定某个方案、说明合并时必须保留的行为时，**必须**沉淀到 `.changes/work-reports/` 或 `.changes/session-notes/`。
- 如果当前没有维护 work report，就写入 `.changes/session-notes/YYYY-MM-DD-<branch-or-topic>.md`。
- Session note 只记录关键决策、实现思路、放弃方案、合并时必须保留的行为和关联文件，不保存完整聊天记录、密钥、凭证或敏感数据。

## 3. 提交与合并规则

- 提交时使用 Loctek intent，确保 commit message 携带足够的上下文。
- 合并时先读取 intent / work report / session notes，理解双方意图后再解决文本冲突。
- 不要因为代码层面"能合并"就丢弃 Loctek 记录中的行为约束。

## 4. 归档规则

- 工作完成后，先 dry-run 归档：`node tools/loctek/archive.mjs . --issue ISSUE-001 --dry-run` 或 `node tools/loctek/archive.mjs . --branch <branch> --dry-run`。
- 归档安全后再执行实际归档，避免把未完成的工作误归档。

## 5. 记录位置

| 位置 | 含义 | 权威性 |
| --- | --- | --- |
| `.changes/issues/` | 当前活跃 issue 与 bug 调查 | 待处理或进行中 |
| `.changes/work-reports/` | 具体工作执行记录 | 过程性文档 |
| `.changes/intents/` | 当前分支/change 的意图声明 | 提案阶段 |
| `.changes/session-notes/` | 重要决策与实现推理 | 过程性文档 |
| `.changes/merge-reports/` | 合并报告与冲突决策 | 归档前权威 |
| `.changes/archive/` | 已完成工作的归档 | 历史参考 |
| `.changes/adr/` | 架构决策记录 | 项目级权威约束 |

## 6. AI 代理的记录义务

**记录用户决策与实现方式是 Loctek Spec 的核心价值，不能只写在代码注释里。**

### 6.1 必须记录的用户决策

- **业务规则变更**：用户明确修改或新增的业务逻辑
- **技术选型决策**：用户选择的方案及放弃的替代方案
- **架构边界调整**：模块职责重新定义、新增/合并服务、接口契约变更
- **安全与权限策略**：RBAC 规则调整、数据脱敏范围、审计要求
- **性能与降级策略**：超时阈值、重试次数、缓存策略、降级开关

### 6.2 必须记录的实现方式

- **设计意图**：为什么这么实现，解决了什么问题，权衡了哪些因素
- **替代方案**：考虑过但未采纳的方案及原因
- **已知限制**：当前实现的边界条件、暂不支持的场景、技术债务
- **依赖关系**：依赖了哪些外部服务/接口，失败时的行为
- **回滚条件**：什么情况下需要回滚，如何回滚

### 6.3 记录位置与格式

```
.changes/session-notes/YYYY-MM-DD-<branch-or-topic>.md
```

Session notes 格式要求：

```markdown
# Session Note: <topic>

## 决策背景
<用户面临的问题或需求>

## 用户决策
<用户明确选择的方案>

## 实现方式
<具体怎么做的，关键代码位置>

## 替代方案（已排除）
<考虑过但未采纳的方案及排除原因>

## 已知限制
<当前实现不覆盖的场景或技术债务>

## 影响面
<哪些模块/功能受影响>

## 回滚计划
<如何回滚，需要修改什么>
```

### 6.4 记录红线

- **禁止只记录结论，不记录推理过程**：后续开发者需要知道"为什么"，不只是"是什么"
- **禁止把决策淹没在代码注释中**：代码注释面向代码读者，session notes 面向项目维护者
- **禁止记录 secrets、token、密码、个人隐私数据**
- **禁止复制粘贴完整聊天记录**：只提炼关键决策和实现要点
- **记录必须在决策当下完成**，不要等工作结束后再凭记忆补录

## 7. OpenSpec 协作

如果仓库里同时有 `openspec/`，把它当作并行的规格层，而不是 Loctek 的替代品：

- 读取 `openspec/specs/` 作为当前行为基线。
- 读取活跃 `openspec/changes/<change>/proposal.md`、`design.md`、`tasks.md`、`specs/` 作为补充上下文。
- 默认不读取 `openspec/changes/archive/`。
- 不要把 OpenSpec 产物复制进 `.changes/`。
- OpenSpec 负责规格演进，Loctek 负责执行过程、提交意图和合并安全。
