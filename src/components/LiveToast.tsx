import React, { useEffect } from 'react';
import { Smartphone, Mail, X, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AppNotification } from '../types';

interface LiveToastProps {
  notification: AppNotification | null;
  onClose: () => void;
  onClick: (orderId: string) => void;
}

export const LiveToast: React.FC<LiveToastProps> = ({
  notification,
  onClose,
  onClick,
}) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl text-white shrink-0 mt-0.5 ${
            notification.priority === 'success'
              ? 'bg-teal-600 shadow-teal-500/20'
              : notification.priority === 'warning'
              ? 'bg-amber-600 shadow-amber-500/20'
              : 'bg-teal-600 shadow-teal-500/20'
          } shadow-md`}>
            {notification.channel === 'push' ? (
              <Smartphone className="w-5 h-5" />
            ) : notification.channel === 'email' ? (
              <Mail className="w-5 h-5" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
          </div>

          <div
            className="cursor-pointer"
            onClick={() => {
              onClick(notification.orderId);
              onClose();
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                {notification.channel === 'push' ? 'Push Alert' : notification.channel === 'email' ? 'Email Dispatch' : 'Live Update'}
              </span>
              <span className="text-slate-400 text-[10px]">• Just Now</span>
            </div>
            <h4 className="text-xs font-bold text-white mt-0.5">{notification.title}</h4>
            <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
              {notification.message}
            </p>
            <span className="inline-block mt-1 text-[10px] font-mono text-teal-300 underline">
              Case #{notification.caseNumber}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
