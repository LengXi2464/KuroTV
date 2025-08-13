'use client';

import { useEffect } from 'react';

function ensureSkinStyles() {
  if (document.getElementById('kurotv-skin-styles')) return;
  const style = document.createElement('style');
  style.id = 'kurotv-skin-styles';
  style.textContent = `
    @keyframes star-drift {
      0% { background-position: 0 0, 0 0, 0 0; }
      100% { background-position: 1000px 500px, -800px 400px, 600px -300px; }
    }

    /* 主题基底 */
    .skin-stars {
      background: 
        radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,.8) 50%, transparent 60%),
        radial-gradient(1px 1px at 80% 30%, rgba(255,255,255,.7) 50%, transparent 60%),
        radial-gradient(2px 2px at 50% 80%, rgba(255,255,255,.6) 50%, transparent 60%),
        linear-gradient(180deg, #0b1220, #0f172a);
      animation: star-drift 60s linear infinite;
      background-repeat: repeat;
    }

    .skin-glass {
      background: radial-gradient(1200px 600px at 30% -200px, rgba(255,255,255,.25), transparent), radial-gradient(900px 500px at 90% 10%, rgba(255,255,255,.12), transparent), linear-gradient(135deg, #10151f, #0f172a);
    }

    .skin-paper {
      background: 
        repeating-linear-gradient(0deg, rgba(0,0,0,.02) 0px, rgba(0,0,0,.02) 2px, transparent 2px, transparent 6px),
        repeating-linear-gradient(90deg, rgba(0,0,0,.015) 0px, rgba(0,0,0,.015) 2px, transparent 2px, transparent 6px),
        linear-gradient(180deg, #faf7f2, #f1ede6);
    }

    .skin-sunset { background: linear-gradient(180deg, #ff7e5f, #feb47b 40%, #6a82fb 100%); }
    .skin-ocean {
      background: 
        radial-gradient(circle at 20% 10%, rgba(59,130,246,.2), transparent 40%),
        radial-gradient(circle at 80% 30%, rgba(16,185,129,.2), transparent 40%),
        linear-gradient(180deg, #0ea5e9, #0369a1);
    }

    /* 其他主题（供切换时 class 标识） */
    .skin-flow{}
    .skin-deepspace{ }
    .skin-grid{ }
    .skin-neon{ }
    .skin-aurora{ }
    .skin-sakura{ }
    .skin-vaporwave{ }
    .skin-galaxy{ }
    .skin-carbon{ }
    .skin-linen{ }
    .skin-forest{ }
    .skin-dawn{ }
    .skin-custom{ }

    /* 二次元风：粉色渐变 + 毛玻璃叠加 */
    .skin-kawaii {
      background: linear-gradient(135deg, #ffd9ea 0%, #ffc8de 45%, #fff0f7 100%);
    }
    body.skin-kawaii::before {
      content: '';
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      /* 柔光 + 动态气泡（轻微移动） */
      background:
        radial-gradient(160px 110px at 16% 8%, rgba(255,255,255,.40), transparent 70%),
        radial-gradient(200px 130px at 84% 16%, rgba(255,255,255,.32), transparent 70%),
        radial-gradient(140px 100px at 62% 72%, rgba(255,182,193,.22), transparent 70%),
        radial-gradient(160px 110px at 28% 84%, rgba(255,192,203,.20), transparent 70%),
        radial-gradient(220px 140px at 50% 10%, rgba(255,220,235,.18), transparent 75%);
      filter: saturate(105%);
      animation: kawaii-pan 24s ease-in-out infinite alternate;
    }
    /* 毛玻璃柔雾层（无论是否有人物背景都在最上层轻微柔化）*/
    body.skin-kawaii::after {
      content: '';
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      /* 仅叠加柔和高光，不对页面进行 backdrop 模糊，避免整体内容被虚化 */
      background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,192,203,.06));
      filter: none;
    }

    @keyframes kawaii-pan {
      0% { background-position: 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%; }
      100% { background-position: 8% 2%, -6% 3%, -4% -3%, 6% -4%, 0% 5%; }
    }
    /* --- Kawaii FX（hearts/sakura） --- */
    [id^="kurotv-kawaii-overlay"] { position: fixed; inset: 0; pointer-events: none; z-index: 1; overflow: hidden; }
    [id^="kurotv-kawaii-overlay"] .k-item { position: absolute; top: -10vh; left: 0; will-change: transform, opacity; opacity: .9; filter: drop-shadow(0 2px 6px rgba(0,0,0,.15)); }

    @keyframes k-fall {
      0% { transform: translate3d(var(--kx, 0vw), -12vh, 0) rotate(0deg) scale(var(--ks,1)); opacity: 0; }
      10% { opacity: .95; }
      100% { transform: translate3d(calc(var(--kx,0vw) + var(--kdx,0px)), 110vh, 0) rotate(var(--kr, 180deg)) scale(var(--ks,1)); opacity: .9; }
    }
    @keyframes k-sway { from { transform: translateX(-8px) rotate(-6deg); } to { transform: translateX(8px) rotate(6deg); } }

    /* hearts */
    .k-heart { width: 18px; height: 18px; }
    .k-heart .k-icon { color: #ff6b9e; font-size: 18px; display: block; animation: k-sway var(--ksway-dur,6s) ease-in-out var(--ksway-delay,0s) infinite alternate; will-change: transform; }

    /* sakura */
    .k-sakura { width: 16px; height: 16px; }
    .k-sakura .k-icon { color: #ffb7c5; font-size: 16px; display: block; animation: k-sway var(--ksway-dur,7s) ease-in-out var(--ksway-delay,0s) infinite alternate; will-change: transform; }

    /* 样式包：描边/渐变/发光 */
    /* hearts */
    [data-heart-style="outline"] .k-heart .k-icon { -webkit-text-stroke: 1px rgba(255, 105, 135, .9); }
    [data-heart-style="gradient"] .k-heart .k-icon { background: linear-gradient(180deg, #ff9ac0, #ff5f9b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    [data-heart-style="glow"] .k-heart .k-icon { text-shadow: 0 0 6px rgba(255,105,180,.55), 0 0 12px rgba(255,105,180,.35); }
    /* sakura */
    [data-sakura-style="outline"] .k-sakura .k-icon { -webkit-text-stroke: 1px rgba(255, 158, 185, .9); }
    [data-sakura-style="gradient"] .k-sakura .k-icon { background: linear-gradient(180deg, #ffd1dc, #ff9fbc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    [data-sakura-style="glow"] .k-sakura .k-icon { text-shadow: 0 0 6px rgba(255,182,193,.55), 0 0 12px rgba(255,182,193,.35); }

    /* Q 版人物角标 */
    #kurotv-kawaii-chibi { position: fixed; right: 14px; bottom: 14px; width: var(--chibi-size, 96px); height: var(--chibi-size, 96px); background-position: center bottom; background-repeat: no-repeat; background-size: contain; z-index: 2; pointer-events: none; opacity: var(--chibi-opacity, .9); filter: drop-shadow(0 6px 12px rgba(0,0,0,.18)); }

    /* 背景图层已停用 */
  `;
  document.head.appendChild(style);
}

