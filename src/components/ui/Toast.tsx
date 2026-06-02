import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const bgMap = {
  success: 'bg-white dark:bg-gray-800 border-status-green/40',
  error: 'bg-white dark:bg-gray-800 border-status-red/40',
  info: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-white/[0.12]',
};

const iconColorMap = {
  success: 'text-status-green dark:text-status-green',
  error: 'text-status-red dark:text-status-red',
  info: 'text-gray-500 dark:text-text-secondary',
};

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    previousActiveElement.current = document.activeElement as HTMLElement;

    timeoutRef.current = setTimeout(() => {
      onCloseRef.current();
    }, duration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Only restore focus if user hasn't moved focus elsewhere (activeElement is body)
      if (document.activeElement === document.body) {
        previousActiveElement.current?.focus();
      }
    };
  }, [duration]);

  const Icon = iconMap[type];

  const toastContent = (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="fixed left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 z-[100] animate-in slide-in-from-top-2 fade-in duration-200"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
    >
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl border-2 shadow-xl backdrop-blur-sm ${bgMap[type]}`}>
        <Icon className={`w-5 h-5 flex-shrink-0 ${iconColorMap[type]}`} aria-hidden="true" />
        <p className="text-sm font-medium text-gray-900 dark:text-text-primary whitespace-pre-line">{message}</p>
        <button
          onClick={onClose}
          aria-label={`${message} - close`}
          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-gray-400 dark:text-text-tertiary" aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  return createPortal(toastContent, document.body);
};
