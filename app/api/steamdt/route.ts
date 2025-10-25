export const runtime = 'edge';

// 导入共享存储
import { saveItem, getStoreSize } from '@/lib/sharedStore';

interface SteamDTData {
  name: string;
  prices: { date: string; price: number; volume?: number; timestamp?: number }[];
  currentPrice: number;
  change24h: number;
  volume24h: number;
  wear?: number;
  rawData?: any;
  itemId?: string;
}

interface SteamDTApiResponse {
  success: boolean;
  data: Array<[string, number, number, number, number, number, number, number]>;
  errorCode: number;
}

// 转换时间戳为日期时间字符串（精确到小时）
function formatTimestamp(timestamp: string | number, includeTime: boolean = true): string {
  const date = new Date(parseInt(timestamp.toString()) * 1000);
  if (includeTime) {
    // 返回格式: 2025-01-15 14:00
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }
  return date.toISOString().split('T')[0];
}

// 真实爬虫：从 SteamDT API 获取数据
async function fetchSteamDTRealData(itemId: string = "495302338"): Promise<SteamDTData> {
  const timestamp = Date.now().toString();
  const apiUrl = 'https://api.steamdt.com/user/steam/type-trend/v2/item/details';
  
  const requestBody = {
    itemId: itemId,
    platform: "ALL",
    typeDay: "1",
    dateType: 3,
    timestamp: timestamp
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://steamdt.com',
        'Referer': 'https://steamdt.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: SteamDTApiResponse = await response.json();

    if (!result.success || !result.data || result.data.length === 0) {
      throw new Error('API 返回数据无效');
    }

    // 解析数据格式: [timestamp, price1, volume1, price2, volume2, price3, volume3, totalVolume]
    // 实际上每条数据包含：[时间戳, 价格, 成交量, ...]
    const prices = result.data.map(item => {
      const timestamp = item[0]; // 时间戳（秒）
      const price = item[1]; // 价格（已经是正确单位，不需要转换）
      const volume = item[2] || 0; // 成交量
      
      return {
        date: formatTimestamp(timestamp, true), // 包含小时分钟
        price: Math.round(price * 100) / 100,
        volume: volume,
        timestamp: parseInt(timestamp.toString()) * 1000 // 保存原始时间戳（毫秒）
      };
    }).sort((a, b) => a.timestamp - b.timestamp);

    // 计算统计数据
    const currentPrice = prices[prices.length - 1]?.price || 0;
    const yesterdayPrice = prices[prices.length - 2]?.price || currentPrice;
    const change24h = yesterdayPrice !== 0 ? ((currentPrice - yesterdayPrice) / yesterdayPrice) * 100 : 0;
    
    // 计算24小时成交量
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const volume24h = prices
      .filter(p => p.timestamp > oneDayAgo)
      .reduce((sum, p) => sum + (p.volume || 0), 0);

    return {
      name: '★ Sport Gloves | Pandora\'s Box (Field-Tested)',
      prices: prices,
      currentPrice: currentPrice,
      change24h: change24h,
      volume24h: volume24h,
      wear: 0.26,
      rawData: result.data.slice(0, 5) // 保留前5条原始数据用于调试
    };

  } catch (error) {
    console.error('SteamDT API 错误:', error);
    throw error;
  }
}

// 生成未来趋势预测数据
function generateFutureTrend(currentPrice: number, days: number = 7): { date: string; price: number }[] {
  const futurePrices = [];
  const now = new Date();
  
  for (let i = 1; i <= days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    
    // 简单的趋势预测算法：基于当前价格的随机波动
    const trend = 1 + (Math.random() - 0.48) * 0.05; // 轻微上涨趋势
    const noise = 0.98 + Math.random() * 0.04; // 小幅波动
    const predictedPrice = currentPrice * Math.pow(trend, i) * noise;
    
    futurePrices.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(predictedPrice * 100) / 100
    });
  }
  
  return futurePrices;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId') || '495302338'; // 默认是 Sport Gloves | Pandora's Box
    
    // 使用真实爬虫获取数据
    const data = await fetchSteamDTRealData(itemId);
    const futureTrend = generateFutureTrend(data.currentPrice);
    
    // 保存到共享存储
    try {
      saveItem({
        itemId: itemId,
        name: data.name,
        hashname: data.name,
        currentPrice: data.currentPrice,
        change24h: data.change24h,
        volume24h: data.volume24h,
        wear: data.wear,
        prices: data.prices,
        lastUpdated: Date.now()
      });
      console.log(`[SteamDT API] Saved item data for ${itemId}, store size: ${getStoreSize()}`);
    } catch (saveError) {
      console.error('[SteamDT API] Failed to save item data:', saveError);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...data,
          futureTrend,
          itemId: itemId
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
