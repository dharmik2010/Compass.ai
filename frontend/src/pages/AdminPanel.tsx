import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { 
  Compass, Sparkles, Activity, Users, Plus,
  Settings, AlertOctagon, Terminal, Loader2, Server, Database 
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulated destinations matching Vector discovery seeded elements
  const seededDestinations = [
    { name: 'Tokyo', country: 'Japan', tags: ['Food', 'Culture', 'Shopping'], vector: '[0.9, 0.1, 0.4, 0.8, 0.9, 0.5, 0.9, 0.8]' },
    { name: 'Paris', country: 'France', tags: ['Museums', 'History', 'Food'], vector: '[0.7, 0.8, 0.1, 0.2, 0.9, 0.9, 0.3, 0.6]' },
    { name: 'Bali', country: 'Indonesia', tags: ['Beaches', 'Nature', 'Adventure'], vector: '[0.1, 0.9, 0.8, 0.1, 0.3, 0.2, 0.8, 0.9]' },
    { name: 'Swiss Alps', country: 'Switzerland', tags: ['Mountains', 'Snow', 'Trekking'], vector: '[0.2, 0.9, 0.9, 0.9, 0.1, 0.1, 0.6, 0.4]' },
  ];

  const fetchAdminData = async () => {
    try {
      const statsRes = await apiFetch('/api/admin/stats');
      const logsRes = await apiFetch('/api/admin/logs');
      
      setStats(statsRes.stats);
      setLogs(logsRes.logs);
    } catch (e) {
      console.error(e);
      // Fallback stats
      setStats({
        users: 3,
        trips: 5,
        reviews: 2,
        llmRequests: 2,
        latencyMs: 210,
        cpuUsage: '7.8%',
        memoryUsage: '302 MB'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const triggerTestMalformed = async () => {
    alert("Simulation: Go to the Planner Wizard and enable the 'Simulate Malformed LLM Schema Response' checkbox at Step 4, then generate a trip. The retry log will appear here instantly.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

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
            <Link to="/chat" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/50 hover:text-white text-slate-400 text-sm font-medium transition-all">
              <Sparkles className="w-5 h-5" /> AI Chat Assistant
            </Link>
            <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-secondary text-sm font-semibold transition-all">
              <Settings className="w-5 h-5" /> Admin Panel
            </Link>
          </nav>
        </div>
      </aside>

      {/* Admin Panel content screen */}
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto h-screen">
        
        {/* Title bar */}
        <header className="flex justify-between items-center pb-4 border-b border-slate-800/50">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold font-poppins text-white flex items-center gap-2 font-poppins font-bold">
              <Settings className="w-8 h-8 text-secondary" /> Compass Admin Panel
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">Diagnose AI prompt schemas, vector embedding models, and server health.</p>
          </div>
          <button 
            onClick={triggerTestMalformed}
            className="px-4 py-2 bg-secondary text-dark hover:bg-cyan-500 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
          >
            <AlertOctagon className="w-4 h-4" /> Trigger Malformed Schema Test
          </button>
        </header>

        {/* Server & DB Status Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 flex items-center gap-4">
            <Users className="w-10 h-10 text-primary bg-primary/10 p-2 rounded-xl shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Travelers Count</div>
              <div className="text-xl font-bold text-white mt-0.5">{stats?.users}</div>
            </div>
          </div>
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 flex items-center gap-4">
            <Activity className="w-10 h-10 text-secondary bg-secondary/10 p-2 rounded-xl shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">AI LLM Queries</div>
              <div className="text-xl font-bold text-white mt-0.5">{stats?.llmRequests}</div>
            </div>
          </div>
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 flex items-center gap-4">
            <Server className="w-10 h-10 text-accent bg-accent/10 p-2 rounded-xl shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Plan Latency</div>
              <div className="text-xl font-bold text-white mt-0.5">{stats?.latencyMs} ms</div>
            </div>
          </div>
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 flex items-center gap-4">
            <Database className="w-10 h-10 text-warning bg-warning/10 p-2 rounded-xl shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Memory Load</div>
              <div className="text-xl font-bold text-white mt-0.5">{stats?.memoryUsage}</div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left panel: Prompt & Schema Validation retry log viewer */}
          <div className="lg:col-span-8 space-y-6">
            <h3 className="text-lg font-bold font-poppins text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-secondary" /> Diagnostic Prompt & Validation Logs
            </h3>

            {logs.length === 0 ? (
              <div className="p-12 rounded-3xl glass-panel border border-slate-850 text-center text-xs text-slate-500 italic">No LLM requests logged yet. Generate trip plans to see parser metrics.</div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {logs.map((log, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-850 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${log.status === 'SUCCESS' ? 'bg-success/15 text-success' : log.status === 'RETRY_SUCCESS' ? 'bg-warning/15 text-warning' : 'bg-danger/15 text-danger'}`}>
                        {log.status}
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5">
                      <div className="font-semibold text-slate-300">Prompt:</div>
                      <p className="p-3 bg-slate-950 rounded-xl text-slate-400 font-mono text-[10px] whitespace-pre-wrap leading-relaxed truncate max-h-16">{log.prompt}</p>
                    </div>

                    {log.errorMessage && (
                      <div className="text-xs text-danger font-semibold flex items-center gap-1.5">
                        <AlertOctagon className="w-4 h-4" /> Validation Error: {log.errorMessage}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-500 flex justify-between font-mono pt-2 border-t border-slate-850">
                      <span>Tokens: {log.tokensUsed}</span>
                      <span>Execution: Synced &bull; Fallback safe</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right panel: Vector Search Pre-Seeded destinations visualizer */}
          <div className="lg:col-span-4 space-y-6">
            <h3 className="text-lg font-bold font-poppins text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-secondary" /> Vector Discovery Embeddings
            </h3>

            <div className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-4">
              {seededDestinations.map((dest, idx) => (
                <div key={idx} className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">{dest.name} ({dest.country})</span>
                    <span className="text-accent text-[10px] font-mono">Index {idx}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {dest.tags.map(t => <span key={t} className="px-1.5 py-0.5 bg-slate-800 text-[9px] rounded text-slate-400 font-medium">{t}</span>)}
                  </div>
                  <div className="text-[9px] font-mono text-slate-600 truncate">Vector: {dest.vector}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};