function removeAllKnownSkins(d: HTMLElement) {
  d.classList.remove(
    'skin-flow','skin-deepspace','skin-grid','skin-kawaii','skin-neon',
    'skin-stars','skin-glass','skin-paper','skin-sunset','skin-ocean','skin-custom',
    'skin-aurora','skin-sakura','skin-vaporwave','skin-galaxy','skin-carbon','skin-linen','skin-forest','skin-dawn'
  );
}

function applyCustomSkin(d: HTMLElement) {
  try {
    const raw = localStorage.getItem('kurotv_theme_skin_custom');
    const data = raw ? JSON.parse(raw) : null;
    const backgroundCss = data?.backgroundCss as string | undefined;
    const extraCss = data?.extraCss as string | undefined;

    const old = document.getElementById('kurotv-custom-skin');
    if (old && old.parentNode) old.parentNode.removeChild(old);

    if (extraCss && typeof extraCss === 'string') {
      const s = document.createElement('style');
      s.id = 'kurotv-custom-skin';
      s.textContent = extraCss;
      document.head.appendChild(s);
    }

    if (backgroundCss && typeof backgroundCss === 'string') {
      (d.style as any).background = backgroundCss;
      d.classList.add('skin-custom');
    }
  } catch (err) {
    void err;
  }
}

