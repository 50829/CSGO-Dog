"use client";
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Search, ChevronDown, TrendingUp, TrendingDown, Bot, Send, DollarSign, Brain, BarChart, Users, Flame } from 'lucide-react';
import { encode, decode } from 'js-base64';

// --- 配色方案 ---
const colors = {
  bg0: '#000000',
  bg1: '#121212',
  bg1Hover: '#191919',
  down: '#CA3F64',
  up: '#bcff2f', // 荧光绿
  textPrimary: '#E5E7EB',
  textSecondary: '#9CA3AF',
  border: 'rgba(255, 255, 255, 0.1)',
  blue: '#bcff2f', // 预测线颜色，与 up 相同
};

// --- 模拟数据 ---

// 为每个饰品和平台生成唯一的价格数据
const generatePriceData = (basePrice: number, seed: number, platform: string) => {
  let data = [];
  let price = basePrice;
  
  // 不同平台的价格差异系数
  const platformMultiplier = {
    'BUFF': 0.95,
    'Steam': 1.0,
    'UU': 0.98,
    'C5GAME': 0.96,
  }[platform] || 1.0;
  
  price = price * platformMultiplier;
  const fluctuation = price / 10;
  const predFluctuation = price / 12;
  
  // 使用 seed 来生成确定性的随机数
  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  let predictedPrice = price;
  
  for (let i = 0; i < 30; i++) {
    const day = i + 1;
    const date = `2025-10-${day.toString().padStart(2, '0')}`;
    
    const randomValue = seededRandom(seed + i * 137);
    price += (randomValue - 0.45) * fluctuation;
    if (price < basePrice * platformMultiplier / 2) price = basePrice * platformMultiplier / 2;
    
    // 历史数据（前23天）
    if (i < 23) {
      data.push({ 
        date, 
        price: parseFloat(price.toFixed(2)), 
        predictedPrice: null 
      });
    } else if (i === 23) {
      predictedPrice = price;
      data.push({ 
        date, 
        price: parseFloat(price.toFixed(2)), 
        predictedPrice: parseFloat(predictedPrice.toFixed(2)) 
      });
    } else {
      // 预测数据（后7天）- 有可能上涨或下跌
      const predRandom = seededRandom(seed + i * 173);
      predictedPrice += (predRandom - 0.4) * predFluctuation;
      if (predictedPrice < basePrice * platformMultiplier / 1.8) {
        predictedPrice = basePrice * platformMultiplier / 1.8;
      }
      data.push({ 
        date, 
        price: null, 
        predictedPrice: parseFloat(predictedPrice.toFixed(2)) 
      });
    }
  }
  return data;
};

// 生成迷你图数据（与主图表数据一致）
const generateMiniChartData = (fullData: any[]) => {
  // 只取历史数据的价格
  return fullData
    .filter(d => d.price !== null)
    .map(d => d.price);
};

// 热门饰品模拟数据
const hotItems = [
  { id: 1, name: 'AK-47 | 火神 (崭新出厂)', hashname: 'AK-47 | Vulcan (Factory New)', price: 5699.00, change: 2.5, cap: '1.2M', seed: 24281 },
  { id: 2, name: 'AWP | 巨龙传说 (久经沙场)', hashname: 'AWP | Dragon Lore (Field-Tested)', price: 48999.00, change: 40.0, cap: '850K', seed: 24483 },
  { id: 3, name: 'M4A4 | 咆哮 (略有磨损)', hashname: 'M4A4 | Howl (Minimal Wear)', price: 40333.00, change: 0.00, cap: '700K', seed: 25910 },
  { id: 4, name: '蝴蝶刀（★） | 渐变大理石 (崭新出厂)', hashname: '★ Butterfly Knife | Marble Fade (Factory New)', price: 7666.00, change: 40.6, cap: '2.1M', seed: 553390497 },
  { id: 5, name: 'M4A4 | 合纵 (崭新出厂)', hashname: 'M4A4 | The Coalition (Factory New)', price: 14534.06, change: 45.89, cap: '300K', seed: 914739772862726144 },
];

