# 数据爬取和保存到 Supabase 指南

## 第一步：重建数据库表结构

当前的 `price_data` 表结构有问题，需要重建。

### 操作步骤：

1. 打开 Supabase 项目控制台：
   https://supabase.com/dashboard/project/kievythelumkdylqzewq

2. 点击左侧菜单的 "SQL Editor"

3. 创建新查询，复制 `scripts/create_price_data_table.sql` 的全部内容

4. 点击 "Run" 执行 SQL

5. 确认表创建成功（应该会看到成功消息）

## 第二步：运行爬虫脚本

表结构创建成功后，运行以下命令：

```powershell
cd "d:\00-All Files\1-项目-Project\31-csgodog\csgo-dog"
node scripts/fetch-and-save-to-supabase.js
```

## 脚本功能说明

### 爬取的物品：
- **495302338**: ★ Sport Gloves | Pandora's Box (Field-Tested)
- **24708**: AK-47 | Fire Serpent (Field-Tested)

### 数据来源：
- SteamDT API: `https://api.steamdt.com/user/steam/type-trend/v2/item/details`
- 数据类型：约30天的价格历史数据（每小时一个点）

### 数据字段：
- `item_id`: 物品ID
- `item_name`: 物品名称
- `date`: 日期时间 (格式: 2025-10-26 07:39)
- `price`: 价格（元）
- `volume`: 成交量
- `timestamp`: 时间戳（毫秒）

### 预期结果：
- 成功爬取约 700+ 条记录（每个物品）
- 总计约 1400+ 条价格历史数据
- 数据会自动保存到 Supabase 的 `price_data` 表

## 第三步：验证数据

在 Supabase 控制台的 Table Editor 中：
1. 选择 `price_data` 表
2. 查看数据是否已成功导入
3. 可以按 `item_id` 筛选查看不同物品的数据

## 故障排除

### 如果遇到 "Invalid API key" 错误：
- 检查 `.env.local` 文件中的 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 确保 API key 没有多余的引号

### 如果遇到 "Could not find column" 错误：
- 说明表结构不匹配
- 需要执行第一步重建表结构

### 如果遇到 "stack depth limit exceeded" 错误：
- 这是数据库触发器递归问题
- 重建表结构后应该解决

### 如果遇到 "row-level security policy" 错误：
- SQL脚本已经包含了 RLS 策略
- 如果还有问题，可以在 Supabase 控制台的 Authentication > Policies 中检查

## 查询示例

创建成功后，可以用以下 SQL 查询数据：

```sql
-- 查看所有物品的最新价格
SELECT DISTINCT ON (item_id) 
  item_id, 
  item_name, 
  price, 
  date 
FROM price_data 
ORDER BY item_id, timestamp DESC;

-- 查看某个物品的价格趋势
SELECT date, price, volume 
FROM price_data 
WHERE item_id = '495302338' 
ORDER BY timestamp ASC;

-- 统计数据量
SELECT item_id, item_name, COUNT(*) as record_count 
FROM price_data 
GROUP BY item_id, item_name;
```
