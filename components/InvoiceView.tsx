
import React, { useEffect, useState } from 'react';
import { Order, CompanyConfig } from '../types';
import Logo from './Logo';
import { uploadInvoiceHtml } from '../services/cloudStorageService';

interface InvoiceViewProps {
  order: Order;
  onBack: () => void;
  companyConfig: CompanyConfig;
  autoPrint?: boolean;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ order, onBack, companyConfig, autoPrint = false }) => {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  // High-precision A4 Print Template
  const generateInvoiceSnapshot = (contentHtml: string) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${order.serialNumber || order.id}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 210mm;
      height: 297mm;
      background: white !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-family: 'Inter', sans-serif;
    }
    #print-wrapper {
      width: 210mm;
      height: 297mm;
      overflow: hidden;
      /* CRITICAL: Safe margins of 15mm ensure no edge cropping on actual paper printers */
      padding: 15mm; 
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      background: white !important;
    }
    
    /* Removed solid navy backgrounds for better printing */
    .print-bg-white { background-color: white !important; color: black !important; }
    .print-bg-green { background-color: #f0fdf4 !important; color: #15803d !important; }
    .print-bg-slate { background-color: #f8fafc !important; }
    .print-border-thick { border: 2px solid #000000 !important; }
    .print-border-navy { border-color: #050a30 !important; }
    
    .invoice-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    
    /* Responsive row shrinking to guarantee everything fits on ONE page */
    ${order.items.length > 5 ? `
      .item-row { padding-top: 0.3rem !important; padding-bottom: 0.3rem !important; }
      .item-name { font-size: 10px !important; }
      .text-sm { font-size: 11px !important; }
      .text-lg { font-size: 14px !important; }
    ` : ''}

    * { 
      -webkit-print-color-adjust: exact !important; 
      print-color-adjust: exact !important;
    }
    
    /* Ensure tables never split or shift unexpectedly */
    table { width: 100%; border-collapse: collapse; }
    tr { page-break-inside: avoid; }
  </style>
</head>
<body>
  <div id="print-wrapper">
    ${contentHtml}
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    if (!synced) {
      alert("Please perform 'Cloud Sync' first to archive the bill to the database.");
      return;
    }

    const invoiceElement = document.getElementById('invoice-content-inner');
    if (!invoiceElement) return;

    const snapshotHtml = generateInvoiceSnapshot(invoiceElement.innerHTML);
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(snapshotHtml);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 1000);
    }
  };

  useEffect(() => {
    if (autoPrint && synced) {
      const timer = setTimeout(handlePrint, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, synced]);

  const handleCloudSync = async () => {
    const token = sessionStorage.getItem('gdrive_token');
    if (!token || token === 'local') {
      alert("Cloud connection required to archive bills and enable printing.");
      return;
    }

    setSyncing(true);
    try {
      const invoiceElement = document.getElementById('invoice-content-inner');
      if (!invoiceElement) throw new Error("Invoice content not found");

      const snapshotHtml = generateInvoiceSnapshot(invoiceElement.innerHTML);
      const fileName = `${order.serialNumber?.replace(/\//g, '-') || order.id}-${order.customerName.replace(/\s+/g, '_')}.html`;
      await uploadInvoiceHtml(token, fileName, snapshotHtml, companyConfig.sharedDriveId);
      setSynced(true);
    } catch (err) {
      console.error(err);
      alert("Cloud Sync failed. Bill must be archived before it can be printed.");
    } finally {
      setSyncing(false);
    }
  };

  const totalGstAmount = (order.cgst || 0) + (order.sgst || 0) + (order.igst || 0);

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-4">
        <button 
          onClick={onBack}
          className="text-slate-600 hover:text-slate-900 flex items-center gap-2 font-black text-xs uppercase tracking-widest bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all"
        >
          <span>←</span> Back to History
        </button>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleCloudSync}
            disabled={syncing || synced}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border ${
              synced ? 'bg-green-50 text-green-700 border-green-200 shadow-inner' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            {syncing ? '⌛ Archiving...' : synced ? '✅ Archived to Database' : '☁️ Cloud Sync (Required to Print)'}
          </button>
          <button 
            onClick={handlePrint}
            disabled={!synced}
            className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center gap-3 transition-all ${
              synced 
                ? 'bg-[#050a30] text-white hover:bg-blue-900' 
                : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none border border-slate-200'
            }`}
          >
            <span>📄</span> Print Final Bill
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl mx-auto overflow-hidden w-full max-w-[210mm] min-h-[297mm] flex flex-col" id="invoice-content">
        <div id="invoice-content-inner" className="p-10 flex flex-col flex-1 h-full bg-white box-border">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 shrink-0">
            <div className="space-y-3">
              <Logo variant="dark" className="h-10" showText={true} />
              <p className="text-slate-900 font-black uppercase text-[8px] tracking-[0.3em]">{companyConfig.tagline}</p>
            </div>
            <div className="text-right">
              <div className="inline-block border-2 border-slate-900 px-6 py-2.5 font-black uppercase tracking-[0.2em] text-[10px] rounded text-slate-900">
                Tax Invoice
              </div>
              <div className="mt-6 space-y-2">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Serial No.</p>
                  <p className="text-sm font-black text-slate-900 tracking-tight uppercase">{order.serialNumber}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                  <p className="text-[11px] font-bold text-slate-800">{new Date(order.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 shrink-0">
            <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">{companyConfig.name}</h1>
            <div className="text-[9px] text-slate-500 font-bold space-y-0.5 max-w-sm leading-relaxed">
              <p>{companyConfig.address}</p>
              <p>Email: {companyConfig.email} | Ph: {companyConfig.phone}</p>
              <div className="inline-block mt-3 px-3 py-1 bg-slate-50 rounded text-slate-900 font-black text-[10px] border border-slate-200">
                GSTIN: {companyConfig.gstin}
              </div>
            </div>
          </div>

          <div className="h-[1.5px] w-full bg-slate-900 mb-8 shrink-0"></div>

          <div className="invoice-body flex-1 flex flex-col h-full">
            <div className="flex justify-between items-stretch mb-8 gap-8 shrink-0">
              <div className="bg-slate-50/50 print-bg-slate p-6 rounded-2xl border border-slate-100 flex-1">
                <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Billed To:</h3>
                <h2 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-tight">{order.customerName}</h2>
                <div className="text-[9px] text-slate-600 font-bold space-y-0.5">
                  <p>{order.customerEmail}</p>
                  <p>Ph: {order.customerPhone}</p>
                  {order.customerGstin && <p className="mt-2 text-slate-900 font-black">GSTIN: {order.customerGstin}</p>}
                </div>
              </div>
              <div className="text-right flex flex-col justify-end items-end space-y-4">
                <div className="space-y-0.5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Place of Supply</p>
                  <p className="text-sm font-black text-slate-900">{companyConfig.stateCode}</p>
                </div>
                <div className="bg-green-50 print-bg-green text-green-700 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-200 inline-block">
                  Verified Payment
                </div>
              </div>
            </div>

            <div className="mb-8 flex-1">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-left">
                    <th className="pb-3 text-[8px] font-black uppercase tracking-widest text-slate-900">Items</th>
                    <th className="pb-3 text-[8px] font-black uppercase tracking-widest text-slate-900 text-center">HSN</th>
                    <th className="pb-3 text-[8px] font-black uppercase tracking-widest text-slate-900 text-center">Qty</th>
                    <th className="pb-3 text-[8px] font-black uppercase tracking-widest text-slate-900 text-right">Rate</th>
                    <th className="pb-3 text-[8px] font-black uppercase tracking-widest text-slate-900 text-center">GST</th>
                    <th className="pb-3 text-[8px] font-black uppercase tracking-widest text-slate-900 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <tr key={item.id} className="item-row">
                      <td className="py-3 pr-4">
                        <p className="font-black text-slate-900 text-[11px] uppercase item-name">{item.name}</p>
                        <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">ID: {item.productId}</p>
                      </td>
                      <td className="py-3 text-center text-[9px] font-black text-slate-500">{item.hsnCode || '—'}</td>
                      <td className="py-3 text-center text-slate-900 font-black text-[12px]">{item.quantity}</td>
                      <td className="py-3 text-right text-slate-600 font-bold text-[9px]">₹{item.unitPrice.toLocaleString()}</td>
                      <td className="py-3 text-center text-[9px] font-black text-blue-600">{item.gstRate}%</td>
                      <td className="py-3 text-right font-black text-slate-900 text-[12px]">₹{(item.quantity * item.unitPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-start gap-8 mb-8 shrink-0">
              <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 flex-1 max-w-sm">
                <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Tax Summary</h4>
                <div className="space-y-1.5 text-[9px] font-bold text-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-black uppercase tracking-widest">CGST</span>
                    <span>₹{order.cgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-black uppercase tracking-widest">SGST</span>
                    <span>₹{order.sgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {order.igst > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-black uppercase tracking-widest">IGST</span>
                      <span>₹{order.igst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-1">
                    <span className="text-slate-900 font-black uppercase tracking-widest">Total GST</span>
                    <span className="font-black text-blue-600">₹{totalGstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border-4 border-slate-900 text-slate-900 px-8 py-5 rounded-2xl flex flex-col items-center justify-center flex-1">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Grand Total</span>
                <span className="text-2xl font-black tracking-tighter">₹{order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex justify-between items-end gap-10 mt-auto shrink-0 pb-2">
              <div className="max-w-md">
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 text-slate-900">Declarations</h4>
                <ul className="text-[7.5px] text-slate-500 font-bold space-y-0.5 list-disc pl-4 italic">
                  <li>Certified that the particulars given above are true and correct.</li>
                  <li>Goods once sold will not be accepted back or exchanged.</li>
                  <li>Subject to {companyConfig.stateCode.split(' ')[0]} jurisdiction only.</li>
                </ul>
              </div>
              <div className="text-center min-w-[180px]">
                <div className="w-full border-t border-slate-300 h-[1px] mb-2 opacity-50"></div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-900">Authorised Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="no-print h-10"></div>
    </div>
  );
};

export default InvoiceView;
