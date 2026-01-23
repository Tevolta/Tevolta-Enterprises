
import React, { useState, useMemo } from 'react';
import { Product, WattMapping } from '../types';

interface InventoryManagerProps {
  products: Product[];
  lowStockThreshold: number;
  wattMappings: WattMapping[];
  onUpdate: (p: Product) => void;
  onDelete: (id: string) => void;
  onAdd: (p: Product) => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ products, lowStockThreshold, wattMappings, onUpdate, onDelete, onAdd }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(editItem?.category || 'Appliances');

  // Derive unique wattages from current inventory and mapping table
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Stock & Inventory</h2>
          <p className="text-sm text-slate-500 font-medium">Manage your products, HSN codes, and LED specifications.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setSelectedCategory('Appliances'); }}
          className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
        >
          + Register New Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col hover:border-blue-200 transition-all hover:shadow-xl hover:shadow-blue-500/5 group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded">
                  {product.category}
                </span>
                <h3 className="text-lg font-black text-slate-800 mt-2">{product.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">HSN: {product.hsnCode || 'N/A'}</p>
                   {product.watts && <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded">{product.watts}</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-blue-600">₹{product.price.toLocaleString()}</p>
                <p className={`text-[10px] font-black uppercase tracking-widest ${product.stock < lowStockThreshold ? 'text-red-500 animate-pulse font-black' : 'text-slate-400'}`}>
                  {product.stock} Units Left
                </p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 flex-1 mb-6 font-medium leading-relaxed">{product.description}</p>
            
            <div className="flex gap-2 pt-4 border-t border-slate-50">
              <div className="flex-1 px-4 py-2 bg-slate-50 rounded-xl flex items-center justify-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST {product.gstRate}%</span>
              </div>
              <button onClick={() => { setEditItem(product); setSelectedCategory(product.category); }} className="px-4 py-2 text-xs font-black uppercase tracking-widest bg-slate-100 text-slate-700 rounded-xl hover:bg-blue-100 hover:text-blue-600 transition-colors">Edit</button>
              <button onClick={() => { if(confirm('Delete product?')) onDelete(product.id) }} className="px-4 py-2 text-xs font-black uppercase tracking-widest text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors">Del</button>
            </div>
          </div>
        ))}
      </div>

      {(isAdding || editItem) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-xl overflow-hidden shadow-2xl border border-white/20">
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                id: editItem?.id || (formData.get('sku') as string) || Math.random().toString(36).substr(2, 9),
                name: formData.get('name') as string,
                category: formData.get('category') as string,
                price: Number(formData.get('price')),
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
            }} className="p-10 space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{editItem ? 'Update Item' : 'Register Item'}</h3>
                <button type="button" onClick={() => { setIsAdding(false); setEditItem(null); }} className="text-slate-400 hover:text-slate-900">✕</button>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Name</label>
                  <input required name="name" defaultValue={editItem?.name} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                  <select name="category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold">
                    <option value="Appliances">Appliances</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Electrical">Electrical</option>
                    <option value="LED">LED</option>
                    <option value="Spares">Spares</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Price (₹)</label>
                  <input required type="number" name="price" defaultValue={editItem?.price} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Rate (%)</label>
                  <select name="gstRate" defaultValue={editItem?.gstRate || 18} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold">
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
                {selectedCategory === 'LED' ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wattage (Dynamic)</label>
                    <input 
                      list="wattages" 
                      name="watts" 
                      defaultValue={editItem?.watts} 
                      placeholder="e.g. 150W"
                      className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-black" 
                    />
                    <datalist id="wattages">
                      {availableWattages.map(w => <option key={w} value={w} />)}
                    </datalist>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HSN Code</label>
                    <input required name="hsnCode" defaultValue={editItem?.hsnCode} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="e.g. 8418" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product SKU/ID</label>
                  <input name="sku" defaultValue={editItem?.id} disabled={!!editItem} placeholder="e.g. TEV-50-..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Stock</label>
                  <input required type="number" name="stock" defaultValue={editItem?.stock} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                <textarea name="description" defaultValue={editItem?.description} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold resize-none" />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setIsAdding(false); setEditItem(null); }} className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-slate-500 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-white bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">{editItem ? 'Save Updates' : 'Register Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
