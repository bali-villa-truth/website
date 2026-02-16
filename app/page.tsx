'use client';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MapPin, Ruler, Calendar, Lock, X, ShieldCheck, Info, TrendingUp, Search, AlertTriangle, Filter, DollarSign, Percent, Home, Layers, ArrowUpDown, Bed, Bath, Map, LayoutList, ShieldAlert, Eye } from 'lucide-react';

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
  const [showMap, setShowMap] = useState(false);
  const [hoveredListingUrl, setHoveredListingUrl] = useState<string | null>(null);

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
    if (!priceUSD || !landSize) return 'â€”';
    const perSqmUSD = priceUSD / landSize;
    const r = rates[displayCurrency];
    if (!r) return `${displayCurrency} ${Math.round(perSqmUSD).toLocaleString()}`;
    const value = displayCurrency === 'USD' ? perSqmUSD : perSqmUSD * r;
    if (displayCurrency === 'IDR') return `IDR ${Math.round(value).toLocaleString()}`;
    return `${displayCurrency} ${Math.round(value).toLocaleString()}`;
  };

  // --- Price change badge: show â†“12% or â†‘5% when previous_price exists ---
  const getPriceChangeBadge = (villa: any): { text: string; direction: 'down' | 'up' | null } => {
    const prev = Number(villa.previous_price) || 0;
    const curr = Number(villa.last_price) || 0;
    if (!prev || !curr || prev === curr) return { text: '', direction: null };
    const pctChange = ((curr - prev) / prev) * 100;
    if (Math.abs(pctChange) < 1) return { text: '', direction: null }; // Ignore tiny changes
    const direction = pctChange < 0 ? 'down' : 'up';
    const symbol = direction === 'down' ? 'â†“' : 'â†‘';
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

  // --- BVT NET ROI: Strip out real-world costs agents never mention ---
  const COST_BREAKDOWN = {
    ota: { label: 'OTA / Booking Fees', rate: 0.18, note: 'Airbnb/Booking.com take 15â€“20%' },
    mgmt: { label: 'Property Management', rate: 0.18, note: 'On-ground manager, cleaning, laundry' },
    tax: { label: 'Indonesian Tax (PPh)', rate: 0.10, note: '10% tax on rental income' },
    maint: { label: 'Maintenance & Repairs', rate: 0.05, note: 'Tropical wear, pool, AC, pest control' },
  };
  const TOTAL_COST_RATIO = Object.values(COST_BREAKDOWN).reduce((sum, c) => sum + c.rate, 0); // ~0.51

  const calculateNetROI = (villa: any): { netRoi: number; leaseDepreciation: number; grossRevPct: number } => {
    const agentRoi = villa.projected_roi || 0;
    // Agent ROI = gross annual revenue / price Ã— 100
    // Net revenue after costs = gross Ã— (1 - TOTAL_COST_RATIO)
    const netRevPct = agentRoi * (1 - TOTAL_COST_RATIO);

    // Leasehold depreciation: your asset goes to $0 at lease end
    const features = (villa.features || '').toLowerCase();
    const years = Number(villa.lease_years) || 0;
    const isFreehold = features.includes('freehold') || features.includes('hak milik') || years === 999;
    let leaseDepreciation = 0;
    if (!isFreehold && years > 0 && years < 999) {
      leaseDepreciation = (1 / years) * 100; // annual depreciation as % of purchase price
    }

    return {
      netRoi: Math.max(netRevPct - leaseDepreciation, -10),
      leaseDepreciation,
      grossRevPct: agentRoi,
    };
  };

  // --- RED FLAGS: Detect suspicious/misleading listings ---
  type RedFlag = { level: 'warning' | 'danger'; label: string; detail: string };

  const getRedFlags = (villa: any): RedFlag[] => {
    const flags: RedFlag[] = [];
    const roi = villa.projected_roi || 0;
    const features = (villa.features || '').toLowerCase();
    const years = Number(villa.lease_years) || 0;
    const isFreehold = features.includes('freehold') || features.includes('hak milik') || years === 999;
    const priceUSD = getPriceUSD(villa);
    const nightly = getDisplayNightly(villa);
    const { netRoi } = calculateNetROI(villa);

    // Agent claims > 25% ROI â€” almost always inflated
    if (roi > 25) {
      flags.push({ level: 'danger', label: 'Inflated ROI', detail: `Agent claims ${roi.toFixed(0)}% ROI. After real costs, BVT estimates ~${netRoi.toFixed(1)}%. Be very skeptical.` });
    } else if (roi > 18) {
      flags.push({ level: 'warning', label: 'Optimistic ROI', detail: `${roi.toFixed(0)}% is above Bali averages. After costs, closer to ${netRoi.toFixed(1)}%.` });
    }

    // Short lease with no depreciation awareness
    if (!isFreehold && years > 0 && years <= 15) {
      flags.push({ level: 'danger', label: 'Short Lease', detail: `Only ${years} years remaining. Your asset depreciates ${(100/years).toFixed(1)}% per year toward $0.` });
    } else if (!isFreehold && years > 15 && years <= 25) {
      flags.push({ level: 'warning', label: 'Lease Decay', detail: `${years}yr lease means ${(100/years).toFixed(1)}%/yr depreciation. Factor this into real returns.` });
    }

    // Price-to-nightly rate mismatch (cheap property claiming high nightly rate)
    if (priceUSD > 0 && nightly > 0) {
      const impliedAnnualGross = nightly * 365 * 0.65; // 65% occupancy
      const impliedRoi = (impliedAnnualGross / priceUSD) * 100;
      if (impliedRoi > 30 && priceUSD < 200000) {
        flags.push({ level: 'warning', label: 'Rate vs Price Gap', detail: `$${nightly}/night on a $${Math.round(priceUSD/1000)}k property implies unrealistic occupancy or rates.` });
      }
    }

    return flags;
  };

  const flaggedCount = listings.filter(v => getRedFlags(v).length > 0).length;

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
                        <option value="roi-desc">ROI: High â†’ Low</option>
                        <option value="roi-asc">ROI: Low â†’ High</option>
                        <option value="price-asc">Price: Low â†’ High</option>
                        <option value="price-desc">Price: High â†’ Low</option>
                        <option value="psm-asc">Price/mÂ²: Low â†’ High</option>
                        <option value="psm-desc">Price/mÂ²: High â†’ Low</option>
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
                    <input type="number" placeholder="Min Land mÂ²" value={filterLandSize === 0 ? '' : filterLandSize} onChange={(e) => setFilterLandSize(Number(e.target.value))} className="bg-transparent text-sm outline-none w-24 placeholder-slate-500" />
                </div>

                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 w-full sm:w-auto">
                    <Layers size={14} className="text-slate-400" />
                    <input type="number" placeholder="Min Build mÂ²" value={filterBuildSize === 0 ? '' : filterBuildSize} onChange={(e) => setFilterBuildSize(Number(e.target.value))} className="bg-transparent text-sm outline-none w-24 placeholder-slate-500" />
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
      <div className={`${showMap ? 'max-w-[100rem]' : 'max-w-7xl'} mx-auto mb-4 flex justify-between items-center px-2 transition-all`}>
         <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Showing {processedListings.length} Properties</p>
         <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                <ShieldAlert size={10}/> {flaggedCount} Flagged
            </div>
            <button onClick={() => setShowMap(!showMap)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${showMap ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'}`}>
              <Map size={12} /> {showMap ? 'Hide Map' : 'Show Map'}
            </button>
         </div>
      </div>

      {/* SPLIT LAYOUT: TABLE + MAP */}
      <div className={`${showMap ? 'max-w-[100rem]' : 'max-w-7xl'} mx-auto flex gap-4 transition-all`}>
      {/* TABLE */}
      <main className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all ${showMap ? 'w-[60%] flex-shrink-0' : 'w-full'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                <th className="p-5">Asset & Location</th>
                <th className="p-5">Price ({displayCurrency})</th>
                <th className="p-5">Price/mÂ²</th>
                <th className="p-5 text-center">ROI Analysis</th>
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
                    const redFlags = getRedFlags(villa);
                    const { netRoi, leaseDepreciation } = calculateNetROI(villa);
                    const hasDanger = redFlags.some(f => f.level === 'danger');
                    const hasWarning = redFlags.length > 0;

                    return (
                    <tr key={villa.id} className={`hover:bg-blue-50/50 transition-colors group ${hoveredListingUrl === villa.url ? 'bg-blue-50/70' : ''}`} onMouseEnter={() => setHoveredListingUrl(villa.url)} onMouseLeave={() => setHoveredListingUrl(null)}>
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
                                {hasDanger && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[9px] font-bold border border-red-200 flex items-center gap-0.5"><ShieldAlert size={9}/> VERIFY</span>}
                                {!hasDanger && hasWarning && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-bold border border-amber-200 flex items-center gap-0.5"><AlertTriangle size={9}/> CAUTION</span>}
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
                            <div className="relative cursor-help text-center" onMouseEnter={() => setHoveredRoi(villa.id)} onMouseLeave={() => setHoveredRoi(n][
_O‚ˆËÊˆ••Y\ÝY“ÒHHH™X[[X™\ˆ
‹ßBˆÜ[ˆÛ\ÜÓ˜[YO^ØLÈKLH›Ý[™YY[^\ÛH›ÛX›Û›Ü™\ˆ›^][\ËXÙ[\ˆØ\LH\ÝYžKXÙ[\ˆËYš]^X]]È	Âˆ™]›ÚHHLˆÈ	Ø™ËYÜ™Y[‹LL^YÜ™Y[‹MÌ›Ü™\‹YÜ™Y[‹LŒ	È‚ˆ™]›ÚHHÈÈ	Ø™ËX›YKLL^X›YKMÌ›Ü™\‹X›YKLŒ	È‚ˆ™]›ÚHHÈ	Ø™Ë\Û]KLL^\Û]KMÌ›Ü™\‹\Û]KLŒ	È‚ˆ	Ø™Ë\™YLL^\™YMŒ›Ü™\‹\™YLŒ	ÂˆXO‚ˆÛ™]›ÚKÑš^Y
J_IH^YHÚ^™O^ÌLHÛ\ÜÓ˜[YOH›ÜXÚ]KMLˆÏ‚ˆÜÜ[‚ˆÛ\ÜÓ˜[YOH^VÌLH^\Û]KM]LH[™K]›ÝYÚÜXÚ]KMŒ›Û[[Û›ÈYÙ[ˆÝš[Kœ›Ú™XÝYÜ›ÚOËÑš^Y
J_IOÜ‚ˆÛ\ÜÓ˜[YOH^VÎ\H^\Û]KML›Û[[Û›È‰ÙÙ]\Ü^SšYÚJš[J_KÛ8 (ˆÓX]œ›Ý[™
Ù]\Ü^SØØÝ\[˜ÞJš[JJ_IHØØÏÜ‚‚ˆËÊˆ™Y›YÈ˜YÙ\È[™\ˆ“ÒH
‹ßBˆÜ™Y›YÜË›[™Ýˆ	‰ˆ
ˆ]ˆÛ\ÜÓ˜[YOH™›^›^]Ü˜\\ÝYžKXÙ[\ˆØ\LH]LKH‚ˆÜ™Y›YÜË›X\

›YËY
HOˆ
ˆÜ[ˆÙ^O^ÚYHÛ\ÜÓ˜[YO^ØLKHKLH›Ý[™Y^VÎH›ÛX›Û	Ù›YË›]™[OOH	Ù[™Ù\‰ÈÈ	Ø™Ë\™YML^\™YMŒ›Ü™\ˆ›Ü™\‹\™YLŒ	Èˆ	Ø™ËX[X™\‹ML^X[X™\‹MŒ›Ü™\ˆ›Ü™\‹X[X™\‹LŒ	ßXO‚ˆÙ›YË›X™[BˆÜÜ[‚ˆ
J_BˆÙ]‚ˆ
_B‚ˆËÊˆ[š[˜ÙYÛÛ\Ú][ÛÜÝœ™XZÙÝÛˆ
‹ßBˆÚÝ™\™Y›ÚHOOHš[KšY	‰ˆ
ˆ]ˆÛ\ÜÓ˜[YOH˜XœÛÛ]H‹ML›ÝÛKY[YLKÌˆ]˜[œÛ]K^LKÌˆX‹LˆËN™Ë\Û]KNL^]Ú]H^VÌLH›Ý[™Y[ÈLÈÚYÝË^Ú[\‹Y]™[Ë[›Û™H‚ˆ]ˆÛ\ÜÓ˜[YOH™›ÛX›ÛX‹Lˆ^X›YKM›^][\ËXÙ[\ˆØ\LH^YHÚ^™O^ÌL_KÏˆ••™X[]HÚXÚÏÙ]‚‚ˆËÊˆYÙ[œÈ••ÛÛ\\š\ÛÛˆ
‹ßBˆ]ˆÛ\ÜÓ˜[YOH›X‹Lˆ‹Lˆ›Ü™\‹Xˆ›Ü™\‹\Û]KMÌ›^Ø\M‚ˆ]ˆÛ\ÜÓ˜[YOH™›^LH^XÙ[\ˆ‚ˆ]ˆÛ\ÜÓ˜[YOH^\Û]KML^VÎ\HX‹LHYÙ[ÛZ[\ÏÙ]‚ˆ]ˆÛ\ÜÓ˜[YOH^[È›ÛX›Û^\Û]KM[™K]›ÝYÚžÝš[Kœ›Ú™XÝYÜ›ÚOËÑš^Y
J_IOÙ]‚ˆÙ]‚ˆ]ˆÛ\ÜÓ˜[YOH™›^LH^XÙ[\ˆ‚ˆ]ˆÛ\ÜÓ˜[YOH^X›YKM^VÎ\HX‹LH›ÛX›Û••Y\ÝYÙ]‚ˆ]ˆÛ\ÜÓ˜[YO^Ø^[È›ÛX›Û	Û™]›ÚHHÈÈ	Ý^Y[Y\˜[M	Èˆ™]›ÚHHÈ	Ý^X[X™\‹M	Èˆ	Ý^\™YM	ßXOžÛ™]›ÚKÑš^Y
J_IOÙ]‚ˆÙ]‚ˆÙ]‚‚ˆËÊˆ™]™[YH]H
‹ßBˆ]ˆÛ\ÜÓ˜[YOH›X‹Lˆ‹Lˆ›Ü™\‹Xˆ›Ü™\‹\Û]KMÌ‚ˆ]ˆÛ\ÜÓ˜[YOH™›^\ÝYžKX™]ÙY[ˆÜ[‘\ÝˆšYÚH˜]NÜÜ[ˆÜ[ˆÛ\ÜÓ˜[YOH^Y[Y\˜[M›Û[[Û›È‰ÙÙ]\Ü^SšYÚJš[J_OÜÜ[Ù]‚ˆ]ˆÛ\ÜÓ˜[YOH™›^\ÝYžKX™]ÙY[ˆÜ[‘\ÝˆØØÝ\[˜ÞNÜÜ[ˆÜ[ˆÛ\ÜÓ˜[YOH^X›YKM›Û[[Û›ÈžÓX]œ›Ý[™
Ù]\Ü^SØØÝ\[˜ÞJš[JJ_IOÜÜ[Ù]‚ˆÙ]‚‚ˆËÊˆÛÜÝœ™XZÙÝÛˆ
‹ßBˆ]ˆÛ\ÜÓ˜[YOH›X‹Lˆ‹Lˆ›Ü™\‹Xˆ›Ü™\‹\Û]KMÌ‚ˆ]ˆÛ\ÜÓ˜[YOH^\Û]KML›ÛX›ÛX‹LHÛÜÝÈYÙ[ÈÛ‰˜\ÜÎÝY[[ÛŽÙ]‚ˆÓØš™XÝ™[šY\ÊÓÔÕÐ”‘PRÑÕÓŠK›X\

ÚÙ^KÛÜÝJHOˆ
ˆ]ˆÙ^O^ÚÙ^_HÛ\ÜÓ˜[YOH™›^\ÝYžKX™]ÙY[ˆ‚ˆÜ[ˆÛ\ÜÓ˜[YOH^\Û]KMžØÛÜÝ›X™[OÜÜ[‚ˆÜ[ˆÛ\ÜÓ˜[YOH^\™YM›Û[[Û›È‹^ÊÛÜÝœ˜]H
ˆL
KÑš^Y

_IOÜÜ[‚ˆÙ]‚ˆ
J_BˆÛX\ÙQ\™XÚX][Ûˆˆ	‰ˆ
ˆ]ˆÛ\ÜÓ˜[YOH™›^\ÝYžKX™]ÙY[ˆ]LHLH›Ü™\‹]›Ü™\‹\Û]KN‚ˆÜ[ˆÛ\ÜÓ˜[YOH^[Ü˜[™ÙKM“X\ÙH\™XÚX][ÛÜÜ[‚ˆÜ[ˆÛ\ÜÓ˜[YOH^\™YM›Û[[Û›È‹^ÛX\ÙQ\™XÚX][Û‹Ñš^Y
J_IOÜÜ[‚ˆÙ]‚ˆ
_Bˆ]ˆÛ\ÜÓ˜[YOH™›^\ÝYžKX™]ÙY[ˆ]LHLH›Ü™\‹]›Ü™\‹\Û]KMÌ›ÛX›Û‚ˆÜ[•Ý[™]™[YHÜÝÜÜ[‚ˆÜ[ˆÛ\ÜÓ˜[YOH^\™YM›Û[[Û›ÈžÊ
ÕSÐÓÔÕÔUSÊH
ˆL
KÑš^Y

_I^ÛX\ÙQ\™XÚX][ÛˆˆÈ
È	ÛX\ÙQ\™XÚX][Û‹Ñš^Y
J_IXˆ	ÉßOÜÜ[‚ˆÙ]‚ˆÙ]‚‚ˆËÊˆ™Y›YÜÈ[ˆÛÛ\
‹ßBˆÜ™Y›YÜË›[™Ýˆ	‰ˆ
ˆ]ˆÛ\ÜÓ˜[YOH›X‹Lˆ‹Lˆ›Ü™\‹Xˆ›Ü™\‹\Û]KMÌ‚ˆÜ™Y›YÜË›X\

›YËY
HOˆ
ˆ]ˆÙ^O^ÚYHÛ\ÜÓ˜[YO^Ø›^][\Ë\Ý\Ø\LKHX‹LH	Ù›YË›]™[OOH	Ù[™Ù\‰ÈÈ	Ý^\™YM	Èˆ	Ý^X[X™\‹M	ßXO‚ˆ[\šX[™ÛHÚ^™O^ÌLHÛ\ÜÓ˜[YOH›]LH›^\Úš[šËLˆÏ‚ˆÜ[žÙ›YË™]Z[OÜÜ[‚ˆÙ]‚ˆ
J_BˆÙ]‚ˆ
_B‚ˆËÊˆ˜]H˜XÝÜœÈœ›ÛHØÜ˜\\ˆ
‹ßBˆÜ˜]Q˜XÝÜœË›[™Ýˆ	‰ˆ
ˆ]ˆÛ\ÜÓ˜[YOH›X‹Lˆ‹Lˆ›Ü™\‹Xˆ›Ü™\‹\Û]KMÌ‚ˆ]ˆÛ\ÜÓ˜[YOH^\Û]KML›ÛX›ÛX‹LH”˜]H˜XÝÜœÎÙ]‚ˆÜ˜]Q˜XÝÜœË›X\

˜XÝÜ‹Y
HOˆ
ˆ]ˆÙ^O^ÚYHÛ\ÜÓ˜[YOH™›^][\Ë\Ý\Ø\LKHÜ[ˆÛ\ÜÓ˜[YOH^X›YKM]LH¸ (ÜÜ[Ü[ˆÛ\ÜÓ˜[YOH^\Û]KLÌžÙ˜XÝÜŸOÜÜ[Ù]‚ˆ
J_BˆÙ]‚ˆ
_B‚ˆÛ\ÜÓ˜[YOH^\Û]KML][XÈ™[˜ÚX\šÜÎˆX\ÙZÛ8 $ÌL‰H™]œ™YZÛ8 $ÍÉH™]ˆ••YXÝÈ™X[Ü\˜][™ÈÛÜÝÈœ›ÛHYÙ[šYÝ\™\ËÜ‚ˆ]ˆÛ\ÜÓ˜[YOH˜XœÛÛ]HÜY[YLKÌˆ]˜[œÛ]K^LKÌˆ›Ü™\‹N›Ü™\‹]˜[œÜ\™[›Ü™\‹]\Û]KNLÙ]‚ˆÙ]‚ˆ
_BˆÙ]‚ˆÙ]‚ˆÝ‚ˆÛ\ÜÓ˜[YOHœMH^^È^\Û]KMŒÜXÙK^KLKH‚ˆËÊˆ™YÈ
‹ßBˆ]ˆÛ\ÜÓ˜[YOH™›^][\ËXÙ[\ˆØ\Lˆ‚ˆÛYHÚ^™O^ÌLŸHÛ\ÜÓ˜[YOH^\Û]KM‹Ï‚ˆÜ[ˆÛ\ÜÓ˜[YOH™›Û[YY][H^\Û]KNL‚ˆÝš[K˜™Y›ÛÛ\ÈÈ	Ýš[K˜™Y›ÛÛ\ßH™Yˆ	ÏÈ™Y	ßBˆÝš[K˜™Y×Ø˜]È	‰ˆÈ	Ýš[K˜™Y×Ø˜]ËœÜ]
	ËÉÊVÌWOËš[J
KœÜ]
	È	ÊVÌH	ÏÉßH˜]BˆÜÜ[‚ˆÙ]‚ˆˆËÊˆX\ÙH\HÈYX\œÈHÓPT•TÔVNˆ\ÙH™X]\™\Èš\œÝ[ˆX\ÙWÞYX\œËÚÝÈYX\œÈ™[XZ[š[™È›ÜˆX\ÙZÛ
‹ßBˆ]ˆÛ\ÜÓ˜[YOH™›^][\ËXÙ[\ˆØ\Lˆ‚ˆØ[[™\ˆÚ^™O^ÌLŸHÛ\ÜÓ˜[YOH^\Û]KM‹Ï‚ˆÊ

HOˆÂˆÛÛœÝˆH
š[K™™X]\™\ÈˆŠKš[J
NÂˆÛÛœÝYX\œÈH[X™\Šš[K›X\ÙWÞYX\œÊHÂˆÛÛœÝ\Ñœ™YZÛH‹š[˜ÛY\Ê‘œ™YZÛŠH‹š[˜ÛY\Ê’ZÈZ[ZÈŠHYX\œÈOOHNNNÂˆÛÛœÝ\ÓX\ÙZÛH‹š[˜ÛY\Ê“X\ÙZÛŠH‹š[˜ÛY\Ê’ZÈÙ]ØHŠH
YX\œÈˆ	‰ˆYX\œÈNNJNÂˆYˆ
\Ñœ™YZÛ
H™]\›ˆÜ[ˆÛ\ÜÓ˜[YOH™›ÛX›Û^YÜ™Y[‹MŒ‘œ™YZÛ
ZÈZ[ZÊOÜÜ[ŽÂˆYˆ
\ÓX\ÙZÛ
HÂˆÛÛœÝX™[HˆÈ“X\ÙZÛ
ZÈÙ]ØJHˆˆ“X\ÙZÛŽÂˆÛÛœÝYX\œÓX™[HYX\œÈˆ	‰ˆYX\œÈNNHÈ8 $È	ÞYX\œßHYX\œÈ™[XZ[š[™Øˆˆ8 $ÈYX\œÈ›ÝÝ]YŽÂˆ™]\›ˆÜ[ˆÛ\ÜÓ˜[YOH^\Û]KMÌžÛX™[^ÞYX\œÓX™[OÜÜ[ŽÂˆBˆYˆ
YX\œÈˆ	‰ˆYX\œÈNNJH™]\›ˆÜ[ˆÛ\ÜÓ˜[YOH^\Û]KMÌžÞYX\œßHYX\œÈ™[XZ[š[™ÏÜÜ[ŽÂˆYˆ
YX\œÈOOHNNJH™]\›ˆÜ[ˆÛ\ÜÓ˜[YOH™›ÛX›Û^YÜ™Y[‹MŒ‘œ™YZÛÜÜ[ŽÂˆ™]\›ˆÜ[ˆÛ\ÜÓ˜[YOH^\Û]KM•[™\šYšYYÝ]\ÏÜÜ[ŽÂˆJJ
_BˆÙ]‚‚ˆËÊˆ[™Ú^™H
‹ßBˆ]ˆÛ\ÜÓ˜[YOH™›^][\ËXÙ[\ˆØ\Lˆ‚ˆ[\ˆÚ^™O^ÌLŸHÛ\ÜÓ˜[YOH^\Û]KM‹ÏˆˆÜ[“[™ˆÜ[ˆÛ\ÜÓ˜[YOH™›Û[YY][HžÝš[K›[™ÜÚ^™H	ÏÉßOÜÜ[ˆp¬ÜÜ[‚ˆÙ]‚‚ˆËÊˆZ[[™ÈÚ^™HH[Ø^\ÈÚÝÈ›ÝÎÈ\ÙH8 %Ú[ˆZ\ÜÚ[™È
‹ßBˆ]ˆÛ\ÜÓ˜[YOH™›^][\ËXÙ[\ˆØ\Lˆ‚ˆ^Y\œÈÚ^™O^ÌLŸHÛ\ÜÓ˜[YOH^\Û]KM‹ÏˆˆÜ[Z[ˆÜ[ˆÛ\ÜÓ˜[YOH™›Û[YY][HžÝš[K˜Z[[™×ÜÚ^™HˆÈ	Ýš[K˜Z[[™×ÜÚ^™_Hp¬˜ˆ	ø %	ßOÜÜ[ÜÜ[‚ˆÙ]‚ˆÝ‚ˆÛ\ÜÓ˜[YOHœMH^\šYÚ‚ˆ]ÛˆÛÛXÚÏ^Ê
HOˆÙ]Ù[XÝYš[Jš[J_HÛ\ÜÓ˜[YOHš[›[™KY›^][\ËXÙ[\ˆØ\Lˆ™Ë\Û]KNLÝ™\Ž˜™ËX›YKMŒ^]Ú]H^VÌLH›ÛX›ÛMKLˆ›Ý[™Y[È˜[œÚ][Û‹X[‚ˆØÚÈÚ^™O^ÌLŸKÏˆS“ÐÒÈÓÕTÑBˆØ]Û‚ˆÝ‚ˆÝ‚ˆ
NÂˆJBˆ
_BˆÝ›ÙO‚ˆÝX›O‚ˆÙ]‚ˆÛXZ[‚‚ˆËÊˆPTS‘S
ÝXÚÞH[Û™ÜÚYHX›JH
‹ßBˆÜÚÝÓX\	‰ˆ
ˆ]ˆÛ\ÜÓ˜[YOHËVÍ	WH›^\Úš[šËLÝXÚÞHÜMÙ[‹\Ý\ˆÝ[O^ÞÈX^ZYÚˆ	ØØ[ÊLšHœ™[JIÈ_O‚ˆ˜[SX\šY]È\Ý[™ÜÏ^Ü›ØÙ\ÜÙY\Ý[™ÜßH\Ü^PÝ\œ™[˜ÞO^Ù\Ü^PÝ\œ™[˜Þ_H˜]\Ï^Ü˜]\ßHÝ™\™Y\Ý[™Õ\›^ÚÝ™\™Y\Ý[™Õ\›HÏ‚ˆÙ]‚ˆ
_BˆÙ]žËÊˆ[™Ü]^[Ý]›^
‹ßB‚ˆËÊˆSÑS
‹ßBˆÜÙ[XÝYš[H	‰ˆ
ˆ]ˆÛ\ÜÓ˜[YOH™š^Y[œÙ]L™Ë\Û]KNLÍŒ˜XÚÙ›ÜX›\‹\ÛH‹ML›^][\ËXÙ[\ˆ\ÝYžKXÙ[\ˆM‚ˆ]ˆÛ\ÜÓ˜[YOH˜™Ë]Ú]H›Ý[™YLžÚYÝËLžX^]Ë[YËY[N™[]]™H[š[X]KZ[ˆ˜YKZ[ˆ›ÛÛKZ[ˆ\˜][Û‹LŒ‚ˆ]ÛˆÛÛXÚÏ^Ê
HOˆÙ]Ù[XÝYš[J[
_HÛ\ÜÓ˜[YOH˜XœÛÛ]HÜMšYÚM^\Û]KMÝ™\Ž^\Û]KMŒÚ^™O^ÌŒKÏØ]Û‚ˆ]ˆÛ\ÜÓ˜[YOH^XÙ[\ˆ‚ˆ]ˆÛ\ÜÓ˜[YOHËLMˆLMˆ™ËX›YKML›Ý[™YY[›^][\ËXÙ[\ˆ\ÝYžKXÙ[\ˆ^X]]ÈX‹MÚY[ÚXÚÈÛ\ÜÓ˜[YOH^X›YKMŒˆÚ^™O^ÌÌŸHÏÙ]‚ˆˆÛ\ÜÓ˜[YOH^Lž›ÛX›ÛX‹Lˆ•[›ØÚÈ[]Y]Ú‚ˆÛ\ÜÓ˜[YOH^\Û]KML^\ÛHX‹Mˆ‘[\ˆ[Ý\ˆ›Ù™\ÜÚ[Û˜[[XZ[È[›ØÚÈHÜšYÚ[˜[ÛÝ\˜ÙH[šÈ[™Ý\ˆK^YX\ˆ“ÒH›Ú™XÝ[Ûˆ›ÜˆÜ[ˆÛ\ÜÓ˜[YOH™›Û\Ù[ZX›Û^\Û]KNžÜÙ[XÝYš[Kš[WÛ˜[Y_OÜÜ[‹Ü‚ˆ›Ü›HÛ”ÝX›Z]^Ú[™SXYØ\\™_HÛ\ÜÓ˜[YOHœÜXÙK^KM‚ˆ[œ]\OH™[XZ[ˆ™\]Z\™YXÙZÛ\H›˜[YPÛÛ\[žK˜ÛÛHˆÛ\ÜÓ˜[YOHËY[MKLÈ›Ý[™Y[È›Ü™\ˆ›Ü™\‹\Û]KLŒ›ØÝ\Îœš[™ËLˆ›ØÝ\Îœš[™ËX›YKMLÝ][™K[›Û™H˜[œÚ][Û‹X[ˆ˜[YO^Ù[XZ[HÛÚ[™ÙO^ÊJHOˆÙ][XZ[
K\™Ù]˜[YJ_HÏ‚ˆ]Ûˆ\OHœÝX›Z]ˆ\ØX›Y^Ú\ÔÝX›Z][™ßHÛ\ÜÓ˜[YOHËY[™ËX›YKMŒÝ™\Ž˜™ËX›YKMÌ^]Ú]H›ÛX›ÛKLÈ›Ý[™Y[È˜[œÚ][Û‹X[ÚYÝË[ÈÚYÝËX›YKLŒ\ØX›Y›ÜXÚ]KMLžÚ\ÔÝX›Z][™ÈÈ	Õ™\šYžZ[™Ë‹‹‰Èˆ	Õ[›ØÚÈ›ÝÉßOØ]Û‚ˆÛ\ÜÓ˜[YOH^VÌLH^\Û]KMžHÛXÚÚ[™Ë[ÝHYÜ™YHÈÝ\ˆ[™\ÝÜˆš]˜XÞH\›\ËÜ‚ˆÙ›Ü›O‚ˆÙ]‚ˆÙ]‚ˆÙ]‚ˆ
_B‚ˆËÊˆ“ÓÕTˆ
‹ßBˆ›ÛÝ\ˆÛ\ÜÓ˜[YOH›X^]ËMÞ^X]]È]LLˆN›Ü™\‹]›Ü™\‹\Û]KLŒ‚ˆ]ˆÛ\ÜÓ˜[YOH™›^›^XÛÛY™›^\›ÝÈ\ÝYžKX™]ÙY[ˆ][\ËXÙ[\ˆØ\M^^È^\Û]KML‚ˆ]Ü[ˆÛ\ÜÓ˜[YOH™›ÛX›Û^\Û]KMÌ˜[Hš[H]ÜÜ[Ü[ˆÛ\ÜÓ˜[YOH›^Lˆ¸ (ÜÜ[Ü[’[™\[™[š[H[™\ÝY[[˜[\Ú\ÏÜÜ[Ù]‚ˆ]ˆÛ\ÜÓ˜[YOH™›^][\ËXÙ[\ˆØ\MH™YHˆÈˆÛ\ÜÓ˜[YOHšÝ™\Ž^X›YKMŒ˜[œÚ][Û‹XÛÛÜœÈÛÛXÝØOÜ[ˆÛ\ÜÓ˜[YOH^\Û]KLÌŸÜÜ[H™YHˆÈˆÛ\ÜÓ˜[YOHšÝ™\Ž^X›YKMŒ˜[œÚ][Û‹XÛÛÜœÈ”š]˜XÞHÛXÞOØOÙ]‚ˆÙ]‚ˆÛ\ÜÓ˜[YOH^XÙ[\ˆ^VÌLH^\Û]KM]M°ªHŒˆ˜[Hš[H]ˆ\ÈÚ]H›ÝšY\È[™›Ü›X][Û˜[[˜[\Ú\ÈÛ›KÜ‚ˆÙ›ÛÝ\‚ˆÙ]‚ˆ
NÂŸB‚‹ËÈKKHT‘PHÓÓÔ‘SUTÈ›Üˆ˜[HX\KKB˜ÛÛœÝT‘PWÐÓÓÔ‘Îˆ™XÛÜ™Ýš[™ËÛ[X™\‹[X™\—OˆHÂˆ	ÐØ[™ÙÝIÎˆËNÎLMKŒLÎWKˆ	Ô\™\™[˜[‰ÎˆËNŒÍLLMKŒLLKˆ	Ð™\˜]ØIÎˆËNNLMKŒMÌKˆ	ÔÙ[Z[žXZÉÎˆËNŽLMKŒMŒKˆ	ÒÙ\›Ø›ÚØ[‰ÎˆËNÌLMKŒMMLKˆ	Õ[]Ø]IÎˆËNŽŽLKLMKŒWKˆ	Ðš[™Ú[‰ÎˆËNŽLLMKŒLKˆ	Õ[™Ø\Ø[‰ÎˆËNŽLLMKŒMÌKˆ	Ó\ØHXIÎˆËNŽLMKŒŒÌKˆ	Òš[X˜\˜[‰ÎˆËNÍÌLMKŒMLKˆ	ÕXY	ÎˆËNLŽKLMKŒŒWKˆ	ÔØ[\‰ÎˆËNŽLLMKŒŒKˆ	ÕX˜[˜[‰ÎˆËNMLMKŒKˆ	ÔÙ\ÙZ	ÎˆËNŒŒLMKŒLKˆ	ÐÙ[XYÚIÎˆËNŒLLMKŒKˆ	ÒÙY[™ÝIÎˆËNNLLMKŒLKˆ	Ð[YY	ÎˆËNŒÍLLMKŒKˆ	ÓÝš[˜IÎˆËNŒMLLMKŒŒKˆ	Ó›Ü˜[IÎˆËNŒŒLMKŒLKˆ	ÓÛX›ÚÉÎˆËNNLM‹ŒLKˆ	Ó\ØH[šYIÎˆËNÌÌLMKMKŸNÂ‚™[˜Ý[Ûˆ˜[SX\šY]ÊÈ\Ý[™ÜË\Ü^PÝ\œ™[˜ÞK˜]\ËÝ™\™Y\Ý[™Õ\›NˆÈ\Ý[™ÜÎˆ[žV×NÈ\Ü^PÝ\œ™[˜ÞNˆÝš[™ÎÈ˜]\Îˆ™XÛÜ™Ýš[™Ë[X™\ŽÈÝ™\™Y\Ý[™Õ\›ÎˆÝš[™È[JHÂˆÛÛœÝÛX\ØYYÙ]X\ØYYHH\ÙTÝ]J˜[ÙJNÂˆÛÛœÝÛX\™Y‹Ù]X\™Y—HH\ÙTÝ]O[žOŠ[
NÂˆÛÛœÝÛX\šÙ\œÔ™Y‹Ù]X\šÙ\œÔ™Y—HH\ÙTÝ]O™XÛÜ™Ýš[™Ë[žOŠßJNÂ‚ˆ\ÙQY™™XÝ


HOˆÂˆYˆ
YØÝ[Y[œ]Y\žTÙ[XÝÜŠ	Û[šÖÚ™YŠH›XY›]—IÊJHÂˆÛÛœÝ[šÈHØÝ[Y[˜Ü™X]Q[[Y[
	Û[šÉÊNÂˆ[šËœ™[H	ÜÝ[\ÚY]	ÎÂˆ[šËš™YˆH	ÚÎ‹ËÝ[œÙË˜ÛÛKÛXY›]KŽKÙ\ÝÛXY›]˜ÜÜÉÎÂˆØÝ[Y[šXY˜\[™Ú[
[šÊNÂˆBˆÛÛœÝØYXY›]H

HOˆ™]È›ÛZ\ÙO›ÚYŠ
™\ÛÛ™JHOˆÂˆYˆ

Ú[™ÝÈ\È[žJK“
HÈ™\ÛÛ™J
NÈ™]\›ŽÈBˆÛÛœÝØÜš\HØÝ[Y[˜Ü™X]Q[[Y[
	ÜØÜš\	ÊNÂˆØÜš\œÜ˜ÈH	ÚÎ‹ËÝ[œÙË˜ÛÛKÛXY›]KŽKÙ\ÝÛXY›]šœÉÎÂˆØÜš\›Û›ØYH

HOˆ™\ÛÛ™J
NÂˆØÝ[Y[šXY˜\[™Ú[
ØÜš\
NÂˆJNÂˆØYXY›]

K[Š

HOˆÙ]X\ØYY
YJJNÂˆK×JNÂ‚ˆËÈ[š]X[^™HX\Û˜ÙBˆ\ÙQY™™XÝ


HOˆÂˆYˆ
[X\ØYY
H™]\›ŽÂˆÛÛœÝH
Ú[™ÝÈ\È[žJK“ÂˆÛÛœÝÛÛZ[™\ˆHØÝ[Y[™Ù][[Y[žRY
	Ø˜[K[X\	ÊNÂˆYˆ
XÛÛZ[™\ˆS
H™]\›ŽÂ‚ˆYˆ

ÛÛZ[™\ˆ\È[žJK—ÛXY›]X\
HÂˆ
ÛÛZ[™\ˆ\È[žJK—ÛXY›]X\œ™[[Ý™J
NÂˆ
ÛÛZ[™\ˆ\È[žJK—ÛXY›]X\H[ÂˆB‚ˆÛÛœÝX\H›X\
	Ø˜[K[X\	ËÈ›ÛÛPÛÛ›ÛˆYHJKœÙ]šY]ÊËNKLMKŒMWKLJNÂˆ
ÛÛZ[™\ˆ\È[žJK—ÛXY›]X\HX\ÂˆÙ]X\™YŠX\
NÂ‚ˆ[S^Y\Š	ÚÎ‹ËÞÜßK[K›Ü[œÝ™Y]X\›Ü™ËÞÞŸKÞÞKÞÞ_Kœ™ÉËÂˆ]šX][ÛŽˆ	ðªHÔÓIËˆX^›ÛÛNˆNˆJK˜YÊX\
NÂ‚ˆÙ][Y[Ý]


HOˆÈX\š[˜[Y]TÚ^™J
NÈKL
NÂ‚ˆ™]\›ˆ

HOˆÂˆX\œ™[[Ý™J
NÂˆYˆ
ÛÛZ[™\ŠH
ÛÛZ[™\ˆ\È[žJK—ÛXY›]X\H[ÂˆNÂˆKÛX\ØYYJNÂ‚ˆËÈYÝ\]H›Ü\HX\šÙ\œÈÚ[ˆ\Ý[™ÜÈÚ[™ÙBˆ\ÙQY™™XÝ


HOˆÂˆYˆ
[X\™Yˆ[X\ØYY
H™]\›ŽÂˆÛÛœÝH
Ú[™ÝÈ\È[žJK“ÂˆYˆ
S
H™]\›ŽÂ‚ˆËÈÛX\ˆ^\Ý[™ÈX\šÙ\œÂˆØš™XÝ˜[Y\ÊX\šÙ\œÔ™YŠK™›Ü‘XXÚ

Nˆ[žJHOˆÈžHÈX\™Y‹œ™[[Ý™S^Y\ŠJNÈHØ]ÚßHJNÂ‚ˆÛÛœÝ™]ÓX\šÙ\œÎˆ™XÛÜ™Ýš[™Ë[žOˆHßNÂˆÛÛœÝX\šÙ\Û\Ý\Žˆ[žV×HH×NÂ‚ˆ\Ý[™ÜË™›Ü‘XXÚ
š[HOˆÂˆÛÛœÝ]H\œÙQ›Ø]
š[K›]]YJNÂˆÛÛœÝ™ÈH\œÙQ›Ø]
š[K›Û™Ú]YJNÂˆYˆ
[][™È]OOH™ÈOOH
H™]\›ŽÂ‚ˆÛÛœÝ›ÚHHš[Kœ›Ú™XÝYÜ›ÚHÂˆÛÛœÝ›ÚPÛÛÜˆH›ÚHHMHÈ	ÈÌM˜LÍIÈˆ›ÚHHLÈ	ÈÌMŒÙX‰Èˆ	ÈÍÍ‰ÎÂ‚ˆÛÛœÝX\šÙ\ˆH˜Ú\˜ÛSX\šÙ\ŠÛ]™×KÂˆ˜Y]\ÎˆKˆš[ÛÛÜŽˆ›ÚPÛÛÜ‹ˆÛÛÜŽˆ	ÈÙ™™‰ËˆÙZYÚˆKˆÜXÚ]NˆŽKˆš[ÜXÚ]NˆËˆJK˜YÊX\™YŠNÂ‚ˆËÈšXÙH›Ü›X][™È›ÜˆÜ\ˆÛÛœÝ\ØÈH
š[KœšXÙWÙ\ØÜš\[Ûˆ	ÉÊKš[J
NÂˆÛÛœÝšXÙSX]ÚH\ØË›X]Ú
×ŠQŸTÑUQUTŸÑÑ
WÊŠ×—×JÊKÚJNÂˆ]šXÙTÝˆH	ÉÎÂˆYˆ
šXÙSX]Ú
HÂˆÛÛœÝ[[Ý[H\œÙQ›Ø]
šXÙSX]ÚÌ—Kœ™\XÙJ×ßÙË	ÉÊJHÂˆÛÛœÝÝ\ˆHšXÙSX]ÚÌWKÕ\\Ø\ÙJ
NÂˆÛÛœÝˆH˜]\ÖØÝ\—NÂˆÛÛœÝšXÙUTÑHÝ\ˆOOH	ÕTÑ	ÈÈ[[Ý[ˆ
ˆ	‰ˆˆˆÈ[[Ý[Èˆˆ[[Ý[
NÂˆÛÛœÝ\Ü^U˜[H\Ü^PÝ\œ™[˜ÞHOOH	ÕTÑ	ÈÈšXÙUTÑˆšXÙUTÑ
ˆ
˜]\ÖÙ\Ü^PÝ\œ™[˜ÞWHJNÂˆšXÙTÝˆH	Ù\Ü^PÝ\œ™[˜Þ_H	ÓX]œ›Ý[™
\Ü^U˜[
KÓØØ[TÝš[™Ê
_XÂˆH[ÙHÂˆÛÛœÝH[X™\Šš[K›\ÝÜšXÙJHÂˆÛÛœÝšXÙUTÑHHYMˆÈÈ
˜]\ÖÉÒQ‰×HMÎŠHˆÂˆÛÛœÝ\Ü^U˜[H\Ü^PÝ\œ™[˜ÞHOOH	ÕTÑ	ÈÈšXÙUTÑˆšXÙUTÑ
ˆ
˜]\ÖÙ\Ü^PÝ\œ™[˜ÞWHJNÂˆšXÙTÝˆH	Ù\Ü^PÝ\œ™[˜Þ_H	ÓX]œ›Ý[™
\Ü^U˜[
KÓØØ[TÝš[™Ê
_XÂˆB‚ˆX\šÙ\‹˜š[™Ü\
ˆ]ˆÝ[OH™›ÛY˜[Z[NˆÞ\Ý[K]ZNÈZ[‹]ÚYˆNÈ‚ˆ"font-weight: 700; font-size: 12px; margin-bottom: 4px; color: #1e293b;">${(villa.villa_name || 'Villa').substring(0, 50)}</div>
          <div style="font-size: 11px; color: #64748b; line-height: 1.7;">
            <div>${villa.location || 'Bali'} â€¢ ${villa.bedrooms || '?'} bed</div>
            <div><strong>${priceStr}</strong></div>
            <div>ROI: <strong style="color: ${roiColor}">${roi.toFixed(1)}%</strong></div>
          </div>
        </div>
      `);

      if (villa.url) newMarkers[villa.url] = marker;
      markerCluster.push(marker);
    });

    setMarkersRef(newMarkers);
  }, [mapRef, mapLoaded, listings, displayCurrency, rates]);

  // Highlight marker on hover
  useEffect(() => {
    if (!mapRef || !mapLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    Object.entries(markersRef).forEach(([url, marker]) => {
      if (url === hoveredListingUrl) {
        marker.setStyle({ radius: 10, weight: 3, fillOpacity: 1 });
        marker.openPopup();
      } else {
        marker.setStyle({ radius: 5, weight: 1, fillOpacity: 0.7 });
      }
    });
  }, [hoveredListingUrl, markersRef, mapRef, mapLoaded]);

  // Resize map when panel becomes visible
  useEffect(() => {
    if (mapRef) {
      setTimeout(() => { mapRef.invalidateSize(); }, 200);
    }
  }, [mapRef]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Map size={14} className="text-blue-500" /> Property Map
        </div>
        <div className="flex gap-2 text-[9px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-600 inline-block"></span> â‰¥15%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span> 10-15%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500 inline-block"></span> &lt;10%</span>
        </div>
      </div>
      <div id="bali-map" className="flex-1" style={{ minHeight: '500px', width: '100%' }}></div>
    </div>
  );
}