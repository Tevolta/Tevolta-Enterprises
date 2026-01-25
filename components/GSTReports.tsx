
import React, { useState, useMemo } from 'react';
import { Order, PurchaseOrder, Product } from '../types';
import * as XLSX from 'xlsx';

interface GSTReportsProps {
  orders: Order[];
  products: Product[];
  purchaseHistory: PurchaseOrder[];
  onRevertPurchase: (id: string) => void;
}

const GSTReports: React.FC<GSTReportsProps> = ({ orders, products, purchaseHistory, onRevertPurchase }) => {
  const [reportType, setReportType] = useState<'monthly' | 'quarterly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);
  const [showSplit, setShowSplit] = useState(true);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.date);
      if (orderDate.getFullYear() !== selectedYear) return false;
      if (reportType === 'monthly') return orderDate.getMonth() === selectedMonth;
      const quarter = Math.floor(orderDate.getMonth() / 3) + 1;
      return quarter === selectedQuarter;
    });
  }, [orders, reportType, selectedYear, selectedMonth, selectedQuarter]);

  const filteredPurchases = useMemo(() => {
    return purchaseHistory.filter(po => {
      const poDate = new Date(po.date);
      if (poDate.getFullYear() !== selectedYear) return false;
      if (reportType === 'monthly') return poDate.getMonth() === selectedMonth;
      const quarter = Math.floor(poDate.getMonth() / 3) + 1;
      return quarter === selectedQuarter;
    });
  }, [purchaseHistory, reportType, selectedYear, selectedMonth, selectedQuarter]);

  const profitStats = useMemo(() => {
    // 1. Revenue & Sales Tax
    const grossRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const taxCollected = filteredOrders.reduce((sum, o) => sum + o.totalTax, 0);
    
    // 2. Cost of Goods Sold (COGS - Cost incurred specifically for the sales made)
    const cogs = filteredOrders.reduce((sum, o) => {
      return sum + o.items.reduce((iSum, item) => iSum + (item.quantity * item.costPrice), 0);
    }, 0);

    // 3. New Stock Investment (Total cost of stock purchased in this period)
    const stockInvestment = filteredPurchases
      .filter(p => p.natureOfPurchase === 'Stock')
      .reduce((sum, p) => sum + p.investmentInr, 0);

    // 4. Operational Expenses (Purchases marked as 'Other')
    const otherExpenses = filteredPurchases
      .filter(p => p.natureOfPurchase === 'Other')
      .reduce((sum, p) => sum + p.investmentInr, 0);

    // 5. Current Inventory Valuation (Synced from Master Products)
    const closingStockValue = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);

    // 6. Net Profit Analysis
    // Net Profit = (Revenue - Tax) - COGS - OtherExpenses
    const netRevenue = grossRevenue - taxCollected;
    const actualProfit = netRevenue - cogs - otherExpenses;
    const profitMargin = netRevenue > 0 ? (actualProfit / netRevenue) * 100 : 0;

    return { 
      grossRevenue, 
      taxCollected, 
      cogs, 
      stockInvestment,
      otherExpenses, 
      actualProfit, 
      profitMargin,
      closingStockValue 
    };
  }, [filteredOrders, filteredPurchases, products]);

  const exportSummary = () => {
    const period = reportType === 'monthly' 
      ? `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][selectedMonth]} ${selectedYear}`
      : `Q${selectedQuarter} ${selectedYear}`;

    const summaryData = [
      { Category: 'Period', Value: period },
      { Category: 'Gross Sales (Incl. Tax)', Value: `₹${profitStats.grossRevenue.toLocaleString()}` },
      { Category: 'GST Collected (Liability)', Value: `₹${profitStats.taxCollected.toLocaleString()}` },
      { Category: 'Cost of Goods Sold (COGS)', Value: `₹${profitStats.cogs.toLocaleString()}` },
      { Category: 'Other Expenses', Value: `₹${profitStats.otherExpenses.toLocaleString()}` },
      { Category: 'Stock Investment (Period)', Value: `₹${profitStats.stockInvestment.toLocaleString()}` },
      { Category: 'Closing Inventory Value', Value: `₹${profitStats.closingStockValue.toLocaleString()}` },
      { Category: '------------------', Value: '------------------' },
      { Category: 'NET SALES PROFIT', Value: `₹${profitStats.actualProfit.toLocaleString()}` },
      { Category: 'Net Margin (%)', Value: `${profitStats.profitMargin.toFixed(2)}%` }
    ];

    const worksheet = XLSX.utils.json_to_sheet(summaryData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Summary");
    XLSX.writeFile(workbook, `Tevolta_Financials_${period.replace(' ', '_')}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Selector Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Performance Analytics</h2>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mt-6 w-fit">
            <button onClick={() => setReportType('monthly')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${reportType === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Monthly</button>
            <button onClick={() => setReportType('quarterly')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${reportType === 'quarterly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Quarterly</button>
          </div>
        </div>
        <div className="flex gap-4">
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest outline-none">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {reportType === 'monthly' ? (
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest outline-none">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          ) : (
            <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(Number(e.target.value))} className="px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest outline-none">
              {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* PROFIT CONSOLE */}
      <div className="bg-[#050a30] rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8">
            <div>
              <h3 className="text-3xl font-black uppercase tracking-tight">Financial Performance Ledger</h3>
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Real-time valuation & sales cost audit</p>
            </div>
            <div className="flex gap-4 w-full lg:w-auto">
              <button 
                onClick={exportSummary}
                className="flex-1 lg:flex-none px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
              >
                📊 Export Full Summary
              </button>
              <button 
                onClick={() => setShowSplit(!showSplit)}
                className="flex-1 lg:flex-none px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
              >
                {showSplit ? 'Hide Breakdown' : 'Show Breakdown'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 hover:bg-white/[0.08] transition-all group">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                 Gross Sales
               </p>
               <h4 className="text-2xl font-black text-blue-400 group-hover:scale-105 transition-transform origin-left">₹{profitStats.grossRevenue.toLocaleString()}</h4>
               <p className="text-[8px] text-slate-400 mt-2 font-medium">Incl. all taxes</p>
            </div>
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 hover:bg-white/[0.08] transition-all group">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                 Sales Cost (COGS)
               </p>
               <h4 className="text-2xl font-black text-red-400 group-hover:scale-105 transition-transform origin-left">₹{profitStats.cogs.toLocaleString()}</h4>
               <p className="text-[8px] text-slate-400 mt-2 font-medium">Stock cost for units sold</p>
            </div>
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 hover:bg-white/[0.08] transition-all group">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                 Stock Investment
               </p>
               <h4 className="text-2xl font-black text-amber-400 group-hover:scale-105 transition-transform origin-left">₹{profitStats.stockInvestment.toLocaleString()}</h4>
               <p className="text-[8px] text-slate-400 mt-2 font-medium">Purchased this period</p>
            </div>
            <div className="bg-blue-600/20 p-6 rounded-[2rem] border border-blue-500/30 hover:bg-blue-600/30 transition-all group shadow-inner">
               <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
                 Inventory Value
               </p>
               <h4 className="text-2xl font-black text-white group-hover:scale-105 transition-transform origin-left">₹{profitStats.closingStockValue.toLocaleString()}</h4>
               <p className="text-[8px] text-blue-400 mt-2 font-medium uppercase tracking-widest font-black">Closing Stock Asset</p>
            </div>
          </div>

          {showSplit && (
            <div className="mt-12 bg-white/5 border border-white/10 rounded-[2.5rem] p-10 animate-in slide-in-from-top-4 duration-500">
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-8 text-center">Profit Reconciliation Summary</h4>
              
              <div className="max-w-3xl mx-auto space-y-6 text-sm font-black uppercase tracking-tighter">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                  <span className="text-slate-400">Net Sales Revenue (Excl. GST)</span>
                  <span className="text-white">₹{(profitStats.grossRevenue - profitStats.taxCollected).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-center h-4 relative">
                  <div className="w-[1px] h-full bg-white/10"></div>
                  <span className="absolute -top-1 bg-[#050a30] px-2 text-red-400 text-[10px]">-</span>
                </div>

                <div className="flex justify-between items-center border border-red-500/20 p-4 rounded-xl bg-red-500/5">
                  <span className="text-slate-400">Less: Cost of Goods Sold (Stock Cost)</span>
                  <span className="text-red-400">₹{profitStats.cogs.toLocaleString()}</span>
                </div>

                <div className="flex justify-center h-4 relative">
                  <div className="w-[1px] h-full bg-white/10"></div>
                  <span className="absolute -top-1 bg-[#050a30] px-2 text-red-400 text-[10px]">-</span>
                </div>

                <div className="flex justify-between items-center border border-red-500/20 p-4 rounded-xl bg-red-500/5">
                  <span className="text-slate-400">Less: Operational/Other Expenses</span>
                  <span className="text-red-400">₹{profitStats.otherExpenses.toLocaleString()}</span>
                </div>

                <div className="pt-6 border-t border-white/10 mt-6">
                  <div className="flex justify-between items-center bg-blue-600 p-6 rounded-2xl shadow-xl shadow-blue-900/40">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-blue-100 font-bold uppercase tracking-widest">Net Sales Profit</span>
                      <span className="text-4xl font-black text-white mt-1">₹{profitStats.actualProfit.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest">Period Margin</p>
                       <p className="text-2xl font-black text-white">{profitStats.profitMargin.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Financial Ledger Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-slate-100 flex justify-between items-center">
           <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Period Investment Audit</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manual audit of historical purchase logs</p>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-10">
          {filteredPurchases.map(po => (
            <div key={po.id} className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 hover:shadow-xl transition-all group relative">
              <div className="flex justify-between items-start mb-6">
                 <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase">{po.invoiceRef || po.id}</p>
                   <h4 className="text-sm font-black text-slate-800 uppercase mt-1 truncate max-w-[140px]">{po.supplierName}</h4>
                   <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[8px] font-black uppercase ${po.natureOfPurchase === 'Stock' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                     {po.natureOfPurchase}
                   </span>
                 </div>
                 <button onClick={() => onRevertPurchase(po.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">✕</button>
              </div>

              <div className="space-y-4">
                 <div className="bg-white rounded-2xl p-4 flex justify-between items-center border border-slate-100">
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase">Value</p>
                       <p className="text-lg font-black text-slate-900">₹{po.investmentInr.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] font-black text-slate-400 uppercase">Ref</p>
                       <p className="text-[10px] font-bold text-blue-600 uppercase">LOGGED</p>
                    </div>
                 </div>
              </div>
            </div>
          ))}
          {filteredPurchases.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-30 italic">No historical investments found for this period.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GSTReports;
