"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Database,
  ExternalLink,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

type DashboardData = any;

const statusTone: Record<string, string> = {
  Live: "border-[color:var(--bvt-good)]/40 text-[color:var(--bvt-good)]",
  Active: "border-[color:var(--bvt-good)]/40 text-[color:var(--bvt-good)]",
  "Deployed this session": "border-[color:var(--bvt-accent)]/50 text-[color:var(--bvt-accent)]",
  Blocked: "border-[color:var(--bvt-warn)]/40 text-[color:var(--bvt-warn)]",
  High: "border-[color:var(--bvt-bad)]/40 text-[color:var(--bvt-bad)]",
  Medium: "border-[color:var(--bvt-warn)]/40 text-[color:var(--bvt-warn)]",
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

function ListPanel({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
}) {
  return (
    <div className="border border-[color:var(--bvt-hairline)] rounded-md overflow-hidden">
      <div className="bg-[color:var(--bvt-bg-elev)] px-4 py-3 flex items-center gap-2">
        <span className="text-[color:var(--bvt-accent)]">{icon}</span>
        <h2 className="font-semibold text-[14px] text-[color:var(--bvt-ink)]">{title}</h2>
      </div>
      <div className="divide-y divide-[color:var(--bvt-hairline)]">
        {items.map((item) => (
          <div key={item} className="p-4 text-[13px] leading-relaxed text-[color:var(--bvt-ink-muted)]">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WebsiteDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/website-dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error(`Dashboard API returned ${response.status}`);
      setData(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await fetch("/api/website-dashboard/login", { method: "DELETE" }).catch(() => {});
    window.location.reload();
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, 60000);
    return () => window.clearInterval(id);
  }, []);

  const healthSummary = useMemo(() => {
    if (!data) return "Waiting for live checks.";
    return `${data.summary.healthOk}/${data.summary.healthTotal} checks passing`;
  }, [data]);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "completed", label: "Completed" },
    { id: "health", label: "Live Checks" },
    { id: "backlog", label: "Backlog" },
    { id: "quality", label: "Quality" },
  ];

  return (
    <div className="min-h-screen bg-[color:var(--bvt-bg)] text-[color:var(--bvt-ink-body)]">
      <main className="max-w-[1400px] mx-auto px-6 md:px-10 py-8 md:py-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between border-b border-[color:var(--bvt-hairline)] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-10 bg-[color:var(--bvt-accent)]" aria-hidden />
              <span className="label-micro">Private website operations</span>
            </div>
            <h1 className="font-display text-[36px] md:text-[48px] leading-tight tracking-[-0.02em] text-[color:var(--bvt-ink)]">
              Bali Villa Truth website dashboard
            </h1>
            <p className="mt-3 max-w-[82ch] text-[14px] md:text-[15px] leading-relaxed text-[color:var(--bvt-ink-muted)]">
              Tracks investor-value improvements, deployed changes, live health,
              data quality issues, blockers, scheduled jobs, and next actions.
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
            icon={<ClipboardCheck size={20} />}
            label="Completed"
            value={data ? `${data.summary.completedCount}` : "-"}
            detail="Tracked website improvements with user-facing or operational impact."
          />
          <Metric
            icon={<Activity size={20} />}
            label="Live health"
            value={data ? `${data.summary.healthOk}/${data.summary.healthTotal}` : "-"}
            detail={healthSummary}
          />
          <Metric
            icon={<BarChart3 size={20} />}
            label="Sitemap URLs"
            value={data ? `${data.summary.sitemapUrls}` : "-"}
            detail="Read live from the canonical non-www sitemap."
          />
          <Metric
            icon={<AlertTriangle size={20} />}
            label="Blockers"
            value={data ? `${data.summary.blockerCount}` : "-"}
            detail="External access, account setup, or approval needed before moving forward."
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

        {tab === "overview" && (
          <section className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 border border-[color:var(--bvt-hairline)] bg-[color:var(--bvt-bg-elev)] rounded-md p-5">
              <div className="flex items-center gap-2 text-[color:var(--bvt-accent)]">
                <LayoutDashboard size={18} />
                <span className="label-micro text-[color:var(--bvt-accent)]">Current focus</span>
              </div>
              <p className="mt-4 text-[18px] md:text-[20px] leading-relaxed text-[color:var(--bvt-ink)]">
                {data?.summary.currentFocus || "Loading current focus."}
              </p>
              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                {(data?.contentPages || []).map((page: any) => (
                  <a
                    key={page.url}
                    href={page.url}
                    className="block border border-[color:var(--bvt-hairline)] hover:border-[color:var(--bvt-accent)]/60 rounded-md p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold text-[13px] leading-tight text-[color:var(--bvt-ink)]">{page.title}</div>
                      <ExternalLink size={13} className="text-[color:var(--bvt-accent)] shrink-0" />
                    </div>
                    <div className="mt-2">
                      <Pill tone={statusTone[page.status]}>{page.status}</Pill>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 border border-[color:var(--bvt-hairline)] rounded-md overflow-hidden">
              <div className="bg-[color:var(--bvt-bg-elev)] px-4 py-3 flex items-center gap-2">
                <CalendarClock size={16} className="text-[color:var(--bvt-accent)]" />
                <h2 className="font-semibold text-[14px] text-[color:var(--bvt-ink)]">Scheduled jobs</h2>
              </div>
              <div className="divide-y divide-[color:var(--bvt-hairline)]">
                {(data?.scheduledJobs || []).map((job: any) => (
                  <div key={job.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-[color:var(--bvt-ink)]">{job.id}</div>
                        <div className="mt-1 text-[12px] text-[color:var(--bvt-ink-muted)]">{job.cadence}</div>
                      </div>
                      <Pill tone={statusTone[job.status]}>{job.status}</Pill>
                    </div>
                    <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--bvt-ink-muted)]">{job.purpose}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {tab === "completed" && (
          <section className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
            {(data?.completedImprovements || []).map((item: any) => (
              <div key={`${item.date}-${item.title}`} className="border border-[color:var(--bvt-hairline)] bg-[color:var(--bvt-bg-elev)] rounded-md p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="label-micro mb-2">{item.date} · {item.area}</div>
                    <a href={item.url} className="font-display text-[24px] leading-tight text-[color:var(--bvt-ink)] hover:text-[color:var(--bvt-accent)]">
                      {item.title}
                    </a>
                  </div>
                  <Pill tone={statusTone[item.status]}>{item.status}</Pill>
                </div>
                <p className="mt-4 text-[13px] leading-relaxed text-[color:var(--bvt-ink-muted)]">{item.why}</p>
                <div className="mt-4 text-[11px] text-[color:var(--bvt-ink-dim)] font-mono">
                  {item.progressFile}
                </div>
              </div>
            ))}
          </section>
        )}

        {tab === "health" && (
          <section className="mt-6 border border-[color:var(--bvt-hairline)] rounded-md overflow-hidden">
            <div className="bg-[color:var(--bvt-bg-elev)] px-4 py-3 flex items-center gap-2">
              <Activity size={16} className="text-[color:var(--bvt-accent)]" />
              <h2 className="font-semibold text-[14px] text-[color:var(--bvt-ink)]">Live checks</h2>
            </div>
            <div className="divide-y divide-[color:var(--bvt-hairline)]">
              {(data?.coreChecks || []).map((check: any) => (
                <div key={check.name} className="p-4 flex items-start justify-between gap-4">
                  <div>
                    <a href={check.url} className="font-semibold text-[color:var(--bvt-ink)] hover:text-[color:var(--bvt-accent)]">{check.name}</a>
                    <div className="mt-1 text-[12px] text-[color:var(--bvt-ink-muted)]">{check.detail}</div>
                    {check.title && <div className="mt-1 text-[11px] text-[color:var(--bvt-ink-dim)]">{check.title}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    {check.ok ? <CheckCircle2 size={18} className="ml-auto text-[color:var(--bvt-good)]" /> : <AlertTriangle size={18} className="ml-auto text-[color:var(--bvt-warn)]" />}
                    <div className="mt-1 font-mono text-[11px] text-[color:var(--bvt-ink-dim)]">{check.status} · {check.ms}ms</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "backlog" && (
          <section className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="border border-[color:var(--bvt-hairline)] rounded-md overflow-hidden">
              <div className="bg-[color:var(--bvt-bg-elev)] px-4 py-3 flex items-center gap-2">
                <ClipboardCheck size={16} className="text-[color:var(--bvt-accent)]" />
                <h2 className="font-semibold text-[14px] text-[color:var(--bvt-ink)]">Pending improvements</h2>
              </div>
              <div className="divide-y divide-[color:var(--bvt-hairline)]">
                {(data?.pendingImprovements || []).map((item: any) => (
                  <div key={item.title} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="label-micro mb-1">{item.owner}</div>
                        <div className="font-semibold text-[color:var(--bvt-ink)]">{item.title}</div>
                      </div>
                      <Pill tone={statusTone[item.priority]}>{item.priority}</Pill>
                    </div>
                    <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--bvt-ink-muted)]">{item.nextAction}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[color:var(--bvt-hairline)] rounded-md overflow-hidden">
              <div className="bg-[color:var(--bvt-bg-elev)] px-4 py-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-[color:var(--bvt-warn)]" />
                <h2 className="font-semibold text-[14px] text-[color:var(--bvt-ink)]">Known blockers</h2>
              </div>
              <div className="divide-y divide-[color:var(--bvt-hairline)]">
                {(data?.blockers || []).map((item: any) => (
                  <div key={item.blocker} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="font-semibold text-[color:var(--bvt-ink)]">{item.blocker}</div>
                      <Pill tone={statusTone.Blocked}>Blocked</Pill>
                    </div>
                    <div className="mt-2 text-[12px] text-[color:var(--bvt-warn)]">{item.status}</div>
                    <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--bvt-ink-muted)]">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {tab === "quality" && (
          <section className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ListPanel title="Data quality issues" icon={<Database size={16} />} items={data?.dataQualityIssues || []} />
            <ListPanel title="UX and navigation issues" icon={<LayoutDashboard size={16} />} items={data?.uxIssues || []} />
            <ListPanel title="Investor-value improvements" icon={<ShieldCheck size={16} />} items={data?.investorValueImprovements || []} />
            <ListPanel title="Mobile checks" icon={<Smartphone size={16} />} items={data?.mobileUsabilityChecks || []} />
            <ListPanel title="Style and design" icon={<BarChart3 size={16} />} items={data?.styleDesignImprovements || []} />
            <ListPanel title="Performance checks" icon={<Activity size={16} />} items={data?.performanceChecks || []} />
            <div className="xl:col-span-2">
              <ListPanel title="Next recommended actions" icon={<ClipboardCheck size={16} />} items={data?.nextActions || []} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
