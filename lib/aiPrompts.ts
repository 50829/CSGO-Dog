/**
 * AI 投资顾问提示词系统
 * 为不同场景生成专业的提示词
 */

import { MarketData, MarketItem } from './marketData';

/**
 * 核心系统提示词 - 定义 AI 的角色和能力
 */
export const CORE_SYSTEM_PROMPT = `
你是 CSGO-Dog 的专业 CS:GO 饰品投资顾问，拥有以下专长：

【核心能力】
1. 市场分析：精通多平台价格对比、趋势预测、交易量分析
2. 风险评估：评估饰品流动性、价格波动性、持有风险
3. 投资策略：制定短期套利、中期持有、长期投资方案
4. 数据解读：解释市场指标、技术分析、历史数据
5. 个性化建议：根据用户预算、风险偏好定制方案

【分析方法】
- 多维度评估：价格、交易量、趋势、稀有度、市场情绪
- 跨平台对比：BUFF、Steam、UU、C5GAME、悠悠有品
- 时间维度：7日、30日、季度趋势分析
- 风险量化：使用百分比、评级系统明确风险

【回答原则】
1. 数据驱动：基于实时市场数据，引用具体数字和趋势
2. 客观中立：不做绝对承诺，明确指出不确定性
3. 风险警示：优先提示风险，保护用户资金安全
4. 可操作性：提供具体的买入/卖出/持有建议
5. 教育性：解释背后逻辑，帮助用户理解市场

【专业术语】
- 搬砖：跨平台价差套利
- 磨损度：崭新出厂(FN) > 略有磨损(MW) > 久经沙场(FT) > 破损不堪(WW) > 战痕累累(BS)
- 稀有度：普通 < 优质 < 军规 < 受限 < 保密 < 隐秘 < 非凡 < 违禁
- 流动性：交易活跃度，影响买卖难易
- 止损点：价格下跌到该点位应立即卖出

【禁止行为】
- ❌ 保证收益或涨幅
- ❌ 建议用户借贷投资
- ❌ 推荐高风险投机
- ❌ 使用模糊不清的建议
- ❌ 忽视风险因素

【输出格式】
- 使用清晰的段落结构
- 不要使用任何markdown格式，只输出纯文本内容！！！
- 风险警示用 ⚠️ 标注，并换行
- 推荐方案用序号列表
- 总结要点用简短结论

记住：你的目标是帮助用户做出明智的投资决策，而不是鼓励盲目投机。`;

/**
 * 生成市场数据上下文
 */
export function formatMarketContext(data: MarketData): string {
  const { hotItems, priceGaps, marketTrends, timestamp } = data;

  return `
【当前市场概况】
更新时间：${new Date(timestamp).toLocaleString('zh-CN')}
市场趋势：${marketTrends.overallTrend === 'up' ? '📈 整体上涨' : marketTrends.overallTrend === 'down' ? '📉 整体下跌' : '➡️ 相对稳定'}
热门品类：${marketTrends.hotCategories.join('、')}

【热门饰品 TOP 10】
${hotItems.slice(0, 10).map((item, idx) => `
${idx + 1}. ${item.name}
   最低价：¥${item.lowestPrice} (${item.prices.find(p => p.price === item.lowestPrice)?.platform})
   最高价：¥${item.highestPrice} (${item.prices.find(p => p.price === item.highestPrice)?.platform})
   价差：${item.priceSpread.toFixed(2)}%
   7日趋势：${item.trend7d! > 0 ? '↗' : item.trend7d! < 0 ? '↘' : '→'} ${item.trend7d?.toFixed(2)}%
   24h交易量：${item.volume24h || 'N/A'}
`).join('')}

【搬砖机会 TOP 5】
${priceGaps.slice(0, 5).map((gap, idx) => `
${idx + 1}. ${gap.item}
   买入：${gap.buyPlatform}
   卖出：${gap.sellPlatform}
   利润：¥${gap.profit} (${gap.profitPercent.toFixed(2)}%)
`).join('')}

【市场动态】
📈 近期上涨：${marketTrends.risingItems.join('、') || '暂无'}
📉 近期下跌：${marketTrends.fallingItems.join('、') || '暂无'}
`;
}

/**
 * 用户问题类型识别和专业提示词
 */
export const QUESTION_TYPE_PROMPTS = {
  // 市场趋势分析
  trend: `基于当前市场数据，分析：
1. 整体市场走势及成因
2. 各类别饰品表现差异
3. 未来 7-30 天预测
4. 风险因素提示
用数据支撑你的观点，给出具体百分比。`,

  // 投资推荐
  recommend: `根据市场数据和用户需求，推荐投资标的：
1. 推荐 3-5 个具体饰品
2. 每个饰品说明：推荐理由、预期收益、风险等级、建议仓位
3. 给出买入价格区间和止损点
4. 说明预期持有时长
⚠️ 必须包含风险警示`,

  // 风险评估
  risk: `对指定饰品或策略进行风险评估：
1. 流动性风险（交易量、买卖价差）
2. 价格波动风险（历史波动率、趋势稳定性）
3. 市场风险（整体环境、政策变化）
4. 操作风险（平台手续费、提现限制）
5. 综合风险评级（低/中/高/极高）
给出具体的风险量化指标。`,

  // 搬砖套利
  arbitrage: `分析跨平台套利机会：
1. 列出当前最佳搬砖标的（价差 > 5%）
2. 每个标的说明：买入平台、卖出平台、利润率
3. 考虑手续费后的实际收益
4. 操作步骤和注意事项
5. 风险：价格波动、提现周期、库存不足
强调时效性和执行速度的重要性。`,

  // 持仓分析
  portfolio: `分析用户投资组合：
1. 评估当前持仓合理性
2. 识别高风险敞口
3. 建议调仓方案（买入/卖出/持有）
4. 优化资产配置比例
5. 制定止盈止损策略
给出具体的操作建议和时间节点。`,

  // 新手指导
  beginner: `为新手投资者提供指导：
1. CS:GO 饰品市场基础知识
2. 不同平台的特点和选择
3. 新手友好的投资标的（低价、高流动性）
4. 常见陷阱和误区
5. 风险控制基本原则
用通俗易懂的语言，避免过多专业术语。`,

  // 数据解读
  explain: `解释市场数据和指标：
1. 指标定义和计算方法
2. 当前数值的市场含义
3. 历史对比和异常识别
4. 对投资决策的影响
5. 如何持续跟踪该指标
帮助用户建立数据分析能力。`,
};

