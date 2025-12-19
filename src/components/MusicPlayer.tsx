/**
 * 音乐播放器组件
 * 迷你播放器，显示在侧边栏底部
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Music, Play, Pause, Volume2, VolumeX, ChevronUp } from 'lucide-react';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { getUserLikedSongs, type NetEaseSong } from '@/lib/netease-music';
import { formatTime } from '@/lib/utils-enhanced';

const KURO_USER_ID = '6288318138';

export function MusicPlayer() {
  const [songs, setSongs] = useState<NetEaseSong[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);

  const {
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
  } = useMusicPlayer({ autoPlay: true, volume: 0.5 });

  // 加载Kuro的收藏歌曲
  useEffect(() => {
    loadKuroMusic();
  }, []);

  const loadKuroMusic = async () => {
    setIsLoadingSongs(true);
    try {
      const likedSongs = await getUserLikedSongs(KURO_USER_ID);
      setSongs(likedSongs);
      
      // 自动播放第一首
      if (likedSongs.length > 0) {
        playSong(likedSongs[0]);
      }
    } catch (error) {
      console.error('加载音乐失败:', error);
    } finally {
      setIsLoadingSongs(false);
    }
  };

  const handleSongClick = (song: NetEaseSong) => {
    playSong(song);
    setIsExpanded(false);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className='fixed bottom-0 left-0 w-16 lg:w-64 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 z-50'>
      {/* 迷你播放器 */}
      <div className='p-2 lg:p-3'>
        {currentSong ? (
          <div className='space-y-2'>
            {/* 歌曲信息 - PC端显示 */}
            <div className='hidden lg:flex items-center space-x-2'>
              <img
                src={currentSong.al.picUrl}
                alt={currentSong.name}
                className='w-10 h-10 rounded object-cover'
              />
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-white truncate'>
                  {currentSong.name}
                </p>
                <p className='text-xs text-gray-400 truncate'>
                  {currentSong.ar.map((a) => a.name).join(', ')}
                </p>
              </div>
            </div>

            {/* 移动端只显示专辑封面 */}
            <div className='lg:hidden flex justify-center'>
              <img
                src={currentSong.al.picUrl}
                alt={currentSong.name}
                className='w-12 h-12 rounded object-cover'
              />
            </div>

            {/* 进度条 */}
            <div className='hidden lg:block'>
              <div className='flex items-center space-x-2 text-xs text-gray-400'>
                <span>{formatTime(currentTime)}</span>
                <div className='flex-1 h-1 bg-gray-700 rounded-full overflow-hidden cursor-pointer'
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    seek(duration * percent);
                  }}
                >
                  <div
                    className='h-full bg-green-600 transition-all'
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* 控制按钮 */}
            <div className='flex items-center justify-between lg:justify-center space-x-2 lg:space-x-4'>
              <button
                onClick={togglePlay}
                disabled={isLoading}
                className='p-2 hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50'
                title={isPlaying ? '暂停' : '播放'}
              >
                {isPlaying ? (
                  <Pause className='w-5 h-5 text-white' />
                ) : (
                  <Play className='w-5 h-5 text-white' />
                )}
              </button>

              {/* 音量控制 - 仅PC端 */}
              <div className='hidden lg:flex items-center space-x-2'>
                <button
                  onClick={toggleMute}
                  className='p-1 hover:bg-gray-800 rounded transition-colors'
                >
                  {volume === 0 ? (
                    <VolumeX className='w-4 h-4 text-gray-400' />
                  ) : (
                    <Volume2 className='w-4 h-4 text-gray-400' />
                  )}
                </button>
                <input
                  type='range'
                  min='0'
                  max='100'
                  value={volume * 100}
                  onChange={(e) => changeVolume(parseInt(e.target.value) / 100)}
                  className='w-20 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer'
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`,
                  }}
                />
              </div>

              {/* 展开歌单按钮 */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className='p-2 hover:bg-gray-800 rounded-full transition-colors'
                title='歌单'
              >
                <ChevronUp
                  className={`w-5 h-5 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center py-4 text-gray-400'>
            <Music className='w-8 h-8 mb-2' />
            <p className='text-xs hidden lg:block'>Kuro 专属音乐</p>
          </div>
        )}
      </div>

      {/* 歌单列表 */}
      {isExpanded && (
        <div className='absolute bottom-full left-0 w-64 max-h-96 bg-gray-900 border border-gray-800 rounded-t-lg overflow-hidden shadow-xl'>
          <div className='p-3 border-b border-gray-800'>
            <h3 className='text-sm font-medium text-white'>
              Kuro 的收藏 {songs.length > 0 && `(${songs.length})`}
            </h3>
          </div>
          <div className='overflow-y-auto max-h-80'>
            {isLoadingSongs ? (
              <div className='p-4 text-center text-gray-400 text-sm'>
                加载中...
              </div>
            ) : songs.length === 0 ? (
              <div className='p-4 text-center text-gray-400 text-sm'>
                暂无收藏歌曲
              </div>
            ) : (
              songs.map((song) => (
                <button
                  key={song.id}
                  onClick={() => handleSongClick(song)}
                  className={`w-full p-2 flex items-center space-x-2 hover:bg-gray-800 transition-colors ${
                    currentSong?.id === song.id ? 'bg-gray-800' : ''
                  }`}
                >
                  <img
                    src={song.al.picUrl}
                    alt={song.name}
                    className='w-10 h-10 rounded object-cover flex-shrink-0'
                  />
                  <div className='flex-1 min-w-0 text-left'>
                    <p className='text-sm text-white truncate'>{song.name}</p>
                    <p className='text-xs text-gray-400 truncate'>
                      {song.ar.map((a) => a.name).join(', ')}
                    </p>
                  </div>
                  {currentSong?.id === song.id && isPlaying && (
                    <div className='flex-shrink-0'>
                      <div className='flex items-end space-x-0.5 h-4'>
                        <div className='w-0.5 bg-green-600 animate-pulse' style={{ height: '60%' }} />
                        <div className='w-0.5 bg-green-600 animate-pulse' style={{ height: '100%', animationDelay: '0.15s' }} />
                        <div className='w-0.5 bg-green-600 animate-pulse' style={{ height: '40%', animationDelay: '0.3s' }} />
                      </div>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
