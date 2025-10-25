# AI 投资助手设置指南

## ✅ 已完成的集成

### 1. API 配置
已在 `.env.local` 文件中配置 SiliconFlow API:
```
SILICONFLOW_API_KEY=sk-hxekvatjbvadrtwbtxlhkoazysfphupjflslaiytthqjgugs
SILICONFLOW_MODEL=deepseek-ai/DeepSeek-V3.2-Exp
SILICONFLOW_API_URL=https://api.siliconflow.cn/v1/chat/completions
```

### 2. API 路由
创建了 Next.js API 路由: `/app/api/ai-assistant/route.ts`
- ✅ Edge Runtime 支持
- ✅ 专业的系统提示词(CS:GO 饰品投资顾问)
- ✅ 错误处理和响应格式化
- ✅ 市场上下文传递支持

### 3. AI 助手组件
创建了浮动聊天窗口组件: `/components/AIAssistant.tsx`
- ✅ 右下角浮动按钮设计
- ✅ 现代化聊天界面
- ✅ 消息历史记录
- ✅ 快捷问题按钮
- ✅ 加载状态动画
- ✅ 实时滚动到最新消息
- ✅ 响应式设计

### 4. 主页集成
已集成到主页面 (`app/page.tsx`):
- ✅ 导入 AIAssistant 组件
- ✅ 移除旧的内联 AI 助手
- ✅ 在页面底部添加浮动按钮

## 🎨 UI 特性

### 浮动按钮
- 位置: 右下角固定
- 颜色: 荧光绿渐变 (与主题一致)
- 发光效果: drop-shadow
- 提示点: 红色脉冲圆点
- 图标: 聊天气泡

### 聊天窗口
- 尺寸: 宽 384px, 高 600px
- 背景: 深色主题 (--bg-1)
- 边框: 半透明白色
- 圆角: 大圆角设计
- 头部: 渐变背景显示标题和 DeepSeek 标识

### 消息样式
- 用户消息: 右对齐, 荧光绿背景
- AI 消息: 左对齐, 深色背景
- 时间戳: 每条消息下方显示
- 加载动画: 三个跳动的圆点

## 📋 功能特性

### 1. 快捷问题 (初次使用)
```
- 当前市场趋势如何?
- 推荐一些高收益低风险的饰品
- 如何分散投资降低风险?
- 什么时候是买入的好时机?
```

### 2. 智能对话
- 基于 DeepSeek-V3.2-Exp 模型
- 专业的 CS:GO 饰品市场知识
- 风险评估和投资建议
- 市场趋势分析
- 支持上下文传递

### 3. 用户体验
- ✅ 回车发送消息
- ✅ 自动滚动到最新消息
- ✅ 清空对话按钮
- ✅ 输入禁用状态 (加载时)
- ✅ 发送按钮图标

## 🚀 使用方法

### 启动应用
```bash
npm run dev
```

### 访问
打开浏览器访问: http://localhost:3000

### 使用 AI 助手
1. 点击右下角绿色浮动按钮
2. 选择快捷问题或输入自定义问题
3. 按回车或点击发送按钮
4. 等待 AI 回复
5. 继续对话或点击刷新图标清空对话

## 🔧 自定义配置

### 修改 API Key
编辑 `.env.local` 文件:
```env
SILICONFLOW_API_KEY=your-new-api-key
```

### 修改模型
编辑 `.env.local` 文件:
```env
SILICONFLOW_MODEL=另一个模型名称
```

### 修改系统提示词
编辑 `app/api/ai-assistant/route.ts` 文件中的 `systemPrompt` 变量

### 修改快捷问题
编辑 `components/AIAssistant.tsx` 文件中的 `quickQuestions` 数组

### 修改 UI 样式
组件使用 Tailwind CSS 和 CSS 变量:
- `--up`: 荧光绿色
- `--down`: 红色
- `--bg-0`: 纯黑背景
- `--bg-1`: 深灰背景
- `--bg-1-hover`: 悬停背景

## 📊 市场上下文支持

AI 助手支持接收市场上下文信息:
```typescript
<AIAssistantComponent 
  marketContext={{
    selectedItem: "AK-47 | 二西莫夫",
    currentPrice: 1280,
    priceChange: 15.5,
    platform: "BUFF",
  }}
/>
```

目前设置为 undefined (通用咨询模式)。如需启用,可在 `app/page.tsx` 中传递实际数据。

## 🐛 故障排除

### API 调用失败
- 检查 `.env.local` 文件是否存在
- 确认 API Key 是否正确
- 检查网络连接
- 查看浏览器控制台错误信息

### 组件不显示
- 清除浏览器缓存
- 重启开发服务器
- 检查控制台是否有 TypeScript 错误

### 样式问题
- 确保 Tailwind CSS 配置正确
- 检查 CSS 变量是否在 `globals.css` 中定义

## 📝 技术栈

- **前端框架**: Next.js 16.0.0 (App Router)
- **React**: 19.2.0
- **AI 模型**: DeepSeek-V3.2-Exp
- **API 提供商**: SiliconFlow
- **样式**: Tailwind CSS v4
- **图标**: Lucide React
- **类型检查**: TypeScript 5

## 🎯 下一步优化建议

1. **添加语音输入**: 集成语音识别 API
2. **消息导出**: 支持导出对话历史
3. **多语言支持**: 添加英文/日文等语言
4. **个性化设置**: 允许用户自定义主题和快捷问题
5. **历史记录**: 保存到 localStorage 或数据库
6. **实时市场数据**: 将实际市场数据传递给 AI
7. **图表分析**: AI 可以分析并生成图表
8. **通知系统**: 重要市场变化时推送通知

## 📞 支持

如遇问题,请检查:
1. Next.js 控制台输出
2. 浏览器开发者工具
3. `.env.local` 文件配置
4. API 请求/响应日志

---

**版本**: v1.0.0  
**更新时间**: 2025-10-26  
**作者**: CSGO-Dog Team
