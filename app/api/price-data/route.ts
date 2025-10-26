export const runtime = 'edge';

import { supabase } from '@/lib/supabase';

/**
 * 从 Supabase 获取物品的价格历史数据
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    
    if (!itemId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing itemId parameter'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[Price Data API] Fetching data for item ${itemId}`);

    // 从 Supabase 查询数据
    const { data, error, count } = await supabase
      .from('price_data')
      .select('*', { count: 'exact' })
      .eq('item_id', itemId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error(`[Price Data API] Supabase error:`, error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!data || data.length === 0) {
      console.log(`[Price Data API] No data found for item ${itemId}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No data found for this item'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[Price Data API] Found ${data.length} records for item ${itemId}`);

    // 转换数据格式
    const prices = data.map(record => ({
      date: record.date,
      price: parseFloat(record.price),
      volume: record.volume,
      timestamp: record.timestamp
    }));

    // 计算统计信息
    const currentPrice = prices[prices.length - 1]?.price || 0;
    const firstPrice = prices[0]?.price || currentPrice;
    const change24h = firstPrice !== 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;

    // 计算成交量
    const volume24h = prices.reduce((sum, p) => sum + (p.volume || 0), 0);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          name: data[0].item_name || 'Unknown Item',
          prices: prices,
          currentPrice: currentPrice,
          change24h: change24h,
          volume24h: volume24h,
          totalRecords: count,
          itemId: itemId
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
        },
      }
    );

  } catch (error) {
    console.error('[Price Data API] Error:', error);
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