// 平台差价模拟数据
const arbitrageItems = [
  { id: 1, name: 'M4A1 消音型 | 印花集 (久经沙场)', hashname: 'M4A1-S | Printstream (Field-Tested)', platformA: 'Steam', priceA: 1886.77, platformB: 'Buff', priceB: 1410.00, diff: 4.56 },
  { id: 2, name: '沙漠之鹰 | 炽烈之炎 (崭新出厂)', hashname: 'Desert Eagle | Blaze (Factory New)', platformA: 'Steam', priceA: 7782.62, platformB: 'Youpin', priceB: 5649.50, diff: 4.44 },
  { id: 3, name: '格洛克 18 型 | 渐变之色 (崭新出厂)', hashname: 'Glock-18 | Fade (Factory New)', platformA: 'Steam', priceA: 13916.98, platformB: 'Buff', priceB: 16776.50, diff: 3.81 },
  { id: 4, name: 'AWP | 鬼退治 (崭新出厂)', hashname: 'AWP | Oni Taiji (Factory New)', platformA: 'Steam', priceA: 7426.62, platformB: 'C5GAME', priceB: 6249.00, diff: 3.33 },
];

// 社区动态模拟数据
const communityPosts = [
  { id: 1, user: 'CSGO老炮', time: '2小时前', content: '刚开出一个火神，兄弟们这波什么水平？#csgo#', avatar: 'https://placehold.co/40x40/3B82F6/FFFFFF?text=L' },
  { id: 2, user: '市场分析师', time: '5小时前', content: '注意：下一个大行动可能导致印花集价格波动，建议观望。', avatar: 'https://placehold.co/40x40/25A750/FFFFFF?text=F' },
  { id: 3, user: '捡漏王', time: '1天前', content: '今天在Buff捡到一把0.001磨损咆哮，舒服了！', avatar: 'https://placehold.co/40x40/CA3F64/FFFFFF?text=J' },
];

// --- 辅助组件 ---

