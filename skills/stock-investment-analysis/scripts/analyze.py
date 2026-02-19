#!/usr/bin/env python3
"""
企业投资价值分析 - 快速分析脚本
基于获取的数据生成分析摘要

Usage:
    python analyze.py <symbol> [--data <json_file>]
    
Examples:
    python analyze.py 600519
    python analyze.py 600519 --data stock_data.json
"""

import json
import argparse
import sys
from datetime import datetime
from typing import Dict, List, Optional


class InvestmentAnalyzer:
    """投资分析器"""
    
    def __init__(self, data: Dict):
        self.data = data
        self.basic = data.get('basic', {})
        self.financial = data.get('financial', [])
        self.industry = data.get('industry', {})
        self.valuation = data.get('valuation', {})
        self.research_reports = data.get('research_reports', [])
    
    def generate_report(self) -> str:
        """生成分析报告"""
        sections = [
            self._header(),
            self._basic_summary(),
            self._financial_summary(),
            self._industry_summary(),
            self._valuation_summary(),
            self._research_summary(),
            self._risk_summary(),
            self._score_card(),
            self._footer()
        ]
        return '\n\n'.join([s for s in sections if s])
    
    def _header(self) -> str:
        """报告头部"""
        name = self.basic.get('name', self.basic.get('symbol', 'Unknown'))
        symbol = self.basic.get('symbol', '')
        price = self.basic.get('price', 0)
        change = self.basic.get('change_percent', 0)
        market = self.basic.get('market', '')
        
        change_icon = '📈' if change > 0 else '📉' if change < 0 else '➡️'
        
        return f"""# {name}({symbol}) 投资价值分析报告

> **分析日期**: {datetime.now().strftime('%Y-%m-%d')}
> **当前价格**: {price:.2f} {self.basic.get('currency', 'CNY')} {change_icon} {change:+.2f}%
> **市场**: {market}"""
    
    def _basic_summary(self) -> str:
        """基础信息摘要"""
        if not self.basic or self.basic.get('error'):
            return ""
        
        lines = ["## 一、基础信息", ""]
        
        if self.basic.get('market_cap'):
            lines.append(f"- **总市值**: {self.basic['market_cap']/1e8:.2f}亿")
        if self.basic.get('high_52w'):
            lines.append(f"- **52周最高**: {self.basic['high_52w']:.2f}")
        if self.basic.get('low_52w'):
            lines.append(f"- **52周最低**: {self.basic['low_52w']:.2f}")
        if self.basic.get('turnover_rate'):
            lines.append(f"- **换手率**: {self.basic['turnover_rate']:.2f}%")
        
        return '\n'.join(lines)
    
    def _financial_summary(self) -> str:
        """财务数据摘要"""
        if not self.financial:
            return ""
        
        lines = ["## 二、财务分析", ""]
        
        latest = self.financial[0] if self.financial else {}
        
        if latest.get('year'):
            lines.append(f"### 最新财报 ({latest['year']}年)")
            lines.append("")
        
        if latest.get('revenue'):
            revenue_yoy = latest.get('revenue_yoy')
            yoy_str = f"({revenue_yoy:+.2f}%)" if revenue_yoy else ""
            lines.append(f"- **营业收入**: {latest['revenue']/1e8:.2f}亿 {yoy_str}")
        
        if latest.get('net_profit'):
            profit_yoy = latest.get('profit_yoy')
            yoy_str = f"({profit_yoy:+.2f}%)" if profit_yoy else ""
            lines.append(f"- **净利润**: {latest['net_profit']/1e8:.2f}亿 {yoy_str}")
        
        if latest.get('gross_margin'):
            lines.append(f"- **毛利率**: {latest['gross_margin']:.2f}%")
        
        if latest.get('net_margin'):
            lines.append(f"- **净利率**: {latest['net_margin']:.2f}%")
        
        if latest.get('roe'):
            lines.append(f"- **ROE**: {latest['roe']:.2f}%")
        
        if latest.get('eps'):
            lines.append(f"- **每股收益**: {latest['eps']:.2f}")
        
        if len(self.financial) >= 3:
            lines.append("")
            lines.append("### 近3年趋势")
            lines.append("")
            lines.append("| 年份 | 营收(亿) | 净利润(亿) | ROE | 毛利率 |")
            lines.append("|------|---------|-----------|-----|--------|")
            
            for f in self.financial[:3]:
                rev = f.get('revenue', 0) / 1e8
                profit = f.get('net_profit', 0) / 1e8
                roe = f.get('roe', 0)
                gm = f.get('gross_margin', 0)
                lines.append(f"| {f.get('year', '-')} | {rev:.2f} | {profit:.2f} | {roe:.2f}% | {gm:.2f}% |")
        
        return '\n'.join(lines)
    
    def _industry_summary(self) -> str:
        """行业摘要"""
        if not self.industry or self.industry.get('error'):
            return ""
        
        lines = ["## 三、行业分析", ""]
        
        if self.industry.get('industry'):
            lines.append(f"- **所属行业**: {self.industry['industry']}")
        
        if self.industry.get('industry_change'):
            change = self.industry['industry_change']
            icon = '📈' if change > 0 else '📉'
            lines.append(f"- **行业涨跌**: {icon} {change:.2f}%")
        
        if self.industry.get('industry_rank'):
            lines.append(f"- **行业排名**: {self.industry['industry_rank']}")
        
        return '\n'.join(lines)
    
    def _valuation_summary(self) -> str:
        """估值摘要"""
        if not self.valuation or self.valuation.get('error'):
            return ""
        
        lines = ["## 四、估值分析", ""]
        
        if self.valuation.get('pe_ttm'):
            lines.append(f"- **PE(TTM)**: {self.valuation['pe_ttm']:.2f}倍")
        
        if self.valuation.get('pb'):
            lines.append(f"- **PB**: {self.valuation['pb']:.2f}倍")
        
        if self.valuation.get('ps'):
            lines.append(f"- **PS**: {self.valuation['ps']:.2f}倍")
        
        if self.valuation.get('market_cap'):
            lines.append(f"- **总市值**: {self.valuation['market_cap']/1e8:.2f}亿")
        
        if self.valuation.get('price_percentile'):
            pct = self.valuation['price_percentile']
            level = "高估" if pct > 80 else "合理偏高" if pct > 60 else "合理" if pct > 40 else "低估" if pct > 20 else "明显低估"
            lines.append(f"- **价格分位数**: {pct:.1f}% ({level})")
        
        return '\n'.join(lines)
    
    def _research_summary(self) -> str:
        """研报摘要"""
        if not self.research_reports:
            return ""
        
        reports = [r for r in self.research_reports if not r.get('error') and not r.get('note')]
        if not reports:
            return ""
        
        lines = ["## 五、券商研报分析", ""]
        lines.append(f"### 最近{len(reports)}篇研报")
        lines.append("")
        
        ratings_count = {}
        institutions = []
        
        for report in reports:
            rating = report.get('rating', '')
            if rating:
                ratings_count[rating] = ratings_count.get(rating, 0) + 1
            institution = report.get('institution', '')
            if institution and institution not in institutions:
                institutions.append(institution)
        
        if ratings_count:
            buy_count = sum(v for k, v in ratings_count.items() if '买入' in k or '强烈推荐' in k or '增持' in k)
            hold_count = sum(v for k, v in ratings_count.items() if '持有' in k or '中性' in k)
            sell_count = sum(v for k, v in ratings_count.items() if '卖出' in k or '减持' in k)
            
            lines.append("**评级分布**:")
            if buy_count:
                lines.append(f"- 买入/增持: {buy_count}家")
            if hold_count:
                lines.append(f"- 持有/中性: {hold_count}家")
            if sell_count:
                lines.append(f"- 卖出/减持: {sell_count}家")
            lines.append("")
        
        if institutions:
            lines.append(f"**覆盖机构**: {', '.join(institutions[:5])}")
            if len(institutions) > 5:
                lines[0] = lines[0] + f" 等{len(institutions)}家"
            lines.append("")
        
        eps_forecasts = []
        for report in reports:
            if report.get('eps_forecast'):
                for year, data in report['eps_forecast'].items():
                    eps_forecasts.append((year, data['eps'], data.get('pe')))
        
        if eps_forecasts:
            lines.append("**盈利预测汇总**:")
            lines.append("")
            eps_by_year = {}
            for year, eps, pe in eps_forecasts:
                if year not in eps_by_year:
                    eps_by_year[year] = {'eps': [], 'pe': []}
                eps_by_year[year]['eps'].append(eps)
                if pe:
                    eps_by_year[year]['pe'].append(pe)
            
            lines.append("| 年份 | 预测EPS | 平均PE |")
            lines.append("|------|---------|--------|")
            for year in sorted(eps_by_year.keys()):
                eps_list = eps_by_year[year]['eps']
                pe_list = eps_by_year[year]['pe']
                avg_eps = sum(eps_list) / len(eps_list) if eps_list else 0
                avg_pe = sum(pe_list) / len(pe_list) if pe_list else 0
                lines.append(f"| {year} | {avg_eps:.2f} | {avg_pe:.1f} |")
            lines.append("")
        
        lines.append("**最新研报列表**:")
        lines.append("")
        lines.append("| 日期 | 机构 | 评级 | 标题 |")
        lines.append("|------|------|------|------|")
        for report in reports[:5]:
            lines.append(f"| {report.get('date', '-')} | {report.get('institution', '-')} | {report.get('rating', '-')} | {report.get('title', '-')[:30]}... |")
        
        return '\n'.join(lines)
    
    def _risk_summary(self) -> str:
        """风险提示"""
        risks = []
        
        if self.financial:
            latest = self.financial[0]
            
            if latest.get('revenue_yoy') and latest['revenue_yoy'] < -10:
                risks.append(f"营收同比下降{abs(latest['revenue_yoy']):.1f}%，增长承压")
            
            if latest.get('profit_yoy') and latest['profit_yoy'] < -10:
                risks.append(f"净利润同比下降{abs(latest['profit_yoy']):.1f}%，盈利能力下降")
            
            if latest.get('roe') and latest['roe'] < 10:
                risks.append(f"ROE仅为{latest['roe']:.1f}%，股东回报率偏低")
            
            if latest.get('gross_margin') and latest['gross_margin'] < 20:
                risks.append(f"毛利率仅{latest['gross_margin']:.1f}%，产品竞争力或成本控制存疑")
        
        if self.valuation:
            if self.valuation.get('pe_ttm') and self.valuation['pe_ttm'] > 50:
                risks.append(f"PE达{self.valuation['pe_ttm']:.1f}倍，估值偏高")
            
            if self.valuation.get('price_percentile') and self.valuation['price_percentile'] > 80:
                risks.append("价格处于历史高位，存在回调风险")
        
        if not risks:
            return ""
        
        lines = ["## 六、风险提示", ""]
        for risk in risks:
            lines.append(f"- ⚠️ {risk}")
        
        return '\n'.join(lines)
    
    def _score_card(self) -> str:
        """评分卡"""
        scores = {}
        
        if self.financial and len(self.financial) >= 3:
            latest = self.financial[0]
            
            if latest.get('roe'):
                if latest['roe'] >= 20:
                    scores['盈利能力'] = 9
                elif latest['roe'] >= 15:
                    scores['盈利能力'] = 7
                elif latest['roe'] >= 10:
                    scores['盈利能力'] = 5
                else:
                    scores['盈利能力'] = 3
            
            growth_count = sum(1 for f in self.financial[:3] if f.get('revenue_yoy') and f['revenue_yoy'] > 10)
            if growth_count >= 3:
                scores['成长性'] = 9
            elif growth_count >= 2:
                scores['成长性'] = 7
            elif growth_count >= 1:
                scores['成长性'] = 5
            else:
                scores['成长性'] = 3
        
        if self.valuation:
            if self.valuation.get('price_percentile'):
                pct = self.valuation['price_percentile']
                if pct <= 20:
                    scores['估值'] = 9
                elif pct <= 40:
                    scores['估值'] = 7
                elif pct <= 60:
                    scores['估值'] = 5
                elif pct <= 80:
                    scores['估值'] = 3
                else:
                    scores['估值'] = 2
        
        if self.research_reports:
            reports = [r for r in self.research_reports if not r.get('error') and not r.get('note')]
            if reports:
                buy_count = sum(1 for r in reports if '买入' in r.get('rating', '') or '强烈推荐' in r.get('rating', '') or '增持' in r.get('rating', ''))
                if len(reports) > 0:
                    buy_ratio = buy_count / len(reports)
                    if buy_ratio >= 0.7:
                        scores['机构认可'] = 9
                    elif buy_ratio >= 0.5:
                        scores['机构认可'] = 7
                    elif buy_ratio >= 0.3:
                        scores['机构认可'] = 5
                    else:
                        scores['机构认可'] = 3
        
        if not scores:
            return ""
        
        lines = ["## 七、评分卡", ""]
        lines.append("| 维度 | 评分 | 评价 |")
        lines.append("|------|------|------|")
        
        total = 0
        for dim, score in scores.items():
            rating = "优秀" if score >= 8 else "良好" if score >= 6 else "一般" if score >= 4 else "较差"
            lines.append(f"| {dim} | {score}/10 | {rating} |")
            total += score
        
        if scores:
            avg = total / len(scores)
            overall = "强烈推荐" if avg >= 8 else "推荐" if avg >= 6.5 else "中性" if avg >= 5 else "谨慎"
            lines.append(f"| **综合** | **{avg:.1f}/10** | **{overall}** |")
        
        return '\n'.join(lines)
    
    def _footer(self) -> str:
        """报告尾部"""
        return """---

*免责声明：本报告仅供参考，不构成投资建议。投资有风险，入市需谨慎。*"""


def main():
    parser = argparse.ArgumentParser(description='生成股票投资分析报告')
    parser.add_argument('symbol', help='股票代码')
    parser.add_argument('--data', '-d', help='数据JSON文件路径')
    parser.add_argument('--output', '-o', help='输出文件路径')
    
    args = parser.parse_args()
    
    if args.data:
        with open(args.data, 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        from fetch_data import StockDataFetcher
        fetcher = StockDataFetcher(args.symbol)
        data = fetcher.fetch_all()
    
    analyzer = InvestmentAnalyzer(data)
    report = analyzer.generate_report()
    
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"报告已保存到 {args.output}")
    else:
        print(report)


if __name__ == '__main__':
    main()
