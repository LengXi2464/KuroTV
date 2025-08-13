/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

import { useSite } from '@/components/SiteProvider';
import { ThemeToggle } from '@/components/ThemeToggle';

function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shouldAskUsername, setShouldAskUsername] = useState(false);
  const [enableRegister, setEnableRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [shake, setShake] = useState(false);
  const triedAutoLoginRef = useRef(false);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const usernameInputRef = useRef<HTMLInputElement | null>(null);
  const { siteName } = useSite();

  // 在客户端挂载后设置配置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageType = (window as any).RUNTIME_CONFIG?.STORAGE_TYPE;
      setShouldAskUsername(storageType && storageType !== 'localstorage');
      setEnableRegister(Boolean((window as any).RUNTIME_CONFIG?.ENABLE_REGISTER));

      // Remember me 初始化
      const rm = localStorage.getItem('kurotv_remember_me') === 'true';
      setRememberMe(rm);
      if (rm) {
        const savedPwd = localStorage.getItem('kurotv_saved_password') || '';
        const savedUsr = localStorage.getItem('kurotv_saved_username') || '';
        if (savedPwd) setPassword(savedPwd);
        if (savedUsr) setUsername(savedUsr);
      }
    }
  }, []);

  // CapsLock 提示
  const handlePasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const caps = typeof e.getModifierState === 'function' ? e.getModifierState('CapsLock') : false;
    setCapsLockOn(Boolean(caps));
  };

  // 聚焦时尽量把输入框滚到可视区域中心，缓解移动端键盘遮挡
  const scrollIntoViewSafe = (el: HTMLElement | null) => {
    if (!el) return;
    try {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } catch (err) {
      void err;
    }
  };

  async function performLogin(u?: string, p?: string) {
    setError(null);
    if (!(p || password) || (shouldAskUsername && !(u || username))) return;

    try {
      setLoading(true);
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: p ?? password,
          ...(shouldAskUsername ? { username: u ?? username } : {}),
        }),
      });

      if (res.ok) {
        // 记住我
        if (rememberMe) {
          try {
            localStorage.setItem('kurotv_remember_me', 'true');
            localStorage.setItem('kurotv_saved_password', p ?? password);
            if (shouldAskUsername) {
              localStorage.setItem('kurotv_saved_username', u ?? username);
            }
          } catch (err) {
            void err;
          }
        } else {
          try {
            localStorage.removeItem('kurotv_remember_me');
            localStorage.removeItem('kurotv_saved_password');
            localStorage.removeItem('kurotv_saved_username');
          } catch (err) {
            void err;
          }
        }

        const redirect = searchParams.get('redirect') || '/';
        router.replace(redirect);
      } else if (res.status === 401) {
        setError('密码错误');
        setShake(true);
        setTimeout(() => setShake(false), 600);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? '服务器错误');
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  }

  // 表单提交
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await performLogin();
  };

  // 处理注册逻辑
  const handleRegister = async () => {
    setError(null);
    if (!password || !username) return;

    try {
      setLoading(true);
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const redirect = searchParams.get('redirect') || '/';
        router.replace(redirect);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? '服务器错误');
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  // 自动登录（仅尝试一次）
  useEffect(() => {
    if (triedAutoLoginRef.current) return;
    triedAutoLoginRef.current = true;
    try {
      const rm = localStorage.getItem('kurotv_remember_me') === 'true';
      if (!rm) return;
      const savedPwd = localStorage.getItem('kurotv_saved_password') || '';
      const savedUsr = localStorage.getItem('kurotv_saved_username') || '';
      if (savedPwd && (!shouldAskUsername || savedUsr)) {
        performLogin(savedUsr, savedPwd);
      }
    } catch (err) {
      void err;
    }
  }, [shouldAskUsername]);

  const baseInputClass =
    'block w-full rounded-lg border-0 py-3 px-4 sm:py-3 sm:px-4 pr-12 text-gray-900 dark:text-gray-100 shadow-sm ring-1 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none sm:text-base bg-white/60 dark:bg-zinc-800/60 backdrop-blur';

  const ringNormal = 'ring-white/60 dark:ring-white/20 focus:ring-2 focus:ring-green-500';
  const ringError = 'ring-red-400/70 focus:ring-2 focus:ring-red-500';

  // 错误类型分层
  const errorType: 'network' | 'server' | 'password' | null = error
    ? /网络/.test(error)
      ? 'network'
      : /服务器/.test(error)
      ? 'server'
      : /密码/.test(error)
      ? 'password'
      : null
    : null;

  return (
    <div className='relative min-h-screen flex items-center justify-center px-4 overflow-hidden'>
      {/* 背景：渐变天空 + 轻量漂浮光斑 */}
      <style jsx>{`
        @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes floatUp { 0% { transform: translateY(10px); opacity:.15 } 50% { transform: translateY(-10px); opacity:.25 } 100% { transform: translateY(10px); opacity:.15 } }
        .hero-bg { background: linear-gradient(180deg, #e6f0ff 0%, #f7fbff 45%, #eef7ff 55%, #eaf3ff 100%); }
        .hero-gradient { background: linear-gradient(120deg, rgba(99,102,241,.25), rgba(16,185,129,.25), rgba(236,72,153,.22)); background-size: 200% 200%; animation: gradientShift 18s ease-in-out infinite; filter: blur(60px) saturate(120%); }
        .orb { filter: blur(18px); animation: floatUp 6s ease-in-out infinite; }
        :global(.dark) .hero-bg { background: linear-gradient(180deg, #0b1220 0%, #0f172a 45%, #0a1428 55%, #0b1322 100%); }
        :global(.dark) .hero-gradient { background: linear-gradient(120deg, rgba(59,130,246,.25), rgba(16,185,129,.18), rgba(168,85,247,.22)); }
        :global(.dark) .orb { filter: blur(22px); }
        /* 星野 */
        .starfield { background-image: radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,.7), transparent 40%), radial-gradient(1px 1px at 80% 30%, rgba(255,255,255,.5), transparent 40%), radial-gradient(2px 2px at 50% 80%, rgba(255,255,255,.4), transparent 40%); opacity:.2; animation: starDrift 60s linear infinite; }
        @keyframes starDrift { from{ background-position: 0 0, 0 0, 0 0; } to { background-position: 600px 300px, -500px 200px, 400px -200px; } }
      `}</style>
      <div className='absolute inset-0 hero-bg'></div>
      <div className='pointer-events-none absolute inset-0 hero-gradient opacity-[.25]'></div>
      <div className='pointer-events-none absolute inset-0 starfield'></div>
      <div className='pointer-events-none absolute -top-10 left-10 w-60 h-60 rounded-full bg-pink-200/40 orb parallax' style={{ animationDelay: '0s' }} />
      <div className='pointer-events-none absolute top-16 right-24 w-72 h-72 rounded-full bg-blue-200/40 orb parallax' style={{ animationDelay: '.8s' }} />
      <div className='pointer-events-none absolute bottom-10 left-1/4 w-52 h-52 rounded-full bg-emerald-200/40 orb parallax' style={{ animationDelay: '1.6s' }} />
      {/* Hero 标题（可选宣传语） */}
      <div className='absolute top-16 w-full text-center select-none z-0'>
        <div className='inline-block px-4 py-1 text-xs rounded-full bg-white/60 dark:bg-zinc-900/40 ring-1 ring-white/40 dark:ring-white/10 text-gray-700 dark:text-gray-200'>Welcome to</div>
        <h2 className='mt-2 text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-emerald-500 to-blue-600 drop-shadow-sm'>KuroTV</h2>
        <p className='mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300'>聚合搜索 · 极速播放 · 清爽体验</p>
      </div>
      <div className='absolute top-4 right-4'>
        <ThemeToggle />
      </div>
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
        }
        .animate-shake { animation: shake .35s ease-in-out; }
      `}</style>
      <div className={`relative z-10 w-full max-w-md rounded-3xl bg-gradient-to-b from-white/90 via-white/70 to-white/40 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-900/40 backdrop-blur-xl shadow-2xl p-8 sm:p-10 border border-white/40 dark:border-white/10 ${shake ? 'animate-shake' : ''}`} style={{ boxShadow: '0 0 0 2px rgba(34,197,94,.15), 0 10px 30px rgba(0,0,0,.25)' }}>
        <h1 className='text-green-600 tracking-tight text-center text-3xl font-extrabold mb-8 bg-clip-text drop-shadow-sm'>
          {siteName}
        </h1>
        <form onSubmit={handleSubmit} className='space-y-6 sm:space-y-8'>
          {shouldAskUsername && (
            <div>
              <label htmlFor='username' className='sr-only'>
                用户名
              </label>
              <input
                ref={usernameInputRef}
                id='username'
                type='text'
                autoComplete='username'
                className={`${baseInputClass} ${errorType ? ringError : ringNormal}`}
                placeholder='输入用户名'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => scrollIntoViewSafe(usernameInputRef.current)}
              />
            </div>
          )}

          <div>
            <label htmlFor='password' className='sr-only'>
              密码
            </label>
            <div className='relative'>
              <input
                ref={passwordInputRef}
                id='password'
                type={showPassword ? 'text' : 'password'}
                autoComplete='current-password'
                className={`${baseInputClass} ${errorType ? ringError : ringNormal}`}
                placeholder='输入访问密码'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={handlePasswordKey}
                onFocus={() => scrollIntoViewSafe(passwordInputRef.current)}
              />
              <button type='button' onClick={() => setShowPassword((v) => !v)} className='absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-white/50 dark:bg-zinc-800/50 ring-1 ring-white/50 dark:ring-white/10 hover:bg-white/70 dark:hover:bg-zinc-800/70'>
                {showPassword ? '隐藏' : '显示'}
              </button>
            </div>
            {capsLockOn && (
              <p className='mt-1 text-xs text-amber-600 dark:text-amber-400'>已开启大写锁定（CapsLock），可能导致密码错误</p>
            )}
          </div>

          {/* 记住我 */}
          <div className='flex items-center justify-between'>
            <label className='inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300'>
              <input
                type='checkbox'
                checked={rememberMe}
                onChange={(e) => {
                  const v = e.target.checked;
                  setRememberMe(v);
                  try {
                    localStorage.setItem('kurotv_remember_me', String(v));
                    if (!v) {
                      localStorage.removeItem('kurotv_saved_password');
                      localStorage.removeItem('kurotv_saved_username');
                    }
                  } catch (err) {
                    void err;
                  }
                }}
              />
              记住我（自动填充/自动登录）
            </label>
          </div>

          {/* 场景化错误提示 */}
          {errorType === 'password' && (
            <div className='text-xs rounded-md p-3 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300 ring-1 ring-red-200/60 dark:ring-red-800/40'>
              密码错误：请检查大小写或是否存在误输入空格。
            </div>
          )}
          {errorType === 'network' && (
            <div className='text-xs rounded-md p-3 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 ring-1 ring-amber-200/60 dark:ring-amber-800/40'>
              网络异常：请检查网络连接，或稍后重试。
            </div>
          )}
          {errorType === 'server' && (
            <div className='text-xs rounded-md p-3 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 ring-1 ring-blue-200/60 dark:ring-blue-800/40'>
              服务器开小差：请稍后再次尝试，或联系管理员。
            </div>
          )}

          {/* 登录 / 注册按钮 */}
          {shouldAskUsername && enableRegister ? (
            <div className='flex gap-4'>
              <button
                type='button'
                onClick={handleRegister}
                disabled={!password || !username || loading}
                className='flex-1 inline-flex justify-center rounded-lg bg-blue-600 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {loading ? '注册中...' : '注册'}
              </button>
              <button
                type='submit'
                disabled={!password || loading || (shouldAskUsername && !username)}
                className='flex-1 inline-flex justify-center rounded-lg bg-green-600 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:from-green-600 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {loading ? (
                  <span className='inline-flex items-center gap-2'>
                    <span className='inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin' />
                    登录中...
                  </span>
                ) : (
                  '登录'
                )}
              </button>
            </div>
          ) : (
            <button
              type='submit'
              disabled={!password || loading || (shouldAskUsername && !username)}
              className='inline-flex w-full justify-center rounded-lg bg-green-600 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:from-green-600 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {loading ? (
                <span className='inline-flex items-center gap-2'>
                  <span className='inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin' />
                  登录中...
                </span>
              ) : (
                '登录'
              )}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageClient />
    </Suspense>
  );
}

// 视差交互
if (typeof window !== 'undefined') {
  const updateParallax = (x = 0, y = 0) => {
    document.querySelectorAll<HTMLElement>('.parallax').forEach((el, i) => {
      const depth = (i + 1) * 10;
      el.style.transform = `translate3d(${x / depth}px, ${y / depth}px, 0)`;
    });
  };
  window.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    updateParallax(e.clientX - cx, e.clientY - cy);
  });
  if ('DeviceOrientationEvent' in window) {
    window.addEventListener('deviceorientation', (e: any) => {
      const x = (e.gamma || 0) * 3;
      const y = (e.beta || 0) * 3;
      updateParallax(x, y);
    });
  }
}
