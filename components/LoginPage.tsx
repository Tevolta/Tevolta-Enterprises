
import React, { useState } from 'react';
import { User } from '../types';
import Logo from './Logo';

interface LoginPageProps {
  onLogin: (user: User) => void;
  users: User[];
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple local lookup for internal use
    const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!foundUser) {
      setError('Account not recognized. Please contact admin.');
      return;
    }

    if (!foundUser.enabled) {
      setError('This account is currently disabled.');
      return;
    }

    if (password === foundUser.password) {
      onLogin(foundUser);
    } else {
      setError('Incorrect password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050a30] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/5 rounded-full blur-[120px]"></div>

      <div className="bg-white rounded-[4rem] w-full max-w-md p-12 shadow-2xl relative z-10 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-12">
          <Logo variant="dark" className="h-16 mx-auto mb-6" showText={false} />
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Tevolta ERP</h1>
          <p className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-[0.5em]">Internal Access Only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 transition-all placeholder:text-slate-300"
              required
              placeholder="e.g. admin"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 transition-all"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 animate-in shake duration-300">
              <p className="text-red-600 text-[10px] font-black uppercase text-center">{error}</p>
            </div>
          )}

          <button 
            type="submit"
            className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-blue-900/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Login to Workspace
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-center gap-3 opacity-40">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End-to-End Local Sync</p>
        </div>
      </div>
      
      <p className="mt-8 text-white/10 text-[9px] font-bold uppercase tracking-[0.4em]">Tevolta Enterprises — Proprietary Internal Systems</p>
    </div>
  );
};

export default LoginPage;
