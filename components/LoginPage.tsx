
import React, { useState } from 'react';
import { User } from '../types';
import Logo from './Logo';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onConnectCloud: (token: string) => Promise<boolean>;
  users: User[];
  googleClientId: string;
  scopes: string;
}

type LoginStep = 'MODE_SELECT' | 'SYNCING' | 'CREDENTIALS';

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onConnectCloud, users, googleClientId, scopes }) => {
  const [step, setStep] = useState<LoginStep>('MODE_SELECT');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLocalMode, setIsLocalMode] = useState(false);

  const handleModeSelect = (mode: 'cloud' | 'local') => {
    setError('');
    if (mode === 'local') {
      setIsLocalMode(true);
      sessionStorage.setItem('tevolta_local_mode', 'true');
      sessionStorage.removeItem('gdrive_token');
      setStep('CREDENTIALS');
    } else {
      setIsLocalMode(false);
      handleGoogleAuth();
    }
  };

  const handleGoogleAuth = () => {
    try {
      // @ts-ignore
      const client = google.accounts.oauth2.initTokenClient({
        client_id: googleClientId, 
        scope: scopes,
        callback: async (response: any) => {
          if (response.access_token) {
            setStep('SYNCING');
            const success = await onConnectCloud(response.access_token);
            if (success) {
              setStep('CREDENTIALS');
            } else {
              setStep('MODE_SELECT');
              setError('Cloud synchronization failed. Please try again or check internet.');
            }
          } else {
            setError('Google connection failed. Access token not received.');
          }
        },
      });
      client.requestAccessToken({ prompt: 'consent' });
    } catch (e) { 
      setError('Google Identity Service failed to load.');
    }
  };

  const handleCredsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!foundUser) {
      setError('Account not recognized in the current workspace.');
      return;
    }

    if (!foundUser.enabled) {
      setError('This staff account is currently disabled.');
      return;
    }

    if (password === foundUser.password) {
      onLogin(foundUser);
    } else {
      setError('Incorrect password. Please verify your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050a30] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/5 rounded-full blur-[120px]"></div>

      <div className="bg-white rounded-[4rem] w-full max-w-lg p-12 shadow-2xl relative z-10 animate-in zoom-in-95 duration-500 overflow-hidden">
        
        <div className="text-center mb-12">
          <Logo variant="dark" className="h-16 mx-auto mb-6" showText={false} />
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Tevolta Enterprise</h1>
          <p className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-[0.5em]">Internal Tool</p>
        </div>

        {step === 'MODE_SELECT' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Select Workspace Mode</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Choose how you want to access the company database today.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => handleModeSelect('cloud')}
                className="group relative p-8 bg-blue-50 border-2 border-blue-100 rounded-[2.5rem] text-left hover:border-blue-600 transition-all shadow-sm hover:shadow-xl hover:shadow-blue-500/10"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg">☁️</div>
                  <span className="text-[8px] font-black text-blue-600 bg-white px-3 py-1 rounded-full border border-blue-100 uppercase tracking-widest">Recommended</span>
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Enterprise Cloud Sync</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Connect Google Account to fetch real-time stock & user data.</p>
              </button>

              <button 
                onClick={() => handleModeSelect('local')}
                className="group p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] text-left hover:border-slate-400 transition-all"
              >
                <div className="w-12 h-12 bg-white border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center text-2xl mb-4">📡</div>
                <h3 className="text-lg font-black text-slate-700 uppercase tracking-tight">Offline Local Workspace</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Continue with cached data on this device only.</p>
              </button>
            </div>

            {error && (
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                <p className="text-red-600 text-[10px] font-black uppercase text-center">{error}</p>
              </div>
            )}
          </div>
        )}

        {step === 'SYNCING' && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95">
            <div className="relative">
              <div className="w-24 h-24 border-8 border-slate-50 rounded-full"></div>
              <div className="w-24 h-24 border-8 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              <div className="absolute inset-0 flex items-center justify-center text-3xl">☁️</div>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Accessing Cloud Drive</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-4 animate-pulse">Downloading Secure Database...</p>
            </div>
          </div>
        )}

        {step === 'CREDENTIALS' && (
          <form onSubmit={handleCredsSubmit} className="space-y-8 animate-in slide-in-from-right-5 duration-500">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isLocalMode ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'}`}>
                 {isLocalMode ? '📡' : '☁️'}
               </div>
               <div className="flex-1">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Workspace Link Active</p>
                 <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">
                   {isLocalMode ? 'Running Offline' : 'Cloud Sync Verified'}
                 </p>
               </div>
               <button type="button" onClick={() => setStep('MODE_SELECT')} className="text-[9px] font-black text-blue-600 uppercase underline">Change</button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 outline-none font-bold text-slate-700 transition-all placeholder:text-slate-300"
                  required
                  autoFocus
                  placeholder="e.g. admin"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 outline-none font-bold text-slate-700 transition-all"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100 animate-in shake duration-300">
                  <p className="text-red-600 text-[10px] font-black uppercase text-center">{error}</p>
                </div>
              )}

              <button 
                type="submit"
                className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-blue-900/40 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Sign In to Workstation
              </button>
            </div>
          </form>
        )}

        <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-center gap-3 opacity-30">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enterprise Core v3.7</p>
        </div>
      </div>
      
      <p className="mt-8 text-white/10 text-[9px] font-black uppercase tracking-[0.5em]">Tevolta Enterprises — Proprietary Workspace</p>
    </div>
  );
};

export default LoginPage;
