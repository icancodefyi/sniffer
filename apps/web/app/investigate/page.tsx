"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { extractDomain } from "@/lib/url";

// ── Types ─────────────────────────────────────────────────────────────────────

interface IntelligenceResult {
  domain: string;
  found: boolean;
  cdn_provider: string | null;
  provider_type: string | null;
  network: string | null;
  confidence: number;
  source: string;
}

interface TakedownResult {
  domain: string;
  found: boolean;
  removal_type: string | null;
  removal_page: string | null;
  contact_email: string | null;
  status: string;
  confidence: number;
  source: string;
}

interface Results {
  domain: string;
  intelligence: IntelligenceResult | null;
  takedown: TakedownResult | null;
  intelligenceError?: string;
  takedownError?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { dot: string; label: string; text: string }> = {
  verified:   { dot: "bg-emerald-500", label: "Verified",   text: "text-emerald-700" },
  partial:    { dot: "bg-amber-400",   label: "Partial",    text: "text-amber-700"   },
  unverified: { dot: "bg-orange-400",  label: "Unverified", text: "text-orange-700"  },
  scraped:    { dot: "bg-blue-400",    label: "Live Scan",  text: "text-blue-700"    },
  not_found:  { dot: "bg-[#d4cfc9]",  label: "Not Found",  text: "text-[#9ca3af]"   },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function InvestigatePage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const analyze = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    const domain = extractDomain(trimmed);
    if (!domain) {
      setError("Please enter a valid URL or domain.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    const [intelRes, takedownRes] = await Promise.allSettled([
      fetch(`/api/intelligence/${encodeURIComponent(domain)}`),
      fetch(`/api/takedown/${encodeURIComponent(domain)}`),
    ]);

    let intelligence: IntelligenceResult | null = null;
    let intelligenceError: string | undefined;
    let takedown: TakedownResult | null = null;
    let takedownError: string | undefined;

    if (intelRes.status === "fulfilled" && intelRes.value.ok) {
      intelligence = await intelRes.value.json();
    } else {
      intelligenceError = "Intelligence service unavailable";
    }

    if (takedownRes.status === "fulfilled" && takedownRes.value.ok) {
      takedown = await takedownRes.value.json();
    } else {
      takedownError = "Takedown service unavailable";
    }

    setResults({ domain, intelligence, takedown, intelligenceError, takedownError });
    setLoading(false);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    analyze(input);
  }

