import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Smartphone, 
  Mail, 
  ShieldAlert, 
  Radio, 
  Volume2, 
  VolumeX,
  ExternalLink,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { AppNotification, NotificationChannel } from '../types';

interface NotificationsViewProps {
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectNotification: (orderId: string) => void;
  onTriggerSimulatedNotification: () => void;
  pushEnabled: boolean;
  onTogglePush: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onSelectNotification,
  onTriggerSimulatedNotification,
  pushEnabled,
  onTogglePush,
}) => {
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const filtered = notifications.filter((n) => {
    if (filterChannel !== 'all' && n.channel !== filterChannel) return false;
    if (filterUnreadOnly && n.read) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getPriorityStyle = (priority: AppNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'success':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-teal-100 text-teal-800 border-teal-200';
    }
  };

  const getChannelIcon = (channel: NotificationChannel) => {
    switch (channel) {
      case 'push':
        return <Smartphone className="w-3.5 h-3.5 text-teal-600" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-teal-600" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-red-500/10 text-red-600 rounded-xl border border-red-500/20">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Live Dispatch Alerts & Notifications</h2>
            <p className="text-xs text-slate-500">
              Immediate event notifications for field knocks, completed serves, and affidavit filings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTriggerSimulatedNotification}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition"
          >
            <Radio className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            <span>Simulate Live Event</span>
          </button>
        </div>
      </div>

      {/* Notification Controls Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Channels (Push, Email, In-App)</option>
            <option value="push">Mobile Push Only</option>
            <option value="email">Email Updates Only</option>
            <option value="in_app">In-App Alerts Only</option>
          </select>

          <button
            onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              filterUnreadOnly
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {filterUnreadOnly ? 'Showing Unread Only' : 'Show All'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-teal-600 hover:bg-teal-50 border border-slate-200 transition"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Feed</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-teal-500 mx-auto mb-2" />
            <p className="text-sm font-semibold">You're all caught up!</p>
            <p className="text-xs text-slate-400 mt-1">No alerts matching your current filter settings.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectNotification(item.orderId)}
                className={`p-4 sm:p-5 hover:bg-slate-50/80 transition cursor-pointer flex items-start justify-between gap-4 ${
                  !item.read ? 'bg-teal-50/30' : ''
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${getPriorityStyle(item.priority)}`}>
                      {item.priority}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {item.caseNumber}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {getChannelIcon(item.channel)}
                      <span className="capitalize">{item.channel.replace('_', ' ')}</span>
                    </span>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <button
                  className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 transition shrink-0"
                  title="View linked order"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
