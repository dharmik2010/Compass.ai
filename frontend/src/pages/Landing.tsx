import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Compass, ArrowRight, Search, Star, Sparkles, ChevronDown, 
  Compass as CompassIcon, Cloud, Moon, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Joby-inspired interactive flight altitude state: 0 (Ground), 1 (Lift-off), 2 (Cruise), 3 (Space/Orbit)
  const [altitude, setAltitude] = useState(0);

  const destinationsList = [
    { name: 'Tokyo', country: 'Japan', desc: 'Futuristic neon city blended with shrines' },
    { name: 'Paris', country: 'France', desc: 'City of light, romance, and pastries' },
    { name: 'Bali', country: 'Indonesia', desc: 'Tropical volcanic beaches and reef crawls' },
    { name: 'Swiss Alps', country: 'Switzerland', desc: 'Snowy peaks, skiing, and organic valleys' }
  ];

  const matchedDests = destinationsList.filter(d => 
    d.name.toLowerCase().includes(searchVal.toLowerCase()) && searchVal.length > 0
  );

  const handlePlanClick = (dest: string = '') => {
    navigate('/login', { state: { targetDest: dest } });
  };

  const faqs = [
    { q: 'How does the AI planning vector similarity search work?', a: 'Compass.ai encodes your travel style and interests into a query vector, matching them against candidate destinations database profiles using cosine similarity before compilation, saving API tokens and delivering highly relevant recommendations.' },
    { q: 'What is a "Self-Healing State Machine" in travel planning?', a: 'If a weather disruption happens (e.g. heavy rain) or you request budget cuts, our system performs atomic mutations on the Trip database model, instantly updating your itinerary, maps, budgets, and checklists in real time without having to regenerate or refresh the entire page.' },
    { q: 'Can I export my generated travel itineraries?', a: 'Yes! You can download high-resolution PDF itineraries, print packing checklists, and export summaries of trip budgets directly from your dashboard.' },
    { q: 'Is there a offline access fallback?', a: 'If MongoDB is unavailable or your network drops, the backend seamlessly falls back to a high-fidelity local in-memory DB and mock LLM synthesis client so you never lose the ability to explore and plan.' }
  ];

  // Dynamic gradient generator based on active flight altitude
  const getBackgroundGradient = () => {
    switch (altitude) {
      case 1: // Lift-off (Sunset orange & twilight navy)
        return 'linear-gradient(to bottom, #1e1b4b 0%, #31102f 40%, #581c0c 70%, #030712 100%)';
      case 2: // Cruising (Californian clear cyan & sky blue)
        return 'linear-gradient(to bottom, #0c4a6e 0%, #0369a1 30%, #0284c7 60%, #030712 100%)';
      case 3: // Orbit/Space (Deep cosmic starry navy & black)
        return 'linear-gradient(to bottom, #020617 0%, #0b0f19 50%, #030712 100%)';
      default: // Ground Level (Dark navy terroir base)
        return 'linear-gradient(to bottom, #090d16 0%, #0c1938 40%, #030712 100%)';
    }
  };

  return (
    <div 
      style={{ background: getBackgroundGradient(), transition: 'background 1.5s ease-in-out' }}
      className="min-h-screen relative text-slate-100 font-sans overflow-x-hidden selection:bg-secondary selection:text-dark"
    >
      
      {/* Decorative Altitude Particles */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Aerodynamic wind grids */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:5rem_5rem]" />
        
        {/* Floating clouds/stars depending on altitude */}
        <AnimatePresence>
          {altitude === 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 0.15, y: 0 }}
              exit={{ opacity: 0, y: -100 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 flex justify-around items-center"
            >
              <Cloud className="w-48 h-48 text-orange-200 blur-sm absolute left-10 top-20" />
              <Cloud className="w-64 h-64 text-orange-300 blur-md absolute right-20 bottom-40" />
            </motion.div>
          )}
          {altitude === 2 && (
            <motion.div 
              initial={{ opacity: 0, y: 200 }}
              animate={{ opacity: 0.2, y: 0 }}
              exit={{ opacity: 0, y: -200 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 flex justify-between items-center"
            >
              <Cloud className="w-56 h-56 text-sky-100 blur-sm absolute left-20 bottom-10" />
              <Cloud className="w-72 h-72 text-white blur-md absolute right-10 top-10" />
            </motion.div>
          )}
          {altitude === 3 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#ffffff_1px,_transparent_1px)] bg-[size:24px_24px]"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Header / Navbar */}
      <header className="fixed top-0 left-0 w-full z-50 py-6 px-6 md:px-12 flex justify-between items-center backdrop-blur-md border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-secondary animate-spin-slow" />
          <span className="text-xl font-bold font-serif tracking-widest text-white uppercase">Compass<span className="text-secondary">.ai</span></span>
        </div>
        <div className="hidden md:flex items-center gap-10 text-xs font-semibold tracking-widest uppercase text-slate-400">
          <a href="#altitude-control" className="hover:text-white transition-all">Altitude Control</a>
          <a href="#features" className="hover:text-white transition-all">Chapters</a>
          <a href="#destinations" className="hover:text-white transition-all">Popular Destinations</a>
          <a href="#faq" className="hover:text-white transition-all">FAQ</a>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/login" className="text-xs font-bold tracking-wider uppercase hover:text-secondary transition-all">Sign In</Link>
          <Link to="/register" className="text-xs font-bold bg-white text-dark px-5 py-3 rounded-full hover:bg-secondary hover:text-dark hover:shadow-2xl transition-all uppercase tracking-widest">Plan Trip</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 md:px-12 max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[90vh]">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-[10px] font-bold tracking-widest uppercase text-secondary"
          >
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Flight Analytics
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold font-serif tracking-tight leading-tight text-white">
            Plan Smarter.<br/>
            <span className="text-gradient-cyan-blue font-serif italic font-normal">Travel Better.</span>
          </h1>
          
          <p className="text-slate-300 text-base max-w-xl mx-auto lg:mx-0 font-light leading-relaxed font-serif">
            Welcome to the future of moving. Click the Altitude Command panel on the right to simulate takeoff lift-offs and watch the landing gradients morph in real time.
          </p>

          {/* Large Destination Search */}
          <div className="relative max-w-md mx-auto lg:mx-0 mt-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Where would you like to travel?"
                value={searchVal}
                onChange={e => {
                  setSearchVal(e.target.value);
                  setShowAutoComplete(true);
                }}
                onFocus={() => setShowAutoComplete(true)}
                className="w-full pl-12 pr-4 py-4 bg-[#0a0f1d]/85 border border-white/[0.08] rounded-full text-white placeholder-slate-500 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 shadow-2xl transition-all text-xs font-semibold uppercase tracking-wider"
              />
            </div>
            
            {/* Auto Complete Dropdown */}
            <AnimatePresence>
              {showAutoComplete && matchedDests.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 top-full mt-3 w-full glass-panel border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl z-20"
                >
                  {matchedDests.map((dest, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        setSearchVal(dest.name);
                        setShowAutoComplete(false);
                        handlePlanClick(dest.name);
                      }}
                      className="px-5 py-4 hover:bg-white/[0.04] cursor-pointer flex items-center justify-between transition-all border-b border-white/[0.02] last:border-0"
                    >
                      <div className="text-left">
                        <div className="text-xs font-bold text-white uppercase tracking-wider">{dest.name}</div>
                        <div className="text-[10px] text-slate-400 mt-1 font-light">{dest.country} &bull; {dest.desc}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Joby-inspired Interactive Altitude Command Panel */}
        <div id="altitude-control" className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="w-full max-w-sm p-6 rounded-3xl glass-panel border border-white/[0.06] bg-slate-950/60 backdrop-blur-xl shadow-2xl relative z-10 space-y-6 tilt-card">
            <div className="border-b border-white/[0.04] pb-3 flex justify-between items-center">
              <span className="text-[9px] font-bold tracking-widest uppercase text-slate-400">Altitude Controller</span>
              <span className="text-[10px] font-bold font-mono text-secondary">
                {altitude === 0 && '0 FT (GROUND LEVEL)'}
                {altitude === 1 && '5,000 FT (TAKEOFF LIFT)'}
                {altitude === 2 && '15,000 FT (CRUISING ALTI)'}
                {altitude === 3 && '30,000 FT (ORBITAL SPACE)'}
              </span>
            </div>

            {/* Vertical slider selectors */}
            <div className="flex justify-between gap-3">
              {[0, 1, 2, 3].map((val) => {
                const isActive = altitude === val;
                return (
                  <button
                    key={val}
                    onClick={() => setAltitude(val)}
                    className={`flex-1 py-4 px-2 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${isActive ? 'bg-secondary border-secondary text-dark font-bold shadow-lg shadow-secondary/20' : 'bg-slate-900/40 border-white/[0.04] text-slate-400 hover:border-white/[0.08]'}`}
                  >
                    {val === 0 && <CompassIcon className="w-5 h-5" />}
                    {val === 1 && <Send className="w-5 h-5 rotate-45" />}
                    {val === 2 && <Cloud className="w-5 h-5" />}
                    {val === 3 && <Moon className="w-5 h-5" />}
                    
                    <span className="text-[8px] font-bold tracking-wider uppercase mt-1">
                      {val === 0 && 'Ground'}
                      {val === 1 && 'Takeoff'}
                      {val === 2 && 'Cruise'}
                      {val === 3 && 'Orbit'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Interactive Flight Simulation card display */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-3">
              <div className="text-[9px] font-bold tracking-wider uppercase text-slate-500">Live Telemetry Simulator</div>
              <div className="flex justify-between items-center text-xs">
                <span>Vibration Sync Status:</span>
                <span className="text-success font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Active</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Aero Gradient Density:</span>
                <span className="text-white font-mono">{altitude * 33 + 10}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chapters of travel story */}
      <section id="features" className="py-28 max-w-7xl mx-auto px-6 relative z-10 border-t border-white/[0.04] space-y-32">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[9px] font-bold tracking-widest uppercase text-secondary">The Cinematic Chapters</span>
          <h2 className="text-3xl md:text-5xl font-serif text-white mt-3">Symphony of the Compass</h2>
          <p className="text-slate-350 font-light text-sm mt-3 leading-relaxed font-serif">Four chapters illustrating how we combine token calculations with spatial maps.</p>
        </div>

        {/* Chapter 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-secondary font-serif text-sm italic">Chapter I &mdash; The Glacier Carving</span>
            <h3 className="text-2xl md:text-4xl font-serif text-white">Vector Candidate Discovery</h3>
            <p className="text-slate-400 text-sm font-light leading-relaxed font-serif">
              We compile semantic tag vectors to filter destinations by coordinates, visa status, and cost profile in memory before sending payload queries to language models. This saves tokens and guarantees highly optimized recommendations.
            </p>
          </div>
          <div className="h-64 rounded-3xl overflow-hidden relative border border-white/[0.06] group tilt-card">
            <div className="w-full h-full grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">
              <TokyoSvg />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Day 1 Outings &bull; Tokyo Mapping</span>
            </div>
          </div>
        </div>

        {/* Chapter 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="h-64 rounded-3xl overflow-hidden relative border border-white/[0.06] order-last lg:order-first group tilt-card">
            <div className="w-full h-full grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">
              <ParisSvg />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Multi-Currency &bull; Paris Budget</span>
            </div>
          </div>
          <div className="space-y-6">
            <span className="text-secondary font-serif text-sm italic">Chapter II &mdash; Rhythm of Rivers</span>
            <h3 className="text-2xl md:text-4xl font-serif text-white">Tidal Budget Syncing</h3>
            <p className="text-slate-400 text-sm font-light leading-relaxed font-serif">
              Conduct the flow of numbers. Convert displaying rates instantly between USD ($), EUR (€), INR (₹), JPY (¥), and GBP (£) on the fly, tracking spent ledgers automatically.
            </p>
          </div>
        </div>

        {/* Chapter 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-secondary font-serif text-sm italic">Chapter III &mdash; Crescendo of Tides</span>
            <h3 className="text-2xl md:text-4xl font-serif text-white">Self-Healing Weather fallbacks</h3>
            <p className="text-slate-400 text-sm font-light leading-relaxed font-serif">
              Wield the storm. Advisories automatically mutate coordinates and schedules from outdoors to museums. Updated lists sync over WebSocket to map and budget UI in real time.
            </p>
          </div>
          <div className="h-64 rounded-3xl overflow-hidden relative border border-white/[0.06] group tilt-card">
            <div className="w-full h-full grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">
              <BaliSvg />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Self-Healing Forecast &bull; Bali Rain</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Destinationscurated */}
      <section id="destinations" className="py-24 bg-[#050912]/80 border-t border-b border-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="text-[9px] font-bold tracking-widest uppercase text-slate-500">Curated Terroir</span>
              <h2 className="text-3xl font-serif text-white mt-2">Popular Coordinates</h2>
            </div>
            <button 
              onClick={() => handlePlanClick()} 
              className="text-secondary flex items-center gap-1.5 hover:underline text-xs font-bold uppercase tracking-widest"
            >
              See All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tokyo Card */}
            <div className="rounded-3xl overflow-hidden glass-panel border border-white/[0.06] flex flex-col group tilt-card transition-all">
              <div className="h-56 overflow-hidden relative">
                <div className="w-full h-full group-hover:scale-105 transition-all duration-700">
                  <TokyoSvg />
                </div>
                <span className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md border border-white/[0.06] text-secondary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Clear &bull; 18°C</span>
              </div>
              <div className="p-6 flex-grow flex flex-col justify-between space-y-4 bg-gradient-to-b from-transparent to-slate-950/50">
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="text-base font-bold text-white font-serif uppercase tracking-wide">Tokyo, Japan</h4>
                    <div className="flex items-center text-warning text-xs font-semibold"><Star className="w-3.5 h-3.5 fill-warning mr-1" /> 4.9</div>
                  </div>
                  <p className="text-slate-450 text-xs font-light mt-2 leading-relaxed">A futuristic neon metropolis combined with ancient temples, sushi counters, and world-class train systems.</p>
                </div>
                <div className="pt-4 border-t border-white/[0.03] flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Average cost</span>
                    <div className="text-white font-bold font-mono mt-0.5">$1,500 <span className="text-[10px] font-normal text-slate-400">/ person</span></div>
                  </div>
                  <button onClick={() => handlePlanClick('Tokyo')} className="px-4 py-2 bg-white text-dark hover:bg-secondary rounded-full text-[10px] font-bold uppercase tracking-wider transition-all">Plan Trip</button>
                </div>
              </div>
            </div>

            {/* Paris Card */}
            <div className="rounded-3xl overflow-hidden glass-panel border border-white/[0.06] flex flex-col group tilt-card transition-all">
              <div className="h-56 overflow-hidden relative">
                <div className="w-full h-full group-hover:scale-105 transition-all duration-700">
                  <ParisSvg />
                </div>
                <span className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md border border-white/[0.06] text-secondary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Cloudy &bull; 14°C</span>
              </div>
              <div className="p-6 flex-grow flex flex-col justify-between space-y-4 bg-gradient-to-b from-transparent to-slate-950/50">
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="text-base font-bold text-white font-serif uppercase tracking-wide">Paris, France</h4>
                    <div className="flex items-center text-warning text-xs font-semibold"><Star className="w-3.5 h-3.5 fill-warning mr-1" /> 4.7</div>
                  </div>
                  <p className="text-slate-450 text-xs font-light mt-2 leading-relaxed">The ultimate city of romance, haute couture, world-famous pastries, art museums, and historical boulevards.</p>
                </div>
                <div className="pt-4 border-t border-white/[0.03] flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Average cost</span>
                    <div className="text-white font-bold font-mono mt-0.5">$1,800 <span className="text-[10px] font-normal text-slate-400">/ person</span></div>
                  </div>
                  <button onClick={() => handlePlanClick('Paris')} className="px-4 py-2 bg-white text-dark hover:bg-secondary rounded-full text-[10px] font-bold uppercase tracking-wider transition-all">Plan Trip</button>
                </div>
              </div>
            </div>

            {/* Bali Card */}
            <div className="rounded-3xl overflow-hidden glass-panel border border-white/[0.06] flex flex-col group tilt-card transition-all">
              <div className="h-56 overflow-hidden relative">
                <div className="w-full h-full group-hover:scale-105 transition-all duration-700">
                  <BaliSvg />
                </div>
                <span className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md border border-white/[0.06] text-secondary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Sunny &bull; 28°C</span>
              </div>
              <div className="p-6 flex-grow flex flex-col justify-between space-y-4 bg-gradient-to-b from-transparent to-slate-950/50">
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="text-base font-bold text-white font-serif uppercase tracking-wide">Bali, Indonesia</h4>
                    <div className="flex items-center text-warning text-xs font-semibold"><Star className="w-3.5 h-3.5 fill-warning mr-1" /> 4.8</div>
                  </div>
                  <p className="text-slate-450 text-xs font-light mt-2 leading-relaxed">A tropical volcanic paradise famous for its terraced rice paddies, serene beaches, surfing, and sacred temples.</p>
                </div>
                <div className="pt-4 border-t border-white/[0.03] flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Average cost</span>
                    <div className="text-white font-bold font-mono mt-0.5">$800 <span className="text-[10px] font-normal text-slate-400">/ person</span></div>
                  </div>
                  <button onClick={() => handlePlanClick('Bali')} className="px-4 py-2 bg-white text-dark hover:bg-secondary rounded-full text-[10px] font-bold uppercase tracking-wider transition-all">Plan Trip</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="text-[9px] font-bold tracking-widest uppercase text-slate-500 font-mono">FAQ</span>
          <h2 className="text-3xl font-serif text-white mt-2">Frequently Answered Queries</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="rounded-2xl glass-panel border border-white/[0.04] overflow-hidden transition-all duration-300">
              <button 
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full px-6 py-5 flex justify-between items-center text-left hover:bg-white/[0.02] transition-all font-serif font-bold text-white tracking-wide"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-all duration-300 ${activeFaq === idx ? 'rotate-180 text-secondary' : ''}`} />
              </button>
              
              <AnimatePresence>
                {activeFaq === idx && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-6 text-slate-400 text-xs font-light leading-relaxed font-serif border-t border-white/[0.02] pt-4">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.03] py-12 px-6 md:px-12 text-slate-600 text-xs flex flex-col md:flex-row justify-between items-center gap-6 max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-2">
          <CompassIcon className="w-4 h-4 text-slate-600" />
          <span className="font-serif font-semibold tracking-wider text-slate-400 uppercase">Compass<span className="text-slate-500">.ai</span></span>
        </div>
        <div className="flex items-center gap-8 font-mono text-[10px]">
          <div>&copy; 2026 Compass.ai. All rights reserved.</div>
          <Link to="/login" className="hover:text-slate-400 transition-all uppercase tracking-widest">Admin Access</Link>
        </div>
      </footer>

    </div>
  );
};

const TokyoSvg: React.FC = () => (
  <svg viewBox="0 0 400 250" className="w-full h-full bg-[#050b18]">
    <defs>
      <linearGradient id="tokyoG" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1e1b4b" />
        <stop offset="60%" stopColor="#080711" />
        <stop offset="100%" stopColor="#020205" />
      </linearGradient>
    </defs>
    <rect width="400" height="250" fill="url(#tokyoG)" />
    <path d="M 120 250 L 200 130 L 280 250 Z" fill="#111827" />
    <path d="M 180 160 L 200 130 L 220 160 Z" fill="#f3f4f6" opacity="0.9" />
    <circle cx="280" cy="100" r="25" fill="#ef4444" opacity="0.85" />
    <rect x="30" y="160" width="35" height="90" fill="#0f172a" />
    <rect x="80" y="180" width="30" height="70" fill="#0f172a" />
    <rect x="140" y="190" width="25" height="60" fill="#0f172a" />
    <rect x="250" y="150" width="40" height="100" fill="#090d16" />
    <rect x="310" y="170" width="35" height="80" fill="#090d16" />
    <line x1="270" y1="150" x2="270" y2="80" stroke="#06b6d4" strokeWidth="1" />
    <line x1="0" y1="230" x2="400" y2="230" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1" />
    <circle cx="95" cy="195" r="1.5" fill="#06b6d4" />
    <circle cx="45" cy="175" r="1.5" fill="#3b82f6" />
    <circle cx="325" cy="190" r="1.5" fill="#10b981" />
  </svg>
);

const ParisSvg: React.FC = () => (
  <svg viewBox="0 0 400 250" className="w-full h-full bg-[#0b0c16]">
    <defs>
      <linearGradient id="parisG" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#2e1065" />
        <stop offset="60%" stopColor="#0c0a1a" />
        <stop offset="100%" stopColor="#020205" />
      </linearGradient>
    </defs>
    <rect width="400" height="250" fill="url(#parisG)" />
    <path d="M 180 250 L 195 90 L 205 90 L 220 250 Z" fill="#111827" />
    <path d="M 175 250 C 190 230 210 230 225 250 Z" fill="#0b0c16" />
    <rect x="190" y="160" width="20" height="5" fill="#3b82f6" opacity="0.6" />
    <rect x="194" y="110" width="12" height="4" fill="#3b82f6" opacity="0.6" />
    <line x1="200" y1="90" x2="200" y2="60" stroke="#f59e0b" strokeWidth="1.5" />
    <circle cx="200" cy="60" r="2" fill="#fff" />
    <circle cx="80" cy="70" r="1" fill="#fff" opacity="0.6" />
    <circle cx="310" cy="90" r="1" fill="#fff" opacity="0.5" />
    <circle cx="120" cy="140" r="1" fill="#fff" opacity="0.7" />
  </svg>
);

const BaliSvg: React.FC = () => (
  <svg viewBox="0 0 400 250" className="w-full h-full bg-[#050c18]">
    <defs>
      <linearGradient id="baliG" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3b0764" />
        <stop offset="50%" stopColor="#1e1b4b" />
        <stop offset="100%" stopColor="#581c0c" />
      </linearGradient>
    </defs>
    <rect width="400" height="250" fill="url(#baliG)" />
    <circle cx="200" cy="160" r="45" fill="#f59e0b" opacity="0.8" />
    <path d="M 0 210 Q 100 200 200 210 T 400 210 L 400 250 L 0 250 Z" fill="#090514" opacity="0.9" />
    <path d="M 60 250 Q 80 180 50 120" stroke="#111827" strokeWidth="6" fill="none" />
    <path d="M 50 120 Q 30 130 10 140" stroke="#0f172a" strokeWidth="3" fill="none" />
    <path d="M 50 120 Q 20 100 15 80" stroke="#0f172a" strokeWidth="3" fill="none" />
    <path d="M 50 120 Q 80 90 100 85" stroke="#0f172a" strokeWidth="3" fill="none" />
    <path d="M 50 120 Q 90 130 110 150" stroke="#0f172a" strokeWidth="3" fill="none" />
  </svg>
);