function applyBackgroundOverlay(_d: HTMLElement) {
  try {
    // 移除已有背景图层，并忽略存储的背景图设置
    const layer = document.getElementById('kurotv-bg-image');
    if (layer) layer.remove();
  } catch (err) {
    void err;
  }
}

function ensureKawaiiOverlay(mode: 'none' | 'hearts' | 'sakura' | 'both') {
  const existed1 = document.getElementById('kurotv-kawaii-overlay-hearts');
  const existed2 = document.getElementById('kurotv-kawaii-overlay-sakura');
  if (existed1) existed1.remove();
  if (existed2) existed2.remove();
  if (mode === 'none') return;

  const create = (kind: 'hearts' | 'sakura') => {
    const container = document.createElement('div');
    container.id = `kurotv-kawaii-overlay-${kind}`;
    const baseCount = Number(localStorage.getItem('kurotv_theme_kawaii_count') || '36');
    const count = isFinite(baseCount) ? Math.max(8, Math.min(120, baseCount)) : 36;
    // 样式包设置
    const heartStyle = localStorage.getItem('kurotv_theme_kawaii_style_heart') || 'glow';
    const sakuraStyle = localStorage.getItem('kurotv_theme_kawaii_style_sakura') || 'glow';
    container.setAttribute('data-heart-style', heartStyle);
    container.setAttribute('data-sakura-style', sakuraStyle);
    // 速度：0.5x ~ 2x（默认1）
    const speed = Math.max(0.5, Math.min(2, Number(localStorage.getItem('kurotv_theme_kawaii_speed') || '1')));

    const spawn = () => {
      const el = document.createElement('span');
      el.className = `k-item ${kind === 'hearts' ? 'k-heart' : 'k-sakura'}`;
      const startX = Math.floor(Math.random() * 100 - 5);
      const drift = Math.floor((Math.random() - 0.5) * 220);
      const rot = Math.floor((Math.random() - 0.5) * 140);
      const scale = 0.8 + Math.random() * 0.8;
      el.style.setProperty('--kx', startX + 'vw');
      el.style.setProperty('--kdx', drift + 'px');
      el.style.setProperty('--kr', rot + 'deg');
      el.style.setProperty('--ks', String(scale));
      el.style.left = startX + 'vw';
      const dur = (4500 + Math.random() * 5500) / speed;
      const delay = (Math.random() * 1200) / speed;
      el.style.animation = `k-fall ${Math.round(dur)}ms cubic-bezier(.2,.8,.2,1) ${Math.round(delay)}ms both`;
      // 内层图标，承载摆动动画
      const icon = document.createElement('i');
      icon.className = 'k-icon';
      icon.textContent = kind === 'hearts' ? '❤' : '❀';
      // 每个元素的摆动时长/延迟随机
      icon.style.setProperty('--ksway-dur', `${(5 + Math.random() * 4) / speed}s`);
      icon.style.setProperty('--ksway-delay', `${(Math.random() * 1.2) / speed}s`);
      el.appendChild(icon);
      container.appendChild(el);
      setTimeout(() => el.remove(), dur + delay + 200);
    };

    // 初始铺满
    for (let i = 0; i < count; i++) spawn();
    // 持续生成
    const interval = setInterval(() => {
      for (let i = 0; i < Math.ceil(count / 12); i++) spawn();
      if (!document.body.contains(container)) clearInterval(interval);
    }, Math.max(200, 800 / speed));
    document.body.appendChild(container);
  };

  if (mode === 'both') {
    create('hearts');
    create('sakura');
  } else {
    create(mode);
  }
}

