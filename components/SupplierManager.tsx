
import React, { useState, useMemo } from 'react';
import { PurchaseOrder, Product, PurchaseOrderItem, NatureOfPurchase } from '../types';

interface SupplierManagerProps {
  products: Product[];
  purchaseHistory: PurchaseOrder[];
  onAddToReview: (order: PurchaseOrder) => void;
  onUpdatePurchase: (order: PurchaseOrder) => void;
  onRollback: (id: string) => void;
}

const SupplierManager: React.FC<SupplierManagerProps> = ({ 
  purchaseHistory,
  onAddToReview,
  onUpdatePurchase,
  onRollback
}) => {
  // Fix: Added mandatory 'id' to initial items to satisfy PurchaseOrderItem interface
  const [form, setForm] = useState<Partial<PurchaseOrder>>({
    supplierName: '',
    country: 'China',
    natureOfPurchase: 'Stock',
    invoiceRef: '',
    date: new Date().toISOString().split('T')[0],
    currency: 'USD',
    exchangeRate: 83,
    extraFee: 0,
    extraFeeRemarks: '',
    depositAmount: 0,
    items: [{ id: Math.random().toString(36).substr(2, 9), supplierSku: '', tevoltaSku: '', name: '', watts: '', quantity: 0, costPerUnit: 0, totalForeign: 0 }]
  });

  const [editingPo, setEditingPo] = useState<PurchaseOrder | null>(null);

  const currentCalcs = useMemo(() => {
    const target = editingPo || form;
    const itemsTotal = (target.items || []).reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);
    const totalForeign = itemsTotal + (Number(target.extraFee) || 0);
    const investmentInr = totalForeign * (Number(target.exchangeRate) || 1);
    const balance = totalForeign - (Number(target.depositAmount) || 0);
    const totalQty = (target.items || []).reduce((sum, item) => sum + Number(item.quantity), 0);
    return { itemsTotal, totalForeign, investmentInr, balance, totalQty };
  }, [form, editingPo]);

  // Fix: Ensure newItem has 'id' and correct type
  const addRow = (isEdit: boolean) => {
    const newItem: PurchaseOrderItem = { id: Math.random().toString(36).substr(2, 9), supplierSku: '', tevoltaSku: '', name: '', watts: '', quantity: 0, costPerUnit: 0, totalForeign: 0 };
    if (isEdit && editingPo) {
      setEditingPo({ ...editingPo, items: [...editingPo.items, newItem] });
    } else {
      setForm(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
    }
  };

  const updateItem = (idx: number, field: keyof PurchaseOrderItem, value: any, isEdit: boolean) => {
    const target = isEdit ? editingPo : form;
    if (!target) return;

    const newItems = [...(target.items || [])];
    newItems[idx] = { ...newItems[idx], [field]: value };
    if (field === 'quantity' || field === 'costPerUnit') {
      newItems[idx].totalForeign = Number(newItems[idx].quantity) * Number(newItems[idx].costPerUnit);
    }

    if (isEdit && editingPo) {
      setEditingPo({ ...editingPo, items: newItems });
    } else {
      setForm({ ...form, items: newItems });
    }
  };

  const removeRow = (idx: number, isEdit: boolean) => {
    if (isEdit && editingPo) {
      if (editingPo.items.length <= 1) return;
      setEditingPo({ ...editingPo, items: editingPo.items.filter((_, i) => i !== idx) });
    } else {
      if ((form.items || []).length <= 1) return;
      setForm({ ...form, items: (form.items || []).filter((_, i) => i !== idx) });
    }
  };

  const handleSave = () => {
    if (!form.supplierName) return alert('Supplier name is required.');
    
    const record: PurchaseOrder = {
      id: `PUR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      supplierName: form.supplierName || '',
      country: form.country || 'Unknown',
      natureOfPurchase: (form.natureOfPurchase as NatureOfPurchase) || 'Stock',
      invoiceRef: form.invoiceRef || '',
      date: form.date || new Date().toISOString(),
      currency: form.currency as any,
      exchangeRate: form.exchangeRate || 1,
      extraFee: form.extraFee || 0,
      extraFeeRemarks: form.extraFeeRemarks || '',
      depositAmount: form.depositAmount || 0,
      remainingBalance: currentCalcs.balance,
      totalForeignAmount: currentCalcs.totalForeign,
      investmentInr: currentCalcs.investmentInr,
      totalQuantity: currentCalcs.totalQty,
      items: (form.items || []) as PurchaseOrderItem[],
      status: 'Logged'
    };

    onAddToReview(record);
    // Fix: Added mandatory 'id' to items when resetting form
    setForm({
      supplierName: '',
      country: 'China',
      natureOfPurchase: 'Stock',
      invoiceRef: '',
      date: new Date().toISOString().split('T')[0],
      currency: 'USD',
      exchangeRate: 83,
      extraFee: 0,
      extraFeeRemarks: '',
      depositAmount: 0,
      items: [{ id: Math.random().toString(36).substr(2, 9), supplierSku: '', tevoltaSku: '', name: '', watts: '', quantity: 0, costPerUnit: 0, totalForeign: 0 }]
    });
  };

  const handleUpdate = () => {
    if (!editingPo) return;
    const updatedRecord: PurchaseOrder = {
      ...editingPo,
      remainingBalance: currentCalcs.balance,
      totalForeignAmount: currentCalcs.totalForeign,
      investmentInr: currentCalcs.investmentInr,
      totalQuantity: currentCalcs.totalQty,
    };
    onUpdatePurchase(updatedRecord);
    setEditingPo(null);
  };

  const currencySymbol = (curr: string) => curr === 'USD' ? '$' : (curr === 'CNY' ? '¥' : '₹');

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Supplier Hub</h2>
          <p className="text-sm text-slate-500 font-medium">Log new purchase invoices and manage historical import ledgers.</p>
        </div>
      </div>

      {/* FORM AREA */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">New Purchase Registration</h3>
          <button onClick={handleSave} className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl transition-all">Finalize & Log Financials</button>
        </div>

        <div className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Supplier / Factory Name</label>
              <input value={form.supplierName} onChange={e => setForm({...form, supplierName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500" placeholder="Manufacturer Name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Origin Country</label>
              <input value={form.country} onChange={e => setForm({...form, country: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500" placeholder="Country" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nature of Purchase</label>
              <select value={form.natureOfPurchase} onChange={e => setForm({...form, natureOfPurchase: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none">
                <option value="Stock">Stock (to Inventory Queue)</option>
                <option value="Other">Other (Fixed Expense)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Invoice Reference</label>
              <input value={form.invoiceRef} onChange={e => setForm({...form, invoiceRef: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none" placeholder="REF-001" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Billing Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Billing Currency</label>
              <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none">
                <option value="USD">USD ($)</option>
                <option value="CNY">RMB (¥)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
            <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Exchange Rate</label>
                <input type="number" value={form.exchangeRate} onChange={e => setForm({...form, exchangeRate: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none" />
            </div>
            <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Logistics / Fees ({currencySymbol(form.currency || 'USD')})</label>
                <input type="number" value={form.extraFee} onChange={e => setForm({...form, extraFee: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none" />
            </div>
          </div>

          <div className="bg-[#050a30] p-10 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                 <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Total Foreign Amount</p>
                 <p className="text-4xl font-black">{currencySymbol(form.currency || 'USD')}{currentCalcs.totalForeign.toLocaleString()}</p>
              </div>
              <div className="h-12 w-[1px] bg-white/10 hidden md:block"></div>
              <div className="bg-blue-600 rounded-[2rem] px-12 py-6 flex flex-col justify-center items-center shadow-2xl">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-100 mb-1">INR Investment Value</p>
                <p className="text-4xl font-black">₹{currentCalcs.investmentInr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Factory SKU</th>
                  <th className="py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tevolta SKU</th>
                  <th className="py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                  <th className="py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Watts</th>
                  <th className="py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                  <th className="py-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Unit Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(form.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-5 px-2"><input value={item.supplierSku} onChange={e => updateItem(idx, 'supplierSku', e.target.value, false)} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-2 text-[10px] font-bold" /></td>
                    <td className="py-5 px-2"><input value={item.tevoltaSku} onChange={e => updateItem(idx, 'tevoltaSku', e.target.value, false)} className="w-full bg-blue-50 border border-blue-100 text-blue-600 rounded-lg px-2 py-2 text-[10px] font-black" /></td>
                    <td className="py-5 px-2"><input value={item.name} onChange={e => updateItem(idx, 'name', e.target.value, false)} className="w-full bg-transparent px-2 py-2 text-xs font-bold" /></td>
                    <td className="py-5 px-2 text-center"><input value={item.watts} onChange={e => updateItem(idx, 'watts', e.target.value, false)} className="w-16 bg-slate-50 border border-slate-100 rounded-lg px-2 py-2 text-[10px] text-center" /></td>
                    <td className="py-5 px-2 text-center"><input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value), false)} className="w-16 bg-slate-100 border border-slate-200 rounded-lg px-2 py-2 text-xs text-center font-black" /></td>
                    <td className="py-5 px-2 text-right"><input type="number" value={item.costPerUnit} onChange={e => updateItem(idx, 'costPerUnit', Number(e.target.value), false)} className="w-24 bg-slate-100 border border-slate-200 rounded-lg px-2 py-2 text-xs text-right font-black" /></td>
                    <td className="py-5 px-2 text-center"><button onClick={() => removeRow(idx, false)} className="text-slate-300 hover:text-red-500 font-black">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => addRow(false)} className="mt-8 w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">+ Add Product Row</button>
          </div>
        </div>
      </div>

      {/* History Console */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Finalized Invoices Ledger</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Audit trail of all logged supplier purchases</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier / Origin</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nature</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Items</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">INR Value</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseHistory.map(po => (
                <tr key={po.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5 text-sm font-bold text-slate-600">{new Date(po.date).toLocaleDateString()}</td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-black text-slate-800 uppercase">{po.supplierName}</p>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{po.country}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${po.natureOfPurchase === 'Stock' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                      {po.natureOfPurchase}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center text-sm font-black text-slate-500">{po.totalQuantity}</td>
                  <td className="px-8 py-5 text-right font-black text-slate-900">₹{po.investmentInr.toLocaleString()}</td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      po.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingPo(po)} className="text-[9px] font-black uppercase text-blue-600 hover:underline">Edit Entry</button>
                      <button onClick={() => onRollback(po.id)} className="text-[9px] font-black uppercase text-red-400 hover:text-red-600">Rollback</button>
                    </div>
                  </td>
                </tr>
              ))}
              {purchaseHistory.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-20 text-center opacity-30 italic">No purchase history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingPo && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Edit Master Entry: {editingPo.id}</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manual adjustment for finalized ledger records</p>
                </div>
                <button onClick={() => setEditingPo(null)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-lg hover:bg-red-50 hover:text-red-500 transition-all font-black">✕</button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                <div className="grid grid-cols-3 gap-6">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Supplier Name</label>
                      <input value={editingPo.supplierName} onChange={e => setEditingPo({...editingPo, supplierName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Origin Country</label>
                      <input value={editingPo.country} onChange={e => setEditingPo({...editingPo, country: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nature</label>
                      <select value={editingPo.natureOfPurchase} onChange={e => setEditingPo({...editingPo, natureOfPurchase: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                        <option value="Stock">Stock</option>
                        <option value="Other">Other</option>
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-900 p-8 rounded-[2rem] text-white">
                   <div className="space-y-1">
                      <label className="text-[8px] font-black text-blue-300 uppercase">Rate</label>
                      <input type="number" value={editingPo.exchangeRate} onChange={e => setEditingPo({...editingPo, exchangeRate: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-blue-400 font-black" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[8px] font-black text-blue-300 uppercase">Logistics Fee</label>
                      <input type="number" value={editingPo.extraFee} onChange={e => setEditingPo({...editingPo, extraFee: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 font-black" />
                   </div>
                   <div className="text-center flex flex-col justify-center">
                      <p className="text-[8px] font-black text-slate-500 uppercase">Foreign Total</p>
                      <p className="text-xl font-black">{currencySymbol(editingPo.currency)}{currentCalcs.totalForeign.toLocaleString()}</p>
                   </div>
                   <div className="text-center flex flex-col justify-center bg-blue-600 rounded-xl">
                      <p className="text-[8px] font-black text-blue-100 uppercase">INR Value</p>
                      <p className="text-xl font-black text-white">₹{currentCalcs.investmentInr.toLocaleString()}</p>
                   </div>
                </div>

                <div className="overflow-hidden border border-slate-100 rounded-2xl">
                   <table className="w-full text-left">
                     <thead className="bg-slate-50">
                        <tr>
                           <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase">Factory SKU</th>
                           <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase">Tevolta SKU</th>
                           <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase">Description</th>
                           <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-center">Watts</th>
                           <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-center">Qty</th>
                           <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase text-right">Cost</th>
                           <th className="px-4 py-3"></th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {editingPo.items.map((item, idx) => (
                           <tr key={idx}>
                              <td className="px-4 py-3"><input value={item.supplierSku} onChange={e => updateItem(idx, 'supplierSku', e.target.value, true)} className="w-full bg-slate-50 border border-slate-100 rounded px-2 py-1 text-[10px]" /></td>
                              <td className="px-4 py-3"><input value={item.tevoltaSku} onChange={e => updateItem(idx, 'tevoltaSku', e.target.value, true)} className="w-full bg-blue-50 border border-blue-100 text-blue-600 rounded px-2 py-1 text-[10px] font-black" /></td>
                              <td className="px-4 py-3"><input value={item.name} onChange={e => updateItem(idx, 'name', e.target.value, true)} className="w-full bg-transparent px-2 py-1 text-xs font-bold" /></td>
                              <td className="px-4 py-3 text-center"><input value={item.watts} onChange={e => updateItem(idx, 'watts', e.target.value, true)} className="w-12 text-center bg-slate-50 rounded text-[10px]" /></td>
                              <td className="px-4 py-3 text-center"><input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value), true)} className="w-12 text-center bg-slate-50 rounded text-[10px] font-black" /></td>
                              <td className="px-4 py-3 text-right"><input type="number" value={item.costPerUnit} onChange={e => updateItem(idx, 'costPerUnit', Number(e.target.value), true)} className="w-16 text-right bg-slate-50 rounded text-[10px] font-black" /></td>
                              <td className="px-4 py-3 text-center"><button onClick={() => removeRow(idx, true)} className="text-red-400">✕</button></td>
                           </tr>
                        ))}
                     </tbody>
                   </table>
                   <button onClick={() => addRow(true)} className="w-full py-3 bg-slate-50 border-t border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">+ Add Product Row</button>
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setEditingPo(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel Edits</button>
                  <button onClick={handleUpdate} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl transition-all">Publish Ledger Changes</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManager;
