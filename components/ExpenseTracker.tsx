
import React, { useState } from 'react';
import { Expense, User } from '../types';

interface ExpenseTrackerProps {
  expenses: Expense[];
  onAdd: (expense: Expense) => void;
  onDelete: (id: string) => void;
  user: User | null;
  isAdmin: boolean;
}

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({
  expenses,
  onAdd,
  onDelete,
  user,
  isAdmin
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    category: 'Rent',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = ['Rent', 'Electricity', 'Salary', 'Logistics', 'Marketing', 'Maintenance', 'Other'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description) return;

    const newExpense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      date: form.date,
      category: form.category,
      amount: Number(form.amount),
      description: form.description,
      staffName: user?.firstName || 'Unknown'
    };

    onAdd(newExpense);
    setIsAdding(false);
    setForm({
      category: 'Rent',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Expense Tracker</h2>
          <p className="text-sm text-slate-500 font-medium">Manage non-inventory operational costs and overheads.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-amber-50 px-6 py-3 rounded-2xl border border-amber-100">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Total Expenses</p>
            <p className="text-xl font-black text-amber-900">₹{totalExpenses.toLocaleString()}</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl transition-all"
          >
            + Log Expense
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Log New Expense</h3>
              <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-red-500 font-black">✕</button>
            </div>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                <input 
                  type="date" 
                  value={form.date} 
                  onChange={e => setForm({...form, date: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                <select 
                  value={form.category} 
                  onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black outline-none"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount (₹)</label>
                <input 
                  type="number" 
                  value={form.amount} 
                  onChange={e => setForm({...form, amount: e.target.value})}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="What was this for?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black outline-none focus:ring-4 focus:ring-blue-500/10 min-h-[100px]"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl transition-all mt-4"
              >
                Save Expense Record
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged By</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                {isAdmin && <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                <tr key={expense.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5 text-sm font-bold text-slate-600">{new Date(expense.date).toLocaleDateString()}</td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-slate-800">{expense.description}</td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-500 uppercase tracking-tight">{expense.staffName}</td>
                  <td className="px-8 py-5 text-right font-black text-slate-900">₹{expense.amount.toLocaleString()}</td>
                  {isAdmin && (
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => onDelete(expense.id)}
                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center opacity-30 italic">No expense records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;