// 迷你图表
const MiniChart = ({ data, color }) => (
  <div style={{ width: 100, height: 40 }}>
    <ResponsiveContainer>
      <AreaChart data={data.map(v => ({ v }))} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id={`colorMiniChart-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} fill={`url(#colorMiniChart-${color})`} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

// --- 核心组件 ---

// 1. 顶栏
const Header = () => {
  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // 考虑固定顶栏的高度
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header style={{ backgroundColor: colors.bg1, borderBottom: `1px solid ${colors.border}` }} className="px-4 md:px-6 py-3 sticky top-0 z-50">
      <nav className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <img src="/csgodog.png" alt="CSGO-Dog Logo" className="h-10 w-10 object-contain" />
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-500 to-teal-400">
            CSGO-Dog
          </span>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <button onClick={() => handleScrollTo('market')} className="hover:text-white transition-colors">市场行情</button>
            <button onClick={() => handleScrollTo('ai-advisor')} className="hover:text-white transition-colors">AI 建仓</button>
            <button onClick={() => handleScrollTo('arbitrage')} className="hover:text-white transition-colors">平台套利</button>
            <button onClick={() => handleScrollTo('community')} className="hover:text-white transition-colors">社区动态</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="搜索饰品..." 
              className="bg-black text-gray-300 placeholder-gray-500 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
              style={{border: `1px solid ${colors.border}`}}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>
          <button className="hidden sm:block bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors">
            登录
          </button>
          <button className="hidden sm:block text-gray-300 hover:text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors" style={{border: `1px solid ${colors.border}`}}>
            注册
          </button>
        </div>
      </nav>
    </header>
  );
};

// 2. 市场概览 (K线图 + 热门)
const MarketOverview = () => {
  const platforms = ['BUFF', 'Steam', 'UU', 'C5GAME'];
  const [selectedPlatform, setSelectedPlatform] = useState(platforms[0]);
  const [selectedItem, setSelectedItem] = useState(hotItems[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 使用 useState 存储图表数据
  const [chartData, setChartData] = useState([]);

  // 当选择的饰品或平台改变时,生成新的图表数据并触发过渡动画
  useEffect(() => {
    setMounted(true);
    if (selectedItem && selectedPlatform) {
      setIsTransitioning(true);
      const newData = generatePriceData(selectedItem.price, selectedItem.seed, selectedPlatform);
      setChartData(newData);
      // 动画完成后重置过渡状态
      const timer = setTimeout(() => setIsTransitioning(false), 800);
      return () => clearTimeout(timer);
    }
  }, [selectedItem, selectedPlatform]);

  // 计算当前价格和预测涨跌
  const { currentPrice, predictedPrice, priceChange, changePercentage } = useMemo(() => {
    if (!mounted || chartData.length === 0) {
      return {
        currentPrice: selectedItem.price,
        predictedPrice: selectedItem.price,
        priceChange: 0,
        changePercentage: 0,
      };
    }
    
    // 当前价格是历史数据的最后一个有效点
    const lastPriceEntry = chartData.slice(0, 24).reverse().find(d => d.price !== null);
    const current = lastPriceEntry ? lastPriceEntry.price : selectedItem.price;

    // 预测价格是预测数据的最后一个点
    const lastPredicted = chartData[chartData.length - 1];
    const predicted = lastPredicted && lastPredicted.predictedPrice !== null 
      ? lastPredicted.predictedPrice 
      : current;

    const change = predicted - current;
    const changePct = (change / current) * 100;
    
    return {
      currentPrice: current,
      predictedPrice: predicted,
      priceChange: change,
      changePercentage: changePct,
    };
  }, [mounted, chartData, selectedItem]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isHistorical = data.date === '2025-10-24' || data.price !== null;
      
      return (
        <div className="p-3 rounded-lg shadow-xl" style={{ backgroundColor: colors.bg1, border: `1px solid ${colors.border}` }}>
          <p className="text-sm text-gray-400">{`日期: ${label}`}</p>
          {data.price && <p className="text-sm" style={{ color: colors.up }}>{`${isHistorical ? '现价' : '当前价格'}: ¥${data.price}`}</p>}
          {data.predictedPrice && data.date !== '2025-10-24' && (
            <p className="text-sm" style={{ color: data.predictedPrice >= data.price ? colors.up : colors.down }}>
              {`AI预测: ¥${data.predictedPrice}`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // NEW: 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);


  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 scroll-mt-20" id="market">
      {/* 左侧主图表 */}
      <div 
        className="lg:col-span-2 rounded-lg p-4 md:p-6" 
        style={{ backgroundColor: colors.bg1, border: `1px solid ${colors.border}` }}
      >
        
        {/* UPDATED: 标题和下拉平台切换 */}
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-white">
              {selectedItem.name} ({selectedPlatform} 趋势)
          </h2>
          {/* NEW: 平台下拉菜单 */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-4 py-2 text-sm font-medium rounded-full bg-black text-gray-300 hover:bg-gray-800 flex items-center gap-1"
              style={{ border: `1px solid ${colors.border}` }}
            >
              {selectedPlatform} <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-32 rounded-md shadow-lg py-1 z-10" 
                style={{ backgroundColor: colors.bg1, border: `1px solid ${colors.border}` }}
              >
                {platforms.map(platform => (
                  <button
                    key={platform}
                    onClick={() => {
                      setSelectedPlatform(platform);
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                  >
                    {platform}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 实时价格和预测价格展示 */}
        <div className="mb-6 flex items-baseline gap-8">
          <div className="flex flex-col">
            <p className="text-sm text-gray-400">实时价格 ({selectedPlatform})</p>
            <p className="text-4xl font-bold" style={{color: colors.up}}>
              ¥{currentPrice.toFixed(2)}
            </p>
          </div>
          <div className="flex flex-col">
            <p className="text-sm text-gray-400">AI 7日预测</p>
            <div className="flex items-center gap-2">
              <span 
                className="text-2xl font-bold" 
                style={{color: priceChange >= 0 ? colors.up : colors.down}}
              >
                {priceChange >= 0 ? '+' : '-'}¥{Math.abs(priceChange).toFixed(2)}
              </span>
              <span 
                className="text-sm font-medium" 
                style={{color: priceChange >= 0 ? colors.up : colors.down}}
              >
                ({priceChange >= 0 ? '+' : '-'}{Math.abs(changePercentage).toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
        
        <div className="h-64 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="5 5" stroke="#4B5563" strokeOpacity={0.3} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: colors.textSecondary }} axisLine={{ stroke: colors.border }} tickLine={{ stroke: colors.border }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12, fill: colors.textSecondary }} axisLine={{ stroke: colors.border }} tickLine={{ stroke: colors.border }} width={60} />
              <Tooltip content={<CustomTooltip active={undefined} payload={undefined} label={undefined} />} />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={colors.up} 
                strokeWidth={2.5} 
                dot={false} 
                name="当前价格" 
                style={{ filter: `drop-shadow(0 0 2px ${colors.up})` }}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-in-out"
                connectNulls={false}
              />
              <Line 
                type="monotone" 
                dataKey="predictedPrice" 
                stroke={priceChange >= 0 ? colors.up : colors.down}
                strokeWidth={3} 
                strokeDasharray="5 5"
                dot={false} 
                name="AI 7日预测" 
                style={{ filter: `drop-shadow(0 0 2px ${priceChange >= 0 ? colors.up : colors.down})` }}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-in-out"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* 右侧热门列表 */}
      <div 
        className="lg:col-span-1 rounded-lg p-4 md:p-6" 
        style={{ backgroundColor: colors.bg1, border: `1px solid ${colors.border}` }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">热门饰品</h2>
          {/* <a href="#" className="text-sm text-blue-400 hover:text-blue-300">查看全部</a> */}
        </div>
        <div className="space-y-3">
          {hotItems.map(item => {
            // 为每个饰品生成当前平台的数据
            const itemData = generatePriceData(item.price, item.seed, selectedPlatform);
            const miniChartData = generateMiniChartData(itemData);
            
            return (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer focus:outline-none" 
                style={{ backgroundColor: item.id === selectedItem.id ? colors.bg1Hover : colors.bg0 }}
                onClick={() => setSelectedItem(item)}
                tabIndex={-1}
              >
                {/* 栏位 1: Item details */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img src={`https://img.zbt.com/e/steam/item/730/` + encode(item.hashname) + `.png`} alt={item.name} className="w-10 h-8 rounded object-cover" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">市值: ¥{item.cap}</p>
                  </div>
                </div>
                
                {/* 栏位 2: MiniChart */}
                <div className="hidden sm:flex sm:justify-center sm:w-24">
                  <MiniChart data={miniChartData} color={item.change > 0 ? colors.up : colors.down} />
                </div>
                
                {/* 栏位 3: Price and Change */}
                <div className="text-right w-20"> 
                  <p className="text-sm font-semibold text-white">¥{item.price.toFixed(2)}</p>
                  <p className={`text-sm font-medium`} style={{color: item.change > 0 ? colors.up : colors.down}}>
                    {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// 3. 仓位建议
const PositionAdvisor = ({ getPrediction }) => {
  const [strategy, setStrategy] = useState(50);
  const [totalCapital, setTotalCapital] = useState(0);

  // 计算最小预算(所有热门饰品价格总和)
  const minBudget = useMemo(() => {
    return hotItems.reduce((sum, item) => sum + item.price, 0);
  }, []);

  // 实时计算仓位分配(根据策略和预算自动更新)
  const positionAdvice = useMemo(() => {
    if (totalCapital < minBudget) {
      return [];
    }

    const riskFactor = strategy / 100; // 0 稳定, 1 激进
    const suggestions = [
      { 
        id: 1, 
        name: 'AK-47 | 火神 (崭新出厂)', 
        hashname: 'AK-47 | Vulcan (Factory New)',
        type: '崭新出厂',
        unitPrice: 320.50,
        weight: 0.30,
      },
      { 
        id: 2, 
        name: 'M4A4 | 咆哮 (略有磨损)', 
        hashname: 'M4A4 | Howl (Minimal Wear)',
        type: '略有磨损',
        unitPrice: 4200.00,
        weight: 0.25,
      },
      { 
        id: 3, 
        name: '★ 蝴蝶刀 | 渐变大理石 (崭新出厂)', 
        hashname: '★ Butterfly Knife | Marble Fade (Factory New)',
        type: '崭新出厂',
        unitPrice: 1500.00,
        weight: 0.25,
      },
      { 
        id: 4, 
        name: 'AWP | 巨龙传说 (崭新出厂)', 
        hashname: 'AWP | Dragon Lore (Factory New)',
        type: '崭新出厂',
        unitPrice: 8500.00,
        weight: 0.15,
      },
      { 
        id: 5, 
        name: 'USP-S | 永恒 (久经沙场)', 
        hashname: 'USP-S | Eternal (Field-Tested)',
        type: '久经沙场',
        unitPrice: 85.00,
        weight: 0.05,
      },
    ];

    // 根据策略调整权重分配
    const strategyFactor = riskFactor > 0.5 ? 1.5 : 0.8;
    const base = totalCapital * (0.4 + 0.6 * riskFactor); // 更激进使用更多资金
    
    return suggestions
      .map(s => {
        const allocation = base * s.weight * strategyFactor;
        const units = Math.floor(allocation / s.unitPrice);
        const actualAllocation = units * s.unitPrice;
        
        return {
          ...s,
          allocation: actualAllocation,
          suggestedUnits: units,
        };
      })
      .filter(s => s.suggestedUnits > 0)
      .slice(0, riskFactor > 0.7 ? 5 : riskFactor > 0.4 ? 4 : 3);
  }, [strategy, totalCapital, minBudget]);

  // 处理预算输入 - 阻止前导零
  const handleCapitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // 空值处理
    if (value === '') {
      setTotalCapital(0);
      return;
    }
    
    // 移除前导零: "01" -> "1", "001" -> "1"
    const cleanValue = value.replace(/^0+(?=\d)/, '');
    const numValue = parseInt(cleanValue || '0', 10);
    
    if (!isNaN(numValue) && numValue >= 0) {
      setTotalCapital(numValue);
    }
  };

  // 计算总投资额
  const totalInvestment = useMemo(() => {
    return positionAdvice.reduce((sum, item) => sum + item.allocation, 0);
  }, [positionAdvice]);

  const strategyLabel = useMemo(() => {
    if (strategy < 20) return '非常稳定';
    if (strategy < 40) return '稳定';
    if (strategy < 60) return '均衡';
    if (strategy < 80) return '激进';
    return '非常激进';
  }, [strategy]);

  return (
    <section 
      id="ai-advisor" // 添加 ID
      className="mt-6 rounded-lg p-4 md:p-6 scroll-mt-20" // 添加 scroll-mt-20
      style={{ backgroundColor: colors.bg1, border: `1px solid ${colors.border}` }}
    >
      <h2 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
        <Brain className="w-6 h-6 text-blue-400" />
        AI 仓位建议
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/*
        <div className="md:col-span-3">
          <p className="text-sm text-gray-400 mb-2">总览</p>
        </div>
        */}
        {/* 设置 */}
        <div className="md:col-span-1 space-y-6">
          {/* 策略滑条 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">投资策略: <span className="font-bold text-white">{strategyLabel}</span></label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">稳定</span>
              <input
                type="range"
                min="0"
                max="100"
                value={strategy}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStrategy(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{background: `linear-gradient(to right, ${colors.up}, ${colors.down})`}}
              />
              <span className="text-sm text-gray-400">激进</span>
            </div>
          </div>
          
          {/* 预算输入 */}
          <div>
            <label htmlFor="totalCapital" className="block text-sm font-medium text-gray-300 mb-2">
              总资金 (CNY)
              <span className="text-xs text-gray-500 ml-2">最低: ¥{minBudget.toFixed(2)}</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                id="totalCapital"
                value={totalCapital || ''}
                onChange={handleCapitalChange}
                min={0}
                step="100"
                className="w-full bg-black text-white placeholder-gray-500 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{border: `1px solid ${colors.border}`}}
                placeholder="输入总资金"
              />
            </div>
            {totalCapital > 0 && totalCapital < minBudget && (
              <p className="mt-1 text-xs text-yellow-500">
                提示: 至少需要 ¥{minBudget.toFixed(2)} 才能购买所有饰品
              </p>
            )}
          </div>
        </div>

        {/* 建议输出 */}
        <div className="md:col-span-2 rounded-lg p-6 min-h-[200px]" style={{ backgroundColor: colors.bg0, border: `1px solid ${colors.border}` }}>
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            仓位分配 {positionAdvice.length > 0 && <span className="text-sm text-gray-400 font-normal">({strategyLabel})</span>}
          </h3>
          
          {positionAdvice.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-center">
                请输入总资金(至少 ¥{minBudget.toFixed(2)})<br />
                系统将根据策略实时计算仓位分配
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 总投资统计 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg" style={{ backgroundColor: colors.bg1 }}>
                  <div className="text-xs text-gray-400 mb-1">总资金</div>
                  <div className="text-lg font-bold text-white">
                    ¥{totalCapital.toFixed(2)}
                  </div>
                </div>
                
                <div className="p-3 rounded-lg" style={{ backgroundColor: colors.bg1 }}>
                  <div className="text-xs text-gray-400 mb-1">实际投资</div>
                  <div className="text-lg font-bold" style={{ color: colors.up }}>
                    ¥{totalInvestment.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">
                    利用率 {((totalInvestment / totalCapital) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              
              {/* 建议列表 */}
              <div className="space-y-3">
              {positionAdvice.map((item, index) => (
                <div 
                  key={item.id} 
                  className="p-3 rounded-lg transition-colors"
                  style={{ backgroundColor: colors.bg1Hover }}
                >
                  <div className="flex items-center justify-between">
                    {/* 序号和饰品信息 */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: colors.bg1, color: colors.up }}>
                        {index + 1}
                      </div>
                      <img 
                        src={`https://img.zbt.com/e/steam/item/730/` + encode(item.hashname) + `.png`} 
                        alt={item.name} 
                        className="w-12 h-10 rounded object-cover" 
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.type} × {item.suggestedUnits}</p>
                      </div>
                    </div>
                    
                    {/* 价格信息 */}
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-white">¥{item.allocation.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">¥{item.unitPrice.toFixed(2)}/件</p>
                    </div>
                  </div>
                </div>
              ))}
              </div>
              
              {/* 总计 */}
              <div 
                className="flex items-center justify-between p-4 rounded-lg mt-4"
                style={{ backgroundColor: colors.bg1, border: `1px solid ${colors.border}` }}
              >
                <div className="text-white font-semibold">合计投资</div>
                <div className="text-xl font-bold" style={{ color: colors.up }}>
                  ¥{totalInvestment.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// 4. 抄底预测
const BargainPredictor = () => {
  // 高收益配件 - 稳定升值潜力
  const highReturnItems = [
    { 
      id: 1, 
      name: 'AK-47 | 二西莫夫 (久经沙场)', 
      hashname: 'AK-47 | Asiimov (Field-Tested)',
      current: 156.80, 
      predicted: 203.84, 
      returnRate: 30.0,
      reason: 'AI预测该系列即将绝版，社区需求持续上升。',
      risk: '低'
    },
    { 
      id: 2, 
      name: 'M4A4 | 破晓之龙 (略有磨损)', 
      hashname: 'M4A4 | The Coalition (Minimal Wear)',
      current: 385.50, 
      predicted: 481.88, 
      returnRate: 25.0,
      reason: '稀有度高，收藏价值显著，历史数据显示稳定增长。',
      risk: '中'
    },
    { 
      id: 3, 
      name: 'USP-S | 杀戮确认 (久经沙场)', 
      hashname: 'USP-S | Kill Confirmed (Field-Tested)',
      current: 92.30, 
      predicted: 110.76, 
      returnRate: 20.0,
      reason: '热门皮肤，市场流动性强，短期内有显著上涨空间。',
      risk: '低'
    },
  ];

  // 高风险产品 - 波动大但潜力高
  const highRiskItems = [
    { 
      id: 4, 
      name: '★ 蝴蝶刀 | 渐变之色 (崭新出厂)', 
      hashname: '★ Butterfly Knife | Fade (Factory New)',
      current: 1850.00, 
      predicted: 2590.00, 
      returnRate: 40.0,
      reason: '刀具市场波动剧烈，但顶级收藏品长期看涨。',
      risk: '高'
    },
    { 
      id: 5, 
      name: 'AWP | 龙狙 (崭新出厂)', 
      hashname: 'AWP | Dragon Lore (Factory New)',
      current: 6800.00, 
      predicted: 9180.00, 
      returnRate: 35.0,
      reason: '传奇皮肤，价格受市场情绪影响大，高风险高回报。',
      risk: '极高'
    },
    { 
      id: 6, 
      name: '运动手套（★） | 潘多拉之盒 (久经沙场)', 
      hashname: '★ Sport Gloves | Pandora\'s Box (Field-Tested)',
      current: 30999.50, 
      predicted: 31600.00, 
      returnRate: 30.0,
      reason: '手套类别稀缺，但品相要求高，价格波动较大。',
      risk: '高'
    },
  ];

  const renderItemCard = (item) => (
    <div 
      key={item.id} 
      className="rounded-lg p-4 transition-all" 
      style={{ backgroundColor: colors.bg0, border: `1px solid ${colors.border}`, transition: 'background-color 0.3s' }} 
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.bg1Hover}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.bg0}
    >
      <div className="flex items-start gap-4">
        <img 
          src={`https://img.zbt.com/e/steam/item/730/` + encode(item.hashname) + `.png`} 
          alt={item.name} 
          className="w-20 h-15 rounded object-cover" 
        />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-white">{item.name}</h3>
            <span 
              className="text-xs px-2 py-1 rounded-full whitespace-nowrap"
              style={{ 
                backgroundColor: item.risk === '低' ? 'rgba(188, 255, 47, 0.1)' : 
                               item.risk === '中' ? 'rgba(255, 165, 0, 0.1)' : 
                               'rgba(202, 63, 100, 0.1)',
                color: item.risk === '低' ? colors.up : 
                       item.risk === '中' ? '#FFA500' : 
                       colors.down
              }}
            >
              {item.risk}风险
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2 line-clamp-2">{item.reason}</p>
          <div className="flex items-center gap-4 mt-3">
            <div>
              <p className="text-xs text-gray-400">当前价格</p>
              <p className="text-base font-bold text-white">¥{item.current.toFixed(2)}</p>
            </div>
            <div className="text-xl text-gray-500">&rarr;</div>
            <div>
              <p className="text-xs text-gray-400">AI 7日预测</p>
              <p className="text-base font-bold" style={{color: colors.up}}>¥{item.predicted.toFixed(2)}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-400">预期收益</p>
              <p className="text-base font-bold" style={{color: colors.up}}>+{item.returnRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section 
      className="mt-6 rounded-lg p-4 md:p-6" 
      style={{ backgroundColor: colors.bg1, border: `1px solid ${colors.border}` }}
    >
      <h2 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-green-400" style={{color: colors.up}} />
        AI 抄底预测
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧: 高收益配件 */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{backgroundColor: colors.up}}></span>
            高收益配件
          </h3>
          <div className="space-y-4">
            {highReturnItems.map(renderItemCard)}
          </div>
        </div>

        {/* 右侧: 高风险产品 */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{backgroundColor: colors.down}}></span>
            高风险饰品
          </h3>
          <div className="space-y-4">
            {highRiskItems.map(renderItemCard)}
          </div>
        </div>
      </div>
    </section>
  );
};

// 5. 平台差价
const PlatformArbitrage = () => (
  <section 
    id="arbitrage" // 添加 ID
    className="mt-6 rounded-lg p-4 md:p-6 scroll-mt-20" // 添加 scroll-mt-20
    style={{ backgroundColor: colors.bg1, border: `1px solid ${colors.border}` }}
  >
    <h2 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
      <BarChart className="w-6 h-6 text-yellow-400" />
      平台差价 (搬砖)
    </h2>
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-left">
        <thead>
          <tr className="border-b" style={{borderColor: colors.border}}>
            <th className="p-3 text-sm font-semibold text-gray-400">饰品名称</th>
            <th className="p-3 text-sm font-semibold text-gray-400">平台 A (价格)</th>
            <th className="p-3 text-sm font-semibold text-gray-400">平台 B (价格)</th>
            <th className="p-3 text-sm font-semibold text-gray-400">差价 (CNY)</th>
            <th className="p-3 text-sm font-semibold text-gray-400">差价 (%)</th>
          </tr>
        </thead>
        <tbody>
          {arbitrageItems.map(item => (
            <tr key={item.id} className="border-b border-dashed" style={{borderColor: colors.border, transition: 'background-color 0.3s'}}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.bg1Hover}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <td className="p-3 text-sm font-medium text-white">{item.name}</td>
              <td className="p-3 text-sm text-gray-300">{item.platformA} (¥{item.priceA.toFixed(2)})</td>
              <td className="p-3 text-sm text-gray-300">{item.platformB} (¥{item.priceB.toFixed(2)})</td>
              <td className="p-3 text-sm font-medium" style={{color: colors.up}}>¥{(item.priceA - item.priceB).toFixed(2)}</td>
              <td className="p-3 text-sm font-medium" style={{color: colors.up}}>
                {((item.priceA - item.priceB) / item.priceA * 100).toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

// 6. 社区动态
const CommunityFeed = () => (
  <section 
    id="community" // 添加 ID
    className="mt-6 rounded-lg p-4 md:p-6 scroll-mt-20" // 添加 scroll-mt-20
    style={{ backgroundColor: colors.bg1, border: `1px solid ${colors.border}` }}
  >
    <h2 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
      <Users className="w-6 h-6 text-teal-400" />
      社区动态
    </h2>
    <div className="space-y-4">
      {communityPosts.map(post => (
        <div key={post.id} className="rounded-lg p-4 flex gap-4" style={{ backgroundColor: colors.bg0, border: `1px solid ${colors.border}` }}>
          <img src={post.avatar} alt={post.user} className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{post.user}</span>
              <span className="text-xs text-gray-500">{post.time}</span>
            </div>
            <p className="text-sm text-gray-300 mt-1">{post.content}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

// 7. AI 助手
const AIAssistant = ({ getPrediction }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', content: '你好！我是 CSGO-Dog AI 助手。我可以回答关于市场趋势、饰品价值或投资策略的任何问题。' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const prompt = `用户提问: "${input}"。请基于CS:GO饰品市场数据（虚构的）和AI分析，提供一个有帮助的、简洁的回答。`;
      const result = await getPrediction(prompt, "你是一个专业的CS:GO饰品市场AI助手。");
      setMessages(prev => [...prev, { role: 'ai', content: result }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: '抱歉，我暂时无法回答您的问题，请稍后再试。' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section 
      className="mt-6 rounded-lg p-4 md:p-6" 
      style={{ backgroundColor: colors.bg1, border: `1px solid ${colors.border}` }}
    >
      <h2 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
        <Bot className="w-6 h-6 text-purple-400" />
        AI 助手
      </h2>
      
      {/* 聊天记录 */}
      <div className="h-64 overflow-y-auto space-y-4 p-4 rounded-lg mb-4" style={{ backgroundColor: colors.bg0, border: `1px solid ${colors.border}` }}>
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-xl ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-200'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-200 px-4 py-3 rounded-xl inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0s'}}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="向 AI 助手提问..."
          className="grow bg-black text-white placeholder-gray-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{border: `1px solid ${colors.border}`}}
          disabled={loading}
        />
        <button 
          onClick={handleSend}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};


// --- 主应用 App ---
export default function App() {

  // 页面加载时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  /**
   * 调用 Gemini API 获取虚构的预测理由
   * @param {string} userQuery - 用户的提问或提示
   * @param {string} systemRole - AI的角色定义
   * @returns {Promise<string>} - AI 生成的分析文本
   */
  const getGeminiPrediction = useCallback(async (userQuery, systemRole) => {
    const systemPrompt = systemRole || "你是一个AI助手。";
    
    const apiKey = ""; // API 密钥将由 Canvas 环境自动提供
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
    };

    // 实现带指数退避的重试逻辑
    let response;
    let delay = 1000; // 初始延迟 1 秒
    
    for (let i = 0; i < 5; i++) { // 最多重试 5 次
        try {
            response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                const candidate = result.candidates?.[0];
                if (candidate && candidate.content?.parts?.[0]?.text) {
                    return candidate.content.parts[0].text; // 成功
                } else {
                    throw new Error('API 响应无效，未包含预测文本。');
                }
            } else if (response.status === 429 || response.status >= 500) {
                // API 节流或服务器错误，等待后重试
                console.warn(`API request failed with status ${response.status}. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // 增加延迟
            } else {
                // 客户端错误（如 400 Bad Request），不应重试
                throw new Error(`API 请求失败，状态码: ${response.status}`);
            }
        } catch (error) {
            // 网络错误等，重试
            console.warn(`API request failed: ${error.message}. Retrying in ${delay}ms...`);
            if (i === 4) {
                throw error; // 最后一次尝试失败，抛出错误
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
    
    throw new Error('AI 预测请求在多次重试后失败。');
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg0, color: colors.textPrimary }}>
      <Header />
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <MarketOverview />
        <PositionAdvisor getPrediction={getGeminiPrediction} />
        <BargainPredictor />
        <PlatformArbitrage />
        <CommunityFeed />
        <AIAssistant getPrediction={getGeminiPrediction} />
      </main>
      <footer className="text-center py-8 mt-8" style={{ borderTop: `1px solid ${colors.border}` }}>
        <p className="text-sm text-gray-500">&copy; 2025 CSGO-Dog. 版权所有. (数据为模拟生成, 仅供演示)</p>
      </footer>
    </div>
  );
}
