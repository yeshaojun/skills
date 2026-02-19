---
name: stock-investment-analysis
description: 企业投资价值分析框架，包含行业分析、竞争力分析、财务分析、估值模型和券商研报分析。用于系统化评估企业投资价值，生成专业投资分析报告。使用AKShare获取A股和港股数据。
license: MIT
metadata:
  author: Mr_shaojun
  version: "1.2.0"
---

# 企业投资价值分析框架

系统化的企业投资价值分析流程，涵盖行业、竞争力、财务、估值和研报五大维度。

## 分析流程概览

```
1. 数据收集 → 2. 行业分析 → 3. 竞争力分析 → 4. 财务分析 → 5. 估值分析 → 6. 研报分析 → 7. 综合评分 → 8. 投资建议
```

---

## 快速开始：数据获取脚本

### 前置要求

```bash
pip install akshare pandas
```

### 获取股票数据

```bash
# 获取所有数据（推荐）
python skills/stock-investment-analysis/scripts/fetch_data.py 600519 --type all

# 仅获取基础信息
python skills/stock-investment-analysis/scripts/fetch_data.py 600519 --type basic

# 获取财务数据（近5年）
python skills/stock-investment-analysis/scripts/fetch_data.py 600519 --type financial --years 5

# 获取行业数据
python skills/stock-investment-analysis/scripts/fetch_data.py 600519 --type industry

# 获取估值数据
python skills/stock-investment-analysis/scripts/fetch_data.py 600519 --type valuation

# 获取年度涨跌幅
python skills/stock-investment-analysis/scripts/fetch_data.py 600519 --type yearly

# 获取券商研报
python skills/stock-investment-analysis/scripts/fetch_data.py 600519 --type reports --limit 5

# 保存到文件
python skills/stock-investment-analysis/scripts/fetch_data.py 600519 --type all -o stock_data.json
```

### 支持的市场

| 市场 | 代码格式 | 示例 |
|------|---------|------|
| A股 | 6位数字 | 600519, 000001, 300750 |
| 港股 | 5位数字 | 00700, 09988, 03690 |

### 生成分析报告

```bash
# 自动获取数据并生成报告
python skills/stock-investment-analysis/scripts/analyze.py 600519

# 使用已有数据生成报告
python skills/stock-investment-analysis/scripts/analyze.py 600519 --data stock_data.json

# 保存报告到文件
python skills/stock-investment-analysis/scripts/analyze.py 600519 -o report.md
```

### 数据获取API说明

#### 基础信息 (basic)

| 字段 | A股 | 港股 | 说明 |
|------|-----|------|------|
| symbol | ✓ | ✓ | 股票代码 |
| name | ✓ | ✓ | 股票名称 |
| price | ✓ | ✓ | 当前价格 |
| change_percent | ✓ | ✓ | 涨跌幅% |
| market_cap | ✓ | ✓ | 总市值 |
| pe_ratio | ✓ | - | 市盈率(动态) |
| pb_ratio | ✓ | - | 市净率 |
| turnover_rate | ✓ | - | 换手率 |
| high_52w | ✓ | ✓ | 52周最高 |
| low_52w | ✓ | ✓ | 52周最低 |

#### 财务数据 (financial) - 近5年

| 字段 | 说明 | 数据源 |
|------|------|--------|
| year | 年份 | - |
| revenue | 营业收入(元) | 业绩报表 |
| net_profit | 净利润(元) | 业绩报表 |
| revenue_yoy | 营收同比增长% | 业绩报表 |
| profit_yoy | 净利润同比增长% | 业绩报表 |
| gross_margin | 毛利率% | 业绩报表 |
| net_margin | 净利率% | 业绩报表 |
| roe | 净资产收益率% | 业绩报表 |
| eps | 每股收益(元) | 业绩报表 |
| bps | 每股净资产(元) | 业绩报表 |
| cfps | 每股经营现金流(元) | 业绩报表 |

#### 估值数据 (valuation)

| 字段 | 说明 |
|------|------|
| pe_ttm | 市盈率TTM |
| pb | 市净率 |
| ps | 市销率 |
| market_cap | 总市值 |
| price_percentile | 价格历史分位数% |
| history | 近5年历史价格数据 |

#### 研报数据 (research_reports)

