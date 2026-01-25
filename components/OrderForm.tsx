
import React, { useState, useMemo } from 'react';
import { Product, Order, OrderItem } from '../types';

interface OrderFormProps {
  products: Product[];
  onSubmit: (order: Order) => void;
  onCancel: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ products, onSubmit, onCancel }) => {
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', gstin: '', notes: '' });
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.hsnCode?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.description?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.id.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  const getCartQuantity = (productId: string) => {
    return cart.find(item => item.productId === productId)?.quantity || 0;
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const updateQuantity = (product: Product, delta: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) return prev.filter(i => i.productId !== product.id);
        if (delta > 0 && newQty > product.stock) return prev; 

        const unitTax = (product.price * (product.gstRate / 100));
        return prev.map(i => i.productId === product.id ? { 
          ...i, 
          quantity: newQty, 
          taxAmount: unitTax * newQty 
        } : i);
      }
      
      if (delta > 0 && product.stock > 0) {
        const unitTax = (product.price * (product.gstRate / 100));
        return [...prev, { 
          id: generateId(),
          productId: product.id, 
          name: product.name, 
          quantity: 1, 
          unitPrice: product.price, 
          costPrice: product.costPrice,
          gstRate: product.gstRate,
          taxAmount: unitTax,
          hsnCode: product.hsnCode
        }];
      }
      return prev;
    });
  };

  const handleManualQuantity = (product: Product, value: string) => {
    const newQty = parseInt(value) || 0;
    if (newQty < 0) return;
    
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      const targetQty = Math.min(newQty, product.stock); 

      if (targetQty <= 0) return prev.filter(i => i.productId !== product.id);

      if (existing) {
        const unitTax = (product.price * (product.gstRate / 100));
        return prev.map(i => i.productId === product.id ? { 
          ...i, 
          quantity: targetQty, 
          taxAmount: unitTax * targetQty 
        } : i);
      } else {
        const unitTax = (product.price * (product.gstRate / 100));
        return [...prev, { 
          id: generateId(),
          productId: product.id, 
          name: product.name, 
          quantity: targetQty, 
          unitPrice: product.price, 
          costPrice: product.costPrice,
          gstRate: product.gstRate,
          taxAmount: unitTax,
          hsnCode: product.hsnCode
        }];
      }
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalTax = cart.reduce((sum, item) => sum + item.taxAmount, 0);
  const totalAmount = subtotal + totalTax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert('Bill must contain at least one item.');
    
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      serialNumber: '', // Handled by App.tsx during state update to ensure sequence
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerGstin: customer.gstin,
      date: new Date().toISOString(),
      items: [...cart], 
      subtotal: subtotal,
      cgst: totalTax / 2,
      sgst: totalTax / 2,
      igst: 0,
      totalTax: totalTax,
      totalAmount: totalAmount,
      status: 'Completed',
      notes: customer.notes
    };
    onSubmit(newOrder);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-5 duration-500 pb-20">
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-[850px]">
          <div className="mb-8">
            <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Catalog Intelligence</h3>
            <div className="relative">
              <span className="absolute left-5 top-4 text-slate-400">🔍</span>
              <input 
                type="text" 
                placeholder="Search by SKU, Description or HSN..." 
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold placeholder:font-medium placeholder:text-slate-300"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
            {filteredProducts.map(p => {
              const cartQty = getCartQuantity(p.id);
              const available = p.stock - cartQty;
              const isInCart = cartQty > 0;

              return (
                <div key={p.id} className={`p-5 rounded-3xl border transition-all ${isInCart ? 'bg-blue-50/30 border-blue-100 ring-2 ring-blue-500/5' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded text-slate-500">{p.category}</span>
                        {p.watts && <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded">{p.watts}</span>}
                      </div>
                      <p className="font-black text-slate-800 text-base">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium line-clamp-1 italic mt-0.5">"{p.description}"</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-blue-600">₹{p.price.toLocaleString()}</p>
                      <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${available <= 0 ? 'text-red-500' : 'text-slate-400'}`}>
                        {available <= 0 ? 'Out of Stock' : `${available} Available`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase">HSN: {p.hsnCode || 'N/A'}</span>
                    
                    <div className="flex items-center gap-2">
                      {isInCart && (
                        <div className="flex items-center bg-white border border-blue-200 rounded-xl overflow-hidden shadow-sm">
                           <button type="button" onClick={() => updateQuantity(p, -1)} className="px-3 py-2 text-blue-600 hover:bg-blue-50 transition-colors font-black">-</button>
                           <span className="px-3 py-2 text-xs font-black text-blue-600 border-x border-blue-100 min-w-[2.5rem] text-center">{cartQty}</span>
                           <button type="button" onClick={() => updateQuantity(p, 1)} disabled={available <= 0} className="px-3 py-2 text-blue-600 hover:bg-blue-50 disabled:opacity-30 transition-colors font-black">+</button>
                        </div>
                      )}
                      {!isInCart && (
                        <button 
                          type="button"
                          onClick={() => updateQuantity(p, 1)}
                          disabled={available <= 0}
                          className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10 disabled:opacity-30"
                        >
                          Add to Bill
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-8 h-fit">
           <div className="flex justify-between items-center">
             <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Bill Synthesis</h3>
             <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Draft Status</span>
           </div>

           <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Name</label>
                 <input required placeholder="Full Name" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 font-bold" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
               </div>
               <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                 <input required placeholder="8096..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 font-bold" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
               </div>
             </div>
             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (For Cloud Sync)</label>
                <input required type="email" placeholder="customer@email.com" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 font-bold" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} />
             </div>
             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer GSTIN (Optional)</label>
                <input placeholder="36..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 font-bold uppercase" value={customer.gstin} onChange={e => setCustomer({...customer, gstin: e.target.value.toUpperCase()})} />
             </div>
           </div>

           <div className="space-y-4">
             <div className="flex justify-between items-center px-1">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Itemized Selection</h4>
                <span className="text-[9px] font-black text-blue-600">{cart.length} SKUs</span>
             </div>
             
             <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
               {cart.map(item => {
                 const originalProduct = products.find(p => p.id === item.productId)!;
                 return (
                   <div key={item.id} className="p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 group">
                     <div className="flex justify-between items-start mb-3">
                       <div className="flex-1 mr-4">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">SKU: {item.productId}</span>
                         <h5 className="font-black text-slate-800 text-sm">{item.name}</h5>
                       </div>
                       <button type="button" onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="text-slate-300 hover:text-red-500 transition-colors">✕</button>
                     </div>
                     
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <button type="button" onClick={() => updateQuantity(originalProduct, -1)} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-black hover:bg-slate-50 transition-all shadow-sm">-</button>
                          <input 
                            type="number" 
                            className="w-16 bg-white border border-slate-200 rounded-lg py-1.5 text-center text-xs font-black focus:ring-2 focus:ring-blue-500 outline-none"
                            value={item.quantity}
                            onChange={(e) => handleManualQuantity(originalProduct, e.target.value)}
                          />
                          <button type="button" onClick={() => updateQuantity(originalProduct, 1)} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-black hover:bg-slate-50 transition-all shadow-sm">+</button>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Line Total</p>
                          <p className="font-black text-slate-900">₹{(item.quantity * item.unitPrice).toLocaleString()}</p>
                       </div>
                     </div>
                   </div>
                 );
               })}
               {cart.length === 0 && (
                 <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                   <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Cart is Empty</p>
                 </div>
               )}
             </div>
           </div>

           <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span>GST Output (Tax)</span>
                <span>₹{totalTax.toLocaleString()}</span>
              </div>
              <div className="bg-[#050a30] p-8 rounded-[2rem] text-white flex justify-between items-center shadow-2xl">
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Payable</p>
                  <p className="text-4xl font-black tracking-tighter">₹{totalAmount.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">
                  🏦
                </div>
              </div>
           </div>

           <div className="flex gap-4 pt-4">
             <button type="button" onClick={onCancel} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancel Draft</button>
             <button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-1 transition-all">Publish GST Bill</button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;