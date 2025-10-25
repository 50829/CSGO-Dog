# CS:GO 饰品市场数据接入指南

## 📊 数据源列表

本系统支持接入以下 CS:GO 饰品交易平台的数据:

### 1. BUFF (网易BUFF)
- **网站**: https://buff.163.com/
- **特点**: 国内最大的 CS:GO 饰品交易平台
- **数据类型**: 
  - 实时价格
  - 24小时交易量
  - 7日/30日价格趋势
  - 库存数量
  - 历史成交记录

**API 接入方式** (需要自行实现):
```typescript
// 示例: 获取商品列表
GET https://buff.163.com/api/market/goods
// 示例: 获取商品详情
GET https://buff.163.com/api/market/goods/{goods_id}
```

### 2. Steam 社区市场
- **网站**: https://steamcommunity.com/market/
- **特点**: 官方交易平台,价格权威
- **API**: Steam Web API

**接入方式**:
```typescript
// 获取物品价格概览
GET https://steamcommunity.com/market/priceoverview/
  ?appid=730
  &currency=23  // 23 = CNY
  &market_hash_name={item_name}
```

### 3. UU加速器市场
- **网站**: https://shop.uu.163.com/
- **特点**: 快速交易,价格稳定

### 4. C5GAME
- **网站**: https://www.c5game.com/
- **特点**: 老牌平台,交易量大

### 5. 悠悠有品
- **网站**: https://www.youpin898.com/
- **特点**: 支持多种支付方式

## 🔧 技术实现

### 方案一: 官方 API (推荐)

如果平台提供官方 API,直接调用:

```typescript
// lib/marketData.ts

async function fetchBuffData(): Promise<Partial<MarketItem>[]> {
  try {
    const response = await fetch('https://buff.163.com/api/market/goods', {
      headers: {
        'User-Agent': 'CSGO-Dog/1.0',
        // 可能需要登录 token
      }
    });
    
    const data = await response.json();
    
    return data.items.map(item => ({
      name: item.name,
      nameEn: item.market_hash_name,
      prices: [{
        platform: 'BUFF',
        price: item.sell_min_price,
        currency: 'CNY',
        stock: item.sell_num,
        url: `https://buff.163.com/goods/${item.id}`
      }],
      volume24h: item.sell_reference_price,
      trend7d: calculateTrend(item.price_history),
    }));
  } catch (error) {
    console.error('BUFF API 调用失败:', error);
    return [];
  }
}
```

### 方案二: 网页爬虫

如果没有官方 API,使用爬虫:

#### 2.1 使用 Puppeteer (浏览器自动化)

```typescript
import puppeteer from 'puppeteer';

async function scrapeBuffData() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://buff.163.com/market/csgo');
  
  // 等待内容加载
  await page.waitForSelector('.market-list');
  
  // 提取数据
  const items = await page.evaluate(() => {
    const itemElements = document.querySelectorAll('.market-item');
    return Array.from(itemElements).map(el => ({
      name: el.querySelector('.name')?.textContent,
      price: el.querySelector('.price')?.textContent,
      // ... 其他字段
    }));
  });
  
  await browser.close();
  return items;
}
```

#### 2.2 使用 Cheerio (HTML 解析)

```bash
npm install cheerio axios
```

```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrapeWithCheerio(url: string) {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  
  const items = [];
  $('.market-item').each((i, el) => {
    items.push({
      name: $(el).find('.name').text(),
      price: parseFloat($(el).find('.price').text()),
    });
  });
  
  return items;
}
```

### 方案三: 第三方数据服务

使用现成的数据聚合服务:

- **CSGOFloat**: https://csgofloat.com/
- **CSGOStash**: https://csgostash.com/
- **SteamAPI.io**: https://steamapis.com/

## 📝 数据结构标准化

所有平台数据需要转换为统一格式:

```typescript
interface MarketItem {
  name: string;              // 中文名称
  nameEn: string;            // 英文名称 (Steam Market Hash Name)
  prices: ItemPrice[];       // 各平台价格
  lowestPrice: number;       // 最低价
  highestPrice: number;      // 最高价
  avgPrice: number;          // 平均价
  priceSpread: number;       // 价差百分比
  volume24h?: number;        // 24小时交易量
  trend7d?: number;          // 7日涨跌幅 (%)
  trend30d?: number;         // 30日涨跌幅 (%)
  rarity?: string;           // 稀有度
  wear?: string;             // 磨损度
  category?: string;         // 类别
}

interface ItemPrice {
  platform: string;          // 平台名称
  price: number;             // 价格 (CNY)
  currency: string;          // 货币单位
  stock: number;             // 库存
  url: string;               // 商品链接
}
```

## 🚀 快速开始

### 1. 修改 `lib/marketData.ts`

取消注释并实现真实数据获取函数:

```typescript
async function fetchBuffData(): Promise<Partial<MarketItem>[]> {
  // TODO: 实现 BUFF 数据获取
  const response = await fetch('YOUR_API_ENDPOINT');
  const data = await response.json();
  return transformBuffData(data);
}

async function fetchSteamData(): Promise<Partial<MarketItem>[]> {
  // TODO: 实现 Steam 数据获取
  return [];
}
```

### 2. 替换模拟数据

在 `app/api/ai-assistant/route.ts` 中:

```typescript
// 开发阶段
const marketData = generateMockMarketData();

// 生产环境 (实现数据获取后)
const marketData = await aggregateMarketData();
```

### 3. 配置数据更新频率

```typescript
// lib/marketData.ts

