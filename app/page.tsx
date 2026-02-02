'use client';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MapPin, Ruler, Calendar, Lock, X, ShieldCheck, Info, TrendingUp, Search, AlertTriangle, Filter, DollarSign, Percent, Home } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Exchange rate for normalization (matches your python script)
const IDR_RATE = 16782; 

export default function BaliVillaTruth() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVilla, setSelectedVilla] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRoi, setHoveredRoi] = useState<number | null>(null);
  const [leadCount, setLeadCount] = useState<number>(0);

  // --- FILTER STATES ---
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterPrice, setFilterPrice] = useState(10000000); // Default Max (10M USD)
  const [filterRoi, setFilterRoi] = useState(0);
  const [filterSize, setFilterSize] = useState(0);

  useEffect(() => {
    async function fetchData() {
      // Fetch listings
      const { data, error } = await supabase
        .from('listings_tracker')
        .select('*')
        .eq('status', 'audited') // Only show audited deals
        .order('projected_roi', { ascending: false });
      if (error) console.error(error);
      else setListings(data || []);
      
      // Fetch lead count
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });
      setLeadCount(count || 0);
      
      setLoading(false);
    }
    fetchData();
  }, []);

  // --- FILTER LOGIC ---
  const filteredListings = useMemo(() => {
    return listings.filter(villa => {
      // 1. Normalize Price to USD for comparison
      let priceUSD = villa.last_price || 0;
      if (priceUSD > 100000000) { // If > 100M, it's definitely IDR
        priceUSD = priceUSD / IDR_RATE;
      }

      // 2. Location Filter
      const matchLocation = filterLocation === 'All' || (villa.location && villa.location.includes(filterLocation));

      // 3. Price Filter (Show items UNDER the max)
      const matchPrice = priceUSD <= filterPrice;

      // 4. ROI Filter (Show items OVER the min)
      const matchRoi = (villa.projected_roi || 0) >= filterRoi;

      // 5. Size Filter (Show items OVER the min)
      const matchSize = (villa.land_size || 0) >= filterSize;

      return matchLocation && matchPrice && matchRoi && matchSize;
    });
  }, [listings, filterLocation, filterPrice, filterRoi, filterSize]);


  const handleLeadCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await supabase.from('leads').insert([
      { 
        email, 
        villa_id: selectedVilla.id, 
        villa_name: selectedVilla.villa_name,
        lead_type: 'Unlock Audit'
      }
    ]);

    if (!error) {
      window.open(selectedVilla.url, '_blank');
      setSelectedVilla(null);
      setEmail('');
      setLeadCount(prev => prev + 1);
    } else {
      alert("Error joining the audit list. Please try again.");
    }
    setIsSubmitting(false);
  };

  const parseRateFactors = (factorsStr: string | null): string[] => {
    if (!factorsStr) return [];
    return factorsStr.split(' | ').filter(f => f.trim());
  };

  const flaggedCount = listings.filter(v => v.projected_roi > 25).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      
      {/* HEADER */}
      <header className="max-w-6xl mx-auto mb-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Bali Villa <span className="text-blue-600">Truth</span>
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed mb-4">
          Independent ROI auditing for serious investors. We verify the data agents hide.
        </p>
        
        {/* TRUST BADGES */}
        <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold text-slate-600 mb-8">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <Search size={14} className="text-blue-500" />
            <span>{listings.length} Villas Audited</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <AlertTriangle size={14} className="text-amber-500" />
            <span>{flaggedCount} High-ROI Alerts</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <TrendingUp size={14} className="text-green-500" />
            <span>{leadCount}+ Audits Unlocked</span>
          </div>
        </div>

        {/* --- FILTER BAR --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mx-auto max-w-4xl flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 w-full md:w-auto">
            <Filter size={16} className="text-blue-600" /> Filters:
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
            {/* Location Select */}
            <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                    value={filterLocation} 
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                    <option value="All">All Locations</option>
                    <option value="Canggu">Canggu</option>
                    <option value="Pererenan">Pererenan</option>
                    <option value="Berawa">Berawa</option>
                    <option value="Uluwatu">Uluwatu</option>
                    <option value="Bingin">Bingin</option>
                    <option value="Sanur">Sanur</option>
                    <option value="Seseh">Seseh</option>
                </select>
            </div>

            {/* Price Select */}
            <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                    value={filterPrice} 
                    onChange={(e) => setFilterPrice(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                    <option value={10000000}>Max Price</option>
                    <option value={200000}>&lt; $200k USD</option>
                    <option value={350000}>&lt; $350k USD</option>
                    <option value={500000}>&lt; $500k USD</option>
                    <option value={1000000}>&lt; $1M USD</option>
                </select>
            </div>

            {/* ROI Select */}
            <div className="relative">
                <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                    value={filterRoi} 
                    onChange={(e) => setFilterRoi(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                    <option value={0}>Min ROI</option>
                    <option value={10}>10%+</option>
                    <option value={15}>15%+</option>
                    <option value={20}>20%+</option>
                    <option value={25}>25%+</option>
                </select>
            </div>

             {/* Size Input */}
             <div className="relative">
                <Ruler size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="number" 
                    placeholder="Min m²"
                    value={filterSize === 0 ? '' : filterSize}
                    onChange={(e) => setFilterSize(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                />
            </div>
          </div>
        </div>
      </header>

      {/* RESULTS COUNT */}
      <div className="max-w-6xl mx-auto mb-4 flex justify-between items-end">
         <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
             Showing {filteredListings.length} Properties
         </p>
         {filteredListings.length === 0 && (
             <button 
                onClick={() => {setFilterLocation('All'); setFilterPrice(10000000); setFilterRoi(0); setFilterSize(0)}}
                className="text-xs text-blue-600 hover:underline"
             >
                 Reset Filters
             </button>
         )}
      </div>

      {/* TABLE */}
      <main className="max-w-6xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                <th className="p-5">Asset & Location</th>
                <th className="p-5">Price (USD)</th>
                <th className="p-5 text-center">Verified ROI</th>
                <th className="p-5">Specs</th>
                <th className="p-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredListings.length === 0 ? (
                  <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-400">
                          <Filter size={48} className="mx-auto mb-4 opacity-20" />
                          No properties match your filters. Try adjusting the criteria.
                      </td>
                  </tr>
              ) : (
                filteredListings.map((villa) => {
                    const rateFactors = parseRateFactors(villa.rate_factors);
                    const isHighRoi = villa.projected_roi > 20;
                    
                    return (
                    <tr key={villa.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="p-5">
                        <div className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                            {villa.villa_name || 'Luxury Villa'}
                            {isHighRoi && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-bold border border-amber-200">
                                HOT DEAL
                            </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                            <MapPin size={12} className="text-blue-500" /> {villa.location || "Bali"}
                        </div>
                        </td>
                        <td className="p-5 font-mono text-slate-600 font-semibold text-sm">
                         {villa.price_description || villa.last_price?.toLocaleString()}
                        </td>
                        <td className="p-5">
                        <div className="flex flex-col items-center relative">
                            {/* ROI Badge with Tooltip Trigger */}
                            <div 
                            className="relative cursor-help"
                            onMouseEnter={() => setHoveredRoi(villa.id)}
                            onMouseLeave={() => setHoveredRoi(null)}
                            >
                            <span className={`px-3 py-1 rounded-full text-sm font-bold border flex items-center gap-1 ${
                                isHighRoi 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                                {villa.projected_roi?.toFixed(1)}%
                                <Info size={10} className="opacity-50" />
                            </span>
                            
                            {/* RATE FACTORS TOOLTIP */}
                            {hoveredRoi === villa.id && rateFactors.length > 0 && (
                                <div className="absolute z-40 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-[10px] rounded-lg p-3 shadow-xl pointer-events-none">
                                <div className="font-bold mb-2 text-slate-300">Rate Calculation</div>
                                <ul className="space-y-1">
                                    {rateFactors.map((factor, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5">
                                        <span className="text-blue-400 mt-0.5">•</span>
                                        <span>{factor}</span>
                                    </li>
                                    ))}
                                </ul>
                                {/* Tooltip Arrow */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                                </div>
                            )}
                            </div>
                            
                            <span className="text-[10px] text-slate-400 mt-1 font-mono">
                            ${villa.est_nightly_rate}/nt • {Math.round((villa.est_occupancy || 0.65) * 100)}% occ
                            </span>
                        </div>
                        </td>
                        <td className="p-5 text-xs text-slate-600 space-y-1">
                        <div className="flex items-center gap-2">
                            <Home size={12} className="text-slate-400"/>
                            {villa.bedrooms ? `${villa.bedrooms} Bed` : '? Bed'} 
                            {villa.beds_baths && ` / ${villa.beds_baths.split('/')[1] || '?'} Bath`}
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={12} className="text-slate-400"/>
                            {villa.lease_years === 999 
                            ? <span className="font-bold text-green-600">Freehold</span> 
                            : <span>{villa.lease_years} Yrs Lease</span>
                            }
                        </div>
                        <div className="flex items-center gap-2">
                            <Ruler size={12} className="text-slate-400"/> 
                            Land: {villa.land_size || '?'} m²
                        </div>
                        </td>
                        <td className="p-5 text-right">
                        <button 
                            onClick={() => setSelectedVilla(villa)}
                            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-bold px-4 py-2 rounded-lg transition-all"
                        >
                            <Lock size={12}/> UNLOCK SOURCE
                        </button>
                        </td>
                    </tr>
                    );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* MODAL / POPUP */}
      {selectedVilla && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setSelectedVilla(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={20}/>
            </button>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="text-blue-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Unlock Full Audit</h2>
              <p className="text-slate-500 text-sm mb-6">
                Enter your professional email to unlock the original source link and our 5-year ROI projection for <span className="font-semibold text-slate-800">{selectedVilla.villa_name}</span>.
              </p>
              <form onSubmit={handleLeadCapture} className="space-y-4">
                <input 
                  type="email" 
                  required 
                  placeholder="name@company.com"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                >
                  {isSubmitting ? 'Verifying...' : 'Unlock Now'}
                </button>
                <p className="text-[10px] text-slate-400">By clicking, you agree to our Investor Privacy Terms.</p>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto mt-12 pt-8 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div>
            <span className="font-bold text-slate-700">Bali Villa Truth</span>
            <span className="mx-2">•</span>
            <span>Independent villa investment analysis</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="mailto:tips@balivillatruth.com" className="hover:text-blue-600 transition-colors">
              Contact
            </a>
            <span className="text-slate-300">|</span>
            <a href="#" className="hover:text-blue-600 transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-4">
          © 2026 Bali Villa Truth. This site provides informational analysis only and does not constitute financial or legal advice.
        </p>
      </footer>
    </div>
  );
}