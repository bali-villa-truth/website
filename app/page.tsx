'use client';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MapPin, Ruler, Calendar, Lock, X, ShieldCheck, Info, TrendingUp, Search, AlertTriangle, Filter, DollarSign, Percent, Home, Layers, ArrowUpDown, Bed, Bath } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FALLBACK_RATES: Record<string, number> = { USD: 1, IDR: 16782, AUD: 1.53, EUR: 0.92, SGD: 1.34 };

export default function BaliVillaTruth() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVilla, setSelectedVilla] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRoi, setHoveredRoi] = useState<number | null>(null);
  const [leadCount, setLeadCount] = useState<number>(0);
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);

  // --- FILTER STATES ---
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterPrice, setFilterPrice] = useState(10000000); 
  const [filterRoi, setFilterRoi] = useState(0);
  const [filterLandSize, setFilterLandSize] = useState(0);
  const [filterBuildSize, setFilterBuildSize] = useState(0);
  const [filterBeds, setFilterBeds] = useState(0);
  const [filterBaths, setFilterBaths] = useState(0);
  const [filterLeaseType, setFilterLeaseType] = useState('All');
  const [displayCurrency, setDisplayCurrency] = useState<string>('USD'); // Show all prices in this currency
  const [sortOption, setSortOption] = useState('roi-desc');

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('listings_tracker')
        .select('*')
        .eq('status', 'audited').gt('last_price', 0).limit(5000); // Fetch all, handle sort client-side
      
      if (error) console.error(error);
      else {
        const raw = data || [];
        const real = raw.filter((v: any) => (v.last_price || 0) > 0 && (v.villa_name || '').length > 2);
        setListings(real);
      }
      
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });
      setLeadCount(count || 0);
      
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const json = await res.json();
        if (json.rates) {
          setRates({ USD: 1, ...json.rates });
        }
      } catch {
        // Keep FALLBACK_RATES
      }
    }
    fetchRates();
  }, []);

  // --- HELPER: Parse Bathrooms from "X Bed / Y Bath" string ---
  const getBathCount = (villa: any) => {
    if (!villa.beds_baths) return 0;
    const parts = villa.beds_baths.split('/');
    if (parts.length < 2) return 0;
    return parseInt(parts[1]) || 0;
  };

  // --- Parse listing price: amount and currency from price_description or last_price ---
  const parseListingPrice = (villa: any): { amount: number; currency: string } => {
    const desc = (villa.price_description || '').trim();
    const match = desc.match(/^(IDR|USD|AUD|EUR|SGD)\s*([\d,.\s]+)/i);
    if (match) {
      const amount = parseFloat(match[2].replace(/\s|,/g, '')) || 0;
      return { amount, currency: match[1].toUpperCase() };
    }
    const p = Number(villa.last_price) || 0;
    return { amount: p, currency: p >= 1e6 ? 'IDR' : 'USD' };
  };

  // --- Convert listing price to USD for filtering/sorting ---
  const getPriceUSD = (villa: any): number => {
    const { amount, currency } = parseListingPrice(villa);
    const r = rates[currency];
    if (!r || r <= 0) return amount;
    return currency === 'USD' ? amount : amount / r;
  };

  // --- Convert and format price in display currency (for table) ---
  const formatPriceInCurrency = (villa: any): string => {
    const priceUSD = getPriceUSD(villa);
    const r = rates[displayCurrency];
    if (!r) return `${displayCurrency} ${priceUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    const value = displayCurrency === 'USD' ? priceUSD : priceUSD * r;
    if (displayCurrency === 'IDR') return `IDR ${Math.round(value).toLocaleString()}`;
    return `${displayCurrency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`;
  };

  // --- Display nightly & occupancy for analysis (use DB value or conservative default so every property shows analysis) ---
  const getDisplayNightly = (villa: any): number =>
    villa.est_nightly_rate > 0 ? villa.est_nightly_rate : (100 + ((villa.bedrooms || 0) * 35));
  const getDisplayOccupancy = (villa: any): number =>
    (villa.est_occupancy ?? 0.58) * 100;

  // --- FILTER & SORT LOGIC (all listings shown; currency is display-only) ---
  const processedListings = useMemo(() => {
    const filtered = listings.filter(villa => {
      const priceUSD = getPriceUSD(villa);
      const matchLocation = filterLocation === 'All' || (villa.location && villa.location.includes(filterLocation));
      const matchPrice = priceUSD <= filterPrice;
      const matchRoi = (villa.projected_roi || 0) >= filterRoi;
      const matchLand = (villa.land_size || 0) >= filterLandSize;
      const matchBuild = (villa.building_size || 0) >= filterBuildSize;
      const matchBeds = (villa.bedrooms || 0) >= filterBeds;
      const matchBaths = getBathCount(villa) >= filterBaths;
      let matchLease = true;
      if (filterLeaseType !== 'All') {
        const features = (villa.features || '').toLowerCase();
        const years = villa.lease_years || 0;
        if (filterLeaseType === 'Freehold') matchLease = features.includes('freehold') || features.includes('hak milik') || years === 999;
        else if (filterLeaseType === 'Leasehold') matchLease = features.includes('leasehold') || features.includes('hak sewa') || (years > 0 && years < 999);
      }
      return matchLocation && matchPrice && matchRoi && matchLand && matchBuild && matchBeds && matchBaths && matchLease;
    });

    return filtered.sort((a, b) => {
      const priceA = getPriceUSD(a);
      const priceB = getPriceUSD(b);
      const roiA = a.projected_roi || 0;
      const roiB = b.projected_roi || 0;
      switch (sortOption) {
        case 'price-asc': return priceA - priceB;
        case 'price-desc': return priceB - priceA;
        case 'roi-asc': return roiA - roiB;
        case 'roi-desc': return roiB - roiA;
        default: return 0;
      }
    });
  }, [listings, filterLocation, filterPrice, filterRoi, filterLandSize, filterBuildSize, filterBeds, filterBaths, filterLeaseType, sortOption, rates]);

  const handleLeadCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.from('leads').insert([
      { email, villa_id: selectedVilla.id, villa_name: selectedVilla.villa_name, lead_type: 'Unlock Audit' }
    ]);
    if (!error) {
      window.open(selectedVilla.url, '_blank');
      setSelectedVilla(null);
      setEmail('');
      setLeadCount(prev => prev + 1);
    } else {
      alert("Error joining. Please try again.");
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
      <header className="max-w-7xl mx-auto mb-6">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            Bali Villa <span className="text-blue-600">Truth</span>
            </h1>
            <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
            Independent ROI auditing for serious investors. We verify the data agents hide.
            </p>
        </div>
        
        {/* FILTER DASHBOARD */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
            
            {/* ROW 1: Core Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
                <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none cursor-pointer hover:bg-slate-100 transition-colors">
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
                <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select value={filterPrice} onChange={(e) => setFilterPrice(Number(e.target.value))} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none cursor-pointer hover:bg-slate-100 transition-colors">
                        <option value={10000000}>Max Price</option>
                        <option value={200000}>&lt; $200k USD</option>
                        <option value={350000}>&lt; $350k USD</option>
                        <option value={500000}>&lt; $500k USD</option>
                        <option value={1000000}>&lt; $1M USD</option>
                    </select>
                </div>
                <div className="relative">
                    <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select value={filterRoi} onChange={(e) => setFilterRoi(Number(e.target.value))} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none cursor-pointer hover:bg-slate-100 transition-colors">
                        <option value={0}>Min ROI</option>
                        <option value={10}>10%+</option>
                        <option value={15}>15%+</option>
                        <option value={20}>20%+</option>
                        <option value={25}>25%+</option>
                    </select>
                </div>
                <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select value={filterLeaseType} onChange={(e) => setFilterLeaseType(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none cursor-pointer hover:bg-slate-100 transition-colors">
                        <option value="All">All Status</option>
                        <option value="Freehold">Freehold (Hak Milik)</option>
                        <option value="Leasehold">Leasehold (Hak Sewa)</option>
                    </select>
                </div>
                <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select value={displayCurrency} onChange={(e) => setDisplayCurrency(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none cursor-pointer hover:bg-slate-100 transition-colors" title="Show all prices in this currency">
                        <option value="IDR">Show prices in IDR</option>
                        <option value="USD">Show prices in USD</option>
                        <option value="AUD">Show prices in AUD</option>
                        <option value="EUR">Show prices in EUR</option>
                        <option value="SGD">Show prices in SGD</option>
                    </select>
                </div>
                {/* SORTING - Prominent */}
                <div className="relative col-span-2 md:col-span-3 lg:col-span-1">
                    <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 font-medium rounded-lg text-sm outline-none cursor-pointer hover:bg-blue-100 transition-colors">
                        <option value="roi-desc">ROI: High → Low</option>
                        <option value="roi-asc">ROI: Low → High</option>
                        <option value="price-asc">Price: Low → High</option>
                        <option value="price-desc">Price: High → Low</option>
                    </select>
                </div>
            </div>

            {/* ROW 2: Detail Filters */}
            <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 w-full sm:w-auto">
                    <Bed size={14} className="text-slate-400" />
                    <select value={filterBeds} onChange={(e) => setFilterBeds(Number(e.target.value))} className="bg-transparent text-sm outline-none w-full sm:w-auto">
                        <option value={0}>Any Beds</option>
                        <option value={1}>1+ Beds</option>
                        <option value={2}>2+ Beds</option>
                        <option value={3}>3+ Beds</option>
                        <option value={4}>4+ Beds</option>
                        <option value={5}>5+ Beds</option>
                    </select>
                </div>
                
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 w-full sm:w-auto">
                    <Bath size={14} className="text-slate-400" />
                    <select value={filterBaths} onChange={(e) => setFilterBaths(Number(e.target.value))} className="bg-transparent text-sm outline-none w-full sm:w-auto">
                        <option value={0}>Any Baths</option>
                        <option value={1}>1+ Baths</option>
                        <option value={2}>2+ Baths</option>
                        <option value={3}>3+ Baths</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 w-full sm:w-auto">
                    <Ruler size={14} className="text-slate-400" />
                    <input type="number" placeholder="Min Land m²" value={filterLandSize === 0 ? '' : filterLandSize} onChange={(e) => setFilterLandSize(Number(e.target.value))} className="bg-transparent text-sm outline-none w-24 placeholder-slate-500" />
                </div>

                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 w-full sm:w-auto">
                    <Layers size={14} className="text-slate-400" />
                    <input type="number" placeholder="Min Build m²" value={filterBuildSize === 0 ? '' : filterBuildSize} onChange={(e) => setFilterBuildSize(Number(e.target.value))} className="bg-transparent text-sm outline-none w-24 placeholder-slate-500" />
                </div>

                <button 
                    onClick={() => {setFilterLocation('All'); setFilterPrice(10000000); setFilterRoi(0); setFilterLandSize(0); setFilterBuildSize(0); setFilterBeds(0); setFilterBaths(0); setFilterLeaseType('All'); setSortOption('roi-desc');}}
                    className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-2"
                >
                    Reset All
                </button>
            </div>
        </div>
      </header>

      {/* RESULTS BAR */}
      <div className="max-w-7xl mx-auto mb-4 flex justify-between items-center px-2">
         <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Showing {processedListings.length} Properties</p>
         <div className="flex gap-4">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">
                <AlertTriangle size={10} className="text-amber-500"/> {flaggedCount} High-ROI
            </div>
         </div>
      </div>

      {/* TABLE */}
      <main className="max-w-7xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                <th className="p-5">Asset & Location</th>
                <th className="p-5">Price ({displayCurrency})</th>
                <th className="p-5 text-center">Verified ROI</th>
                <th className="p-5">Specs</th>
                <th className="p-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedListings.length === 0 ? (
                  <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-400">
                          <Filter size={48} className="mx-auto mb-4 opacity-20" />
                          No properties match your filters.
                      </td>
                  </tr>
              ) : (
                processedListings.map((villa) => {
                    const rateFactors = parseRateFactors(villa.rate_factors);
                    const isHighRoi = villa.projected_roi > 20;
                    
                    return (
                    <tr key={villa.id} className="hover:bg-blue-50/50 transition-colors group">
                        <td className="p-5">
                        <div className="font-bold text-slate-900 mb-1 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                            {villa.villa_name || 'Luxury Villa'}
                            {isHighRoi && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-bold border border-amber-200">HOT DEAL</span>}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                            <MapPin size={12} className="text-blue-500" /> {villa.location || "Bali"}
                        </div>
                        </td>
                        <td className="p-5 font-mono text-slate-600 font-semibold text-sm">
                         {formatPriceInCurrency(villa)}
                        </td>
                        <td className="p-5">
                        <div className="flex flex-col items-center relative">
                            <div className="relative cursor-help text-center" onMouseEnter={() => setHoveredRoi(villa.id)} onMouseLeave={() => setHoveredRoi(null)}>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold border flex items-center gap-1 justify-center w-fit mx-auto ${isHighRoi ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                {villa.projected_roi?.toFixed(1)}% <Info size={10} className="opacity-50" />
                            </span>
                            <p className="text-[10px] text-slate-500 mt-1 font-mono">~${getDisplayNightly(villa)}/nt • {Math.round(getDisplayOccupancy(villa))}% occ</p>
                            {hoveredRoi === villa.id && (
                                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-[10px] rounded-lg p-3 shadow-xl pointer-events-none">
                                <div className="font-bold mb-2 text-slate-300">Analysis Data</div>
                                <div className="mb-2 pb-2 border-b border-slate-700">
                                    <div className="flex justify-between"><span>Est. Nightly:</span> <span className="text-emerald-400 font-mono">${getDisplayNightly(villa)}</span></div>
                                    <div className="flex justify-between"><span>Occupancy:</span> <span className="text-blue-400 font-mono">{Math.round(getDisplayOccupancy(villa))}%</span></div>
                                </div>
                                {rateFactors.length > 0 ? (
                                <ul className="space-y-1">
                                    {rateFactors.map((factor, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5"><span className="text-blue-400 mt-0.5">•</span><span>{factor}</span></li>
                                    ))}
                                </ul>
                                ) : (
                                <p className="text-slate-400 italic">Based on bedroom count and conservative occupancy.</p>
                                )}
                                <p className="mt-2 pt-2 border-t border-slate-700 text-slate-400">Industry benchmarks: leasehold 10–15%, freehold 5–8%. Estimate only.</p>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                                </div>
                            )}
                            </div>
                        </div>
                        </td>
                        <td className="p-5 text-xs text-slate-600 space-y-1.5">
                            {/* Beds */}
                            <div className="flex items-center gap-2">
                                <Home size={12} className="text-slate-400"/>
                                <span className="font-medium text-slate-900">
                                    {villa.bedrooms ? `${villa.bedrooms} Bed` : '? Bed'}
                                    {villa.beds_baths && ` / ${villa.beds_baths.split('/')[1]?.trim().split(' ')[0] || '?'} Bath`}
                                </span>
                            </div>
                            
                            {/* Lease Type / Years - SMART DISPLAY: use features first, then lease_years, show years remaining for leasehold */}
                            <div className="flex items-center gap-2">
                                <Calendar size={12} className="text-slate-400"/>
                                {(() => {
                                    const f = (villa.features || "").trim();
                                    const years = Number(villa.lease_years) || 0;
                                    const isFreehold = f.includes("Freehold") || f.includes("Hak Milik") || years === 999;
                                    const isLeasehold = f.includes("Leasehold") || f.includes("Hak Sewa") || (years > 0 && years < 999);
                                    if (isFreehold) return <span className="font-bold text-green-600">Freehold (Hak Milik)</span>;
                                    if (isLeasehold) {
                                        const label = f ? "Leasehold (Hak Sewa)" : "Leasehold";
                                        const yearsLabel = years > 0 && years < 999 ? ` – ${years} years remaining` : " – years not stated";
                                        return <span className="text-slate-700">{label}{yearsLabel}</span>;
                                    }
                                    if (years > 0 && years < 999) return <span className="text-slate-700">{years} years remaining</span>;
                                    if (years === 999) return <span className="font-bold text-green-600">Freehold</span>;
                                    return <span className="text-slate-400">Unverified Status</span>;
                                })()}
                            </div>

                            {/* Land Size */}
                            <div className="flex items-center gap-2">
                                <Ruler size={12} className="text-slate-400"/> 
                                <span>Land: <span className="font-medium">{villa.land_size || '?'}</span> m²</span>
                            </div>

                            {/* Building Size - always show row; use — when missing */}
                            <div className="flex items-center gap-2">
                                <Layers size={12} className="text-slate-400"/> 
                                <span>Build: <span className="font-medium">{villa.building_size > 0 ? `${villa.building_size} m²` : '—'}</span></span>
                            </div>
                        </td>
                        <td className="p-5 text-right">
                        <button onClick={() => setSelectedVilla(villa)} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-bold px-4 py-2 rounded-lg transition-all">
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

      {/* MODAL */}
      {selectedVilla && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setSelectedVilla(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck className="text-blue-600" size={32} /></div>
              <h2 className="text-2xl font-bold mb-2">Unlock Full Audit</h2>
              <p className="text-slate-500 text-sm mb-6">Enter your professional email to unlock the original source link and our 5-year ROI projection for <span className="font-semibold text-slate-800">{selectedVilla.villa_name}</span>.</p>
              <form onSubmit={handleLeadCapture} className="space-y-4">
                <input type="email" required placeholder="name@company.com" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={email} onChange={(e) => setEmail(e.target.value)} />
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-200 disabled:opacity-50">{isSubmitting ? 'Verifying...' : 'Unlock Now'}</button>
                <p className="text-[10px] text-slate-400">By clicking, you agree to our Investor Privacy Terms.</p>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div><span className="font-bold text-slate-700">Bali Villa Truth</span><span className="mx-2">•</span><span>Independent villa investment analysis</span></div>
          <div className="flex items-center gap-4"><a href="#" className="hover:text-blue-600 transition-colors">Contact</a><span className="text-slate-300">|</span><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></div>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-4">© 2026 Bali Villa Truth. This site provides informational analysis only.</p>
      </footer>
    </div>
  );
}