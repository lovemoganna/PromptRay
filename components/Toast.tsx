import React, { useEffect } from 'react';
import { Icons } from './Icons';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'success' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose, type = 'success' }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 right-1/2 translate-x-1/2 md:right-8 md:translate-x-0 z-[100] animate-slide-up-fade">
      <div className="glass-panel text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-4 border border-white/10 backdrop-blur-xl bg-gray-900/70">
        <div className={`p-1.5 rounded-full ${type === 'success' ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}>
            {type === 'success' ? <Icons.Check size={14} strokeWidth={3} /> : <Icons.FileJson size={14} strokeWidth={3} />}
        </div>
        <span className="text-sm font-medium tracking-wide">{message}</span>
      </div>
    </div>
  );
};