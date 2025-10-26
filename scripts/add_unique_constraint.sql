-- 为 price_data 表添加唯一约束，防止重复数据
-- 组合键：item_id + timestamp 必须唯一

-- 先删除可能存在的重复数据（保留最早插入的记录）
DELETE FROM price_data a USING (
  SELECT MIN(id) as id, item_id, timestamp
  FROM price_data 
  GROUP BY item_id, timestamp
  HAVING COUNT(*) > 1
) b
WHERE a.item_id = b.item_id 
  AND a.timestamp = b.timestamp 
  AND a.id <> b.id;

-- 添加唯一约束
ALTER TABLE price_data 
ADD CONSTRAINT price_data_item_timestamp_unique 
UNIQUE (item_id, timestamp);

-- 查看约束是否创建成功
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'price_data'::regclass;
