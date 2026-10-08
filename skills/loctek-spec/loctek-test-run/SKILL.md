---
name: loctek-test-run
description: 黑盒用例自动化执行 skill。用于用户要求把测试用例自动跑一遍、自动化执行用例、Playwright 执行测试、验证功能流程（如登录、审批流程端到端跑通）、回归已生成的用例集时触发。核心机制：用例 1:1 镜像校验（杜绝步骤增减）、脚本错误与功能缺陷的归因自愈诊断、执行结果写入 .changes/qa/exec 并把确认的功能缺陷回流为 bug issue。依赖 Playwright 与可访问的测试环境。
---

# Loctek Test Run

把 `loctek-test-case` 产出的用例文件高保真地转化为 Playwright 脚本并执行。核心原则：**用例是唯一事实源**——脚本必须 1:1 复刻步骤，禁止合并、省略或推测用户意图；执行失败先归因（脚本错误自愈重试，功能缺陷立即停），不允许靠改预期结果让用例变绿。

## 输入

- **用例文件**（必填）：`.changes/qa/blackbox/` 下的用例 md，先用校验脚本确认质量：
  `node "<loctek-test-case>/scripts/validate-cases.mjs" <用例文件> --min 95`
- **被测环境**（必填）：测试环境 URL + 测试账号。只允许来自用例前置条件或用户显式提供；**禁止对生产环境执行**。

## 工作流

### 1. 环境准备

1. 确认项目具备 Playwright（`@playwright/test` 配置或可安装）；没有时先询问用户是否初始化，不要擅自装依赖。
2. 确认测试环境可访问（curl 或首次探测），记录基准响应。
3. 登录态：优先 storageState 复用；首次登录失败或遇验证码时暂停请求人工介入，禁止绕过鉴权逻辑。

### 2. 用例解析（脚本优先）

```bash
node "<skill-dir>/scripts/parse-cases.mjs" <用例文件.md> --out .changes/qa/exec/cases.json
```

把用例拆解为结构化 JSON（id、步骤、预期、优先级）。解析失败说明用例格式不达标，先修用例再执行。

### 3. 脚本生成与选择器侦察

每条用例生成一个 spec 文件（或按模块合并），规则：

- **先侦察再操作**：对用例涉及的页面先截图/读 DOM 确认选择器，再写操作；禁止臆造 selector。
- 每步写锚点注释：`// [TC-001_Step2] 输入用户名`——镜像校验依赖它。
- 输入类操作"先清空再输入"；等待用具体元素锚点（`waitFor`/`expect(locator)`），禁止裸 sleep。
- 断言用用例的双线预期：UI 断言 + 接口/DB 断言（可用 `request` fixture 或测试钩子查库）。
- 失败自动截图、记录 console/network 错误。

### 4. 镜像校验（强制门控）

```bash
node "<skill-dir>/scripts/mirror-check.mjs" .changes/qa/exec/cases.json <生成的spec目录>
```

校验：步骤计数一致、每个 `[TC-xxx_StepN]` 锚点存在且顺序一致、无多余操作步骤。**失败立即重新生成脚本，禁止强行执行。**

### 5. 执行与归因诊断

```bash
npx playwright test <spec目录> --reporter=line
```

单步失败时按归因流程处理：

```text
A. 捕获错误类型
   ElementNotFound / Timeout / ClickIntercepted  → 脚本错误特征
   AssertionFailed / DataMismatch / UIError      → 功能缺陷特征

B. 脚本错误 → 自愈
   1. 更换定位词（"登录按钮" → "主区域蓝色提交按钮"）
   2. 增加元素锚点等待
   3. 弹窗遮挡时先执行"关闭所有弹窗"再重试原操作
   4. 用修正后的脚本重试该单条用例；连续 2 次自愈失败 → 标记 BLOCKED，交人工审查脚本

C. 功能缺陷 → 停止
   1. 核对预期结果是否与用例/需求一致（确认不是用例写错）
   2. 确认后标记 FAIL，禁止修改预期让它通过
```

结果标签：`@SelfHealed`（自愈后通过）、`@RealBug`（功能缺陷）、`@Blocked`（脚本无法修复，需人工）。

### 6. 报告与回流

写入：

```text
.changes/qa/exec/<date>-<branch>.md
```

```markdown
---
type: qa-exec-report
branch: feature/x
issue: ISSUE-001
case_file: 黑盒测试用例_xxx.md
status: complete
---

# 用例执行报告

## 执行概览
| 总数 | 通过 | @SelfHealed | @RealBug | @Blocked | 未执行 |

## 自愈记录
（原定位词 → 修正定位词，重试结果）

## 功能缺陷明细
| 用例 | 步骤 | 现象 | 预期 | 实际 | 证据（截图路径） |

## 未执行与原因
```

- `@RealBug` 且用户确认 → 按 loctek-issue 的 bug 模板生成 `.changes/issues/` bug issue，报告注明编号。
- 截图/trace 等证据放 `.changes/qa/exec/artifacts/`，报告中写相对路径。
- 同步把结果摘要写进 `.changes/test-reports/` 对应报告的"手工验证/已运行测试"小节（若存在），保持单一事实。

## 避坑规则

| 场景 | 处理 |
| :--- | :--- |
| 页面加载慢 | 必须有元素锚点等待，禁止无限/固定长等待 |
| 元素定位漂移 | 触发自愈：相似语义文本/周边元素 |
| 步骤遗漏 | 镜像校验阶段直接阻断 |
| 断言失败 | 区分 DOM 不存在（脚本错）与数值不对（功能错） |
| 弹窗遮挡 | 先关闭弹窗再重试原操作 |
| 数据依赖 | 用例前置条件的造数步骤必须先执行；造数失败标记 BLOCKED 而不是跳过断言 |

## 完成标准

- 镜像校验通过后才执行；执行完成才有报告。
- 每条用例有终态（通过/自愈/RealBug/Blocked/未执行+原因）。
- @RealBug 已回流 bug issue 或经用户确认暂不回流。
- 证据文件可追溯，报告 frontmatter 完整。
