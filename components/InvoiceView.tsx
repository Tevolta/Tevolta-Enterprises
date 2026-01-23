
import React from 'react';
import { Order, CompanyConfig } from '../types';
import Logo from './Logo';

interface InvoiceViewProps {
  order: Order;
  onBack: () => void;
  companyConfig: CompanyConfig;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ order, onBack, companyConfig }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex justify-between items-center mb-6">
        <button 
          onClick={onBack}
          className="text-slate-600 hover:text-slate-900 flex items-center gap-2 font-black text-xs uppercase tracking-widest bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all"
        >
          <span>←</span> Back to Sales
        </button>
        <button 
          onClick={handlePrint}
          className="px-6 py-2.5 bg-[#000829] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 flex items-center gap-2 hover:bg-blue-600 transition-all"
        >
          <span>🖨️</span> Print Tax Invoice
        </button>
      </div>

      <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-xl max-w-4xl mx-auto" id="invoice-content">
        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-12 mb-12">
          <div>
            <Logo variant="dark" className="h-10 mb-4" />
            <p className="text-slate-800 font-black uppercase text-[10px] tracking-[0.2em] mb-4">{companyConfig.tagline}</p>
            <div className="text-slate-500 text-xs font-medium leading-relaxed">
              <p className="font-black text-slate-800 uppercase">{companyConfig.name}</p>
              <p className="max-w-[300px]">{companyConfig.address}</p>
              <p>Email: {companyConfig.email}</p>
              <p>Ph: {companyConfig.phone}</p>
              <p className="mt-2 font-black text-slate-800">GSTIN: {companyConfig.gstin}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block bg-[#000829] text-white px-6 py-2 font-black uppercase tracking-widest text-sm mb-6 rounded-lg">
              Tax Invoice
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice No.</p>
                <p className="text-xl font-black text-slate-900 font-mono">TE/{new Date(order.date).getFullYear()}/{order.id.slice(-6).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Issue</p>
                <p className="text-sm font-bold text-slate-800">{new Date(order.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Billing Details</h3>
            <p className="text-xl font-black text-slate-900 mb-1">{order.customerName}</p>
            <div className="text-xs text-slate-600 font-medium space-y-1">
              <p>{order.customerEmail}</p>
              <p>{order.customerPhone}</p>
              {order.customerGstin && <p className="mt-2 text-slate-800 font-black">GSTIN: {order.customerGstin}</p>}
            </div>
          </div>
          <div className="text-right flex flex-col justify-center">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Payment Status</h3>
            <div>
              <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                order.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {order.status === 'Completed' ? 'Paid In Full' : order.status}
              </span>
            </div>
            <p className="mt-4 text-[10px] font-bold text-slate-400">Place of Supply: {companyConfig.stateCode}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-12">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-900 text-left">
                <th className="py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">Description</th>
                <th className="py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">HSN</th>
                <th className="py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">Qty</th>
                <th className="py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">Unit Price</th>
                <th className="py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">GST %</th>
                <th className="py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">Taxable Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <tr key={idx} className="group">
                  <td className="py-6">
                    <p className="font-black text-slate-900">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">ID: {item.productId.slice(0, 8)}</p>
                  </td>
                  <td className="py-6 text-center text-xs font-bold text-slate-600">{item.hsnCode || '—'}</td>
                  <td className="py-6 text-center text-slate-900 font-black">{item.quantity}</td>
                  <td className="py-6 text-right text-slate-600 font-medium">₹{item.unitPrice.toLocaleString()}</td>
                  <td className="py-6 text-center text-xs font-black text-blue-500">{item.gstRate}%</td>
                  <td className="py-6 text-right font-black text-slate-900">₹{(item.quantity * item.unitPrice).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-between items-start mb-12 gap-8">
          <div className="flex-1 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">GST Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Central GST (CGST)</span>
                <span>₹{order.cgst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>State GST (SGST)</span>
                <span>₹{order.sgst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-black text-blue-500 pt-2 border-t border-slate-200">
                <span>Total Tax Component</span>
                <span>₹{order.totalTax.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="w-80 space-y-4">
            <div className="flex justify-between text-slate-500 font-bold text-sm">
              <span>Taxable Value (Subtotal)</span>
              <span>₹{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-blue-500 font-bold text-sm border-b-2 border-slate-100 pb-4">
              <span>Total GST Amount</span>
              <span>₹{order.totalTax.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-end pt-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Grand Total (Inclusive of Tax)</span>
              <span className="text-4xl font-black text-slate-900 tracking-tighter">₹{order.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Terms and Footer */}
        <div className="border-t-2 border-slate-900 pt-12">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2">Terms & Conditions</h4>
              <ul className="text-[9px] text-slate-500 font-medium space-y-1 list-disc pl-3">
                <li>Goods once sold will not be taken back.</li>
                <li>Interest @18% p.a. will be charged if payment is not made within 15 days.</li>
                <li>Our responsibility ceases as soon as the goods leave our premises.</li>
                <li>Subject to {companyConfig.stateCode.split(' ')[0]} Jurisdiction.</li>
              </ul>
            </div>
            <div className="text-right flex flex-col justify-end items-end">
              <div className="w-48 border-b border-slate-300 h-16 mb-2"></div>
              <p className="text-[10px] font-black text-slate-900 uppercase">Authorised Signatory</p>
              <p className="text-[9px] text-slate-400 font-bold">For {companyConfig.name}</p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">This is a computer generated invoice</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
