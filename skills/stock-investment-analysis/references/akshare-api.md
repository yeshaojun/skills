# AKShare API Reference

常用数据获取接口参考。

## 目录

- [基础行情](#基础行情)
- [财务数据](#财务数据)
- [行业数据](#行业数据)
- [研报数据](#研报数据)

---

## 基础行情

### A股实时行情

```python
import akshare as ak

# A股实时行情
df = ak.stock_zh_a_spot_em()

# A股历史数据
df = ak.stock_zh_a_hist(symbol="600519", period="daily", start_date="20200101", adjust="qfq")

# 个股信息
df = ak.stock_individual_info_em(symbol="600519")
```

### 港股实时行情

```python
# 港股实时行情
df = ak.stock_hk_spot_em()

# 港股历史数据
df = ak.stock_hk_hist(symbol="00700", period="daily", start_date="20200101", adjust="qfq")
```

---

## 财务数据

### A股业绩报表

```python
# A股业绩报表（按日期）
df = ak.stock_yjbb_em(date="20231231")

# 字段包括：
# - 营业总收入-营业总收入
# - 净利润-净利润
# - 营业总收入-同比增长
# - 净利润-同比增长
# - 销售毛利率
# - 销售净利率
# - 净资产收益率
# - 每股收益
# - 每股净资产
# - 每股经营现金流量
```

### 港股财务报表

```python
# 港股财务报表
df = ak.stock_financial_hk_report_em(stock="00700", symbol="利润表")

# symbol 可选: 利润表、资产负债表、现金流量表
```

---

## 行业数据

```python
# 行业板块行情
df = ak.stock_board_industry_name_em()

# 行业成分股
df = ak.stock_board_industry_cons_em(symbol="白酒")
```

---

## 研报数据

```python
# 个股研报
df = ak.stock_research_report_em(symbol="600519")

# 返回字段：
# - 报告名称
# - 东财评级
# - 机构
# - 日期
# - 行业
# - 报告PDF链接
# - 2025-盈利预测-收益
# - 2025-盈利预测-市盈率
# - 2026-盈利预测-收益
# - 2026-盈利预测-市盈率
# - 2027-盈利预测-收益
# - 2027-盈利预测-市盈率
```

---

## 数据来源建议

| 数据类型 | 推荐来源 |
|---------|---------|
| 股票行情 | AKShare、Tushare、东方财富 |
| 财务数据 | 同花顺iFinD、Wind、Choice |
| 券商研报 | 慧博投研、东方财富研报、Akshare |
| 行业数据 | 国家统计局、行业协会 |
| 公司公告 | 巨潮资讯网、交易所官网 |
