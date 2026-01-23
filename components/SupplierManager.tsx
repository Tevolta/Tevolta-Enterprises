
import React, { useState, useRef, useMemo } from 'react';
import { PurchaseOrder, Product, SupplierMapping, WattMapping } from '../types';
import { analyzeInvoice } from '../services/geminiService';
import * as XLSX from 'xlsx';

interface SupplierManagerProps {
  products: Product[];
  purchaseHistory: PurchaseOrder[];
  supplierMappings: SupplierMapping[];
  wattMappings: WattMapping[];
  onImportConfirm: (order: PurchaseOrder) => void;
  onRevert: (id: string) => void;
}

const SupplierManager: React.FC<SupplierManagerProps> = ({ 
  products, 
  purchaseHistory, 
  supplierMappings, 
  wattMappings, 
  onImportConfirm,
  onRevert
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const csvData = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
          try {
            const result = await analyzeInvoice(csvData, 'text');
            setScannedData(result);
          } catch (err) { alert("AI could not parse Excel."); } finally { setIsProcessing(false); }
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          try {
            const data = await analyzeInvoice(base64, 'multimodal', file.type);
            setScannedData(data);
          } catch (err) { alert("Failed to analyze file."); } finally { setIsProcessing(false); }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) { setIsProcessing(false); }
  };

  const confirmImport = () => {
    if (!scannedData) return;
    const processedItems = scannedData.items.map((item: any) => {
      let finalSku = item.sku || '';
      let finalName = item.name;
      let isMapped = false;
      const mapping = supplierMappings.find(m => (m.supplierSku && m.supplierSku.toLowerCase() === finalSku.toLowerCase()) || (m.supplierName && m.supplierName.toLowerCase() === finalName.toLowerCase()));
      if (mapping) { finalSku = mapping.tevoltaSku; finalName = mapping.tevoltaName; isMapped = true; }
      return { ...item, sku: finalSku, name: finalName, isMapped };
    });

    const newPO: PurchaseOrder = {
      id: 'PO-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      supplierName: scannedData.supplierName,
      date: new Date().toISOString(),
      items: processedItems,
      exchangeRate: 1, // Simplified for history demonstration
      totalForeignAmount: scannedData.totalAmount,
      totalInrAmount: scannedData.totalAmount,
      totalQuantity: processedItems.reduce((sum: number, i: any) => sum + i.quantity, 0),
      status: 'Confirmed'
    };
    onImportConfirm(newPO);
    setScannedData(null);
  };

  const filteredHistory = useMemo(() => {
    return purchaseHistory.filter(po => 
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      po.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [purchaseHistory, searchTerm]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase mb-2">Register New Import</h3>
          <p className="text-sm text-slate-500 mb-6">Scan supplier invoice to automatically increment stock.</p>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf,.xlsx" />
          <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${isProcessing ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/10'}`}>
            {isProcessing ? 'Analyzing...' : 'Scan Supplier Invoice'}
          </button>
          {scannedData && (
            <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-4">
              <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                <span className="text-sm font-black text-slate-800">{scannedData.supplierName}</span>
                <button onClick={() => setScannedData(null)} className="text-blue-400">✕</button>
              </div>
              <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {scannedData.items.map((item: any, i: number) => (
                  <div key={i} className="text-[10px] bg-white p-3 rounded-xl border border-blue-100 flex justify-between">
                    <div><span className="font-black block">{item.sku || 'UNKNOWN'}</span><span className="text-slate-500">{item.name}</span></div>
                    <span className="font-black text-blue-600">+{item.quantity}</span>
                  </div>
                ))}
              </div>
              <button onClick={confirmImport} className="w-full py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em]">Approve & Add to Stock</button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Audit History</h3>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-400">🔍</span>
              <input type="text" placeholder="Search history..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-6 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none w-full sm:w-64 font-bold" />
            </div>
          </div>
          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty Added</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-5"><p className="text-xs font-bold text-slate-800">{new Date(po.date).toLocaleDateString()}</p><p className="text-[9px] text-slate-400">#{po.id}</p></td>
                    <td className="px-6 py-5 text-xs font-black text-slate-600 uppercase tracking-tight">{po.supplierName}</td>
                    <td className="px-6 py-5 text-center"><span className="bg-green-50 px-3 py-1.5 rounded-lg text-xs font-black text-green-600">+{po.totalQuantity}</span></td>
                    <td className="px-6 py-5 text-right"><button onClick={() => onRevert(po.id)} className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">Revert</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierManager;
