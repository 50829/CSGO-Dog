/**
 * CS:GO 饰品市场数据服务
 * 整合多个平台的实时数据
 */

export interface ItemPrice {
  platform: string;
  price: number;
  currency: string;
  stock: number;
  url: string;
}

export interface MarketItem {
  name: string;
  nameEn: string;
  prices: ItemPrice[];
  lowestPrice: number;
  highestPrice: number;
  avgPrice: number;
  priceSpread: number;  // 价差百分比
  volume24h?: number;    // 24小时交易量
  trend7d?: number;      // 7日趋势 (百分比)
  trend30d?: number;     // 30日趋势
  rarity?: string;       // 稀有度
  wear?: string;         // 磨损度
  category?: string;     // 类别 (武器/刀具/手套等)
}

export interface MarketData {
  hotItems: MarketItem[];
  priceGaps: Array<{
    item: string;
    buyPlatform: string;
    sellPlatform: string;
    profit: number;
    profitPercent: number;
  }>;
  marketTrends: {
    overallTrend: 'up' | 'down' | 'stable';
    hotCategories: string[];
    risingItems: string[];
    fallingItems: string[];
  };
  timestamp: string;
}

/**
 * BUFF 平台数据 (示例 - 实际需要爬虫或官方API)
 */
async function fetchBuffData(): Promise<Partial<MarketItem>[]> {
  // 实际应该调用 BUFF API 或使用爬虫
  // 这里返回模拟数据结构
  return [
    {
      name: 'AK-47 | 二西莫夫 (略有磨损)',
      nameEn: 'AK-47 | Asiimov (Field-Tested)',
      prices: [{
        platform: 'BUFF',
        price: 1280,
        currency: 'CNY',
        stock: 156,
        url: 'https://buff.163.com/goods/...'
      }],
      volume24h: 45,
      trend7d: 2.3,
      trend30d: 8.5,
      rarity: '隐秘',
      wear: '略有磨损',
      category: '步枪'
    }
  ];
}

/**
 * Steam 市场数据
 */
async function fetchSteamData(): Promise<Partial<MarketItem>[]> {
  // Steam Community Market API
  // https://steamcommunity.com/market/priceoverview/
  return [];
}

/**
 * UU加速器市场数据
 */
async function fetchUUData(): Promise<Partial<MarketItem>[]> {
  return [];
}

/**
 * C5GAME 数据
 */
async function fetchC5GameData(): Promise<Partial<MarketItem>[]> {
  return [];
}

/**
 * 悠悠有品数据
 */
async function fetchYouyouData(): Promise<Partial<MarketItem>[]> {
  return [];
}

/**
 * 整合所有平台数据
 */
