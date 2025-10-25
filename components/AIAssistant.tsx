'use client';

import { useState, useRef, useEffect } from 'react';
import { QUICK_QUESTIONS } from '@/lib/aiPrompts';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  marketContext?: {
    selectedItem?: string;
    currentPrice?: number;
    priceChange?: number;
    platform?: string;
  };
}

export default function AIAssistant({ marketContext }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好!我是你的CS:GO饰品投资助手。我已接入实时市场数据,可以帮你分析市场趋势、评估投资风险、推荐投资策略。有什么我可以帮助你的吗?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // 用户偏好设置
  const [userContext, setUserContext] = useState({
    budget: 5000,
    riskLevel: 'medium' as 'low' | 'medium' | 'high',
    experience: 'intermediate' as 'beginner' | 'intermediate' | 'expert',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    // 添加用户消息
    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          userContext: userContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '请求失败');
      }

      // 添加AI回复
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('AI Assistant Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `抱歉,出现了错误: ${error instanceof Error ? error.message : '未知错误'}。请稍后再试。`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* 浮动按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-linear-to-br from-(--up) to-[#9dd628] shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        style={{
          filter: 'drop-shadow(0 0 8px rgba(188, 255, 47, 0.3))',
        }}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* 聊天窗口 */}
      {isOpen && (
        <div className="fixed bottom-24 right-8 z-50 w-96 h-[600px] bg-(--bg-1) rounded-2xl shadow-2xl flex flex-col border border-white/10 overflow-hidden">
          {/* 头部 */}
          <div className="bg-linear-to-r from-(--up)/10 to-[#9dd628]/10 px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">AI 投资助手</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  由 DeepSeek-V3.2 驱动 · 实时市场数据
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="用户设置"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => setMessages([messages[0]])}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="清空对话"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 用户设置面板 */}
            {showSettings && (
              <div className="mt-4 p-4 bg-(--bg-0) rounded-lg border border-white/10 space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-2">投资预算</label>
                  <select
                    value={userContext.budget}
                    onChange={(e) => setUserContext({...userContext, budget: Number(e.target.value)})}
                    className="w-full bg-(--bg-1) text-white text-sm rounded px-3 py-2 border border-white/10 focus:outline-none focus:border-(--up)/50"
                  >
                    <option value={1000}>¥1,000</option>
                    <option value={3000}>¥3,000</option>
                    <option value={5000}>¥5,000</option>
                    <option value={10000}>¥10,000</option>
                    <option value={20000}>¥20,000</option>
                    <option value={50000}>¥50,000+</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-2">风险偏好</label>
                  <select
                    value={userContext.riskLevel}
                    onChange={(e) => setUserContext({...userContext, riskLevel: e.target.value as any})}
                    className="w-full bg-(--bg-1) text-white text-sm rounded px-3 py-2 border border-white/10 focus:outline-none focus:border-(--up)/50"
                  >
                    <option value="low">保守型 (低风险)</option>
                    <option value="medium">稳健型 (中风险)</option>
                    <option value="high">激进型 (高风险)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-2">经验水平</label>
                  <select
                    value={userContext.experience}
                    onChange={(e) => setUserContext({...userContext, experience: e.target.value as any})}
                    className="w-full bg-(--bg-1) text-white text-sm rounded px-3 py-2 border border-white/10 focus:outline-none focus:border-(--up)/50"
                  >
                    <option value="beginner">新手</option>
                    <option value="intermediate">中等经验</option>
                    <option value="expert">资深玩家</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-(--up)/20 text-white border border-(--up)/30'
                      : 'bg-(--bg-0) text-gray-200 border border-white/10'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {msg.timestamp.toLocaleTimeString('zh-CN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-(--bg-0) border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-(--up) rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-(--up) rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-(--up) rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 快捷问题 */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-400 mb-2">💡 热门问题 (点击快速提问):</p>
              <div className="space-y-2">
                {QUICK_QUESTIONS.slice(0, 4).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSend(question.prompt)}
                    disabled={isLoading}
                    className="w-full text-xs text-left px-3 py-2.5 bg-(--bg-0) hover:bg-(--bg-1-hover) border border-white/10 rounded-lg transition-colors text-gray-300 hover:text-white disabled:opacity-50 flex items-center gap-2"
                  >
                    <span className="text-base">{['📈', '💎', '🔄', '🛡️'][index]}</span>
                    <span>{question.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 输入框 */}
          <div className="px-4 py-4 border-t border-white/10 bg-(--bg-0)">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入你的问题..."
                disabled={isLoading}
                className="flex-1 bg-(--bg-1) border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-(--up)/50 disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="bg-linear-to-r from-(--up) to-[#9dd628] hover:from-[#9dd628] hover:to-(--up) disabled:from-gray-600 disabled:to-gray-700 text-black font-medium px-6 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
