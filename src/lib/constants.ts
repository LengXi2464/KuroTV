/**
 * 应用常量定义
 * 集中管理所有魔术数字和字符串常量
 */

/**
 * 本地存储 Keys
 */
export const STORAGE_KEYS = {
  PLAY_RECORDS: 'kurotv_play_records',
  FAVORITES: 'kurotv_favorites',
  SEARCH_HISTORY: 'kurotv_search_history',
  USER_SETTINGS: 'kurotv_user_settings',
  THEME: 'kurotv_theme',
  ANNOUNCEMENT_SEEN: 'hasSeenAnnouncement',
} as const;

/**
 * 缓存相关常量
 */
export const CACHE_CONFIG = {
  PREFIX: 'kurotv_cache_',
  VERSION: '1.0.0',
  EXPIRE_TIME: 60 * 60 * 1000, // 1小时
} as const;

/**
 * 搜索相关常量
 */
export const SEARCH_CONFIG = {
  HISTORY_LIMIT: 20,
  MIN_QUERY_LENGTH: 1,
  DEBOUNCE_DELAY: 300,
  DEFAULT_PAGE_SIZE: 20,
} as const;

/**
 * 播放器相关常量
 */
export const PLAYER_CONFIG = {
  AUTO_SAVE_INTERVAL: 5000, // 5秒自动保存进度
  PROGRESS_THRESHOLD: 0.9, // 90%视为已完成
  VOLUME_STEP: 0.1,
  SEEK_STEP: 10, // 快进/快退步长（秒）
} as const;

/**
 * API 相关常量
 */
export const API_CONFIG = {
  TIMEOUT: 30000, // 30秒
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;

/**
 * 分页相关常量
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * 验证相关常量
 */
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 50,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 20,
} as const;

/**
 * UI 相关常量
 */
export const UI_CONFIG = {
  TOAST_DURATION: 3000,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 1000,
} as const;

/**
 * 断点定义（与 Tailwind 保持一致）
 */
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

/**
 * 路由路径
 */
export const ROUTES = {
  HOME: '/',
  SEARCH: '/search',
  PLAY: '/play',
  DOUBAN: '/douban',
  LOGIN: '/login',
  ADMIN: '/admin',
  SETTINGS: '/settings',
  MISC: '/misc',
} as const;

/**
 * API 端点
 */
export const API_ENDPOINTS = {
  LOGIN: '/api/login',
  LOGOUT: '/api/logout',
  REGISTER: '/api/register',
  SEARCH: '/api/search',
  DETAIL: '/api/detail',
  DOUBAN: '/api/douban',
  FAVORITES: '/api/favorites',
  PLAY_RECORDS: '/api/playrecords',
  SEARCH_HISTORY: '/api/searchhistory',
  USER_SETTINGS: '/api/user-settings',
  SERVER_CONFIG: '/api/server-config',
  IMAGE_PROXY: '/api/image-proxy',
  HEALTH: '/api/health',
} as const;

/**
 * 存储类型
 */
export const STORAGE_TYPES = {
  LOCAL: 'localstorage',
  REDIS: 'redis',
  D1: 'd1',
  UPSTASH: 'upstash',
} as const;

export type StorageType = typeof STORAGE_TYPES[keyof typeof STORAGE_TYPES];

/**
 * 视频类型
 */
export const VIDEO_TYPES = {
  MOVIE: 'movie',
  TV: 'tv',
  ANIME: 'anime',
} as const;

export type VideoType = typeof VIDEO_TYPES[keyof typeof VIDEO_TYPES];

/**
 * 主题类型
 */
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export type Theme = typeof THEMES[keyof typeof THEMES];

/**
 * HTTP 状态码
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * 正则表达式
 */
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  URL: /^https?:\/\/.+/,
} as const;
