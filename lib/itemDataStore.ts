// 饰品数据存储（内存存储，重启后清空）
// 在生产环境中应该使用数据库

interface ItemPriceData {
  date: string;
  price: number;
  volume?: number;
  timestamp?: number;
}

interface StoredItemData {
  itemId: string;
  name: string;
  hashname: string;
  currentPrice: number;
  change24h: number;
  volume24h: number;
  wear?: number;
  prices: ItemPriceData[];
  lastUpdated: number;
}

// 内存存储
const itemDataStore = new Map<string, StoredItemData>();

// 保存饰品数据
export function saveItemData(itemId: string, data: Omit<StoredItemData, 'itemId' | 'lastUpdated'>): void {
  itemDataStore.set(itemId, {
    itemId,
    ...data,
    lastUpdated: Date.now()
  });
}

// 获取饰品数据
export function getItemData(itemId: string): StoredItemData | null {
  return itemDataStore.get(itemId) || null;
}

// 获取所有饰品数据
export function getAllItemsData(): StoredItemData[] {
  return Array.from(itemDataStore.values());
}

// 检查数据是否过期（默认1小时）
export function isDataStale(itemId: string, maxAgeMs: number = 60 * 60 * 1000): boolean {
  const data = itemDataStore.get(itemId);
  if (!data) return true;
  return Date.now() - data.lastUpdated > maxAgeMs;
}

// 清除过期数据
export function clearStaleData(maxAgeMs: number = 60 * 60 * 1000): void {
  const now = Date.now();
  for (const [key, value] of itemDataStore.entries()) {
    if (now - value.lastUpdated > maxAgeMs) {
      itemDataStore.delete(key);
    }
  }
}
