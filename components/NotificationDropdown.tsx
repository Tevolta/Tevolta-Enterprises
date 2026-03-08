
import React from 'react';
import { AppNotification, ViewType } from '../types';

interface NotificationDropdownProps {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onNavigate: (view: ViewType) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onClose,
  onMarkAsRead,
  onClearAll,
  onNavigate
}) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden z-[100] animate-in zoom-in-95 duration-200 origin-top-right">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Notifications</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {unreadCount} Unread Alerts
          </p>
        </div>
        <div className="flex gap-2">
          {notifications.length > 0 && (
            <button 
              onClick={onClearAll}
              className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
            >
              Clear All
            </button>
          )}
          <button 
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] hover:bg-red-50 hover:text-red-500 transition-all"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4 opacity-20">📭</div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No new alerts</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                onClick={() => {
                  onMarkAsRead(notification.id);
                  if (notification.actionView) onNavigate(notification.actionView);
                }}
                className={`p-5 hover:bg-slate-50 transition-all cursor-pointer relative group ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
              >
                {!notification.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
                )}
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-xs font-black uppercase tracking-tight ${!notification.isRead ? 'text-blue-700' : 'text-slate-800'}`}>
                    {notification.title}
                  </h4>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">
                    {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  {notification.message}
                </p>
                {notification.staffName && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500">
                      {notification.staffName.charAt(0)}
                    </div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      Action by {notification.staffName}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
            End of notifications
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
