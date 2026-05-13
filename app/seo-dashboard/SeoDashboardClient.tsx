"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  Link as LinkIcon,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

type DashboardData = any;

const statusTone: Record<string, string> = {
  Observed: "border-[color:var(--bvt-good)]/40 text-[color:var(--bvt-good)]",
  Prepared: "border-[color:var(--bvt-accent)]/40 text-[color:var(--bvt-accent)]",
  "Needs check": "border-[color:var(--bvt-warn)]/40 text-[color:var(--bvt-warn)]",
  Active: "border-[color:var(--bvt-good)]/40 text-[color:var(--bvt-good)]",
  Healthy: "border-[color:var(--bvt-good)]/40 text-[color:var(--bvt-good)]",
  Blocked: "border-[color:var(--bvt-warn)]/40 text-[color:var(--bvt-warn)]",
};

function Pill({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-semibold ${tone || "border-[color:var(--bvt-hairline)] text-[color:var(--bvt-ink-muted)]"}`}>
      {children}
    </span>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border border-[color:var(--bvt-hairline)] bg-[color:var(--bvt-bg-elev)] rounded-md p-5 min-h-[148px]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[color:var(--bvt-accent)]">{icon}</span>
        <span className="label-micro">{label}</span>
      </div>
      <div className="mt-5 font-mono text-[28px] leading-none text-[color:var(--bvt-ink)] tabular-nums">
        {value}
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-[color:var(--bvt-ink-muted)]">
        {detail}
      </p>
    </div>
  );
}

function rankScore(keyword: any) {
  if (!keyword.bestObservedPage) return 0;
  return Math.max(4, Math.min(100, Math.round(100 - (keyword.bestObservedPage - 1) * 7)));
}

export default function SeoDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("keywords");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/seo-dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error(`Dashboard API returned ${response.status}`);
      setData(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await fetch("/api/seo-dashboard/login", { method: "DELETE" }).catch(() => {});
    window.location.reload();
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, 60000);
    return () => window.clearInterval(id);
  }, []);

  const keywords = useMemo(() => {
    const rows = data?.keywords || [];
    if (!query.trim()) return rows;
    const needle = query.toLowerCase();
    return rows.filter((row: any) =>
      `${row.keyword} ${row.intent} ${row.status} ${row.bestObservedTitle}`.toLowerCase().includes(needle)
    );
  }, [data, query]);

  const tabs = [
    { id: "keywords", label: "Keywords" },
    { id: "jobs", label: "Scheduled Jobs" },
    { id: "health", label: "Live Health" },
    { id: "gsc", label: "GSC Queue" },
  ];

  return (
    <div className="min-h-screen bg-[color:var(--bvt-bg)] text-[color:var(--bvt-ink-body)]">
      <main className="max-w-[1400px] mx-auto px-6 md:px-10 py-8 md:py-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between border-b border-[color:var(--bvt-hairline)] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-10 bg-[color:var(--bvt-accent)]" aria-hidden />
              <span className="label-micro">Live SEO operations</span>
            </div>
            <h1 className="font-display text-[36px] md:text-[48px] leading-tight tracking-[-0.02em] text-[color:var(--bvt-ink)]">
              Bali Villa Truth SEO dashboard
            </h1>
            <p className="mt-3 max-w-[76ch] text-[14px] md:text-[15px] leading-relaxed text-[color:var(--bvt-ink-muted)]">
              Tracks live crawl health, keyword observations, indexing blockers,
              and recurring SEO jobs for the BVT visibility push.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Pill tone="border-[color:var(--bvt-good)]/40 text-[color:var(--bvt-good)]">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-[color:var(--bvt-good)]" />
              Auto-refresh 60s
            </Pill>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-md bg-[color:var(--bvt-accent)] px-3.5 py-2 text-[13px] font-semibold text-[color:var(--bvt-bg)] hover:bg-[color:var(--bvt-accent-warm)] transition-colors"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-md border border-[color:var(--bvt-hairline)] px-3.5 py-2 text-[13px] font-semibold text-[color:var(--bvt-ink-muted)] hover:text-[color:var(--bvt-ink)] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 border border-[color:var(--bvt-warn)]/40 bg-[color:var(--bvt-bg-elev)] rounded-md p-4 text-[14px] text-[color:var(--bvt-warn)]">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
          <Metric
            icon={<Search size={20} />}
            label="Best observed rank"
            value={data ? `Page ${data.summary.bestObservedPage}` : "—"}
            detail="Manual Google screenshot showed BVT around page 12 for bali villa roi."
          />
          <Metric
            icon={<ShieldCheck size={20} />}
            label="Indexed pages"
            value={data ? `${data.summary.indexed}` : "—"}
            detail={data ? `${data.summary.indexedPercent}% of last known GSC indexed/not-indexed set.` : "Waiting for API data."}
          />
          <Metric
            icon={<LinkIcon size={20} />}
            label="Sitemap URLs"
            value={data ? `${data.summary.sitemapUrls}` : "—"}
            detail="Live sitemap count from /sitemap.xml."
          />
          <Metric
            icon={<CalendarClock size={20} />}
            label="SEO loop"
            value={data ? data.summary.automationCadence : "—"}
            detail="Codex automation cadence for recurring SEO follow-up."
          />
        </section>

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`rounded-md px-3 py-2 text-[13px] font-semibold transition-colors ${
                  tab === item.id
                    ? "bg-[color:var(--bvt-accent)] text-[color:var(--bvt-bg)]"
                    : "border border-[color:var(--bvt-hairline)] text-[color:var(--bvt-ink-muted)] hover:text-[color:var(--bvt-ink)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="text-[12px] text-[color:var(--bvt-ink-dim)]">
            Last refreshed: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : "loading"}
          </div>
        </div>

        {tab === "keywords" && (
          <section className="mt-6">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-display text-[28px] text-[color:var(--bvt-ink)]">Keyword visibility</h2>
                <p className="mt-1 text-[13px] text-[color:var(--bvt-ink-muted)]">
                  Exact daily ranks need GSC or a SERP API. Rows below separate verified observations from tracking targets.
                </p>
              </div>
              <div className="relative w-full md:w-[320px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--bvt-ink-dim)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter keywords"
                  className="w-full rounded-md border border-[color:var(--bvt-hairline)] bg-[color:var(--bvt-bg-elev)] py-2 pl-9 pr-3 text-[13px] text-[color:var(--bvt-ink)] outline-none focus:border-[color:var(--bvt-accent)]"
                />
              </div>
            </div>
            <div className="overflow-x-auto border border-[color:var(--bvt-hairline)] rounded-md">
              <table className="w-full min-w-[980px] text-left text-[13px]">
                <thead className="bg-[color:var(--bvt-bg-elev)] text-[color:var(--bvt-ink-muted)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Keyword</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Observed Rank</th>
                    <th className="px-4 py-3 font-semibold">Best BVT URL</th>
                    <th className="px-4 py-3 font-semibold">Next Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--bvt-hairline)]">
                  {keywords.map((row: any) => (
                    <tr key={row.keyword} className="align-top">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-[color:var(--bvt-ink)]">{row.keyword}</div>
                        <div className="mt-1 text-[12px] text-[color:var(--bvt-ink-muted)]">{row.intent}</div>
                      </td>
                      <td className="px-4 py-4">
                        <Pill tone={statusTone[row.status]}>{row.status}</Pill>
                        <div className="mt-2 text-[11px] leading-relaxed text-[color:var(--bvt-ink-dim)]">{row.source}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-mono text-[color:var(--bvt-ink)]">
                          {row.bestObservedPage ? `Page ${row.bestObservedPage}` : "Not verified"}
                        </div>
                        <div className="mt-2 h-2 w-32 rounded-full bg-white/10">
                          <div
                            className="h-2 rounded-full bg-[color:var(--bvt-accent)]"
                            style={{ width: `${rankScore(row)}%` }}
                          />
                        </div>
                        <div className="mt-1 text-[11px] text-[color:var(--bvt-ink-dim)]">
                          {row.bestObservedRange ? `Approx. results ${row.bestObservedRange}` : "Awaiting GSC/public observation"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <a href={row.bestObservedUrl} className="inline-flex items-center gap-1.5 text-[color:var(--bvt-accent)] hover:text-[color:var(--bvt-accent-warm)]">
                          {row.bestObservedTitle}
                          <ExternalLink size={12} />
                        </a>
                      </td>
                      <td className="px-4 py-4 max-w-[300px] text-[color:var(--bvt-ink-muted)]">{row.nextAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "jobs" && (
          <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(data?.jobs || []).map((job: any) => (
              <div key={job.id} className="border border-[color:var(--bvt-hairline)] bg-[color:var(--bvt-bg-elev)] rounded-md p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="label-micro mb-2">{job.owner}</div>
                    <h2 className="font-display text-[24px] leading-tight text-[color:var(--bvt-ink)]">{job.name}</h2>
                  </div>
                  <Pill tone={statusTone[job.status]}>{job.status}</Pill>
                </div>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                  <div>
                    <div className="label-micro mb-1">Cadence</div>
                    <div className="text-[color:var(--bvt-ink)]">{job.cadence}</div>
                  </div>
                  <div>
                    <div className="label-micro mb-1">Last known run</div>
                    <div className="text-[color:var(--bvt-ink)]">{job.lastKnownRun}</div>
                  </div>
                </div>
                <p className="mt-4 text-[13px] leading-relaxed text-[color:var(--bvt-ink-muted)]">{job.nextAction}</p>
              </div>
            ))}
          </section>
        )}

        {tab === "health" && (
          <section className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="border border-[color:var(--bvt-hairline)] rounded-md overflow-hidden">
              <div className="bg-[color:var(--bvt-bg-elev)] px-4 py-3 flex items-center gap-2">
                <Activity size={16} className="text-[color:var(--bvt-accent)]" />
                <h2 className="font-semibold text-[14px] text-[color:var(--bvt-ink)]">Core checks</h2>
              </div>
              <div className="divide-y divide-[color:var(--bvt-hairline)]">
                {(data?.checks || []).map((check: any) => (
                  <div key={check.name} className="p-4 flex items-start justify-between gap-4">
                    <div>
                      <a href={check.url} className="font-semibold text-[color:var(--bvt-ink)] hover:text-[color:var(--bvt-accent)]">{check.name}</a>
                      <div className="mt-1 text-[12px] text-[color:var(--bvt-ink-muted)]">{check.detail}</div>
                    </div>
                    <div className="text-right shrink-0">
                      {check.ok ? <CheckCircle2 size={18} className="ml-auto text-[color:var(--bvt-good)]" /> : <AlertTriangle size={18} className="ml-auto text-[color:var(--bvt-warn)]" />}
                      <div className="mt-1 font-mono text-[11px] text-[color:var(--bvt-ink-dim)]">{check.status} · {check.ms}ms</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[color:var(--bvt-hairline)] rounded-md overflow-hidden">
              <div className="bg-[color:var(--bvt-bg-elev)] px-4 py-3 flex items-center gap-2">
                <BarChart3 size={16} className="text-[color:var(--bvt-accent)]" />
                <h2 className="font-semibold text-[14px] text-[color:var(--bvt-ink)]">Location hubs</h2>
              </div>
              <div className="divide-y divide-[color:var(--bvt-hairline)] max-h-[520px] overflow-auto">
                {(data?.hubs || []).map((hub: any) => (
                  <div key={hub.slug} className="p-4 grid grid-cols-[1fr_auto] gap-4">
                    <div>
                      <a href={hub.url} className="font-semibold capitalize text-[color:var(--bvt-ink)] hover:text-[color:var(--bvt-accent)]">{hub.slug.replace("-", " ")}</a>
                      <div className="mt-1 text-[12px] text-[color:var(--bvt-ink-muted)]">
                        {hub.listingLinks} listing links · ROI guide {hub.roiGuideLinks} · Lease guide {hub.leaseGuideLinks}
                      </div>
                    </div>
                    <Pill tone={hub.ok && hub.roiGuideLinks && hub.leaseGuideLinks ? statusTone.Healthy : statusTone.Blocked}>
                      {hub.ok && hub.roiGuideLinks && hub.leaseGuideLinks ? "Healthy" : "Review"}
                    </Pill>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {tab === "gsc" && (
          <section className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 border border-[color:var(--bvt-hairline)] bg-[color:var(--bvt-bg-elev)] rounded-md p-5">
              <div className="flex items-center gap-2 text-[color:var(--bvt-warn)]">
                <AlertTriangle size={18} />
                <span className="label-micro text-[color:var(--bvt-warn)]">Current blocker</span>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-[color:var(--bvt-ink-body)]">{data?.gsc.status}</p>
              <div className="mt-5 space-y-3 text-[13px] text-[color:var(--bvt-ink-muted)]">
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  Last known clicks: {data?.gsc.clicks}
                </div>
                <div>Indexed: {data?.gsc.indexed}</div>
                <div>Not indexed: {data?.gsc.notIndexed}</div>
              </div>
            </div>
            <div className="lg:col-span-8 border border-[color:var(--bvt-hairline)] rounded-md overflow-hidden">
              <div className="bg-[color:var(--bvt-bg-elev)] px-4 py-3">
                <h2 className="font-semibold text-[14px] text-[color:var(--bvt-ink)]">Next GSC indexing order</h2>
              </div>
              <div className="divide-y divide-[color:var(--bvt-hairline)]">
                {(data?.gsc.queue || []).map((url: string, index: number) => (
                  <div key={url} className="p-4 flex items-center gap-4">
                    <div className="font-mono text-[12px] text-[color:var(--bvt-accent)] w-7 shrink-0">{String(index + 1).padStart(2, "0")}</div>
                    <a href={url} className="text-[13px] text-[color:var(--bvt-ink)] hover:text-[color:var(--bvt-accent)] break-all">{url}</a>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
