'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import PageLayout from '@/components/PageLayout';
import { getDoubanCategories } from '@/lib/douban.client';
import { Shuffle } from "lucide-react";
import {
  clearAllFavorites,
  clearAllPlayRecords,
  getAllFavorites,
  getAllPlayRecords,
  getSearchHistory,
  saveFavorite,
  savePlayRecord,
} from '@/lib/db.client';

export default function MiscPage() {
  const router = useRouter();

  // 1) 电视剧转盘（使用真实存在的剧名）
  const [tvTitles, setTvTitles] = useState<string[]>([]);
  const [loadingTV, setLoadingTV] = useState(false);
  const [region, setRegion] = useState<
    "tv" | "tv_domestic" | "tv_american" | "tv_japanese" | "tv_korean" | "tv_animation"
  >("tv");

  const regionOptions: Array<{ label: string; value: typeof region }> = [
    { label: "全部", value: "tv" },
    { label: "国产", value: "tv_domestic" },
    { label: "欧美", value: "tv_american" },
    { label: "日本", value: "tv_japanese" },
    { label: "韩国", value: "tv_korean" },
    { label: "动漫", value: "tv_animation" },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingTV(true);
        // 扩大候选集：并行拉取多页（6 页 x 25 = 150 条）
        const starts = [0, 25, 50, 75, 100, 125];
        const results = await Promise.all(
          starts.map((start) =>
            getDoubanCategories({
              kind: "tv",
              category: "tv",
              type: region,
              pageLimit: 25,
              pageStart: start,
            })
          )
        );
        const titles = results
          .flatMap((r) => r.list || [])
          .map((i) => i.title)
          .filter(Boolean);
        // 去重
        const unique = Array.from(new Set(titles));
        if (unique.length > 0) setTvTitles(unique);
      } catch (e) {
        // 忽略错误，使用本地兜底
      } finally {
        setLoadingTV(false);
      }
    };
    load();
  }, [region]);

  const fallbackTVs = useMemo(
    () => [
      "三体",
      "狂飙",
      "漫长的季节",
      "黑暗荣耀",
      "庆余年",
      "请回答1988",
      "权力的游戏",
      "绝命毒师",
      "纸牌屋",
      "良医",
      "陈情令",
      "琅琊榜",
      "甄嬛传",
      "沉默的真相",
      "开端",
    ],
    []
  );

  const [spinning, setSpinning] = useState(false);
  const fallbackKeywords = [
    "科幻",
    "动作",
    "爱情",
    "悬疑",
    "喜剧",
    "动画",
    "犯罪",
    "冒险",
  ];

  function cleanTitle(raw: string): string {
    let q = raw
      .replace(/第[一二三四五六七八九十0-9]+季/g, "")
      .replace(/第[一二三四五六七八九十0-9]+部/g, "")
      .replace(/Season\s*\d+/gi, "")
      .replace(/S\d+/gi, "")
      .replace(/[·・.:：!！?？、，,。()（）《》<>“”"'’]/g, " ")
      .trim();
    // 取空格前的主标题
    const space = q.indexOf(" ");
    if (space > 0) q = q.slice(0, space);
    return q;
  }

  async function getSearchCount(keyword: string): Promise<number> {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`, {
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!res.ok) return 0;
      const data = await res.json();
      return Array.isArray(data.results) ? data.results.length : 0;
    } catch {
      return 0;
    }
  }

  const handleRoulette = async () => {
    if (spinning) return;
    setSpinning(true);
    try {
      const pool = (tvTitles.length > 0 ? tvTitles : fallbackTVs).slice();
      // 打乱顺序
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }

      const maxTry = Math.min(pool.length, 12);
      for (let i = 0; i < maxTry; i++) {
        const cand = pool[i];
        if (!cand) continue;
        // 先用原名试
        let cnt = await getSearchCount(cand);
        if (cnt > 0) {
          router.push(`/search?q=${encodeURIComponent(cand)}`);
          return;
        }
        // 再用清洗后的关键词试
        const cleaned = cleanTitle(cand);
        if (cleaned && cleaned !== cand) {
          cnt = await getSearchCount(cleaned);
          if (cnt > 0) {
            router.push(`/search?q=${encodeURIComponent(cleaned)}`);
            return;
          }
        }
      }
      // 兜底：热门关键词
      const kw = fallbackKeywords[Math.floor(Math.random() * fallbackKeywords.length)];
      router.push(`/search?q=${encodeURIComponent(kw)}`);
    } finally {
      setSpinning(false);
    }
  };

  // 2) 点击触发的彩蛋：飘落彩色“DevKuro”
  const spawningRef = useRef(false);
  const [dkCount, setDkCount] = useState(36);
  const [dkDur, setDkDur] = useState(3600);

  // 注入一次性的样式，提升观感
  function ensureConfettiStyles() {
    const id = 'dk-confetti-style';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes dk-fall {
        0% { transform: translate3d(var(--dk-x,0), -12vh, 0) rotate(0deg) scale(var(--dk-scale,1)); opacity: 0; }
        10% { opacity: .95; }
        50% { transform: translate3d(calc(var(--dk-x,0) + var(--dk-sway,0)), 50vh, 0) rotate(var(--dk-rot1, 0deg)) scale(var(--dk-scale,1)); }
        100% { transform: translate3d(calc(var(--dk-x,0) + var(--dk-drift,0)), 110vh, 0) rotate(var(--dk-rot2, 0deg)) scale(var(--dk-scale,1)); opacity: .9; }
      }
      @keyframes dk-gradient {
        0% { background-position: 0% 50%; }
        100% { background-position: 100% 50%; }
      }
      @keyframes dk-hue { from { filter: hue-rotate(0deg); } to { filter: hue-rotate(360deg); } }
      .dk-confetti-overlay{ position:fixed; inset:0; pointer-events:none; z-index:9999; overflow:hidden; }
      .dk-chip{ position:absolute; top:-10vh; left:0; font-weight:900; letter-spacing:.5px; will-change:transform, opacity; 
        -webkit-text-stroke: .5px rgba(0,0,0,.15); text-shadow: 0 2px 8px rgba(0,0,0,.18); will-change: background-position, filter; }
    `;
    document.head.appendChild(style);
  }

  const fireDevKuro = (count = 36, baseDuration = 3600) => {
    if (spawningRef.current) return;
    spawningRef.current = true;

    ensureConfettiStyles();

    // 容器（一次多发，动画更顺滑）
    const overlay = document.createElement('div');
    overlay.className = 'dk-confetti-overlay';
    document.body.appendChild(overlay);

    let longest = 0;
    for (let i = 0; i < count; i++) {
      const chip = document.createElement('span');
      chip.className = 'dk-chip';
      chip.textContent = 'DevKuro';

      // 渐变填充文字
      const h1 = Math.floor(Math.random() * 360);
      const h2 = (h1 + 60 + Math.random() * 80) % 360;
      chip.style.background = `linear-gradient(90deg, hsl(${h1} 90% 60%), hsl(${h2} 90% 55%))`;
      chip.style.webkitBackgroundClip = 'text';
      (chip.style as any).backgroundClip = 'text';
      (chip.style as any).webkitTextFillColor = 'transparent';

      // 随机尺寸与起始横向
      const scale = 0.7 + Math.random() * 1.1;
      const startX = Math.floor(Math.random() * 100 - 5); // 允许越界一点
      const sway = Math.floor((Math.random() - 0.5) * 120);
      const drift = Math.floor((Math.random() - 0.5) * 280);
      const rot1 = Math.floor((Math.random() - 0.5) * 140);
      const rot2 = rot1 + Math.floor((Math.random() - 0.5) * 160);

      const duration = Math.max(1200, Math.round(baseDuration * (0.9 + Math.random() * 0.5)));
      const delay = Math.random() * 300; // 轻微错峰
      longest = Math.max(longest, duration + delay);

      chip.style.setProperty('--dk-scale', String(scale));
      chip.style.setProperty('--dk-x', startX + 'vw');
      chip.style.setProperty('--dk-sway', sway + 'px');
      chip.style.setProperty('--dk-drift', drift + 'px');
      chip.style.setProperty('--dk-rot1', rot1 + 'deg');
      chip.style.setProperty('--dk-rot2', rot2 + 'deg');
      chip.style.fontSize = `${12 + Math.random() * 14}pt`;
      chip.style.left = startX + 'vw';
      const gradMs = Math.max(1600, Math.round(duration * (0.7 + Math.random() * 0.4)));
      const hueMs = Math.max(1800, Math.round(duration * (0.8 + Math.random() * 0.6)));
      chip.style.backgroundSize = '200% 200%';
      chip.style.animation = `dk-fall ${duration}ms cubic-bezier(.2,.8,.2,1) ${delay}ms both, dk-gradient ${gradMs}ms linear ${delay}ms infinite alternate, dk-hue ${hueMs}ms linear ${delay}ms infinite`;

      overlay.appendChild(chip);
    }

    // 结束后移除容器
    setTimeout(() => {
      overlay.remove();
      spawningRef.current = false;
    }, longest + 100);
  };

  // 辅助：导出多格式
  async function exportData(format: 'json' | 'txt' | 'csv' | 'doc') {
    const [fav, pr, hist] = await Promise.all([
      getAllFavorites(),
      getAllPlayRecords(),
      getSearchHistory(),
    ]);

    const download = (blob: Blob, filename: string) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    };

    if (format === 'json') {
      const blob = new Blob([
        JSON.stringify({ favorites: fav, playRecords: pr, searchHistory: hist }, null, 2),
      ], { type: 'application/json' });
      return download(blob, `kurotv-data-${Date.now()}.json`);
    }

    if (format === 'txt') {
      const lines: string[] = [];
      lines.push('# 收藏');
      Object.entries(fav).forEach(([key, v]: any) => {
        lines.push(`${key}\t${v.title}\t${v.year || ''}\t${v.total_episodes || ''}`);
      });
      lines.push('\n# 播放记录');
      Object.entries(pr).forEach(([key, v]: any) => {
        lines.push(
          `${key}\t${v.title}\t第${v.index}集\t${v.play_time}/${v.total_time}\t${v.year || ''}`
        );
      });
      lines.push('\n# 搜索历史');
      (hist || []).forEach((k) => lines.push(String(k)));
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      return download(blob, `kurotv-data-${Date.now()}.txt`);
    }

    if (format === 'csv') {
      const rows: string[] = [];
      rows.push('type,source,id,title,year,episodes,index,play_time,total_time,save_time');
      Object.entries(fav).forEach(([key, v]: any) => {
        const plus = key.indexOf('+');
        const src = key.slice(0, plus);
        const id = key.slice(plus + 1);
        const row = [
          'favorite',
          src,
          id,
          v.title,
          v.year || '',
          v.total_episodes || '',
          '',
          '',
          '',
          v.save_time || '',
        ]
          .map(csv)
          .join(',');
        rows.push(row);
      });
      Object.entries(pr).forEach(([key, v]: any) => {
        const plus = key.indexOf('+');
        const src = key.slice(0, plus);
        const id = key.slice(plus + 1);
        const row = [
          'record',
          src,
          id,
          v.title,
          v.year || '',
          v.total_episodes || '',
          v.index || '',
          v.play_time || '',
          v.total_time || '',
          v.save_time || '',
        ]
          .map(csv)
          .join(',');
        rows.push(row);
      });
      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
      return download(blob, `kurotv-data-${Date.now()}.csv`);
    }

    if (format === 'doc') {
      const esc = (s: string) => (s || '').replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]!));
      const favRows = Object.entries(fav)
        .map(([key, v]: any) => {
          const plus = key.indexOf('+');
          const src = key.slice(0, plus);
          const id = key.slice(plus + 1);
          return `<tr><td>收藏</td><td>${esc(src)}</td><td>${esc(id)}</td><td>${esc(v.title)}</td><td>${esc(v.year || '')}</td><td>${v.total_episodes || ''}</td></tr>`;
        })
        .join('');
      const recRows = Object.entries(pr)
        .map(([key, v]: any) => {
          const plus = key.indexOf('+');
          const src = key.slice(0, plus);
          const id = key.slice(plus + 1);
          return `<tr><td>记录</td><td>${esc(src)}</td><td>${esc(id)}</td><td>${esc(v.title)}</td><td>${esc(v.year || '')}</td><td>${v.index || ''}</td><td>${v.play_time || ''}/${v.total_time || ''}</td></tr>`;
        })
        .join('');
      const histRows = (hist || []).map((k) => `<li>${esc(String(k))}</li>`).join('');
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body{font-family:Arial,Helvetica,'PingFang SC','Microsoft YaHei','Segoe UI',sans-serif;}
        h1{color:#16a34a}
        table{width:100%;border-collapse:collapse;margin:10px 0}
        td,th{border:1px solid #ddd;padding:6px;font-size:12px}
        th{background:#f3f4f6}
      </style></head><body>
      <h1>KuroTV 导出</h1>
      <h3>列表</h3>
      <table><tr><th>类型</th><th>源</th><th>ID</th><th>标题</th><th>年份</th><th>其他</th></tr>${favRows}${recRows}</table>
      <h3>搜索历史</h3>
      <ul>${histRows}</ul>
      </body></html>`;
      const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
      return download(blob, `kurotv-data-${Date.now()}.doc`);
    }
  }

  function csv(v: any): string {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  return (
    <PageLayout activePath="/misc">
      <div className="px-4 sm:px-10 py-8 space-y-8">
        <h1 className="text-2xl font-bold">玩趣</h1>

        {/* 电视剧转盘 */}
        <section className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-zinc-900/40 backdrop-blur p-5 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">电视剧转盘</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {loadingTV ? "正在获取热门剧…" : "随机挑一个真实剧名，直达搜索页"}
              </p>
            </div>
            <button
              onClick={handleRoulette}
              className="inline-flex items-center rounded-lg bg-gradient-to-r from-green-600 to-blue-600 px-4 py-2 text-white shadow-md hover:opacity-95"
            >
              {spinning ? (
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Shuffle className="mr-2 h-4 w-4" />
              )}
              {spinning ? "搜索中…" : "开始抽取"}
            </button>
          </div>
          {/* 地区筛选 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {regionOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRegion(opt.value)}
                className={`px-3 py-1.5 rounded-full text-sm border shadow-sm transition ${
                  region === opt.value
                    ? "bg-gradient-to-r from-green-600 to-blue-600 text-white border-transparent shadow-md"
                    : "bg-white/70 dark:bg-zinc-800/40 text-gray-700 dark:text-gray-200 border-gray-200/60 dark:border-gray-700/60 hover:bg-white/90 dark:hover:bg-zinc-800/60"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* 数据玩具 */}
        <section className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-zinc-900/40 backdrop-blur p-5 shadow-lg">
          <h2 className="text-lg font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">数据玩具</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={async () => await exportData('json')}
              className="px-3 py-1.5 rounded-md border hover:bg-gray-50 dark:hover:bg-zinc-800"
            >导出 JSON</button>
            <button
              onClick={async () => await exportData('txt')}
              className="px-3 py-1.5 rounded-md border hover:bg-gray-50 dark:hover:bg-zinc-800"
            >导出 TXT</button>
            <button
              onClick={async () => await exportData('csv')}
              className="px-3 py-1.5 rounded-md border hover:bg-gray-50 dark:hover:bg-zinc-800"
            >导出 Excel(CSV)</button>
            <button
              onClick={async () => await exportData('doc')}
              className="px-3 py-1.5 rounded-md border hover:bg-gray-50 dark:hover:bg-zinc-800"
            >导出 Word(DOC)</button>
            <label className="px-3 py-1.5 rounded-md border hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer">
              导入数据
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const text = await file.text();
                    const data = JSON.parse(text) as any;
                    if (data?.favorites) {
                      const entries = Object.entries(data.favorites) as [string, any][];
                      for (const [key, fav] of entries) {
                        const plus = key.indexOf('+');
                        if (plus > 0) {
                          const src = key.slice(0, plus);
                          const id = key.slice(plus + 1);
                          await saveFavorite(src, id, fav);
                        }
                      }
                    }
                    if (data?.playRecords) {
                      const entries = Object.entries(data.playRecords) as [string, any][];
                      for (const [key, rec] of entries) {
                        const plus = key.indexOf('+');
                        if (plus > 0) {
                          const src = key.slice(0, plus);
                          const id = key.slice(plus + 1);
                          await savePlayRecord(src, id, rec);
                        }
                      }
                    }
                    alert('导入完成');
                  } catch (err) {
                    alert('导入失败: ' + (err as Error).message);
                  }
                }}
              />
            </label>
            <button
              onClick={async () => {
                if (!confirm('确认清空收藏与播放记录？此操作不可撤销')) return;
                await Promise.all([clearAllFavorites(), clearAllPlayRecords()]);
                alert('已清空');
              }}
              className="px-3 py-1.5 rounded-md border text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >清空收藏与播放记录</button>
          </div>
        </section>

        {/* 源站体检 */}
        <section className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-zinc-900/40 backdrop-blur p-5 shadow-lg">
          <h2 className="text-lg font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">源站体检</h2>
          <button
            onClick={async () => {
              const res = await fetch('/api/search?q=测试');
              if (res.ok) {
                const data = await res.json();
                alert(`已体检：返回 ${Array.isArray(data.results) ? data.results.length : 0} 条样本。\n详细评分与禁用开关可后续增强。`);
              } else {
                alert('体检失败');
              }
            }}
            className="px-3 py-1.5 rounded-md border hover:bg-gray-50 dark:hover:bg-zinc-800"
          >开始体检（基础版）</button>
        </section>

        {/* 一键刷新 */}
        <section className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-zinc-900/40 backdrop-blur p-5 shadow-lg">
          <h2 className="text-lg font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">一键刷新</h2>
          <button
            onClick={async () => {
              const t0 = Date.now();
              const res = await fetch('/api/cron');
              const t1 = Date.now();
              if (res.ok) {
                const data = await res.json();
                alert(`刷新成功，用时 ${(t1 - t0) / 1000}s\n${data.message || ''}`);
              } else {
                alert('刷新失败');
              }
            }}
            className="px-3 py-1.5 rounded-md border hover:bg-gray-50 dark:hover:bg-zinc-800"
          >执行刷新</button>
        </section>

        {/* 彩蛋工作室（参数化） */}
        <section className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-zinc-900/40 backdrop-blur p-5 shadow-lg">
          <h2 className="text-lg font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">彩蛋工作室</h2>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-600 dark:text-gray-300">数量</span>
              {[12, 24, 36, 60, 90].map((n) => (
                <button
                  key={n}
                  onClick={() => setDkCount(n)}
                  className={`px-3 py-1.5 rounded-full border transition ${
                    dkCount === n
                      ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white border-transparent shadow'
                      : 'bg-white/70 dark:bg-zinc-800/40 text-gray-700 dark:text-gray-200 border-gray-200/60 dark:border-gray-700/60 hover:bg-white/90 dark:hover:bg-zinc-800/60'
                  }`}
                >{n}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-600 dark:text-gray-300">时长</span>
              {[2000, 3600, 5000, 7000].map((ms) => (
                <button
                  key={ms}
                  onClick={() => setDkDur(ms)}
                  className={`px-3 py-1.5 rounded-full border transition ${
                    dkDur === ms
                      ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white border-transparent shadow'
                      : 'bg-white/70 dark:bg-zinc-800/40 text-gray-700 dark:text-gray-200 border-gray-200/60 dark:border-gray-700/60 hover:bg-white/90 dark:hover:bg-zinc-800/60'
                  }`}
                >{Math.round(ms / 1000)}s</button>
              ))}
            </div>
            <div>
              <button
                onClick={() => fireDevKuro(dkCount, dkDur)}
                className="px-3 py-1.5 rounded-md border hover:bg-gray-50 dark:hover:bg-zinc-800"
              >预览</button>
            </div>
          </div>
        </section>

        {/* 主题皮肤（多预设 + 跨端同步） */}
        <section className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-zinc-900/40 backdrop-blur p-5 shadow-lg">
          <h2 className="text-lg font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-teal-500">主题皮肤</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { key: 'flow', label: '流光', style: 'radial-gradient(1200px 600px at 50% -200px, rgba(99,102,241,.25), transparent), radial-gradient(800px 400px at 10% 10%, rgba(16,185,129,.2), transparent), radial-gradient(800px 400px at 90% 10%, rgba(59,130,246,.2), transparent)' },
              { key: 'deepspace', label: '深空', style: 'linear-gradient(180deg, #0b1220, #0f172a)' },
              { key: 'grid', label: '网格', style: 'linear-gradient(90deg,rgba(99,102,241,.08) 1px,transparent 0),linear-gradient(180deg,rgba(99,102,241,.08) 1px,transparent 0)' },
              { key: 'kawaii', label: '可爱', style: 'linear-gradient(135deg,#ffe0f0 0%,#e0f7ff 100%)' },
              { key: 'neon', label: '霓虹', style: 'radial-gradient(circle at 20% 10%, #ff00cc22, transparent 40%), radial-gradient(circle at 80% 20%, #00ccff22, transparent 40%), radial-gradient(circle at 50% 80%, #00ff8855, transparent 40%), #0b0f1a' },
              { key: 'reset', label: '还原', style: '' },
            ].map((skin) => (
              <button
                key={skin.key}
                onClick={async () => {
                  try {
                    localStorage.setItem('kurotv_theme_skin', skin.key);
                    fetch('/api/user-settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ themeSkin: skin.key }),
                    }).catch((err) => {
                      // Intentionally ignore network errors during best-effort user settings update
                      console.warn('Failed to persist theme skin to /api/user-settings:', err);
                    });
                    const evt = new StorageEvent('storage', { key: 'kurotv_theme_skin', newValue: skin.key } as any);
                    window.dispatchEvent(evt);
                  } catch (err) {
                    // Swallow unexpected runtime errors but leave a breadcrumb in console for debugging
                    console.warn('Failed to apply theme skin:', err);
                  }
                }}
                className="group relative h-20 rounded-xl border overflow-hidden hover:shadow-md transition"
                title={skin.label}
              >
                <div className="absolute inset-0" style={{ background: skin.style }} />
                {skin.key === 'grid' && (
                  <div className="absolute inset-0" style={{ backgroundSize: '20px 20px' }} />
                )}
                <div className="absolute bottom-1 left-1 right-1 text-xs font-medium px-2 py-1 rounded bg-black/40 text-white backdrop-blur-sm opacity-90 group-hover:opacity-100">
                  {skin.label}
                </div>
              </button>
            ))}
          </div>
        </section>

      </div>
    </PageLayout>
  );
} 