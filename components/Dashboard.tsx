
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Order, Product } from '../types';

interface DashboardProps {
  orders: Order[];
  products: Product[];
  lowStockThreshold: number;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, products, lowStockThreshold }) => {
  const stats = useMemo(() => {
    const totalSales = orders.reduce((acc, o) => acc + o.totalAmount, 0);
    const orderCount = orders.length;
    const lowStockItems = products.filter(p => p.stock < lowStockThreshold).length;
    const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0;

    return { totalSales, orderCount, lowStockItems, avgOrderValue };
  }, [orders, products, lowStockThreshold]);

  const salesData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => ({
      date: date.split('-').slice(1).join('/'),
      amount: orders
        .filter(o => o.date.startsWith(date))
        .reduce((sum, o) => sum + o.totalAmount, 0)
    }));
  }, [orders]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue (Incl. Tax)" value={`₹${stats.totalSales.toLocaleString()}`} icon="🇮🇳" color="blue" />
        <StatCard title="Total Orders" value={stats.orderCount.toString()} icon="📦" color="slate" />
        <StatCard title="Average Bill" value={`₹${stats.avgOrderValue.toFixed(0)}`} icon="📊" color="indigo" />
        <StatCard title="Low Stock Alerts" value={stats.lowStockItems.toString()} icon="⚠️" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Sales Growth</h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Last 7 Days</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  itemStyle={{ color: '#2563eb', fontWeight: 900 }}
                  labelStyle={{ fontWeight: 900, marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#2563eb" fillOpacity={1} fill="url(#colorSales)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase mb-6">Inventory Status</h3>
          <div className="flex-1 space-y-6">
            {products.slice(0, 5).map(p => (
              <div key={p.id} className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                  <span className="text-slate-500 truncate mr-2">{p.name}</span>
                  <span className={`${p.stock < lowStockThreshold ? 'text-red-500' : 'text-slate-800'}`}>{p.stock} units</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${p.stock < lowStockThreshold ? 'bg-red-500' : 'bg-blue-600'}`} 
                    style={{ width: `${Math.min((p.stock / (lowStockThreshold * 2)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10px] text-slate-400 font-black uppercase tracking-widest">Showing Top 5 Items</p>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase mb-6">Recent Sales Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Invoice Value</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tax Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.slice(0, 5).map(o => (
                <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5 text-sm font-bold text-slate-800">{o.customerName}</td>
                  <td className="px-6 py-5 text-sm text-slate-500 font-medium">{new Date(o.date).toLocaleDateString()}</td>
                  <td className="px-6 py-5 text-sm text-slate-900 font-black text-right">₹{o.totalAmount.toLocaleString()}</td>
                  <td className="px-6 py-5 text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      o.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {o.status === 'Completed' ? 'Tax Filed' : o.status}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 italic font-medium">No billing activity recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, icon: string, color: string }> = ({ title, value, icon, color }) => {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    red: 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <div className={`bg-white p-8 rounded-[2rem] border-2 ${colorMap[color].split(' ')[2]} shadow-sm transition-transform hover:-translate-y-1`}>
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl ${colorMap[color].split(' ').slice(0,2).join(' ')} shadow-inner`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <h4 className="text-3xl font-black text-slate-900 mt-2 tracking-tighter">{value}</h4>
      </div>
    </div>
  );
};

export default Dashboard;
