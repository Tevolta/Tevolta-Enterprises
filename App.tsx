
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ViewType, Product, Order, User, CompanyConfig, SupplierMapping, WattMapping, PurchaseOrder } from './types';
import { INITIAL_PRODUCTS, INITIAL_USERS, INITIAL_COMPANY_CONFIG } from './constants';
import Dashboard from './components/Dashboard';
import OrdersList from './components/OrdersList';
import GSTReports from './components/GSTReports';
import InventoryManager from './components/InventoryManager';
import OrderForm from './components/OrderForm';
import InvoiceView from './components/InvoiceView';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AIAssistant from './components/AIAssistant';
import Settings from './components/Settings';
import SupplierManager from './components/SupplierManager';
import AdminUserManagement from './components/AdminUserManagement';
import UserProfile from './components/UserProfile';
import LoginPage from './components/LoginPage';
import { findOrCreateDriveFile, uploadToDrive, downloadFromDrive } from './services/cloudStorageService';

const GOOGLE_CLIENT_ID = '539446901811-0hp5dapa6thge75qtn6psm189vs3ucuf.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const APP_VERSION = 'v2.3.0-full-data-sync';

const App: React.FC = () => {
  // 1. AUTHENTICATION & SESSION
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('tevolta_active_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  // 2. CLOUD STATUS
  const [isCloudEnabled, setIsCloudEnabled] = useState<boolean>(() => {
    return localStorage.getItem('tevolta_cloud_enabled') === 'true';
  });

  // 3. CORE DATA STATES (All of these are synced to Google Drive)
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('tevolta_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('tevolta_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('tevolta_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('tevolta_purchase_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig>(() => {
    const saved = localStorage.getItem('tevolta_company');
    return saved ? JSON.parse(saved) : INITIAL_COMPANY_CONFIG;
  });
  const [supplierMappings, setSupplierMappings] = useState<SupplierMapping[]>(() => {
    const saved = localStorage.getItem('tevolta_mappings');
    return saved ? JSON.parse(saved) : [];
  });
  const [wattMappings, setWattMappings] = useState<WattMapping[]>(() => {
    const saved = localStorage.getItem('tevolta_watt_mappings');
    return saved ? JSON.parse(saved) : [];
  });
  const [lowStockThreshold, setLowStockThreshold] = useState(() => {
    const saved = localStorage.getItem('tevolta_threshold');
    return saved ? Number(saved) : 500;
  });

  // 4. UI STATE
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.DASHBOARD);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'loading' } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const cloudFileId = useRef<string | null>(localStorage.getItem('tevolta_gdrive_file_id'));
  const syncTimeout = useRef<any>(null);

  // Persistence to LocalStorage (as secondary backup/cache)
  useEffect(() => {
    localStorage.setItem('tevolta_users', JSON.stringify(users));
    localStorage.setItem('tevolta_products', JSON.stringify(products));
    localStorage.setItem('tevolta_orders', JSON.stringify(orders));
    localStorage.setItem('tevolta_purchase_history', JSON.stringify(purchaseOrders));
    localStorage.setItem('tevolta_company', JSON.stringify(companyConfig));
    localStorage.setItem('tevolta_mappings', JSON.stringify(supplierMappings));
    localStorage.setItem('tevolta_watt_mappings', JSON.stringify(wattMappings));
    localStorage.setItem('tevolta_threshold', lowStockThreshold.toString());
    localStorage.setItem('tevolta_cloud_enabled', isCloudEnabled.toString());
  }, [users, products, orders, purchaseOrders, companyConfig, supplierMappings, wattMappings, lowStockThreshold, isCloudEnabled]);

  const showToast = (message: string, type: 'success' | 'error' | 'loading' = 'success') => {
    setNotification({ message, type });
    if (type !== 'loading') {
      setTimeout(() => setNotification(null), 4000);
    }
  };

  /**
   * Pushes the ENTIRE application state to the linked Google Drive file.
   */
  const performCloudSync = useCallback(async () => {
    const token = localStorage.getItem('gdrive_token');
    if (!isCloudEnabled || !token) return;
    
    setIsSyncing(true);
    try {
      if (!cloudFileId.current) {
        cloudFileId.current = await findOrCreateDriveFile(token);
        localStorage.setItem('tevolta_gdrive_file_id', cloudFileId.current);
      }
      
      const payload = { 
        users,
        products, 
        orders, 
        purchaseOrders, 
        companyConfig, 
        supplierMappings, 
        wattMappings, 
        lowStockThreshold,
        lastUpdated: new Date().toISOString()
      };
      
      await uploadToDrive(token, cloudFileId.current, payload);
      console.log("Cloud Database Updated Successfully");
    } catch (error) {
      console.error("Cloud Sync Failure:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isCloudEnabled, users, products, orders, purchaseOrders, companyConfig, supplierMappings, wattMappings, lowStockThreshold]);

  /**
   * Downloads data from Google Drive and updates all local states.
   */
  const handleManualRefresh = async () => {
    const token = localStorage.getItem('gdrive_token');
    if (!token) {
      showToast("Please link a Google account to enable shared data.", "error");
      return;
    }
    
    showToast("Synchronizing with Google Drive...", "loading");
    setIsSyncing(true);
    try {
      const fileId = await findOrCreateDriveFile(token);
      cloudFileId.current = fileId;
      localStorage.setItem('tevolta_gdrive_file_id', fileId);
      
      const cloudData = await downloadFromDrive(token, fileId);
      if (cloudData) {
        // Update all states with cloud data
        if (cloudData.users) setUsers(cloudData.users);
        if (cloudData.products) setProducts(cloudData.products);
        if (cloudData.orders) setOrders(cloudData.orders);
        if (cloudData.purchaseOrders) setPurchaseOrders(cloudData.purchaseOrders);
        if (cloudData.companyConfig) setCompanyConfig(cloudData.companyConfig);
        if (cloudData.supplierMappings) setSupplierMappings(cloudData.supplierMappings);
        if (cloudData.wattMappings) setWattMappings(cloudData.wattMappings);
        if (cloudData.lowStockThreshold) setLowStockThreshold(cloudData.lowStockThreshold);
        
        setIsCloudEnabled(true);
        showToast("System fully synchronized.");
      } else {
        showToast("Empty cloud database. Initializing first upload.");
        performCloudSync();
      }
    } catch (error) {
      showToast("Could not reach cloud. Working in offline mode.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  // Debounced auto-sync: waits for 2 seconds of inactivity before pushing to cloud
  useEffect(() => {
    if (isCloudEnabled) {
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      syncTimeout.current = setTimeout(() => { performCloudSync(); }, 2000);
    }
    return () => { if (syncTimeout.current) clearTimeout(syncTimeout.current); };
  }, [users, products, orders, purchaseOrders, companyConfig, supplierMappings, wattMappings, lowStockThreshold, isCloudEnabled, performCloudSync]);

  const handleGoogleLink = () => {
    try {
      // @ts-ignore
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID, 
        scope: SCOPES,
        callback: async (response: any) => {
          if (response.access_token) {
            localStorage.setItem('gdrive_token', response.access_token);
            setIsCloudEnabled(true);
            // After linking, fetch shared data immediately
            handleManualRefresh();
          }
        },
      });
      client.requestAccessToken({ prompt: 'consent' });
    } catch (e) { 
      showToast("Google Services unavailable. Please check internet.", "error"); 
    }
  };

  const handleImportConfirm = (po: PurchaseOrder) => {
    setProducts(prev => prev.map(p => {
      const match = po.items.find(i => i.sku === p.id);
      return match ? { ...p, stock: p.stock + match.quantity } : p;
    }));
    setPurchaseOrders(prev => [po, ...prev]);
    showToast(`Stock updated: +${po.totalQuantity} items.`, "success");
  };

  const handleRevertImport = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po || !confirm(`Revert ${po.id}? This will adjust inventory stock.`)) return;
    setProducts(prev => prev.map(p => {
      const match = po.items.find(i => i.sku === p.id);
      return match ? { ...p, stock: Math.max(0, p.stock - match.quantity) } : p;
    }));
    setPurchaseOrders(prev => prev.filter(p => p.id !== poId));
    showToast("Import Reverted Successfully.");
  };

  if (!user) return <LoginPage onLogin={(u) => { setUser(u); sessionStorage.setItem('tevolta_active_user', JSON.stringify(u)); }} users={users} />;

  const isAdmin = user.role === 'admin';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Footer Alert for Unlinked Cloud */}
      {!isCloudEnabled && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#050a30] text-white py-3 px-6 flex items-center justify-between z-[60] shadow-2xl border-t border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-xl">☁️</span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Local Mode Active</p>
              <p className="text-[8px] text-slate-400 uppercase tracking-widest">Connect Google Drive to share data with other employees.</p>
            </div>
          </div>
          <button 
            onClick={handleGoogleLink} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Link Company Google Account
          </button>
        </div>
      )}

      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-5 duration-300">
          <div className={`px-8 py-5 rounded-[1.5rem] shadow-2xl flex items-center gap-4 border-2 ${
            notification.type === 'success' ? 'bg-[#050a30] text-white border-blue-500/40' : 
            notification.type === 'loading' ? 'bg-blue-600 text-white border-blue-400' : 'bg-red-600 text-white border-red-400'
          }`}>
             {notification.type === 'loading' && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
             <span className="text-[11px] font-black uppercase tracking-[0.2em]">{notification.message}</span>
          </div>
        </div>
      )}

      <Sidebar currentView={currentView} setView={setCurrentView} isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} user={user} onLogout={() => { setUser(null); sessionStorage.removeItem('tevolta_active_user'); }} onOpenProfile={() => setIsProfileOpen(true)} version={APP_VERSION} />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header 
          title={currentView.replace(/([A-Z])/g, ' $1').trim()} 
          syncStatus={isSyncing ? 'pending-permission' : (isCloudEnabled ? 'synced' : 'testing')} 
          isAdmin={isAdmin} 
          isSidebarOpen={isSidebarOpen} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          onConnect={handleGoogleLink} 
          onRefresh={handleManualRefresh} 
          fileName={isCloudEnabled ? 'Google Drive Linked' : 'Offline'} 
        />
        
        <div className={`flex-1 overflow-y-auto p-6 custom-scrollbar ${!isCloudEnabled ? 'pb-24' : ''}`}>
          <div className="max-w-7xl mx-auto space-y-6">
            {currentView === ViewType.DASHBOARD && <Dashboard orders={orders} products={products} lowStockThreshold={lowStockThreshold} />}
            {currentView === ViewType.ORDERS && <OrdersList orders={orders} onViewInvoice={(o) => { setSelectedOrder(o); setCurrentView(ViewType.INVOICE); }} onNewOrder={() => { setSelectedOrder(null); setCurrentView(ViewType.INVOICE); }} />}
            {currentView === ViewType.GST && <GSTReports orders={orders} />}
            {currentView === ViewType.INVENTORY && <InventoryManager products={products} lowStockThreshold={lowStockThreshold} wattMappings={wattMappings} onUpdate={(p) => setProducts(products.map(x => x.id === p.id ? p : x))} onDelete={(id) => setProducts(products.filter(x => x.id !== id))} onAdd={(p) => setProducts([...products, p])} />}
            {currentView === ViewType.SUPPLIER && isAdmin && <SupplierManager products={products} purchaseHistory={purchaseOrders} supplierMappings={supplierMappings} wattMappings={wattMappings} onImportConfirm={handleImportConfirm} onRevert={handleRevertImport} />}
            {currentView === ViewType.USER_MANAGEMENT && isAdmin && <AdminUserManagement users={users} onAddUser={(u) => setUsers([...users, u])} onUpdateUser={(u) => setUsers(users.map(x => x.id === u.id ? u : x))} onDeleteUser={(id) => setUsers(users.filter(x => x.id !== id))} />}
            {currentView === ViewType.INVOICE && (selectedOrder ? <InvoiceView order={selectedOrder} onBack={() => setCurrentView(ViewType.ORDERS)} companyConfig={companyConfig} /> : <OrderForm products={products} onSubmit={(o) => { setOrders(prev => [o, ...prev]); setSelectedOrder(o); setCurrentView(ViewType.INVOICE); showToast("Invoice Generated"); }} onCancel={() => setCurrentView(ViewType.ORDERS)} />)}
            {currentView === ViewType.SETTINGS && <Settings products={products} orders={orders} users={users} supplierMappings={supplierMappings} onUpdateMappings={setSupplierMappings} wattMappings={wattMappings} onUpdateWattMappings={setWattMappings} onDataImport={() => {}} syncStatus={isCloudEnabled ? 'synced' : 'testing'} onOpenFile={handleManualRefresh} isAdmin={isAdmin} lowStockThreshold={lowStockThreshold} onUpdateThreshold={setLowStockThreshold} companyConfig={companyConfig} onUpdateCompanyConfig={setCompanyConfig} version={APP_VERSION} />}
          </div>
        </div>
        <AIAssistant orders={orders} inventory={products} />
      </main>
      {isProfileOpen && user && <UserProfile user={user} onClose={() => setIsProfileOpen(false)} onUpdate={(u) => setUsers(users.map(x => x.id === u.id ? u : x))} />}
    </div>
  );
};

export default App;
