"use client";

import { useState } from "react";
import { Lock, LogIn } from "lucide-react";

export default function SeoDashboardLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/seo-dashboard/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError("Wrong password.");
        return;
      }

      window.location.reload();
    } catch {
      setError("Could not unlock dashboard. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[color:var(--bvt-bg)] text-[color:var(--bvt-ink-body)] flex items-center justify-center px-6 py-12">
      <section className="w-full max-w-[440px] border border-[color:var(--bvt-hairline)] bg-[color:var(--bvt-bg-elev)] rounded-md p-6 md:p-8">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[color:var(--bvt-accent)]/40 text-[color:var(--bvt-accent)] mb-6">
          <Lock size={20} />
        </div>
        <div className="label-micro mb-3">Internal dashboard</div>
        <h1 className="font-display text-[34px] leading-tight tracking-[-0.02em] text-[color:var(--bvt-ink)]">
          SEO dashboard locked
        </h1>
        <p className="mt-4 text-[14px] leading-relaxed text-[color:var(--bvt-ink-muted)]">
          This dashboard tracks internal SEO jobs, indexing queues, and ranking
          observations for Bali Villa Truth.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <div>
            <label htmlFor="seo-dashboard-password" className="label-micro mb-2 block">
              Password
            </label>
            <input
              id="seo-dashboard-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded-md border border-[color:var(--bvt-hairline)] bg-[color:var(--bvt-bg)] px-3 py-3 text-[15px] text-[color:var(--bvt-ink)] outline-none focus:border-[color:var(--bvt-accent)]"
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-md border border-[color:var(--bvt-warn)]/40 px-3 py-2 text-[13px] text-[color:var(--bvt-warn)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[color:var(--bvt-accent)] px-4 py-3 text-[14px] font-semibold text-[color:var(--bvt-bg)] hover:bg-[color:var(--bvt-accent-warm)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <LogIn size={16} />
            {loading ? "Unlocking..." : "Unlock dashboard"}
          </button>
        </form>
      </section>
    </main>
  );
}