  function copyEmail(email: string) {
    navigator.clipboard.writeText(email).then(() => {
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2500);
    });
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
        <span className="text-[13px] text-[#9ca3af]">Investigate Domain</span>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/takedown"
            className="text-[12px] text-[#6b7280] hover:text-[#0a0a0a] border border-[#e8e4de] px-3 py-1.5 rounded-lg transition-colors"
          >
            Takedown Notice
          </Link>
          <Link
            href="/verify"
            className="text-[12px] font-medium bg-[#0a0a0a] text-white px-4 py-1.5 rounded-full hover:bg-[#1a1a1a] transition-colors"
          >
            Verify Image
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">

        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#f0ede8] border border-[#e8e4de] flex items-center justify-center">
              <svg width="15" height="15" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
            </div>
            <p className="font-mono text-[10px] text-[#a8a29e] uppercase tracking-widest">Domain Intelligence</p>
          </div>
          <h1 className="text-[26px] font-bold text-[#0a0a0a] tracking-tight mb-3">
            Investigate a Platform
          </h1>
          <p className="text-[13.5px] text-[#6b7280] leading-relaxed max-w-prose">
            Paste any URL or domain where content is being misused. Sniffer will identify the
            hosting network and show you exactly how to request removal.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://example.com/video/abc  or  example.com"
              className="flex-1 rounded-xl border border-[#e8e4de] bg-white px-4 py-3 text-[13px] text-[#0a0a0a] placeholder:text-[#c4bdb5] focus:outline-none focus:border-[#0a0a0a] transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex items-center gap-2 bg-[#0a0a0a] text-white text-[13px] font-semibold px-5 py-3 rounded-xl hover:bg-[#1a1a1a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
              )}
              {loading ? "Analyzing…" : "Analyze"}
            </button>
          </div>
          {error && <p className="mt-2 text-[12px] text-red-600 px-1">{error}</p>}
        </form>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 w-28 bg-[#e8e4de] rounded" />
            <div className="rounded-xl border border-[#e8e4de] bg-white p-5 space-y-3">
              <div className="h-3 w-40 bg-[#f0ede8] rounded" />
              <div className="h-3 w-56 bg-[#f0ede8] rounded" />
              <div className="h-3 w-32 bg-[#f0ede8] rounded" />
            </div>
            <div className="h-4 w-28 bg-[#e8e4de] rounded" />
            <div className="rounded-xl border border-[#e8e4de] bg-white p-5 space-y-3">
              <div className="h-3 w-48 bg-[#f0ede8] rounded" />
              <div className="h-3 w-64 bg-[#f0ede8] rounded" />
              <div className="h-3 w-36 bg-[#f0ede8] rounded" />
            </div>
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div className="space-y-6">

            {/* Domain badge */}
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0a0a0a] shrink-0" />
              <span className="font-mono text-[11px] text-[#374151] tracking-wide">{results.domain}</span>
            </div>

            {/* ── Platform Intelligence ──────────────────────────────────── */}
            <section>
              <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-2">
                Platform Intelligence
              </p>

              {results.intelligenceError ? (
                <ServiceError message={results.intelligenceError} />
              ) : results.intelligence?.found ? (
                <div className="border border-[#e8e4de] rounded-xl bg-white overflow-hidden">
                  <div className="px-5 pt-5 pb-4">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#f0ede8] border border-[#e8e4de] flex items-center justify-center shrink-0">
                          <svg width="13" height="13" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24">
                            <rect x="2" y="3" width="20" height="14" rx="2" />
                            <path d="M8 21h8M12 17v4" strokeLinecap="round" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-[#0a0a0a]">CDN Detected</p>
                          <p className="text-[11px] text-[#9ca3af]">
                            {results.intelligence.source === "scraped" ? "Via live scan" : "From Sniffer dataset"}
                          </p>
                        </div>
                      </div>
                      {results.intelligence.network && (
                        <NetworkBadge network={results.intelligence.network} />
                      )}
                    </div>

                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <DataRow
                        label="CDN Provider"
                        value={results.intelligence.cdn_provider}
                      />
                      <DataRow
                        label="Provider Type"
                        value={results.intelligence.provider_type?.replace(/_/g, " ")}
                      />
                      <DataRow
                        label="Network"
                        value={results.intelligence.network ?? "Unknown"}
                      />
                      <DataRow
                        label="Source"
                        value="Dataset"
                      />
                    </dl>
                  </div>
                  <ConfidenceBar value={results.intelligence.confidence} />
                </div>
              ) : (
                <NotFoundCard
                  message="This domain is not in our intelligence database."
                  hint="Coverage grows continuously. Try the takedown lookup below to find removal contacts."
                />
              )}
            </section>

            {/* ── Takedown Guidance ─────────────────────────────────────── */}
            <section>
              <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-2">
                Takedown Guidance
              </p>

              {results.takedownError ? (
                <ServiceError message={results.takedownError} />
              ) : results.takedown?.found ? (
                <div className="border border-[#e8e4de] rounded-xl bg-white overflow-hidden">
                  <div className="px-5 pt-5 pb-4">

                    {/* Header row */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                          <svg width="13" height="13" fill="none" stroke="#4f46e5" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-[#0a0a0a]">
                            {results.takedown.removal_type === "email"
                              ? "Email Contact"
                              : results.takedown.removal_type === "form"
                              ? "Submission Form"
                              : "Removal Available"}
                          </p>
                          <p className="text-[11px] text-[#9ca3af]">
                            {results.takedown.source === "scraped" ? "Via live scan" : "From Sniffer dataset"}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={results.takedown.status} />
                    </div>

                    {/* Data rows */}
                    <dl className="space-y-3 mb-4">
                      {results.takedown.contact_email && (
                        <div>
                          <dt className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-1">
                            Contact Email
                          </dt>
                          <dd className="flex items-center gap-2">
                            <span className="font-mono text-[12.5px] text-[#0a0a0a] break-all">
                              {results.takedown.contact_email}
                            </span>
                          </dd>
                        </div>
                      )}
                      {results.takedown.removal_page && (
                        <div>
                          <dt className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-1">
                            Removal Page
                          </dt>
                          <dd className="font-mono text-[12px] text-[#374151] break-all leading-relaxed">
                            {results.takedown.removal_page}
                          </dd>
                        </div>
                      )}
                    </dl>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {results.takedown.contact_email && (
                        <button
                          onClick={() => copyEmail(results.takedown!.contact_email!)}
                          className="flex items-center gap-1.5 text-[12px] font-medium border border-[#e8e4de] bg-white px-3.5 py-2 rounded-lg hover:border-[#0a0a0a] transition-colors"
                        >
                          {emailCopied ? (
                            <>
                              <svg width="12" height="12" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Copied!
                            </>
                          ) : (
                            <>
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <rect x="9" y="9" width="13" height="13" rx="2" />
                                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round" />
                              </svg>
                              Copy Email
                            </>
                          )}
                        </button>
                      )}
                      {results.takedown.removal_page && (
                        <a
                          href={results.takedown.removal_page}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[12px] font-medium bg-[#0a0a0a] text-white px-3.5 py-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                        >
                          Open Removal Page
                          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </a>
                      )}
                    </div>

                    {results.takedown.source === "scraped" && (
                      <p className="mt-3 text-[11px] text-[#a8a29e] flex items-center gap-1.5">
                        <svg width="11" height="11" fill="none" stroke="#a8a29e" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                        </svg>
                        Found via live scan — not yet verified by the Sniffer dataset.
                      </p>
                    )}
                  </div>
                  <ConfidenceBar value={results.takedown.confidence} color="indigo" />
                </div>
              ) : (
                <NotFoundCard
                  message="No removal information found for this domain."
                  hint="Try searching for the site's DMCA or Legal page manually, or contact the domain registrar."
                />
              )}
            </section>

            {/* Divider + re-analyze */}
            <div className="border-t border-[#e8e4de] pt-5 flex items-center justify-between">
              <p className="text-[11.5px] text-[#9ca3af]">
                Results are based on a continuously updated dataset.
              </p>
              <button
                onClick={() => { setResults(null); setInput(""); inputRef.current?.focus(); }}
                className="text-[12px] text-indigo-600 hover:underline"
              >
                Analyze another
              </button>
            </div>

          </div>
        )}

        {/* Empty state — first load */}
        {!results && !loading && (
          <div className="border border-dashed border-[#e8e4de] rounded-xl p-10 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#f0ede8] border border-[#e8e4de] flex items-center justify-center mx-auto mb-4">
              <svg width="18" height="18" fill="none" stroke="#9ca3af" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[13px] font-medium text-[#374151] mb-1.5">
              Enter a URL or domain above
            </p>
            <p className="text-[12px] text-[#9ca3af] max-w-xs mx-auto">
              Sniffer will identify the CDN network and show you how to remove content directly.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DataRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-0.5">
        {label}
      </dt>
      <dd className="text-[12.5px] text-[#374151] font-medium capitalize">
        {value ?? <span className="text-[#c4bdb5] font-normal">—</span>}
      </dd>
    </div>
  );
}

function NetworkBadge({ network }: { network: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-indigo-100 bg-indigo-50 font-mono text-[10.5px] text-indigo-700 shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
      {network}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.not_found;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#e8e4de] bg-[#fafaf8] font-mono text-[10.5px] ${s.text} shrink-0`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

function ConfidenceBar({
  value,
  color = "neutral",
}: {
  value: number;
  color?: "neutral" | "indigo";
}) {
  const pct = Math.round(value * 100);
  const fill = color === "indigo" ? "bg-indigo-400" : "bg-[#0a0a0a]";
  return (
    <div className="h-0.75 bg-[#f0ede8]">
      <div
        className={`h-full ${fill} transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function NotFoundCard({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="border border-[#e8e4de] rounded-xl bg-white px-5 py-5">
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full border border-[#e8e4de] bg-[#fafaf8] flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[10px] text-[#9ca3af]">—</span>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[#374151] mb-1">{message}</p>
          <p className="text-[12px] text-[#9ca3af] leading-relaxed">{hint}</p>
        </div>
      </div>
    </div>
  );
}

function ServiceError({ message }: { message: string }) {
  return (
    <div className="border border-red-100 rounded-xl bg-red-50 px-5 py-4">
      <p className="text-[12.5px] text-red-600">{message}</p>
    </div>
  );
}