| 字段 | 说明 |
|------|------|
| title | 研报标题 |
| rating | 投资评级 |
| institution | 发布机构 |
| date | 发布日期 |
| industry | 所属行业 |
| pdf_url | PDF链接 |
| eps_forecast | 盈利预测(2025-2027年EPS/PE) |

### AkShare 常用接口参考

```python
import akshare as ak

# A股实时行情
df = ak.stock_zh_a_spot_em()

# A股历史数据
df = ak.stock_zh_a_hist(symbol="600519", period="daily", start_date="20200101", adjust="qfq")

# A股业绩报表（按日期）
df = ak.stock_yjbb_em(date="20231231")

# 港股实时行情
df = ak.stock_hk_spot_em()

# 港股历史数据
df = ak.stock_hk_hist(symbol="00700", period="daily", start_date="20200101", adjust="qfq")

# 港股财务报表
df = ak.stock_financial_hk_report_em(stock="00700", symbol="利润表")

# 行业板块行情
df = ak.stock_board_industry_name_em()

# 行业成分股
df = ak.stock_board_industry_cons_em(symbol="白酒")

# 个股信息
df = ak.stock_individual_info_em(symbol="600519")

# 个股研报（新增）
df = ak.stock_research_report_em(symbol="600519")
```

---

## 一、数据收集阶段

### 1.1 基础信息数据
- **股票代码**: 交易代码
- **公司名称**: 全称及简称
- **所属行业**: 行业分类（申万/中信/全球行业分类）
- **当前价格**: 最新收盘价
- **市值**: 总市值和流通市值

### 1.2 财务数据（近5年）
- 营业收入及同比增长
- 净利润及同比增长
- 毛利率、净利率
- ROE（净资产收益率）
- EPS（每股收益）
- 资产负债率
- 经营现金流

### 1.3 网络信息收集
- 券商研报摘要
- 行业政策动态
- 公司新闻公告
- 竞争对手信息

---

## 二、行业分析模板

### Prompt模板

```
请对 {行业名称} 行业进行全面分析，包括：

## 1. 行业概述
- 行业定义和主要业务范围
- 产业链结构（上游/中游/下游）
- 行业发展阶段（导入期/成长期/成熟期/衰退期）

## 2. 市场规模与增长
- 当前市场规模（全球/中国）
- 近5年复合增长率(CAGR)
- 未来3-5年增长预期
- 驱动增长的核心因素

## 3. 竞争格局
- 市场集中度（CR3/CR5）
- 主要企业及市场份额
- 行业进入壁垒分析
- 竞争态势（寡头垄断/完全竞争等）

## 4. 政策环境
- 相关政策法规梳理
- 政策对行业的影响（利好/利空）
- 监管趋势预判

## 5. 技术趋势
- 核心技术发展方向
- 技术迭代周期
- 技术变革对格局的影响

## 6. 投资机会与风险
- 行业投资价值评估
- 主要投资机会
- 关键风险因素
```

### 行业评分标准

| 维度 | 优秀(8-10) | 良好(5-7) | 较差(1-4) |
|------|-----------|----------|----------|
| 市场规模 | >万亿 | 千亿级 | 百亿级 |
| 增长速度 | >20% | 10-20% | <10% |
| 竞争格局 | 龙头优势明显 | 竞争适中 | 竞争激烈 |
| 政策支持 | 强支持 | 中性 | 限制性 |

---

## 三、竞争力分析模板

### Prompt模板

```
请对 {公司名称}({股票代码}) 进行竞争力深度分析，包括：

## 1. 公司概况
- 主营业务描述
- 业务收入结构
- 市场地位（行业排名）
- 发展历程关键节点

## 2. 核心竞争力
### 2.1 技术优势
- 核心技术/专利情况
- 研发投入占比
- 技术壁垒高度

### 2.2 品牌优势
- 品牌认知度
- 品牌溢价能力
- 品牌护城河

### 2.3 渠道优势
- 销售渠道覆盖
- 渠道控制力
- 客户粘性

### 2.4 成本优势
- 规模效应
- 供应链管理
- 成本控制能力

### 2.5 管理团队
- 核心管理层背景
- 股权激励情况
- 公司治理水平

## 3. 财务表现
{财务数据摘要}
- 盈利能力分析
- 成长性分析
- 财务健康度

## 4. 竞争对手对比
- 主要竞争对手名单
- 各自优劣势对比
- 市场份额变化趋势

## 5. SWOT分析
- 优势(Strengths): 内部有利因素
- 劣势(Weaknesses): 内部不利因素
- 机会(Opportunities): 外部有利因素
- 威胁(Threats): 外部不利因素

## 6. 综合评价
- 竞争力评分（1-10分）
- 竞争力变化趋势
- 核心风险提示
```

