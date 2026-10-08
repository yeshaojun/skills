---
name: loctek-test-review
description: 意图感知的白盒代码走查 skill。用于用户要求代码走查、代码审查、白盒测试、检查增量代码、需求与代码一致性检查、单元测试推导、合并后确认功能没有丢失、上线前代码检查时触发。基于精确增量 diff，做需求一致性、潜在缺陷、动态模式（Job/MQ/延迟消息）、安全合规、性能稳定性、集成质量 6 大类走查，产出量化报告与 Pass/Fail/Block 结论；发现的高风险问题自动回流为 .changes bug issue。与 loctek-test 分工：本 skill 做静态走查分析，loctek-test 负责执行自动化测试命令。
---

# Loctek Test Review

对增量代码做"按意图走查"：先弄清这次改动为什么改、必须保留什么，再精读代码，最后给出量化的准入结论。普通改动轻量走查，高风险改动必须全覆盖。

## 与其他 skill 的分工

- `loctek-test`：执行自动化测试命令（unit/lint/build/E2E）。本 skill 不跑测试，只做静态走查分析。
- `loctek-test-case`：设计黑盒功能用例。本 skill 发现的"需求未实现/偏差"也可以转成它的输入。
- 发现的问题 → 生成 `.changes/issues/` 的 bug issue（`issue_kind: bug`），进入 loctek-work 修复闭环。

## 工作流

### 1. 收集输入

读取（存在才读）：

```text
.changes/issues/            # 验收标准 = 一致性检查基准
.changes/intents/           # 必须保留的行为 = 回归检查点
.changes/merge-reports/     # 合并后验证清单
.changes/qa/req-analysis/   # 需求测试分析（若有）
.changes/config.yml
```

有 OpenSpec 时补读 `openspec/specs/` 与活跃 change。没有 `.changes` 时，向用户确认需求来源：PRD 文档、issue 链接或口头描述；用户无法提供时，以"代码反推 + 待确认标注"模式走查，并在报告"测试盲区"中说明。

同时确认：分支不是 main/master/develop；`git pull` 拉取最新代码；记录 HEAD commit。

### 2. 增量分析（脚本优先）

```bash
node "<skill-dir>/scripts/loctek-test-diff.mjs" . --out .changes/qa/whitebox
```

脚本输出基线（fork-point → merge-base 兜底）、diff 体量分级、变更文件清单、方法签名摘要、影响面候选。细节与手工兜底命令见 `references/00-incremental-analysis.md`。

**体量分级决定走查节奏**：

- 🟢 < 500 行：全量读 diff，一次走查。
- 🟡 500-2000 行：按工程分批，每次只持有 1 个工程的源文件。
- 🔴 > 2000 行：只读签名摘要，核心文件按行范围精读，分片走查。

> 禁止读取完整 git diff 输出（比源文件膨胀 2-3 倍）；摘要定位核心类后直接读源文件。单文件超 500 行只读目标方法行范围。

### 3. 代码精读

**扫描优先级**——后端：Service/Job/Consumer(P0) → Controller/Manager(P1) → Mapper/Config(P2) → Utils(P3)；前端：页面组件与 api 层(P0) → store/router(P1) → utils/通用组件(P2)。

**精读顺序（不能反）**：diff（只看改了什么）→ 全文件（上下文是否匹配）→ 影响面文件（是否破坏调用方）。

对每个核心方法产出精读卡片：

```text
方法签名 / 职责 / 调用链路
分支树：if、else、catch、default 是否有遗漏
外部依赖：DB 读写、RPC、MQ、缓存
卫语句：入参空值/非法值是否有前置校验
日志：关键节点是否有可观测输出
```

### 4. 六大类走查（每类产出检查表）

