import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    
    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'itemId parameter required' },
        { status: 400 }
      );
    }

    // 从Supabase查询价格数据
    const { data, error } = await supabase
      .from('price_data')
      .select('date, price, predicted_price, volume')
      .eq('item_id', itemId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 如果没有数据，返回空数组
    if (!data || data.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No data found for this item' 
      }, { status: 404 });
    }

    // 转换数据格式以匹配前端期望
    const formattedData = data.map(row => ({
      date: row.date,
      price: row.price,
      predictedPrice: row.predicted_price,
      volume: row.volume
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error loading price data:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
