/**
 * 统一错误处理系统
 * 提供类型安全的错误定义和友好的用户提示
 */

/**
 * 应用错误码枚举
 */
export enum ErrorCode {
  // 网络相关
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT = 'TIMEOUT',

  // 认证相关
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // 数据相关
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  INVALID_DATA = 'INVALID_DATA',
  STORAGE_ERROR = 'STORAGE_ERROR',

  // 播放相关
  VIDEO_LOAD_ERROR = 'VIDEO_LOAD_ERROR',
  VIDEO_PLAY_ERROR = 'VIDEO_PLAY_ERROR',

  // 其他
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

/**
 * 应用错误类
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    public userMessage?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AppError';

    // 维护正确的堆栈跟踪（仅在 V8 中）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserMessage(): string {
    if (this.userMessage) {
      return this.userMessage;
    }

    // 根据错误码返回默认的用户友好消息
    return getDefaultUserMessage(this.code);
  }

  /**
   * 转换为 JSON 格式
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      userMessage: this.getUserMessage(),
    };
  }
}

/**
 * 网络错误
 */
export class NetworkError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(
      message,
      ErrorCode.NETWORK_ERROR,
      '网络连接失败，请检查您的网络设置',
      originalError
    );
    this.name = 'NetworkError';
  }
}

/**
 * API 错误
 */
export class ApiError extends AppError {
  constructor(
    message: string,
    public statusCode?: number,
    originalError?: unknown
  ) {
    super(message, ErrorCode.API_ERROR, '服务请求失败，请稍后重试', originalError);
    this.name = 'ApiError';
  }
}

/**
 * 认证错误
 */
export class AuthError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(
      message,
      ErrorCode.UNAUTHORIZED,
      '登录已过期，请重新登录',
      originalError
    );
    this.name = 'AuthError';
  }
}

/**
 * 数据错误
 */
export class DataError extends AppError {
  constructor(message: string, code: ErrorCode, userMessage?: string) {
    super(message, code, userMessage);
    this.name = 'DataError';
  }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public field?: string,
    userMessage?: string
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, userMessage);
    this.name = 'ValidationError';
  }
}

/**
 * 根据错误码获取默认的用户友好消息
 */
function getDefaultUserMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查您的网络设置',
    [ErrorCode.API_ERROR]: '服务请求失败，请稍后重试',
    [ErrorCode.TIMEOUT]: '请求超时，请稍后重试',
    [ErrorCode.UNAUTHORIZED]: '请先登录',
    [ErrorCode.FORBIDDEN]: '没有权限访问',
    [ErrorCode.SESSION_EXPIRED]: '登录已过期，请重新登录',
    [ErrorCode.DATA_NOT_FOUND]: '未找到相关数据',
    [ErrorCode.INVALID_DATA]: '数据格式错误',
    [ErrorCode.STORAGE_ERROR]: '数据存储失败',
    [ErrorCode.VIDEO_LOAD_ERROR]: '视频加载失败',
    [ErrorCode.VIDEO_PLAY_ERROR]: '视频播放失败',
    [ErrorCode.UNKNOWN_ERROR]: '发生未知错误',
    [ErrorCode.VALIDATION_ERROR]: '输入的数据不正确',
  };

  return messages[code] || '发生错误';
}

/**
 * 错误处理工具函数
 */

/**
 * 将未知错误转换为 AppError
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, ErrorCode.UNKNOWN_ERROR, undefined, error);
  }

  if (typeof error === 'string') {
    return new AppError(error, ErrorCode.UNKNOWN_ERROR);
  }

  return new AppError('发生未知错误', ErrorCode.UNKNOWN_ERROR, undefined, error);
}

/**
 * 安全地处理错误并返回用户友好的消息
 */
export function getErrorMessage(error: unknown): string {
  const appError = toAppError(error);
  return appError.getUserMessage();
}

/**
 * 判断是否为网络错误
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return true;
  }

  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch')
    );
  }

  return false;
}

/**
 * 判断是否为认证错误
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AuthError) {
    return true;
  }

  if (error instanceof ApiError) {
    return error.statusCode === 401 || error.statusCode === 403;
  }

  return false;
}

/**
 * 记录错误到控制台（开发环境）
 */
export function logError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error);
  }
}
