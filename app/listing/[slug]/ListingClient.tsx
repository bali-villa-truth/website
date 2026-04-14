'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ListingClient({
  sourceUrl,
  villaName,
  listingId,
}: {
  sourceUrl: string;
  villaName: string;
  listingId: number;
}) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await supabase.from('leads').insert([
        {
          email,
          villa_id: listingId,
          villa_name: villaName,
          lead_type: 'Unlock Source (Listing Page)',
        },
      ]);
      setSubmitted(true);
      window.open(sourceUrl, '_blank');
    } catch {
      // Still open the link on error
      window.open(sourceUrl, '_blank');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mt-4 text-center">
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all text-center"
        >
          View Original Listing →
        </a>
        <p className="text-xs text-slate-500 mt-2">Opens on Bali Home Immo</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleUnlock} className="mt-4 space-y-3">
      <p className="text-xs text-slate-400 text-center">
        Enter your email to see the original listing source
      </p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
      >
        {loading ? 'Verifying...' : 'Unlock Source Listing'}
      </button>
    </form>
  );
}
