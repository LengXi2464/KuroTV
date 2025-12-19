/**
 * CSRF 保护工具
 * 提供 CSRF Token 的生成和验证功能
 */

/**
 * 生成 CSRF Token
 * 使用加密安全的随机数生成器
 */
export function generateCsrfToken(): string {
  if (typeof window === 'undefined') {
    // 服务器端使用 crypto
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  // 浏览器端使用 Web Crypto API
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 存储 CSRF Token 到 sessionStorage
 */
export function storeCsrfToken(token: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('csrf_token', token);
  }
}

/**
 * 从 sessionStorage 获取 CSRF Token
 */
export function getCsrfToken(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('csrf_token');
  }
  return null;
}

/**
 * 验证 CSRF Token
 * @param token 要验证的 token
 * @param storedToken 存储的 token
 */
export function verifyCsrfToken(token: string, storedToken: string): boolean {
  // 使用时间安全的比较防止定时攻击
  if (!token || !storedToken || token.length !== storedToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }

  return result === 0;
}

/**
 * 为 fetch 请求添加 CSRF Token
 */
export function addCsrfHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getCsrfToken();
  if (token) {
    return {
      ...headers,
      'X-CSRF-Token': token,
    };
  }
  return headers;
}

/**
 * 初始化 CSRF 保护
 * 在应用启动时调用，生成并存储 token
 */
export function initCsrfProtection(): string {
  let token = getCsrfToken();
  if (!token) {
    token = generateCsrfToken();
    storeCsrfToken(token);
  }
  return token;
}

/**
 * 清除 CSRF Token
 * 在登出时调用
 */
export function clearCsrfToken(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('csrf_token');
  }
}