export async function aggregateMarketData(): Promise<MarketData> {
  try {
    // 并行获取所有平台数据
    const [buffData, steamData, uuData, c5Data, youyouData] = await Promise.all([
      fetchBuffData().catch(() => []),
      fetchSteamData().catch(() => []),
      fetchUUData().catch(() => []),
      fetchC5GameData().catch(() => []),
      fetchYouyouData().catch(() => [])
    ]);

    // 合并同一饰品的不同平台价格
    const itemsMap = new Map<string, MarketItem>();

    // 处理 BUFF 数据
    buffData.forEach(item => {
      if (!item.name) return;
      itemsMap.set(item.name, {
        name: item.name,
        nameEn: item.nameEn || '',
        prices: item.prices || [],
        lowestPrice: item.prices?.[0]?.price || 0,
        highestPrice: item.prices?.[0]?.price || 0,
        avgPrice: item.prices?.[0]?.price || 0,
        priceSpread: 0,
        volume24h: item.volume24h,
        trend7d: item.trend7d,
        trend30d: item.trend30d,
        rarity: item.rarity,
        wear: item.wear,
        category: item.category
      });
    });

    // 添加其他平台数据到相同饰品
    [steamData, uuData, c5Data, youyouData].forEach(platformData => {
      platformData.forEach(item => {
        if (!item.name || !item.prices) return;
        const existing = itemsMap.get(item.name);
        if (existing) {
          existing.prices.push(...item.prices);
          // 重新计算价格范围
          const allPrices = existing.prices.map(p => p.price);
          existing.lowestPrice = Math.min(...allPrices);
          existing.highestPrice = Math.max(...allPrices);
          existing.avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
          existing.priceSpread = ((existing.highestPrice - existing.lowestPrice) / existing.lowestPrice) * 100;
        }
      });
    });

    const hotItems = Array.from(itemsMap.values());

    // 计算搬砖机会 (价差 > 5%)
    const priceGaps = hotItems
      .filter(item => item.priceSpread > 5)
      .map(item => {
        const sortedPrices = [...item.prices].sort((a, b) => a.price - b.price);
        return {
          item: item.name,
          buyPlatform: sortedPrices[0].platform,
          sellPlatform: sortedPrices[sortedPrices.length - 1].platform,
          profit: sortedPrices[sortedPrices.length - 1].price - sortedPrices[0].price,
          profitPercent: item.priceSpread
        };
      })
      .sort((a, b) => b.profitPercent - a.profitPercent)
      .slice(0, 10);

    // 分析市场趋势
    const risingItems = hotItems
      .filter(item => (item.trend7d || 0) > 3)
      .map(item => item.name)
      .slice(0, 5);

    const fallingItems = hotItems
      .filter(item => (item.trend7d || 0) < -3)
      .map(item => item.name)
      .slice(0, 5);

    const avgTrend = hotItems.reduce((sum, item) => sum + (item.trend7d || 0), 0) / hotItems.length;
    const overallTrend = avgTrend > 2 ? 'up' : avgTrend < -2 ? 'down' : 'stable';

    // 统计热门类别
    const categoryCount = new Map<string, number>();
    hotItems.forEach(item => {
      if (item.category) {
        categoryCount.set(item.category, (categoryCount.get(item.category) || 0) + 1);
      }
    });
    const hotCategories = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);

    return {
      hotItems,
      priceGaps,
      marketTrends: {
        overallTrend,
        hotCategories,
        risingItems,
        fallingItems
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('聚合市场数据失败:', error);
    throw error;
  }
}

/**
 * 获取特定饰品的详细信息
 */
export async function getItemDetails(itemName: string): Promise<MarketItem | null> {
  const data = await aggregateMarketData();
  return data.hotItems.find(item => item.name === itemName) || null;
}

/**
 * 获取投资建议所需的市场上下文
 */
export async function getMarketContext() {
  const data = await aggregateMarketData();
  
  return {
    summary: `当前市场${data.marketTrends.overallTrend === 'up' ? '整体上涨' : data.marketTrends.overallTrend === 'down' ? '整体下跌' : '相对稳定'}`,
    hotItems: data.hotItems.slice(0, 10).map(item => ({
      name: item.name,
      price: item.lowestPrice,
      trend7d: item.trend7d,
      volume: item.volume24h
    })),
    opportunities: data.priceGaps.slice(0, 5),
    trends: data.marketTrends,
    lastUpdate: data.timestamp
  };
}

/**
 * 模拟数据生成器 (开发阶段使用)
 */
export function generateMockMarketData(): MarketData {
  const items = [
    { name: 'AK-47 | 二西莫夫 (略有磨损)', category: '步枪', basePrice: 1280, trend: 2.3 },
    { name: 'M4A4 | 龙王 (崭新出厂)', category: '步枪', basePrice: 3200, trend: 5.8 },
    { name: 'AWP | 二西莫夫 (久经沙场)', category: '狙击枪', basePrice: 850, trend: -1.2 },
    { name: '蝴蝶刀 | 渐变大理石 (崭新出厂)', category: '刀具', basePrice: 8500, trend: 12.5 },
    { name: '运动手套 | 副总裁 (略有磨损)', category: '手套', basePrice: 5600, trend: 8.2 },
    { name: 'USP-S | 杀戮确认 (略有磨损)', category: '手枪', basePrice: 180, trend: -0.5 },
    { name: 'Glock-18 | 水元素 (崭新出厂)', category: '手枪', basePrice: 95, trend: 1.8 },
    { name: '蝴蝶刀 | 多普勒 (崭新出厂)', category: '刀具', basePrice: 12000, trend: 15.3 },
  ];

  const platforms = ['BUFF', 'Steam', 'UU', 'C5GAME', '悠悠有品'];
  
  const hotItems: MarketItem[] = items.map(item => {
    const prices: ItemPrice[] = platforms.map(platform => {
      const variance = 0.95 + Math.random() * 0.1; // ±5% 价格差异
      return {
        platform,
        price: Math.round(item.basePrice * variance),
        currency: 'CNY',
        stock: Math.floor(Math.random() * 200) + 10,
        url: `https://${platform.toLowerCase()}.com/item/${encodeURIComponent(item.name)}`
      };
    });

    const allPrices = prices.map(p => p.price);
    const lowestPrice = Math.min(...allPrices);
    const highestPrice = Math.max(...allPrices);

    return {
      name: item.name,
      nameEn: item.name,
      prices,
      lowestPrice,
      highestPrice,
      avgPrice: Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length),
      priceSpread: ((highestPrice - lowestPrice) / lowestPrice) * 100,
      volume24h: Math.floor(Math.random() * 100) + 20,
      trend7d: item.trend,
      trend30d: item.trend * 2.5,
      category: item.category,
      rarity: '隐秘',
      wear: '略有磨损'
    };
  });

  const priceGaps = hotItems
    .filter(item => item.priceSpread > 3)
    .map(item => {
      const sortedPrices = [...item.prices].sort((a, b) => a.price - b.price);
      return {
        item: item.name,
        buyPlatform: sortedPrices[0].platform,
        sellPlatform: sortedPrices[sortedPrices.length - 1].platform,
        profit: sortedPrices[sortedPrices.length - 1].price - sortedPrices[0].price,
        profitPercent: item.priceSpread
      };
    })
    .sort((a, b) => b.profitPercent - a.profitPercent)
    .slice(0, 5);

  return {
    hotItems,
    priceGaps,
    marketTrends: {
      overallTrend: 'up',
      hotCategories: ['刀具', '手套', '步枪'],
      risingItems: ['蝴蝶刀 | 多普勒 (崭新出厂)', '运动手套 | 副总裁 (略有磨损)', 'M4A4 | 龙王 (崭新出厂)'],
      fallingItems: ['AWP | 二西莫夫 (久经沙场)', 'USP-S | 杀戮确认 (略有磨损)']
    },
    timestamp: new Date().toISOString()
  };
}
