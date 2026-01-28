
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ViewType, Product, Order, User, CompanyConfig, SupplierMapping, WattMapping, PurchaseOrder, OrderItem } from './types';
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
import { encryptPassword, decryptPassword } from './services/encryptionService';

const GOOGLE_CLIENT_ID = '539446901811-0hp5dapa6thge75qtn6psm189vs3ucuf.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive';
const APP_VERSION = 'v3.6.1-stable';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('tevolta_active_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [isCloudEnabled, setIsCloudEnabled] = useState<boolean>(() => {
    return localStorage.getItem('tevolta_cloud_enabled') === 'true';
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('tevolta_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('tevolta_products');
    const data = saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    return data.map((p: any) => ({ ...p, costPrice: p.costPrice || (p.price * 0.7) }));
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('tevolta_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('tevolta_purchase_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [pendingInventory, setPendingInventory] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('tevolta_pending_inventory');
    return saved ? JSON.parse(saved) : [];
  });

  const [companyConfig, setCompanyConfig] = useState<CompanyConfig>(() => {
    const saved = localStorage.getItem('tevolta_company');
    const data = saved ? JSON.parse(saved) : INITIAL_COMPANY_CONFIG;
    if (data.invoiceSequence === undefined) data.invoiceSequence = 1001;
    return data;
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

  const [currentView, setCurrentView] = useState<ViewType>(ViewType.DASHBOARD);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'loading' } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastOrderWasNew, setLastOrderWasNew] = useState(false);

  const cloudFileId = useRef<string | null>(localStorage.getItem('tevolta_gdrive_file_id'));
  const syncTimeout = useRef<any>(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    localStorage.setItem('tevolta_users', JSON.stringify(users));
    localStorage.setItem('tevolta_products', JSON.stringify(products));
    localStorage.setItem('tevolta_orders', JSON.stringify(orders));
    localStorage.setItem('tevolta_purchase_history', JSON.stringify(purchaseOrders));
    localStorage.setItem('tevolta_pending_inventory', JSON.stringify(pendingInventory));
    localStorage.setItem('tevolta_company', JSON.stringify(companyConfig));
    localStorage.setItem('tevolta_mappings', JSON.stringify(supplierMappings));
    localStorage.setItem('tevolta_watt_mappings', JSON.stringify(wattMappings));
    localStorage.setItem('tevolta_threshold', lowStockThreshold.toString());
    localStorage.setItem('tevolta_cloud_enabled', isCloudEnabled.toString());
  }, [users, products, orders, purchaseOrders, pendingInventory, companyConfig, supplierMappings, wattMappings, lowStockThreshold, isCloudEnabled]);

  const showToast = (message: string, type: 'success' | 'error' | 'loading' = 'success') => {
    setNotification({ message, type });
    if (type !== 'loading') {
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const performCloudSync = useCallback(async () => {
    const token = sessionStorage.getItem('gdrive_token');
    if (!isCloudEnabled || !token || token === 'local') return;
    
    setIsSyncing(true);
    try {
      if (!cloudFileId.current) {
        cloudFileId.current = await findOrCreateDriveFile(token, companyConfig.sharedDriveId);
        localStorage.setItem('tevolta_gdrive_file_id', cloudFileId.current);
      }

      const encryptedUsers = users.map(u => ({
        ...u,
        password: encryptPassword(u.password)
      }));

      const payload = { 
        users: encryptedUsers, 
        products, orders, purchaseOrders, pendingInventory, 
        companyConfig, supplierMappings, wattMappings, lowStockThreshold, 
        lastUpdated: new Date().toISOString(),
        schemaVersion: '3.6.1'
      };
      await uploadToDrive(token, cloudFileId.current, payload);
    } catch (error) {
      console.error("Cloud Sync Failure:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isCloudEnabled, users, products, orders, purchaseOrders, pendingInventory, companyConfig, supplierMappings, wattMappings, lowStockThreshold]);

  const handleManualRefresh = async () => {
    const token = sessionStorage.getItem('gdrive_token');
    if (!token || token === 'local') { showToast("Local Mode Active", "error"); return; }
    showToast("Synchronizing Data...", "loading");
    setIsSyncing(true);
    try {
      const fileId = await findOrCreateDriveFile(token, companyConfig.sharedDriveId);
      cloudFileId.current = fileId;
      localStorage.setItem('tevolta_gdrive_file_id', fileId);
      const cloudData = await downloadFromDrive(token, fileId);
      if (cloudData) {
        if (cloudData.users) {
          const decryptedUsers = cloudData.users.map((u: User) => ({
            ...u,
            password: decryptPassword(u.password)
          }));
          setUsers(decryptedUsers);
        }
        if (cloudData.products) setProducts(cloudData.products);
        if (cloudData.orders) setOrders(cloudData.orders);
        if (cloudData.purchaseOrders) setPurchaseOrders(cloudData.purchaseOrders);
        if (cloudData.pendingInventory) setPendingInventory(cloudData.pendingInventory);
        if (cloudData.companyConfig) setCompanyConfig(cloudData.companyConfig);
        if (cloudData.supplierMappings) setSupplierMappings(cloudData.supplierMappings);
        if (cloudData.wattMappings) setWattMappings(cloudData.wattMappings);
        if (cloudData.lowStockThreshold) setLowStockThreshold(cloudData.lowStockThreshold);
        setIsCloudEnabled(true);
        showToast("Sync Successful");
      }
    } catch (error) {
      showToast("Sync Failed", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const reconnectGoogle = () => {
    try {
      // @ts-ignore
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: async (response: any) => {
          if (response.access_token) {
            sessionStorage.setItem('gdrive_token', response.access_token);
            sessionStorage.removeItem('tevolta_local_mode');
            setIsCloudEnabled(true);
            showToast("Google Identity Reconnected");
            handleManualRefresh();
          } else {
            showToast("Reconnection failed", "error");
          }
        },
      });
      client.requestAccessToken({ prompt: 'consent' });
    } catch (e) {
      showToast("Identity Service unavailable", "error");
    }
  };

  useEffect(() => {
    if (isCloudEnabled) {
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      syncTimeout.current = setTimeout(() => { performCloudSync(); }, 1500);
    }
    return () => { if (syncTimeout.current) clearTimeout(syncTimeout.current); };
  }, [users, products, orders, purchaseOrders, pendingInventory, companyConfig, supplierMappings, wattMappings, lowStockThreshold, isCloudEnabled, performCloudSync]);

  const handleLogin = (u: User, token: string | null) => {
    setUser(u);
    sessionStorage.setItem('tevolta_active_user', JSON.stringify(u));
    if (token) {
      sessionStorage.setItem('gdrive_token', token);
      sessionStorage.removeItem('tevolta_local_mode');
      setIsCloudEnabled(true);
      handleManualRefresh();
    } else {
      sessionStorage.setItem('gdrive_token', 'local');
      sessionStorage.setItem('tevolta_local_mode', 'true');
      setIsCloudEnabled(false);
      showToast("Running in Local Mode");
    }
  };

  const handleCreateOrder = (newOrder: Order) => {
    const year = new Date().getFullYear();
    let currentSeq = companyConfig.invoiceSequence;

    if (orders.length > 0) {
      const lastOrderYear = new Date(orders[0].date).getFullYear();
      if (year > lastOrderYear) {
        currentSeq = 1001; 
        showToast(`New Year Detected (${year}). Serial Reset to 1001.`);
      }
    }

    const serialStr = `TE/${year}/${String(currentSeq).padStart(4, '0')}`;

    const itemsWithCost: OrderItem[] = newOrder.items.map(item => {
      const prod = products.find(p => p.id === item.productId);
      return { ...item, costPrice: prod?.costPrice || (item.unitPrice * 0.7) };
    });

    const finalOrder = { 
      ...newOrder, 
      serialNumber: serialStr,
      items: itemsWithCost 
    };

    setOrders(prev => [finalOrder, ...prev]);
    setProducts(currentProducts => {
      return currentProducts.map(p => {
        const orderItem = finalOrder.items.find(item => item.productId === p.id);
        if (orderItem) {
          return { ...p, stock: p.stock - orderItem.quantity };
        }
        return p;
      });
    });

    setCompanyConfig(prev => ({ ...prev, invoiceSequence: currentSeq + 1 }));

    setSelectedOrder(finalOrder);
    setLastOrderWasNew(true);
    setCurrentView(ViewType.INVOICE);
    showToast(`Bill ${serialStr} Generated`);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (!isAdmin) {
      showToast("Access Denied: Only Administrator can delete records.", "error");
      return;
    }

    const orderToDelete = orders.find(o => o.id === orderId);
    if (!orderToDelete) return;

    if (!confirm(`Permanently delete order ${orderToDelete.serialNumber || orderId}? This will restore ${orderToDelete.items.reduce((acc, i) => acc + i.quantity, 0)} units to stock.`)) return;

    setProducts(currentProducts => {
      return currentProducts.map(p => {
        const orderItem = orderToDelete.items.find(item => item.productId === p.id);
        if (orderItem) {
          return { ...p, stock: p.stock + orderItem.quantity };
        }
        return p;
      });
    });

    setOrders(prev => prev.filter(o => o.id !== orderId));
    showToast("Order Deleted & Stock Restored");
  };

  const handleAddToReview = (po: PurchaseOrder) => {
    if (po.natureOfPurchase === 'Other') {
      const confirmedPo: PurchaseOrder = { ...po, status: 'Confirmed' };
      setPurchaseOrders(prev => [confirmedPo, ...prev]);
      showToast("Financial Record Confirmed.", "success");
    } else {
      const loggedPo: PurchaseOrder = { ...po, status: 'Logged' };
      setPurchaseOrders(prev => [loggedPo, ...prev]);
      setPendingInventory(prev => [loggedPo, ...prev]);
      showToast("Stock sent to Review Queue.", "success");
    }
  };

  const handleFinalizeInventoryReview = (poId: string) => {
    const po = pendingInventory.find(p => p.id === poId);
    if (!po) return;

    const missingItems = po.items.filter(item => 
      !products.some(p => p.id.toLowerCase() === (item.tevoltaSku || '').toLowerCase())
    );

    if (missingItems.length > 0) {
      const missingList = missingItems.map(m => m.tevoltaSku || 'Unknown').join(', ');
      showToast(`FAILED: Missing SKUs [${missingList}] must be registered first!`, "error");
      return; 
    }

    setProducts(prev => prev.map(p => {
      const match = po.items.find(i => (i.tevoltaSku || '').toLowerCase() === p.id.toLowerCase());
      if (match) {
        const latestCost = Number(match.costPerUnit) * po.exchangeRate;
        return { 
          ...p, 
          stock: p.stock + Number(match.quantity),
          costPrice: latestCost 
        };
      }
      return p;
    }));

    setPurchaseOrders(prev => prev.map(p => p.id === poId ? { ...p, status: 'Confirmed' } : p));
    setPendingInventory(prev => prev.filter(p => p.id !== poId));
    showToast(`Stock updated & Master Costs Refined.`);
  };

  const handleRevertImport = (poId: string) => {
    if (!isAdmin) {
      showToast("Access Denied: Only Administrator can revert records.", "error");
      return;
    }

    const po = purchaseOrders.find(p => p.id === poId);
    if (!po || !confirm(`Rollback record ${po.id}? This will remove it from the Financial Ledger.`)) return;
    
    if (po.status === 'Confirmed' && po.natureOfPurchase === 'Stock') {
      setProducts(prev => prev.map(p => {
        const match = po.items.find(i => (i.tevoltaSku || '').toLowerCase() === p.id.toLowerCase());
        return match ? { ...p, stock: Math.max(0, p.stock - Number(match.quantity)) } : p;
      }));
    }

    setPurchaseOrders(prev => prev.filter(p => p.id !== poId));
    setPendingInventory(prev => prev.filter(p => p.id !== poId));
    showToast("Record rolled back and removed.");
  };

  const hasCloudToken = sessionStorage.getItem('gdrive_token') && sessionStorage.getItem('gdrive_token') !== 'local';
  const hasLocalFlag = sessionStorage.getItem('tevolta_local_mode') === 'true';

  if (!user || (!hasCloudToken && !hasLocalFlag)) {
    return <LoginPage onLogin={handleLogin} users={users} googleClientId={GOOGLE_CLIENT_ID} scopes={SCOPES} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar currentView={currentView} setView={setCurrentView} isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} user={user} onLogout={() => { setUser(null); sessionStorage.clear(); }} onOpenProfile={() => setIsProfileOpen(true)} version={APP_VERSION} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header 
          title={currentView === ViewType.USER_MANAGEMENT ? 'Staff Accounts' : currentView.replace(/([A-Z])/g, ' $1').trim()} 
          syncStatus={isSyncing ? 'pending-permission' : (hasCloudToken ? 'synced' : 'testing')} 
          isAdmin={isAdmin} 
          isSidebarOpen={isSidebarOpen} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          onRefresh={handleManualRefresh} 
          onConnect={reconnectGoogle}
        />
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            {currentView === ViewType.DASHBOARD && <Dashboard orders={orders} products={products} lowStockThreshold={lowStockThreshold} />}
            {currentView === ViewType.ORDERS && <OrdersList orders={orders} onViewInvoice={(o) => { setSelectedOrder(o); setLastOrderWasNew(false); setCurrentView(ViewType.INVOICE); }} onDeleteOrder={handleDeleteOrder} onNewOrder={() => { setSelectedOrder(null); setLastOrderWasNew(false); setCurrentView(ViewType.INVOICE); }} isAdmin={isAdmin} />}
            {currentView === ViewType.GST && <GSTReports orders={orders} products={products} purchaseHistory={purchaseOrders} onRevertPurchase={handleRevertImport} />}
            {currentView === ViewType.INVENTORY && <InventoryManager products={products} pendingInventory={pendingInventory} lowStockThreshold={lowStockThreshold} wattMappings={wattMappings} onUpdate={(p) => setProducts(products.map(x => x.id === p.id ? p : x))} onDelete={(id) => { if(!isAdmin) showToast("Access Denied", "error"); else setProducts(products.filter(x => x.id !== id)) }} onAdd={(p) => setProducts([...products, p])} onFinalizeReview={handleFinalizeInventoryReview} onUpdatePending={(po) => setPendingInventory(pendingInventory.map(p => p.id === po.id ? po : p))} onDeletePending={(id) => setPendingInventory(pendingInventory.filter(p => p.id !== id))} isAdmin={isAdmin} />}
            {currentView === ViewType.SUPPLIER && isAdmin && <SupplierManager products={products} purchaseHistory={purchaseOrders} onAddToReview={handleAddToReview} onUpdatePurchase={(po) => setPurchaseOrders(prev => prev.map(p => p.id === po.id ? po : p))} onRollback={handleRevertImport} />}
            {currentView === ViewType.USER_MANAGEMENT && isAdmin && <AdminUserManagement users={users} onAddUser={(u) => setUsers([...users, u])} onUpdateUser={(u) => setUsers(users.map(x => x.id === u.id ? u : x))} onDeleteUser={(id) => setUsers(users.filter(x => x.id !== id))} />}
            {currentView === ViewType.INVOICE && (selectedOrder ? <InvoiceView order={selectedOrder} onBack={() => setCurrentView(ViewType.ORDERS)} companyConfig={companyConfig} autoPrint={lastOrderWasNew} /> : <OrderForm products={products} onSubmit={handleCreateOrder} onCancel={() => setCurrentView(ViewType.ORDERS)} />)}
            {currentView === ViewType.SETTINGS && <Settings products={products} orders={orders} users={users} supplierMappings={supplierMappings} onUpdateMappings={setSupplierMappings} wattMappings={wattMappings} onUpdateWattMappings={setWattMappings} onDataImport={() => {}} syncStatus={hasCloudToken ? 'synced' : 'testing'} onOpenFile={handleManualRefresh} onReconnect={reconnectGoogle} isAdmin={isAdmin} lowStockThreshold={lowStockThreshold} onUpdateThreshold={setLowStockThreshold} companyConfig={companyConfig} onUpdateCompanyConfig={setCompanyConfig} version={APP_VERSION} />}
          </div>
        </div>
        <AIAssistant orders={orders} inventory={products} />
        {notification && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-5">
            <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${notification.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : notification.type === 'loading' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-green-50 border-green-100 text-green-700'}`}>
              {notification.type === 'loading' && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
              <span className="text-[10px] font-black uppercase tracking-widest">{notification.message}</span>
            </div>
          </div>
        )}
      </main>
      {isProfileOpen && user && <UserProfile user={user} onClose={() => setIsProfileOpen(false)} onUpdate={(u) => setUsers(users.map(x => x.id === u.id ? u : x))} />}
    </div>
  );
};

export default App;
