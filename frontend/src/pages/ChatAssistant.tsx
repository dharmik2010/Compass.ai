import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { Compass, Plus, Sparkles, MessageSquare, Loader2 } from 'lucide-react';

export const ChatAssistant: React.FC = () => {
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Trip states to support context modifications
  const [trips, setTrips] = useState<any[]>([]);
  const [activeTripId, setActiveTripId] = useState('');

  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchChatsAndTrips = async () => {
    try {
      const chatData = await apiFetch('/api/ai/chats');
      const tripData = await apiFetch('/api/trips');
      
      setTrips(tripData.trips || []);
      if (tripData.trips?.length > 0) {
        setActiveTripId(tripData.trips[0]._id);
      }

      if (chatData.chats?.length > 0) {
        setActiveChatId(chatData.chats[0]._id);
        setMessages(chatData.chats[0].messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchChatsAndTrips();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await apiFetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userMsg,
          chatId: activeChatId,
          activeTripId: activeTripId
        })
      });

      if (res.success) {
        setActiveChatId(res.chatId);
        setMessages(res.messages);
      }
    } catch (err) {
      alert('Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col md:flex-row text-slate-200">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#0B0F19]/90 border-b md:border-b-0 md:border-r border-slate-800/80 flex flex-col justify-between py-6 px-4 md:sticky md:top-0 md:h-screen z-30">
        <div className="space-y-8">
          <div className="flex items-center gap-2 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
              <Compass className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <span className="text-lg font-bold font-poppins text-white">Compass<span className="text-secondary">.ai</span></span>
          </div>

          <nav className="space-y-1.5">
            <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/50 hover:text-white text-slate-400 text-sm font-medium transition-all">
              <Compass className="w-5 h-5" /> Dashboard
            </Link>
            <Link to="/planner" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/50 hover:text-white text-slate-400 text-sm font-medium transition-all">
              <Plus className="w-5 h-5" /> Plan New Trip
            </Link>
            <Link to="/chat" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-secondary text-sm font-semibold transition-all">
              <Sparkles className="w-5 h-5" /> AI Chat Assistant
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Persistent chat window */}
      <main className="flex-1 p-6 md:p-10 flex flex-col justify-between h-screen overflow-hidden">
        
        {/* Top Chat Context selector bar */}
        <header className="border-b border-slate-850 pb-4 mb-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-poppins text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary" /> Compass.ai Persistent Chat
            </h2>
            <p className="text-[10px] text-slate-400 font-light mt-0.5">Understand parameters, updates travel plans, suggests hidden spots.</p>
          </div>

          {/* Active Trip context selector */}
          {trips.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium uppercase">Active context:</span>
              <select 
                value={activeTripId}
                onChange={e => setActiveTripId(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-white font-semibold outline-none focus:border-secondary"
              >
                {trips.map(t => (
                  <option key={t._id} value={t._id}>{t.title} ({t.meta.destination})</option>
                ))}
              </select>
            </div>
          )}
        </header>

        {/* Chat message dialog boxes */}
        <div className="flex-grow space-y-4 overflow-y-auto pr-2 mb-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center space-y-4">
              <MessageSquare className="w-12 h-12 text-slate-500" />
              <h4 className="font-poppins font-semibold text-white">Ask anything to customize your trip</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mt-4 text-xs text-left">
                <button 
                  onClick={() => setInput('Suggest hidden places in Tokyo')}
                  className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 text-slate-300 font-light text-left transition-all"
                >
                  💡 "Suggest hidden places in Tokyo"
                </button>
                <button 
                  onClick={() => setInput('Reduce my budget by 20%')}
                  className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 text-slate-300 font-light text-left transition-all"
                >
                  📉 "Reduce my budget by 20%"
                </button>
                <button 
                  onClick={() => setInput('Add adventure activities to my trip')}
                  className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 text-slate-300 font-light text-left transition-all"
                >
                  🚁 "Add adventure activities to my trip"
                </button>
                <button 
                  onClick={() => setInput('How to avoid tourist crowd and scams?')}
                  className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:border-slate-700 text-slate-300 font-light text-left transition-all"
                >
                  🛡️ "How to avoid tourist crowd and scams?"
                </button>
              </div>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-2xl max-w-[80%] text-xs font-light leading-relaxed border ${m.role === 'user' ? 'bg-primary/20 border-primary/30 text-white rounded-tr-none' : 'bg-slate-900/80 border-slate-800/50 text-slate-300 rounded-tl-none'}`}>
                  {m.content}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="p-3.5 bg-slate-900/60 border border-slate-800/50 rounded-2xl rounded-tl-none flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-secondary animate-spin" />
                <span className="text-[10px] text-slate-400">Assistant is computing mutations...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input box form */}
        <form onSubmit={handleSendMessage} className="mt-auto border-t border-slate-850 pt-4 flex gap-3 shrink-0">
          <input 
            type="text"
            placeholder="Type your customization message... (e.g. Reduce my budget)"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 px-5 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-secondary transition-all"
          />
          <button 
            type="submit"
            className="px-6 bg-secondary text-dark hover:bg-cyan-500 font-bold rounded-2xl transition-all text-xs flex items-center gap-1.5"
          >
            Send
          </button>
        </form>

      </main>
    </div>
  );
};
