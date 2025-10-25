/**
 * 爬取指定物品的价格数据并保存到 Supabase
 * 使用现有的 SteamDT API 接口
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kievythelumkdylqzewq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZXZ5dGhlbHVta2R5bHF6ZXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjA5NzgsImV4cCI6MjA3Njk5Njk3OH0.RuHgZfC9YAg8PvA4bC5GvMUoGbKml7gOgvj8l9xK8eE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 要爬取的物品ID列表
const ITEM_IDS = ['495302338', '24708'];

// 物品名称映射
const ITEM_NAMES = {
  '495302338': '★ Sport Gloves | Pandora\'s Box (Field-Tested)',
  '24708': 'AK-47 | Fire Serpent (Field-Tested)'  // 假设这是火蛇AK
};

/**
 * 从 SteamDT API 获取数据
 */
async function fetchSteamDTData(itemId) {
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
    console.log(`\n🔍 正在获取物品 ${itemId} 的数据...`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://steamdt.com',
        'Referer': 'https://steamdt.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !result.data || result.data.length === 0) {
      throw new Error('API 返回数据无效');
    }

    console.log(`✅ 成功获取 ${result.data.length} 条价格数据`);
    return result.data;

  } catch (error) {
    console.error(`❌ 获取数据失败:`, error.message);
    throw error;
  }
}

/**
 * 格式化时间戳为日期时间字符串
 */
function formatTimestamp(timestamp) {
  const date = new Date(parseInt(timestamp) * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * 检查数据库中已存在的时间戳
 */
async function getExistingTimestamps(itemId) {
  const { data, error } = await supabase
    .from('price_data')
    .select('timestamp')
    .eq('item_id', itemId);
  
  if (error) {
    console.error('❌ 获取已存在数据失败:', error.message);
    return new Set();
  }
  
  return new Set(data.map(record => record.timestamp));
}

/**
 * 保存价格数据到 Supabase（带去重功能）
 */
async function savePriceDataToSupabase(itemId, rawData) {
  console.log(`\n💾 正在保存物品 ${itemId} 的数据到 Supabase...`);
  
  // 1. 获取数据库中已存在的时间戳
  console.log('🔍 检查已存在的数据...');
  const existingTimestamps = await getExistingTimestamps(itemId);
  console.log(`📊 数据库中已有 ${existingTimestamps.size} 条记录`);
  
  // 2. 转换数据格式并过滤重复数据
  const allRecords = rawData.map(item => {
    const timestamp = parseInt(item[0]);
    const price = Math.round(item[1] * 100) / 100;
    const volume = item[2] || 0;
    
    return {
      item_id: itemId,
      item_name: ITEM_NAMES[itemId],
      date: formatTimestamp(item[0]),
      price: price,
      predicted_price: null,
      volume: volume,
      timestamp: timestamp * 1000 // 转换为毫秒
    };
  });
  
  // 3. 过滤出新数据
  const priceRecords = allRecords.filter(record => !existingTimestamps.has(record.timestamp));
  
  console.log(`📦 总数据: ${allRecords.length} 条`);
  console.log(`🆕 新数据: ${priceRecords.length} 条`);
  console.log(`⏭️  跳过重复: ${allRecords.length - priceRecords.length} 条`);
  
  if (priceRecords.length === 0) {
    console.log('✅ 所有数据都已存在，无需插入');
    return { success: 0, failed: 0, skipped: allRecords.length };
  }

  console.log(`📊 准备插入 ${priceRecords.length} 条记录`);
  console.log(`📅 时间范围: ${priceRecords[0].date} ~ ${priceRecords[priceRecords.length - 1].date}`);
  console.log(`💰 价格范围: ¥${Math.min(...priceRecords.map(r => r.price))} ~ ¥${Math.max(...priceRecords.map(r => r.price))}`);

  try {
    // 分批插入数据（每批1000条，避免超时）
    const batchSize = 1000;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < priceRecords.length; i += batchSize) {
      const batch = priceRecords.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('price_data')
        .insert(batch);

      if (error) {
        console.error(`❌ 批次 ${Math.floor(i / batchSize) + 1} 插入失败:`, error.message);
        errorCount += batch.length;
        
        // 如果是触发器错误，停止执行
        if (error.code === '54001') {
          console.error('\n⚠️  检测到数据库触发器递归错误！');
          console.error('请检查 price_data 表的触发器配置。');
          throw error;
        }
      } else {
        successCount += batch.length;
        console.log(`✅ 批次 ${Math.floor(i / batchSize) + 1} 插入成功 (${batch.length} 条)`);
      }
    }

    console.log(`\n📊 数据保存完成:`);
    console.log(`   ✅ 成功: ${successCount} 条`);
    console.log(`   ❌ 失败: ${errorCount} 条`);

    return { success: successCount, failed: errorCount, skipped: allRecords.length - priceRecords.length };

  } catch (error) {
    console.error(`❌ 保存数据失败:`, error.message);
    throw error;
  }
}

/**
 * 验证数据是否保存成功
 */
async function verifyData(itemId) {
  console.log(`\n🔍 验证物品 ${itemId} 的数据...`);
  
  const { data, error, count } = await supabase
    .from('price_data')
    .select('*', { count: 'exact' })
    .eq('item_id', itemId)
    .order('timestamp', { ascending: false })
    .limit(5);

  if (error) {
    console.error(`❌ 验证失败:`, error.message);
    return;
  }

  console.log(`✅ 数据库中共有 ${count} 条记录`);
  if (data && data.length > 0) {
    console.log(`📋 最新的 5 条记录:`);
    data.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.date} - ¥${record.price} (成交量: ${record.volume || 0})`);
    });
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始爬取并保存数据到 Supabase...\n');
  console.log(`📦 要爬取的物品: ${ITEM_IDS.join(', ')}`);
  
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (const itemId of ITEM_IDS) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🎯 处理物品: ${itemId} (${ITEM_NAMES[itemId] || '未知物品'})`);
      console.log('='.repeat(60));

      // 1. 获取数据
      const rawData = await fetchSteamDTData(itemId);

      // 2. 保存到 Supabase（自动去重）
      const result = await savePriceDataToSupabase(itemId, rawData);
      totalSuccess += result.success;
      totalFailed += result.failed;
      totalSkipped += result.skipped || 0;

      // 3. 验证数据
      await verifyData(itemId);

      // 延迟一下，避免请求过快
      if (ITEM_IDS.indexOf(itemId) < ITEM_IDS.length - 1) {
        console.log('\n⏳ 等待 2 秒后继续...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.error(`\n❌ 处理物品 ${itemId} 时出错:`, error.message);
      console.error('跳过该物品，继续处理下一个...');
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('🎉 所有物品处理完成！');
  console.log('='.repeat(60));
  console.log(`📊 总计:`);
  console.log(`   ✅ 成功保存: ${totalSuccess} 条记录`);
  console.log(`   ⏭️  跳过重复: ${totalSkipped} 条记录`);
  console.log(`   ❌ 失败: ${totalFailed} 条记录`);
  console.log('='.repeat(60));
}

// 运行脚本
main().catch(error => {
  console.error('\n💥 脚本执行失败:', error);
  process.exit(1);
});
