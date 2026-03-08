
import React from 'react';
import { StockLog } from '../types';

interface StockAuditLogProps {
  logs: StockLog[];
  onClear?: () => void;
  isAdmin: boolean;
}

const StockAuditLog: React.FC<StockAuditLogProps> = ({
  logs,
  onClear,
  isAdmin
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Stock Movement Audit Log</h2>
          <p className="text-sm text-slate-500 font-medium">Traceable history of every stock change across all SKUs.</p>
        </div>
        {isAdmin && onClear && (
          <button 
            onClick={onClear}
            className="px-8 py-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
          >
            Clear Log History
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product / SKU</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Movement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="text-sm font-bold text-slate-600">{new Date(log.timestamp).toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-black text-slate-800 uppercase">{log.productName}</p>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{log.productId}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      log.type === 'Sale' ? 'bg-red-50 text-red-600' :
                      log.type === 'Purchase' ? 'bg-green-50 text-green-600' :
                      log.type === 'Rollback' ? 'bg-amber-50 text-amber-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-500 uppercase tracking-tight">{log.referenceId}</td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-500 uppercase tracking-tight">{log.staffName}</td>
                  <td className={`px-8 py-5 text-right font-black text-lg ${log.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {log.change > 0 ? `+${log.change}` : log.change}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center opacity-30 italic">No stock movement logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockAuditLog;
