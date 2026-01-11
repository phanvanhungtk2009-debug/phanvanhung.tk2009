import React, { useState, useEffect } from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onDismiss: () => void;
}

const DURATION = 4000; // 4 giây

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      // Cho phép thời gian cho animation thoát trước khi gọi onDismiss
      setTimeout(onDismiss, 300);
    }, DURATION);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  };

  const typeClasses = {
    success: {
      icon: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
      progressBar: 'bg-green-500',
    },
    error: {
      icon: <XCircleIcon className="w-6 h-6 text-red-500" />,
      progressBar: 'bg-red-500',
    },
  };

  return (
    <div
      className={`relative w-full max-w-sm bg-white rounded-xl shadow-lg flex items-center p-4 overflow-hidden border border-gray-200 transition-all duration-300 transform ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}
      role="alert"
      style={{ animation: 'toast-in 0.3s ease-out forwards' }}
    >
      <div className="flex-shrink-0">{typeClasses[type].icon}</div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium text-gray-900">{message}</p>
      </div>
      <div className="ml-4 flex-shrink-0">
        <button
          onClick={handleDismiss}
          className="inline-flex rounded-md p-1.5 text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          aria-label="Đóng"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      <div
        className={`absolute bottom-0 left-0 h-1 ${typeClasses[type].progressBar}`}
        style={{ animation: `progress-bar ${DURATION}ms linear forwards` }}
      />
      <style>{`
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes progress-bar {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;