### 竞争力评分维度

| 维度 | 权重 | 评估要点 |
|------|------|---------|
| 技术壁垒 | 25% | 专利、研发、技术领先性 |
| 品牌价值 | 20% | 知名度、美誉度、溢价能力 |
| 市场地位 | 20% | 份额、排名、定价权 |
| 管理能力 | 15% | 团队、治理、执行力 |
| 财务质量 | 20% | 盈利、现金流、负债 |

---

## 四、财务分析模板

### 财务数据格式化

```python
def format_financial_summary(financial_data):
    latest = financial_data[0]
    return f"""
财务数据摘要：
当前价格：{price}元

最新财报（{latest['year']}Q{latest['quarter']}）：
- 营收：{latest['revenue']/1e8:.2f}亿（同比{latest['revenue_yoy']:.2f}%）
- 净利润：{latest['net_profit']/1e8:.2f}亿（同比{latest['profit_yoy']:.2f}%）
- 毛利率：{latest['gross_margin']:.2f}%
- 净利率：{latest['net_margin']:.2f}%
- ROE：{latest['roe']:.2f}%
- EPS：{latest['eps']:.2f}

近5年关键指标趋势：
- ROE趋势：{[f.get('roe', 0) for f in financial_data[:5]]}
- 营收增长趋势：{[f.get('revenue_yoy', 0) for f in financial_data[:5]]}
- 净利润增长趋势：{[f.get('profit_yoy', 0) for f in financial_data[:5]]}
"""
```

### 财务分析要点

#### 4.1 盈利能力
- **毛利率**: 反映产品定价能力和成本控制
  - >40%: 优秀
  - 20-40%: 良好
  - <20%: 较差

- **净利率**: 反映整体经营效率
  - >15%: 优秀
  - 5-15%: 良好
  - <5%: 较差

- **ROE**: 股东回报率核心指标
  - >20%: 优秀
  - 12-20%: 良好
  - <12%: 较差

#### 4.2 成长性
- 营收复合增长率
- 净利润复合增长率
- 增长的可持续性判断

#### 4.3 财务健康
- 资产负债率 (<60%为宜)
- 经营现金流/净利润 (>1为宜)
- 应收账款周转天数

---

## 五、估值分析模板

### Prompt模板

```
请对 {公司名称}({股票代码}) 进行估值分析，包括：

## 1. 当前估值水平
- PE(TTM): {当前PE}x
- PB: {当前PB}x
- PS: {当前PS}x
- EV/EBITDA: {EV_EBITDA}x

## 2. 历史估值区间
- 5年PE中位数: {pe_median}x
- 5年PE区间: {pe_range}
- 当前估值分位数: {pe_percentile}%

## 3. 行业估值对比
- 行业平均PE: {industry_pe}x
- 龙头公司PE: {leader_pe}x
- 估值溢价/折价分析

## 4. 估值方法
### 4.1 DCF估值（适用于稳定增长）
- 假设条件
- 合理估值区间

### 4.2 相对估值（PE/PB法）
- 可比公司选择
- 合理PE区间
- 目标价格测算

### 4.3 PEG估值（适用于高增长）
- PEG = PE/增速
- PEG < 1: 低估
- PEG 1-2: 合理
- PEG > 2: 高估

## 5. 估值结论
- 当前估值水平判断（低估/合理/高估）
- 安全边际分析
- 目标价格区间
```

### 估值评分标准

| PE分位数 | 评分 | 判断 |
|---------|------|------|
| 0-20% | 9-10 | 明显低估 |
| 20-40% | 7-8 | 低估 |
| 40-60% | 5-6 | 合理 |
| 60-80% | 3-4 | 偏高 |
| 80-100% | 1-2 | 明显高估 |

---

## 六、券商研报分析模板

### Prompt模板

