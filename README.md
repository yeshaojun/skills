# OpenCode Skills Collection

通用型技能集合，为 OpenCode/Claude 提供专业化能力扩展。

## 可用 Skills

| Skill | 描述 | 版本 |
|-------|------|------|
| [stock-investment-analysis](./skills/stock-investment-analysis) | 企业投资价值分析框架，支持行业分析、竞争力分析、财务分析、估值模型和券商研报分析 | 1.3.0 |

---

## 使用场景

### 场景一：作为 OpenCode Skill 使用（推荐）

将仓库克隆到 OpenCode skills 目录，Claude 会自动识别并按需加载。

```bash
# 克隆到 OpenCode skills 目录
git clone https://github.com/yeshaojun/skills.git ~/.opencode/skills/yeshaojun
```

**触发方式**：
- "帮我分析茅台(600519)的投资价值"
- "获取腾讯(00700)的财务数据"
- "分析比亚迪的行业竞争力"

Claude 会自动识别相关 skill，加载必要的上下文进行分析。

---

### 场景二：命令行工具使用

直接使用脚本进行数据获取和分析。

```bash
# 克隆仓库
git clone https://github.com/yeshaojun/skills.git
cd skills

# 安装依赖
pip install -r requirements.txt

# 获取股票数据
python skills/stock-investment-analysis/scripts/fetch_data.py 600519 --type all -o data.json

# 生成分析报告
python skills/stock-investment-analysis/scripts/analyze.py 600519 --data data.json -o report.md
```

---

### 场景三：npx 快速使用

无需克隆，直接使用 npx 运行。

```bash
# 获取数据
npx github:yeshaojun/skills stock-analysis fetch 600519 --type all

# 生成报告
npx github:yeshaojun/skills stock-analysis analyze 600519
```

---

### 场景四：集成到其他项目

作为 Python 模块导入使用。

```python
import sys
sys.path.append('skills/stock-investment-analysis/scripts')

from fetch_data import StockDataFetcher
from analyze import InvestmentAnalyzer

# 获取数据
fetcher = StockDataFetcher('600519')
data = fetcher.fetch_all()

# 生成报告
analyzer = InvestmentAnalyzer(data)
report = analyzer.generate_report()
print(report)
```

---

### 场景五：与 Claude Code 配合使用

在 Claude Code 对话中引用 skill 进行深度分析。

**示例对话**：
```
用户: 帮我分析贵州茅台的投资价值，股票代码600519

Claude: 我来帮你分析贵州茅台的投资价值。
首先获取相关数据...

[执行 fetch_data.py 获取数据]

[基于 SKILL.md 中的分析框架和 references/prompt-templates.md 中的模板]
[进行行业分析、竞争力分析、财务分析、估值分析等]

最终生成综合分析报告...
```

---

## 目录结构

```
skills/
├── README.md                           # 本文件
├── package.json                        # npm 配置
├── requirements.txt                    # Python 依赖
├── skills/                             # 所有 skills
│   └── stock-investment-analysis/
│       ├── SKILL.md                    # Skill 定义（核心）
│       ├── scripts/                    # 可执行脚本
│       │   ├── fetch_data.py          # 数据获取
│       │   ├── analyze.py             # 报告生成
│       │   └── cli.js                 # CLI 入口
│       └── references/                 # 参考文档（按需加载）
│           ├── prompt-templates.md    # Prompt 模板
│           ├── scoring-framework.md   # 评分体系
│           └── akshare-api.md         # API 参考
```

---

## Skill 设计原则

每个 Skill 遵循以下原则：

1. **渐进式加载** - SKILL.md 保持精简，详细内容放在 references/ 中按需加载
2. **脚本优先** - 可重复执行的任务封装为脚本，减少上下文占用
3. **模块化** - 每个 Skill 独立自包含，可单独安装和使用
4. **多场景适配** - 支持 OpenCode 集成、命令行、npx、Python 模块等多种使用方式

---

## 添加新 Skill

1. 在 `skills/` 目录下创建新文件夹
2. 创建 `SKILL.md` 文件（必须包含 frontmatter）
3. 添加 `scripts/` 脚本（可选）
4. 添加 `references/` 参考文档（可选）
5. 更新本 README 的 skills 列表

### SKILL.md 模板

```markdown
---
name: your-skill-name
description: Skill 描述（包含触发条件）
license: MIT
metadata:
  author: your-name
  version: "1.0.0"
---

# Skill 标题

## 快速开始

[核心使用说明]

## 详细参考

- [references/xxx.md](references/xxx.md) - 详细说明
```

---

## License

MIT
