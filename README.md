# OpenCode Skills Collection

这是一个 OpenCode Skills 集合仓库，包含多个可复用的技能模块。

## 可用 Skills

| Skill | 描述 | 版本 |
|-------|------|------|
| [stock-investment-analysis](./skills/stock-investment-analysis) | 企业投资价值分析框架，支持行业分析、竞争力分析、财务分析、估值模型和券商研报分析 | 1.2.0 |

## 快速使用

### 方式一：npx 直接使用

```bash
# 股票投资分析
npx github:yeshaojun/skills stock-analysis fetch 600519 --type all
npx github:yeshaojun/skills stock-analysis analyze 600519
```

### 方式二：克隆后本地使用

```bash
# 克隆仓库
git clone https://github.com/yeshaojun/skills.git
cd skills

# 安装依赖
pip install -r requirements.txt

# 使用股票分析 skill
python skills/stock-investment-analysis/scripts/fetch_data.py 600519 --type all
python skills/stock-investment-analysis/scripts/analyze.py 600519
```

### 方式三：作为 OpenCode Skill 安装

```bash
# 克隆到 OpenCode skills 目录
git clone https://github.com/yeshaojun/skills.git ~/.opencode/skills/yeshaojun
```

## 目录结构

```
skills/
├── README.md                    # 本文件
├── package.json                 # npm 配置
├── requirements.txt             # Python 依赖
├── skills/                      # 所有 skills
│   └── stock-investment-analysis/
│       ├── SKILL.md            # Skill 定义文件
│       ├── README.md           # Skill 文档
│       ├── package.json        # Skill npm 配置
│       └── scripts/            # 脚本文件
│           ├── fetch_data.py
│           ├── analyze.py
│           └── cli.js
└── templates/                   # Skill 模板（用于创建新 skill）
    └── skill-template/
```

## 添加新 Skill

1. 在 `skills/` 目录下创建新文件夹
2. 添加 `SKILL.md` 文件定义 skill
3. 添加脚本和文档
4. 更新本 README 中的 skills 列表

### Skill 模板

```markdown
---
name: your-skill-name
description: Skill 描述
license: MIT
metadata:
  author: your-name
  version: "1.0.0"
---

# Skill 标题

Skill 详细说明...
```

## Python 依赖

```bash
pip install -r requirements.txt
```

## License

MIT
