import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kievythelumkdylqzewq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库表结构
export interface PriceData {
  id?: number;
  item_id: string;
  date: string;
  price: number | null;
  predicted_price: number | null;
  volume: number | null;
  timestamp: number;
  created_at?: string;
}

export interface HotItem {
  id?: number;
  item_id: string;
  name: string;
  en_name: string;
  price: number;
  price_rate: number;
  transaction_count: number;
  icon: string;
  created_at?: string;
  updated_at?: string;
}
