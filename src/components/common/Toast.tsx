/**
 * Toast 通知组件
 * 提供轻量级的消息通知功能
 */

'use client';

import { CheckCircle, Info, X, XCircle } from 'lucide-react';
import React, { createContext, useCallback, useContext, useState } from 'react';

import { UI_CONFIG } from '@/lib/constants';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (
    message: string,
    type?: ToastType,
    duration?: number
  ) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Toast Provider 组件
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = UI_CONFIG.TOAST_DURATION) => {
      const id = Math.random().toString(36).substring(2, 9);
      const toast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev, toast]);

      // 自动移除
      if (duration > 0) {
        setTimeout(() => {
          hideToast(id);
        }, duration);
      }
    },
    []
  );

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
}

/**
 * Toast Container 组件
 */
function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: Toast[];
  onClose: (id: string) => void;
}) {
  return (
    <div className='fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none'>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

/**
 * Toast Item 组件
 */
function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: (id: string) => void;
}) {
  const config = getToastConfig(toast.type);

  return (
    <div
      className={`
        pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
        ${config.bg} ${config.text} ${config.border}
        animate-[slideInRight_0.3s_ease-out]
        max-w-md min-w-[300px]
      `}
    >
      <div className='flex-shrink-0'>{config.icon}</div>
      <p className='flex-1 text-sm font-medium'>{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className={`flex-shrink-0 ${config.closeHover} transition-colors rounded`}
        aria-label='关闭'
      >
        <X size={18} />
      </button>
    </div>
  );
}

/**
 * 获取 Toast 配置
 */
function getToastConfig(type: ToastType) {
  const configs = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-800 dark:text-green-200',
      border: 'border border-green-200 dark:border-green-800',
      closeHover: 'hover:bg-green-100 dark:hover:bg-green-800',
      icon: <CheckCircle size={20} className='text-green-600 dark:text-green-400' />,
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-800 dark:text-red-200',
      border: 'border border-red-200 dark:border-red-800',
      closeHover: 'hover:bg-red-100 dark:hover:bg-red-800',
      icon: <XCircle size={20} className='text-red-600 dark:text-red-400' />,
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-800 dark:text-blue-200',
      border: 'border border-blue-200 dark:border-blue-800',
      closeHover: 'hover:bg-blue-100 dark:hover:bg-blue-800',
      icon: <Info size={20} className='text-blue-600 dark:text-blue-400' />,
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-800 dark:text-yellow-200',
      border: 'border border-yellow-200 dark:border-yellow-800',
      closeHover: 'hover:bg-yellow-100 dark:hover:bg-yellow-800',
      icon: <Info size={20} className='text-yellow-600 dark:text-yellow-400' />,
    },
  };

  return configs[type];
}

/**
 * useToast Hook
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}
