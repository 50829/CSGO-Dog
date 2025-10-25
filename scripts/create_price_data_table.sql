-- 删除旧表（如果存在问题）
DROP TABLE IF EXISTS price_data CASCADE;

-- 创建 price_data 表
CREATE TABLE price_data (
  id BIGSERIAL PRIMARY KEY,
  item_id TEXT NOT NULL,
  item_name TEXT,
  date TEXT NOT NULL,
  price DECIMAL(10, 2),
  predicted_price DECIMAL(10, 2),
  volume INTEGER,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_price_data_item_id ON price_data(item_id);
CREATE INDEX idx_price_data_timestamp ON price_data(timestamp);
CREATE INDEX idx_price_data_date ON price_data(date);

-- 启用行级安全
ALTER TABLE price_data ENABLE ROW LEVEL SECURITY;

-- 创建政策：允许所有人读取
CREATE POLICY "Allow public read access" ON price_data
  FOR SELECT USING (true);

-- 创建政策：允许所有人插入（实际生产环境应该限制）
CREATE POLICY "Allow public insert access" ON price_data
  FOR INSERT WITH CHECK (true);

-- 创建政策：允许所有人更新
CREATE POLICY "Allow public update access" ON price_data
  FOR UPDATE USING (true);

-- 创建政策：允许所有人删除
CREATE POLICY "Allow public delete access" ON price_data
  FOR DELETE USING (true);

-- 添加注释
COMMENT ON TABLE price_data IS 'CSGO饰品价格历史数据';
COMMENT ON COLUMN price_data.item_id IS '饰品ID（SteamDT API中的itemId）';
COMMENT ON COLUMN price_data.item_name IS '饰品名称';
COMMENT ON COLUMN price_data.date IS '日期时间（格式：YYYY-MM-DD HH:MM）';
COMMENT ON COLUMN price_data.price IS '实际价格（元）';
COMMENT ON COLUMN price_data.predicted_price IS '预测价格（元）';
COMMENT ON COLUMN price_data.volume IS '成交量';
COMMENT ON COLUMN price_data.timestamp IS '时间戳（毫秒）';
