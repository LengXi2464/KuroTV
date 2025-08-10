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
    .skin-sunset {
      background: linear-gradient(180deg, #ff7e5f, #feb47b 40%, #6a82fb 100%);
    }
    .skin-ocean {
      background: 
        radial-gradient(circle at 20% 10%, rgba(59,130,246,.2), transparent 40%),
        radial-gradient(circle at 80% 30%, rgba(16,185,129,.2), transparent 40%),
        linear-gradient(180deg, #0ea5e9, #0369a1);
    }
  `;
  document.head.appendChild(style);
}

function applySkin(name: string | null) {
  const d = document.body;
  ensureSkinStyles();
  d.classList.remove(
    'skin-flow','skin-deepspace','skin-grid','skin-kawaii','skin-neon',
    'skin-stars','skin-glass','skin-paper','skin-sunset','skin-ocean'
  );
  if (!name || name === 'reset') {
    d.style.background = '';
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
    d.style.background = 'linear-gradient(135deg,#ffe0f0 0%,#e0f7ff 100%)';
    d.classList.add('skin-kawaii');
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