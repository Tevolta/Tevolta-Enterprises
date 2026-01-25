
import React, { useState } from 'react';
import { User } from '../types';
import Logo from './Logo';

interface LoginPageProps {
  onLogin: (user: User, token: string | null) => void;
  users: User[];
  googleClientId: string;
  scopes: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, users, googleClientId, scopes }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'creds' | 'google'>('creds');
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const handleCredsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
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
      setPendingUser(foundUser);
      setStep('google');
    } else {
      setError('Incorrect password.');
    }
  };

  const handleGoogleConnect = () => {
    try {
      // @ts-ignore
      const client = google.accounts.oauth2.initTokenClient({
        client_id: googleClientId, 
        scope: scopes,
        callback: async (response: any) => {
          if (response.access_token && pendingUser) {
            onLogin(pendingUser, response.access_token);
          } else {
            setError('Google connection failed. Please try again.');
          }
        },
      });
      client.requestAccessToken({ prompt: 'consent' });
    } catch (e) { 
      setError('Google Identity Service failed to load.');
    }
  };

  const handleRunLocally = () => {
    if (pendingUser) {
      onLogin(pendingUser, null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050a30] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/5 rounded-full blur-[120px]"></div>

      <div className="bg-white rounded-[4rem] w-full max-w-md p-12 shadow-2xl relative z-10 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <Logo variant="dark" className="h-16 mx-auto mb-6" showText={false} />
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Tevolta ERP</h1>
          <p className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-[0.5em]">Secure Internal Workspace</p>
        </div>

        {step === 'creds' ? (
          <form onSubmit={handleCredsSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Username</label>
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
              Log In
            </button>
          </form>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-right-5 duration-300">
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black">
                 {pendingUser?.firstName.charAt(0)}
               </div>
               <div>
                 <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Authentication Successful</p>
                 <p className="text-sm font-black text-slate-800">{pendingUser?.firstName} {pendingUser?.lastName}</p>
               </div>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-xl">☁️</div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Connect Organization Account</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Linking your Google Account enables automatic synchronization of sales and inventory data with your team.</p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleGoogleConnect}
                className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-blue-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Link Google Account
              </button>
              
              <button 
                onClick={handleRunLocally}
                className="w-full py-4 bg-white border-2 border-slate-200 text-slate-500 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
              >
                Run Locally (No Sync)
              </button>

              <button 
                onClick={() => { setStep('creds'); setPendingUser(null); }}
                className="w-full py-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                ← Back to Credentials
              </button>
            </div>
            
            {error && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <p className="text-red-600 text-[10px] font-black uppercase text-center">{error}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-center gap-3 opacity-40">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enterprise Cloud Core</p>
        </div>
      </div>
      
      <p className="mt-8 text-white/10 text-[9px] font-bold uppercase tracking-[0.4em]">Tevolta Enterprises — Proprietary Internal Systems</p>
    </div>
  );
};

export default LoginPage;
