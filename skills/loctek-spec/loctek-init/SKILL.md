---
name: loctek-init
description: 初始化 Loctek Spec 工程治理文件。用于用户要求给一个现有或新项目添加 .changes 语义记录、PR 模板、CODEOWNERS、GitHub Actions、Git hooks、commit intent 校验、AI 合并/测试流程基础设施时触发。默认只新增 Loctek 独立文件，不改业务代码，不覆盖已有文件。
---

# Loctek Init

初始化项目的 Loctek Spec 基础设施，让后续 `loctek-issue`、`loctek-commit`、`loctek-merge`、`loctek-test` 可以共享同一套 `.changes` 语义记录。

## 工作流

1. 确认当前目录是目标项目根目录。
2. 先检查是否已有 `.changes/`、`.github/pull_request_template.md`、`CODEOWNERS`、`tools/loctek/`。
3. 运行初始化脚本：

```bash
node "<skill-dir>/scripts/loctek-init.mjs" .
```

4. 如果脚本提示 `.changes` 或 `tools/loctek` 属主/权限不对，先修复：

```bash
sudo chown -R "$(id -u):$(id -g)" .changes tools/loctek
```

也可以用：

```bash
sudo node "<skill-dir>/scripts/loctek-init.mjs" . --fix-permissions
```

5. 读取输出的 `.changes/init-report.md`。
6. 如果脚本跳过了已有文件，不要强行覆盖。说明哪些文件需要人工合并。
7. 建议用户运行：

```bash
node tools/loctek/check-permissions.mjs
node tools/loctek/install-git-hooks.mjs
```

## 写入原则

- 默认只新增文件和目录。
- 不修改业务代码。
- 不覆盖已有项目配置。
- 不要用 `sudo` 初始化普通用户开发的项目；否则 `.changes` 可能变成 root-owned，后续 commit 无法写 intent/PR 记录。
- 如果已有 GitHub workflow、PR 模板、CODEOWNERS 或 hook，生成报告并说明如何合并。
- 初始化后提醒配置分支保护：PR 必须通过 CI，不能直接 push 到主干。

## 生成内容

```text
.changes/
  config.yml
  README.md
  issues/
  intents/
  merge-reports/
  test-reports/
  pr/
  adr/
  releases/
.github/
  pull_request_template.md
  workflows/loctek-intent-check.yml
CODEOWNERS
.gitmessage
tools/loctek/
  validate-intent.mjs
  collect-context.mjs
  check-permissions.mjs
  install-git-hooks.mjs
  hooks/commit-msg
```

## 完成标准

- `.changes/config.yml` 存在。
- `.changes/init-report.md` 记录了 created/skipped 文件。
- `node tools/loctek/check-permissions.mjs` 通过，确认 `.changes` 和 `tools/loctek` 可写。
- PR 模板包含 Why、What Changed、Behavior To Preserve、Validation、Risks。
- `tools/loctek/validate-intent.mjs` 可以执行。
- 没有覆盖用户已有文件。
