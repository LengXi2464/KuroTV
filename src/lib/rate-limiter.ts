/**
 * API 速率限制器
 * 基于内存的简单速率限制实现
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * 速率限制器类
 */
export class RateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // 定期清理过期记录
    setInterval(() => this.cleanup(), windowMs);
  }

  /**
   * 检查是否超过速率限制
   * @param identifier 标识符（通常是 IP 地址）
   * @param endpoint 端点名称（可选，用于不同端点不同限制）
   * @returns 是否允许请求
   */
  check(identifier: string, endpoint = 'default'): boolean {
    const key = `${identifier}:${endpoint}`;
    const now = Date.now();
    const record = this.records.get(key);

    if (!record || now > record.resetTime) {
      // 创建新记录或重置过期记录
      this.records.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * 获取剩余配额
   * @param identifier 标识符
   * @param endpoint 端点名称
   * @returns 剩余请求数
   */
  getRemainingQuota(identifier: string, endpoint = 'default'): number {
    const key = `${identifier}:${endpoint}`;
    const now = Date.now();
    const record = this.records.get(key);

    if (!record || now > record.resetTime) {
      return this.maxRequests;
    }

    return Math.max(0, this.maxRequests - record.count);
  }

  /**
   * 获取重置时间
   * @param identifier 标识符
   * @param endpoint 端点名称
   * @returns 重置时间戳，如果不存在记录则返回 null
   */
  getResetTime(identifier: string, endpoint = 'default'): number | null {
    const key = `${identifier}:${endpoint}`;
    const record = this.records.get(key);
    return record?.resetTime || null;
  }

  /**
   * 清理过期记录
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, record] of Array.from(this.records.entries())) {
      if (now > record.resetTime) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.records.delete(key));
  }

  /**
   * 重置指定标识符的限制
   * @param identifier 标识符
   * @param endpoint 端点名称
   */
  reset(identifier: string, endpoint = 'default'): void {
    const key = `${identifier}:${endpoint}`;
    this.records.delete(key);
  }

  /**
   * 清除所有记录
   */
  clearAll(): void {
    this.records.clear();
  }
}

/**
 * 创建默认的速率限制器实例
 * 100 requests per minute
 */
export const defaultRateLimiter = new RateLimiter(100, 60000);

/**
 * 创建严格的速率限制器
 * 用于敏感操作（如登录、注册）
 * 5 requests per minute
 */
export const strictRateLimiter = new RateLimiter(5, 60000);

/**
 * 获取客户端 IP 地址的辅助函数
 * @param request Next.js Request 对象
 * @returns IP 地址
 */
export function getClientIp(request: Request): string {
  // 尝试从各种 header 获取真实 IP
  const headers = request.headers;

  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // 降级到默认值
  return 'unknown';
}