```
请分析以下关于 {公司名称}({股票代码}) 的券商研报，当前股价{price}元，并给出投资建议：

{研报列表}

请完成以下分析：

## 一、研报核心观点汇总
- 各机构对公司的主要看法
- 共识观点和分歧点
- 重点关注事项

## 二、盈利预测分析
- EPS预测趋势（2025-2027年）
- 预测增长率
- 预测一致性分析

## 三、投资评级统计
- 买入/增持/持有/卖出评级分布
- 机构看好/看空比例

## 四、风险提示
- 研报中提到的主要风险

## 五、投资建议
1. 综合评级建议（强烈推荐/推荐/中性/不推荐）
2. 目标价格区间
3. 关键催化剂
4. 需要关注的指标

请用中文回答，简洁专业，结论明确。
```

### 研报数据格式

```python
# 获取研报数据
import akshare as ak
df = ak.stock_research_report_em(symbol="600519")

# 研报关键字段
report = {
    "title": row['报告名称'],       # 研报标题
    "rating": row['东财评级'],      # 投资评级
    "institution": row['机构'],     # 发布机构
    "date": row['日期'],            # 发布日期
    "industry": row['行业'],        # 所属行业
    "pdf_url": row['报告PDF链接'],  # PDF链接
    "eps_forecast": {               # 盈利预测
        "2025": {"eps": 72.36, "pe": 19.32},
        "2026": {"eps": 74.47, "pe": 18.77},
        "2027": {"eps": 79.32, "pe": 17.63}
    }
}
```

### 研报评分标准

| 评级分布 | 评分 | 判断 |
|---------|------|------|
| 买入/增持>70% | 9-10 | 高度认可 |
| 买入/增持50-70% | 7-8 | 较为看好 |
| 买入/增持30-50% | 5-6 | 分歧较大 |
| 买入/增持<30% | 1-4 | 看空为主 |

---

## 七、综合投资分析模板

### 完整分析Prompt

```
请对 {公司名称}({股票代码}) 进行全面的投资价值分析：

## 一、行业分析
1. 行业概述与产业链
2. 市场规模与增长趋势
3. 竞争格局与政策环境
4. 行业前景评分（1-10分）

## 二、竞争力分析
1. 公司市场地位
2. 核心竞争力（技术/品牌/渠道/成本）
3. SWOT分析
4. 竞争力评分（1-10分）

## 三、财务分析
{财务数据摘要}
1. 盈利能力分析
2. 成长性分析
3. 财务健康度
4. 财务质量评分（1-10分）

## 四、估值分析
1. 当前估值水平（PE/PB）
2. 历史估值对比
3. 行业估值对比
4. 估值评分（1-10分）

## 五、研报分析
{研报数据摘要}
1. 机构观点汇总
2. 盈利预测分析
3. 评级分布
4. 机构认可评分（1-10分）

## 六、风险因素
1. 行业风险
2. 公司风险
3. 市场风险
4. 安全边际评估

## 七、综合评分
| 维度 | 评分 | 权重 | 加权分 |
|------|------|------|--------|
| 行业前景 | X/10 | 15% | X.X |
| 竞争力 | X/10 | 20% | X.X |
| 成长性 | X/10 | 15% | X.X |
| 估值 | X/10 | 15% | X.X |
| 机构认可 | X/10 | 15% | X.X |
| 安全边际 | X/10 | 20% | X.X |
| **总分** | | 100% | **X.X** |

## 八、投资建议
1. 投资评级（强烈推荐/推荐/中性/不推荐）
2. 目标价格区间
3. 建议持仓周期
4. 适合的投资者类型
5. 关键监控指标
```

---

## 八、评分体系汇总

### 8.1 综合评分权重

| 维度 | 权重 | 评估重点 |
|------|------|---------|
| 行业前景 | 15% | 规模、增长、政策、格局 |
| 竞争力 | 20% | 护城河、市场地位、管理 |
| 成长性 | 15% | 营收/利润增速、可持续性 |
| 估值水平 | 15% | PE/PB分位数、相对估值 |
| 机构认可 | 15% | 研报评级、盈利预测一致性 |
| 安全边际 | 20% | 风险因素、下行保护 |

### 8.2 投资评级标准

| 综合评分 | 投资评级 | 建议 |
|---------|---------|------|
| 8.0-10.0 | 强烈推荐 | 重点关注，择机建仓 |
| 6.5-7.9 | 推荐 | 可以配置，控制仓位 |
| 5.0-6.4 | 中性 | 观望为主，等待机会 |
| 3.0-4.9 | 谨慎 | 风险较大，不宜重仓 |
| 1.0-2.9 | 不推荐 | 规避风险，不建议投资 |