function applyKawaiiChibi() {
  try {
    const url = localStorage.getItem('kurotv_theme_kawaii_chibi_url');
    const opacityRaw = localStorage.getItem('kurotv_theme_kawaii_chibi_opacity');
    const sizeRaw = localStorage.getItem('kurotv_theme_kawaii_chibi_size');
    const opacity = opacityRaw ? Math.max(0, Math.min(1, Number(opacityRaw))) : 0.95;
    const size = sizeRaw ? Math.max(48, Math.min(220, Number(sizeRaw))) : 110;

    const existed = document.getElementById('kurotv-kawaii-chibi');
    if (!url) {
      if (existed) existed.remove();
      return;
    }

    const el = existed || document.createElement('div');
    el.id = 'kurotv-kawaii-chibi';
    el.style.setProperty('--chibi-size', size + 'px');
    el.style.setProperty('--chibi-opacity', String(opacity));
    el.style.backgroundImage = `url(${url})`;
    if (!existed) document.body.appendChild(el);
  } catch (err) {
    void err;
  }
}

function applySkin(name: string | null) {
  const d = document.body as HTMLElement;
  ensureSkinStyles();
  removeAllKnownSkins(d);
  // 清理内联样式，避免旧主题覆盖
  d.style.background = '';
  (d.style as any).backgroundImage = '';
  (d.style as any).backgroundSize = '';
  // 默认移除特效层
  try { ensureKawaiiOverlay('none'); } catch (err) { void err; }

  if (!name || name === 'reset') {
    d.style.background = '';
    applyBackgroundOverlay(d);
    const chibi = document.getElementById('kurotv-kawaii-chibi');
    if (chibi) chibi.remove();
    return;
  }

  if (name === 'custom') {
    applyCustomSkin(d);
    applyBackgroundOverlay(d);
    return;
  }

  if (name === 'flow') {
    d.style.background =
      'radial-gradient(1200px 600px at 50% -200px, rgba(99,102,241,.25), transparent), radial-gradient(800px 400px at 10% 10%, rgba(16,185,129,.2), transparent), radial-gradient(800px 400px at 90% 10%, rgba(59,130,246,.2), transparent)';
    d.classList.add('skin-flow');
    return;
  }
  if (name === 'deepspace') {
    d.style.background = 'linear-gradient(180deg, #0b1220, #0f172a)';
    d.classList.add('skin-deepspace');
    return;
  }
  if (name === 'grid') {
    d.style.background =
      'linear-gradient(90deg,rgba(99,102,241,.08) 1px,transparent 0),linear-gradient(180deg,rgba(99,102,241,.08) 1px,transparent 0)';
    (d.style as any).backgroundSize = '20px 20px';
    d.classList.add('skin-grid');
    return;
  }
  if (name === 'kawaii') {
    d.style.background = 'linear-gradient(135deg, #ffd6e8 0%, #ffc7df 45%, #ffe9f6 100%)';
    d.classList.add('skin-kawaii');
    try {
      const fx = (localStorage.getItem('kurotv_theme_kawaii_fx') as 'none' | 'hearts' | 'sakura' | 'both' | null) || 'none';
      const heartsOn = localStorage.getItem('kurotv_theme_kawaii_hearts') === 'true';
      const sakuraOn = localStorage.getItem('kurotv_theme_kawaii_sakura') === 'true';
      const finalFx: 'none' | 'hearts' | 'sakura' | 'both' =
        fx === 'both' || (heartsOn && sakuraOn)
          ? 'both'
          : heartsOn
          ? 'hearts'
          : sakuraOn
          ? 'sakura'
          : (fx as any);
      ensureKawaiiOverlay(finalFx);
      applyKawaiiChibi();
    } catch (err) {
      void err;
    }
    applyBackgroundOverlay(d);
    return;
  }
  if (name === 'neon') {
    d.style.background = 'radial-gradient(circle at 20% 10%, #ff00cc22, transparent 40%), radial-gradient(circle at 80% 20%, #00ccff22, transparent 40%), radial-gradient(circle at 50% 80%, #00ff8855, transparent 40%), #0b0f1a';
    d.classList.add('skin-neon');
    return;
  }
  if (name === 'stars') {
    d.classList.add('skin-stars');
    return;
  }
  if (name === 'glass') {
    d.classList.add('skin-glass');
    return;
  }
  if (name === 'paper') {
    d.classList.add('skin-paper');
    return;
  }
  if (name === 'sunset') {
    d.classList.add('skin-sunset');
    return;
  }
  if (name === 'ocean') {
    d.classList.add('skin-ocean');
    return;
  }
}

