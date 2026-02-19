#!/usr/bin/env python3
"""
企业投资价值分析 - 数据获取脚本
使用 AKShare 获取股票关键数据

Usage:
    python fetch_data.py <symbol> [--type all|basic|financial|industry|valuation]
    
Examples:
    python fetch_data.py 600519 --type all
    python fetch_data.py 600519 --type financial
    python fetch_data.py 00700 --type basic  # 港股
"""

import akshare as ak
import pandas as pd
import argparse
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union


class StockDataFetcher:
    """股票数据获取器"""
    
    def __init__(self, symbol: str):
        self.symbol = symbol
        self.is_hk = len(symbol) == 5 and symbol.isdigit()
        self.is_a = len(symbol) == 6 and symbol.isdigit()
        
    def fetch_all(self) -> Dict:
        """获取所有数据"""
        return {
            "basic": self.fetch_basic_info(),
            "financial": self.fetch_financial_data(),
            "industry": self.fetch_industry_data(),
            "valuation": self.fetch_valuation_data(),
            "research_reports": self.fetch_research_reports(),
            "fetched_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    
    def fetch_basic_info(self) -> Dict:
        """获取基础信息"""
        try:
            if self.is_hk:
                return self._fetch_hk_basic()
            elif self.is_a:
                return self._fetch_a_basic()
            else:
                return {"error": "仅支持A股和港股"}
        except Exception as e:
            return {"error": str(e)}
    
    def _fetch_hk_basic(self) -> Dict:
        """获取港股基础信息"""
        df = ak.stock_hk_spot_em()
        stock = df[df['代码'] == self.symbol]
        if stock.empty:
            return {"error": f"未找到港股 {self.symbol}"}
        
        row = stock.iloc[0]
        
        hist_df = ak.stock_hk_hist(
            symbol=self.symbol, 
            period="daily",
            start_date=(datetime.now() - timedelta(days=365*5)).strftime('%Y%m%d'),
            adjust="qfq"
        )
        
        high_52w = float(hist_df['收盘'].max()) if not hist_df.empty else 0
        low_52w = float(hist_df['收盘'].min()) if not hist_df.empty else 0
        
        return {
            "symbol": self.symbol,
            "name": row['名称'],
            "price": float(row['最新价']),
            "change": float(row['涨跌额']),
            "change_percent": float(row['涨跌幅']),
            "volume": int(row['成交量']) if pd.notna(row['成交量']) else 0,
            "amount": float(row['成交额']) if pd.notna(row['成交额']) else 0,
            "high_52w": high_52w,
            "low_52w": low_52w,
            "market": "港股",
            "currency": "HKD"
        }
    
    def _fetch_a_basic(self) -> Dict:
        """获取A股基础信息"""
        df = ak.stock_zh_a_spot_em()
        stock = df[df['代码'] == self.symbol]
        if stock.empty:
            return {"error": f"未找到A股 {self.symbol}"}
        
        row = stock.iloc[0]
        
        hist_df = ak.stock_zh_a_hist(
            symbol=self.symbol,
            period="daily",
            start_date=(datetime.now() - timedelta(days=365*5)).strftime('%Y%m%d'),
            adjust="qfq"
        )
        
        high_52w = float(hist_df['收盘'].max()) if not hist_df.empty else 0
        low_52w = float(hist_df['收盘'].min()) if not hist_df.empty else 0
        
        return {
            "symbol": self.symbol,
            "name": row['名称'],
            "price": float(row['最新价']),
            "change": float(row['涨跌额']),
            "change_percent": float(row['涨跌幅']),
            "volume": int(row['成交量']) if pd.notna(row['成交量']) else 0,
            "amount": float(row['成交额']) if pd.notna(row['成交额']) else 0,
            "market_cap": float(row['总市值']) if pd.notna(row['总市值']) else 0,
            "circulation_cap": float(row['流通市值']) if pd.notna(row['流通市值']) else 0,
            "turnover_rate": float(row['换手率']) if pd.notna(row['换手率']) else 0,
            "pe_ratio": float(row['市盈率-动态']) if pd.notna(row['市盈率-动态']) else 0,
            "pb_ratio": float(row['市净率']) if pd.notna(row['市净率']) else 0,
            "high_52w": high_52w,
            "low_52w": low_52w,
            "market": "A股",
            "currency": "CNY"
        }
    
    def fetch_financial_data(self, years: int = 5) -> List[Dict]:
        """获取财务数据"""
        try:
            if self.is_hk:
                return self._fetch_hk_financial(years)
            elif self.is_a:
                return self._fetch_a_financial(years)
            else:
                return [{"error": "仅支持A股和港股"}]
        except Exception as e:
            return [{"error": str(e)}]
    
    def _fetch_hk_financial(self, years: int) -> List[Dict]:
        """获取港股财务数据"""
        result = []
        current_year = datetime.now().year
        
        for year in range(current_year - 1, current_year - years - 1, -1):
            try:
                df = ak.stock_financial_hk_report_em(
                    stock=self.symbol, 
                    symbol='利润表'
                )
                
                year_data = df[df['REPORT_DATE'].str.startswith(str(year))]
                if year_data.empty:
                    continue
                
                annual_data = year_data[
                    (year_data['STD_ITEM_NAME'] == '营业额') | 
                    (year_data['STD_ITEM_NAME'] == '股东应占溢利') |
                    (year_data['STD_ITEM_NAME'] == '每股基本盈利')
                ]
                
                revenue = 0
                profit = 0
                eps = 0
                
                for _, row in annual_data.iterrows():
                    if row['STD_ITEM_NAME'] == '营业额':
                        revenue = float(row['AMOUNT'])
                    elif row['STD_ITEM_NAME'] == '股东应占溢利':
                        profit = float(row['AMOUNT'])
                    elif row['STD_ITEM_NAME'] == '每股基本盈利':
                        eps = float(row['AMOUNT'])
                
                result.append({
                    "year": year,
                    "revenue": revenue,
                    "net_profit": profit,
                    "eps": eps,
                    "net_margin": (profit / revenue * 100) if revenue > 0 else 0
                })
            except:
                continue
        
        self._calculate_yoy(result)
        return result
    
    def _fetch_a_financial(self, years: int) -> List[Dict]:
        """获取A股财务数据"""
        result = []
        current_year = datetime.now().year
        
        for year in range(current_year - 1, current_year - years - 1, -1):
            date_str = f"{year}1231"
            try:
                df = ak.stock_yjbb_em(date=date_str)
                stock = df[df['股票代码'] == self.symbol]
                
                if stock.empty:
                    continue
                
                row = stock.iloc[0]
                
                result.append({
                    "year": year,
                    "revenue": float(row['营业总收入-营业总收入']) if pd.notna(row['营业总收入-营业总收入']) else 0,
                    "net_profit": float(row['净利润-净利润']) if pd.notna(row['净利润-净利润']) else 0,
                    "revenue_yoy": float(row['营业总收入-同比增长']) if pd.notna(row['营业总收入-同比增长']) else None,
                    "profit_yoy": float(row['净利润-同比增长']) if pd.notna(row['净利润-同比增长']) else None,
                    "gross_margin": float(row['销售毛利率']) if pd.notna(row['销售毛利率']) else 0,
                    "net_margin": float(row['销售净利率']) if pd.notna(row['销售净利率']) else 0,
                    "roe": float(row['净资产收益率']) if pd.notna(row['净资产收益率']) else 0,
                    "eps": float(row['每股收益']) if pd.notna(row['每股收益']) else 0,
                    "bps": float(row['每股净资产']) if pd.notna(row['每股净资产']) else 0,
                    "cfps": float(row['每股经营现金流量']) if pd.notna(row['每股经营现金流量']) else 0,
                })
            except Exception as e:
                continue
        
        return result
    
    def _calculate_yoy(self, data: List[Dict]) -> None:
        """计算同比增长"""
        for i in range(len(data) - 1):
            curr = data[i]
            prev = data[i + 1]
            
            if prev.get('revenue', 0) > 0:
                curr['revenue_yoy'] = (curr['revenue'] - prev['revenue']) / prev['revenue'] * 100
            if prev.get('net_profit', 0) > 0:
                curr['profit_yoy'] = (curr['net_profit'] - prev['net_profit']) / prev['net_profit'] * 100
    
    def fetch_industry_data(self) -> Dict:
        """获取行业数据"""
        try:
            if self.is_hk:
                return self._fetch_hk_industry()
            elif self.is_a:
                return self._fetch_a_industry()
            else:
                return {"error": "仅支持A股和港股"}
        except Exception as e:
            return {"error": str(e)}
    
    def _fetch_hk_industry(self) -> Dict:
        """获取港股所属行业"""
        return {
            "symbol": self.symbol,
            "industry": "港股行业数据需手动补充",
            "note": "港股行业分类可通过公司公告或财经网站查询"
        }
    
    def _fetch_a_industry(self) -> Dict:
        """获取A股行业数据"""
        result = {
            "symbol": self.symbol,
            "industry": "",
            "industry_rank": "",
            "industry_change": 0,
            "industry_stocks": []
        }
        
        try:
            industry_df = ak.stock_individual_info_em(symbol=self.symbol)
            if not industry_df.empty:
                industry_row = industry_df[industry_df['item'] == '行业']
                if not industry_row.empty:
                    result['industry'] = industry_row.iloc[0]['value']
        except:
            pass
        
        try:
            board_df = ak.stock_board_industry_name_em()
            if not board_df.empty:
                for _, row in board_df.iterrows():
                    try:
                        cons_df = ak.stock_board_industry_cons_em(symbol=row['板块名称'])
                        if self.symbol in cons_df['代码'].values:
                            result['industry'] = row['板块名称']
                            result['industry_change'] = float(row['涨跌幅'])
                            result['industry_rank'] = f"上涨{row['上涨家数']}/下跌{row['下跌家数']}"
                            result['industry_stocks'] = cons_df.head(10).to_dict('records')
                            break
                    except:
                        continue
        except:
            pass
        
        return result
    
    def fetch_valuation_data(self) -> Dict:
        """获取估值数据"""
        try:
            if self.is_hk:
                return self._fetch_hk_valuation()
            elif self.is_a:
                return self._fetch_a_valuation()
            else:
                return {"error": "仅支持A股和港股"}
        except Exception as e:
            return {"error": str(e)}
    
    def _fetch_hk_valuation(self) -> Dict:
        """获取港股估值数据"""
        result = {
            "symbol": self.symbol,
            "pe_ttm": 0,
            "pb": 0,
            "ps": 0,
            "market_cap": 0
        }
        
        try:
            df = ak.stock_hk_spot_em()
            stock = df[df['代码'] == self.symbol]
            if not stock.empty:
                result['market_cap'] = float(stock.iloc[0]['总市值']) if pd.notna(stock.iloc[0]['总市值']) else 0
        except:
            pass
        
        return result
    
    def _fetch_a_valuation(self) -> Dict:
        """获取A股估值数据"""
        result = {
            "symbol": self.symbol,
            "pe_ttm": 0,
            "pe_percentile": 0,
            "pb": 0,
            "pb_percentile": 0,
            "ps": 0,
            "market_cap": 0,
            "history": []
        }
        
        try:
            df = ak.stock_zh_a_spot_em()
            stock = df[df['代码'] == self.symbol]
            if not stock.empty:
                row = stock.iloc[0]
                result['pe_ttm'] = float(row['市盈率-动态']) if pd.notna(row['市盈率-动态']) else 0
                result['pb'] = float(row['市净率']) if pd.notna(row['市净率']) else 0
                result['market_cap'] = float(row['总市值']) if pd.notna(row['总市值']) else 0
        except:
            pass
        
        try:
            hist_df = ak.stock_zh_a_hist(
                symbol=self.symbol,
                period="daily",
                start_date=(datetime.now() - timedelta(days=365*5)).strftime('%Y%m%d'),
                adjust="qfq"
            )
            
            if not hist_df.empty:
                for _, row in hist_df.iterrows():
                    result['history'].append({
                        "date": row['日期'],
                        "close": float(row['收盘']),
                        "volume": int(row['成交量'])
                    })
                
                prices = [h['close'] for h in result['history']]
                if prices:
                    current_price = prices[-1]
                    result['price_percentile'] = sum(1 for p in prices if p <= current_price) / len(prices) * 100
        except:
            pass
        
        return result
    
    def fetch_yearly_performance(self) -> List[Dict]:
        """获取年度涨跌幅"""
        try:
            if self.is_hk:
                return self._fetch_hk_yearly_performance()
            elif self.is_a:
                return self._fetch_a_yearly_performance()
            else:
                return []
        except Exception as e:
            return [{"error": str(e)}]
    
    def _fetch_hk_yearly_performance(self) -> List[Dict]:
        """获取港股年度涨跌幅"""
        result = []
        current_year = datetime.now().year
        
        df = ak.stock_hk_hist(
            symbol=self.symbol,
            period="daily",
            start_date=f"{current_year - 5}0101",
            adjust="qfq"
        )
        
        if df.empty:
            return result
        
        df['日期'] = pd.to_datetime(df['日期'])
        
        for year in range(current_year - 5, current_year + 1):
            year_data = df[(df['日期'] >= f"{year}-01-01") & (df['日期'] <= f"{year}-12-31")]
            if len(year_data) > 0:
                first_price = year_data.iloc[0]['收盘']
                last_price = year_data.iloc[-1]['收盘']
                change = ((last_price - first_price) / first_price * 100) if first_price > 0 else 0
                result.append({
                    "year": year,
                    "start_price": float(first_price),
                    "end_price": float(last_price),
                    "change_percent": round(change, 2)
                })
        
        return result
    
    def _fetch_a_yearly_performance(self) -> List[Dict]:
        """获取A股年度涨跌幅"""
        result = []
        current_year = datetime.now().year
        
        df = ak.stock_zh_a_hist(
            symbol=self.symbol,
            period="daily",
            start_date=f"{current_year - 5}0101",
            adjust="qfq"
        )
        
        if df.empty:
            return result
        
        df['日期'] = pd.to_datetime(df['日期'])
        
        for year in range(current_year - 5, current_year + 1):
            year_data = df[(df['日期'] >= f"{year}-01-01") & (df['日期'] <= f"{year}-12-31")]
            if len(year_data) > 0:
                first_price = year_data.iloc[0]['收盘']
                last_price = year_data.iloc[-1]['收盘']
                change = ((last_price - first_price) / first_price * 100) if first_price > 0 else 0
                result.append({
                    "year": year,
                    "start_price": float(first_price),
                    "end_price": float(last_price),
                    "change_percent": round(change, 2)
                })
        
        return result
    
    def fetch_research_reports(self, limit: int = 5) -> List[Dict]:
        """获取券商研报"""
        try:
            if self.is_a:
                return self._fetch_a_research_reports(limit)
            elif self.is_hk:
                return self._fetch_hk_research_reports(limit)
            else:
                return []
        except Exception as e:
            return [{"error": str(e)}]
    
    def _fetch_a_research_reports(self, limit: int) -> List[Dict]:
        """获取A股研报"""
        result = []
        try:
            df = ak.stock_research_report_em(symbol=self.symbol)
            if df.empty:
                return result
            
            for _, row in df.head(limit).iterrows():
                report = {
                    "title": row['报告名称'] if pd.notna(row['报告名称']) else '',
                    "rating": row['东财评级'] if pd.notna(row['东财评级']) else '',
                    "institution": row['机构'] if pd.notna(row['机构']) else '',
                    "date": str(row['日期']) if pd.notna(row['日期']) else '',
                    "industry": row['行业'] if pd.notna(row['行业']) else '',
                    "pdf_url": row['报告PDF链接'] if pd.notna(row['报告PDF链接']) else '',
                    "eps_forecast": {}
                }
                
                for year in ['2025', '2026', '2027']:
                    eps_col = f'{year}-盈利预测-收益'
                    pe_col = f'{year}-盈利预测-市盈率'
                    if eps_col in row and pd.notna(row[eps_col]):
                        report['eps_forecast'][year] = {
                            "eps": float(row[eps_col]),
                            "pe": float(row[pe_col]) if pe_col in row and pd.notna(row[pe_col]) else None
                        }
                
                result.append(report)
        except Exception as e:
            result.append({"error": str(e)})
        
        return result
    
    def _fetch_hk_research_reports(self, limit: int) -> List[Dict]:
        """获取港股研报 - 暂不支持"""
        return [{"note": "港股研报数据暂不支持，请通过其他渠道获取"}]


def main():
    parser = argparse.ArgumentParser(description='获取股票投资分析数据')
    parser.add_argument('symbol', help='股票代码 (如: 600519, 00700)')
    parser.add_argument('--type', '-t', 
                        choices=['all', 'basic', 'financial', 'industry', 'valuation', 'yearly', 'reports'],
                        default='all',
                        help='数据类型')
    parser.add_argument('--years', '-y', type=int, default=5, help='财务数据年数')
    parser.add_argument('--limit', '-l', type=int, default=5, help='研报数量')
    parser.add_argument('--output', '-o', help='输出文件路径 (JSON)')
    
    args = parser.parse_args()
    
    fetcher = StockDataFetcher(args.symbol)
    
    if args.type == 'all':
        data = fetcher.fetch_all()
    elif args.type == 'basic':
        data = fetcher.fetch_basic_info()
    elif args.type == 'financial':
        data = fetcher.fetch_financial_data(args.years)
    elif args.type == 'industry':
        data = fetcher.fetch_industry_data()
    elif args.type == 'valuation':
        data = fetcher.fetch_valuation_data()
    elif args.type == 'yearly':
        data = fetcher.fetch_yearly_performance()
    elif args.type == 'reports':
        data = fetcher.fetch_research_reports(args.limit)
    else:
        data = fetcher.fetch_all()
    
    output = json.dumps(data, ensure_ascii=False, indent=2)
    
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(output)
        print(f"数据已保存到 {args.output}")
    else:
        print(output)


if __name__ == '__main__':
    main()
