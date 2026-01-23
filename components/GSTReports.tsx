
import React, { useState, useMemo } from 'react';
import { Order } from '../types';

interface GSTReportsProps {
  orders: Order[];
}

const GSTReports: React.FC<GSTReportsProps> = ({ orders }) => {
  const [reportType, setReportType] = useState<'monthly' | 'quarterly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.date);
      if (orderDate.getFullYear() !== selectedYear) return false;

      if (reportType === 'monthly') {
        return orderDate.getMonth() === selectedMonth;
      } else {
        const quarter = Math.floor(orderDate.getMonth() / 3) + 1;
        return quarter === selectedQuarter;
      }
    });
  }, [orders, reportType, selectedYear, selectedMonth, selectedQuarter]);

  const reportTotals = useMemo(() => {
    return filteredOrders.reduce((acc, order) => ({
      taxableValue: acc.taxableValue + order.subtotal,
      cgst: acc.cgst + order.cgst,
      sgst: acc.sgst + order.sgst,
      totalTax: acc.totalTax + order.totalTax,
      totalAmount: acc.totalAmount + order.totalAmount,
    }), { taxableValue: 0, cgst: 0, sgst: 0, totalTax: 0, totalAmount: 0 });
  }, [filteredOrders]);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const quarters = [
    { label: "Q1 (Jan-Mar)", val: 1 },
    { label: "Q2 (Apr-Jun)", val: 2 },
    { label: "Q3 (Jul-Sep)", val: 3 },
    { label: "Q4 (Oct-Dec)", val: 4 }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Selection Header */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">GST Compliance Reports</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Generate sales tax summaries for GSTR-1 preparation.</p>
          
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mt-6 w-fit">
            <button 
              onClick={() => setReportType('monthly')}
              className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${reportType === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setReportType('quarterly')}
              className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${reportType === 'quarterly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Quarterly
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Year</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="block w-32 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {reportType === 'monthly' ? (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Month</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="block w-40 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Quarter</label>
              <select 
                value={selectedQuarter} 
                onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                className="block w-40 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {quarters.map(q => <option key={q.val} value={q.val}>{q.label}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Taxable Value" value={`₹${reportTotals.taxableValue.toLocaleString()}`} subtitle="Net Sales Before GST" />
        <StatCard title="Output CGST" value={`₹${reportTotals.cgst.toLocaleString()}`} subtitle="Central Goods & Service Tax" />
        <StatCard title="Output SGST" value={`₹${reportTotals.sgst.toLocaleString()}`} subtitle="State Goods & Service Tax" />
        <StatCard title="Total Tax Payable" value={`₹${reportTotals.totalTax.toLocaleString()}`} subtitle="Combined Liability" highlight />
      </div>

      {/* Detailed Transaction Log */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">B2B & B2C Invoices Summary</h3>
          <button className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition-all">
            Export to Excel
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Date</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer GSTIN</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Taxable Value</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">CGST</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">SGST</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Invoice Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <p className="text-xs font-bold text-slate-800">{new Date(order.date).toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Inv: #{order.id.slice(-6).toUpperCase()}</p>
                  </td>
                  <td className="px-8 py-5 text-xs font-black text-slate-600">
                    {order.customerGstin || <span className="text-slate-300">Consumer (Unreg)</span>}
                  </td>
                  <td className="px-8 py-5 text-right font-bold text-sm">₹{order.subtotal.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right text-xs font-medium text-slate-500">₹{order.cgst.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right text-xs font-medium text-slate-500">₹{order.sgst.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right font-black text-slate-900">₹{order.totalAmount.toLocaleString()}</td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="text-4xl mb-4 grayscale opacity-20">📜</div>
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Sales Recorded</h4>
                    <p className="text-xs text-slate-300 mt-1">There are no transactions for the selected period.</p>
                  </td>
                </tr>
              )}
            </tbody>
            {filteredOrders.length > 0 && (
              <tfoot className="bg-slate-50/80 font-black text-slate-900">
                <tr>
                  <td colSpan={2} className="px-8 py-6 text-xs uppercase tracking-widest">Total for Period</td>
                  <td className="px-8 py-6 text-right">₹{reportTotals.taxableValue.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right">₹{reportTotals.cgst.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right">₹{reportTotals.sgst.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right text-blue-600">₹{reportTotals.totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, subtitle: string, highlight?: boolean }> = ({ title, value, subtitle, highlight }) => (
  <div className={`p-8 rounded-[2rem] border transition-all ${highlight ? 'bg-[#050a30] text-white border-blue-900 shadow-xl' : 'bg-white text-slate-800 border-slate-200'}`}>
    <p className={`text-[10px] font-black uppercase tracking-widest ${highlight ? 'text-blue-300' : 'text-slate-400'}`}>{title}</p>
    <h3 className="text-3xl font-black mt-2 tracking-tighter">{value}</h3>
    <p className={`text-[10px] mt-2 font-bold uppercase tracking-tight ${highlight ? 'text-blue-400/60' : 'text-slate-400/60'}`}>{subtitle}</p>
  </div>
);

export default GSTReports;