| 类别 | 重点 | 规则库 |
| :--- | :--- | :--- |
| ① 需求一致性 | 逐条对照验收标准/PRD：遗漏(❌)/待确认(⚠️)/未找到(❌)/偏差(⚡) | 前后端检查角度见下 |
| ② 潜在缺陷 | 卫语句、条件逻辑、枚举遗漏、异常吞噬、幂等、线程安全、资源泄漏 | `references/01.核心走查维度与检查清单.md`（必读） |
| ③ 动态模式 | 走查到 Job/MQ/延迟消息时自动激活：防空转、幂等、死信、游标安全 | `references/02.代码模式专属检查.md` |
| ④ 安全与合规 | 注入、鉴权、敏感数据、越权(IDOR)、XSS、脱敏；**不因代码量少跳过** | `references/03.安全与合规检查.md`（必读） |
| ⑤ 性能与稳定性 | N+1、大结果集、大事务、超时/熔断/降级、可观测性 | `references/04.性能与稳定性检查.md`（必读） |
| ⑥ 集成与工程质量 | API 契约、数据一致性、金额精度、枚举/Schema 变更回归 | `references/05.集成与工程质量检查.md` |

**① 需求一致性的判定口径**：

| 判定 | 含义 | 处理 |
| :--- | :--- | :--- |
| ✅ 一致 | 代码忠实实现 | 无 |
| ⚠️ 待确认 | 本工程未直接体现，可能在其他模块 | 报告中列出，与开发确认 |
| ❌ 未找到 | 完全找不到实现 | 🔴 高风险，回流 bug issue |
| ⚡ 偏差 | 实现了但与需求不一致（PRD 说 3 次，代码写 5 次） | 🔴 高风险，确认是需求变更还是理解错误 |

输出格式统一为检查表：`检查ID | 所在行 | 检查维度 | 问题描述 | 风险等级 | 建议`，每个问题必须落到 `文件#L行号`。

### 5. 报告生成（强制）

写入：

```text
.changes/qa/whitebox/<date>-<branch>.md
```

```markdown
---
type: qa-review-report
branch: feature/x
issue: ISSUE-001        # 无关联 issue 时写 null
status: complete
---

# 白盒走查报告：{标题}

> 测试结论：🟢 通过 / 🔴 不通过 / 🟡 带风险通过

## 走查范围
（基线 commit、HEAD、体量分级、工程清单）

## 走查概览
| 检查大类 | 检查项数 | 通过 | 失败 | 🔴/🟡/🟢 |

## 核心风险摘要（仅 🔴 高风险）

## 详细检查过程
### 4.1 需求一致性 / 4.2 潜在缺陷 / 4.3 动态模式 / 4.4 安全合规 / 4.5 性能稳定 / 4.6 集成质量

## 测试盲区说明
（未覆盖的范围与原因，禁止留空）

## 准入准出结论
| 准出项 | 要求 | 实际 | 是否满足 |
```

**结论判定**：存在 ≥1 个未解决的 🔴 高风险（安全漏洞、核心需求未实现、数据不一致）→ 🔴 不通过；仅 🟡 中风险且不影响核心流程 → 🟡 带风险通过；否则 🟢 通过。报告中禁止"可能/大概/似乎"，禁止无行号的问题描述。

### 6. 问题回流与归档

- 🔴 高风险问题且用户确认是缺陷 → 按 loctek-issue 的 bug 模板生成 `.changes/issues/ISSUE-xxx`（现象/复现/假设/修复边界/回归测试计划），报告里注明生成的 issue 编号。
- 用户不确认时，仅在报告中记录，不生成 issue。
- 报告 frontmatter 带了 `issue` 字段，issue 完成后归档命令可一并归档走查报告：

```bash
node tools/loctek/archive.mjs . --issue ISSUE-001 --dry-run
```

## 轻量规则

- 普通改动（文案、样式、注释）：只走查 ①⑥ + 快速过 ②，报告可短，但不能没有结论。
- 高风险改动（权限、支付、schema、状态流转、公共方法签名）：六类全覆盖。
- merge 后验证：以 merge report 的"合并后验证清单"与双方 intent 的"必须保留的行为"为走查基准，比普通走查严格。
- 无法确定基线时用 `--base` 询问用户，不要臆测。

## 完成标准

- 走查范围与 issue/intent/merge report 对应，基线与 HEAD 明确。
- 六大类按风险等级完成，检查表落到了行号。
- 报告含量化概览、核心风险、盲区说明、明确结论。
- 🔴 问题已回流 bug issue 或经用户确认不回流。
- 报告写入 `.changes/qa/whitebox/` 且 frontmatter 完整。
