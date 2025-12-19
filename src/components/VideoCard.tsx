/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { Heart, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useCallback, useMemo, useState } from 'react';

import { deletePlayRecord } from '@/lib/db.client';
import { getErrorMessage } from '@/lib/errors';
import { SearchResult } from '@/lib/types';
import { processImageUrl } from '@/lib/utils';
import { useFavorite } from '@/hooks/useFavorite';
import { useToast } from '@/components/common/Toast';

interface VideoCardProps {
  id?: string;
  source?: string;
  title?: string;
  query?: string;
  poster?: string;
  episodes?: number;
  source_name?: string;
  progress?: number;
  year?: string;
  from: 'playrecord' | 'favorite' | 'search' | 'douban';
  currentEpisode?: number;
  douban_id?: string;
  onDelete?: () => void;
  rate?: string;
  items?: SearchResult[];
  type?: string;
}

export default function VideoCard({
  id,
  title = '',
  query = '',
  poster = '',
  episodes,
  source,
  source_name,
  progress = 0,
  year,
  from,
  currentEpisode,
  douban_id,
  onDelete,
  rate,
  items,
  type = '',
}: VideoCardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const isAggregate = from === 'search' && !!items?.length;

  const aggregateData = useMemo(() => {
    if (!isAggregate || !items) return null;
    const countMap = new Map<string | number, number>();
    const episodeCountMap = new Map<number, number>();
    items.forEach((item) => {
      if (item.douban_id && item.douban_id !== 0) {
        countMap.set(item.douban_id, (countMap.get(item.douban_id) || 0) + 1);
      }
      const len = item.episodes?.length || 0;
      if (len > 0) {
        episodeCountMap.set(len, (episodeCountMap.get(len) || 0) + 1);
      }
    });

    const getMostFrequent = <T extends string | number>(
      map: Map<T, number>
    ) => {
      let maxCount = 0;
      let result: T | undefined;
      map.forEach((cnt, key) => {
        if (cnt > maxCount) {
          maxCount = cnt;
          result = key;
        }
      });
      return result;
    };

    return {
      first: items[0],
      mostFrequentDoubanId: getMostFrequent(countMap),
      mostFrequentEpisodes: getMostFrequent(episodeCountMap) || 0,
    };
  }, [isAggregate, items]);

  const actualTitle = aggregateData?.first.title ?? title;
  const actualPoster = aggregateData?.first.poster ?? poster;
  const actualSource = aggregateData?.first.source ?? source;
  const actualId = aggregateData?.first.id ?? id;
  const actualDoubanId = String(
    aggregateData?.mostFrequentDoubanId ?? douban_id
  );
  const actualEpisodes = aggregateData?.mostFrequentEpisodes ?? episodes;
  const actualYear = aggregateData?.first.year ?? year;
  const actualQuery = query || '';
  const actualSearchType = isAggregate
    ? aggregateData?.first.episodes?.length === 1
      ? 'movie'
      : 'tv'
    : type;

  // 使用新的 useFavorite Hook
  const { isFavorited, toggleFavorite, isLoading: favoriteLoading } = useFavorite({
    source: actualSource || '',
    id: actualId || '',
  });

  // 处理收藏切换
  const handleToggleFavorite = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (from === 'douban' || !actualSource || !actualId) return;

      try {
        await toggleFavorite({
          title: actualTitle,
          source_name: source_name || '',
          year: actualYear || '',
          cover: actualPoster,
          total_episodes: actualEpisodes ?? 1,
        });
        
        showToast(
          isFavorited ? '已取消收藏' : '收藏成功！',
          isFavorited ? 'info' : 'success'
        );
      } catch (error) {
        showToast(getErrorMessage(error), 'error');
      }
    },
    [
      from,
      actualSource,
      actualId,
      actualTitle,
      source_name,
      actualYear,
      actualPoster,
      actualEpisodes,
      isFavorited,
      toggleFavorite,
      showToast,
    ]
  );

  const handleDeleteRecord = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (from !== 'playrecord' || !actualSource || !actualId) return;
      
      try {
        setIsLoading(true);
        await deletePlayRecord(actualSource, actualId);
        showToast('已删除播放记录', 'success');
        onDelete?.();
      } catch (error) {
        showToast(getErrorMessage(error), 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [from, actualSource, actualId, onDelete, showToast]
  );

  const handleClick = useCallback(() => {
    if (from === 'douban') {
      router.push(
        `/play?title=${encodeURIComponent(actualTitle.trim())}${
          actualYear ? `&year=${actualYear}` : ''
        }${actualSearchType ? `&stype=${actualSearchType}` : ''}`
      );
    } else if (actualSource && actualId) {
      router.push(
        `/play?source=${actualSource}&id=${actualId}&title=${encodeURIComponent(
          actualTitle
        )}${actualYear ? `&year=${actualYear}` : ''}${
          isAggregate ? '&prefer=true' : ''
        }${
          actualQuery ? `&stitle=${encodeURIComponent(actualQuery.trim())}` : ''
        }${actualSearchType ? `&stype=${actualSearchType}` : ''}`
      );
    }
  }, [
    from,
    actualSource,
    actualId,
    router,
    actualTitle,
    actualYear,
    isAggregate,
    actualQuery,
    actualSearchType,
  ]);

  const config = useMemo(() => {
    const configs = {
      playrecord: {
        showSourceName: true,
        showProgress: true,
        showPlayButton: true,
        showHeart: true,
        showCheckCircle: true,
        showDoubanLink: false,
        showRating: false,
      },
      favorite: {
        showSourceName: true,
        showProgress: false,
        showPlayButton: true,
        showHeart: true,
        showCheckCircle: false,
        showDoubanLink: false,
        showRating: false,
      },
      search: {
        showSourceName: false,
        showProgress: false,
        showPlayButton: false,
        showHeart: true,
        showCheckCircle: false,
        showDoubanLink: false,
        showRating: false,
      },
      douban: {
        showSourceName: false,
        showProgress: false,
        showPlayButton: false,
        showHeart: false,
        showCheckCircle: false,
        showDoubanLink: true,
        showRating: true,
      },
    };
    return configs[from];
  }, [from]);

  const placeholderSrc = actualPoster || '/placeholder.svg';
  const imgSrc = processImageUrl(placeholderSrc);

  return (
    <div
      className='
        group
        relative
        overflow-hidden
        rounded-xl
        bg-white
        shadow-sm
        transition-all
        duration-300
        hover:shadow-xl
        dark:bg-gray-800
      '
      style={{ cursor: from === 'douban' ? 'default' : 'pointer' }}
      onClick={from !== 'douban' ? handleClick : undefined}
    >
      {/* 图片容器 */}
      <div className='relative aspect-[2/3] w-full overflow-hidden rounded-t-xl bg-gray-100 dark:bg-gray-700'>
        <Image
          src={imgSrc}
          alt={actualTitle}
          fill
          sizes='(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw'
          className='object-cover transition-all duration-300 group-hover:scale-105'
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            e.currentTarget.src = '/placeholder-image.svg';
            e.currentTarget.onerror = null;
          }}
          priority={false}
          loading='lazy'
        />
        {/* 悬浮操作按钮 - 仅非douban显示 */}
        {from !== 'douban' && (
          <div className='absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/50 group-hover:opacity-100'>
            {config.showHeart && (
              <button
                onClick={handleToggleFavorite}
                disabled={favoriteLoading || !actualSource || !actualId}
                className='mx-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 transition-all hover:scale-110 hover:bg-white disabled:opacity-50'
                title={isFavorited ? '取消收藏' : '收藏'}
              >
                <Heart
                  className={`h-5 w-5 ${
                    isFavorited
                      ? 'fill-red-500 text-red-500'
                      : 'fill-transparent text-gray-700'
                  }`}
                />
              </button>
            )}

            {from === 'playrecord' && (
              <button
                onClick={handleDeleteRecord}
                disabled={isLoading}
                className='mx-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 transition-all hover:scale-110 hover:bg-white disabled:opacity-50'
                title='删除记录'
              >
                <Trash2 className='h-5 w-5' />
              </button>
            )}
          </div>
        )}

        {/* 进度条 */}
        {config.showProgress && progress > 0 && (
          <div className='absolute bottom-0 left-0 right-0 h-1.5 bg-gray-300/50 dark:bg-gray-600/50'>
            <div
              className='h-full bg-green-600 transition-all duration-300'
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* 信息区域 */}
      <div className='p-3'>
        <h3
          className='mb-1 truncate text-sm font-semibold text-gray-900 dark:text-gray-100'
          title={actualTitle}
        >
          {actualTitle}
        </h3>

        <div className='flex items-center justify-between text-xs text-gray-600 dark:text-gray-400'>
          <div className='flex items-center space-x-2'>
            {config.showSourceName && source_name && (
              <span className='rounded-md bg-gray-100 px-2 py-0.5 dark:bg-gray-700'>
                {source_name}
              </span>
            )}
            {actualYear && (
              <span className='text-gray-500 dark:text-gray-500'>
                {actualYear}
              </span>
            )}
          </div>

          {config.showRating && rate && (
            <span className='font-medium text-yellow-600 dark:text-yellow-500'>
              ⭐ {rate}
            </span>
          )}
        </div>

        {config.showProgress && typeof currentEpisode === 'number' && (
          <div className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
            {currentEpisode > 0 && `第${currentEpisode}集`}
            {actualEpisodes && ` / 共${actualEpisodes}集`}
          </div>
        )}

        {isAggregate && items && items.length > 1 && (
          <div className='mt-2 text-xs text-blue-600 dark:text-blue-400'>
            聚合了 {items.length} 个结果
          </div>
        )}
      </div>

      {/* douban 链接 */}
      {config.showDoubanLink && actualDoubanId && actualDoubanId !== '0' && (
        <a
          href={`https://movie.douban.com/subject/${actualDoubanId}/`}
          target='_blank'
          rel='noopener noreferrer'
          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
          className='absolute right-2 top-2 rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg'
        >
          豆瓣详情
        </a>
      )}
    </div>
  );
}
