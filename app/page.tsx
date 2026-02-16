'use client';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MapPin, Ruler, Calendar, Lock, X, ShieldCheck, Info, TrendingUp, Search, AlertTriangle, Filter, DollarSign, Percent, Home, Layers, ArrowUpDown, Bed, Bath, Map, LayoutList } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('listings_tracker')
        .select('*')
        .eq('status', 'audited')
        .gt('last_price', 0)
        .limit(5000); // Default is 1000, we need all listings
      
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

  // --- Price per sqm in display currency ---
  const getPricePerSqm = (villa: any): string => {
    const priceUSD = getPriceUSD(villa);
    const landSize = parseInt(villa.land_size) || 0;
    if (!priceUSD || !landSize) return '—';
    const perSqmUSD = priceUSD / landSize;
    const r = rates[displayCurrency];
    if (!r) return `${displayCurrency} ${Math.round(perSqmUSD).toLocaleString()}`;
    const value = displayCurrency === 'USD' ? perSqmUSD : perSqmUSD * r;
    if (displayCurrency === 'IDR') return `IDR ${Math.round(value).toLocaleString()}`;
    return `${displayCurrency} ${Math.round(value).toLocaleString()}`;
  };

  // --- Price change badge: show ↓12% or ↑5% when previous_price exists ---
  const getPriceChangeBadge = (villa: any): { text: string; direction: 'down' | 'up' | null } => {
    const prev = Number(villa.previous_price) || 0;
    const curr = Number(villa.last_price) || 0;
    if (!prev || !curr || prev === curr) return { text: '', direction: null };
    const pctChange = ((curr - prev) / prev) * 100;
    if (Math.abs(pctChange) < 1) return { text: '', direction: null }; // Ignore tiny changes
    const direction = pctChange < 0 ? 'down' : 'up';
    const symbol = direction === 'down' ? '↓' : '↑';
    return { text: `${symbol} ${Math.abs(pctChange).toFixed(0)}%`, direction };
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
      const landA = parseInt(a.land_size) || 0;
      const landB = parseInt(b.land_size) || 0;
      const psmA = landA > 0 ? priceA / landA : 0;
      const psmB = landB > 0 ? priceB / landB : 0;
      switch (sortOption) {
        case 'price-asc': return priceA - priceB;
        case 'price-desc': return priceB - priceA;
        case 'roi-asc': return roiA - roiB;
        case 'roi-desc': return roiB - roiA;
        case 'psm-asc': return psmA - psmB;
        case 'psm-desc': return psmB - psmA;
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
                        <option value="psm-asc">Price/m²: Low → High</option>
                        <option value="psm-desc">Price/m²: High → Low</option>
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
         <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">
                <AlertTriangle size={10} className="text-amber-500"/> {flaggedCount} High-ROI
            </div>
            <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden">
              <button onClick={() => setViewMode('table')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'table' ? 'bg-blue-50 text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}>
                <LayoutList size={12} /> Table
              </button>
              <button onClick={() => setViewMode('map')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'map' ? 'bg-blue-50 text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}>
                <Map size={12} /> Map
              </button>
            </div>
         </div>
      </div>

      {/* MAP VIEW */}
      {viewMode === 'map' && (
        <div className="max-w-7xl mx-auto mb-8">
          <BaliMapView listings={processedListings} displayCurrency={displayCurrency} rates={rates} />
        </div>
      )}

      {/* TABLE */}
      {viewMode === 'table' && (
      <main className="max-w-7xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                <th className="p-5">Asset & Location</th>
                <th className="p-5">Price ({displayCurrency})</th>
                <th className="p-5">Price/m²</th>
                <th className="p-5 text-center">Verified ROI</th>
                <th className="p-5">Specs</th>
                <th className="p-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedListings.length === 0 ? (
                  <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400">
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
                        <div className="flex items-center gap-3">
                          {villa.thumbnail_url ? (
                            <img src={villa.thumbnail_url} alt="" className="w-16 h-12 object-cover rounded-lg flex-shrink-0 bg-slate-100" loading="lazy" />
                          ) : (
                            <div className="w-16 h-12 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                              <Home size={16} className="text-slate-300" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 mb-1 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                                {villa.villa_name || 'Luxury Villa'}
                                {isHighRoi && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-bold border border-amber-200">HOT DEAL</span>}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                <MapPin size={12} className="text-blue-500" /> {villa.location || "Bali"}
                            </div>
                          </div>
                        </div>
                        </td>
                        <td className="p-5 font-mono text-slate-600 font-semibold text-sm">
                         <div className="flex items-center gap-2">
                           {formatPriceInCurrency(villa)}
                           {(() => {
                             const badge = getPriceChangeBadge(villa);
                             if (!badge.direction) return null;
                             return (
                               <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                 badge.direction === 'down'
                                   ? 'bg-green-100 text-green-700 border border-green-200'
                                   : 'bg-red-100 text-red-600 border border-red-200'
                               }`}>
                                 {badge.text}
                               </span>
                             );
                           })()}
                         </div>
                        </td>
                        <td className="p-5 font-mono text-slate-500 text-xs">
                         {getPricePerSqm(villa)}
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
      )}

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

// --- AREA COORDINATES for Bali Map ---
const AREA_COORDS: Record<string, [number, number]> = {
  'Canggu': [-8.6478, 115.1385],
  'Pererenan': [-8.6350, 115.1050],
  'Berawa': [-8.6580, 115.1470],
  'Seminyak': [-8.6880, 115.1600],
  'Kerobokan': [-8.6700, 115.1550],
  'Uluwatu': [-8.8291, 115.0849],
  'Bingin': [-8.8050, 115.1000],
  'Ungasan': [-8.8100, 115.1700],
  'Nusa Dua': [-8.8000, 115.2300],
  'Jimbaran': [-8.7700, 115.1650],
  'Ubud': [-8.5069, 115.2625],
  'Sanur': [-8.6900, 115.2600],
  'Tabanan': [-8.5400, 115.0000],
  'Seseh': [-8.6200, 115.0900],
  'Cemagi': [-8.6250, 115.0800],
  'Kedungu': [-8.5900, 115.0500],
  'Amed': [-8.3500, 115.6600],
  'Lovina': [-8.1500, 115.0200],
  'North Bali': [-8.2000, 115.1000],
  'Lombok': [-8.5800, 116.1000],
  'Nusa Penida': [-8.7300, 115.5400],
};

function BaliMapView({ listings, displayCurrency, rates }: { listings: any[]; displayCurrency: string; rates: Record<string, number> }) {
  const [mapLoaded, setMapLoaded] = useState(false);

  // Group listings by location
  const areaGroups = useMemo(() => {
    const groups: Record<string, { count: number; avgRoi: number; avgPriceUSD: number; listings: any[] }> = {};
    listings.forEach(v => {
      const loc = v.location || 'Other';
      if (!groups[loc]) groups[loc] = { count: 0, avgRoi: 0, avgPriceUSD: 0, listings: [] };
      groups[loc].count++;
      groups[loc].listings.push(v);
    });
    // Calculate averages
    Object.keys(groups).forEach(loc => {
      const g = groups[loc];
      const totalRoi = g.listings.reduce((sum: number, v: any) => sum + (v.projected_roi || 0), 0);
      const totalPrice = g.listings.reduce((sum: number, v: any) => {
        const desc = (v.price_description || '').trim();
        const match = desc.match(/^(IDR|USD|AUD|EUR|SGD)\s*([\d,.\s]+)/i);
        let priceUSD = 0;
        if (match) {
          const amount = parseFloat(match[2].replace(/\s|,/g, '')) || 0;
          const cur = match[1].toUpperCase();
          const r = rates[cur];
          priceUSD = cur === 'USD' ? amount : (r && r > 0 ? amount / r : amount);
        } else {
          const p = Number(v.last_price) || 0;
          priceUSD = p >= 1e6 ? p / (rates['IDR'] || 16782) : p;
        }
        return sum + priceUSD;
      }, 0);
      g.avgRoi = g.count > 0 ? totalRoi / g.count : 0;
      g.avgPriceUSD = g.count > 0 ? totalPrice / g.count : 0;
    });
    return groups;
  }, [listings, rates]);

  useEffect(() => {
    // Dynamically load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Dynamically load Leaflet JS
    const loadLeaflet = () => {
      return new Promise<void>((resolve) => {
        if ((window as any).L) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    };

    loadLeaflet().then(() => {
      setMapLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!mapLoaded) return;
    const L = (window as any).L;
    const container = document.getElementById('bali-map');
    if (!container || !L) return;

    // Clean up any previous map instance properly
    if ((container as any)._leafletMap) {
      (container as any)._leafletMap.remove();
      (container as any)._leafletMap = null;
    }

    const map = L.map('bali-map', { zoomControl: true }).setView([-8.65, 115.15], 10);
    (container as any)._leafletMap = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Force Leaflet to recalculate container size after render
    setTimeout(() => { map.invalidateSize(); }, 100);

    // Add area markers
    Object.entries(areaGroups).forEach(([loc, data]) => {
      const coords = AREA_COORDS[loc];
      if (!coords) return;

      const radius = Math.max(12, Math.min(30, 8 + data.count * 0.5));
      const roiColor = data.avgRoi >= 15 ? '#16a34a' : data.avgRoi >= 10 ? '#2563eb' : '#64748b';

      const circle = L.circleMarker(coords, {
        radius,
        fillColor: roiColor,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(map);

      // Format average price for popup
      const avgPriceFormatted = displayCurrency === 'IDR'
        ? `IDR ${Math.round(data.avgPriceUSD * (rates['IDR'] || 16782)).toLocaleString()}`
        : `${displayCurrency} ${Math.round(displayCurrency === 'USD' ? data.avgPriceUSD : data.avgPriceUSD * (rates[displayCurrency] || 1)).toLocaleString()}`;

      circle.bindPopup(`
        <div style="font-family: system-ui; min-width: 160px;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px; color: #1e293b;">${loc}</div>
          <div style="font-size: 12px; color: #64748b; line-height: 1.8;">
            <div><strong>${data.count}</strong> listings</div>
            <div>Avg ROI: <strong style="color: ${roiColor}">${data.avgRoi.toFixed(1)}%</strong></div>
            <div>Avg Price: <strong>${avgPriceFormatted}</strong></div>
          </div>
        </div>
      `);

      // Add label
      const label = L.divIcon({
        className: 'area-label',
        html: `<div style="background: ${roiColor}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; font-family: system-ui; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">${loc} (${data.count})</div>`,
        iconSize: [0, 0],
        iconAnchor: [-radius - 4, radius / 2],
      });
      L.marker(coords, { icon: label, interactive: false }).addTo(map);
    });

    return () => {
      map.remove();
      if (container) (container as any)._leafletMap = null;
    };
  }, [mapLoaded, areaGroups, displayCurrency, rates]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Map size={16} className="text-blue-500" /> Area Overview
        </div>
        <div className="flex gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block"></span> ROI ≥ 15%</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> ROI 10-15%</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block"></span> ROI &lt; 10%</span>
        </div>
      </div>
      <div id="bali-map" style={{ height: '500px', width: '100%' }}></div>
    </div>
  );
}