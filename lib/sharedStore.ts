// 共享数据存储 - 在 Edge Runtime 中所有 API 路由共享同一个实例
// 注意：这是内存存储，服务器重启后数据会丢失
// 生产环境应该使用 Redis 或数据库

export interface StoredItemData {
  itemId: string;
  name: string;
  hashname: string;
  currentPrice: number;
  change24h: number;
  volume24h: number;
  wear?: number;
  prices: { date: string; price: number; volume?: number; timestamp?: number }[];
  lastUpdated: number;
}

// 使用全局变量确保跨模块共享
declare global {
  var __sharedItemStore: Map<string, StoredItemData> | undefined;
}

// 创建或获取全局存储实例
export const itemStore = globalThis.__sharedItemStore ?? new Map<string, StoredItemData>();

// 确保全局引用被设置
if (!globalThis.__sharedItemStore) {
  globalThis.__sharedItemStore = itemStore;
  console.log('[SharedStore] Initialized new global item store');
} else {
  console.log('[SharedStore] Reusing existing global item store, size:', itemStore.size);
}

// 导出操作函数
export function saveItem(data: StoredItemData): void {
  itemStore.set(data.itemId, data);
  console.log(`[SharedStore] Saved item ${data.itemId}, total items: ${itemStore.size}`);
}

export function getItem(itemId: string): StoredItemData | undefined {
  const item = itemStore.get(itemId);
  console.log(`[SharedStore] Get item ${itemId}:`, item ? 'FOUND' : 'NOT FOUND');
  return item;
}

export function getAllItems(): StoredItemData[] {
  return Array.from(itemStore.values());
}

export function hasItem(itemId: string): boolean {
  return itemStore.has(itemId);
}

export function getStoreSize(): number {
  return itemStore.size;
}

export function getStoreKeys(): string[] {
  return Array.from(itemStore.keys());
}
