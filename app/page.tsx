'use client';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MapPin, Ruler, Calendar, Lock, X, ShieldCheck, Info, TrendingUp, Search, AlertTriangle, Filter, DollarSign, Percent, Home, Layers, ArrowUpDown, Bed, Bath, Map, LayoutList, ShieldAlert, Eye, SlidersHorizontal, BarChart3, Check, Heart } from 'lucide-react';

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
  const [filterRoi, setFilterRoi] = useState(-99);
  const [filterLandSize, setFilterLandSize] = useState(0);
  const [filterBuildSize, setFilterBuildSize] = useState(0);
  const [filterBeds, setFilterBeds] = useState(0);
  const [filterBaths, setFilterBaths] = useState(0);
  const [filterLeaseType, setFilterLeaseType] = useState('All');
  const [displayCurrency, setDisplayCurrency] = useState<string>('USD'); // Show all prices in this currency
  const [sortOption, setSortOption] = useState('roi-desc');
  const [showMap, setShowMap] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [hoveredListingUrl, setHoveredListingUrl] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<Record<string, Array<{price_usd: number, recorded_at: string}>>>({});
  const [hoveredPriceBadge, setHoveredPriceBadge] = useState<number | null>(null);

  // --- FAVORITES STATES ---
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  const toggleFavorite = (villaId: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(villaId)) next.delete(villaId);
      else next.add(villaId);
      // Persist to localStorage
      try { localStorage.setItem('bvt-favorites', JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  };

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bvt-favorites');
      if (saved) {
        const ids: number[] = JSON.parse(saved);
        setFavorites(new Set(ids));
      }
      // If we have a stored email, load favorites from Supabase too
      const storedEmail = localStorage.getItem('bvt-email');
      if (storedEmail) {
        setEmail(storedEmail);
        (async () => {
          const { data } = await supabase.from('user_favorites').select('villa_id').eq('email', storedEmail);
          if (data && data.length > 0) {
            setFavorites(prev => {
              const merged = new Set(prev);
              data.forEach((row: any) => merged.add(row.villa_id));
              try { localStorage.setItem('bvt-favorites', JSON.stringify(Array.from(merged))); } catch {}
              return merged;
            });
          }
        })();
      }
    } catch {}
    setFavoritesLoaded(true);
  }, []);

  // --- COMPARE MODE STATES ---
  const [compareSet, setCompareSet] = useState<Set<number>>(new Set());
  const [showCompare, setShowCompare] = useState(false);
  const [sliderNightly, setSliderNightly] = useState(1.0);   // multiplier: 0.5x–2.0x
  const [sliderOccupancy, setSliderOccupancy] = useState(58); // percent: 20–95
  const [sliderExpense, setSliderExpense] = useState(40);     // percent: 20–60

  const toggleCompare = (villaId: number) => {
    setCompareSet(prev => {
      const next = new Set(prev);
      if (next.has(villaId)) next.delete(villaId);
      else if (next.size < 5) next.add(villaId);
      return next;
    });
  };

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
      
      // Fetch price history for listings with price changes
      const { data: historyData } = await supabase
        .from('price_history')
        .select('listing_url, price_usd, recorded_at')
        .order('recorded_at', { ascending: true });
      if (historyData && historyData.length > 0) {
        const grouped: Record<string, Array<{price_usd: number, recorded_at: string}>> = {};
        for (const row of historyData) {
          if (!grouped[row.listing_url]) grouped[row.listing_url] = [];
          grouped[row.listing_url].push({ price_usd: row.price_usd, recorded_at: row.recorded_at });
        }
        setPriceHistory(grouped);
      }

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

  // --- Mini sparkline SVG for price history ---
  const PriceSparkline = ({ url, currentPriceUsd }: { url: string; currentPriceUsd: number }) => {
    const history = priceHistory[url];
    if (!history || history.length < 1) return null;

    // Build data points: history entries + current price
    const points = [...history.map(h => ({ price: h.price_usd, date: h.recorded_at.slice(0, 10) }))];
    // Add current price as latest point if different from last history entry
    const lastHistoryPrice = points[points.length - 1]?.price || 0;
    if (currentPriceUsd > 0 && Math.abs(currentPriceUsd - lastHistoryPrice) > 100) {
      points.push({ price: currentPriceUsd, date: new Date().toISOString().slice(0, 10) });
    }

    if (points.length < 2) return null;

    const prices = points.map(p => p.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;

    const w = 160, h = 50, pad = 4;
    const stepX = (w - pad * 2) / (points.length - 1);

    const pathPoints = points.map((p, i) => {
      const x = pad + i * stepX;
      const y = pad + (1 - (p.price - minP) / range) * (h - pad * 2);
      return `${x},${y}`;
    });
    const linePath = `M ${pathPoints.join(' L ')}`;

    const isDown = prices[prices.length - 1] < prices[0];
    const color = isDown ? '#16a34a' : '#dc2626';

    return (
      <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 bg-slate-900 rounded-lg shadow-xl p-3 border border-slate-700" style={{ width: w + 24 }}>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-slate-900" />
        <p className="text-[9px] text-slate-400 mb-1 font-medium">Price History</p>
        <svg width={w} height={h} className="block">
          <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => (
            <circle key={i} cx={pad + i * stepX} cy={pad + (1 - (p.price - minP) / range) * (h - pad * 2)} r={i === points.length - 1 ? 3.5 : 2} fill={i === points.length - 1 ? color : '#94a3b8'} stroke={i === points.length - 1 ? 'white' : 'none'} strokeWidth={1} />
          ))}
        </svg>
        <div className="flex justify-between text-[8px] text-slate-500 mt-1">
          <span>{points[0].date}</span>
          <span>{points[points.length - 1].date}</span>
        </div>
        <div className="flex justify-between text-[9px] mt-0.5">
          <span className="text-slate-400">${Math.round(prices[0]).toLocaleString()}</span>
          <span style={{ color }}>${Math.round(prices[prices.length - 1]).toLocaleString()}</span>
        </div>
      </div>
    );
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
      const matchSaved = !showFavoritesOnly || favorites.has(villa.id);
      return matchLocation && matchPrice && matchRoi && matchLand && matchBuild && matchBeds && matchBaths && matchLease && matchSaved;
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
  }, [listings, filterLocation, filterPrice, filterRoi, filterLandSize, filterBuildSize, filterBeds, filterBaths, filterLeaseType, sortOption, rates, showFavoritesOnly, favorites]);

  const handleLeadCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.from('leads').insert([
      { email, villa_id: selectedVilla.id, villa_name: selectedVilla.villa_name, lead_type: 'Unlock Audit' }
    ]);
    if (!error) {
      window.open(selectedVilla.url, '_blank');
      setSelectedVilla(null);
      setLeadCount(prev => prev + 1);
      // Sync favorites to Supabase and persist email
      try {
        localStorage.setItem('bvt-email', email);
        if (favorites.size > 0) {
          const rows = Array.from(favorites).map(villa_id => ({ email, villa_id }));
          await supabase.from('user_favorites').upsert(rows, { onConflict: 'email,villa_id' });
        }
      } catch {}
      setEmail('');
    } else {
      alert("Error joining. Please try again.");
    }
    setIsSubmitting(false);
  };

  const parseRateFactors = (factorsStr: string | null): string[] => {
    if (!factorsStr) return [];
    return factorsStr.split(' | ').filter(f => f.trim());
  };

  // --- BVT NET ROI: Cost breakdown shown in tooltip (matches pipeline's 40% expense load) ---
  const COST_BREAKDOWN = {
    mgmt: { label: 'Property Management', rate: 0.15, note: 'On-ground manager, cleaning, laundry' },
    ota: { label: 'OTA / Booking Fees', rate: 0.15, note: 'Airbnb/Booking.com commissions' },
    maint: { label: 'Maintenance & Utilities', rate: 0.10, note: 'Pool, garden, AC, wifi, repairs' },
  };
  const TOTAL_COST_RATIO = Object.values(COST_BREAKDOWN).reduce((sum, c) => sum + c.rate, 0); // 0.40

  const calculateNetROI = (villa: any): { netRoi: number; leaseDepreciation: number; grossRoi: number; isFreehold: boolean; preDepreciationNet: number; leaseYears: number } => {
    // projected_roi from pipeline = net after 40% expenses + lease penalty (only for <15yr leases)
    let netRoi = villa.projected_roi || 0;

    // Back-calculate gross ROI for "Agent Claims" display
    const priceUSD = getPriceUSD(villa);
    const nightly = villa.est_nightly_rate || getDisplayNightly(villa);
    const occupancy = villa.est_occupancy || getDisplayOccupancy(villa) / 100;
    const grossRoi = priceUSD > 0 ? ((nightly * 365 * occupancy) / priceUSD) * 100 : 0;

    // Leasehold depreciation for ALL leasehold villas
    // Pipeline already deducts for <15yr leases; we add it for >=15yr leases too
    const features = (villa.features || '').toLowerCase();
    const years = Number(villa.lease_years) || 0;
    const isFreehold = features.includes('freehold') || features.includes('hak milik') || years === 999;
    let leaseDepreciation = 0;
    // For pre-depreciation display: net yield before lease expiration cost
    let preDepreciationNet = netRoi;
    if (!isFreehold && years > 0) {
      leaseDepreciation = (1 / years) * 100;
      // Pipeline already applied depreciation for short leases, only subtract for longer ones
      if (years >= 15) {
        preDepreciationNet = netRoi; // capture before subtracting
        netRoi -= leaseDepreciation;
      } else {
        // Pipeline already subtracted, so add back to get pre-depreciation
        preDepreciationNet = netRoi + leaseDepreciation;
      }
    }

    return {
      netRoi: Math.max(netRoi, -10),
      leaseDepreciation,
      grossRoi: Math.min(grossRoi, 50),
      isFreehold,
      preDepreciationNet: Math.min(preDepreciationNet, 50),
      leaseYears: years,
    };
  };

  // --- DYNAMIC ROI: User-adjustable calculation for compare panel ---
  const calculateDynamicROI = (villa: any, nightlyMultiplier: number, occupancyPct: number, expensePct: number) => {
    const priceUSD = getPriceUSD(villa);
    if (priceUSD <= 0) return { grossYield: 0, netYield: 0, annualRevenue: 0, annualExpenses: 0, netRevenue: 0, leaseDepreciation: 0, depreciationYield: 0, isFreehold: true, leaseYears: 0 };

    const baseNightly = villa.est_nightly_rate || getDisplayNightly(villa);
    const adjustedNightly = baseNightly * nightlyMultiplier;
    const occupancy = occupancyPct / 100;
    const annualRevenue = adjustedNightly * 365 * occupancy;
    const annualExpenses = annualRevenue * (expensePct / 100);
    const netRevenue = annualRevenue - annualExpenses;
    const grossYield = (annualRevenue / priceUSD) * 100;

    // Lease depreciation for ALL leasehold villas
    const features = (villa.features || '').toLowerCase();
    const years = Number(villa.lease_years) || 0;
    const isFreehold = features.includes('freehold') || features.includes('hak milik') || years === 999;
    const leaseDepreciation = (!isFreehold && years > 0) ? Math.round(priceUSD / years) : 0;
    const depreciationYield = (!isFreehold && years > 0) ? (1 / years) * 100 : 0;
    const netAfterDepreciation = netRevenue - leaseDepreciation;
    let netYield = (netAfterDepreciation / priceUSD) * 100;

    return {
      grossYield: Math.min(grossYield, 80),
      netYield: Math.max(netYield, -20),
      annualRevenue: Math.round(annualRevenue),
      annualExpenses: Math.round(annualExpenses),
      netRevenue: Math.round(netRevenue),
      leaseDepreciation,
      depreciationYield: Math.round(depreciationYield * 10) / 10,
      isFreehold,
      leaseYears: years,
    };
  };

  // --- RED FLAGS: Read pre-computed flags from pipeline + add client-side checks ---
  type RedFlag = { level: 'warning' | 'danger'; label: string; detail: string };

  const getRedFlags = (villa: any): RedFlag[] => {
    const flags: RedFlag[] = [];
    const years = Number(villa.lease_years) || 0;
    const priceUSD = getPriceUSD(villa);
    const nightly = getDisplayNightly(villa);
    const { netRoi, grossRoi } = calculateNetROI(villa);

    // --- ALL flags read from pipeline (auditor_remote.py --enrich) ---
    // No client-side flag computation — everything is pre-computed server-side.
    const pipelineFlags = (villa.flags || '').split(',').map((f: string) => f.trim()).filter(Boolean);

    if (pipelineFlags.includes('BUDGET_VILLA')) {
      const beds = Number(villa.bedrooms) || 1;
      const ppr = Math.round(priceUSD / beds);
      flags.push({ level: 'warning', label: 'Budget Villa', detail: `$${ppr.toLocaleString()}/room is below threshold. Nightly rate corrected down 25%.` });
    }

    if (pipelineFlags.includes('SHORT_LEASE')) {
      const annualDepreciation = years > 0 ? Math.round(priceUSD / years) : 0;
      const occupancyEst = villa.est_occupancy || 0.55;
      const nightlyEst = villa.est_nightly_rate || nightly;
      const annualNetRent = Math.round(nightlyEst * 365 * occupancyEst * 0.60);
      const depreciationExceedsRent = annualDepreciation > annualNetRent;
      const depreciationDetail = annualDepreciation > 0
        ? depreciationExceedsRent
          ? ` Rental income (~$${annualNetRent.toLocaleString()}/yr) cannot cover lease depreciation ($${annualDepreciation.toLocaleString()}/yr).`
          : ` Lease depreciation costs $${annualDepreciation.toLocaleString()}/yr against ~$${annualNetRent.toLocaleString()}/yr net rent.`
        : '';
      flags.push({ level: 'danger', label: 'Short Lease', detail: `Only ${years} years remaining. Your asset depreciates ${years > 0 ? (100/years).toFixed(1) : '∞'}% per year toward $0.${depreciationDetail}` });
    }

    if (pipelineFlags.includes('INFLATED_ROI')) {
      flags.push({ level: 'danger', label: 'Inflated ROI', detail: `Gross ROI of ${grossRoi.toFixed(0)}% is almost certainly inflated. After real costs, BVT estimates ~${netRoi.toFixed(1)}%.` });
    }

    if (pipelineFlags.includes('OPTIMISTIC_ROI')) {
      flags.push({ level: 'warning', label: 'Optimistic ROI', detail: `Gross ${grossRoi.toFixed(0)}% is above Bali averages. After 40% expenses, net yield is ~${netRoi.toFixed(1)}%.` });
    }

    if (pipelineFlags.includes('RATE_PRICE_GAP')) {
      flags.push({ level: 'warning', label: 'Rate vs Price Gap', detail: `$${nightly}/night on a $${Math.round(priceUSD/1000)}k property implies unrealistic occupancy or rates.` });
    }

    return flags;
  };

  const flaggedCount = listings.filter(v => getRedFlags(v).length > 0).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      
      {/* HEADER */}
      <header className="max-w-7xl mx-auto mb-6">
        <div className="text-center mb-4 md:mb-8">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-1 md:mb-2">
            Bali Villa <span className="text-blue-600">Truth</span>
            </h1>
            <p className="text-slate-500 max-w-xl mx-auto text-xs md:text-sm leading-relaxed">
            Independent ROI auditing for serious investors. We verify the data agents hide.
            </p>
        </div>
        
        {/* FILTER DASHBOARD */}
        <div className="bg-white p-3 md:p-5 rounded-xl shadow-sm border border-slate-200 mb-6">

            {/* Mobile filter toggle */}
            <div className="flex md:hidden items-center justify-between mb-2">
              <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Filter size={14} /> Filters & Sort
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">{processedListings.length} results</span>
              </button>
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="text-xs bg-blue-50 border border-blue-200 text-blue-700 font-medium rounded-lg px-2 py-1.5 outline-none">
                <option value="roi-desc">ROI: High → Low</option>
                <option value="roi-asc">ROI: Low → High</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
              </select>
            </div>

            {/* ROW 1: Core Filters (hidden on mobile unless toggled) */}
            <div className={`${showMobileFilters ? 'block' : 'hidden'} md:block`}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
                <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hidden md:block" />
                    <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="w-full pl-3 md:pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none cursor-pointer hover:bg-slate-100 transition-colors">
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
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hidden md:block" />
                    <select value={filterPrice} onChange={(e) => setFilterPrice(Number(e.target.value))} className="w-full pl-3 md:pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none cursor-pointer hover:bg-slate-100 transition-colors">
                        <option value={10000000}>Max Price</option>
                        <option value={200000}>&lt; $200k USD</option>
                        <option value={350000}>&lt; $350k USD</option>
                        <option value={500000}>&lt; $500k USD</option>
                        <option value={1000000}>&lt; $1M USD</option>
                    </select>
                </div>
                <div className="relative">
                    <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hidden md:block" />
                    <select value={filterRoi} onChange={(e) => setFilterRoi(Number(e.target.value))} className="w-full pl-3 md:pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none cursor-pointer hover:bg-slate-100 transition-colors">
                        <option value={-99}>All ROI</option>
                        <option value={0}>0%+</option>
                        <option value={5}>5%+</option>
                        <option value={10}>10%+</option>
                        <option value={15}>15%+</option>
                        <option value={20}>20%+</option>
                    </select>
                </div>
                <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hidden md:block" />
                    <select value={filterLeaseType} onChange={(e) => setFilterLeaseType(e.target.value)} className="w-full pl-3 md:pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none cursor-pointer hover:bg-slate-100 transition-colors">
                        <option value="All">All Status</option>
                        <option value="Freehold">Freehold (Hak Milik)</option>
                        <option value="Leasehold">Leasehold (Hak Sewa)</option>
                    </select>
                </div>
                <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hidden md:block" />
                    <select value={displayCurrency} onChange={(e) => setDisplayCurrency(e.target.value)} className="w-full pl-3 md:pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none cursor-pointer hover:bg-slate-100 transition-colors" title="Show all prices in this currency">
                        <option value="IDR">Show prices in IDR</option>
                        <option value="USD">Show prices in USD</option>
                        <option value="AUD">Show prices in AUD</option>
                        <option value="EUR">Show prices in EUR</option>
                        <option value="SGD">Show prices in SGD</option>
                    </select>
                </div>
                {/* SORTING - Prominent */}
                <div className="relative col-span-2 md:col-span-3 lg:col-span-1">
                    <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 hidden md:block" />
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="w-full pl-3 md:pl-9 pr-3 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 font-medium rounded-lg text-sm outline-none cursor-pointer hover:bg-blue-100 transition-colors">
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
                    onClick={() => {setFilterLocation('All'); setFilterPrice(10000000); setFilterRoi(-99); setFilterLandSize(0); setFilterBuildSize(0); setFilterBeds(0); setFilterBaths(0); setFilterLeaseType('All'); setSortOption('roi-desc'); setShowFavoritesOnly(false);}}
                    className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-2"
                >
                    Reset All
                </button>
            </div>
            </div>{/* end mobile collapsible wrapper */}
        </div>
      </header>

      {/* RESULTS BAR */}
      <div className={`${showMap ? 'max-w-[100rem]' : 'max-w-7xl'} mx-auto mb-4 flex flex-wrap justify-between items-center gap-2 px-2 transition-all`}>
         <div className="flex items-center gap-2">
           <p className="text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:block">Showing {processedListings.length} Properties</p>
           <button
             onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
             className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
               showFavoritesOnly
                 ? 'bg-red-50 text-red-600 border-red-200'
                 : 'bg-white text-slate-500 border-slate-200 hover:border-red-200 hover:text-red-500'
             }`}
           >
             <Heart size={10} className={showFavoritesOnly ? 'fill-red-500' : ''} /> Saved ({favorites.size})
           </button>
           {showFavoritesOnly && favorites.size > 0 && compareSet.size === 0 && !showCompare && (
             <button
               onClick={() => {
                 const batch = Array.from(favorites).slice(0, 5);
                 setCompareSet(new Set(batch));
                 setShowCompare(true);
                 setSliderNightly(1.0); setSliderOccupancy(58); setSliderExpense(40);
               }}
               className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors"
             >
               <SlidersHorizontal size={10} /> Compare Saved
             </button>
           )}
         </div>
         <div className="flex gap-2 md:gap-4 items-center">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                <ShieldAlert size={10}/> {flaggedCount} Flagged
            </div>
            <button onClick={() => setShowMap(!showMap)} className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${showMap ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'}`}>
              <Map size={12} /> {showMap ? 'Hide Map' : 'Show Map'}
            </button>
         </div>
      </div>

      {/* MOBILE VIEW TOGGLE: List / Map */}
      <div className="md:hidden max-w-7xl mx-auto mb-3 px-1">
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          <button onClick={() => setMobileView('list')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${mobileView === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            <LayoutList size={13} /> List
          </button>
          <button onClick={() => setMobileView('map')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${mobileView === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            <Map size={13} /> Map
          </button>
        </div>
      </div>

      {/* MOBILE MAP VIEW */}
      {mobileView === 'map' && (
        <div className="md:hidden max-w-7xl mx-auto mb-4 px-1" style={{ height: 'calc(100vh - 12rem)' }}>
          <BaliMapView listings={processedListings} displayCurrency={displayCurrency} rates={rates} hoveredListingUrl={hoveredListingUrl} favorites={favorites} compareSet={compareSet} onToggleFavorite={toggleFavorite} onToggleCompare={toggleCompare} onUnlockVilla={setSelectedVilla} />
        </div>
      )}

      {/* SPLIT LAYOUT: TABLE + MAP */}
      <div className={`${showMap ? 'max-w-[100rem]' : 'max-w-7xl'} mx-auto flex gap-4 transition-all`}>
      {/* MOBILE CARD VIEW */}
      <main className={`${mobileView === 'list' ? 'block' : 'hidden'} md:hidden transition-all w-full`}>
        <div className="space-y-3 px-1">
          {processedListings.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
              {showFavoritesOnly ? <Heart size={36} className="mx-auto mb-3 opacity-20" /> : <Filter size={36} className="mx-auto mb-3 opacity-20" />}
              <p>{showFavoritesOnly ? 'No saved properties yet. Tap the heart icon to save listings.' : 'No properties match your filters.'}</p>
            </div>
          ) : (
            processedListings.map((villa) => {
              const { netRoi, leaseDepreciation, grossRoi, isFreehold, preDepreciationNet, leaseYears } = calculateNetROI(villa);
              const redFlags = getRedFlags(villa);
              const hasDanger = redFlags.some(f => f.level === 'danger');
              const hasWarning = redFlags.length > 0;
              const priceUSD = getPriceUSD(villa);

              return (
                <div key={villa.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Card Header: Image + Name + Location */}
                  <div className="flex items-start gap-3 p-3 pb-2">
                    {villa.thumbnail_url ? (
                      <img src={villa.thumbnail_url} alt="" className="w-20 h-16 object-cover rounded-lg flex-shrink-0 bg-slate-100" loading="lazy" />
                    ) : (
                      <div className="w-20 h-16 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <Home size={18} className="text-slate-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-sm leading-tight truncate">
                        {villa.villa_name || 'Luxury Villa'}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <MapPin size={10} className="text-blue-500 flex-shrink-0" /> {villa.location || "Bali"}
                      </div>
                      {(hasDanger || hasWarning) && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {hasDanger && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[8px] font-bold border border-red-200 flex items-center gap-0.5"><ShieldAlert size={8}/> VERIFY</span>}
                          {!hasDanger && hasWarning && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[8px] font-bold border border-amber-200 flex items-center gap-0.5"><AlertTriangle size={8}/> CAUTION</span>}
                        </div>
                      )}
                    </div>
                    <button onClick={() => toggleFavorite(villa.id)} className="flex-shrink-0 p-1">
                      <Heart size={18} strokeWidth={2} className={`transition-all ${favorites.has(villa.id) ? 'text-red-500 fill-red-500' : 'text-slate-300'}`} />
                    </button>
                  </div>

                  {/* Card Body: Key Metrics Grid */}
                  <div className="grid grid-cols-3 gap-px bg-slate-100 border-t border-slate-100">
                    {/* Price */}
                    <div className="bg-white p-2.5 text-center">
                      <div className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Price</div>
                      <div className="font-mono text-xs font-bold text-slate-800">{formatPriceInCurrency(villa)}</div>
                    </div>
                    {/* ROI */}
                    <div className="bg-white p-2.5 text-center">
                      <div className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Net ROI</div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        netRoi >= 12 ? 'bg-green-100 text-green-700' :
                        netRoi >= 7 ? 'bg-blue-100 text-blue-700' :
                        netRoi >= 0 ? 'bg-slate-100 text-slate-700' :
                        'bg-red-100 text-red-600'
                      }`}>{netRoi.toFixed(1)}%</span>
                      <div className="text-[8px] text-slate-400 line-through mt-0.5">Gross: {grossRoi.toFixed(1)}%</div>
                    </div>
                    {/* Specs */}
                    <div className="bg-white p-2.5 text-center">
                      <div className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Specs</div>
                      <div className="text-xs font-medium text-slate-700">{villa.bedrooms || '?'} Bed</div>
                      <div className="text-[9px] text-slate-500">{isFreehold ? 'Freehold' : leaseYears > 0 ? `${leaseYears}yr lease` : 'Leasehold'}</div>
                    </div>
                  </div>

                  {/* Card Footer: Compare + nightly rate + flags + action */}
                  <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-slate-100 bg-slate-50/50">
                    <button
                      onClick={() => toggleCompare(villa.id)}
                      disabled={!compareSet.has(villa.id) && compareSet.size >= 5}
                      className={`flex items-center gap-1 text-[9px] font-bold px-2 py-1.5 rounded-lg border transition-all flex-shrink-0 ${
                        compareSet.has(villa.id)
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : compareSet.size >= 5
                            ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                            : 'border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600'
                      }`}
                    >
                      <BarChart3 size={10} /> {compareSet.has(villa.id) ? 'Selected' : 'Compare'}
                    </button>
                    <div className="text-[10px] text-slate-500 font-mono text-center flex-1 min-w-0">
                      ~${getDisplayNightly(villa)}/nt • {Math.round(getDisplayOccupancy(villa))}% occ
                      {redFlags.length > 0 && (
                        <div className="flex gap-1 mt-0.5 flex-wrap justify-center">
                          {redFlags.map((flag, idx) => (
                            <span key={idx} className={`px-1 py-0.5 rounded text-[7px] font-bold ${flag.level === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                              {flag.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setSelectedVilla(villa)} className="flex items-center gap-1 bg-slate-900 hover:bg-blue-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg transition-all flex-shrink-0">
                      <Lock size={10}/> UNLOCK
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* DESKTOP TABLE */}
      <main className={`hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all ${showMap ? 'w-[60%] flex-shrink-0' : 'w-full'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                <th className="p-3 w-10 text-center"><BarChart3 size={14} className="mx-auto text-slate-400" /></th>
                <th className="p-3 w-10 text-center"><Heart size={14} className="mx-auto text-slate-300" /></th>
                <th className="p-5">Asset & Location</th>
                <th className="p-5">Price ({displayCurrency})</th>
                <th className="p-5">Price/m²</th>
                <th className="p-5 text-center">ROI Analysis</th>
                <th className="p-5">Specs</th>
                <th className="p-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedListings.length === 0 ? (
                  <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400">
                          {showFavoritesOnly ? <Heart size={48} className="mx-auto mb-4 opacity-20" /> : <Filter size={48} className="mx-auto mb-4 opacity-20" />}
                          {showFavoritesOnly ? 'No saved properties yet. Click the heart icon to save listings.' : 'No properties match your filters.'}
                      </td>
                  </tr>
              ) : (
                processedListings.map((villa) => {
                    const rateFactors = parseRateFactors(villa.rate_factors);
                    const redFlags = getRedFlags(villa);
                    const { netRoi, leaseDepreciation, grossRoi, isFreehold, preDepreciationNet, leaseYears } = calculateNetROI(villa);
                    const hasDanger = redFlags.some(f => f.level === 'danger');
                    const hasWarning = redFlags.length > 0;

                    return (
                    <tr key={villa.id} className={`hover:bg-blue-50/50 transition-colors group ${hoveredListingUrl === villa.url ? 'bg-blue-50/70' : ''}`} onMouseEnter={() => setHoveredListingUrl(villa.url)} onMouseLeave={() => setHoveredListingUrl(null)}>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => toggleCompare(villa.id)}
                            disabled={!compareSet.has(villa.id) && compareSet.size >= 5}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              compareSet.has(villa.id)
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : compareSet.size >= 5
                                  ? 'border-slate-200 text-slate-200 cursor-not-allowed'
                                  : 'border-slate-300 hover:border-blue-400 text-transparent hover:text-blue-400'
                            }`}
                            title={compareSet.has(villa.id) ? 'Remove from compare' : compareSet.size >= 5 ? 'Max 5 villas' : 'Add to compare'}
                          >
                            <Check size={12} strokeWidth={3} />
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => toggleFavorite(villa.id)}
                            className="transition-all hover:scale-110"
                            title={favorites.has(villa.id) ? 'Remove from saved' : 'Save listing'}
                          >
                            <Heart size={16} strokeWidth={2} className={favorites.has(villa.id) ? 'text-red-500 fill-red-500' : 'text-slate-300 hover:text-red-400'} />
                          </button>
                        </td>
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
                             const hasHistory = priceHistory[villa.url] && priceHistory[villa.url].length >= 1;
                             return (
                               <span className={`relative px-1.5 py-0.5 rounded text-[9px] font-bold cursor-help ${
                                 badge.direction === 'down'
                                   ? 'bg-green-100 text-green-700 border border-green-200'
                                   : 'bg-red-100 text-red-600 border border-red-200'
                               }`}
                               onMouseEnter={() => setHoveredPriceBadge(villa.id)}
                               onMouseLeave={() => setHoveredPriceBadge(null)}>
                                 {badge.text}
                                 {hasHistory && hoveredPriceBadge === villa.id && (
                                   <PriceSparkline url={villa.url} currentPriceUsd={getPriceUSD(villa)} />
                                 )}
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
                            {/* BVT Adjusted ROI - the real number */}
                            <span className={`px-3 py-1 rounded-full text-sm font-bold border flex items-center gap-1 justify-center w-fit mx-auto ${
                              netRoi >= 12 ? 'bg-green-100 text-green-700 border-green-200' :
                              netRoi >= 7 ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              netRoi >= 0 ? 'bg-slate-100 text-slate-700 border-slate-200' :
                              'bg-red-100 text-red-600 border-red-200'
                            }`}>
                                Est. {netRoi.toFixed(1)}% <Eye size={10} className="opacity-50" />
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1 line-through opacity-60 font-mono">Gross: {grossRoi.toFixed(1)}%</p>
                            <p className="text-[9px] text-slate-500 font-mono">~${getDisplayNightly(villa)}/nt • {Math.round(getDisplayOccupancy(villa))}% occ</p>

                            {/* Pre-depreciation yield for leaseholds */}
                            {!isFreehold && leaseDepreciation > 0 && (
                              <p className="text-[9px] text-amber-500 font-mono mt-0.5">Before lease exp: {preDepreciationNet.toFixed(1)}%</p>
                            )}

                            {/* Red flag badges under ROI */}
                            {redFlags.length > 0 && (
                              <div className="flex flex-wrap justify-center gap-1 mt-1.5">
                                {redFlags.map((flag, idx) => (
                                  <span key={idx} className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${flag.level === 'danger' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                                    {flag.label}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Enhanced tooltip with full cost breakdown */}
                            {hoveredRoi === villa.id && (
                                <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-slate-900 text-white text-[10px] rounded-lg p-3 shadow-xl pointer-events-none">
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-900"></div>
                                <div className="font-bold mb-2 text-blue-400 flex items-center gap-1"><Eye size={11}/> BVT Conservative Estimate</div>

                                {/* Gross vs Net comparison — the core value prop */}
                                <div className="mb-2 pb-2 border-b border-slate-700 flex gap-4">
                                  <div className="flex-1 text-center">
                                    <div className="text-slate-500 text-[9px] mb-0.5">Before Costs</div>
                                    <div className="text-lg font-bold text-slate-400 line-through">{grossRoi.toFixed(1)}%</div>
                                  </div>
                                  <div className="flex-1 text-center">
                                    <div className="text-blue-400 text-[9px] mb-0.5 font-bold">BVT Net Yield</div>
                                    <div className={`text-lg font-bold ${netRoi >= 7 ? 'text-emerald-400' : netRoi >= 0 ? 'text-amber-400' : 'text-red-400'}`}>{netRoi.toFixed(1)}%</div>
                                  </div>
                                </div>

                                {/* Cost breakdown — what BVT deducts */}
                                <div className="mb-2 pb-2 border-b border-slate-700">
                                    <div className="text-slate-500 font-bold mb-1">Operating Cost Deductions:</div>
                                    {Object.entries(COST_BREAKDOWN).map(([key, cost]) => (
                                      <div key={key} className="flex justify-between">
                                        <span className="text-slate-400">{cost.label}</span>
                                        <span className="text-red-400 font-mono">-{(cost.rate * 100).toFixed(0)}%</span>
                                      </div>
                                    ))}
                                    {leaseDepreciation > 0 && (() => {
                                      const depCostAnnual = leaseYears > 0 ? Math.round(getPriceUSD(villa) / leaseYears) : 0;
                                      return (
                                        <div className="mt-1 pt-1 border-t border-slate-800">
                                          <div className="flex justify-between">
                                            <span className="text-orange-400">Lease Depreciation ({leaseYears}yr)</span>
                                            <span className="text-red-400 font-mono">-{leaseDepreciation.toFixed(1)}%</span>
                                          </div>
                                          {depCostAnnual > 0 && (
                                            <div className="text-orange-300 text-[8px] mt-0.5">≈ ${depCostAnnual.toLocaleString()}/yr in capital loss</div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                    <div className="flex justify-between mt-1 pt-1 border-t border-slate-700 font-bold">
                                      <span>Total Deducted:</span>
                                      <span className="text-red-400 font-mono">~{((TOTAL_COST_RATIO) * 100).toFixed(0)}%{leaseDepreciation > 0 ? ` + ${leaseDepreciation.toFixed(1)}%` : ''} of revenue</span>
                                    </div>
                                </div>

                                {/* Red flags in tooltip */}
                                {redFlags.length > 0 && (
                                  <div className="mb-2 pb-2 border-b border-slate-700">
                                    {redFlags.map((flag, idx) => (
                                      <div key={idx} className={`flex items-start gap-1.5 mb-1 ${flag.level === 'danger' ? 'text-red-400' : 'text-amber-400'}`}>
                                        <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
                                        <span>{flag.detail}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {!isFreehold && leaseDepreciation > 0 && (
                                  <div className="mb-2 pb-2 border-b border-slate-700">
                                    <p className="text-amber-400 text-[9px]">Leaseholds lose their purchase value over the lease term ({leaseYears}yr). &quot;Before lease exp.&quot; ({preDepreciationNet.toFixed(1)}%) shows your cash flow yield ignoring this capital loss — useful for income planning, but not your true return.</p>
                                  </div>
                                )}
                                <p className="text-slate-500 italic text-[9px] mb-1.5">Benchmarks: leasehold 8–12% net, freehold 4–7% net.</p>
                                <p className="text-blue-400 text-[9px] font-medium flex items-center gap-1"><SlidersHorizontal size={9}/> Select villas to compare with your own assumptions →</p>
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

      {/* MAP PANEL (sticky alongside table) */}
      {showMap && (
        <div className="w-[40%] flex-shrink-0 sticky top-4 self-start" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
          <BaliMapView listings={processedListings} displayCurrency={displayCurrency} rates={rates} hoveredListingUrl={hoveredListingUrl} favorites={favorites} compareSet={compareSet} onToggleFavorite={toggleFavorite} onToggleCompare={toggleCompare} onUnlockVilla={setSelectedVilla} />
        </div>
      )}
      </div>{/* end split layout flex */}

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

      {/* FLOATING COMPARE BAR */}
      {compareSet.size > 0 && !showCompare && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl shadow-2xl px-4 md:px-6 py-3 flex items-center gap-2 md:gap-4 animate-in slide-in-from-bottom duration-300 max-w-[95vw]">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-400" />
            <span className="font-bold text-sm">{compareSet.size} villa{compareSet.size !== 1 ? 's' : ''} selected</span>
          </div>
          <button
            onClick={() => { setShowCompare(true); setSliderNightly(1.0); setSliderOccupancy(58); setSliderExpense(40); }}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors flex items-center gap-2"
          >
            <SlidersHorizontal size={14} /> Compare Now
          </button>
          <button
            onClick={() => setCompareSet(new Set())}
            className="text-slate-400 hover:text-white text-sm font-medium px-2 py-1 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* COMPARE PANEL MODAL */}
      {showCompare && (() => {
        const compareVillas = listings.filter(v => compareSet.has(v.id));
        const BVT_DEFAULTS = { nightly: 1.0, occupancy: 58, expense: 40 };

        return (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl my-8 relative">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal size={20} className="text-blue-600" /> Villa ROI Calculator
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Adjust assumptions to see how yields change across your selection</p>
                </div>
                <button onClick={() => setShowCompare(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={24}/></button>
              </div>

              {/* Sliders */}
              <div className="p-6 bg-slate-50 border-b border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Nightly Rate Multiplier */}
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nightly Rate</label>
                      <span className="text-sm font-bold text-blue-600">{sliderNightly.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range" min="0.5" max="2.0" step="0.1"
                      value={sliderNightly}
                      onChange={(e) => setSliderNightly(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>0.5x</span>
                      <span className="text-blue-500 font-bold">BVT: {BVT_DEFAULTS.nightly}x</span>
                      <span>2.0x</span>
                    </div>
                  </div>

                  {/* Occupancy */}
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Occupancy</label>
                      <span className="text-sm font-bold text-blue-600">{sliderOccupancy}%</span>
                    </div>
                    <input
                      type="range" min="20" max="95" step="1"
                      value={sliderOccupancy}
                      onChange={(e) => setSliderOccupancy(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>20%</span>
                      <span className="text-blue-500 font-bold">BVT: {BVT_DEFAULTS.occupancy}%</span>
                      <span>95%</span>
                    </div>
                  </div>

                  {/* Expense Load */}
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Expense Load</label>
                      <span className="text-sm font-bold text-blue-600">{sliderExpense}%</span>
                    </div>
                    <input
                      type="range" min="20" max="60" step="1"
                      value={sliderExpense}
                      onChange={(e) => setSliderExpense(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>20%</span>
                      <span className="text-blue-500 font-bold">BVT: {BVT_DEFAULTS.expense}%</span>
                      <span>60%</span>
                    </div>
                  </div>
                </div>

                {/* Reset to BVT defaults */}
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => { setSliderNightly(1.0); setSliderOccupancy(58); setSliderExpense(40); }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Reset to BVT Defaults
                  </button>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="p-6 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-200">
                      <th className="text-left py-3 pr-4 w-36">Metric</th>
                      {compareVillas.map(v => (
                        <th key={v.id} className="text-center py-3 px-3 min-w-[140px]">
                          <div className="text-slate-700 text-[11px] normal-case font-bold truncate max-w-[160px]">{v.villa_name}</div>
                          <div className="text-[9px] text-slate-400 font-normal">{v.location}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {/* Price */}
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 pr-4 text-slate-500 font-medium">Price</td>
                      {compareVillas.map(v => (
                        <td key={v.id} className="text-center py-2.5 px-3 font-mono font-semibold text-slate-700">{formatPriceInCurrency(v)}</td>
                      ))}
                    </tr>
                    {/* Lease */}
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 pr-4 text-slate-500 font-medium">Lease</td>
                      {compareVillas.map(v => {
                        const f = (v.features || '').toLowerCase();
                        const yrs = Number(v.lease_years) || 0;
                        const isFH = f.includes('freehold') || f.includes('hak milik') || yrs === 999;
                        return (
                          <td key={v.id} className={`text-center py-2.5 px-3 ${isFH ? 'text-green-600 font-bold' : 'text-slate-600'}`}>
                            {isFH ? 'Freehold' : yrs > 0 ? `${yrs}yr lease` : 'Unknown'}
                          </td>
                        );
                      })}
                    </tr>
                    {/* Nightly Rate */}
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 pr-4 text-slate-500 font-medium">Nightly Rate</td>
                      {compareVillas.map(v => {
                        const base = v.est_nightly_rate || getDisplayNightly(v);
                        const adjusted = Math.round(base * sliderNightly);
                        return (
                          <td key={v.id} className="text-center py-2.5 px-3 font-mono">
                            <span className="text-slate-700 font-semibold">${adjusted}</span>
                            {sliderNightly !== 1.0 && <span className="text-slate-400 text-[10px] ml-1">(base ${base})</span>}
                          </td>
                        );
                      })}
                    </tr>
                    {/* Occupancy & Expense (shared) */}
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 pr-4 text-slate-500 font-medium">Occupancy</td>
                      {compareVillas.map(v => (
                        <td key={v.id} className="text-center py-2.5 px-3 font-mono text-slate-700">{sliderOccupancy}%</td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2.5 pr-4 text-slate-500 font-medium">Expense Load</td>
                      {compareVillas.map(v => (
                        <td key={v.id} className="text-center py-2.5 px-3 font-mono text-slate-700">{sliderExpense}%</td>
                      ))}
                    </tr>
                    {/* Dynamic calculations */}
                    {(() => {
                      const results = compareVillas.map(v => ({
                        id: v.id,
                        ...calculateDynamicROI(v, sliderNightly, sliderOccupancy, sliderExpense),
                      }));
                      const bestYield = Math.max(...results.map(r => r.netYield));

                      return (
                        <>
                          <tr className="border-b border-slate-100 bg-slate-50/50">
                            <td className="py-2.5 pr-4 text-slate-500 font-medium">Gross Revenue</td>
                            {results.map(r => (
                              <td key={r.id} className="text-center py-2.5 px-3 font-mono text-slate-700">${r.annualRevenue.toLocaleString()}/yr</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-100 bg-slate-50/50">
                            <td className="py-2.5 pr-4 text-slate-500 font-medium">Expenses</td>
                            {results.map(r => (
                              <td key={r.id} className="text-center py-2.5 px-3 font-mono text-red-500">-${r.annualExpenses.toLocaleString()}/yr</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-200 bg-slate-50/50">
                            <td className="py-2.5 pr-4 text-slate-700 font-bold">Net Revenue</td>
                            {results.map(r => (
                              <td key={r.id} className="text-center py-2.5 px-3 font-mono font-bold text-slate-900">${r.netRevenue.toLocaleString()}/yr</td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-100 bg-amber-50/40">
                            <td className="py-2.5 pr-4 text-amber-700 font-medium text-sm">
                              Lease Depreciation
                              <span className="block text-[9px] text-amber-500 font-normal">Asset value loss/yr</span>
                            </td>
                            {results.map(r => (
                              <td key={r.id} className="text-center py-2.5 px-3 font-mono">
                                {r.isFreehold ? (
                                  <span className="text-green-600 text-xs font-medium">Freehold — N/A</span>
                                ) : r.leaseDepreciation > 0 ? (
                                  <div>
                                    <span className="text-amber-600 font-bold">-${r.leaseDepreciation.toLocaleString()}/yr</span>
                                    <span className="block text-[9px] text-amber-500">-{r.depreciationYield}% yield ({r.leaseYears}yr lease)</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-xs">Unknown tenure</span>
                                )}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-2.5 pr-4 text-slate-500 font-medium">Gross Yield</td>
                            {results.map(r => (
                              <td key={r.id} className="text-center py-2.5 px-3 font-mono text-slate-400 line-through">{r.grossYield.toFixed(1)}%</td>
                            ))}
                          </tr>
                          <tr className="bg-blue-50/50">
                            <td className="py-3 pr-4 text-blue-700 font-bold text-sm">
                              Net Yield
                              <span className="block text-[9px] text-blue-400 font-normal">After depreciation</span>
                            </td>
                            {results.map(r => (
                              <td key={r.id} className={`text-center py-3 px-3 font-mono font-bold text-lg ${
                                r.netYield === bestYield && results.filter(x => x.netYield === bestYield).length === 1
                                  ? 'text-emerald-600'
                                  : r.netYield >= 7 ? 'text-blue-600' : r.netYield >= 0 ? 'text-slate-700' : 'text-red-600'
                              }`}>
                                {r.netYield.toFixed(1)}%
                                {r.netYield === bestYield && results.filter(x => x.netYield === bestYield).length === 1 && (
                                  <span className="block text-[9px] text-emerald-500 font-bold mt-0.5">BEST</span>
                                )}
                              </td>
                            ))}
                          </tr>
                          {/* Red Flags row */}
                          <tr>
                            <td className="py-2.5 pr-4 text-slate-500 font-medium">Flags</td>
                            {compareVillas.map(v => {
                              const flags = getRedFlags(v);
                              return (
                                <td key={v.id} className="text-center py-2.5 px-3">
                                  {flags.length === 0 ? (
                                    <span className="text-green-500 text-[10px] font-medium">Clean</span>
                                  ) : (
                                    <div className="flex flex-wrap justify-center gap-1">
                                      {flags.map((f, i) => (
                                        <span key={i} className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${f.level === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{f.label}</span>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Footer note */}
              <div className="px-6 pb-6 text-[10px] text-slate-400 italic">
                These projections are estimates based on your inputs. Actual returns depend on management quality, market conditions, and property-specific factors. BVT does not provide financial advice.
              </div>
            </div>
          </div>
        );
      })()}

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

function BaliMapView({ listings, displayCurrency, rates, hoveredListingUrl, favorites, compareSet, onToggleFavorite, onToggleCompare, onUnlockVilla }: { listings: any[]; displayCurrency: string; rates: Record<string, number>; hoveredListingUrl?: string | null; favorites: Set<number>; compareSet: Set<number>; onToggleFavorite: (id: number) => void; onToggleCompare: (id: number) => void; onUnlockVilla: (villa: any) => void }) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapRef, setMapRef] = useState<any>(null);
  const [markersRef, setMarkersRef] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (!document.querySelector('style[data-bvt-popup]')) {
      const style = document.createElement('style');
      style.setAttribute('data-bvt-popup', '1');
      style.textContent = '.bvt-leaflet-popup .leaflet-popup-content-wrapper { padding: 0; border-radius: 10px; overflow: hidden; } .bvt-leaflet-popup .leaflet-popup-content { margin: 0; min-width: 220px; } .bvt-leaflet-popup .leaflet-popup-tip { background: #f8fafc; }';
      document.head.appendChild(style);
    }
    const loadLeaflet = () => new Promise<void>((resolve) => {
      if ((window as any).L) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
    loadLeaflet().then(() => setMapLoaded(true));
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!mapLoaded) return;
    const L = (window as any).L;
    const container = document.getElementById('bali-map');
    if (!container || !L) return;

    if ((container as any)._leafletMap) {
      (container as any)._leafletMap.remove();
      (container as any)._leafletMap = null;
    }

    const map = L.map('bali-map', { zoomControl: true }).setView([-8.65, 115.15], 11);
    (container as any)._leafletMap = map;
    setMapRef(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OSM',
      maxZoom: 18,
    }).addTo(map);

    setTimeout(() => { map.invalidateSize(); }, 100);

    return () => {
      map.remove();
      if (container) (container as any)._leafletMap = null;
    };
  }, [mapLoaded]);

  // Add/update property markers when listings change
  useEffect(() => {
    if (!mapRef || !mapLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    // Clear existing markers
    Object.values(markersRef).forEach((m: any) => { try { mapRef.removeLayer(m); } catch {} });

    const newMarkers: Record<string, any> = {};
    const markerCluster: any[] = [];

    listings.forEach(villa => {
      const lat = parseFloat(villa.latitude);
      const lng = parseFloat(villa.longitude);
      if (!lat || !lng || lat === 0 || lng === 0) return;

      const roi = villa.projected_roi || 0;
      const roiColor = roi >= 8 ? '#16a34a' : roi >= 5 ? '#2563eb' : '#64748b';

      const marker = L.circleMarker([lat, lng], {
        radius: 5,
        fillColor: roiColor,
        color: '#fff',
        weight: 1,
        opacity: 0.9,
        fillOpacity: 0.7,
      }).addTo(mapRef);

      // Price formatting for popup
      const desc = (villa.price_description || '').trim();
      const priceMatch = desc.match(/^(IDR|USD|AUD|EUR|SGD)\s*([\d,.\s]+)/i);
      let priceStr = '';
      if (priceMatch) {
        const amount = parseFloat(priceMatch[2].replace(/\s|,/g, '')) || 0;
        const cur = priceMatch[1].toUpperCase();
        const r = rates[cur];
        const priceUSD = cur === 'USD' ? amount : (r && r > 0 ? amount / r : amount);
        const displayVal = displayCurrency === 'USD' ? priceUSD : priceUSD * (rates[displayCurrency] || 1);
        priceStr = `${displayCurrency} ${Math.round(displayVal).toLocaleString()}`;
      } else {
        const p = Number(villa.last_price) || 0;
        const priceUSD = p >= 1e6 ? p / (rates['IDR'] || 16782) : p;
        const displayVal = displayCurrency === 'USD' ? priceUSD : priceUSD * (rates[displayCurrency] || 1);
        priceStr = `${displayCurrency} ${Math.round(displayVal).toLocaleString()}`;
      }

      const isFav = favorites.has(villa.id);
      const isCmp = compareSet.has(villa.id);
      const cmpFull = compareSet.size >= 5 && !isCmp;

      marker.bindPopup(`
        <div class="bvt-map-popup" data-villa-id="${villa.id}" style="font-family: system-ui, -apple-system, sans-serif; min-width: 220px; max-width: 280px; margin: -14px -20px -14px -20px;">
          <div style="padding: 10px 12px 8px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 700; font-size: 13px; color: #1e293b; line-height: 1.3; word-wrap: break-word;">${(villa.villa_name || 'Villa').substring(0, 50)}</div>
            <div style="font-size: 11px; color: #475569; margin-top: 2px; font-weight: 500;">${villa.location || 'Bali'} · ${villa.bedrooms || '?'} bed${villa.bathrooms ? ' · ' + villa.bathrooms + ' bath' : ''}</div>
          </div>
          <div style="padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9;">
            <div style="font-weight: 600; font-size: 13px; color: #1e293b;">${priceStr}</div>
            <div style="font-size: 12px; font-weight: 700; color: ${roiColor}; background: ${roi >= 8 ? '#f0fdf4' : roi >= 5 ? '#eff6ff' : '#f8fafc'}; padding: 2px 8px; border-radius: 99px;">${roi.toFixed(1)}%</div>
          </div>
          <div style="display: flex; gap: 6px; padding: 10px 12px; background: #f8fafc;">
            <button data-action="favorite" data-villa-id="${villa.id}" style="flex: 1; padding: 8px 4px; border: 1px solid ${isFav ? '#f43f5e' : '#cbd5e1'}; border-radius: 6px; background: ${isFav ? '#ffe4e6' : 'white'}; font-size: 10px; font-weight: 600; color: ${isFav ? '#e11d48' : '#64748b'}; cursor: pointer; text-align: center; line-height: 1.3;">${isFav ? '♥ Saved' : '♡ Save'}</button>
            <button data-action="compare" data-villa-id="${villa.id}" style="flex: 1; padding: 8px 4px; border: 1px solid ${isCmp ? '#2563eb' : cmpFull ? '#e2e8f0' : '#cbd5e1'}; border-radius: 6px; background: ${isCmp ? '#dbeafe' : 'white'}; font-size: 10px; font-weight: 600; color: ${isCmp ? '#2563eb' : cmpFull ? '#94a3b8' : '#64748b'}; cursor: ${cmpFull ? 'default' : 'pointer'}; text-align: center; line-height: 1.3; ${cmpFull ? 'opacity: 0.5;' : ''}">${isCmp ? '✓ Selected' : 'Compare'}</button>
            <button data-action="unlock" data-villa-id="${villa.id}" style="flex: 1; padding: 8px 4px; border: 1px solid #334155; border-radius: 6px; background: #1e293b; font-size: 10px; font-weight: 600; color: white; cursor: pointer; text-align: center; line-height: 1.3;">🔒 Unlock</button>
          </div>
        </div>
      `, { closeButton: true, className: 'bvt-leaflet-popup' });

      if (villa.url) newMarkers[villa.url] = marker;
      markerCluster.push(marker);
    });

    setMarkersRef(newMarkers);
  }, [mapRef, mapLoaded, listings, displayCurrency, rates, favorites, compareSet]);

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

  // Event delegation for popup action buttons
  useEffect(() => {
    const container = document.getElementById('bali-map');
    if (!container) return;

    const handlePopupClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const button = target.closest('[data-action]') as HTMLElement | null;
      if (!button) return;

      e.stopPropagation();
      const action = button.getAttribute('data-action');
      const villaId = parseInt(button.getAttribute('data-villa-id') || '0');
      if (!villaId) return;

      if (action === 'favorite') {
        onToggleFavorite(villaId);
      } else if (action === 'compare') {
        if (compareSet.size >= 5 && !compareSet.has(villaId)) return;
        onToggleCompare(villaId);
      } else if (action === 'unlock') {
        const villa = listings.find((v: any) => v.id === villaId);
        if (villa) {
          if (mapRef) mapRef.closePopup();
          onUnlockVilla(villa);
        }
      }
    };

    container.addEventListener('click', handlePopupClick);
    return () => container.removeEventListener('click', handlePopupClick);
  }, [onToggleFavorite, onToggleCompare, onUnlockVilla, listings, compareSet, mapRef]);

  // Refresh open popup button states when favorites/compareSet change
  useEffect(() => {
    if (!mapRef) return;
    const popupEl = document.querySelector('.bvt-map-popup');
    if (!popupEl) return;

    const villaId = parseInt(popupEl.getAttribute('data-villa-id') || '0');
    if (!villaId) return;

    const favBtn = popupEl.querySelector('[data-action="favorite"]') as HTMLElement | null;
    const cmpBtn = popupEl.querySelector('[data-action="compare"]') as HTMLElement | null;

    if (favBtn) {
      const isFav = favorites.has(villaId);
      favBtn.style.borderColor = isFav ? '#f43f5e' : '#cbd5e1';
      favBtn.style.background = isFav ? '#ffe4e6' : 'white';
      favBtn.style.color = isFav ? '#e11d48' : '#64748b';
      favBtn.textContent = isFav ? '♥ Saved' : '♡ Save';
    }

    if (cmpBtn) {
      const isCmp = compareSet.has(villaId);
      const cmpFull = compareSet.size >= 5 && !isCmp;
      cmpBtn.style.borderColor = isCmp ? '#2563eb' : cmpFull ? '#e2e8f0' : '#cbd5e1';
      cmpBtn.style.background = isCmp ? '#dbeafe' : 'white';
      cmpBtn.style.color = isCmp ? '#2563eb' : cmpFull ? '#94a3b8' : '#64748b';
      cmpBtn.style.opacity = cmpFull ? '0.5' : '1';
      cmpBtn.textContent = isCmp ? '✓ Selected' : 'Compare';
    }
  }, [favorites, compareSet, mapRef]);

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
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-600 inline-block"></span> ≥15%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span> 10-15%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500 inline-block"></span> &lt;10%</span>
        </div>
      </div>
      <div id="bali-map" className="flex-1" style={{ minHeight: '500px', width: '100%' }}></div>
    </div>
  );
}
