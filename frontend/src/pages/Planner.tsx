import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { 
  Calendar, 
  ChevronRight, ChevronLeft, Loader2, MessageSquare, Compass 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Planner: React.FC = () => {
  const navigate = useNavigate();

  // Refs for programmatic date picking cards
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  // Wizard Step State
  const [step, setStep] = useState(1);

  // Form State variables
  const [source, setSource] = useState('New York');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('2026-07-20');
  const [endDate, setEndDate] = useState('2026-07-25');
  const [budgetLimit, setBudgetLimit] = useState(1500);
  const [travelStyle, setTravelStyle] = useState('Solo');
  const [interests, setInterests] = useState<string[]>(['Nature', 'Culture']);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [seniors, setSeniors] = useState(0);
  const [diet, setDiet] = useState('None');
  const [accessibility, setAccessibility] = useState<string[]>([]);
  const [specialRequirements, setSpecialRequirements] = useState('');
  
  // Simulation flag for Definition of Done testing
  const simulateMalformed = false;
  const [generating, setGenerating] = useState(false);

  // Chat State variables
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: 'assistant', content: "Hi! I'm your Compass.ai Assistant. Tell me where you'd like to go, who you're traveling with, or what your budget is, and I'll fill in the planning wizard for you in real-time." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const styleChips = ['Solo', 'Couple', 'Family', 'Friends', 'Adventure', 'Luxury', 'Backpacking', 'Honeymoon', 'Road Trip', 'Pilgrimage'];
  const interestChips = ['Food', 'Nature', 'Adventure', 'Beaches', 'Mountains', 'Nightlife', 'Museums', 'Shopping', 'History', 'Culture', 'Trekking', 'Wildlife', 'Relaxation'];
  const accessChips = ['Wheelchair', 'Senior Friendly', 'Pet Friendly', 'Baby Friendly'];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleInterestToggle = (item: string) => {
    if (interests.includes(item)) {
      setInterests(interests.filter(i => i !== item));
    } else {
      setInterests([...interests, item]);
    }
  };

  const handleAccessToggle = (item: string) => {
    if (accessibility.includes(item)) {
      setAccessibility(accessibility.filter(a => a !== item));
    } else {
      setAccessibility([...accessibility, item]);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    // Dynamic Parameter Parsing Mock (Real-time sync to Form state)
    setTimeout(() => {
      const lower = userMsg.toLowerCase();
      let syncText = '';

      // Destination matching
      if (lower.includes('tokyo')) {
        setDestination('Tokyo');
        syncText += '📍 Destination -> Tokyo; ';
      } else if (lower.includes('paris')) {
        setDestination('Paris');
        syncText += '📍 Destination -> Paris; ';
      } else if (lower.includes('bali')) {
        setDestination('Bali');
        syncText += '📍 Destination -> Bali; ';
      }

      // Budget matching
      if (lower.includes('luxury') || lower.includes('high budget')) {
        setBudgetLimit(4000);
        syncText += '💵 Budget -> $4,000; ';
      } else if (lower.includes('cheap') || lower.includes('low budget') || lower.includes('budget-friendly')) {
        setBudgetLimit(700);
        syncText += '💵 Budget -> $700; ';
      } else if (lower.includes('standard') || lower.includes('medium budget')) {
        setBudgetLimit(1500);
        syncText += '💵 Budget -> $1,500; ';
      }

      // Archetype matching
      if (lower.includes('couple') || lower.includes('honeymoon')) {
        setTravelStyle('Couple');
        syncText += '👥 Traveler Archetype -> Couple; ';
      } else if (lower.includes('family') || lower.includes('kids')) {
        setTravelStyle('Family');
        syncText += '👥 Traveler Archetype -> Family; ';
      } else if (lower.includes('adventure') || lower.includes('trekking')) {
        setTravelStyle('Adventure');
        syncText += '👥 Traveler Archetype -> Adventure; ';
      }

      // Diet matching
      if (lower.includes('veg') || lower.includes('vegetarian')) {
        setDiet('Veg');
        syncText += '🥗 Diet Preference -> Vegetarian; ';
      } else if (lower.includes('vegan')) {
        setDiet('Vegan');
        syncText += '🥗 Diet Preference -> Vegan; ';
      }

      const botReply = syncText 
        ? `Got it! I have synced the planning form with: ${syncText}. You can see the fields update on the wizard. Ready to build the trip itinerary?`
        : `I've noted that guidelines! I'll compile that detail into the generator. Tell me more, or click "Generate Plan" when you are ready.`;

      setChatMessages(prev => [...prev, { role: 'assistant', content: botReply }]);
      setChatLoading(false);
    }, 1000);
  };

  const handleGeneratePlan = async () => {
    setGenerating(true);
    try {
      const payload = {
        source,
        destination,
        startDate,
        endDate,
        budgetLimit,
        travelStyle,
        interests,
        adults,
        children,
        seniors,
        diet,
        accessibility,
        specialRequirements,
        simulateMalformed
      };

      const res = await apiFetch('/api/trips', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success && res.trip) {
        navigate(`/itinerary/${res.trip._id}`, { state: { llmLogs: res.llmLogs } });
      }
    } catch (err: any) {
      alert('Plan Generation failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      {/* Top mini-bar header */}
      <header className="py-4 px-6 md:px-12 border-b border-slate-800/80 flex justify-between items-center bg-[#0B0F19]/90 z-10">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
            <Compass className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <span className="text-base font-bold font-poppins text-white">Compass<span className="text-secondary">.ai</span></span>
        </Link>
        <Link to="/dashboard" className="text-xs text-slate-400 hover:text-white transition-all font-semibold">Back to Dashboard</Link>
      </header>

      {/* Grid containing Wizard Form and Chat side-by-side */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-px bg-slate-800/40">
        
        {/* Left Side: Planning Wizard Form */}
        <div className="lg:col-span-7 bg-[#0E1524] p-6 md:p-10 flex flex-col justify-between overflow-y-auto max-h-[calc(100vh-65px)]">
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <span className="text-xs text-secondary font-bold uppercase tracking-wider">Step {step} of 4</span>
                <h3 className="text-xl md:text-2xl font-bold font-poppins text-white mt-1">
                  {step === 1 && 'Basic Logistics'}
                  {step === 2 && 'Travelers & Budget'}
                  {step === 3 && 'Archetype & Interests'}
                  {step === 4 && 'Logistics & Special Guidelines'}
                </h3>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className={`w-6 h-1 rounded ${s <= step ? 'bg-secondary' : 'bg-slate-700'}`} />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-slate-400 text-xs font-semibold uppercase mb-2">Departing From</label>
                      <input 
                        type="text"
                        value={source}
                        onChange={e => setSource(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-secondary transition-all text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs font-semibold uppercase mb-2">Destination (Leave blank for AI vector search match)</label>
                      <input 
                        type="text"
                        placeholder="e.g. Tokyo, Paris, Bali"
                        value={destination}
                        onChange={e => setDestination(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-secondary transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-slate-400 text-xs font-semibold uppercase mb-2">Start Date</label>
                      <div 
                        onClick={() => startDateRef.current?.showPicker()}
                        className="w-full p-4 bg-slate-900 hover:bg-slate-900/80 border border-slate-700 hover:border-secondary rounded-xl text-white flex items-center gap-4 cursor-pointer transition-all shadow-md group"
                      >
                        <Calendar className="w-5 h-5 text-slate-400 group-hover:text-secondary transition-all shrink-0" />
                        <div className="flex-grow text-left">
                          <div className="text-[10px] text-slate-500 uppercase font-bold">Pick Start Date</div>
                          <input 
                            ref={startDateRef}
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            className="bg-transparent border-0 text-white text-xs outline-none focus:ring-0 mt-0.5 w-full cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs font-semibold uppercase mb-2">End Date</label>
                      <div 
                        onClick={() => endDateRef.current?.showPicker()}
                        className="w-full p-4 bg-slate-900 hover:bg-slate-900/80 border border-slate-700 hover:border-secondary rounded-xl text-white flex items-center gap-4 cursor-pointer transition-all shadow-md group"
                      >
                        <Calendar className="w-5 h-5 text-slate-400 group-hover:text-secondary transition-all shrink-0" />
                        <div className="flex-grow text-left">
                          <div className="text-[10px] text-slate-500 uppercase font-bold">Pick End Date</div>
                          <input 
                            ref={endDateRef}
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            className="bg-transparent border-0 text-white text-xs outline-none focus:ring-0 mt-0.5 w-full cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider">Number of Travelers</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
                        <div className="text-xs text-slate-400">Adults</div>
                        <div className="flex justify-center items-center gap-3 mt-2">
                          <button onClick={() => setAdults(Math.max(1, adults - 1))} className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold">-</button>
                          <span className="font-bold font-mono text-white text-sm">{adults}</span>
                          <button onClick={() => setAdults(adults + 1)} className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold">+</button>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
                        <div className="text-xs text-slate-400">Children</div>
                        <div className="flex justify-center items-center gap-3 mt-2">
                          <button onClick={() => setChildren(Math.max(0, children - 1))} className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold">-</button>
                          <span className="font-bold font-mono text-white text-sm">{children}</span>
                          <button onClick={() => setChildren(children + 1)} className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold">+</button>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
                        <div className="text-xs text-slate-400">Seniors</div>
                        <div className="flex justify-center items-center gap-3 mt-2">
                          <button onClick={() => setSeniors(Math.max(0, seniors - 1))} className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold">-</button>
                          <span className="font-bold font-mono text-white text-sm">{seniors}</span>
                          <button onClick={() => setSeniors(seniors + 1)} className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold">+</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider">Travel Budget Limit (USD)</label>
                      <span className="text-secondary font-bold font-mono text-base">${budgetLimit}</span>
                    </div>
                    <input 
                      type="range"
                      min={500}
                      max={5000}
                      step={100}
                      value={budgetLimit}
                      onChange={e => setBudgetLimit(parseInt(e.target.value))}
                      className="w-full accent-secondary"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>$500 (Budget)</span>
                      <span>$2,500 (Standard)</span>
                      <span>$5,000+ (Luxury)</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider">Travel Archetype</label>
                    <div className="flex flex-wrap gap-2.5">
                      {styleChips.map(style => (
                        <button 
                          key={style}
                          onClick={() => setTravelStyle(style)}
                          className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${travelStyle === style ? 'bg-secondary text-dark border-secondary font-bold' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'}`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider">Interests (Select multiple)</label>
                    <div className="flex flex-wrap gap-2">
                      {interestChips.map(interest => {
                        const active = interests.includes(interest);
                        return (
                          <button 
                            key={interest}
                            onClick={() => handleInterestToggle(interest)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${active ? 'bg-primary/20 border-primary text-secondary font-semibold' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                          >
                            {interest}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-slate-400 text-xs font-semibold uppercase mb-2">Dietary Preference</label>
                      <select 
                        value={diet}
                        onChange={e => setDiet(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-secondary transition-all text-sm font-medium"
                      >
                        <option value="None">None (All food options)</option>
                        <option value="Veg">Vegetarian</option>
                        <option value="Non Veg">Non-Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                        <option value="Halal">Halal</option>
                        <option value="Jain">Jain</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-xs font-semibold uppercase mb-2">Accessibility Constraints</label>
                      <div className="flex flex-wrap gap-2">
                        {accessChips.map(chip => {
                          const active = accessibility.includes(chip);
                          return (
                            <button
                              key={chip}
                              onClick={() => handleAccessToggle(chip)}
                              className={`px-3 py-2 rounded-xl text-xs border transition-all ${active ? 'bg-accent/20 border-accent text-accent font-semibold' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                            >
                              {chip}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-semibold uppercase mb-2">Special Guidelines (Optional)</label>
                    <textarea 
                      rows={3}
                      placeholder="e.g. Wedding anniversary trip, preference for historic walking alleys, timing restrictions, photography spots suggestions..."
                      value={specialRequirements}
                      onChange={e => setSpecialRequirements(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-secondary transition-all text-sm font-medium"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Wizard Action buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-800/80">
            {step > 1 ? (
              <button 
                onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}

            {step < 4 ? (
              <button 
                onClick={() => setStep(step + 1)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold transition-all text-xs flex items-center gap-1.5"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleGeneratePlan}
                disabled={generating}
                className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl transition-all glow-btn glow-cyan flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 text-xs uppercase tracking-wide"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Generate Itinerary</>}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Conversational Chat Assistant */}
        <div className="lg:col-span-5 bg-[#0B0F19] p-6 flex flex-col justify-between max-h-[calc(100vh-65px)]">
          <div className="border-b border-slate-800/80 pb-4 mb-4 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center">
              <MessageSquare className="w-4.5 h-4.5 text-secondary" />
            </div>
            <div>
              <h4 className="font-poppins font-bold text-white text-sm">Conversational Assistant</h4>
              <p className="text-[10px] text-slate-500 font-light">Form Sync Active &bull; Updates values automatically</p>
            </div>
          </div>

          {/* Messages window */}
          <div className="flex-grow space-y-4 overflow-y-auto pr-2 min-h-[300px]">
            {chatMessages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-2xl max-w-[85%] text-xs font-light leading-relaxed border ${m.role === 'user' ? 'bg-primary/20 border-primary/30 text-white rounded-tr-none' : 'bg-slate-900/80 border-slate-800/50 text-slate-300 rounded-tl-none'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="p-3 bg-slate-900/60 border border-slate-800/50 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-secondary animate-spin" />
                  <span className="text-[10px] text-slate-400">Assistant is parsing constraints...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat input form */}
          <form onSubmit={handleChatSubmit} className="mt-4 pt-4 border-t border-slate-800/80 flex gap-2">
            <input 
              type="text"
              placeholder="e.g. Set budget to $1500, select Solo mode and add vegetarian diet"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-secondary transition-all"
            />
            <button 
              type="submit"
              className="px-6 py-2.5 bg-secondary/20 hover:bg-secondary text-secondary hover:text-dark rounded-xl transition-all text-xs font-bold"
            >
              Send
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
