"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Search, ChevronDown, TrendingUp, TrendingDown, Bot, Send, DollarSign, Brain, BarChart, Users, Flame } from 'lucide-react';

// --- 配色方案 ---
const colors = {
  bg0: '#000000',
  bg1: '#121212',
  bg1Hover: '#191919',
  down: '#CA3F64',
  up: '#25A750',
  textPrimary: '#E5E7EB',
  textSecondary: '#9CA3AF',
  border: 'rgba(255, 255, 255, 0.1)',
  blue: '#3B82F6',
};

// --- 模拟数据 ---

// 主图表模拟数据
const generateMainChartData = () => {
  let data = [];
  let price = 100;
  let predictedPrice = 100;
  for (let i = 0; i < 30; i++) {
    const date = `10-${i + 1}`;
    price += (Math.random() - 0.45) * 10;
    if (price < 50) price = 50;
    
    // 模拟预测数据（从第23天开始）
    if (i < 23) {
      data.push({ date, price: price.toFixed(2), predictedPrice: null });
    } else if (i === 23) {
      predictedPrice = price; // 预测从当前价格开始
      data.push({ date, price: price.toFixed(2), predictedPrice: predictedPrice.toFixed(2) });
    } else {
      predictedPrice += (Math.random() - 0.4) * 8; // 预测趋势
      if (predictedPrice < 60) predictedPrice = 60;
      data.push({ date, price: null, predictedPrice: predictedPrice.toFixed(2) });
    }
  }
  return data;
};

// 热门枪支模拟数据
const hotItems = [
  { id: 1, name: 'AK-47 | 火神', price: 320.50, change: 2.5, cap: '1.2M', data: [5, 8, 10, 7, 12, 11, 13] },
  { id: 2, name: 'AWP | 巨龙传说', price: 8500.00, change: -1.2, cap: '850K', data: [15, 12, 10, 13, 11, 10, 9] },
  { id: 3, name: 'M4A4 | 咆哮', price: 4200.00, change: 5.1, cap: '700K', data: [3, 4, 6, 8, 7, 10, 12] },
  { id: 4, name: '蝴蝶刀 | 渐变大理石', price: 1500.00, change: 0.5, cap: '2.1M', data: [8, 8, 9, 9, 10, 9.5, 10] },
  { id: 5, name: 'USP-S | 永恒', price: 85.00, change: -3.0, cap: '300K', data: [12, 11, 10, 10, 9, 9, 8] },
];

