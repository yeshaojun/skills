---
name: loctek-test
description: 意图感知的测试计划和执行 skill。用于用户要求根据代码改动、issue、commit intent、merge report 生成测试计划，运行单元测试、集成测试、E2E、lint、typecheck、build，或验证合并后功能没有丢失时触发。参考成熟 webapp-testing 的 Playwright 验证思路，同时支持多语言项目的测试命令发现。
---

# Loctek Test

根据“为什么改”和“必须保留什么”来决定测什么，而不是只机械跑全量命令。普通改动可以轻量记录，高风险改动需要更强验证。

## 工作流

### 1. 收集输入

读取：

```text
.changes/issues/
.changes/intents/
.changes/merge-reports/
.changes/config.yml
```

并检查：

```bash
git status --short
git diff --name-status
git diff --cached --name-status
git diff --name-status HEAD~1..HEAD
```

### 2. 判断项目类型

查看常见文件：

- JavaScript/TypeScript：`package.json`
- Python：`pyproject.toml`、`requirements.txt`、`pytest.ini`
- Go：`go.mod`
- Java：`pom.xml`、`build.gradle`
- Rust：`Cargo.toml`
- Web：`vite.config.*`、`next.config.*`、`playwright.config.*`

### 3. 生成风险分析

按改动内容标记风险：

- 权限、登录、支付、价格、状态流转：高风险。
- schema、migration、API contract：高风险。
- 公共组件、路由、状态管理：中高风险。
- 文案、样式、配置：按影响面判断。

从 intent 的“必须保留的行为”里提取回归测试点。

### 4. 选择测试

优先级：

1. 精准单元测试。
2. 相关集成测试。
3. contract/API 测试。
4. E2E/smoke 测试。
5. lint/typecheck/build。

前端 Web 验证可借鉴 Playwright 的 reconnaissance-then-action：

- 启动本地服务。
- 等待页面加载稳定。
- 先截图/读 DOM。
- 再按发现的 selector 操作。
- 记录 console/network 错误。

### 5. 执行测试

常见命令：

```bash
npm test
npm run lint
npm run typecheck
npm run build
pytest
go test ./...
mvn test
gradle test
cargo test
```

先查看 `package.json` 或项目配置，不要臆造命令。长时间或破坏性测试先说明。

轻量规则：

- 普通改动：优先跑精准测试；没有合适命令时记录未运行原因即可。
- 高风险改动：必须至少有一种验证路径，自动化测试、构建、手工验证或明确的阻塞原因。
- merge 后验证：比普通 commit 更严格，必须覆盖双方 intent 中的关键行为。

### 6. 写测试报告

写入：

```text
.changes/test-reports/<date>-<branch>.md
```

可以先用脚本生成改动文件、检测到的测试命令和报告骨架：

```bash
node "<skill-dir>/scripts/loctek-test.mjs" .
```

模板：

```markdown
---
type: test-report
branch: feature/x
status: complete
---

# Test Report

## 影响分析

## 必跑测试

## 已运行测试

## 失败与修复

## 未运行测试

## 手工验证

## 回归风险
```

## 完成标准

- 测试计划对应 issue/intent/merge report。
- 高风险行为有验证路径；普通改动可以有明确未运行原因。
- 命令输出被总结到报告。
- 未运行测试必须写原因。
- 发现 bug 后优先补回归测试。
