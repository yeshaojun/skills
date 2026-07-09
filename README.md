# Skills Collection

个人维护的 agent skills 集合，按领域分类管理。

## 安装

先查看仓库里有哪些 skills：

```bash
npx skills@latest add yeshaojun/skills --list
```

交互式安装，按提示选择 skill 和 AI 工具：

```bash
npx skills@latest add yeshaojun/skills
```

在普通终端里运行时，`skills` CLI 会按顺序询问：

1. 选择要安装的 skill。
2. 选择要安装到哪些 AI 工具，例如 Codex、Claude Code、Cursor。
3. 选择安装范围：Project 或 Global。
4. 选择安装方式：Symlink 或 Copy。

注意：第 4 步只有在所选 agent 对应多个安装目录时才会出现。比如只选 Codex 时通常只写入 `.agents/skills`，CLI 会直接 copy；同时选择 Codex 和 Claude Code 时，才需要在 symlink/copy 之间选择。

如果你是在 Codex、CI 或其他非交互环境里执行，CLI 可能会检测到 agent 环境并自动走非交互安装。给普通用户的安装文档应推荐他们在自己的终端里运行上面的命令。

只安装某一个 skill：

```bash
npx skills@latest add yeshaojun/skills --skill loctek-issue
```

安装多个指定 skills：

```bash
npx skills@latest add yeshaojun/skills --skill loctek-init loctek-issue loctek-commit
```

安装到指定 AI 工具：

```bash
npx skills@latest add yeshaojun/skills --skill loctek-issue --agent codex
npx skills@latest add yeshaojun/skills --skill loctek-issue --agent claude-code
npx skills@latest add yeshaojun/skills --skill loctek-issue --agent cursor
```

安装到多个 AI 工具：

```bash
npx skills@latest add yeshaojun/skills --skill loctek-issue --agent codex claude-code cursor
```

全局安装：

```bash
npx skills@latest add yeshaojun/skills --skill loctek-issue --agent codex -g
```

本地调试：

```bash
npx skills@latest add /Users/andy/study/skills --list
npx skills@latest add /Users/andy/study/skills --skill loctek-issue --agent codex
```

不建议默认使用 `--all`。在 `skills` CLI 中，`--all` 等价于 `--skill '*' --agent '*' -y`，会把所有 skills 安装到所有支持的 agent，容易生成多套 agent 目录。

## Agent 目录说明

每个 skill 自带的 `agents/openai.yaml` 是 skill 的 UI 元数据，属于 skill 包内容，不是安装目标目录。

安装时生成的 `.agents/skills` 是 `skills` CLI 的通用 project-level skill 目录。Codex、Cursor、Gemini 等多种工具会复用这个目录。

如果同时选择 `claude-code`，CLI 可能还会生成 `.claude/skills`，并把它链接到 `.agents/skills` 里的规范副本。这不是重复内容，而是为了兼容不同 AI 工具的目录约定。

如果你不希望生成链接结构，可以使用 `--copy`：

```bash
npx skills@latest add yeshaojun/skills --skill loctek-issue --agent claude-code --copy
```

常用 agent 名称：

| 工具 | `--agent` 参数 |
| --- | --- |
| Codex | `codex` |
| Claude Code | `claude-code` |
| Cursor | `cursor` |
| Gemini CLI | `gemini-cli` |
| GitHub Copilot | `github-copilot` |

## 分类

```text
skills/
  investment/
    invest-writer/
    charlie-munger-perspective/
  loctek-spec/
    loctek-init/
    loctek-issue/
    loctek-work/
    loctek-commit/
    loctek-merge/
    loctek-test/
    loctek-archive/
```

## Loctek Spec

Loctek Spec 是一套中文优先、轻治理的软件工程协作 skills，用 `.changes` 语义记录把 issue、work、test、commit、merge 串起来。默认自动、少问人，只在危险提交、权限问题、冲突合并等关键节点拦截，目标是降低 AI 合并冲突时丢功能的风险。

| Skill | 描述 |
| --- | --- |
| `loctek-init` | 初始化 `.changes`、PR 模板、CODEOWNERS、GitHub Action、Git hooks、校验脚本 |
| `loctek-issue` | 中文版 issue 生成：功能需求拆垂直切片，bug 报告拆排查闭环 |
| `loctek-work` | 根据 issue 执行开发、排查 bug、重构或验证，并生成 work report |
| `loctek-commit` | 默认提交当前安全相关改动，同时生成 `.changes/intents` 和 PR 草稿 |
| `loctek-merge` | 读取双方 intent 后再合并，生成 merge report |
| `loctek-test` | 根据 issue、intent、merge report 生成测试计划和报告 |
| `loctek-archive` | 把已完成 issue/branch/merge 的 `.changes` 记录归档到 archive，避免活跃上下文膨胀 |

`loctek-init` 会额外生成 `AGENTS.md`、`CLAUDE.md`、`.cursor/rules/loctek.mdc`，让 Codex、Claude Code、Cursor 等工具把关键决策沉淀到 `.changes/session-notes/`。常规 commit/merge/test 只读取活跃记录，不默认读取 `.changes/archive/`。

参考协议：

- [Loctek Protocol](./skills/loctek-spec/shared/protocol.md)
- [Upstream Notes](./skills/loctek-spec/shared/upstream.md)

## Investment

| Skill | 描述 |
| --- | --- |
| `andy-invest-writer` | 投资公众号长文写作，强调问题驱动、扁平结构和第一人称投资者视角 |
| `charlie-munger-perspective` | 用查理·芒格的思维框架分析投资、商业和人生决策 |

## 验证

```bash
npm run skills:check
npx skills@latest add /Users/andy/study/skills --list
```

Loctek 初始化后建议在目标项目运行一次权限检查，避免 `.changes` 被 root 创建后导致 intent/PR 记录写不回工作树：

```bash
node tools/loctek/check-permissions.mjs
```

## 添加新 Skill

1. 在 `skills/<category>/<skill-name>/` 下创建 skill。
2. 每个 skill 必须包含 `SKILL.md`。
3. 可选添加 `agents/`、`scripts/`、`references/`、`assets/`。
4. 更新本 README 的分类和说明。

## License

MIT
