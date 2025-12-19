/**
 * API 请求管理器
 * 提供请求去重、取消、重试等功能
 */

import { API_CONFIG } from './constants';
import { ApiError, AppError, ErrorCode, NetworkError } from './errors';

interface RequestOptions extends RequestInit {
  timeout?: number;
  retry?: number;
  retryDelay?: number;
}

/**
 * 请求缓存管理
 */
class RequestCache {
  private cache = new Map<string, Promise<Response>>();

  get(key: string): Promise<Response> | undefined {
    return this.cache.get(key);
  }

  set(key: string, promise: Promise<Response>): void {
    this.cache.set(key, promise);

    // 请求完成后清除缓存
    promise.finally(() => {
      this.cache.delete(key);
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const requestCache = new RequestCache();

/**
 * 生成请求缓存 key
 */
function getCacheKey(url: string, options?: RequestOptions): string {
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.stringify(options.body) : '';
  return `${method}:${url}:${body}`;
}

/**
 * 创建带超时的 AbortController
 */
function createTimeoutController(timeout: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller;
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 增强的 fetch 函数
 * 支持超时、重试、请求去重
 */
async function enhancedFetch(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const {
    timeout = API_CONFIG.TIMEOUT,
    retry = API_CONFIG.MAX_RETRIES,
    retryDelay = API_CONFIG.RETRY_DELAY,
    ...fetchOptions
  } = options;

  // 请求去重：如果相同请求正在进行，直接返回
  const cacheKey = getCacheKey(url, options);
  const cachedRequest = requestCache.get(cacheKey);
  if (cachedRequest) {
    return cachedRequest;
  }

  // 创建超时控制器
  const timeoutController = createTimeoutController(timeout);

  // 合并 AbortSignal
  const signal = options.signal
    ? combineSignals([options.signal, timeoutController.signal])
    : timeoutController.signal;

  const fetchPromise = fetchWithRetry(
    url,
    { ...fetchOptions, signal },
    retry,
    retryDelay
  );

  // 缓存请求
  requestCache.set(cacheKey, fetchPromise);

  return fetchPromise;
}

/**
 * 带重试的 fetch
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number,
  retryDelay: number,
  attempt = 0
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    // 如果响应不成功，根据状态码决定是否重试
    if (!response.ok) {
      // 4xx 错误通常不需要重试
      if (response.status >= 400 && response.status < 500) {
        throw new ApiError(
          `Request failed with status ${response.status}`,
          response.status
        );
      }

      // 5xx 错误可以重试
      if (attempt < maxRetries) {
        await delay(retryDelay * Math.pow(2, attempt)); // 指数退避
        return fetchWithRetry(url, options, maxRetries, retryDelay, attempt + 1);
      }

      throw new ApiError(
        `Request failed with status ${response.status}`,
        response.status
      );
    }

    return response;
  } catch (error) {
    // 网络错误或超时，尝试重试
    if (attempt < maxRetries && !isAbortError(error)) {
      await delay(retryDelay * Math.pow(2, attempt));
      return fetchWithRetry(url, options, maxRetries, retryDelay, attempt + 1);
    }

    // 转换错误类型
    if (isAbortError(error)) {
      throw new AppError('Request timeout', ErrorCode.TIMEOUT, '请求超时，请稍后重试');
    }

    if (isNetworkError(error)) {
      throw new NetworkError('Network request failed', error);
    }

    throw error;
  }
}

/**
 * 合并多个 AbortSignal
 */
function combineSignals(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }

    signal.addEventListener('abort', () => {
      controller.abort();
    });
  }

  return controller.signal;
}

/**
 * 判断是否为取消错误
 */
function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'AbortError' || error.name === 'TimeoutError')
  );
}

/**
 * 判断是否为网络错误
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch')
    );
  }
  return false;
}

/**
 * API 请求辅助函数
 */

/**
 * GET 请求
 */
export async function apiGet<T>(
  url: string,
  options?: RequestOptions
): Promise<T> {
  const response = await enhancedFetch(url, {
    ...options,
    method: 'GET',
  });

  if (!response.ok) {
    throw new ApiError(`GET ${url} failed`, response.status);
  }

  return response.json();
}

/**
 * POST 请求
 */
export async function apiPost<T>(
  url: string,
  data?: unknown,
  options?: RequestOptions
): Promise<T> {
  const response = await enhancedFetch(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new ApiError(`POST ${url} failed`, response.status);
  }

  return response.json();
}

/**
 * PUT 请求
 */
export async function apiPut<T>(
  url: string,
  data?: unknown,
  options?: RequestOptions
): Promise<T> {
  const response = await enhancedFetch(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new ApiError(`PUT ${url} failed`, response.status);
  }

  return response.json();
}

/**
 * DELETE 请求
 */
export async function apiDelete<T>(
  url: string,
  options?: RequestOptions
): Promise<T> {
  const response = await enhancedFetch(url, {
    ...options,
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new ApiError(`DELETE ${url} failed`, response.status);
  }

  // DELETE 请求可能没有响应体
  const text = await response.text();
  return text ? JSON.parse(text) : {} as T;
}

/**
 * 清除所有请求缓存
 */
export function clearRequestCache(): void {
  requestCache.clear();
}
