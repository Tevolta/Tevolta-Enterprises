
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
    if (!prompt.trim()) return;
    setLoading(true);
    const result = await getBusinessInsights(orders, inventory, prompt);
    setResponse(result);
    setLoading(false);
    setPrompt('');
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40"
      >
        <span className="text-2xl">🧠</span>
      </button>

      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Tevolta Advisor AI</h3>
              <p className="text-xs text-slate-500">Business insights & analysis</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!response && !loading && (
              <div className="text-center space-y-4 pt-12">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-3xl">🤖</div>
                <h4 className="font-bold text-slate-800">How can I help you today?</h4>
                <p className="text-sm text-slate-500 px-8">Ask about sales trends, which products are running low, or how to grow your appliance business.</p>
                <div className="grid grid-cols-1 gap-2 px-4 pt-4">
                  <button onClick={() => setPrompt('Summarize my sales for the last 7 days')} className="text-xs text-left p-3 bg-slate-50 rounded-lg hover:bg-slate-100">"Summarize my sales for the last 7 days"</button>
                  <button onClick={() => setPrompt('Which items should I restock urgently?')} className="text-xs text-left p-3 bg-slate-50 rounded-lg hover:bg-slate-100">"Which items should I restock urgently?"</button>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center pt-24 space-y-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-slate-500">Analyzing business data...</p>
              </div>
            )}

            {response && !loading && (
              <div className="bg-blue-50 p-5 rounded-2xl">
                <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{response}</p>
                <button 
                  onClick={() => setResponse(null)}
                  className="mt-4 text-xs font-bold text-blue-600 uppercase tracking-widest hover:underline"
                >
                  Ask Another Question
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
                placeholder="Ask your advisor..."
                className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
              />
              <button 
                onClick={handleAsk}
                className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
