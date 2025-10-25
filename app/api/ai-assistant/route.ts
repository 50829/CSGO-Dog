import { NextRequest, NextResponse } from 'next/server';
import { generateMockMarketData } from '@/lib/marketData';
import { buildAIMessages } from '@/lib/aiPrompts';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { message, userContext } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: '请输入问题' },
        { status: 400 }
      );
    }

    const apiKey = process.env.SILICONFLOW_API_KEY;
    const model = process.env.SILICONFLOW_MODEL || 'deepseek-ai/DeepSeek-V3.2-Exp';
    const apiUrl = process.env.SILICONFLOW_API_URL || 'https://api.siliconflow.cn/v1/chat/completions';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key 未配置' },
        { status: 500 }
      );
    }

    // 获取实时市场数据 (开发阶段使用模拟数据)
    const marketData = generateMockMarketData();

    // 构建专业的 AI 消息
    const messages = buildAIMessages(message, marketData, userContext);

    // 调用 SiliconFlow API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('SiliconFlow API Error:', errorData);
      return NextResponse.json(
        { error: `API 调用失败: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '抱歉,无法生成回复';

    return NextResponse.json({
      response: aiResponse,
      usage: data.usage,
      marketDataTimestamp: marketData.timestamp,
    });

  } catch (error) {
    console.error('AI Assistant Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    );
  }
}
