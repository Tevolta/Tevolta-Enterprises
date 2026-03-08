
import React, { useState } from 'react';
import Logo from './Logo';
import NotificationDropdown from './NotificationDropdown';
import { AppNotification, ViewType } from '../types';

interface HeaderProps {
  title: string;
  syncStatus?: 'idle' | 'synced' | 'error' | 'pending-permission' | 'testing';
  onConnect?: () => void;
  onRefresh?: () => void;
  fileName?: string;
  isAdmin?: boolean;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onDismissNotification: (id: string) => void;
  onClearNotifications: () => void;
  onNavigate: (view: ViewType) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  syncStatus, 
  onConnect, 
  onRefresh,
  fileName, 
  isAdmin = true, 
  isSidebarOpen, 
  toggleSidebar,
  notifications,
  onMarkNotificationRead,
  onDismissNotification,
  onClearNotifications,
  onNavigate
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getStatusConfig = () => {
    switch(syncStatus) {
      case 'testing':
        return { 
          bg: 'bg-red-50', 
          border: 'border-red-200', 
          dot: 'bg-red-500', 
          text: 'text-red-700', 
          label: 'NOT SYNCED - Connect Cloud' 
        };
      case 'synced':
        return { 
          bg: 'bg-green-50', 
          border: 'border-green-100', 
          dot: 'bg-green-500', 
          text: 'text-green-700', 
          label: fileName || 'Cloud Synced' 
        };
      case 'pending-permission':
        return { 
          bg: 'bg-blue-50', 
          border: 'border-blue-200', 
          dot: 'bg-blue-500 animate-pulse', 
          text: 'text-blue-700', 
          label: 'Syncing to Cloud...' 
        };
      case 'error':
        return { 
          bg: 'bg-red-50', 
          border: 'border-red-200', 
          dot: 'bg-red-500', 
          text: 'text-red-700', 
          label: 'Sync Error' 
        };
      default:
        return { 
          bg: 'bg-slate-50', 
          border: 'border-slate-200', 
          dot: 'bg-slate-300', 
          text: 'text-slate-500', 
          label: 'Connecting...' 
        };
    }
  };

  const config = getStatusConfig();
  const isCloud = syncStatus === 'synced' || syncStatus === 'pending-permission';

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-6">
        {!isSidebarOpen && (
          <button 
            onClick={toggleSidebar}
            className="p-2.5 bg-[#050a30] text-white rounded-xl transition-all shadow-lg hover:bg-blue-600 group"
            title="Open Menu"
          >
            <div className="space-y-1">
              <div className="w-5 h-0.5 bg-current rounded-full"></div>
              <div className="w-5 h-0.5 bg-current rounded-full"></div>
              <div className="w-5 h-0.5 bg-current rounded-full"></div>
            </div>
          </button>
        )}
        <Logo showText={false} className="h-7 text-[#050a30]" />
        <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{title}</h2>
      </div>
      
      <div className="flex items-center space-x-6">
        <div 
          onClick={isCloud ? onRefresh : (isAdmin ? onConnect : undefined)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer group hover:shadow-md ${config.bg} ${config.border}`}
          title={isCloud ? "Click to refresh from cloud" : "Click to connect to Google Cloud"}
        >
          <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
          <span className={`text-[10px] font-black uppercase tracking-widest truncate max-w-[200px] ${config.text}`}>
            {config.label}
          </span>
          {isCloud && (
            <span className="text-[10px] opacity-40 group-hover:opacity-100 transition-opacity ml-1">🔄</span>
          )}
        </div>

        <div className="h-6 w-[1px] bg-slate-200"></div>

        <div className="flex items-center space-x-4 relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative p-2 transition-colors rounded-full hover:bg-slate-100 ${isNotificationsOpen ? 'text-blue-600 bg-blue-50' : 'text-slate-500'}`}
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <NotificationDropdown 
              notifications={notifications}
              onClose={() => setIsNotificationsOpen(false)}
              onMarkAsRead={onMarkNotificationRead}
              onDismiss={onDismissNotification}
              onClearAll={onClearNotifications}
              onNavigate={(view) => {
                onNavigate(view);
                setIsNotificationsOpen(false);
              }}
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
