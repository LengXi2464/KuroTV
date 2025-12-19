/**
 * 全局错误边界组件
 * 捕获组件树中的 JavaScript 错误并显示友好的错误界面
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

import { AppError, ErrorCode, logError, toAppError } from '@/lib/errors';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AppError, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

/**
 * 错误边界组件
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const appError = toAppError(error);
    return {
      hasError: true,
      error: appError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误
    logError(error, 'ErrorBoundary');
    console.error('Error Info:', errorInfo);

    // 调用自定义错误处理回调
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // 否则使用默认的错误界面
      return <DefaultErrorFallback error={this.state.error} reset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * 默认的错误展示组件
 */
function DefaultErrorFallback({
  error,
  reset,
}: {
  error: AppError;
  reset: () => void;
}) {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4'>
      <div className='max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6'>
        <div className='flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4'>
          <svg
            className='w-6 h-6 text-red-600 dark:text-red-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
            />
          </svg>
        </div>

        <h2 className='text-xl font-bold text-center text-gray-900 dark:text-white mb-2'>
          出错了
        </h2>

        <p className='text-center text-gray-600 dark:text-gray-400 mb-6'>
          {error.getUserMessage()}
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className='mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs'>
            <summary className='cursor-pointer text-gray-700 dark:text-gray-300 font-medium mb-2'>
              错误详情（开发模式）
            </summary>
            <div className='text-gray-600 dark:text-gray-400 space-y-1'>
              <p>
                <span className='font-semibold'>错误码:</span> {error.code}
              </p>
              <p>
                <span className='font-semibold'>消息:</span> {error.message}
              </p>
              {error.stack && (
                <pre className='mt-2 overflow-auto text-xs'>{error.stack}</pre>
              )}
            </div>
          </details>
        )}

        <div className='flex gap-3'>
          <button
            onClick={reset}
            className='flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200'
          >
            重试
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className='flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors duration-200'
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 用于函数组件的错误边界 Hook
 * 注意：这是一个辅助函数，实际的错误捕获仍需要 ErrorBoundary 组件
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}
