'use client';

import { Palette, Upload, Download, X, Check } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

interface BuiltinSkin {
  key: string;
  name: string;
  preview: string; // CSS background for preview tile
}

const BUILTIN_SKINS: BuiltinSkin[] = [
  // 推荐集
  { key: 'glass', name: '影院风', preview: 'radial-gradient(1200px 600px at 30% -200px, rgba(255,255,255,.25), transparent), radial-gradient(900px 500px at 90% 10%, rgba(255,255,255,.12), transparent), linear-gradient(135deg, #10151f, #0f172a)' },
  { key: 'neon', name: '赛博风', preview: 'radial-gradient(circle at 20% 10%, #ff00cc22, transparent 40%), radial-gradient(circle at 80% 20%, #00ccff22, transparent 40%), radial-gradient(circle at 50% 80%, #00ff8855, transparent 40%), #0b0f1a' },
  { key: 'kawaii', name: '二次元风', preview: 'linear-gradient(135deg,#ffe0f0 0%,#e0f7ff 100%)' },
  // 其他现有皮肤
  { key: 'deepspace', name: '深空', preview: 'linear-gradient(180deg, #0b1220, #0f172a)' },
  { key: 'flow', name: '流光', preview: 'radial-gradient(1200px 600px at 50% -200px, rgba(99,102,241,.25), transparent), radial-gradient(800px 400px at 10% 10%, rgba(16,185,129,.2), transparent), radial-gradient(800px 400px at 90% 10%, rgba(59,130,246,.2), transparent)' },
  { key: 'grid', name: '网格', preview: 'linear-gradient(90deg,rgba(99,102,241,.08) 1px,transparent 0),linear-gradient(180deg,rgba(99,102,241,.08) 1px,transparent 0)' },
  { key: 'stars', name: '星空', preview: 'linear-gradient(180deg, #0b1220, #0f172a)' },
  { key: 'sunset', name: '落日', preview: 'linear-gradient(180deg, #ff7e5f, #feb47b 40%, #6a82fb 100%)' },
  { key: 'ocean', name: '海洋', preview: 'radial-gradient(circle at 20% 10%, rgba(59,130,246,.2), transparent 40%), radial-gradient(circle at 80% 30%, rgba(16,185,129,.2), transparent 40%), linear-gradient(180deg, #0ea5e9, #0369a1)' },
  { key: 'paper', name: '纸感', preview: 'linear-gradient(180deg, #faf7f2, #f1ede6)' },
  // 新增
  { key: 'aurora', name: '极光', preview: 'radial-gradient(circle at 20% 10%, rgba(99,102,241,.25), transparent 40%), radial-gradient(circle at 80% 30%, rgba(16,185,129,.25), transparent 40%), radial-gradient(circle at 60% 80%, rgba(236,72,153,.20), transparent 40%), linear-gradient(180deg, #0b1220, #0f172a 60%, #111827)' },
  { key: 'sakura', name: '樱色', preview: 'linear-gradient(135deg, #ffe4ef 0%, #f7f5ff 45%, #e6f7ff 100%)' },
  { key: 'vaporwave', name: '蒸汽波', preview: 'linear-gradient(135deg, #ff71ce 0%, #b967ff 40%, #01cdfe 100%)' },
  { key: 'galaxy', name: '银河', preview: 'radial-gradient(1200px 600px at 20% -200px, rgba(168,85,247,.25), transparent), radial-gradient(900px 500px at 90% 10%, rgba(59,130,246,.20), transparent), linear-gradient(180deg, #0b0f1a, #0f172a)' },
  { key: 'carbon', name: '碳纤维', preview: 'repeating-linear-gradient(45deg, rgba(255,255,255,.03) 0, rgba(255,255,255,.03) 2px, transparent 2px, transparent 6px), linear-gradient(180deg, #0f1216, #0b0f14)' },
  { key: 'linen', name: '亚麻', preview: 'repeating-linear-gradient(0deg, rgba(0,0,0,.02) 0px, rgba(0,0,0,.02) 4px, transparent 4px, transparent 8px), repeating-linear-gradient(90deg, rgba(0,0,0,.02) 0px, rgba(0,0,0,.02) 4px, transparent 4px, transparent 8px), linear-gradient(180deg, #f7f6f2, #efede9)' },
  { key: 'forest', name: '森林', preview: 'radial-gradient(circle at 15% 10%, rgba(16,185,129,.25), transparent 40%), radial-gradient(circle at 80% 30%, rgba(34,197,94,.18), transparent 40%), linear-gradient(180deg, #064e3b, #052e2b)' },
  { key: 'dawn', name: '拂晓', preview: 'linear-gradient(180deg, #ffd6a7 0%, #fbc2eb 45%, #a6c0fe 100%)' },
];

