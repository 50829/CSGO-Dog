export const runtime = 'edge';

// 导入共享存储
import { getItem, getAllItems, saveItem as saveItemToStore, hasItem, getStoreSize, getStoreKeys, type StoredItemData } from '@/lib/sharedStore';

// GET: 获取所有饰品数据
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    // 如果指定了 itemId，返回单个饰品数据
    if (itemId) {
      console.log(`[Items API] Fetching itemId: ${itemId}, store size: ${getStoreSize()}`);
      console.log(`[Items API] Store keys:`, getStoreKeys());
      
      const data = getItem(itemId);
      if (!data) {
        console.log(`[Items API] Item ${itemId} not found in store`);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Item not found',
            storeSize: getStoreSize(),
            availableKeys: getStoreKeys()
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      console.log(`[Items API] Found item ${itemId}, prices count:`, data.prices?.length || 0);
      
      return new Response(
        JSON.stringify({
          success: true,
          data: data
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 返回所有饰品数据
    const allItems = getAllItems();
    
    return new Response(
      JSON.stringify({
        success: true,
        data: allItems,
        count: allItems.length
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// POST: 保存饰品数据
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemId, name, hashname, currentPrice, change24h, volume24h, wear, prices } = body;

    if (!itemId || !name) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'itemId and name are required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const itemData: StoredItemData = {
      itemId,
      name,
      hashname: hashname || name,
      currentPrice: currentPrice || 0,
      change24h: change24h || 0,
      volume24h: volume24h || 0,
      wear,
      prices: prices || [],
      lastUpdated: Date.now()
    };

    saveItemToStore(itemData);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Item data saved',
        data: itemData
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