---

## 九、分析报告输出格式

### 9.1 Markdown报告结构

```markdown
# {公司名称}({股票代码}) 投资价值分析报告

> 分析日期：{date}
> 当前价格：{price}元
> 所属行业：{industry}

## 执行摘要
{3-5句话的核心观点总结}

## 一、行业分析
{行业分析内容}

## 二、公司竞争力
{竞争力分析内容}

## 三、财务分析
{财务分析内容}

## 四、估值分析
{估值分析内容}

## 五、券商研报
{研报分析内容}

## 六、风险提示
{风险因素}

## 七、投资建议
{投资建议内容}

## 评分卡
{综合评分表格}

---
*免责声明：本报告仅供参考，不构成投资建议。投资有风险，入市需谨慎。*
```

---

## 十、数据来源建议

| 数据类型 | 推荐来源 |
|---------|---------|
| 股票行情 | Akshare、Tushare、东方财富 |
| 财务数据 | 同花顺iFinD、Wind、Choice |
| 券商研报 | 慧博投研、东方财富研报、Akshare |
| 行业数据 | 国家统计局、行业协会 |
| 公司公告 | 巨潮资讯网、交易所官网 |

---

## 十一、注意事项

### 11.1 分析原则
- **客观性**: 基于数据而非情绪
- **全面性**: 多维度交叉验证
- **动态性**: 定期更新分析
- **谨慎性**: 宁可错过不可做错

### 11.2 常见陷阱
- 过度依赖单一指标
- 忽视行业周期性
- 对成长预期过于乐观
- 忽视财务造假风险
- 追热点忽视估值
- 盲目跟随研报评级

### 11.3 优化建议
- 结合定量与定性分析
- 对标可比公司
- 关注管理层言行一致性
- 跟踪季度业绩变化
- 建立投资日志复盘
- 综合多家研报观点

---

## 十二、完整分析工作流

### 步骤1：获取基础数据

```bash
# 获取A股数据（如贵州茅台）
python skills/stock-investment-analysis/scripts/fetch_data.py 600519 --type all -o /tmp/stock_data.json

# 获取港股数据（如腾讯控股）
python skills/stock-investment-analysis/scripts/fetch_data.py 00700 --type all -o /tmp/stock_data.json
```

### 步骤2：生成初步报告

```bash
python skills/stock-investment-analysis/scripts/analyze.py 600519 --data /tmp/stock_data.json -o /tmp/report.md
```

### 步骤3：深度分析（使用AI）

基于获取的数据，使用以下Prompt进行深度分析：

```
请基于以下数据对 {公司名称}({股票代码}) 进行深度投资分析：

{从stock_data.json中提取的财务和估值数据}

请完成：
1. 行业分析（市场规模、竞争格局、政策环境）
2. 竞争力分析（核心优势、SWOT分析）
3. 财务分析（盈利能力、成长性、财务健康）
4. 估值分析（PE/PB分位数、相对估值）
5. 风险提示
6. 投资建议与评分
```

### 步骤4：整合输出

将脚本生成的初步报告与AI深度分析整合，形成完整分析报告。

---

## 十三、脚本文件说明

| 文件 | 用途 |
|------|------|
| `scripts/fetch_data.py` | 数据获取脚本，支持A股/港股 |
| `scripts/analyze.py` | 分析报告生成脚本 |

### fetch_data.py 完整参数

```
usage: fetch_data.py [-h] [--type {all,basic,financial,industry,valuation,yearly,reports}]
                     [--years YEARS] [--limit LIMIT] [--output OUTPUT]
                     symbol

positional arguments:
  symbol                股票代码 (如: 600519, 00700)

options:
  --type, -t            数据类型 (default: all)
  --years, -y           财务数据年数 (default: 5)
  --limit, -l           研报数量 (default: 5)
  --output, -o          输出JSON文件路径
```

### analyze.py 完整参数

```
usage: analyze.py [-h] [--data DATA] [--output OUTPUT]
                  symbol

positional arguments:
  symbol                股票代码

options:
  --data, -d            数据JSON文件路径 (不指定则自动获取)
  --output, -o          输出报告文件路径
```
