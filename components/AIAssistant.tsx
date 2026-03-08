
import React, { useState } from 'react';
import { getBusinessInsights } from '../services/geminiService';
import { Order, Product } from '../types';

interface AIAssistantProps {
  orders: Order[];
  inventory: Product[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ orders, inventory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    try {
      const result = await getBusinessInsights(orders, inventory, prompt);
      setResponse(result);
      setPrompt('');
    } catch (err) {
      console.error("Chat Error:", err);
      setResponse("An unexpected error occurred while communicating with the AI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (p: string) => {
    setPrompt(p);
    // Use a timeout to ensure state update before execution
    setTimeout(() => {
        const btn = document.getElementById('ai-submit-btn');
        btn?.click();
    }, 50);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40 border-2 border-white/20"
      >
        <span className="text-2xl">🧠</span>
      </button>

      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Tevolta Intelligence</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Powered by Gemini AI</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-all">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
            {!response && !loading && (
              <div className="text-center space-y-4 pt-12 animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner border border-blue-100">🤖</div>
                <h4 className="font-black text-slate-800 uppercase tracking-tight">Business Advisor</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest px-8 leading-relaxed">Ask me about trends, stock alerts, or profit optimization.</p>
                <div className="grid grid-cols-1 gap-2 px-4 pt-4">
                  <button onClick={() => handleQuickPrompt('Summarize my sales for the last 7 days')} className="text-[10px] font-black uppercase tracking-widest text-left p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all">"7 Day Sales Trend"</button>
                  <button onClick={() => handleQuickPrompt('Which items should I restock urgently?')} className="text-[10px] font-black uppercase tracking-widest text-left p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all">"Urgent Stock Alerts"</button>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center pt-24 space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Analyzing System Data...</p>
              </div>
            )}

            {response && !loading && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 shadow-sm">
                  <p className="text-sm text-blue-900 leading-relaxed font-bold whitespace-pre-wrap">{response}</p>
                </div>
                <button 
                  onClick={() => setResponse(null)}
                  className="w-full py-4 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-white border border-blue-100 rounded-2xl hover:bg-blue-50 transition-all"
                >
                  New Analysis Request
                </button>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50">
            <div className="relative">
              <input 
                type="text" 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Query company data..."
                disabled={loading}
                className="w-full pl-5 pr-14 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold shadow-sm disabled:opacity-50"
                onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
              />
              <button 
                id="ai-submit-btn"
                onClick={handleAsk}
                disabled={loading}
                className="absolute right-2.5 top-2.5 w-10 h-10 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center disabled:opacity-50"
              >
                {loading ? '⌛' : '➔'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
