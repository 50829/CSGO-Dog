import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { itemId, priceData } = await request.json();
    
    if (!itemId || !priceData) {
      return NextResponse.json(
        { success: false, error: 'Missing itemId or priceData' },
        { status: 400 }
      );
    }

    // 转换数据格式以匹配数据库schema
    const dataToInsert = priceData.map((row: any) => ({
      item_id: itemId,
      date: row.date,
      price: row.price || 0,
      predicted_price: row.predictedPrice || null,
      volume: row.volume || null,
      timestamp: new Date(row.date).getTime()
    }));

    // 批量插入到Supabase
    const { data, error } = await supabase
      .from('price_data')
      .insert(dataToInsert);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Saved ${priceData.length} records to Supabase`
    });
  } catch (error) {
    console.error('Error saving price data:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
