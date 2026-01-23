
import React from 'react';
import Logo from './Logo';

interface HeaderProps {
  title: string;
  syncStatus?: 'idle' | 'synced' | 'error' | 'pending-permission' | 'testing';
  onConnect?: () => void;
  onRefresh?: () => void;
  fileName?: string;
  isAdmin?: boolean;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  syncStatus, 
  onConnect, 
  onRefresh,
  fileName, 
  isAdmin = true, 
  isSidebarOpen, 
  toggleSidebar 
}) => {
  const getStatusConfig = () => {
    switch(syncStatus) {
      case 'testing':
        return { 
          bg: 'bg-amber-50', 
          border: 'border-amber-200', 
          dot: 'bg-amber-500', 
          text: 'text-amber-700', 
          label: 'Local Mode (No Cloud)' 
        };
      case 'synced':
        return { 
          bg: 'bg-green-50', 
          border: 'border-green-100', 
          dot: 'bg-green-500', 
          text: 'text-green-700', 
          label: fileName || 'Synced' 
        };
      case 'pending-permission':
        return { 
          bg: 'bg-blue-50', 
          border: 'border-blue-200', 
          dot: 'bg-blue-500 animate-pulse', 
          text: 'text-blue-700', 
          label: 'Syncing Data...' 
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
            className="p-2.5 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm group"
            title="Open Menu"
          >
            <div className="space-y-1">
              <div className="w-5 h-0.5 bg-current rounded-full"></div>
              <div className="w-5 h-0.5 bg-current rounded-full"></div>
              <div className="w-5 h-0.5 bg-current rounded-full"></div>
            </div>
          </button>
        )}
        <Logo showText={false} className="h-6 opacity-80" />
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h2>
      </div>
      
      <div className="flex items-center space-x-6">
        <div 
          onClick={isCloud ? onRefresh : (isAdmin ? onConnect : undefined)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer group hover:shadow-md ${config.bg} ${config.border}`}
          title={isCloud ? "Click to reload from cloud" : "Click to connect cloud"}
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

        <div className="flex items-center space-x-4">
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest hidden sm:block"
          >
            Billing Info ↗
          </a>
          <button className="relative p-2 text-slate-500 hover:text-blue-600 transition-colors">
            🔔
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
