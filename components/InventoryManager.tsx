
import React, { useState, useMemo } from 'react';
import { Product, WattMapping, PurchaseOrder } from '../types';

interface InventoryManagerProps {
  products: Product[];
  pendingInventory: PurchaseOrder[];
  lowStockThreshold: number;
  wattMappings: WattMapping[];
  onUpdate: (p: Product) => void;
  onDelete: (id: string) => void;
  onAdd: (p: Product) => void;
  onFinalizeReview: (poId: string) => void;
  onUpdatePending: (po: PurchaseOrder) => void;
  onDeletePending: (poId: string) => void;
  isAdmin: boolean;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ 
  products, 
  pendingInventory,
  lowStockThreshold, 
  wattMappings, 
  onUpdate, 
  onDelete, 
  onAdd,
  onFinalizeReview,
  onUpdatePending,
  onDeletePending,
  isAdmin
}) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'preview'>('stock');
  const [isAdding, setIsAdding] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Appliances');

  const availableWattages = useMemo(() => {
    const fromProducts = products.map(p => p.watts).filter(Boolean);
    const fromMappings = wattMappings.map(m => m.watts).filter(Boolean);
    const all = Array.from(new Set([...fromProducts, ...fromMappings]));
    return all.sort((a, b) => {
      const numA = parseInt(a || '0');
      const numB = parseInt(b || '0');
      return numA - numB;
    });
  }, [products, wattMappings]);

  const updatePendingPoItem = (poId: string, itemIdx: number, field: string, value: any) => {
    const po = pendingInventory.find(p => p.id === poId);
    if (!po) return;
    const newItems = [...po.items];
    newItems[itemIdx] = { ...newItems[itemIdx], [field]: value };
    onUpdatePending({ ...po, items: newItems });
  };

  const removePendingPoItem = (poId: string, itemIdx: number) => {
    const po = pendingInventory.find(p => p.id === poId);
    if (!po) return;
    const newItems = po.items.filter((_, i) => i !== itemIdx);
    if (newItems.length === 0) {
      onDeletePending(poId);
    } else {
      onUpdatePending({ ...po, items: newItems });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Inventory Control Hub</h2>
            <p className="text-sm text-slate-500 font-medium">Manage active listings and verify incoming supplier stock.</p>
          </div>
          
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button 
              onClick={() => setActiveTab('stock')}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'stock' ? 'bg-white text-blue-600 shadow-md shadow-blue-500/5' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Active Stock ({products.length})
            </button>
            <button 
              onClick={() => setActiveTab('preview')}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'preview' ? 'bg-white text-blue-600 shadow-md shadow-blue-500/5' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Review Queue
              {pendingInventory.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] border-2 border-white shadow-lg animate-bounce">
                  {pendingInventory.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'stock' ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={() => { setIsAdding(true); setSelectedCategory('Appliances'); }}
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200"
            >
              + Register New SKU
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col hover:border-blue-200 transition-all hover:shadow-2xl hover:shadow-blue-500/10 group relative">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                      {product.category}
                    </span>
                    <h3 className="text-lg font-black text-slate-800 mt-4 tracking-tight">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">HSN: {product.hsnCode || 'N/A'}</p>
                       {product.watts && <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-lg">{product.watts}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-blue-600 tracking-tighter">₹{product.price.toLocaleString()}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${product.stock < lowStockThreshold ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                      {product.stock} Units
                    </p>
                  </div>
                </div>
                
                <p className="text-sm text-slate-500 flex-1 mb-8 font-medium leading-relaxed italic">"{product.description}"</p>
                
                <div className="flex gap-2 pt-6 border-t border-slate-50">
                  <div className="flex-1 px-4 py-2.5 bg-slate-50 rounded-xl flex items-center justify-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {product.id}</span>
                  </div>
                  <button onClick={() => { setEditItem(product); setSelectedCategory(product.category); }} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-700 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">Edit</button>
                  <button onClick={() => { if(confirm('Permanently delete product from catalog?')) onDelete(product.id) }} className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">Del</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8 pb-20">
          {pendingInventory.length > 0 ? (
            pendingInventory.map(po => (
              <div key={po.id} className="bg-white rounded-[2.5rem] border-2 border-amber-100 shadow-xl overflow-hidden animate-in slide-in-from-bottom-5">
                <div className="px-8 py-6 border-b border-amber-50 bg-amber-50/30 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🚛</span>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{po.supplierName}</h3>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-11">Source: {po.id} • Origin: {po.country} • {new Date(po.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => onDeletePending(po.id)} className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">
                      Reject Items
                    </button>
                    <button onClick={() => onFinalizeReview(po.id)} className="px-8 py-3 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-xl shadow-green-100">
                      Confirm & Update Stock
                    </button>
                  </div>
                </div>

                <div className="p-8">
                  <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100 flex gap-12">
                     <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exchange Rate</p>
                       <p className="text-lg font-black text-slate-800">{po.exchangeRate}x</p>
                     </div>
                     <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance Pending</p>
                       <p className="text-lg font-black text-red-600">
                         {po.currency === 'USD' ? '$' : '¥'}{po.remainingBalance.toLocaleString()}
                       </p>
                     </div>
                     <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">INR Total</p>
                       <p className="text-lg font-black text-blue-600">₹{po.investmentInr.toLocaleString()}</p>
                     </div>
                  </div>

                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Link Tevolta SKU</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">In-Qty</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Cost ({po.currency})</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {po.items.map((item, idx) => {
                        const productExists = products.some(p => p.id.toLowerCase() === (item.tevoltaSku || '').toLowerCase());
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-4">
                              <input 
                                value={item.tevoltaSku} 
                                onChange={(e) => updatePendingPoItem(po.id, idx, 'tevoltaSku', e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs font-black outline-none focus:ring-2 focus:ring-blue-500 ${productExists ? 'text-blue-600 border-slate-200' : 'text-red-500 border-red-200 animate-pulse'}`}
                                placeholder="Tevolta SKU..."
                              />
                            </td>
                            <td className="px-4 py-4">
                              <input 
                                value={item.name} 
                                onChange={(e) => updatePendingPoItem(po.id, idx, 'name', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                              />
                            </td>
                            <td className="px-4 py-4 text-center">
                              <input 
                                type="number"
                                value={item.quantity} 
                                onChange={(e) => updatePendingPoItem(po.id, idx, 'quantity', Number(e.target.value))}
                                className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-center outline-none"
                              />
                            </td>
                            <td className="px-4 py-4 text-right font-black text-xs text-slate-500">
                              {po.currency === 'USD' ? '$' : '¥'}{item.costPerUnit.toLocaleString()}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <button onClick={() => removePendingPoItem(po.id, idx)} className="text-slate-300 hover:text-red-500 font-black">✕</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="py-32 flex flex-col items-center justify-center text-center opacity-30">
              <div className="text-7xl mb-6">🏜️</div>
              <h4 className="text-xl font-black uppercase tracking-widest text-slate-500">Review Queue Empty</h4>
              <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto">New stock imports will appear here for verification and SKU linking.</p>
            </div>
          )}
        </div>
      )}

      {(isAdding || editItem) && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-lg z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data: Product = {
                id: (formData.get('sku') as string) || editItem?.id || '',
                name: formData.get('name') as string,
                category: formData.get('category') as string,
                price: Number(formData.get('price')),
                costPrice: Number(formData.get('costPrice')), 
                stock: Number(formData.get('stock')),
                gstRate: Number(formData.get('gstRate')),
                hsnCode: formData.get('hsnCode') as string,
                description: formData.get('description') as string,
                watts: formData.get('watts') as string || undefined,
              };
              if (editItem) onUpdate(data);
              else onAdd(data);
              setIsAdding(false);
              setEditItem(null);
            }} className="flex flex-col h-full overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{editItem ? 'Update Master SKU' : 'Register New Product'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Catalog Item Definition</p>
                </div>
                <button type="button" onClick={() => { setIsAdding(false); setEditItem(null); }} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all font-black text-lg">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tevolta SKU ID</label>
                    <input 
                      required 
                      name="sku" 
                      defaultValue={editItem?.id} 
                      readOnly={!!editItem}
                      placeholder="e.g. TEV-50-001"
                      className={`w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-black ${editItem ? 'opacity-50 cursor-not-allowed select-none' : ''}`} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Market Category</label>
                    <select name="category" defaultValue={editItem?.category || selectedCategory} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold">
                      <option value="Appliances">Appliances</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Electrical">Electrical</option>
                      <option value="LED">LED</option>
                      <option value="Spares">Spares</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Item Name</label>
                    <input required name="name" defaultValue={editItem?.name} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Selling Price (₹)</label>
                    <input required type="number" name="price" defaultValue={editItem?.price} className="w-full px-5 py-3.5 bg-blue-50 border border-blue-100 rounded-2xl outline-none font-black text-blue-700" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Actual Cost (Internal, ₹)</label>
                    <input required type="number" name="costPrice" defaultValue={editItem?.costPrice} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GST Rate</label>
                    <select name="gstRate" defaultValue={editItem?.gstRate || 18} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black">
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">HSN Code</label>
                    <input required name="hsnCode" defaultValue={editItem?.hsnCode} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Balance</label>
                    <input required type="number" name="stock" defaultValue={editItem?.stock} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Wattage Spec</label>
                  <input list="wattages" name="watts" defaultValue={editItem?.watts} placeholder="e.g. 150W" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-black" />
                  <datalist id="wattages">{availableWattages.map(w => <option key={w} value={w} />)}</datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Notes</label>
                  <textarea name="description" defaultValue={editItem?.description} rows={3} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium resize-none" />
                </div>
              </div>

              <div className="px-8 py-6 border-t border-slate-100 flex gap-4 shrink-0 bg-white">
                <button type="button" onClick={() => { setIsAdding(false); setEditItem(null); }} className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-slate-500 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-white bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-xl transition-all">{editItem ? 'Save Updates' : 'Publish Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
