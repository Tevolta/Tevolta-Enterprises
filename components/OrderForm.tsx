
import React, { useState, useMemo } from 'react';
import { Product, Order, OrderItem, OrderStatus } from '../types';

interface OrderFormProps {
  products: Product[];
  onSubmit: (order: Order) => void;
  onCancel: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ products, onSubmit, onCancel }) => {
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', gstin: '', notes: '' });
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [addedFeedbackId, setAddedFeedbackId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.hsnCode?.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  const updateQuantity = (product: Product, delta: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      
      if (existing) {
        const newQty = existing.quantity + delta;
        
        if (newQty <= 0) {
          return prev.filter(i => i.productId !== product.id);
        }
        
        // Prevent exceeding stock
        if (newQty > product.stock) {
          return prev;
        }

        const totalTax = (product.price * newQty * (product.gstRate / 100));
        return prev.map(i => i.productId === product.id ? { ...i, quantity: newQty, taxAmount: totalTax } : i);
      }
      
      if (delta > 0 && product.stock > 0) {
        const taxAmount = (product.price * 1 * (product.gstRate / 100));
        // Show feedback
        setAddedFeedbackId(product.id);
        setTimeout(() => setAddedFeedbackId(null), 1000);

        return [...prev, { 
          productId: product.id, 
          name: product.name, 
          quantity: 1, 
          unitPrice: product.price, 
          gstRate: product.gstRate,
          taxAmount: taxAmount,
          hsnCode: product.hsnCode
        }];
      }
      
      return prev;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalTax = cart.reduce((sum, item) => sum + item.taxAmount, 0);
  const totalAmount = subtotal + totalTax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert('Please add items to cart');
    
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;

    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerGstin: customer.gstin,
      date: new Date().toISOString(),
      items: cart,
      subtotal: subtotal,
      cgst: cgst,
      sgst: sgst,
      igst: 0,
      totalTax: totalTax,
      totalAmount: totalAmount,
      status: 'Completed',
      notes: customer.notes
    };
    onSubmit(newOrder);
  };

  const getCartQuantity = (productId: string) => {
    return cart.find(item => item.productId === productId)?.quantity || 0;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[750px]">
          <div className="mb-6">
            <h3 className="text-xl font-black text-slate-800 mb-4">Inventory Items</h3>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400">🔍</span>
              <input 
                type="text" 
                placeholder="Search products by name, category or HSN..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {filteredProducts.map(p => {
              const qty = getCartQuantity(p.id);
              return (
                <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800">{p.name}</p>
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">GST {p.gstRate}%</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">₹{p.price.toLocaleString()} • HSN: {p.hsnCode || 'N/A'}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{p.stock} units available</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {qty > 0 ? (
                      <div className="flex items-center bg-slate-900 rounded-xl overflow-hidden shadow-sm">
                        <button 
                          onClick={() => updateQuantity(p, -1)}
                          className="px-3 py-2.5 text-white hover:bg-slate-800 transition-colors font-black"
                        >
                          -
                        </button>
                        <span className="px-4 text-xs font-black text-white bg-slate-800 py-2.5 min-w-[40px] text-center">
                          {qty}
                        </span>
                        <button 
                          onClick={() => updateQuantity(p, 1)}
                          disabled={qty >= p.stock}
                          className="px-3 py-2.5 text-white hover:bg-slate-800 transition-colors font-black disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => updateQuantity(p, 1)}
                        disabled={p.stock <= 0}
                        className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all min-w-[120px] ${
                          p.stock <= 0 
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                            : addedFeedbackId === p.id
                              ? 'bg-green-500 text-white transform scale-105'
                              : 'bg-slate-900 text-white hover:bg-blue-600'
                        }`}
                      >
                        {p.stock <= 0 
                          ? 'Out of Stock' 
                          : addedFeedbackId === p.id 
                            ? '✓ Added' 
                            : 'Add to Bill'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p className="text-3xl mb-2">🔎</p>
                <p className="text-sm font-medium">No products match your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">New GST Invoice</h3>
            <span className="text-xs font-bold text-slate-400">Tevolta Enterprises</span>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="Customer Name" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
              <input required type="email" placeholder="Email Address" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="Phone Number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
              <input placeholder="Customer GSTIN (Optional)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={customer.gstin} onChange={e => setCustomer({...customer, gstin: e.target.value})} />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Billing Summary</h4>
            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {cart.map(item => (
                <div key={item.productId} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => removeFromCart(item.productId)} className="text-slate-300 hover:text-red-500 transition-colors">✕</button>
                    <div>
                      <span className="font-bold text-slate-800">{item.name} <span className="text-slate-400 font-normal">x{item.quantity}</span></span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">HSN {item.hsnCode} | GST {item.gstRate}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">₹{(item.quantity * item.unitPrice).toLocaleString()}</p>
                    <p className="text-[10px] text-blue-500 font-bold">+₹{item.taxAmount.toLocaleString()} Tax</p>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <p className="text-slate-400 italic text-sm text-center py-4">Bill is empty. Add items to continue.</p>}
            </div>

            <div className="space-y-2 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Subtotal (Excl. Tax)</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-blue-500">
                <span>Total GST (CGST + SGST)</span>
                <span>₹{totalTax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-2xl font-black text-slate-900 pt-2 border-t border-slate-200 mt-2">
                <span className="tracking-tighter uppercase">Total Amount</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={onCancel} className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-slate-500 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">Discard</button>
              <button type="submit" disabled={cart.length === 0} className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-white bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all disabled:opacity-50 disabled:shadow-none">Generate GST Invoice</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;
