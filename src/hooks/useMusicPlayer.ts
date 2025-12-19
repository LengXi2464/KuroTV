/**
 * 音乐播放器 Hook
 * 管理音乐播放状态和控制
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { NetEaseSong } from '@/lib/netease-music';
import { getSongUrl } from '@/lib/netease-music';

interface UseMusicPlayerOptions {
  autoPlay?: boolean;
  volume?: number;
}

export function useMusicPlayer(options: UseMusicPlayerOptions = {}) {
  const { autoPlay = false, volume: initialVolume = 0.7 } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSong, setCurrentSong] = useState<NetEaseSong | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(initialVolume);
  const [isLoading, setIsLoading] = useState(false);

  // 初始化音频元素
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = initialVolume;

      // 监听播放进度
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      });

      // 监听加载完成
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
        setIsLoading(false);
      });

      // 监听播放结束
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });

      // 监听播放开始
      audioRef.current.addEventListener('play', () => {
        setIsPlaying(true);
      });

      // 监听暂停
      audioRef.current.addEventListener('pause', () => {
        setIsPlaying(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [initialVolume]);

  // 播放歌曲
  const playSong = useCallback(async (song: NetEaseSong) => {
    if (!audioRef.current) return;

    setIsLoading(true);
    setCurrentSong(song);

    try {
      const url = await getSongUrl(song.id);
      if (url) {
        audioRef.current.src = url;
        if (autoPlay) {
          await audioRef.current.play();
        }
      } else {
        console.error('无法获取歌曲URL');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('播放歌曲失败:', error);
      setIsLoading(false);
    }
  }, [autoPlay]);

  // 播放/暂停
  const togglePlay = useCallback(async () => {
    if (!audioRef.current || !currentSong) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('播放控制失败:', error);
    }
  }, [isPlaying, currentSong]);

  // 设置播放进度
  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // 设置音量
  const changeVolume = useCallback((vol: number) => {
    const clampedVol = Math.max(0, Math.min(1, vol));
    setVolume(clampedVol);
    if (audioRef.current) {
      audioRef.current.volume = clampedVol;
    }
  }, []);

  // 静音切换
  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
    }
  }, []);

  return {
    currentSong,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    playSong,
    togglePlay,
    seek,
    changeVolume,
    toggleMute,
  };
}
