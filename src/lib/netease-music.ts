/**
 * 网易云音乐 API 客户端
 * 基于官方API接口封装
 */

export interface NetEaseSong {
  id: number;
  name: string;
  ar: Array<{ id: number; name: string }>; // 艺术家
  al: { id: number; name: string; picUrl: string }; // 专辑
  dt: number; // 时长（毫秒）
}

export interface NetEasePlaylist {
  id: number;
  name: string;
  coverImgUrl: string;
  trackCount: number;
  tracks: NetEaseSong[];
}

/**
 * 网易云音乐API基础URL
 * 使用第三方代理服务或自建服务
 */
const NETEASE_API_BASE = 'https://netease-cloud-music-api-coral-eight.vercel.app';

/**
 * 获取用户喜欢的音乐列表
 * @param uid 用户ID
 */
export async function getUserLikedSongs(uid: string): Promise<NetEaseSong[]> {
  try {
    const response = await fetch(`${NETEASE_API_BASE}/likelist?uid=${uid}`);
    const data = await response.json();
    
    if (data.code === 200 && data.ids && data.ids.length > 0) {
      // 获取歌曲详情
      const songIds = data.ids.slice(0, 100).join(','); // 限制前100首
      const detailResponse = await fetch(
        `${NETEASE_API_BASE}/song/detail?ids=${songIds}`
      );
      const detailData = await detailResponse.json();
      
      if (detailData.code === 200) {
        return detailData.songs || [];
      }
    }
    
    return [];
  } catch (error) {
    console.error('获取用户喜欢的音乐失败:', error);
    return [];
  }
}

/**
 * 获取歌曲播放URL
 * @param id 歌曲ID
 */
export async function getSongUrl(id: number): Promise<string | null> {
  try {
    const response = await fetch(`${NETEASE_API_BASE}/song/url?id=${id}`);
    const data = await response.json();
    
    if (data.code === 200 && data.data && data.data.length > 0) {
      return data.data[0].url;
    }
    
    return null;
  } catch (error) {
    console.error('获取歌曲URL失败:', error);
    return null;
  }
}

/**
 * 获取用户创建的歌单
 * @param uid 用户ID
 */
export async function getUserPlaylists(uid: string): Promise<NetEasePlaylist[]> {
  try {
    const response = await fetch(`${NETEASE_API_BASE}/user/playlist?uid=${uid}`);
    const data = await response.json();
    
    if (data.code === 200 && data.playlist) {
      return data.playlist;
    }
    
    return [];
  } catch (error) {
    console.error('获取用户歌单失败:', error);
    return [];
  }
}

/**
 * 获取歌单详情
 * @param id 歌单ID
 */
export async function getPlaylistDetail(id: number): Promise<NetEasePlaylist | null> {
  try {
    const response = await fetch(`${NETEASE_API_BASE}/playlist/detail?id=${id}`);
    const data = await response.json();
    
    if (data.code === 200 && data.playlist) {
      return data.playlist;
    }
    
    return null;
  } catch (error) {
    console.error('获取歌单详情失败:', error);
    return null;
  }
}

/**
 * 搜索歌曲
 * @param keyword 关键词
 * @param limit 数量限制
 */
export async function searchSongs(
  keyword: string,
  limit = 30
): Promise<NetEaseSong[]> {
  try {
    const response = await fetch(
      `${NETEASE_API_BASE}/search?keywords=${encodeURIComponent(keyword)}&limit=${limit}`
    );
    const data = await response.json();
    
    if (data.code === 200 && data.result && data.result.songs) {
      return data.result.songs;
    }
    
    return [];
  } catch (error) {
    console.error('搜索歌曲失败:', error);
    return [];
  }
}

/**
 * 获取歌词
 * @param id 歌曲ID
 */
export async function getLyric(id: number): Promise<string> {
  try {
    const response = await fetch(`${NETEASE_API_BASE}/lyric?id=${id}`);
    const data = await response.json();
    
    if (data.code === 200 && data.lrc && data.lrc.lyric) {
      return data.lrc.lyric;
    }
    
    return '';
  } catch (error) {
    console.error('获取歌词失败:', error);
    return '';
  }
}
