# Skills Collection

个人维护的 agent skills 集合，按领域分类管理。

## 安装

安装仓库里的全部 skills：

```bash
npx skills@latest add yeshaojun/skills --all
```

只安装 Loctek Spec 套件里的某个 skill：

```bash
npx skills@latest add yeshaojun/skills --skill loctek-issue
```

本地调试：

```bash
npx skills@latest add /Users/andy/study/skills --list
npx skills@latest add /Users/andy/study/skills --all
```

## 分类

```text
skills/
  investment/
    invest-writer/
    charlie-munger-perspective/
  loctek-spec/
    loctek-init/
    loctek-issue/
    loctek-commit/
    loctek-merge/
    loctek-test/
```

## Loctek Spec

Loctek Spec 是一套中文优先的软件工程协作 skills，用 `.changes` 语义记录把 issue、commit、merge、test 串起来，降低 AI 合并冲突时丢功能的风险。

| Skill | 描述 |
| --- | --- |
| `loctek-init` | 初始化 `.changes`、PR 模板、CODEOWNERS、GitHub Action、Git hooks、校验脚本 |
| `loctek-issue` | 中文版功能拆分，基于 tracer-bullet 垂直切片生成 issues |
| `loctek-commit` | 读取 staged diff，生成 `.changes/intents` 和 PR 草稿 |
| `loctek-merge` | 读取双方 intent 后再合并，生成 merge report |
| `loctek-test` | 根据 issue、intent、merge report 生成测试计划和报告 |

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

## 添加新 Skill

1. 在 `skills/<category>/<skill-name>/` 下创建 skill。
2. 每个 skill 必须包含 `SKILL.md`。
3. 可选添加 `agents/`、`scripts/`、`references/`、`assets/`。
4. 更新本 README 的分类和说明。

## License

MIT

