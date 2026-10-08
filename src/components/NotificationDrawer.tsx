import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  Mail, 
  Smartphone, 
  Radio, 
  CheckCheck, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { AppNotification, NotificationChannel } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectNotification: (orderId: string) => void;
  onTriggerSimulatedNotification: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onSelectNotification,
  onTriggerSimulatedNotification,
}) => {
  const [channelFilter, setChannelFilter] = useState<'all' | NotificationChannel>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (channelFilter === 'all') return true;
    return n.channel === channelFilter;
  });

  const getChannelBadge = (channel: NotificationChannel) => {
    switch (channel) {
      case 'push':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Smartphone className="w-3 h-3" />
            Push Alert
          </span>
        );
      case 'email':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <Mail className="w-3 h-3" />
            Email Sent
          </span>
        );
      case 'in_app':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Radio className="w-3 h-3 text-teal-600" />
            Web Portal
          </span>
        );
    }
  };

  const getPriorityIcon = (priority: AppNotification['priority']) => {
    switch (priority) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />;
      case 'warning':
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
      case 'info':
      default:
        return <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 border-l border-slate-200">
        
        {/* Drawer Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-500" />
            <div>
              <h2 className="text-sm font-bold">Live Client & Server Notifications</h2>
              <p className="text-[11px] text-slate-400">Instant updates across Web, Email & Push</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Filters & Quick Actions */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setChannelFilter('all')}
                className={`px-2 py-1 rounded-md font-medium transition ${
                  channelFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setChannelFilter('push')}
                className={`px-2 py-1 rounded-md font-medium transition ${
                  channelFilter === 'push' ? 'bg-purple-700 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Push
              </button>
              <button
                onClick={() => setChannelFilter('email')}
                className={`px-2 py-1 rounded-md font-medium transition ${
                  channelFilter === 'email' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Email
              </button>
              <button
                onClick={() => setChannelFilter('in_app')}
                className={`px-2 py-1 rounded-md font-medium transition ${
                  channelFilter === 'in_app' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Web
              </button>
            </div>

            <div className="flex items-center gap-1 text-slate-500">
              <button
                onClick={onMarkAllAsRead}
                title="Mark all as read"
                className="p-1.5 rounded hover:bg-slate-200 hover:text-slate-800 transition"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
              <button
                onClick={onClearAll}
                title="Clear all"
                className="p-1.5 rounded hover:bg-slate-200 hover:text-red-600 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick simulation trigger */}
          <button
            onClick={onTriggerSimulatedNotification}
            className="w-full py-1.5 px-3 bg-gradient-to-r from-slate-700 to-teal-600 hover:from-slate-600 hover:to-teal-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            Simulate New Field Attempt Event
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-medium">No notifications in this feed</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Updates will automatically appear when attempts are logged in the field.
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectNotification(item.orderId);
                  onClose();
                }}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition hover:border-teal-400 hover:shadow-xs space-y-1.5 ${
                  item.read
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-teal-50/50 border-teal-200 text-slate-900 font-medium ring-1 ring-teal-400/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    {getPriorityIcon(item.priority)}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{item.title}</span>
                      </div>
                      <span className="font-mono text-[10px] text-teal-700 font-semibold">
                        Case #{item.caseNumber}
                      </span>
                    </div>
                  </div>
                  <div>{getChannelBadge(item.channel)}</div>
                </div>

                <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                  {item.message}
                </p>

                <div className="flex items-center justify-between pl-6 pt-1 text-[10px] text-slate-400">
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-teal-600 hover:underline flex items-center gap-0.5">
                    Open Case File <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Push & Email Dispatch Active</span>
          <span className="text-teal-700 font-bold">● Connected</span>
        </div>

      </div>
    </div>
  );
};
