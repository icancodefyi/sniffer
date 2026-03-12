"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface SavedCase {
  caseId: string;
  domain: string | null;
  caseRef: string | null;
  savedAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [cases, setCases] = useState<SavedCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user/cases")
      .then((r) => r.json())
      .then((d: { cases: SavedCase[] }) => {
        setCases(d.cases ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#e8e4de] border-t-[#0a0a0a] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">

      {/* Nav */}
      <header className="border-b border-[#e8e4de] px-6 py-4 flex items-center gap-3 bg-white sticky top-0 z-10">
        <Link
          href="/"
          className="font-mono text-[13px] text-[#0a0a0a] tracking-widest uppercase hover:opacity-70 transition-opacity"
        >
          Sniffer
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <span className="text-[13px] text-[#9ca3af]">My Cases</span>
        <div className="ml-auto flex items-center gap-3">
          {session?.user?.email && (
            <span className="hidden sm:block text-[12px] text-[#9ca3af] font-mono truncate max-w-[200px]">
              {session.user.email}
            </span>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-[12px] text-[#9ca3af] hover:text-[#0a0a0a] transition-colors border border-[#e8e4de] px-3 py-1.5 rounded-lg"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">

        {/* Header */}
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] text-[#a8a29e] uppercase tracking-widest mb-3">Your Account</p>
            <h1 className="text-[24px] font-bold text-[#0a0a0a] tracking-tight mb-2">Saved Cases</h1>
            <p className="text-[13px] text-[#6b7280]">
              {loading
                ? "Loading…"
                : cases.length === 0
                  ? "No saved cases yet."
                  : `${cases.length} case${cases.length !== 1 ? "s" : ""} tracked`}
            </p>
          </div>
          <Link
            href="/verify"
            className="shrink-0 text-[12.5px] font-medium bg-[#0a0a0a] text-white px-4 py-2 rounded-full hover:bg-[#1a1a1a] transition-colors"
          >
            New Verification
          </Link>
        </div>

        {/* Case list */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[60px] bg-[#f0ede8] rounded-xl" />
            ))}
          </div>
        ) : cases.length === 0 ? (
          <div className="border border-dashed border-[#e8e4de] rounded-xl p-12 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#f0ede8] border border-[#e8e4de] flex items-center justify-center mx-auto mb-4">
              <svg width="18" height="18" fill="none" stroke="#9ca3af" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <p className="text-[13px] font-medium text-[#374151] mb-1.5">No saved cases yet</p>
            <p className="text-[12px] text-[#9ca3af] max-w-xs mx-auto mb-5">
              Run a verification and click &quot;Save report&quot; to track your cases here.
            </p>
            <Link
              href="/verify"
              className="inline-flex text-[12.5px] font-medium bg-[#0a0a0a] text-white px-5 py-2 rounded-full hover:bg-[#1a1a1a] transition-colors"
            >
              Verify an image
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {cases.map((c) => (
              <CaseRow
                key={c.caseId}
                savedCase={c}
                onRemove={(id) => setCases((prev) => prev.filter((x) => x.caseId !== id))}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-[#e8e4de] mt-12 pt-6 flex items-center justify-between">
          <p className="font-mono text-[10px] text-[#c4bdb5]">SNIFFER · IMPIC LABS · 2026</p>
          <Link href="/verify" className="text-[12px] text-indigo-600 hover:underline">
            New verification →
          </Link>
        </div>

      </main>
    </div>
  );
}

// ── Case row ──────────────────────────────────────────────────────────────────

function CaseRow({
  savedCase,
  onRemove,
}: {
  savedCase: SavedCase;
  onRemove: (id: string) => void;
}) {
  const [removing, setRemoving] = useState(false);

  const date = new Date(savedCase.savedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  async function handleRemove() {
    setRemoving(true);
    await fetch(`/api/user/cases?caseId=${savedCase.caseId}`, { method: "DELETE" });
    onRemove(savedCase.caseId);
  }

  const displayRef =
    savedCase.caseRef ?? `SNF-${savedCase.caseId.slice(0, 8).toUpperCase()}`;

  return (
    <div className="border border-[#e8e4de] rounded-xl bg-white px-4 py-3.5 flex items-center gap-4 group hover:border-[#c4bdb5] transition-colors">
      <div className="w-8 h-8 rounded-lg bg-[#f0ede8] border border-[#e8e4de] flex items-center justify-center shrink-0">
        <svg width="13" height="13" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <Link href={`/report/${savedCase.caseId}`} className="block group/link">
          <p className="font-mono text-[11.5px] font-semibold text-[#374151] group-hover/link:text-[#0a0a0a] transition-colors">
            {displayRef}
          </p>
          {savedCase.domain && (
            <p className="text-[11px] text-[#9ca3af] mt-0.5 truncate">{savedCase.domain}</p>
          )}
        </Link>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="hidden sm:block font-mono text-[10px] text-[#9ca3af]">{date}</span>
        <Link
          href={`/report/${savedCase.caseId}`}
          className="text-[12px] text-indigo-600 hover:underline"
        >
          View
        </Link>
        <button
          onClick={handleRemove}
          disabled={removing}
          className="text-[12px] text-[#9ca3af] hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40"
        >
          {removing ? "…" : "Remove"}
        </button>
      </div>
    </div>
  );
}


export const metadata = {
  title: "Dashboard — Sniffer",
  description:
    "Real-time insights into manipulated media and deepfake threats detected across the platform.",
};

const STATS = [
  { label: "Total Verifications", value: "287", delta: "+12 today" },
  { label: "Deepfakes Detected", value: "145", delta: "+8 today", alert: true },
  { label: "Registry Entries", value: "203", delta: "+2 today" },
  { label: "Takedown Notices", value: "67", delta: "+1 today" },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <Navbar />

      {/* Page header */}
      <div className="border-b border-[#e8e4de] bg-white pt-18">
        <div className="max-w-350 mx-auto px-4 sm:px-8 py-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#a8a29e] mb-2">
                Intelligence Platform
              </p>
              <h1 className="text-[1.6rem] sm:text-[2rem] font-semibold tracking-tight text-[#0a0a0a]">
                Media Integrity Intelligence Dashboard
              </h1>
              <p className="text-[13.5px] text-[#6b7280] mt-2 max-w-xl leading-relaxed">
                Real-time insights into manipulated media and deepfake threats detected across the platform.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Link
                href="/verify"
                className="px-4 py-2 rounded-full text-[12.5px] font-medium bg-[#0a0a0a] text-white hover:bg-[#1a1a1a] transition-colors"
              >
                New Verification
              </Link>
              <Link
                href="/protect"
                className="px-4 py-2 rounded-full text-[12.5px] font-medium border border-[#e8e4de] text-[#374151] bg-white hover:border-[#0a0a0a] transition-colors"
              >
                Registry
              </Link>
            </div>
          </div>

          {/* Top-level stats ticker */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 mt-6 border border-[#e8e4de] rounded-xl overflow-hidden">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={`px-5 py-4 bg-white ${i < STATS.length - 1 ? "border-r border-[#e8e4de]" : ""}`}
              >
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#a8a29e] mb-1">
                  {s.label}
                </p>
                <p className="text-[22px] font-semibold font-mono text-[#0a0a0a] tabular-nums">
                  {s.value}
                </p>
                <p
                  className="text-[11px] font-mono mt-0.5"
                  style={{ color: s.alert ? "#ef4444" : "#9ca3af" }}
                >
                  {s.delta}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard grid */}
      <div className="max-w-350 mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Row 1: Threat Meter + Signal Radar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ThreatMeter />
          <SignalRadar />
        </div>

        {/* Row 2: Platform + Synthetic + Engine Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <PlatformDistribution />
          <SyntheticBreakdown />
          <EngineStatus />
        </div>

        {/* Row 3: Content Signals + Live Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
          <ContentSignals />
          <ThreatTimeline />
        </div>

        {/* Row 4: Activity Heatmap */}
        <ActivityHeatmap />
      </div>

      {/* Footer */}
      <div className="border-t border-[#e8e4de] py-6 bg-white mt-4">
          <div className="max-w-350 mx-auto px-4 sm:px-8 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[10.5px] text-[#a8a29e]">
            SNIFFER · MEDIA INTELLIGENCE DASHBOARD · 2026
          </p>
          <p className="font-mono text-[10px] text-[#c4bdb5]">
            Metrics are partially simulated for demonstration purposes
          </p>
        </div>
      </div>
    </div>
  );
}
