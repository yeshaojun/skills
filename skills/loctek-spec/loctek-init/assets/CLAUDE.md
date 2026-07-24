# Claude Project Instructions

本项目使用 Loctek Spec。保持工作流轻量，但必须保留意图，确保 AI 辅助的合并不会丢失行为。

## 1. Loctek Spec 工作流

- 使用活跃的 `.changes` 记录处理当前工作：`issues`、`work-reports`、`intents`、`test-reports`、`merge-reports`、`pr`、`session-notes`。
- 默认不读取 `.changes/archive`；只有用户要求追溯历史时才读取。
- 复杂任务开始前，检查 `.changes/issues/` 和 `.changes/work-reports/` 了解当前活跃工作。
- 不确定某项行为是否已有记录时，先搜索 `.changes/` 目录。

**记录用户决策与实现方式是必须履行的义务，不是可选的。**

当用户做出以下任何决策时，必须写入 `.changes/session-notes/YYYY-MM-DD-<branch-or-topic>.md`：

- **业务规则变更**：如权限调整、数据范围变更、流程改动
- **技术选型**：如选择某种算法、数据库方案、通信协议
- **架构调整**：如新增模块、拆分服务、接口契约变更
- **安全策略**：如 RBAC 规则、数据脱敏、审计要求
- **性能策略**：如超时阈值、缓存策略、降级方案

记录内容必须包含：

1. **决策背景**：用户面临的问题或需求
2. **用户决策**：用户明确选择的方案
3. **实现方式**：具体怎么做的，关键代码位置
4. **替代方案（已排除）**：考虑过但未采纳的方案及原因
5. **已知限制**：当前实现不覆盖的场景或技术债务
6. **影响面**：哪些模块/功能受影响
7. **回滚计划**：如何回滚，需要修改什么

**提交与合并时必须遵守：**

- 提交时使用 Loctek intent，确保 commit 携带变更上下文。
- 合并时先读取 intent / work report / session notes，理解双方意图后再解决冲突。
- 不要因为代码层面"能合并"就丢弃 Loctek 记录中的行为约束。

**禁止只记录结论不记录推理过程；禁止把决策淹没在代码注释中；禁止记录 secrets；禁止凭记忆事后补录。**

## 2. 工作完成后

- 使用 `loctek-commit` 提交（如果可用）。
- 使用 `loctek-merge` 合并（如果可用）。
- 使用 `loctek-test` 验证（如果可用）。
- 工作完成后，先 dry-run 归档。如果自动归档不安全，解释原因并给出精确的 `node tools/loctek/archive.mjs ... --dry-run` 命令供人工审核。

## 3. OpenSpec 协作

如果仓库里同时有 `openspec/`，把它当作并行的规格层：

- 读取 `openspec/specs/` 作为当前行为基线。
- 读取活跃 `openspec/changes/<change>/proposal.md`、`design.md`、`tasks.md`、`specs/` 作为补充上下文。
- 默认不读取 `openspec/changes/archive/`。
- 不要把 OpenSpec 产物复制进 `.changes/`。
- OpenSpec 负责规格演进，Loctek 负责执行过程、提交意图和合并安全。
