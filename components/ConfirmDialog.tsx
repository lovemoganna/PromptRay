import React from 'react';
import { Icons } from './Icons';
import { AlertCircle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmDialogComponent: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning'
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: AlertCircle,
      iconColor: 'text-red-500',
      buttonBg: 'bg-red-500 hover:bg-red-600',
      borderColor: 'border-red-500/20'
    },
    warning: {
      icon: Icons.Error, // AlertTriangle
      iconColor: 'text-yellow-500',
      buttonBg: 'bg-yellow-500 hover:bg-yellow-600',
      borderColor: 'border-yellow-500/20'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-500',
      buttonBg: 'bg-blue-500 hover:bg-blue-600',
      borderColor: 'border-blue-500/20'
    }
  };

  const style = typeStyles[type];
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-theme shadow-2xl border border-white/10 animate-slide-up-fade relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-brand-500/5 to-transparent opacity-50"></div>
        <div className="p-6 relative z-10">
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-2 rounded-full ${type === 'danger' ? 'bg-red-500/10' : type === 'warning' ? 'bg-yellow-500/10' : 'bg-blue-500/10'} border ${style.borderColor} animate-breathe`}>
              <Icon size={20} className={style.iconColor} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              className="btn-secondary px-4 py-2 text-sm font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-bold text-white rounded-theme transition-all ${style.buttonBg} shadow-lg transform hover:scale-105 active:scale-95`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ConfirmDialog = React.memo(ConfirmDialogComponent);
