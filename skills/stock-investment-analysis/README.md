# Stock Investment Analysis Skill

企业投资价值分析框架，使用 AKShare 获取 A股和港股数据。

## 安装依赖

```bash
pip install akshare pandas
```

## 使用方法

### 获取数据

```bash
# 获取所有数据
python scripts/fetch_data.py 600519 --type all

# 获取研报
python scripts/fetch_data.py 600519 --type reports --limit 5

# 保存到文件
python scripts/fetch_data.py 600519 --type all -o data.json
```

### 生成报告

```bash
# 自动获取并分析
python scripts/analyze.py 600519

# 使用已有数据
python scripts/analyze.py 600519 --data data.json

# 保存报告
python scripts/analyze.py 600519 -o report.md
```

## 支持的数据类型

| 类型 | 说明 |
|------|------|
| basic | 基础信息（价格、市值等）|
| financial | 财务数据（近5年）|
| industry | 行业数据 |
| valuation | 估值数据 |
| reports | 券商研报 |
| yearly | 年度涨跌幅 |
| all | 全部数据 |

## 支持的市场

- A股：6位数字（600519, 000001, 300750）
- 港股：5位数字（00700, 09988）
