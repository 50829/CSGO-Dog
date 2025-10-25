"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";

// CSGO-Dog Dashboard
// Single-file React component using Tailwind CSS classes.
// Notes:
// - Replace `fetchMarketData()` with real API calls to https://steamdt.com/mkt
// - Replace `generateAIPrediction()` with real AI model / inference endpoint
// - Tailwind color tokens are provided via CSS variables at the top so you can map them

export default function CSGODogDashboard() {
  // --- styling variables (Tailwind can pick these up if you map them in your Tailwind config) ---
  // We'll set CSS variables inline for immediate use.

  // --- mock market data (time series for a single weapon) ---
  const [marketSeries, setMarketSeries] = useState([]);
  const [popularWeapons, setPopularWeapons] = useState([]);
  const [strategy, setStrategy] = useState(50); // 0 - 100: stable -> aggressive
  const [totalCapital, setTotalCapital] = useState(1000);
  const [positionAdvice, setPositionAdvice] = useState([]);
  const [bottomPicks, setBottomPicks] = useState([]);
  const [arbitrageList, setArbitrageList] = useState([]);
  const [community, setCommunity] = useState([]);
  const [aiAssistantMessages, setAiAssistantMessages] = useState([
    { from: "ai", text: "你好，我是AI助手。问我关于建仓、套利或预测的问题！" },
  ]);
  const [aiQuery, setAiQuery] = useState("");

  // Simulate fetching data on mount
  useEffect(() => {
    const now = Date.now();
    // create mock 30 days data
    const series = new Array(30).fill(0).map((_, i) => {
      const t = new Date(now - (29 - i) * 24 * 3600 * 1000);
      const price = 50 + Math.sin(i / 3) * 3 + i * 0.2 + (Math.random() - 0.5) * 1.5;
      return { date: t.toISOString().slice(0, 10), price: Number(price.toFixed(2)) };
    });
    setMarketSeries(series);

    // popular weapons mock
    setPopularWeapons([
      {
        id: "ak-47",
        name: "AK-47 | Redline",
        marketCap: 124000,
        change24h: 2.5,
        history: series.slice().map((p, idx) => ({ date: p.date, price: p.price - idx * 0.1 })),
      },
      {
        id: "m4a1",
        name: "M4A1-S | Chantico",
        marketCap: 94000,
        change24h: -1.2,
        history: series.slice().map((p, idx) => ({ date: p.date, price: p.price + idx * 0.05 })),
      },
      {
        id: "awp",
        name: "AWP | Asiimov",
        marketCap: 212000,
        change24h: 4.8,
        history: series.slice().map((p, idx) => ({ date: p.date, price: p.price + Math.sin(idx/4)*2 })),
      },
    ]);

    // bottom picks mock
    setBottomPicks([
      { id: "p1", name: "USP-S | Cortex", score: 0.92, price: 12.5, change: -4.2 },
      { id: "p2", name: "Desert Eagle | Blaze", score: 0.87, price: 45.0, change: -6.3 },
    ]);

    // arbitrage mock
    setArbitrageList([
      { weapon: "AK-47 | Redline", platformA: "steamdt", priceA: 52.3, platformB: "otherex", priceB: 47.9 },
      { weapon: "AWP | Asiimov", platformA: "steamdt", priceA: 230.0, platformB: "marketX", priceB: 210.5 },
    ]);

    // community mock
    setCommunity([
      { id: 1, user: "玩家A", text: "刚入手了一把AWP，感觉要涨！", time: "2h" },
      { id: 2, user: "玩家B", text: "推荐抄底 USP-S，最近跌多了。", time: "5h" },
    ]);
  }, []);

  // --- simple AI prediction: linear extrapolation of last 7 days slope ---
  function generateAIPrediction(series, daysAhead = 7) {
    if (!series || series.length < 2) return [];
    const lastN = 7;
    const slice = series.slice(-lastN);
    const xs = slice.map((_, i) => i);
    const ys = slice.map((d) => d.price);
    // linear regression slope
    const n = xs.length;
    const xMean = xs.reduce((a, b) => a + b, 0) / n;
    const yMean = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0,
      den = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - xMean) * (ys[i] - yMean);
      den += (xs[i] - xMean) * (xs[i] - xMean);
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = yMean - slope * xMean;

    const lastDate = new Date(series[series.length - 1].date);
    const predictions = [];
    for (let i = 1; i <= daysAhead; i++) {
      const nextIndex = xs.length + (i - 1);
      const pred = intercept + slope * nextIndex;
      const d = new Date(lastDate.getTime() + i * 24 * 3600 * 1000);
      predictions.push({ date: d.toISOString().slice(0, 10), price: Number(pred.toFixed(2)) });
    }
    return predictions;
  }

  const aiPrediction = useMemo(() => generateAIPrediction(marketSeries, 7), [marketSeries]);

  // merge real + ai for charting
  const chartData = useMemo(() => {
    const real = marketSeries.map((p) => ({ date: p.date, real: p.price }));
    const predict = aiPrediction.map((p) => ({ date: p.date, predict: p.price }));
    // pad combined array: keep real then prediction
    return [...real, ...predict];
  }, [marketSeries, aiPrediction]);

  // --- position advice generator (simple heuristic) ---
  function generatePositionAdvice() {
    // strategy 0..100 maps to allocation risk
    const riskFactor = strategy / 100; // 0 stable, 1 aggressive
    // take top 3 popular weapons and allocate
    const tops = popularWeapons.slice(0, 3);
    const base = totalCapital * (0.4 + 0.6 * riskFactor); // more risk -> more capital used
    const advice = tops.map((w, i) => {
      const weight = 1 / (i + 1); // heavier to top
      const alloc = (base * weight) / (1 + 1 / (i + 1));
      return {
        id: w.id,
        name: w.name,
        allocation: Number(alloc.toFixed(2)),
        suggestedUnits: Number((alloc / (w.history[w.history.length - 1].price || 1)).toFixed(2)),
      };
    });
    setPositionAdvice(advice);
  }

  // --- bottom picks generator (already mocked) ---

  // --- arbitrage sorting ---
  useEffect(() => {
    const sorted = arbitrageList
      .slice()
      .map((a) => ({ ...a, diff: Number(((a.platformA ? a.priceA : 0) - (a.platformB ? a.priceB : 0)).toFixed(2)) }))
      .sort((x, y) => y.diff - x.diff);
    setArbitrageList(sorted);
  }, []);

  // --- AI assistant (very simple simulated) ---
  function askAI() {
    if (!aiQuery.trim()) return;
    const userMsg = { from: "user", text: aiQuery };
    setAiAssistantMessages((m) => [...m, userMsg]);

    // simulate response
    const lower = aiQuery.toLowerCase();
    let resp = "抱歉，我需要更多数据来给出精确建议。你可以尝试点击 '生成建仓建议'。";
    if (lower.includes("抄底") || lower.includes("底")) {
      resp = "AI建议信号：USP-S 和 Desert Eagle 在过去7天出现超跌。若你的风险偏好较低，可先小仓位试探。";
    } else if (lower.includes("套利") || lower.includes("差价")) {
      resp = "建议查看平台差价第一位的武器，计算手续费后仍有 >3% 差价则可考虑跨平台挂单套利。";
    } else if (lower.includes("建仓")) {
      resp = "基于当前策略，推荐：30% 头部流动性（AWP/AK），50% 中坚（M4/USP），20% 抄底小仓。";
    }

    setTimeout(() => {
      setAiAssistantMessages((m) => [...m, { from: "ai", text: resp }]);
    }, 500);

    setAiQuery("");
  }

  return (
    <div
      className="min-h-screen text-gray-200"
      style={{ background: "var(--bg-0)", color: "#e6e6e6" }}
    >
      <style>{`
        :root{
          --bg-0: #000000;
          --bg-1: #121212;
          --bg-1-hover: #191919;
          --up: #25A750;
          --down: #CA3F64;
        }
        /* small helpers for dashed predicted line */
      `}</style>

      {/* Top navigation */}
      <header className="w-full border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center font-bold">CS</div>
            <div className="text-xl font-semibold">CSGO-Dog</div>
            <div className="ml-4 text-sm text-gray-400">基于 steamdt.com/mkt 的价格与AI预测</div>
          </div>
          <nav className="flex items-center gap-4 text-sm text-gray-300">
            <a className="px-3 py-2 rounded hover:bg-(--bg-1-hover)">市场</a>
            <a className="px-3 py-2 rounded hover:bg-(--bg-1-hover)">套利</a>
            <a className="px-3 py-2 rounded hover:bg-(--bg-1-hover)">社区</a>
            <button className="px-3 py-2 rounded bg-white/6">连接钱包</button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-4">
        {/* First row: big chart left, popular list right */}
        <section className="grid grid-cols-3 gap-4">
          {/* Left: big gun curve */}
          <div className="col-span-2 bg-(--bg-1) rounded-2xl p-4">
            <h3 className="text-lg font-semibold mb-2">当前武器走势与 AI 7 天预测</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="h-64 bg-(--bg-1-hover) rounded p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <defs>
                        <linearGradient id="gradUp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--up)" stopOpacity={0.12} />
                          <stop offset="100%" stopColor="var(--up)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.04} />
                      <XAxis dataKey="date" hide />
                      <YAxis domain={["auto", "auto"]} width={80} />
                      <Tooltip
                        contentStyle={{ background: "#0b0b0b" }}
                        labelStyle={{ color: "#bbb" }}
                        formatter={(value, name) => [value, name === "real" ? "现价" : "AI预测"]}
                      />
                      {/* real data - solid */}
                      <Line
                        type="monotone"
                        dataKey="real"
                        stroke="var(--up)"
                        strokeWidth={2.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                      {/* predicted - dashed */}
                      <Line
                        type="monotone"
                        dataKey="predict"
                        stroke="var(--up)"
                        strokeDasharray="6 6"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between mt-3 text-sm text-gray-400">
                  <div>数据来源：steamdt.com/mkt（示例）</div>
                  <div>最后更新时间：{marketSeries.length ? marketSeries[marketSeries.length - 1].date : "--"}</div>
                </div>
              </div>

              {/* Right: popular weapons */}
              <div className="w-80 bg-(--bg-1-hover) rounded p-3">
                <h4 className="font-medium mb-3">热门枪支</h4>
                <div className="space-y-3">
                  {popularWeapons.map((w) => (
                    <div key={w.id} className="p-2 rounded hover:bg-black/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{w.name}</div>
                          <div className="text-xs text-gray-400">市值：{w.marketCap.toLocaleString()} | 24h {w.change24h}%</div>
                        </div>
                        <div className="w-28 h-12">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={w.history}>
                              <Line dataKey="price" dot={false} stroke={w.change24h >= 0 ? "var(--up)" : "var(--down)"} strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Second block: position advice (single column on right of top row) */}
          <div className="bg-(--bg-1) rounded-2xl p-4">
            <h3 className="font-semibold mb-2">仓位建议</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">策略：稳定 — 激进</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={strategy}
                  onChange={(e) => setStrategy(Number(e.target.value))}
                  className="w-full mt-2"
                />
                <div className="text-xs text-gray-400">当前：{strategy} （稳定 0 — 100 激进）</div>
              </div>

              <div>
                <label className="text-sm text-gray-400">总资金（USD）</label>
                <input
                  type="number"
                  value={totalCapital}
                  onChange={(e) => setTotalCapital(Number(e.target.value))}
                  className="w-full mt-2 p-2 rounded bg-black/30"
                />
              </div>

              <div className="flex gap-2">
                <button
                  className="flex-1 py-2 rounded bg-(--up) text-black font-semibold"
                  onClick={generatePositionAdvice}
                >
                  生成建仓建议
                </button>
                <button
                  className="flex-1 py-2 rounded border border-white/10"
                  onClick={() => {
                    setStrategy(50);
                    setTotalCapital(1000);
                  }}
                >
                  重置
                </button>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-2">建议分配</div>
                <div className="space-y-2">
                  {positionAdvice.length === 0 && <div className="text-xs text-gray-500">尚未生成建议。</div>}
                  {positionAdvice.map((p) => (
                    <div key={p.id} className="p-2 rounded bg-black/20 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-gray-400">建议投入：${p.allocation} · 单位：{p.suggestedUnits}</div>
                      </div>
                      <div className="text-sm text-gray-100">仓位</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Third row: bottom picks (two columns) */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-(--bg-1) rounded-2xl p-4">
            <h3 className="font-semibold mb-2">抄底预测 — 推荐 A</h3>
            <div className="space-y-3">
              {bottomPicks.slice(0, 1).map((b) => (
                <div key={b.id} className="p-3 rounded bg-(--bg-1-hover)">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{b.name}</div>
                      <div className="text-xs text-gray-400">潜力分：{b.score} · 当前价：${b.price} · 近一周 {b.change}%</div>
                    </div>
                    <div className="text-sm">建议：小仓试探</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-(--bg-1) rounded-2xl p-4">
            <h3 className="font-semibold mb-2">抄底预测 — 推荐 B</h3>
            <div className="space-y-3">
              {bottomPicks.slice(1, 2).map((b) => (
                <div key={b.id} className="p-3 rounded bg-(--bg-1-hover)">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{b.name}</div>
                      <div className="text-xs text-gray-400">潜力分：{b.score} · 当前价：${b.price} · 近一周 {b.change}%</div>
                    </div>
                    <div className="text-sm">建议：中等仓位</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fourth row: arbitrage, community, AI assistant — each full width stacked (一行只有一块) */}
        <section className="space-y-4">
          <div className="bg-(--bg-1) rounded-2xl p-4">
            <h3 className="font-semibold mb-2">平台差价排行（性价比）</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-gray-400">
                  <tr>
                    <th className="py-2">武器</th>
                    <th>平台 A</th>
                    <th>平台 B</th>
                    <th>差价</th>
                  </tr>
                </thead>
                <tbody>
                  {arbitrageList.map((a) => (
                    <tr key={a.weapon} className="border-t border-white/5">
                      <td className="py-3">{a.weapon}</td>
                      <td>{a.platformA} ${a.priceA}</td>
                      <td>{a.platformB} ${a.priceB}</td>
                      <td className={a.diff >= 0 ? "text-(--up)" : "text-(--down)"}>{a.diff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-(--bg-1) rounded-2xl p-4">
            <h3 className="font-semibold mb-2">社区动态</h3>
            <div className="space-y-2">
              {community.map((c) => (
                <div key={c.id} className="p-3 rounded bg-(--bg-1-hover) flex justify-between">
                  <div>
                    <div className="font-medium">{c.user}</div>
                    <div className="text-sm text-gray-300">{c.text}</div>
                  </div>
                  <div className="text-xs text-gray-400">{c.time}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-(--bg-1) rounded-2xl p-4">
            <h3 className="font-semibold mb-2">AI 助手</h3>
            <div className="space-y-3">
              <div className="max-h-48 overflow-auto p-2 bg-(--bg-1-hover) rounded">
                {aiAssistantMessages.map((m, idx) => (
                  <div key={idx} className={`mb-2 ${m.from === "ai" ? "text-left" : "text-right"}`}>
                    <div className={`inline-block p-2 rounded ${m.from === "ai" ? "bg-black/40" : "bg-white/8"}`}>{m.text}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  className="flex-1 p-2 rounded bg-black/20"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="向 AI 提问：例如 '推荐建仓'、'有哪些套利'..."
                />
                <button className="px-4 py-2 rounded bg-(--up) text-black" onClick={askAI}>
                  发送
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer className="text-center text-xs text-gray-500 py-6">© CSGO-Dog — 示例界面，数据为模拟。接入真实 API 与 AI 模型以部署生产环境。</footer>
      </main>
    </div>
  );
}
