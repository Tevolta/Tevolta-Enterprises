
import React from 'react';
import { ViewType, User } from '../types';
import Logo from './Logo';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  isOpen: boolean;
  toggle: () => void;
  user: User | null;
  onLogout: () => void;
  onOpenProfile: () => void;
  version?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, toggle, user, onLogout, onOpenProfile, version }) => {
  const menuItems = [
    { id: ViewType.DASHBOARD, label: 'Dashboard', icon: '📊', roles: ['admin', 'employee'] },
    { id: ViewType.ORDERS, label: 'Sales & Bills', icon: '🧾', roles: ['admin', 'employee'] },
    { id: ViewType.GST, label: 'GST Reports', icon: '🏛️', roles: ['admin', 'employee'] },
    { id: ViewType.INVENTORY, label: 'Inventory', icon: '⚡', roles: ['admin', 'employee'] },
    { id: ViewType.SUPPLIER, label: 'Supplier Log', icon: '🚢', roles: ['admin'] },
    { id: ViewType.USER_MANAGEMENT, label: 'Staff Accounts', icon: '👤', roles: ['admin'] },
    { id: ViewType.SETTINGS, label: 'Configurations', icon: '⚙️', roles: ['admin', 'employee'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role || 'employee'));

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-0'} transition-all duration-500 bg-[#050a30] h-full flex flex-col text-white z-50 overflow-hidden shrink-0 shadow-2xl relative`}>
      <div className="p-6 flex items-center justify-between border-b border-white/10 whitespace-nowrap overflow-hidden">
        <Logo variant="light" showText={true} className="h-8" />
        <button onClick={toggle} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-xs ml-auto">
          ◀
        </button>
      </div>

      <nav className="flex-1 mt-6 px-3 space-y-2 whitespace-nowrap overflow-hidden">
        {filteredMenu.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
              currentView === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="text-xl mr-4">{item.icon}</span>
            <span className="font-bold text-sm tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-white/10 space-y-4 whitespace-nowrap overflow-hidden">
        <div className="space-y-4">
          <button 
            onClick={onOpenProfile}
            className="w-full flex items-center space-x-3 p-2 rounded-xl hover:bg-white/5 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-black text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
              {user?.firstName?.charAt(0)}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-slate-200 truncate group-hover:text-white">{user?.firstName} {user?.lastName}</p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <p className="text-[10px] text-slate-500 capitalize">Workstation Active</p>
              </div>
            </div>
          </button>
          
          <div className="pt-2">
            <button 
              onClick={onLogout}
              className="w-full py-2 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
            >
              Exit Application
            </button>
            {version && (
              <p className="text-center text-[9px] text-slate-600 font-black uppercase tracking-[0.3em] mt-4 opacity-40">
                {version}
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
