import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { 
  Calendar, ClipboardList, Wallet, Sun, Compass, Sparkles, Plus, 
  MapPin, LogOut, Bell, Settings, ShieldCheck, Trash2, User, Loader2, ArrowRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const tripsData = await apiFetch('/api/trips');
      if (tripsData.success) {
        setTrips(tripsData.trips);
      }
      
      const notifs = [
        { id: 'n1', type: 'packing', title: 'Packing milestone!', message: 'Prepare your essentials for the next trip.', isRead: false },
        { id: 'n2', type: 'weather', title: 'Rain Forecast', message: 'Heavy precipitation predicted for Day 1 in Tokyo. Self-healing active.', isRead: false }
      ];
      setNotifications(notifs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const deleteTrip = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this trip plan?')) return;
    try {
      const res = await apiFetch(`/api/trips/${id}`, { method: 'DELETE' });
      if (res.success) {
        setTrips(trips.filter(t => t._id !== id));
      }
    } catch (err) {
      alert('Failed to delete trip.');
    }
  };

  const totalBudgetLimit = trips.reduce((sum, t) => sum + t.meta.budgetLimit, 0) || 3000;
  const totalSpent = trips.reduce((sum, t) => sum + (t.meta.currentSpent || 0), 0) || 850;
  
  const budgetData = [
    { name: 'Spent', value: totalSpent, color: '#2563EB' },
    { name: 'Remaining', value: Math.max(totalBudgetLimit - totalSpent, 0), color: '#06B6D4' }
  ];

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
            <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-secondary text-sm font-semibold transition-all">
              <Compass className="w-5 h-5" /> Dashboard
            </Link>
            <Link to="/planner" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/50 hover:text-white text-slate-400 text-sm font-medium transition-all">
              <Plus className="w-5 h-5" /> Plan New Trip
            </Link>
            <Link to="/chat" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/50 hover:text-white text-slate-400 text-sm font-medium transition-all">
              <Sparkles className="w-5 h-5" /> AI Chat Assistant
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/50 hover:text-white text-slate-400 text-sm font-medium transition-all">
                <Settings className="w-5 h-5" /> Admin Panel
              </Link>
            )}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800/80 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <User className="w-4 h-4 text-slate-300" />
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold text-white truncate">{user?.name || 'Traveler'}</div>
              <div className="text-xs text-slate-500 truncate">{user?.email}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-danger hover:bg-danger/10 text-sm font-medium transition-all"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
        
        {/* Top Navbar details */}
        <header className="flex justify-between items-center pb-4 border-b border-slate-800/50">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold font-poppins text-white">Hello, {user?.name || 'Traveler'}</h2>
            <p className="text-slate-400 text-sm mt-0.5">Welcome to your Compass Command Center.</p>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300 transition-all relative"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full animate-ping" />}
            </button>
            
            {/* Notification Dropdown Panel */}
            <AnimatePresence>
              {showNotifPanel && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-3 w-80 p-4 rounded-2xl glass-panel shadow-glass border border-slate-700/80 z-20"
                >
                  <h4 className="font-poppins font-bold text-white text-sm mb-3">Live Trip Alerts</h4>
                  <div className="space-y-3">
                    {notifications.map(n => (
                      <div key={n.id} className="p-3 bg-slate-800/50 border border-slate-700/30 rounded-xl text-xs space-y-1">
                        <div className="font-semibold text-secondary flex items-center gap-1.5">
                          {n.type === 'weather' ? <Sun className="w-3.5 h-3.5" /> : <ClipboardList className="w-3.5 h-3.5" />}
                          {n.title}
                        </div>
                        <p className="text-slate-300 font-light leading-relaxed">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Global Statistics metrics */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 tilt-card">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Trips</div>
            <div className="text-2xl font-bold font-poppins text-white mt-2">{trips.length}</div>
          </div>
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 tilt-card">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Cities Mapped</div>
            <div className="text-2xl font-bold font-poppins text-white mt-2">{trips.length > 0 ? trips.length : 0}</div>
          </div>
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 tilt-card">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Travel Budget</div>
            <div className="text-2xl font-bold font-poppins text-white mt-2">${totalBudgetLimit}</div>
          </div>
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 tilt-card">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Achievements</div>
            <div className="text-2xl font-bold font-poppins text-secondary mt-2 flex items-center gap-1">
              <ShieldCheck className="w-5 h-5 text-accent" /> {user?.achievements?.length || 0} Badges
            </div>
          </div>
        </section>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-secondary" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Feed: Trips List */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold font-poppins text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-secondary" /> Upcoming Itineraries
                </h3>
                <Link to="/planner" className="px-3.5 py-1.5 bg-primary/20 hover:bg-primary hover:text-white rounded-xl text-xs font-semibold text-secondary flex items-center gap-1.5 transition-all">
                  <Plus className="w-4 h-4" /> Create Trip
                </Link>
              </div>

              {trips.length === 0 ? (
                <div className="p-12 rounded-3xl glass-panel border border-slate-800/80 text-center space-y-4">
                  <Compass className="w-12 h-12 text-slate-500 mx-auto" />
                  <h4 className="text-lg font-poppins font-semibold text-white">No Trips Mapped Yet</h4>
                  <p className="text-slate-400 text-sm max-w-sm mx-auto font-light">Create a personalized itinerary using the multi-step planner wizard or the AI conversation assistant.</p>
                  <Link to="/planner" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-xs glow-btn glow-cyan">
                    Plan My First Trip <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {trips.map(trip => (
                    <div key={trip._id} className="rounded-3xl overflow-hidden glass-panel border border-slate-800 flex flex-col justify-between group tilt-card">
                      <div className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="px-2.5 py-0.5 rounded bg-primary/20 text-[10px] font-bold text-secondary uppercase tracking-wider">Active plan</span>
                            <h4 className="text-lg font-bold font-poppins text-white mt-1.5">{trip.title}</h4>
                          </div>
                          <button 
                            onClick={(e) => deleteTrip(trip._id, e)}
                            className="p-1.5 rounded-lg hover:bg-danger/10 text-slate-500 hover:text-danger transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs font-light text-slate-400 pt-2">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase">Destination</span>
                            <div className="text-slate-200 font-semibold truncate flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-accent" /> {trip.meta.destination}</div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase">Dates</span>
                            <div className="text-slate-200 font-semibold">{new Date(trip.meta.startDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} - {new Date(trip.meta.endDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="px-6 py-3.5 bg-slate-900/40 border-t border-slate-800 flex justify-between items-center text-xs text-slate-450">
                        <div>Limit: <span className="text-slate-200 font-bold font-mono">${trip.meta.budgetLimit}</span></div>
                        <div>Spent: <span className="text-secondary font-bold font-mono">${trip.meta.currentSpent || 0}</span></div>
                      </div>

                      <div className="px-6 pb-6 pt-2">
                        <button 
                          onClick={() => navigate(`/itinerary/${trip._id}`)}
                          className="w-full py-2.5 bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary hover:to-secondary hover:text-white border border-secondary/20 hover:border-secondary text-secondary font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                          View Full Itinerary <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Feed: Analytics & Suggestions */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Pie Chart: Budget Ring */}
              <div className="p-6 rounded-3xl glass-panel border border-slate-800 tilt-card">
                <h3 className="text-base font-bold font-poppins text-white mb-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-secondary" /> Budget Ring Chart
                </h3>
                <div className="h-44 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={budgetData}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {budgetData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center Text */}
                  <div className="absolute text-center">
                    <div className="text-xs text-slate-400">Spent</div>
                    <div className="text-lg font-bold font-poppins text-white">${totalSpent}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Spent (${totalSpent})</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-secondary" /> Limit (${totalBudgetLimit})</div>
                </div>
              </div>

              {/* Weather Forecast Widget Preview */}
              <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4 tilt-card">
                <h3 className="text-base font-bold font-poppins text-white flex items-center gap-2">
                  <Sun className="w-5 h-5 text-secondary" /> Active Weather Snapshot
                </h3>
                <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <div>
                    <div className="text-2xl font-bold text-white font-poppins">18°C</div>
                    <div className="text-xs text-slate-400 mt-0.5">Tokyo - Clear conditions</div>
                  </div>
                  <Sun className="w-10 h-10 text-warning animate-spin-slow" />
                </div>
                <p className="text-xs text-slate-500 font-light italic leading-relaxed">System monitoring coordinates continuously for weather disruptions.</p>
              </div>
              
              {/* Quick AI Suggestion Action card */}
              <div className="p-6 rounded-3xl bg-gradient-cyber border border-secondary/30 relative overflow-hidden">
                <div className="w-20 h-20 bg-secondary/10 rounded-full blur-xl absolute top-0 right-0" />
                <h4 className="text-sm font-bold font-poppins text-white flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-secondary" /> Suggestion: Quick Pack</h4>
                <p className="text-xs text-slate-300 font-light mt-2 leading-relaxed">Going to Tokyo next week? We generated a tailored packing list for moderate rain probability. Check it out!</p>
                <Link to="/planner" className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-secondary hover:underline">Go to Wizard <ArrowRight className="w-3.5 h-3.5" /></Link>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};
