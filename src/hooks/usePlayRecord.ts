/**
 * 播放记录自定义 Hook
 * 提供播放记录的读取、保存和删除功能
 */

import { useCallback, useEffect, useState } from 'react';

import {
  deletePlayRecord,
  generateStorageKey,
  getAllPlayRecords,
  PlayRecord,
  savePlayRecord,
  subscribeToDataUpdates,
} from '@/lib/db.client';
import { AppError, ErrorCode, logError, toAppError } from '@/lib/errors';

interface UsePlayRecordOptions {
  source?: string;
  id?: string;
  autoFetch?: boolean;
}

interface UsePlayRecordReturn {
  record: PlayRecord | null;
  allRecords: Record<string, PlayRecord>;
  isLoading: boolean;
  error: AppError | null;
  saveRecord: (record: PlayRecord) => Promise<void>;
  deleteRecord: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * 播放记录 Hook
 * @param options 配置选项
 * @returns 播放记录状态和操作方法
 */
export function usePlayRecord(
  options: UsePlayRecordOptions = {}
): UsePlayRecordReturn {
  const { source, id, autoFetch = true } = options;

  const [record, setRecord] = useState<PlayRecord | null>(null);
  const [allRecords, setAllRecords] = useState<Record<string, PlayRecord>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  /**
   * 获取播放记录
   */
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const records = await getAllPlayRecords();
      setAllRecords(records);

      // 如果指定了 source 和 id，提取对应的记录
      if (source && id) {
        const key = generateStorageKey(source, id);
        setRecord(records[key] || null);
      }
    } catch (err) {
      const appError = toAppError(err);
      setError(appError);
      logError(err, 'usePlayRecord.fetchRecords');
    } finally {
      setIsLoading(false);
    }
  }, [source, id]);

  /**
   * 保存播放记录
   */
  const saveRecord = useCallback(
    async (recordData: PlayRecord) => {
      if (!source || !id) {
        throw new AppError('Source and ID are required', ErrorCode.VALIDATION_ERROR);
      }

      setIsLoading(true);
      setError(null);

      try {
        await savePlayRecord(source, id, recordData);
        setRecord(recordData);
      } catch (err) {
        const appError = toAppError(err);
        setError(appError);
        logError(err, 'usePlayRecord.saveRecord');
        throw appError;
      } finally {
        setIsLoading(false);
      }
    },
    [source, id]
  );

  /**
   * 删除播放记录
   */
  const deleteRecord = useCallback(async () => {
    if (!source || !id) {
      throw new AppError('Source and ID are required', ErrorCode.VALIDATION_ERROR);
    }

    setIsLoading(true);
    setError(null);

    try {
      await deletePlayRecord(source, id);
      setRecord(null);
    } catch (err) {
      const appError = toAppError(err);
      setError(appError);
      logError(err, 'usePlayRecord.deleteRecord');
      throw appError;
    } finally {
      setIsLoading(false);
    }
  }, [source, id]);

  /**
   * 刷新播放记录
   */
  const refresh = useCallback(async () => {
    await fetchRecords();
  }, [fetchRecords]);

  // 自动获取播放记录
  useEffect(() => {
    if (autoFetch) {
      fetchRecords();
    }
  }, [autoFetch, fetchRecords]);

  // 监听播放记录更新
  useEffect(() => {
    if (!source || !id) return;

    const storageKey = generateStorageKey(source, id);
    const unsubscribe = subscribeToDataUpdates(
      'playRecordsUpdated',
      (newRecords: Record<string, PlayRecord>) => {
        setAllRecords(newRecords);
        setRecord(newRecords[storageKey] || null);
      }
    );

    return unsubscribe;
  }, [source, id]);

  return {
    record,
    allRecords,
    isLoading,
    error,
    saveRecord,
    deleteRecord,
    refresh,
  };
}
