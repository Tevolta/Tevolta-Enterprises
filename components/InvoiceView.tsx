
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

const numberToWords = (num: number): string => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit !== 0 ? ' ' + a[digit] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  };

  const amount = Math.floor(num);
  const paise = Math.round((num - amount) * 100);
  
  let str = inWords(amount) + 'Rupees ';
  if (paise > 0) {
    str += 'and ' + inWords(paise) + 'Paise ';
  }
  return str + 'Only';
};

const InvoiceView: React.FC<InvoiceViewProps> = ({ order, onBack, companyConfig, autoPrint = false }) => {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const generateInvoiceSnapshot = (contentHtml: string) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${order.serialNumber || order.id}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { size: A4; margin: 0; }
    html, body { margin: 0; padding: 0; width: 210mm; height: 297mm; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: 'Inter', sans-serif; }
    #print-wrapper { width: 210mm; height: 297mm; overflow: hidden; display: flex; flex-direction: column; background: white !important; position: relative; }
    
    .content-layer { position: relative; z-index: 10; display: flex; flex-direction: column; height: 100%; }
    
    .industrial-border { border-top: 12px solid #050a30 !important; }
    .zebra-row:nth-child(even) { background-color: #f8fafc !important; }
    
    ${order.items.length > 8 ? `
      .item-row { padding-top: 0.2rem !important; padding-bottom: 0.2rem !important; }
      .text-sm { font-size: 11px !important; }
      .text-xs { font-size: 9px !important; }
    ` : ''}

    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    table { width: 100%; border-collapse: collapse; }
    tr { page-break-inside: avoid; }
  </style>
</head>
<body>
  <div id="print-wrapper">
    <div class="content-layer">
      ${contentHtml}
    </div>
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
    iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0';
    iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open(); doc.write(snapshotHtml); doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 1000);
    }
  };

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
  const amountInWords = numberToWords(order.totalAmount);

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-4">
        <button onClick={onBack} className="text-slate-600 hover:text-slate-900 flex items-center gap-2 font-black text-xs uppercase tracking-widest bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all">
          <span>←</span> Back to History
        </button>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handleCloudSync} disabled={syncing || synced} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border ${synced ? 'bg-green-50 text-green-700 border-green-200 shadow-inner' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'}`}>
            {syncing ? '⌛ Archiving...' : synced ? '✅ Archived to Database' : '☁️ Cloud Sync (Required to Print)'}
          </button>
          <button onClick={handlePrint} disabled={!synced} className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center gap-3 transition-all ${synced ? 'bg-[#050a30] text-white hover:bg-blue-900' : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none border border-slate-200'}`}>
            <span>📄</span> Print Final Bill
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-2xl mx-auto overflow-hidden w-full max-w-[210mm] min-h-[297mm] flex flex-col" id="invoice-content">
        <div id="invoice-content-inner" className="flex flex-col flex-1 h-full bg-white box-border relative industrial-border">
          
          {/* Header Section */}
          <div className="px-10 py-10 flex justify-between items-center shrink-0 border-b border-slate-100">
            <div className="flex items-center gap-6">
              <Logo variant="dark" className="h-12" showText={true} />
              <div className="w-px h-10 bg-slate-200"></div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900">{companyConfig.tagline}</p>
                <p className="text-[10px] font-bold text-slate-400">GSTIN: {companyConfig.gstin}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[#050a30] font-black uppercase tracking-[0.25em] text-[16px] leading-none mb-1">
                Tax Invoice
              </div>
              <p className="text-[8px] text-slate-500 uppercase tracking-widest font-black">Original for Recipient</p>
            </div>
          </div>

          <div className="p-10 flex-1 flex flex-col">
            {/* Address & Meta Data */}
            <div className="grid grid-cols-2 gap-10 mb-10 shrink-0">
              <div className="space-y-4">
                <div>
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Issued By:</h4>
                  <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight">{companyConfig.name}</h1>
                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed max-w-xs">{companyConfig.address}</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">Ph: {companyConfig.phone} | Email: {companyConfig.email}</p>
                </div>
              </div>
              <div className="flex flex-col items-end text-right space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-[200px]">
                  <div className="flex justify-between gap-4 mb-2">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Serial No:</span>
                    <span className="text-[11px] font-black text-slate-900 uppercase">{order.serialNumber}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Billing Date:</span>
                    <span className="text-[10px] font-bold text-slate-800">{new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Place of Supply</p>
                  <p className="text-xs font-black text-slate-900">{companyConfig.stateCode}</p>
                </div>
              </div>
            </div>

            {/* Billed To Box */}
            <div className="bg-[#f8fafc] rounded-2xl p-6 border border-slate-200 flex justify-between items-start mb-10 shrink-0">
               <div className="space-y-1">
                 <h4 className="text-[8px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">Billed To:</h4>
                 <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{order.customerName}</h2>
                 <p className="text-[10px] font-bold text-slate-600 leading-tight">{order.customerAddress || 'No Address Provided'}</p>
                 <p className="text-[10px] font-bold text-slate-600">{order.customerEmail} | {order.customerPhone}</p>
                 {order.customerGstin && <p className="text-[10px] font-black text-slate-900 mt-2 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">GSTIN: {order.customerGstin}</p>}
               </div>
               <div className="text-right">
                  <div className="bg-green-600 text-white px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest mb-2">Paid Full</div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Currency: INR (₹)</p>
               </div>
            </div>

            {/* Items Table */}
            <div className="flex-1 mb-10">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-left">
                    <th className="pb-3 pl-2 text-[9px] font-black uppercase tracking-widest text-slate-900">#</th>
                    <th className="pb-3 text-[9px] font-black uppercase tracking-widest text-slate-900">Item & Description</th>
                    <th className="pb-3 text-[9px] font-black uppercase tracking-widest text-slate-900 text-center">HSN</th>
                    <th className="pb-3 text-[9px] font-black uppercase tracking-widest text-slate-900 text-center">Qty</th>
                    <th className="pb-3 text-[9px] font-black uppercase tracking-widest text-slate-900 text-right">Unit Rate</th>
                    <th className="pb-3 text-[9px] font-black uppercase tracking-widest text-slate-900 text-center">GST %</th>
                    <th className="pb-3 pr-2 text-[9px] font-black uppercase tracking-widest text-slate-900 text-right">Taxable Val.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <tr key={item.id} className="zebra-row item-row">
                      <td className="py-4 pl-2 text-[10px] font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-4 pr-4 max-w-xs">
                        <p className="font-black text-slate-900 text-[11px] uppercase leading-none mb-1">{item.name}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight italic">SKU: {item.productId}</p>
                      </td>
                      <td className="py-4 text-center text-[10px] font-black text-slate-500">{item.hsnCode || '—'}</td>
                      <td className="py-4 text-center text-slate-900 font-black text-[12px]">{item.quantity}</td>
                      <td className="py-4 text-right text-slate-600 font-bold text-[10px]">₹{item.unitPrice.toLocaleString()}</td>
                      <td className="py-4 text-center text-[10px] font-black text-blue-600">{item.gstRate}%</td>
                      <td className="py-4 pr-2 text-right font-black text-slate-900 text-[12px]">₹{(item.quantity * item.unitPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Final Totals & Remittance */}
            <div className="grid grid-cols-2 gap-10 items-end shrink-0 mb-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Amount in Words:</h4>
                  <p className="text-[11px] font-black text-slate-900 uppercase leading-relaxed italic border-l-4 border-slate-200 pl-4">
                    {amountInWords}
                  </p>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Remittance Details:</h4>
                  <div className="grid grid-cols-2 gap-4 text-[9px] font-bold text-slate-600">
                    <div>
                      <p className="uppercase text-slate-400 text-[7px] tracking-widest">Bank Name</p>
                      <p className="font-black text-slate-800">{companyConfig.bankName || '—'}</p>
                    </div>
                    <div>
                      <p className="uppercase text-slate-400 text-[7px] tracking-widest">IFSC Code</p>
                      <p className="font-black text-slate-800">{companyConfig.bankIfsc || '—'}</p>
                    </div>
                    <div>
                      <p className="uppercase text-slate-400 text-[7px] tracking-widest">Account No.</p>
                      <p className="font-black text-slate-800">{companyConfig.bankAccountNo || '—'}</p>
                    </div>
                    <div>
                      <p className="uppercase text-slate-400 text-[7px] tracking-widest">A/c Holder</p>
                      <p className="font-black text-slate-800">{companyConfig.bankAccountHolder || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Updated Totals Box Style to match Remittance Details */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>Taxable Value (Subtotal)</span>
                    <span>₹{order.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  
                  <div className="py-2 space-y-1.5 border-y border-slate-200/50">
                    {order.cgst > 0 && (
                      <div className="flex justify-between items-center text-[9px] font-black text-slate-600 uppercase tracking-widest">
                        <span>CGST Output</span>
                        <span>₹{order.cgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {order.sgst > 0 && (
                      <div className="flex justify-between items-center text-[9px] font-black text-slate-600 uppercase tracking-widest">
                        <span>SGST Output</span>
                        <span>₹{order.sgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {order.igst > 0 && (
                      <div className="flex justify-between items-center text-[9px] font-black text-slate-600 uppercase tracking-widest">
                        <span>IGST Output</span>
                        <span>₹{order.igst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    <span>Total GST Amount</span>
                    <span>₹{totalGstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="h-px bg-slate-200 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Grand Total</span>
                    <span className="text-2xl font-black text-[#050a30] tracking-tighter">₹{order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Sign-off */}
            <div className="flex justify-between items-end gap-10 mt-auto shrink-0 border-t border-slate-100 pt-6">
              <div className="max-w-md">
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 text-slate-900">Legal Terms:</h4>
                <ul className="text-[8px] text-slate-500 font-bold space-y-0.5 list-disc pl-4 italic">
                  <li>Payment is due within 7 days of invoice date.</li>
                  <li>Goods once sold will not be returned or exchanged.</li>
                  <li>Our responsibility ceases as soon as goods leave our premises.</li>
                </ul>
              </div>
              <div className="text-center min-w-[220px] space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-10">For {companyConfig.name}</p>
                <div className="w-full border-t border-slate-900 h-px"></div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-900">Authorized Signatory</p>
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
