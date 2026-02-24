---
name: stock-investment-analysis
description: 企业投资价值分析框架，包含行业分析、竞争力分析、财务分析、估值模型和券商研报分析。用于系统化评估企业投资价值，生成专业投资分析报告。使用AKShare获取A股和港股数据。当用户需要分析股票投资价值、获取股票数据、生成投资分析报告时使用此技能。
license: MIT
metadata:
  author: Mr_shaojun
  version: "1.3.0"
---

# 企业投资价值分析框架

系统化的企业投资价值分析流程，涵盖行业、竞争力、财务、估值和研报五大维度。

## 分析流程

```
数据收集 → 行业分析 → 竞争力分析 → 财务分析 → 估值分析 → 研报分析 → 综合评分 → 投资建议
```

---

## 快速开始

### 前置要求

```bash
pip install akshare pandas
```

### 获取数据

```bash
# 获取所有数据（推荐）
python skills/stock-investment-analysis/scripts/fetch_data.py 600519 --type all

# 获取基础信息
python skills/stock-investment-analysis/scripts/fetch_data.py 600519 --type basic

# 获取财务数据（近5年）
python skills/stock-investment-analysis/scripts/fetch_data.py 600519 --type financial --years 5

# 获取研报
python skills/stock-investment-analysis/scripts/fetch_data.py 600519 --type reports --limit 5

# 保存到文件
python skills/stock-investment-analysis/scripts/fetch_data.py 600519 --type all -o stock_data.json
```

### 生成报告

```bash
# 自动获取数据并生成报告
python skills/stock-investment-analysis/scripts/analyze.py 600519

# 使用已有数据生成报告
python skills/stock-investment-analysis/scripts/analyze.py 600519 --data stock_data.json

# 保存报告到文件
python skills/stock-investment-analysis/scripts/analyze.py 600519 -o report.md
```

---

## 支持的市场

| 市场 | 代码格式 | 示例 |
|------|---------|------|
| A股 | 6位数字 | 600519, 000001, 300750 |
| 港股 | 5位数字 | 00700, 09988, 03690 |

---

## 数据字段

### 基础信息 (basic)

| 字段 | A股 | 港股 | 说明 |
|------|-----|------|------|
| symbol | ✓ | ✓ | 股票代码 |
| name | ✓ | ✓ | 股票名称 |
| price | ✓ | ✓ | 当前价格 |
| change_percent | ✓ | ✓ | 涨跌幅% |
| market_cap | ✓ | ✓ | 总市值 |
| pe_ratio | ✓ | - | 市盈率(动态) |
| pb_ratio | ✓ | - | 市净率 |
| high_52w | ✓ | ✓ | 52周最高 |
| low_52w | ✓ | ✓ | 52周最低 |

### 财务数据 (financial)

| 字段 | 说明 |
|------|------|
| year | 年份 |
| revenue | 营业收入(元) |
| net_profit | 净利润(元) |
| revenue_yoy | 营收同比增长% |
| profit_yoy | 净利润同比增长% |
| gross_margin | 毛利率% |
| net_margin | 净利率% |
| roe | 净资产收益率% |
| eps | 每股收益(元) |
| bps | 每股净资产(元) |
| cfps | 每股经营现金流(元) |

### 研报数据 (research_reports)

| 字段 | 说明 |
|------|------|
| title | 研报标题 |
| rating | 投资评级 |
| institution | 发布机构 |
| date | 发布日期 |
| eps_forecast | 盈利预测(2025-2027年EPS/PE) |

---

## 详细参考

按需加载以下参考文件：

- **[references/prompt-templates.md](references/prompt-templates.md)** - 行业分析、竞争力分析、财务分析、估值分析、研报分析等Prompt模板
- **[references/scoring-framework.md](references/scoring-framework.md)** - 评分体系、权重分配、投资评级标准
- **[references/akshare-api.md](references/akshare-api.md)** - AKShare常用API参考

---

## 分析工作流

### 步骤1：获取基础数据

```bash
python skills/stock-investment-analysis/scripts/fetch_data.py 600519 --type all -o /tmp/stock_data.json
```

### 步骤2：生成初步报告

```bash
python skills/stock-investment-analysis/scripts/analyze.py 600519 --data /tmp/stock_data.json -o /tmp/report.md
```

### 步骤3：深度分析

基于获取的数据，使用Prompt模板进行深度分析（参见 references/prompt-templates.md）。

---

## 脚本参数

### fetch_data.py

```
usage: fetch_data.py <symbol> [options]

options:
  --type, -t    数据类型: all, basic, financial, industry, valuation, yearly, reports
  --years, -y   财务数据年数 (default: 5)
  --limit, -l   研报数量 (default: 5)
  --output, -o  输出JSON文件路径
```

### analyze.py

```
usage: analyze.py <symbol> [options]

options:
  --data, -d    数据JSON文件路径 (不指定则自动获取)
  --output, -o  输出报告文件路径
```

---

## 免责声明

本工具生成的分析报告仅供参考，不构成投资建议。投资有风险，入市需谨慎。
