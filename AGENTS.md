# AGENTS.md

OpenCode Skills Collection - 为 OpenCode/Claude 提供专业化能力扩展的技能仓库。

## 仓库结构

```
skills/
├── skills/                          # 所有 skills（每个独立自包含）
│   ├── stock-investment-analysis/   # 股票投资分析 skill
│   │   ├── SKILL.md                 # Skill 定义（核心入口）
│   │   ├── scripts/                 # 可执行脚本
│   │   └── references/              # 参考文档（按需加载）
│   └── andy-invest-writer/          # 投资写作 skill
│       ├── SKILL.md                 # Skill 定义（核心入口）
│       └── references/              # 参考文档（按需加载）
├── package.json                     # npm workspace 配置
└── requirements.txt                 # Python 依赖
```

## 开发命令

### Python 脚本

```bash
# 安装依赖
pip install -r requirements.txt

# 获取股票数据
python skills/stock-investment-analysis/scripts/fetch_data.py <股票代码> --type all

# 生成分析报告
python skills/stock-investment-analysis/scripts/analyze.py <股票代码>
```

### npm 脚本

```bash
npm run stock-analysis -- fetch 600519 --type all
npm run stock-analysis -- analyze 600519
```

## Skill 设计原则

1. **渐进式加载** - SKILL.md 保持精简（<500行），详细内容放 references/ 按需加载
2. **脚本优先** - 可重复执行的任务封装为脚本，减少上下文占用
3. **模块化** - 每个 Skill 独立自包含，可单独安装使用

## 添加新 Skill

1. 在 `skills/` 下创建目录
2. 创建 `SKILL.md`（必须包含 YAML frontmatter: name, description）
3. 添加 `scripts/` 脚本（可选）
4. 添加 `references/` 参考文档（可选）
5. 更新根 README.md 的 skills 列表

## 支持的股票市场

| 市场 | 代码格式 | 示例 |
|------|---------|------|
| A股 | 6位数字 | 600519, 000001, 300750 |
| 港股 | 5位数字 | 00700, 09988, 03690 |

## 注意事项

- 港股研报数据暂不支持，需通过其他渠道获取
- `.gitignore` 排除了 `*.json`（除 package.json），输出文件不会被提交
