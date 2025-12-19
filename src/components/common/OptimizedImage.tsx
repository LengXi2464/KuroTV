/**
 * 图片加载优化工具
 * 提供图片懒加载、渐进式加载和占位符功能
 */

'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoadingComplete'> {
  fallback?: string;
  showPlaceholder?: boolean;
  placeholderClassName?: string;
}

/**
 * 优化的图片组件
 * 支持加载状态、错误处理和占位符
 */
export function OptimizedImage({
  src,
  alt,
  fallback = '/placeholder-image.jpg',
  showPlaceholder = true,
  placeholderClassName,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className='relative w-full h-full'>
      {/* 骨架屏占位符 */}
      {isLoading && showPlaceholder && (
        <div
          className={`absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700 ${placeholderClassName || ''}`}
        />
      )}

      <Image
        src={error ? fallback : src}
        alt={alt}
        className={`${className || ''} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
        {...props}
      />
    </div>
  );
}

/**
 * 渐进式图片加载组件
 * 先显示模糊的低质量图，然后加载高质量图
 */
export function ProgressiveImage({
  src,
  alt,
  lowQualitySrc,
  className,
  ...props
}: OptimizedImageProps & { lowQualitySrc?: string }) {
  const [highQualityLoaded, setHighQualityLoaded] = useState(false);

  return (
    <div className='relative w-full h-full'>
      {/* 低质量占位图 */}
      {lowQualitySrc && !highQualityLoaded && (
        <Image
          src={lowQualitySrc}
          alt={alt}
          className={`absolute inset-0 filter blur-sm ${className || ''}`}
          {...props}
        />
      )}

      {/* 高质量图片 */}
      <Image
        src={src}
        alt={alt}
        className={`${className || ''} ${highQualityLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
        onLoad={() => setHighQualityLoaded(true)}
        {...props}
      />
    </div>
  );
}