// 缓存数据,避免频繁请求
let cachedData: MarketData | null = null;
let lastUpdate: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

export async function aggregateMarketData(): Promise<MarketData> {
  const now = Date.now();
  
  if (cachedData && now - lastUpdate < CACHE_DURATION) {
    return cachedData;
  }
  
  // 获取新数据
  const data = await fetchAllPlatformsData();
  cachedData = data;
  lastUpdate = now;
  
  return data;
}
```

## ⚠️ 注意事项

### 1. 法律合规
- ✅ 尊重平台的 robots.txt
- ✅ 遵守 API 使用条款
- ✅ 合理控制请求频率
- ❌ 不要进行恶意爬虫
- ❌ 不要绕过反爬虫机制

### 2. 性能优化
- 使用缓存减少 API 调用
- 并行获取多个平台数据
- 设置合理的超时时间
- 错误重试机制

```typescript
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, { 
        timeout: 5000 
      });
      return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 3. 数据质量
- 验证数据完整性
- 过滤异常值
- 处理缺失数据
- 记录数据来源和时间戳

```typescript
function validateMarketItem(item: Partial<MarketItem>): boolean {
  return !!(
    item.name &&
    item.prices &&
    item.prices.length > 0 &&
    item.prices.every(p => p.price > 0)
  );
}
```

### 4. 反爬虫应对
- 使用代理 IP 池
- 模拟真实浏览器请求
- 设置合理的 User-Agent
- 添加随机延迟

```typescript
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  // ... 更多
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}
```

## 🧪 测试

### 单元测试

```typescript
// lib/marketData.test.ts
import { aggregateMarketData } from './marketData';

describe('Market Data', () => {
  it('should fetch and aggregate data', async () => {
    const data = await aggregateMarketData();
    expect(data.hotItems.length).toBeGreaterThan(0);
    expect(data.timestamp).toBeDefined();
  });
  
  it('should calculate price spread correctly', async () => {
    const data = await aggregateMarketData();
    data.hotItems.forEach(item => {
      const calculated = ((item.highestPrice - item.lowestPrice) / item.lowestPrice) * 100;
      expect(item.priceSpread).toBeCloseTo(calculated, 2);
    });
  });
});
```

### 手动测试

```typescript
// test/manual-test.ts
import { aggregateMarketData } from '../lib/marketData';

async function test() {
  console.log('开始获取市场数据...');
  const data = await aggregateMarketData();
  
  console.log(`热门饰品数量: ${data.hotItems.length}`);
  console.log(`搬砖机会: ${data.priceGaps.length}`);
  console.log(`市场趋势: ${data.marketTrends.overallTrend}`);
  console.log(`更新时间: ${data.timestamp}`);
  
  console.log('\n热门饰品 TOP 5:');
  data.hotItems.slice(0, 5).forEach((item, i) => {
    console.log(`${i + 1}. ${item.name} - ¥${item.lowestPrice}`);
  });
}

test().catch(console.error);
```

运行测试:
```bash
npx tsx test/manual-test.ts
```

## 📈 监控和日志

### 1. 数据质量监控

```typescript
function logDataQuality(data: MarketData) {
  const stats = {
    totalItems: data.hotItems.length,
    itemsWithFullData: data.hotItems.filter(i => i.volume24h && i.trend7d).length,
    avgPriceSpread: data.hotItems.reduce((sum, i) => sum + i.priceSpread, 0) / data.hotItems.length,
    opportunities: data.priceGaps.length,
  };
  
  console.log('数据质量报告:', stats);
}
```

### 2. API 调用监控

```typescript
let apiCallCount = 0;
let apiErrorCount = 0;

async function monitoredFetch(url: string) {
  apiCallCount++;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      apiErrorCount++;
      console.error(`API 错误: ${url} - ${response.status}`);
    }
    return response;
  } catch (error) {
    apiErrorCount++;
    console.error(`网络错误: ${url}`, error);
    throw error;
  }
}

// 每小时报告
setInterval(() => {
  console.log(`API 调用统计: 总数 ${apiCallCount}, 错误 ${apiErrorCount}`);
}, 60 * 60 * 1000);
```

## 🔄 持续优化

### 1. 增量更新
只更新变化的数据,而不是全量刷新:

```typescript
async function incrementalUpdate(lastData: MarketData) {
  const newPrices = await fetchLatestPrices(lastData.hotItems.map(i => i.name));
  
  return {
    ...lastData,
    hotItems: lastData.hotItems.map((item, i) => ({
      ...item,
      prices: newPrices[i],
    })),
    timestamp: new Date().toISOString(),
  };
}
```

### 2. 并行优化
使用 Promise.allSettled 确保部分失败不影响整体:

```typescript
const results = await Promise.allSettled([
  fetchBuffData(),
  fetchSteamData(),
  fetchUUData(),
  fetchC5GameData(),
]);

const successfulData = results
  .filter(r => r.status === 'fulfilled')
  .map(r => (r as PromiseFulfilledResult<any>).value);
```

## 📚 参考资源

- [Steam Web API 文档](https://steamcommunity.com/dev)
- [Puppeteer 文档](https://pptr.dev/)
- [Cheerio 文档](https://cheerio.js.org/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

**当前状态**: 使用模拟数据 (`generateMockMarketData`)  
**下一步**: 实现真实数据获取函数  
**优先级**: 高 (直接影响 AI 建议质量)
