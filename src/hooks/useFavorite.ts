/**
 * 收藏功能自定义 Hook
 * 提供收藏状态管理和操作方法
 */

import { useCallback, useEffect, useState } from 'react';

import {
  deleteFavorite,
  Favorite,
  generateStorageKey,
  isFavorited,
  saveFavorite,
  subscribeToDataUpdates,
} from '@/lib/db.client';
import { AppError, ErrorCode, logError, toAppError } from '@/lib/errors';

interface UseFavoriteOptions {
  source?: string;
  id?: string;
  autoFetch?: boolean;
}

interface UseFavoriteReturn {
  isFavorited: boolean;
  isLoading: boolean;
  error: AppError | null;
  toggleFavorite: (data: Omit<Favorite, 'save_time'>) => Promise<void>;
  addFavorite: (data: Omit<Favorite, 'save_time'>) => Promise<void>;
  removeFavorite: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * 收藏功能 Hook
 * @param options 配置选项
 * @returns 收藏状态和操作方法
 */
export function useFavorite(options: UseFavoriteOptions = {}): UseFavoriteReturn {
  const { source, id, autoFetch = true } = options;

  const [favorited, setFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  /**
   * 获取收藏状态
   */
  const fetchFavoriteStatus = useCallback(async () => {
    if (!source || !id) return;

    setIsLoading(true);
    setError(null);

    try {
      const status = await isFavorited(source, id);
      setFavorited(status);
    } catch (err) {
      const appError = toAppError(err);
      setError(appError);
      logError(err, 'useFavorite.fetchFavoriteStatus');
    } finally {
      setIsLoading(false);
    }
  }, [source, id]);

  /**
   * 添加收藏
   */
  const addFavorite = useCallback(
    async (data: Omit<Favorite, 'save_time'>) => {
      if (!source || !id) {
        const err = new AppError(
          'Source and ID are required',
          ErrorCode.VALIDATION_ERROR,
          '缺少必要参数'
        );
        setError(err);
        throw err;
      }

      setIsLoading(true);
      setError(null);

      try {
        await saveFavorite(source, id, {
          ...data,
          save_time: Date.now(),
        });
        setFavorited(true);
      } catch (err) {
        const appError = toAppError(err);
        setError(appError);
        logError(err, 'useFavorite.addFavorite');
        throw appError;
      } finally {
        setIsLoading(false);
      }
    },
    [source, id]
  );

  /**
   * 移除收藏
   */
  const removeFavorite = useCallback(async () => {
    if (!source || !id) {
      const err = new AppError(
        'Source and ID are required',
        ErrorCode.VALIDATION_ERROR,
        '缺少必要参数'
      );
      setError(err);
      throw err;
    }

    setIsLoading(true);
    setError(null);

    try {
      await deleteFavorite(source, id);
      setFavorited(false);
    } catch (err) {
      const appError = toAppError(err);
      setError(appError);
      logError(err, 'useFavorite.removeFavorite');
      throw appError;
    } finally {
      setIsLoading(false);
    }
  }, [source, id]);

  /**
   * 切换收藏状态
   */
  const toggleFavorite = useCallback(
    async (data: Omit<Favorite, 'save_time'>) => {
      if (favorited) {
        await removeFavorite();
      } else {
        await addFavorite(data);
      }
    },
    [favorited, addFavorite, removeFavorite]
  );

  /**
   * 刷新收藏状态
   */
  const refresh = useCallback(async () => {
    await fetchFavoriteStatus();
  }, [fetchFavoriteStatus]);

  // 自动获取收藏状态
  useEffect(() => {
    if (autoFetch) {
      fetchFavoriteStatus();
    }
  }, [autoFetch, fetchFavoriteStatus]);

  // 监听收藏数据更新
  useEffect(() => {
    if (!source || !id) return;

    const storageKey = generateStorageKey(source, id);
    const unsubscribe = subscribeToDataUpdates(
      'favoritesUpdated',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (newFavorites: Record<string, any>) => {
        const isNowFavorited = !!newFavorites[storageKey];
        setFavorited(isNowFavorited);
      }
    );

    return unsubscribe;
  }, [source, id]);

  return {
    isFavorited: favorited,
    isLoading,
    error,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    refresh,
  };
}
