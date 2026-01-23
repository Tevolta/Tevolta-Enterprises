
import React, { useState } from 'react';
import { Order } from '../types';

interface OrdersListProps {
  orders: Order[];
  onViewInvoice: (order: Order) => void;
  onNewOrder: () => void;
}

const OrdersList: React.FC<OrdersListProps> = ({ orders, onViewInvoice, onNewOrder }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter(o => 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-black text-slate-800">Order History</h3>
          <p className="text-slate-500 text-sm mt-1">Search through past sales and regenerate invoices for your clients.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <span className="absolute left-4 top-3 text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="Search by name, email or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-72 transition-all"
            />
          </div>
          <button 
            onClick={onNewOrder}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 whitespace-nowrap"
          >
            + Create New Order
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Order Details</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Items</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Total Amount</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.map(order => (
              <tr key={order.id} className="group hover:bg-slate-50/80 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                      {order.customerName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-800">{order.customerName}</div>
                      <div className="text-xs text-slate-400 font-mono">#{order.id.slice(-6).toUpperCase()}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-sm text-slate-600 font-medium">
                  {new Date(order.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </td>
                <td className="px-8 py-6 text-sm text-center">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full font-bold text-xs">
                    {order.items.length} Units
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <span className="text-sm font-black text-slate-900">
                    ₹{order.totalAmount.toLocaleString()}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <button 
                    onClick={() => onViewInvoice(order)}
                    className="px-4 py-2 bg-white border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Regenerate Invoice
                  </button>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                  <div className="text-4xl mb-4">📭</div>
                  <h4 className="text-lg font-bold text-slate-400">No orders found</h4>
                  <p className="text-sm text-slate-300">Try adjusting your search filters or create a new order.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersList;