function broadcastSkinChange(value: string | null) {
  try {
    localStorage.setItem('kurotv_theme_skin', value ?? 'reset');
    // 主窗口内也触发监听
    window.dispatchEvent(new StorageEvent('storage', { key: 'kurotv_theme_skin', newValue: value ?? 'reset' }));
  } catch {}
}

async function saveUserSettings(partial: Record<string, unknown>) {
  try {
    await fetch('/api/user-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
  } catch {}
}

export default function SkinMarket() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [current, setCurrent] = useState<string>('reset');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  // kawaii 扩展（不再包含背景图设置）
  const [kawaiiHearts, setKawaiiHearts] = useState(false);
  const [kawaiiSakura, setKawaiiSakura] = useState(false);
  const [kawaiiCount, setKawaiiCount] = useState(36);
  const [kawaiiSpeed, setKawaiiSpeed] = useState(1);
  const [heartStyle, setHeartStyle] = useState<'outline'|'gradient'|'glow'>('glow');
  const [sakuraStyle, setSakuraStyle] = useState<'outline'|'gradient'|'glow'>('glow');

  useEffect(() => setMounted(true), []);

  // 初始化当前选中皮肤
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('kurotv_theme_skin') || 'reset';
    setCurrent(saved);
    // 去除背景图初始化
    // 兼容两套 key，优先读取新 key
    const heartsOn = (localStorage.getItem('kurotv_theme_kawaii_hearts') ?? localStorage.getItem('kurotv_kawaii_hearts')) === 'true';
    const sakuraOn = (localStorage.getItem('kurotv_theme_kawaii_sakura') ?? localStorage.getItem('kurotv_kawaii_sakura')) === 'true';
    setKawaiiHearts(heartsOn);
    setKawaiiSakura(sakuraOn);
    const kc = Number(localStorage.getItem('kurotv_theme_kawaii_count') || '36');
    setKawaiiCount(isFinite(kc) ? Math.max(8, Math.min(120, kc)) : 36);
    const sp = Number(localStorage.getItem('kurotv_theme_kawaii_speed') || '1');
    setKawaiiSpeed(isFinite(sp) ? Math.max(0.5, Math.min(2, sp)) : 1);
    setHeartStyle((localStorage.getItem('kurotv_theme_kawaii_style_heart') as any) || 'glow');
    setSakuraStyle((localStorage.getItem('kurotv_theme_kawaii_style_sakura') as any) || 'glow');
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'kurotv_theme_skin') setCurrent(e.newValue || 'reset');
      // 去除背景图监听
      if (e.key === 'kurotv_theme_kawaii_hearts' || e.key === 'kurotv_kawaii_hearts') setKawaiiHearts(e.newValue === 'true');
      if (e.key === 'kurotv_theme_kawaii_sakura' || e.key === 'kurotv_kawaii_sakura') setKawaiiSakura(e.newValue === 'true');
      if (e.key === 'kurotv_theme_kawaii_count') setKawaiiCount(Math.max(8, Math.min(120, Number(e.newValue || '36'))));
      if (e.key === 'kurotv_theme_kawaii_speed') setKawaiiSpeed(Math.max(0.5, Math.min(2, Number(e.newValue || '1'))));
      if (e.key === 'kurotv_theme_kawaii_style_heart') setHeartStyle((e.newValue as any) || 'glow');
      if (e.key === 'kurotv_theme_kawaii_style_sakura') setSakuraStyle((e.newValue as any) || 'glow');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const openPanel = () => setOpen(true);
  const closePanel = () => {
    setOpen(false);
    setShowImport(false);
  };

  const handleApply = async (key: string) => {
    setCurrent(key);
    // 先持久化
    broadcastSkinChange(key);
    // 触发一次强制重绘，避免个别浏览器不立即应用背景
    try { document.body.style.transform = 'translateZ(0)'; setTimeout(()=>{ document.body.style.transform=''; }, 0); } catch {}
    // 同步到用户设置（非必需，本地模式会被服务端忽略）
    saveUserSettings({ themeSkin: key });
  };

  const handleReset = async () => {
    setCurrent('reset');
    broadcastSkinChange(null);
    try { document.body.style.transform = 'translateZ(0)'; setTimeout(()=>{ document.body.style.transform=''; }, 0); } catch {}
    saveUserSettings({ themeSkin: 'reset' });
  };

  // 导出当前自定义皮肤配置
  const exportedCustom = useMemo(() => {
    if (current !== 'custom') return '';
    try {
      const raw = localStorage.getItem('kurotv_theme_skin_custom');
      return raw ? raw : '';
    } catch {
      return '';
    }
  }, [current]);

  // 导入自定义皮肤（支持粘贴纯背景CSS或 JSON）
  const handleImport = () => {
    setShowImport(true);
    setImportText('');
  };

  const applyImport = () => {
    try {
      let backgroundCss = '';
      let extraCss = '';
      const trimmed = importText.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('{')) {
        const j = JSON.parse(trimmed);
        backgroundCss = j.backgroundCss || '';
        extraCss = j.extraCss || '';
      } else {
        backgroundCss = trimmed; // 直接当作 CSS 背景
      }
      if (!backgroundCss) return;
      const data = JSON.stringify({ backgroundCss, extraCss });
      localStorage.setItem('kurotv_theme_skin_custom', data);
      handleApply('custom');
      setShowImport(false);
    } catch {
      // ignore parse errors
    }
  };

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportedCustom);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    } catch {}
  };

  const panel = (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[12000]" onClick={closePanel} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100%,900px)] max-h-[85vh] overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-[12001] border border-gray-200/60 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-200/60 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold">主题皮肤市场</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Beta</span>
          </div>
          <button onClick={closePanel} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><X /></button>
        </div>

        <div className="p-6 space-y-6 overflow-auto max-h-[calc(85vh-56px)]">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">当前：{current === 'reset' ? '系统默认' : current === 'custom' ? '自定义' : BUILTIN_SKINS.find(s=>s.key===current)?.name || current}</div>
            <div className="flex items-center gap-2">
              <button onClick={handleImport} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"><Upload className="w-4 h-4"/>导入</button>
              <button onClick={copyExport} disabled={current !== 'custom'} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"><Download className="w-4 h-4"/>导出</button>
              <button onClick={handleReset} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">重置</button>
            </div>
          </div>

          {/* 背景图设置已移除 */}

          {/* 二次元风特效（仅在 kawaii 时显示） */}
          {current === 'kawaii' && (
            <div className="space-y-3 p-4 border rounded-lg border-pink-200/60 dark:border-pink-900/40 bg-pink-50/40 dark:bg-pink-900/10">
              <div className="text-sm font-medium">二次元特效</div>
              <div className="flex items-center gap-6 text-sm">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={kawaiiSakura} onChange={(e)=>{ setKawaiiSakura(e.target.checked); try{ const v=String(e.target.checked); localStorage.setItem('kurotv_theme_kawaii_sakura', v); localStorage.setItem('kurotv_kawaii_sakura', v); window.dispatchEvent(new StorageEvent('storage',{key:'kurotv_theme_kawaii_sakura', newValue:v} as any)); }catch{} }} /> 樱花飘落
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={kawaiiHearts} onChange={(e)=>{ setKawaiiHearts(e.target.checked); try{ const v=String(e.target.checked); localStorage.setItem('kurotv_theme_kawaii_hearts', v); localStorage.setItem('kurotv_kawaii_hearts', v); window.dispatchEvent(new StorageEvent('storage',{key:'kurotv_theme_kawaii_hearts', newValue:v} as any)); }catch{} }} /> 爱心飘浮
                </label>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                <span>数量</span>
                <input type="range" min={8} max={120} step={1} value={kawaiiCount} onChange={(e)=>{ const v = Math.max(8, Math.min(120, Number(e.target.value))); setKawaiiCount(v); try{ localStorage.setItem('kurotv_theme_kawaii_count', String(v)); window.dispatchEvent(new StorageEvent('storage',{key:'kurotv_theme_kawaii_count', newValue:String(v)} as any)); } catch{} }} className="flex-1" />
                <span>{kawaiiCount}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                <span>速度</span>
                <input type="range" min={0.5} max={2} step={0.05} value={kawaiiSpeed} onChange={(e)=>{ const v = Math.max(0.5, Math.min(2, Number(e.target.value))); setKawaiiSpeed(v); try{ localStorage.setItem('kurotv_theme_kawaii_speed', String(v)); window.dispatchEvent(new StorageEvent('storage',{key:'kurotv_theme_kawaii_speed', newValue:String(v)} as any)); } catch{} }} className="flex-1" />
                <span>{kawaiiSpeed.toFixed(2)}x</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-400">
                <label className="flex items-center gap-2">
                  <span className="whitespace-nowrap">爱心样式</span>
                  <select value={heartStyle} onChange={(e)=>{ const v = e.target.value as any; setHeartStyle(v); try{ localStorage.setItem('kurotv_theme_kawaii_style_heart', v); window.dispatchEvent(new StorageEvent('storage',{key:'kurotv_theme_kawaii_style_heart', newValue:v} as any)); } catch{} }} className="flex-1 px-2 py-1 rounded border bg-white dark:bg-gray-900">
                    <option value="glow">发光</option>
                    <option value="gradient">渐变</option>
                    <option value="outline">描边</option>
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <span className="whitespace-nowrap">樱花样式</span>
                  <select value={sakuraStyle} onChange={(e)=>{ const v = e.target.value as any; setSakuraStyle(v); try{ localStorage.setItem('kurotv_theme_kawaii_style_sakura', v); window.dispatchEvent(new StorageEvent('storage',{key:'kurotv_theme_kawaii_style_sakura', newValue:v} as any)); } catch{} }} className="flex-1 px-2 py-1 rounded border bg-white dark:bg-gray-900">
                    <option value="glow">发光</option>
                    <option value="gradient">渐变</option>
                    <option value="outline">描边</option>
                  </select>
                </label>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">提示：特效会以较淡的形式叠加在背景之上，尽量不影响内容阅读。</div>
            </div>
          )}

          {showImport && (
            <div className="space-y-3 p-4 border rounded-lg border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
              <div className="text-sm text-gray-600 dark:text-gray-300">粘贴 CSS 背景（如 linear-gradient(...)）或导入 JSON：{"{ backgroundCss, extraCss? }"}</div>
              <textarea value={importText} onChange={(e)=>setImportText(e.target.value)} placeholder="示例: linear-gradient(135deg,#141E30 0%,#243B55 100%)" className="w-full h-28 p-3 rounded-md text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" />
              <div className="flex items-center gap-2">
                <button onClick={applyImport} className="px-3 py-1.5 text-sm rounded-md bg-green-500 text-white hover:bg-green-600">应用</button>
                <button onClick={()=>setShowImport(false)} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">取消</button>
              </div>
            </div>
          )}

          <div>
            <div className="text-sm font-medium mb-3">推荐主题</div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {BUILTIN_SKINS.map((skin) => (
                <button key={skin.key} onClick={() => handleApply(skin.key)} className={`group relative rounded-xl overflow-hidden border ${current===skin.key? 'border-green-500' : 'border-gray-200 dark:border-gray-800'} focus:outline-none focus:ring-2 focus:ring-green-500`}> 
                  <div className="h-28" style={{ background: skin.preview as any, backgroundSize: skin.key==='grid' ? '20px 20px' : undefined }} />
                  <div className="absolute top-2 right-2 text-white/90">
                    {current===skin.key && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-600/90"><Check className="w-3 h-3"/>已选</span>}
                  </div>
                  <div className="px-3 py-2 text-sm text-left flex items-center justify-between">
                    <span>{skin.name}</span>
                    <span className="text-xs text-gray-500">{skin.key}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {current === 'custom' && (
            <div className="space-y-2">
              <div className="text-sm font-medium">自定义导出</div>
              <textarea readOnly value={exportedCustom} className="w-full h-24 p-3 rounded-md text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" />
              <div className="text-xs text-gray-500">可复制并分享给好友导入使用</div>
            </div>
          )}

          {justSaved && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1200] px-3 py-1.5 rounded bg-black/80 text-white text-sm">已复制到剪贴板</div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      <button onClick={openPanel} className="w-10 h-10 p-2 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200/50 dark:text-gray-300 dark:hover:bg-gray-700/50 transition-colors" aria-label="Skin Market">
        <Palette className="w-full h-full" />
      </button>
      {open && mounted && createPortal(panel, document.body)}
    </>
  );
} 