import requests
import pandas as pd
import time
from datetime import datetime, timedelta
import json

class StockDataCollector:
    def __init__(self):
        self.base_url = "https://api.steamdt.com/user/statistics/v1/kline?type=1"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.max_retries = 1  # 最大重试次数
        self.retry_delay = 2  # 重试延迟秒数
        
    def timestamp_to_datetime(self, timestamp):
        """将时间戳转换为yyyy-mm-dd HH:mm:ss格式"""
        return datetime.fromtimestamp(int(timestamp)).strftime('%Y-%m-%d %H:%M:%S')
    
    def get_kline_data(self, max_time=None):
        """获取K线数据，包含风控重试机制"""
        url = self.base_url
        if max_time:
            url += f"&maxTime={max_time}"
            
        retries = 0
        while retries < self.max_retries:
            try:
                response = requests.get(url, headers=self.headers, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                # 检查是否被风控
                if data.get('success') == False:
                    error_code = data.get('errorCode')
                    error_str = data.get('errorCodeStr', '')
                    
                    if error_code == 102 and "STEAM_STOCK_COMMON_ERROR_102" in error_str:
                        print(f"遇到风控限制 (错误码 102)，等待 {self.retry_delay} 秒后重试... (第 {retries + 1} 次重试)")
                        time.sleep(self.retry_delay)
                        retries += 1
                        continue
                    else:
                        print(f"API返回错误: {data}")
                        return None
                
                # 成功获取数据
                if data.get('success') and data.get('data') is not None:
                    return data['data']
                else:
                    print(f"API返回数据异常: {data}")
                    return None
                    
            except requests.exceptions.RequestException as e:
                print(f"请求失败: {e}，等待 {self.retry_delay} 秒后重试... (第 {retries + 1} 次重试)")
                time.sleep(self.retry_delay)
                retries += 1
            except json.JSONDecodeError as e:
                print(f"JSON解析失败: {e}，等待 {self.retry_delay} 秒后重试... (第 {retries + 1} 次重试)")
                time.sleep(self.retry_delay)
                retries += 1
        
        print(f"达到最大重试次数 {self.max_retries}，放弃本次请求")
        return None
    
    def collect_historical_data(self, output_file='stock_data.csv'):
        """收集历史数据直到数据为空"""
        all_data = []
        max_time = None
        page_count = 0
        consecutive_errors = 0  # 连续错误计数
        max_consecutive_errors = 3  # 最大连续错误次数
        
        print("开始收集大盘数据...")
        print("注意：如果遇到风控限制(错误码102)，会自动等待2秒后重试")
        
        while True:
            print(f"正在获取第 {page_count + 1} 页数据...")
            
            kline_data = self.get_kline_data(max_time)
            
            if kline_data is None:
                consecutive_errors += 1
                print(f"获取数据失败，连续错误次数: {consecutive_errors}")
                
                if consecutive_errors >= max_consecutive_errors:
                    print("连续错误次数过多，停止收集")
                    break
                else:
                    # 等待一段时间后继续
                    time.sleep(2)
                    continue
            else:
                consecutive_errors = 0  # 重置连续错误计数
            
            # 如果数据为空数组，说明没有更多数据
            if len(kline_data) == 0:
                print("获取到空数据，已到达数据边界，停止收集")
                break
                
            # 处理当前页数据
            for item in kline_data:
                timestamp, open_price, close_price, high_price, low_price, volume, turnover = item
                
                data_row = {
                    'symbol': 'cs',
                    'datetime': self.timestamp_to_datetime(timestamp),
                    'open': float(open_price),
                    'close': float(close_price),
                    'high': float(high_price),
                    'low': float(low_price),
                    'volume': int(volume),
                    'factor': 1.0
                }
                all_data.append(data_row)
            
            print(f"第 {page_count + 1} 页获取到 {len(kline_data)} 条数据")
            
            # 更新maxTime为当前页第一个时间戳减去3600
            if kline_data:
                first_timestamp = int(kline_data[0][0])
                max_time = first_timestamp - 3600
                page_count += 1
            
            # 添加延迟避免请求过快（即使成功也稍作延迟）
            time.sleep(0.5)
        
        # 保存到CSV文件
        if all_data:
            df = pd.DataFrame(all_data)
            # 按时间顺序排序（从早到晚）
            df = df.sort_values('datetime')
            
            # 保存为CSV
            df.to_csv(output_file, index=False, encoding='utf-8-sig')
            print(f"数据收集完成！共收集 {len(all_data)} 条数据")
            print(f"数据已保存到: {output_file}")
            print(f"时间范围: {df['datetime'].iloc[0]} 到 {df['datetime'].iloc[-1]}")
            
            # 显示数据样例
            print("\n数据样例:")
            print(df.head())
            
            return df
        else:
            print("没有收集到任何数据")
            return None

    def save_checkpoint(self, max_time, filename='checkpoint.txt'):
        """保存检查点，便于中断后恢复"""
        with open(filename, 'w') as f:
            f.write(str(max_time))
    
    def load_checkpoint(self, filename='checkpoint.txt'):
        """加载检查点"""
        try:
            with open(filename, 'r') as f:
                return int(f.read().strip())
        except:
            return None

def main():
    collector = StockDataCollector()
    
    # 收集历史数据
    df = collector.collect_historical_data('大盘数据.csv')
    
    if df is not None:
        # 显示数据统计信息
        print("\n数据统计信息:")
        print(f"总记录数: {len(df)}")
        print(f"时间跨度: {df['datetime'].iloc[0]} 到 {df['datetime'].iloc[-1]}")
        print(f"开盘价统计 - 均值: {df['open'].mean():.2f}, 标准差: {df['open'].std():.2f}")
        print(f"收盘价统计 - 均值: {df['close'].mean():.2f}, 标准差: {df['close'].std():.2f}")
        print(f"成交量统计 - 均值: {df['volume'].mean():.0f}, 最大值: {df['volume'].max():.0f}")

if __name__ == "__main__":
    main()