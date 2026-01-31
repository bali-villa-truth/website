'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AlertTriangle, MapPin, Bed, Ruler, Calendar, ExternalLink, Lock, X, ShieldCheck } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BaliVillaTruth() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVilla, setSelectedVilla] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('listings_tracker')
        .select('*')
        .order('projected_roi', { ascending: false });
      if (error) console.error(error);
      else setListings(data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

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
      // SUCCESS: Open the original link and close modal
      window.open(selectedVilla.url, '_blank');
      setSelectedVilla(null);
      setEmail('');
    } else {
      alert("Error joining the audit list. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      {/* HEADER */}
      <header className="max-w-6xl mx-auto mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Bali Villa <span className="text-blue-600">Truth</span>
        </h1>
        <p className="text-slate-500 max-w-lg mx-auto text-sm leading-relaxed">
          Independent ROI auditing for serious investors. We verify the data agents hide.
        </p>
      </header>

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

      {/* TABLE */}
      <main className="max-w-6xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                <th className="p-5">Asset & Location</th>
                <th className="p-5">Price (USD)</th>
                <th className="p-5 text-center">Verified ROI</th>
                <th className="p-5">Truth Audit</th>
                <th className="p-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listings.map((villa) => (
                <tr key={villa.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="p-5">
                    <div className="font-bold text-slate-900 mb-1">{villa.villa_name}</div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                      <MapPin size={12} className="text-blue-500" /> {villa.location || "Bali"}
                    </div>
                  </td>
                  <td className="p-5 font-mono text-slate-600 font-semibold">
                    ${villa.last_price?.toLocaleString()}
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col items-center">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold border border-green-200">
                        {villa.projected_roi?.toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1 font-mono">${villa.est_nightly_rate}/nt</span>
                    </div>
                  </td>
                  <td className="p-5 text-xs text-slate-600 space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-slate-400"/>
                      {villa.lease_years === 999 ? <span className="font-bold text-green-600">Freehold</span> : <span>{villa.lease_years} Yrs</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Ruler size={12} className="text-slate-400"/> {villa.land_size} Are
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
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}