/**
 * Loading 加载组件
 * 提供各种加载状态的UI展示
 */

'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * 旋转加载器
 */
export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-green-600 ${sizes[size]} ${className}`}
      role='status'
      aria-label='Loading'
    />
  );
}

/**
 * 全屏加载器
 */
export function FullPageLoader({ message = '加载中...' }: { message?: string }) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm'>
      <div className='text-center'>
        <LoadingSpinner size='lg' className='mx-auto mb-4' />
        <p className='text-gray-700 dark:text-gray-300'>{message}</p>
      </div>
    </div>
  );
}

/**
 * 骨架屏 - 文本行
 */
export function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div
      className={`h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}
    />
  );
}

/**
 * 骨架屏 - 卡片
 */
export function SkeletonCard({ aspectRatio = 'aspect-[2/3]' }: { aspectRatio?: string }) {
  return (
    <div className='w-full'>
      {/* 图片骨架 */}
      <div
        className={`${aspectRatio} w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-2`}
      />
      {/* 标题骨架 */}
      <SkeletonLine className='w-3/4 mb-2' />
      {/* 描述骨架 */}
      <SkeletonLine className='w-1/2' />
    </div>
  );
}

/**
 * 骨架屏 - 视频卡片网格
 */
export function SkeletonVideoGrid({ count = 8 }: { count?: number }) {
  return (
    <div className='grid grid-cols-3 gap-x-2 gap-y-14 sm:gap-y-20 px-0 sm:px-2 sm:grid-cols-[repeat(auto-fill,_minmax(11rem,_1fr))] sm:gap-x-8'>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

/**
 * 点加载器
 */
export function DotsLoader() {
  return (
    <div className='flex items-center justify-center space-x-2'>
      <div className='w-2 h-2 bg-green-600 rounded-full animate-bounce [animation-delay:-0.3s]' />
      <div className='w-2 h-2 bg-green-600 rounded-full animate-bounce [animation-delay:-0.15s]' />
      <div className='w-2 h-2 bg-green-600 rounded-full animate-bounce' />
    </div>
  );
}

/**
 * 进度条
 */
export function ProgressBar({ progress, className = '' }: { progress: number; className?: string }) {
  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className='h-full bg-green-600 transition-all duration-300 ease-out'
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}

/**
 * 空状态组件
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
      {icon && <div className='mb-4 text-gray-400 dark:text-gray-600'>{icon}</div>}
      <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
        {title}
      </h3>
      {description && (
        <p className='text-gray-600 dark:text-gray-400 mb-4 max-w-md'>{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
