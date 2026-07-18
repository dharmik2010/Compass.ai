import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { LeafletMap } from '../components/LeafletMap';
import { 
  Sun, ShieldAlert, 
  ArrowUp, ArrowDown, ChevronRight, CheckCircle2, Trash2, Plus, 
  Download, Award, CloudRain, HelpCircle, Loader2, Landmark, Compass 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export const ItineraryView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { socket, joinTripRoom } = useSocket();

  const [trip, setTrip] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'accommodation' | 'budget' | 'packing' | 'guide'>('timeline');
  const [selectedDay, setSelectedDay] = useState(1);
  const [weatherAlertText, setWeatherAlertText] = useState('');
  
  // Currency conversion state
  const [curr, setCurr] = useState('USD');
  const rates: { [key: string]: number } = { USD: 1, EUR: 0.92, INR: 83.5, JPY: 155, GBP: 0.78 };
  const symbolMap: { [key: string]: string } = { USD: '$', EUR: '€', INR: '₹', JPY: '¥', GBP: '£' };

  const formatCost = (usdAmount: number) => {
    const converted = usdAmount * (rates[curr] || 1);
    return `${symbolMap[curr] || '$'}${Math.round(converted).toLocaleString()}`;
  };

  // Recommendations state
  const [hotels, setHotels] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [guideInfo, setGuideInfo] = useState<any | null>(null);

  // Expense input state
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Food');
  const [expDesc, setExpDesc] = useState('');

  // Packing input state
  const [packItem, setPackItem] = useState('');
  const [packCategory, setPackCategory] = useState('Essentials');

  const fetchTripDetails = async () => {
    try {
      const data = await apiFetch(`/api/trips/${id}`);
      if (data.success) {
        setTrip(data.trip);
        joinTripRoom(data.trip._id);
        fetchLocalRecommendations(data.trip.meta.destination, data.trip.logistics.accommodation.tier);
      }
    } catch (err) {
      console.error(err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocalRecommendations = async (dest: string, tier: string) => {
    try {
      const hot = await apiFetch(`/api/recommendations/hotels?destination=${dest}&tier=${tier}`);
      const res = await apiFetch(`/api/recommendations/restaurants?destination=${dest}`);
      const gui = await apiFetch(`/api/recommendations/guide?destination=${dest}`);
      
      setHotels(hot.hotels || []);
      setRestaurants(res.restaurants || []);
      setGuideInfo(gui.guide || null);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  // WebSocket Live Listeners for self-healing notifications
  useEffect(() => {
    if (!socket) return;

    const handleTripUpdate = (updatedTrip: any) => {
      console.log('📡 [SOCKET SYNC] Trip state mutated on server:', updatedTrip);
      setTrip(updatedTrip);
    };

    const handleWeatherAlert = (data: any) => {
      console.log('🌧️ [SOCKET SYNC] Weather alert triggered:', data.message);
      setWeatherAlertText(data.message);
      setTimeout(() => setWeatherAlertText(''), 6000);
    };

    const handleBudgetAlert = (data: any) => {
      alert(`⚠️ Budget Warning: ${data.message}`);
    };

    socket.on('trip-updated', handleTripUpdate);
    socket.on('weather-disruption', handleWeatherAlert);
    socket.on('budget-alert', handleBudgetAlert);

    return () => {
      socket.off('trip-updated', handleTripUpdate);
      socket.off('weather-disruption', handleWeatherAlert);
      socket.off('budget-alert', handleBudgetAlert);
    };
  }, [socket]);

  // Click-Reordering timeline slots
  const shiftActivity = async (dayIndex: number, actIndex: number, direction: 'up' | 'down') => {
    if (!trip) return;
    const newItinerary = JSON.parse(JSON.stringify(trip.itinerary));
    const day = newItinerary[dayIndex];
    const targetIdx = direction === 'up' ? actIndex - 1 : actIndex + 1;

    if (targetIdx < 0 || targetIdx >= day.schedule.length) return;

    const temp = day.schedule[actIndex];
    day.schedule[actIndex] = day.schedule[targetIdx];
    day.schedule[targetIdx] = temp;

    try {
      setTrip({ ...trip, itinerary: newItinerary }); // optimistic update
      await apiFetch(`/api/trips/${trip._id}`, {
        method: 'PUT',
        body: JSON.stringify({ itinerary: newItinerary })
      });
    } catch (err) {
      alert('Failed to reorder activity slots.');
      fetchTripDetails();
    }
  };

  const swapHotel = async (hotel: any) => {
    if (!trip) return;
    try {
      const updatedAccommodation = {
        name: hotel.name,
        coords: hotel.coordinates || trip.logistics.accommodation.coords,
        tier: hotel.tier || 'Standard',
        price: hotel.price || 120
      };

      // Optimistic update
      setTrip({
        ...trip,
        logistics: {
          ...trip.logistics,
          accommodation: updatedAccommodation
        }
      });

      const res = await apiFetch(`/api/trips/${trip._id}/accommodation`, {
        method: 'PUT',
        body: JSON.stringify({ accommodation: updatedAccommodation })
      });

      if (res.success) {
        setTrip(res.trip);
      }
    } catch (err) {
      alert('Failed to swap accommodation.');
      fetchTripDetails();
    }
  };

  const triggerWeatherAlert = async () => {
    if (!trip) return;
    try {
      await apiFetch(`/api/trips/${trip._id}/weather-alert`, { method: 'POST' });
    } catch (e: any) {
      alert('Failed to trigger simulation: ' + e.message);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || isNaN(parseFloat(expAmount))) return;

    try {
      const data = await apiFetch(`/api/trips/${trip._id}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          amount: expAmount,
          category: expCategory,
          description: expDesc
        })
      });
      if (data.success) {
        setTrip(data.trip);
        setExpAmount('');
        setExpDesc('');
      }
    } catch (err) {
      alert('Failed to log expense.');
    }
  };

  const handleDeleteExpense = async (expId: string) => {
    try {
      const data = await apiFetch(`/api/trips/${trip._id}/expenses/${expId}`, {
        method: 'DELETE'
      });
      if (data.success) {
        setTrip(data.trip);
      }
    } catch (err) {
      alert('Failed to delete expense.');
    }
  };

  const handleAddPackItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packItem.trim()) return;

    try {
      const data = await apiFetch(`/api/trips/${trip._id}/packing`, {
        method: 'POST',
        body: JSON.stringify({ item: packItem, category: packCategory })
      });
      if (data.success) {
        setTrip(data.trip);
        setPackItem('');
      }
    } catch (err) {
      alert('Failed to add checklist item.');
    }
  };

  const handleTogglePackItem = async (itemId: string) => {
    try {
      const data = await apiFetch(`/api/trips/${trip._id}/packing/${itemId}`, {
        method: 'PUT'
      });
      if (data.success) {
        setTrip(data.trip);
      }
    } catch (err) {
      alert('Failed to toggle item.');
    }
  };

  const handleDeletePackItem = async (itemId: string) => {
    try {
      const data = await apiFetch(`/api/trips/${trip._id}/packing/${itemId}`, {
        method: 'DELETE'
      });
      if (data.success) {
        setTrip(data.trip);
      }
    } catch (err) {
      alert('Failed to delete packing item.');
    }
  };

  const triggerPdfPrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-secondary mx-auto" />
          <p className="text-slate-400 text-sm font-light">Loading itinerary state...</p>
        </div>
      </div>
    );
  }

  const currentDayData = trip.itinerary.find((d: any) => d.day === selectedDay) || trip.itinerary[0];

  const expenseData = trip.expenses.reduce((acc: any[], exp: any) => {
    const existing = acc.find(item => item.name === exp.category);
    if (existing) {
      existing.cost += exp.amount;
    } else {
      acc.push({ name: exp.category, cost: exp.amount });
    }
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-dark text-slate-200">
      
      {/* Print PDF Custom Styles Overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-day-block {
            page-break-inside: avoid;
            margin-bottom: 24px;
          }
        }
      `}} />

      {/* Real-time Weather Disruption Notification Overlay */}
      <AnimatePresence>
        {weatherAlertText && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 16 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 no-print"
          >
            <div className="p-4 rounded-2xl bg-danger/90 border border-red-500/20 text-white backdrop-blur flex items-start gap-3 shadow-2xl">
              <CloudRain className="w-6 h-6 animate-bounce shrink-0 mt-0.5" />
              <div>
                <h5 className="font-poppins font-bold text-sm">Self-Healing Weather Mutation Active!</h5>
                <p className="text-xs font-light mt-1 leading-relaxed">{weatherAlertText}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen Only Layout */}
      <div className="no-print">
        
        {/* Top Navbar details */}
        <header className="glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-xs text-slate-400 hover:text-white transition-all font-semibold flex items-center gap-1"><Compass className="w-3.5 h-3.5 animate-spin-slow" /> Dashboard</Link>
            <div className="h-4 w-px bg-slate-800" />
            <h2 className="text-base font-bold font-poppins text-white truncate max-w-xs">{trip.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            
            {/* Currency Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800/80 rounded-xl px-3 py-1.5 shrink-0">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Currency</span>
              <select 
                value={curr}
                onChange={e => setCurr(e.target.value)}
                className="bg-transparent border-0 text-white text-xs font-bold font-mono outline-none focus:ring-0 cursor-pointer pr-4"
              >
                <option value="USD" className="bg-dark">USD ($)</option>
                <option value="EUR" className="bg-dark">EUR (€)</option>
                <option value="INR" className="bg-dark">INR (₹)</option>
                <option value="JPY" className="bg-dark">JPY (¥)</option>
                <option value="GBP" className="bg-dark">GBP (£)</option>
              </select>
            </div>

            <button 
              onClick={triggerPdfPrint}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-200 border border-slate-700/60 transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Export PDF
            </button>
            <button 
              onClick={triggerWeatherAlert}
              className="px-3.5 py-2 bg-danger/20 hover:bg-danger text-danger border border-danger/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <CloudRain className="w-4 h-4" /> Simulate Rain Alert
            </button>
          </div>
        </header>

        {/* Secondary Tab Control Header */}
        <div className="px-6 md:px-12 py-3 bg-[#0B0F19]/90 border-b border-slate-800/80 flex gap-4 text-xs font-medium text-slate-400 overflow-x-auto">
          <button onClick={() => setActiveTab('timeline')} className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${activeTab === 'timeline' ? 'bg-primary/20 text-secondary font-bold' : 'hover:text-white'}`}>Timeline & Maps</button>
          <button onClick={() => setActiveTab('accommodation')} className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${activeTab === 'accommodation' ? 'bg-primary/20 text-secondary font-bold' : 'hover:text-white'}`}>Accommodation</button>
          <button onClick={() => setActiveTab('budget')} className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${activeTab === 'budget' ? 'bg-primary/20 text-secondary font-bold' : 'hover:text-white'}`}>Budget Tracker</button>
          <button onClick={() => setActiveTab('packing')} className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${activeTab === 'packing' ? 'bg-primary/20 text-secondary font-bold' : 'hover:text-white'}`}>Packing checklist</button>
          <button onClick={() => setActiveTab('guide')} className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${activeTab === 'guide' ? 'bg-primary/20 text-secondary font-bold' : 'hover:text-white'}`}>Local Guide</button>
        </div>

        <div className="max-w-7xl mx-auto p-6 md:p-10">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: TIMELINE & MAP PANEL */}
            {activeTab === 'timeline' && (
              <motion.div 
                key="timeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Day selector sidebar + Activities Timeline */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Day selector bubbles */}
                  <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1 pb-2 border-r border-slate-800/40">
                    {trip.itinerary.map((day: any) => {
                      const dayBudget = day.schedule.reduce((sum: number, act: any) => sum + act.cost, 0);
                      const active = selectedDay === day.day;
                      return (
                        <button 
                          key={day.day}
                          onClick={() => setSelectedDay(day.day)}
                          className={`w-full p-3.5 rounded-xl border flex justify-between items-center text-left transition-all ${active ? 'bg-secondary border-secondary text-dark font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                        >
                          <span className="text-xs">Day {day.day} &bull; {trip.meta.destination}</span>
                          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${active ? 'bg-dark/20 text-dark' : 'bg-slate-800 text-secondary'}`}>
                            Budget: {formatCost(dayBudget)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Day snapshot header */}
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                    <div>
                      <h3 className="font-poppins font-bold text-white text-base">Day {selectedDay} Itinerary</h3>
                      <p className="text-xs text-slate-400 font-light mt-0.5">Estimated Date: {new Date(currentDayData.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-800/80">
                      <Sun className="w-4 h-4 text-warning" />
                      <span className="text-xs font-semibold text-slate-300 capitalize">{currentDayData.weatherSnapshot.condition} &bull; {currentDayData.weatherSnapshot.temp}°C</span>
                    </div>
                  </div>

                  {/* Chronological Activities list */}
                  <div className="relative border-l border-slate-850 ml-4 pl-6 space-y-6">
                    {currentDayData.schedule.map((act: any, idx: number) => (
                      <div key={idx} className="relative">
                        {/* Timeline dot */}
                        <span className="absolute -left-[35px] top-1.5 w-[18px] h-[18px] rounded-full bg-secondary border-2 border-dark flex items-center justify-center text-[10px] text-dark font-bold shadow-md shadow-secondary/20">{idx + 1}</span>

                        {/* Timeline Activity card */}
                        <div className={`p-5 rounded-2xl border tilt-card transition-all ${act.isIndoorFallback ? 'bg-[#ff5555]/5 border-[#ff5555]/20' : 'bg-slate-900/60 border-slate-800/85 hover:border-slate-700'}`}>
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{act.timeSlot} &bull; {act.category}</span>
                              
                              <h4 className="font-poppins font-bold text-white text-sm mt-1 flex items-center gap-1.5">
                                {act.activityName}
                                {act.isIndoorFallback && <span className="px-2 py-0.5 rounded-full bg-danger/15 text-[8px] font-bold text-danger">Indoor Option Active</span>}
                              </h4>
                              
                              <p className="text-xs text-slate-400 font-light mt-1 leading-relaxed">{act.description}</p>
                            </div>
                            
                            {/* Reordering Controls */}
                            <div className="flex flex-col gap-1">
                              <button 
                                onClick={() => shiftActivity(selectedDay - 1, idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 hover:bg-slate-800 text-slate-500 hover:text-white rounded disabled:opacity-30"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => shiftActivity(selectedDay - 1, idx, 'down')}
                                disabled={idx === currentDayData.schedule.length - 1}
                                className="p-1 hover:bg-slate-800 text-slate-500 hover:text-white rounded disabled:opacity-30"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between text-[10px] font-medium text-slate-400">
                            <span>Duration: <strong className="text-slate-300 font-mono">{act.durationMinutes} mins</strong></span>
                            <span>Est. Cost: <strong className="text-secondary font-mono">{formatCost(act.cost)}</strong></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Right Column: Leaflet Map */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="p-4 rounded-3xl glass-panel border border-slate-800 overflow-hidden shadow-2xl h-[450px] tilt-card">
                    <LeafletMap 
                      hotelCoords={trip.logistics.accommodation.coords}
                      hotelName={trip.logistics.accommodation.name}
                      activities={currentDayData.schedule}
                    />
                  </div>
                  
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-850 space-y-1 tilt-card">
                    <div className="text-xs text-slate-500 font-semibold uppercase">Accommodation Lodging</div>
                    <div className="text-white text-sm font-bold">{trip.logistics.accommodation.name}</div>
                    <div className="text-[10px] text-slate-400">Price: {formatCost(trip.logistics.accommodation.price || 120)} / night &bull; Tier: {trip.logistics.accommodation.tier || 'Standard'}</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: ACCOMMODATION PANEL */}
            {activeTab === 'accommodation' && (
              <motion.div 
                key="accommodation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Left Column: Active lodging details */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
                    <span className="px-2.5 py-0.5 rounded bg-primary/20 text-[10px] font-bold text-secondary uppercase tracking-wider">Active Lodging</span>
                    <h3 className="font-poppins font-extrabold text-white text-xl mt-1">{trip.logistics.accommodation.name}</h3>
                    <div className="text-xs font-light text-slate-400 space-y-2.5">
                      <div className="flex justify-between"><span>Lodging price per night:</span> <span className="text-white font-bold">{formatCost(trip.logistics.accommodation.price || 120)}</span></div>
                      <div className="flex justify-between"><span>Standard tier classification:</span> <span className="text-secondary font-semibold">{trip.logistics.accommodation.tier || 'Standard'}</span></div>
                      <div className="flex justify-between"><span>Coordinates:</span> <span className="text-slate-300 font-mono text-[10px]">{trip.logistics.accommodation.coords.lat.toFixed(4)}, {trip.logistics.accommodation.coords.lng.toFixed(4)}</span></div>
                    </div>
                    
                    {/* Visual card */}
                    <div className="h-48 rounded-2xl overflow-hidden relative border border-slate-800/80">
                      <img 
                        src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop" 
                        alt="Hotel room view" 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark/95 via-transparent to-transparent flex items-end p-4">
                        <div className="text-xs font-light text-slate-300">Daily routing maps sync parameters based on active coordinates.</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Alternative hotel recommendations */}
                <div className="lg:col-span-6 space-y-6">
                  <h4 className="font-poppins font-bold text-white text-base">Alternative Lodging Picks</h4>
                  
                  {hotels.length === 0 ? (
                    <div className="text-xs text-slate-500 italic">No alternative hotel recommendations loaded.</div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {hotels.map((h: any, idx: number) => {
                        const isCurrent = h.name.toLowerCase() === trip.logistics.accommodation.name.toLowerCase();
                        return (
                          <div key={idx} className={`p-4 rounded-2xl glass-panel border flex items-center justify-between gap-4 transition-all ${isCurrent ? 'border-secondary/40 bg-secondary/5' : 'border-slate-850 hover:border-slate-800'}`}>
                            <div className="flex items-center gap-4 text-xs font-light">
                              <img src={h.imageUrl || "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=150&auto=format&fit=crop"} alt={h.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                              <div>
                                <h5 className="font-bold text-white leading-tight">{h.name}</h5>
                                <div className="text-[10px] text-slate-400 mt-1">{h.distance} &bull; Rating: {h.rating}</div>
                                <span className="text-secondary font-bold font-mono mt-1 block">{formatCost(h.price || 120)} / night</span>
                              </div>
                            </div>

                            <div>
                              {isCurrent ? (
                                <span className="px-2.5 py-1 bg-secondary/15 rounded-lg text-[9px] font-bold text-secondary uppercase">Active</span>
                              ) : (
                                <button 
                                  onClick={() => swapHotel(h)}
                                  className="px-3.5 py-1.5 bg-primary/20 hover:bg-primary text-secondary hover:text-white rounded-xl text-[10px] font-bold transition-all"
                                >
                                  Swap Hotel
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 2: BUDGET & EXPENSES PANEL */}
            {activeTab === 'budget' && (
              <motion.div 
                key="budget"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Recharts graph panel */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="p-6 rounded-3xl glass-panel border border-slate-800">
                    <h3 className="text-base font-bold font-poppins text-white mb-4">Expenses Breakdown Chart</h3>
                    
                    {expenseData.length === 0 ? (
                      <div className="h-64 flex items-center justify-center text-xs text-slate-500 italic">No logged expenses to graph yet. Add expenses below to view metric charts.</div>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={expenseData}>
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} />
                            <Tooltip formatter={(value) => [`${formatCost(Number(value))}`, 'Cost']} />
                            <Bar dataKey="cost" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Expense CRUD Form */}
                  <div className="p-6 rounded-3xl glass-panel border border-slate-800">
                    <h3 className="text-base font-bold font-poppins text-white mb-4">Log New Expense</h3>
                    <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 uppercase font-semibold mb-2">Cost (USD)</label>
                        <input 
                          type="text"
                          required
                          placeholder="50"
                          value={expAmount}
                          onChange={e => setExpAmount(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-secondary transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 uppercase font-semibold mb-2">Category</label>
                        <select 
                          value={expCategory}
                          onChange={e => setExpCategory(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-secondary transition-all"
                        >
                          <option value="Food">Food</option>
                          <option value="Hotel">Hotel</option>
                          <option value="Shopping">Shopping</option>
                          <option value="Transport">Transport</option>
                          <option value="Medical">Medical</option>
                          <option value="Miscellaneous">Miscellaneous</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 uppercase font-semibold mb-2">Description</label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="e.g. Lunch noodles"
                            value={expDesc}
                            onChange={e => setExpDesc(e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-secondary transition-all"
                          />
                          <button type="submit" className="px-4 bg-secondary text-dark hover:bg-cyan-500 rounded-xl transition-all font-bold text-xs"><Plus className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Right Column: Ledger details */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <span className="text-sm text-slate-400">Total Spent</span>
                      <span className={`font-poppins font-bold text-lg ${trip.meta.currentSpent > trip.meta.budgetLimit ? 'text-danger' : 'text-white'}`}>{formatCost(trip.meta.currentSpent || 0)} / {formatCost(trip.meta.budgetLimit)}</span>
                    </div>

                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {trip.expenses.length === 0 ? (
                        <div className="text-xs text-slate-500 italic text-center py-6">No expenses logged. Use the logger forms to balance the ledger.</div>
                      ) : (
                        trip.expenses.map((exp: any) => (
                          <div key={exp.id} className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl flex justify-between items-center text-xs">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase font-bold">{exp.category}</span>
                              <h5 className="font-semibold text-white mt-0.5">{exp.description || 'Expense Item'}</h5>
                              <span className="text-[9px] text-slate-400 font-light">{new Date(exp.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-secondary font-mono">{formatCost(exp.amount)}</span>
                              <button 
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="p-1 rounded text-slate-500 hover:text-danger hover:bg-danger/10 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: PACKING CHECKLIST PANEL */}
            {activeTab === 'packing' && (
              <motion.div 
                key="packing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-3xl mx-auto space-y-6"
              >
                <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-4">
                    <div>
                      <h3 className="text-base font-bold font-poppins text-white">Smart Packing Assistant</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Checked items automatically sync to database ledger.</p>
                    </div>
                    <span className="text-xs font-bold font-mono text-secondary">
                      {trip.packingList.filter((p: any) => p.packed).length} / {trip.packingList.length} Packed
                    </span>
                  </div>

                  {/* Add Packing Item */}
                  <form onSubmit={handleAddPackItem} className="flex gap-3">
                    <input 
                      type="text"
                      required
                      placeholder="Add custom packing item... (e.g. Hiking Socks)"
                      value={packItem}
                      onChange={e => setPackItem(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-secondary transition-all"
                    />
                    <select 
                      value={packCategory}
                      onChange={e => setPackCategory(e.target.value)}
                      className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-secondary transition-all"
                    >
                      <option value="Essentials">Essentials</option>
                      <option value="Clothes">Clothes</option>
                      <option value="Shoes">Shoes</option>
                      <option value="Medical">Medical</option>
                      <option value="Tech">Tech</option>
                    </select>
                    <button type="submit" className="px-5 bg-secondary text-dark hover:bg-cyan-500 font-bold rounded-xl transition-all text-xs flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
                  </form>

                  {/* Packing List Grid */}
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {trip.packingList.length === 0 ? (
                      <div className="text-xs text-slate-500 italic text-center py-6">Checklist is empty.</div>
                    ) : (
                      trip.packingList.map((p: any) => (
                        <div 
                          key={p.id}
                          onClick={() => handleTogglePackItem(p.id)}
                          className={`p-3.5 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${p.packed ? 'bg-slate-900/40 border-slate-800 text-slate-500' : 'bg-slate-900/60 border-slate-800 text-slate-200 hover:border-slate-700'}`}
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className={`w-5 h-5 shrink-0 transition-all ${p.packed ? 'text-success' : 'text-slate-600'}`} />
                            <span className={`text-xs ${p.packed ? 'line-through' : ''}`}>{p.item}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 bg-slate-800 rounded text-[9px] text-slate-400 font-medium uppercase">{p.category}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePackItem(p.id);
                              }}
                              className="p-1 rounded text-slate-600 hover:text-danger hover:bg-danger/10 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 4: LOCAL GUIDE & RECOMMENDATIONS */}
            {activeTab === 'guide' && (
              <motion.div 
                key="guide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Emergency Contacts & Scam Alerts */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Guide panel */}
                  {guideInfo && (
                    <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-6">
                      <div>
                        <h4 className="font-poppins font-bold text-white text-base flex items-center gap-2"><Award className="w-5 h-5 text-secondary" /> Cultural Etiquette</h4>
                        <p className="text-xs text-slate-400 font-light leading-relaxed mt-2">{guideInfo.culture}</p>
                      </div>

                      <div>
                        <h4 className="font-poppins font-bold text-white text-sm flex items-center gap-2"><HelpCircle className="w-4 h-4 text-accent" /> Essential Phrasebook</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          {guideInfo.phrases.map((p: any, idx: number) => (
                            <div key={idx} className="p-3 bg-slate-900 border border-slate-850 rounded-xl">
                              <div className="text-xs font-semibold text-secondary font-mono">{p.foreign}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">&bull; {p.english}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-poppins font-bold text-danger text-sm flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Safety & Scam Warnings</h4>
                        <p className="text-xs text-slate-400 font-light leading-relaxed mt-2">{guideInfo.scamAlerts}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-850 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold">Police Call</span>
                          <div className="text-slate-200 font-semibold mt-0.5">{guideInfo.emergencies.police}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold">Hospital Emergency</span>
                          <div className="text-slate-200 font-semibold mt-0.5">{guideInfo.emergencies.hospital}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Hotel & dining picks */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Currency converter simulation */}
                  <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
                    <h4 className="font-poppins font-bold text-white text-sm flex items-center gap-2"><Landmark className="w-4 h-4 text-secondary" /> Currency Converter</h4>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 flex justify-between items-center text-xs font-mono text-slate-300">
                      <span>1 USD (USD)</span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                      <span>{rates[curr]} {curr} ({symbolMap[curr]})</span>
                    </div>
                  </div>

                  {/* Hotel recommendations */}
                  <div className="space-y-4">
                    <h4 className="font-poppins font-bold text-white text-sm">Recommended Lodging</h4>
                    {hotels.map((h, idx) => (
                      <div key={idx} className="rounded-2xl overflow-hidden glass-panel border border-slate-850 flex items-center gap-4 p-3 text-xs">
                        <img src={h.imageUrl} alt={h.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                        <div>
                          <h5 className="font-bold text-white leading-tight">{h.name}</h5>
                          <div className="text-[10px] text-slate-400 mt-1">{h.distance} &bull; Rating: {h.rating}</div>
                          <span className="text-secondary font-bold font-mono mt-1 block">{formatCost(h.price)} / night</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Restaurant recommendations */}
                  <div className="space-y-4">
                    <h4 className="font-poppins font-bold text-white text-sm">Dining Delicacies</h4>
                    {restaurants.map((r, idx) => (
                      <div key={idx} className="rounded-2xl overflow-hidden glass-panel border border-slate-850 flex items-center gap-4 p-3 text-xs">
                        <img src={r.imageUrl} alt={r.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                        <div>
                          <h5 className="font-bold text-white leading-tight">{r.name}</h5>
                          <div className="text-[10px] text-slate-400 mt-1">{r.cuisine} &bull; {r.distance}</div>
                          <span className="text-accent font-semibold mt-1 block">Price: {r.priceLevel}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

      {/* Print Only High-Contrast PDF Container (Hides in browser screen via print:hidden) */}
      <div className="hidden print-only text-black p-8 font-sans space-y-6 bg-white w-full">
        <div className="border-b-2 border-slate-900 pb-4">
          <h1 className="text-3xl font-extrabold font-poppins">{trip.title}</h1>
          <p className="text-sm text-slate-600 mt-1">Destination: {trip.meta.destination} &bull; Dates: {new Date(trip.meta.startDate).toLocaleDateString()} - {new Date(trip.meta.endDate).toLocaleDateString()}</p>
          <p className="text-sm font-semibold mt-1">Total Budget Limit: {formatCost(trip.meta.budgetLimit)} | Logged Expenses Spent: {formatCost(trip.meta.currentSpent || 0)}</p>
        </div>

        {/* Day-by-Day Chronology */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold border-b border-slate-400 pb-2 uppercase tracking-wide">Itinerary Schedule Timeline</h2>
          {trip.itinerary.map((day: any) => (
            <div key={day.day} className="space-y-3 print-day-block">
              <h3 className="text-base font-bold text-slate-800">Day {day.day} • {trip.meta.destination} - {new Date(day.date).toLocaleDateString()}</h3>
              <div className="space-y-2 pl-4 border-l border-slate-300">
                {day.schedule.map((act: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-100 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{idx + 1}. {act.timeSlot} - {act.activityName}</span>
                      <span>{formatCost(act.cost)}</span>
                    </div>
                    <p className="text-slate-600 font-light">{act.description}</p>
                    <div className="text-[10px] text-slate-500 font-medium">Duration: {act.durationMinutes} mins | Category: {act.category} {act.isIndoorFallback && '(Indoor Option Active)'}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Lodging accommodation details */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold border-b border-slate-400 pb-2 uppercase tracking-wide">Accommodation Details</h2>
          <div className="text-xs space-y-1 pl-4">
            <div><strong>Active Hotel:</strong> {trip.logistics.accommodation.name}</div>
            <div><strong>Price per night:</strong> {formatCost(trip.logistics.accommodation.price || 120)}</div>
            <div><strong>Coordinates:</strong> {trip.logistics.accommodation.coords.lat}, {trip.logistics.accommodation.coords.lng}</div>
          </div>
        </div>

        {/* Expense logs ledger */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold border-b border-slate-400 pb-2 uppercase tracking-wide">Expenses Ledger</h2>
          <div className="space-y-1.5 pl-4">
            {trip.expenses.length === 0 ? (
              <div className="text-xs text-slate-500 italic">No expenses logged.</div>
            ) : (
              trip.expenses.map((exp: any, idx: number) => (
                <div key={idx} className="flex justify-between text-xs border-b border-dashed border-slate-300 pb-1">
                  <span>{new Date(exp.date).toLocaleDateString()} - {exp.description || 'Expense'} ({exp.category})</span>
                  <span className="font-bold">{formatCost(exp.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Packing checklist */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold border-b border-slate-400 pb-2 uppercase tracking-wide">Packing Checklist</h2>
          <div className="grid grid-cols-3 gap-2 text-xs pl-4">
            {trip.packingList.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span>[ {p.packed ? 'x' : ' ' } ] {p.item} ({p.category})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Local guide phrasebooks */}
        {guideInfo && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold border-b border-slate-400 pb-2 uppercase tracking-wide">Local Guide Info</h2>
            <div className="text-xs space-y-3 pl-4">
              <div><strong>Etiquette:</strong> {guideInfo.culture}</div>
              <div><strong>Safety Alert:</strong> {guideInfo.scamAlerts}</div>
              <div>
                <strong>Language phrasebook:</strong>
                <ul className="list-disc pl-5 mt-1 grid grid-cols-2 gap-1 font-mono text-[10px]">
                  {guideInfo.phrases.map((ph: any, idx: number) => (
                    <li key={idx}><strong>{ph.foreign}</strong>: {ph.english}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