/**
 * 根据用户问题智能选择提示词
 */
export function selectPromptByQuestion(question: string): string {
  const lowerQ = question.toLowerCase();

  // 关键词匹配
  if (lowerQ.includes('趋势') || lowerQ.includes('走势') || lowerQ.includes('行情')) {
    return QUESTION_TYPE_PROMPTS.trend;
  }
  if (lowerQ.includes('推荐') || lowerQ.includes('买什么') || lowerQ.includes('投资建议')) {
    return QUESTION_TYPE_PROMPTS.recommend;
  }
  if (lowerQ.includes('风险') || lowerQ.includes('安全') || lowerQ.includes('会亏吗')) {
    return QUESTION_TYPE_PROMPTS.risk;
  }
  if (lowerQ.includes('搬砖') || lowerQ.includes('套利') || lowerQ.includes('价差')) {
    return QUESTION_TYPE_PROMPTS.arbitrage;
  }
  if (lowerQ.includes('持仓') || lowerQ.includes('仓位') || lowerQ.includes('组合')) {
    return QUESTION_TYPE_PROMPTS.portfolio;
  }
  if (lowerQ.includes('新手') || lowerQ.includes('入门') || lowerQ.includes('怎么开始')) {
    return QUESTION_TYPE_PROMPTS.beginner;
  }
  if (lowerQ.includes('什么意思') || lowerQ.includes('怎么看') || lowerQ.includes('如何理解')) {
    return QUESTION_TYPE_PROMPTS.explain;
  }

  // 默认：通用投资建议
  return QUESTION_TYPE_PROMPTS.recommend;
}

/**
 * 生成完整的 AI 请求消息
 */
export function buildAIMessages(
  userQuestion: string,
  marketData: MarketData,
  userContext?: {
    budget?: number;
    riskLevel?: 'low' | 'medium' | 'high';
    experience?: 'beginner' | 'intermediate' | 'expert';
    goals?: string;
  }
) {
  const messages: Array<{role: string; content: string}> = [
    {
      role: 'system',
      content: CORE_SYSTEM_PROMPT
    },
    {
      role: 'system',
      content: formatMarketContext(marketData)
    }
  ];

  // 添加用户背景信息
  if (userContext) {
    const contextStr = `
【用户信息】
投资预算：${userContext.budget ? `¥${userContext.budget}` : '未提供'}
风险偏好：${userContext.riskLevel === 'low' ? '保守型' : userContext.riskLevel === 'high' ? '激进型' : '稳健型'}
经验水平：${userContext.experience === 'beginner' ? '新手' : userContext.experience === 'expert' ? '资深玩家' : '中等经验'}
投资目标：${userContext.goals || '未提供'}
`;
    messages.push({
      role: 'system',
      content: contextStr
    });
  }

  // 添加针对性提示词
  const specificPrompt = selectPromptByQuestion(userQuestion);
  messages.push({
    role: 'system',
    content: `针对用户问题，请按以下要求回答：\n${specificPrompt}`
  });

  // 用户问题
  messages.push({
    role: 'user',
    content: userQuestion
  });

  return messages;
}

/**
 * 快捷问题模板
 */
export const QUICK_QUESTIONS = [
  {
    label: '当前市场趋势如何？',
    prompt: '请分析当前 CS:GO 饰品市场的整体趋势，包括各类别的表现、交易热度变化，以及未来 7-30 天的预测。'
  },
  {
    label: '推荐高性价比饰品',
    prompt: '我有 2000-5000 元预算，希望投资一些性价比高、风险较低的饰品。请推荐 3-5 个具体标的，说明推荐理由和预期收益。'
  },
  {
    label: '有哪些搬砖机会？',
    prompt: '请列出当前最佳的跨平台搬砖机会，要求价差超过 5%，并说明具体操作步骤和注意事项。'
  },
  {
    label: '如何分散投资降低风险？',
    prompt: '我想建立一个风险分散的投资组合，预算 10000 元。请提供资产配置建议，包括不同类别、价位的饰品比例。'
  },
  {
    label: '新手如何开始投资？',
    prompt: '我是 CS:GO 饰品投资新手，完全不了解市场。请提供入门指导，包括基础知识、平台选择、新手友好的投资标的。'
  },
  {
    label: '刀具值得投资吗？',
    prompt: '刀具价格较高但很受欢迎。请分析刀具类饰品的投资价值、风险因素、以及适合什么样的投资者。'
  },
  {
    label: '什么时候是买入好时机？',
    prompt: '请根据当前市场数据和历史趋势，分析现在是否是买入的好时机，以及应该重点关注哪些品类。'
  },
  {
    label: '如何设置止损点？',
    prompt: '我已经持有一些饰品，不知道如何设置止损点来控制风险。请教我如何根据市场情况制定止损策略。'
  }
];
