
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface AdminUserManagementProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const userData: User = {
      id: editingUser ? editingUser.id : Math.random().toString(36).substr(2, 9),
      username: formData.get('username') as string,
      password: (formData.get('password') as string) || (editingUser?.password),
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      role: formData.get('role') as UserRole,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      enabled: editingUser ? editingUser.enabled : true
    };

    if (editingUser) {
      onUpdateUser(userData);
    } else {
      onAddUser(userData);
    }
    
    setIsAdding(false);
    setEditingUser(null);
  };

  const toggleUserStatus = (user: User) => {
    onUpdateUser({ ...user, enabled: !user.enabled });
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setIsAdding(true);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">User Management</h2>
          <p className="text-sm text-slate-500">Register new staff, manage roles, and edit account information.</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setIsAdding(true); }}
          className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
        >
          + Create New Account
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Username</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Role</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${u.role === 'admin' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      {u.firstName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block leading-none">{u.firstName} {u.lastName}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{u.email || 'No Email'}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-sm font-mono text-slate-500">{u.username}</td>
                <td className="px-8 py-6 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-8 py-6 text-center">
                  <button 
                    onClick={() => toggleUserStatus(u)}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      u.enabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {u.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </td>
                <td className="px-8 py-6 text-right space-x-4">
                  <button 
                    onClick={() => openEdit(u)}
                    className="text-xs font-black text-blue-500 hover:text-blue-700 uppercase tracking-widest"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => { if(confirm('Permanently remove this user?')) onDeleteUser(u.id) }}
                    className="text-xs font-black text-red-400 hover:text-red-600 uppercase tracking-widest"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-xl overflow-hidden shadow-2xl">
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
                  {editingUser ? 'Edit User Profile' : 'New User Registration'}
                </h3>
                <button type="button" onClick={() => { setIsAdding(false); setEditingUser(null); }} className="text-slate-400 hover:text-slate-900">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">First Name</label>
                  <input required name="firstName" defaultValue={editingUser?.firstName} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Name</label>
                  <input required name="lastName" defaultValue={editingUser?.lastName} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input required name="email" type="email" defaultValue={editingUser?.email} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                  <input required name="phone" defaultValue={editingUser?.phone} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</label>
                  <input required name="username" defaultValue={editingUser?.username} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Level</label>
                  <select name="role" defaultValue={editingUser?.role || 'employee'} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold">
                    <option value="employee">Staff (Sales/Inventory Only)</option>
                    <option value="admin">Admin (Full Access)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {editingUser ? 'Reset Password (Leave blank to keep current)' : 'Account Password'}
                </label>
                <input required={!editingUser} name="password" type="password" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setIsAdding(false); setEditingUser(null); }} className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-slate-500 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-white bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">
                  {editingUser ? 'Save Changes' : 'Register Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