// 平台差价模拟数据
const arbitrageItems = [
  { id: 1, name: 'M4A1-S | 印花集', platformA: 'Steam', priceA: 120.50, platformB: 'Buff', priceB: 115.00, diff: 4.56 },
  { id: 2, name: '沙漠之鹰 | 炽烈之炎', platformA: 'Steam', priceA: 450.00, platformB: 'IGXE', priceB: 430.00, diff: 4.44 },
  { id: 3, name: '格洛克 | 渐变之色', platformA: 'Steam', priceA: 210.00, platformB: 'Buff', priceB: 202.00, diff: 3.81 },
  { id: 4, name: 'AWP | 鬼退治', platformA: 'Steam', priceA: 300.00, platformB: 'IGXE', priceB: 290.00, diff: 3.33 },
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
const Header = () => (
  <header style={{ backgroundColor: colors.bg1, borderBottom: `1px solid ${colors.border}` }} className="px-4 md:px-6 py-3 sticky top-0 z-50">
    <nav className="flex items-center justify-between max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400">
          CSGO-Dog
        </span>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
          <a href="#" className="hover:text-white">市场</a>
          <a href="#" className="hover:text-white">交易</a>
          <a href="#" className="hover:text-white">AI 分析</a>
          <a href="#" className="hover:text-white">社区</a>
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
        <button className="hidden sm:block text-gray-300 hover:text-white text-sm font-semibold px-4 py-2 rounded-full" style={{border: `1px solid ${colors.border}`}}>
          注册
        </button>
      </div>
    </nav>
  </header>
);

// 2. 市场概览 (K线图 + 热门)
const MarketOverview = () => {
  const chartData = useMemo(() => generateMainChartData(), []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 rounded-lg shadow-xl" style={{ backgroundColor: colors.bg1, border: `1px solid ${colors.border}` }}>
          <p className="text-sm text-gray-400">{`日期: 10-${label}`}</p>
          {data.price && <p className="text-sm" style={{ color: colors.up }}>{`当前价格: $${data.price}`}</p>}
          {data.predictedPrice && <p className="text-sm" style={{ color: colors.blue }}>{`预测价格: $${data.predictedPrice}`}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      {/* 左侧主图表 */}
      <div 
        className="lg:col-span-2 rounded-lg p-4 md:p-6" 
        style={{ backgroundColor: colors.bg1, border: `1px solid ${colors.border}` }}
      >
        <h2 className="text-xl font-semibold mb-4 text-white">AK-47 | 火神 (大盘趋势)</h2>
        <div className="h-64 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} strokeOpacity={0.5} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: colors.textSecondary }} axisLine={{ stroke: colors.border }} tickLine={{ stroke: colors.border }} />
              <YAxis domain={['dataMin - 20', 'dataMax + 20']} tick={{ fontSize: 12, fill: colors.textSecondary }} axisLine={{ stroke: colors.border }} tickLine={{ stroke: colors.border }} />
              <Tooltip content={<CustomTooltip active={undefined} payload={undefined} label={undefined} />} />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={colors.up} 
                strokeWidth={2} 
                dot={false} 
                name="当前价格" 
              />
              <Line 
                type="monotone" 
                dataKey="predictedPrice" 
                stroke={colors.blue} 
                strokeWidth={2} 
                strokeDasharray="5 5" 
                dot={false} 
                name="AI 7日预测" 
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
          <h2 className="text-xl font-semibold text-white">热门枪支</h2>
          <a href="#" className="text-sm text-blue-400 hover:text-blue-300">查看全部</a>
        </div>
        <div className="space-y-3">
          {hotItems.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg transition-colors" style={{ backgroundColor: colors.bg0 }} >
              <div className="flex items-center gap-3">
                <img src={`https://placehold.co/40x30/252525/FFFFFF?text=${item.name.substring(0,2)}`} alt={item.name} className="w-10 h-8 rounded object-cover" />
                <div>
                  <p className="text-sm font-medium text-white">{item.name}</p>
                  <p className="text-xs text-gray-400">市值: ${item.cap}</p>
                </div>
              </div>
              <div className="hidden sm:block">
                <MiniChart data={item.data} color={item.change > 0 ? colors.up : colors.down} />
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">${item.price.toFixed(2)}</p>
                <p className={`text-sm font-medium ${item.change > 0 ? 'text-green-500' : 'text-red-500'}`} style={{color: item.change > 0 ? colors.up : colors.down}}>
                  {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 3. 仓位建议
const PositionAdvisor = ({ getPrediction }) => {
  const [strategy, setStrategy] = useState(50); // 0=稳定, 100=激进
  const [budget, setBudget] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  const strategyLabel = useMemo(() => {
    if (strategy < 20) return '非常稳定';
    if (strategy < 40) return '稳定';
    if (strategy < 60) return '均衡';
    if (strategy < 80) return '激进';
    return '非常激进';
  }, [strategy]);

  const handleGenerate = async () => {
    setLoading(true);
    setSuggestion(null);
    const prompt = `为CS:GO饰品投资者制定一个投资组合建议。
    投资策略: ${strategyLabel} (滑块值: ${strategy}/100)。
    总预算: $${budget}。
    请提供一个包含3-5个饰品名称、分配比例（%）和简短理由的建仓列表。以中文回答。`;
    
    try {
      const result = await getPrediction(prompt, "你是一个专业的CS:GO饰品投资顾问。");
      setSuggestion(result);
    } catch (error) {
      console.error(error);
      setSuggestion("AI 建议生成失败，请稍后重试。");
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
                onChange={(e) => setStrategy(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{background: `linear-gradient(to right, ${colors.up}, ${colors.down})`}}
              />
              <span className="text-sm text-gray-400">激进</span>
            </div>
          </div>
          
          {/* 预算输入 */}
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-300 mb-2">总预算 (USD)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                id="budget"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full bg-black text-white placeholder-gray-500 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{border: `1px solid ${colors.border}`}}
              />
            </div>
          </div>

          {/* 生成按钮 */}
          <button 
            onClick={handleGenerate} 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'AI 正在计算...' : '生成建仓建议'}
          </button>
        </div>

        {/* 建议输出 */}
        <div className="md:col-span-2 rounded-lg p-6 min-h-[200px]" style={{ backgroundColor: colors.bg0, border: `1px solid ${colors.border}` }}>
          <h3 className="text-lg font-semibold text-gray-200 mb-4">AI 建仓模拟</h3>
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          )}
          {suggestion && (
            <div className="text-gray-300 whitespace-pre-line text-sm leading-relaxed">
              {suggestion}
            </div>
          )}
          {!loading && !suggestion && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-center">请设置您的策略和预算，<br />然后点击生成按钮获取建议。</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// 4. 抄底预测
const BargainPredictor = () => {
  const bargains = [
    { id: 1, name: 'AWP | 野火 (略磨)', current: 80, predicted: 110, reason: 'AI预测该系列即将绝版，潜力巨大。' },
    { id: 2, name: '手套 | 渐变 (战痕)', current: 220, predicted: 280, reason: '数据显示低磨损战痕手套需求正在上升。' },
  ];

  return (
    <section 
      className="mt-6 rounded-lg p-4 md:p-6" 
      style={{ backgroundColor: colors.bg1, border: `1px solid ${colors.border}` }}
    >
      <h2 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-green-400" style={{color: colors.up}} />
        AI 抄底预测
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bargains.map(item => (
          <div key={item.id} className="rounded-lg p-4 transition-all" style={{ backgroundColor: colors.bg0, border: `1px solid ${colors.border}`, transition: 'background-color 0.3s' }} 
               onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.bg1Hover}
               onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.bg0}
          >
            <div className="flex items-start gap-4">
              <img src={`https://placehold.co/80x60/252525/FFFFFF?text=${item.name.substring(0,3)}`} alt={item.name} className="w-20 h-15 rounded object-cover" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{item.reason}</p>
                <div className="flex items-center gap-4 mt-3">
                  <div>
                    <p className="text-xs text-gray-400">当前价格</p>
                    <p className="text-lg font-bold text-white">${item.current.toFixed(2)}</p>
                  </div>
                  <div className="text-2xl text-gray-500">&rarr;</div>
                  <div>
                    <p className="text-xs text-gray-400">AI 7日预测</p>
                    <p className="text-lg font-bold" style={{color: colors.up}}>${item.predicted.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// 5. 平台差价
const PlatformArbitrage = () => (
  <section 
    className="mt-6 rounded-lg p-4 md:p-6" 
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
            <th className="p-3 text-sm font-semibold text-gray-400">差价 (USD)</th>
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
              <td className="p-3 text-sm text-gray-300">{item.platformA} (${item.priceA.toFixed(2)})</td>
              <td className="p-3 text-sm text-gray-300">{item.platformB} (${item.priceB.toFixed(2)})</td>
              <td className="p-3 text-sm font-medium" style={{color: colors.up}}>${(item.priceA - item.priceB).toFixed(2)}</td>
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
    className="mt-6 rounded-lg p-4 md:p-6" 
    style={{ backgroundColor: colors.bg1, border: `1px solid ${colors.border}` }}
  >
    <h2 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
      <Users className="w-6 h-6 text-teal-400" />
      社区动态
    </h2>
    <div className="space-y-4">
      {communityPosts.map(post => (
        <div key={post.id} className="rounded-lg p-4 flex gap-4" style={{ backgroundColor: colors.bg0, border: `1px solid ${colors.border}` }}>
          <img src={post.avatar} alt={post.user} className="w-10 h-10 rounded-full flex-shrink-0" />
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
          className="flex-grow bg-black text-white placeholder-gray-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