export default function SkinApplier() {
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch('/api/user-settings', { cache: 'no-store' });
        if (cancelled) return;
        if (res.ok) {
          const j = await res.json();
          const name = j?.settings?.themeSkin || localStorage.getItem('kurotv_theme_skin');
          applySkin(name);
        } else {
          applySkin(localStorage.getItem('kurotv_theme_skin'));
        }
      } catch {
        applySkin(localStorage.getItem('kurotv_theme_skin'));
      }
    };
    run();

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'kurotv_theme_skin') {
        applySkin(e.newValue);
        return;
      }
      if (e.key === 'kurotv_theme_kawaii_fx' || e.key === 'kurotv_theme_kawaii_hearts' || e.key === 'kurotv_theme_kawaii_sakura') {
        const fx = (localStorage.getItem('kurotv_theme_kawaii_fx') as 'none' | 'hearts' | 'sakura' | 'both' | null) || 'none';
        const heartsOn = localStorage.getItem('kurotv_theme_kawaii_hearts') === 'true';
        const sakuraOn = localStorage.getItem('kurotv_theme_kawaii_sakura') === 'true';
        const finalFx: 'none' | 'hearts' | 'sakura' | 'both' =
          fx === 'both' || (heartsOn && sakuraOn)
            ? 'both'
            : heartsOn
            ? 'hearts'
            : sakuraOn
            ? 'sakura'
            : (fx as any);
        ensureKawaiiOverlay(finalFx);
        return;
      }
      if (e.key === 'kurotv_theme_kawaii_chibi_url' || e.key === 'kurotv_theme_kawaii_chibi_opacity' || e.key === 'kurotv_theme_kawaii_chibi_size') {
        applyKawaiiChibi();
        return;
      }
      if (e.key === 'kurotv_theme_kawaii_count') {
        // 重建覆盖层以应用新的数量
        const fx = (localStorage.getItem('kurotv_theme_kawaii_fx') as 'none' | 'hearts' | 'sakura' | 'both' | null) || 'none';
        const heartsOn = localStorage.getItem('kurotv_theme_kawaii_hearts') === 'true';
        const sakuraOn = localStorage.getItem('kurotv_theme_kawaii_sakura') === 'true';
        const finalFx: 'none' | 'hearts' | 'sakura' | 'both' =
          fx === 'both' || (heartsOn && sakuraOn)
            ? 'both'
            : heartsOn
            ? 'hearts'
            : sakuraOn
            ? 'sakura'
            : (fx as any);
        ensureKawaiiOverlay(finalFx);
        return;
      }
      if (e.key === 'kurotv_theme_kawaii_speed' || e.key === 'kurotv_theme_kawaii_style_heart' || e.key === 'kurotv_theme_kawaii_style_sakura') {
        const fx = (localStorage.getItem('kurotv_theme_kawaii_fx') as 'none' | 'hearts' | 'sakura' | 'both' | null) || 'none';
        const heartsOn = localStorage.getItem('kurotv_theme_kawaii_hearts') === 'true';
        const sakuraOn = localStorage.getItem('kurotv_theme_kawaii_sakura') === 'true';
        const finalFx: 'none' | 'hearts' | 'sakura' | 'both' =
          fx === 'both' || (heartsOn && sakuraOn)
            ? 'both'
            : heartsOn
            ? 'hearts'
            : sakuraOn
            ? 'sakura'
            : (fx as any);
        ensureKawaiiOverlay(finalFx);
        return;
      }
      if (e.key === 'kurotv_theme_bg_url' || e.key === 'kurotv_theme_bg_opacity') {
        applyBackgroundOverlay(document.body as HTMLElement);
        return;
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return null;
} 