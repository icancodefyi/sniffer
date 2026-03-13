"use client";

import { Suspense, useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

function InvestigateContent() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [contentUrl, setContentUrl] = useState("");
  const [draftCopied, setDraftCopied] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  // Evidence from linked Sniffer report
  const [caseRefAttached, setCaseRefAttached] = useState<string | null>(null);
  const [fileHashAttached, setFileHashAttached] = useState<string | null>(null);
  const [reportCaseId, setReportCaseId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

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

  // Read query params from linked report (caseId, hash, domain)
  useEffect(() => {
    const domainParam = searchParams.get("domain");
    const caseIdParam = searchParams.get("caseId");
    const hashParam = searchParams.get("hash");
    if (caseIdParam) {
      setCaseRefAttached(formatCaseRef(caseIdParam));
      setReportCaseId(caseIdParam);
    }
    if (hashParam) setFileHashAttached(hashParam);
    if (domainParam) {
      const clean = extractDomain(domainParam);
      if (clean) {
        setInput(clean);
        analyze(clean);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        {reportCaseId ? (
          <>
            <Link href={`/report/${reportCaseId}`} className="text-[13px] text-[#9ca3af] hover:text-[#0a0a0a] transition-colors">
              Report
            </Link>
            <span className="text-[#d4cfc9]">/</span>
            <span className="text-[13px] text-[#9ca3af]">Request Removal</span>
          </>
        ) : (
          <span className="text-[13px] text-[#9ca3af]">Remove Content</span>
        )}
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
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-mono text-[10px] text-[#a8a29e] uppercase tracking-widest">Content Removal</p>
          </div>
          <h1 className="text-[26px] font-bold text-[#0a0a0a] tracking-tight mb-3">
            {reportCaseId ? "Request Removal" : "Remove Content"}
          </h1>
          <p className="text-[13.5px] text-[#6b7280] leading-relaxed max-w-prose">
            {reportCaseId
              ? "Your forensic evidence is attached. Find the removal contact for this platform and send your request — your Case ID and SHA-256 hash will be embedded as proof."
              : "Paste a URL or domain where your content is being shared without consent. Sniffer will find the removal contact and generate a ready-to-send request."
            }
          </p>
          {/* Evidence badge when coming from a report */}
          {caseRefAttached && (
            <div className="mt-4 inline-flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50">
              <svg width="13" height="13" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <p className="text-[11px] font-semibold text-emerald-800">Forensic evidence attached</p>
                <p className="font-mono text-[10px] text-emerald-600">{caseRefAttached}</p>
              </div>
            </div>
          )}
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
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {loading ? "Looking up…" : "Look Up"}
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
                Hosting Intelligence
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
                        value={results.intelligence.source === "scraped" ? "Live scan" : "Dataset"}
                      />
                    </dl>
                    {results.intelligence.network && results.intelligence.network !== "Unknown" && (
                      <div className="mt-4 pt-3.5 border-t border-[#f0ede8]">
                        <p className="text-[11.5px] text-[#6b7280] leading-relaxed">
                          <span className="font-medium text-[#374151]">{results.intelligence.network}</span>{" "}
                          operates this CDN and controls multiple sites on the same infrastructure. Filing your
                          removal request with the <span className="font-medium text-[#374151]">network operator
                          directly</span> gets faster results than contacting the individual site.
                        </p>
                      </div>
                    )}
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

                  {/* Card header */}
                  <div className="px-5 pt-4 pb-4 border-b border-[#f0ede8] flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-semibold text-[#0a0a0a]">Steps to remove this content</p>
                      <p className="text-[11px] text-[#9ca3af]">
                        {results.takedown.source === "scraped" ? "Retrieved via live scan" : "From Sniffer dataset"}
                      </p>
                    </div>
                    <StatusBadge status={results.takedown.status} />
                  </div>

                  {/* Live scan warning */}
                  {results.takedown.source === "scraped" && (
                    <div className="mx-5 mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
                      <svg width="13" height="13" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
                        <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
                      </svg>
                      <p className="text-[11.5px] text-amber-800 leading-relaxed">
                        <span className="font-semibold">Live scan result —</span> this removal page was found by
                        scanning the site in real time, not from our verified dataset. Verify the link is correct
                        before submitting.
                      </p>
                    </div>
                  )}

                  <div className="px-5 py-5 space-y-6">

                    {/* Step 1 — Evidence */}
                    <div>
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="w-5 h-5 rounded-full border border-[#e8e4de] bg-[#fafaf8] flex items-center justify-center font-mono text-[9px] text-[#9ca3af] shrink-0">1</span>
                        <p className="text-[12.5px] font-semibold text-[#0a0a0a]">Gather your evidence first</p>
                      </div>
                      {caseRefAttached ? (
                        <p className="pl-8 text-[11.5px] text-emerald-700">
                          Your Sniffer report <span className="font-mono">{caseRefAttached}</span> already provides verified image evidence — steps 1, 3 and 4 below are covered.
                        </p>
                      ) : null}
                      <ul className="pl-8 mt-2 space-y-2">
                        {[
                          { text: "Screenshot the page with the content clearly visible",    done: !!caseRefAttached },
                          { text: "Copy the direct URL of the specific content",              done: false },
                          { text: "Note the date you first found it",                         done: !!caseRefAttached },
                          { text: "Save your Sniffer report — it\'s valid supporting evidence", done: !!caseRefAttached },
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            {item.done ? (
                              <svg width="12" height="12" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
                                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <span className="w-1 h-1 rounded-full bg-[#c4bdb5] shrink-0 mt-1.75" />
                            )}
                            <span className={`text-[12px] leading-relaxed ${item.done ? "text-[#9ca3af] line-through decoration-[#c4bdb5]" : "text-[#6b7280]"}`}>{item.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Step 2 — Send request */}
                    <div>
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="w-5 h-5 rounded-full border border-[#e8e4de] bg-[#fafaf8] flex items-center justify-center font-mono text-[9px] text-[#9ca3af] shrink-0">2</span>
                        <p className="text-[12.5px] font-semibold text-[#0a0a0a]">Send your removal request</p>
                      </div>
                      <div className="pl-8 space-y-3">

                        {/* Evidence attached pill */}
                        {caseRefAttached && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50">
                            <svg width="11" height="11" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
                              <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-[11px] text-emerald-800 font-medium">Forensic evidence attached</span>
                            <span className="font-mono text-[10px] text-emerald-600 ml-0.5">· {caseRefAttached}</span>
                          </div>
                        )}

                        {/* Optional content URL personalizer */}
                        <input
                          type="text"
                          value={contentUrl}
                          onChange={(e) => setContentUrl(e.target.value)}
                          placeholder="Paste the content URL to personalise your draft (optional)"
                          className="w-full rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-3.5 py-2.5 text-[12px] text-[#374151] placeholder:text-[#c4bdb5] focus:outline-none focus:border-[#a8a29e] transition-colors"
                        />

                        {results.takedown.contact_email ? (
                          /* Email draft */
                          <div className="rounded-xl border border-[#e8e4de] overflow-hidden">
                            <div className="px-4 py-2.5 bg-[#fafaf8] border-b border-[#f0ede8] flex items-center gap-2">
                              <svg width="11" height="11" fill="none" stroke="#a8a29e" strokeWidth="1.8" viewBox="0 0 24 24">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                              </svg>
                              <span className="font-mono text-[10px] text-[#a8a29e] uppercase tracking-widest">Ready-to-send draft</span>
                              <span className="ml-auto font-mono text-[10.5px] text-[#374151]">→ {results.takedown.contact_email}</span>
                            </div>
                            <div className="px-4 pt-3 pb-1 border-b border-[#f0ede8]">
                              <p className="font-mono text-[9.5px] text-[#a8a29e] uppercase tracking-widest mb-0.5">Subject</p>
                              <p className="text-[12.5px] text-[#374151] font-medium pb-2.5">
                                Urgent Content Removal Request – {results.domain}
                              </p>
                            </div>
                            <pre className="px-4 py-3.5 text-[11.5px] text-[#374151] leading-[1.8] whitespace-pre-wrap font-sans select-text overflow-x-auto max-h-52 overflow-y-auto bg-white">
                              {buildEmailDraft(results.domain, contentUrl, caseRefAttached, fileHashAttached)}
                            </pre>
                            <div className="px-4 py-3 bg-[#fafaf8] border-t border-[#f0ede8] flex items-center gap-2.5">
                              <button
                                onClick={() => {
                                  const text = `Subject: Urgent Content Removal Request – ${results!.domain}\n\n${buildEmailDraft(results!.domain, contentUrl, caseRefAttached, fileHashAttached)}`;
                                  navigator.clipboard.writeText(text).then(() => {
                                    setDraftCopied(true);
                                    setTimeout(() => setDraftCopied(false), 2500);
                                  });
                                }}
                                className="flex items-center gap-1.5 text-[12px] font-medium border border-[#e8e4de] bg-white px-3.5 py-2 rounded-lg hover:border-[#0a0a0a] transition-colors"
                              >
                                {draftCopied ? (
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
                              <a
                                href={`mailto:${results.takedown.contact_email}?subject=${encodeURIComponent(`Urgent Content Removal Request – ${results.domain}`)}&body=${encodeURIComponent(buildEmailDraft(results.domain, contentUrl, caseRefAttached, fileHashAttached))}`}
                                className="flex items-center gap-1.5 text-[12px] font-medium bg-[#0a0a0a] text-white px-3.5 py-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                              >
                                Open in Email Client
                                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </a>
                            </div>
                          </div>
                        ) : results.takedown.removal_page ? (
                          /* Form script */
                          <div className="rounded-xl border border-[#e8e4de] overflow-hidden">
                            {/* Destination URL row */}
                            <div className="px-4 py-2.5 bg-[#fafaf8] border-b border-[#f0ede8] flex items-center gap-2 min-w-0">
                              <svg width="11" height="11" fill="none" stroke="#a8a29e" strokeWidth="1.8" viewBox="0 0 24 24" className="shrink-0">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <span className="font-mono text-[10px] text-[#a8a29e] uppercase tracking-widest shrink-0">Removal form</span>
                              <a
                                href={results.takedown.removal_page}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 font-mono text-[10.5px] text-indigo-600 hover:underline truncate min-w-0"
                              >
                                {results.takedown.removal_page}
                              </a>
                            </div>
                            <p className="px-4 pt-3 pb-0 font-mono text-[9.5px] text-[#a8a29e] uppercase tracking-widest">Copy and paste into the form</p>
                            <p className="px-4 py-3.5 text-[12.5px] text-[#374151] leading-[1.75] select-text bg-white">
                              {buildFormScript(results.domain, contentUrl)}
                            </p>
                            <div className="px-4 py-3 bg-[#fafaf8] border-t border-[#f0ede8] flex items-center gap-2.5">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(buildFormScript(results!.domain, contentUrl)).then(() => {
                                    setScriptCopied(true);
                                    setTimeout(() => setScriptCopied(false), 2500);
                                  });
                                }}
                                className="flex items-center gap-1.5 text-[12px] font-medium border border-[#e8e4de] bg-white px-3.5 py-2 rounded-lg hover:border-[#0a0a0a] transition-colors"
                              >
                                {scriptCopied ? (
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
                                    Copy Text
                                  </>
                                )}
                              </button>
                              <a
                                href={results.takedown.removal_page}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[12px] font-medium bg-[#0a0a0a] text-white px-3.5 py-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                              >
                                Open Removal Form
                                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </a>
                            </div>
                          </div>
                        ) : (
                          /* Found but missing contact details — manual fallback */
                          <div className="rounded-xl border border-[#e8e4de] bg-[#fafaf8] px-4 py-4 space-y-3">
                            <div className="flex items-start gap-2.5">
                              <svg width="13" height="13" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
                                <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
                              </svg>
                              <p className="text-[12px] text-[#374151] leading-relaxed">
                                This site accepts email removal requests but we don&apos;t have the address on file yet.
                                Copy the draft below and send it once you find their DMCA or Contact page.
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <a
                                href={`https://${results.domain}/dmca`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[12px] text-[#374151] border border-[#e8e4de] bg-white px-3 py-1.5 rounded-lg hover:border-[#0a0a0a] transition-colors"
                              >
                                Try /{results.domain}/dmca
                                <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </a>
                              <a
                                href={`https://${results.domain}/contact`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[12px] text-[#374151] border border-[#e8e4de] bg-white px-3 py-1.5 rounded-lg hover:border-[#0a0a0a] transition-colors"
                              >
                                Try /{results.domain}/contact
                                <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </a>
                            </div>
                            <pre className="text-[11.5px] text-[#374151] leading-[1.8] whitespace-pre-wrap font-sans select-text overflow-x-auto bg-white border border-[#e8e4de] rounded-lg px-4 py-3 max-h-40 overflow-y-auto">
                              {buildEmailDraft(results.domain, contentUrl, caseRefAttached, fileHashAttached)}
                            </pre>
                            <button
                              onClick={() => {
                                const text = `Subject: Urgent Content Removal Request – ${results!.domain}\n\n${buildEmailDraft(results!.domain, contentUrl, caseRefAttached, fileHashAttached)}`;
                                navigator.clipboard.writeText(text).then(() => {
                                  setDraftCopied(true);
                                  setTimeout(() => setDraftCopied(false), 2500);
                                });
                              }}
                              className="flex items-center gap-1.5 text-[12px] font-medium border border-[#e8e4de] bg-white px-3.5 py-2 rounded-lg hover:border-[#0a0a0a] transition-colors"
                            >
                              {draftCopied ? (
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
                                  Copy Draft Email
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 3 — Escalation */}
                    <div>
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="w-5 h-5 rounded-full border border-[#e8e4de] bg-[#fafaf8] flex items-center justify-center font-mono text-[9px] text-[#9ca3af] shrink-0">3</span>
                        <p className="text-[12.5px] font-semibold text-[#0a0a0a]">No response within 48 hours?</p>
                      </div>
                      <ul className="pl-8 space-y-2">
                        {[
                          "Escalate to their domain registrar — find it on whois.domaintools.com",
                          "File a formal complaint at DMCA.com for third-party enforcement",
                          "Report to the hosting provider's abuse team directly",
                          "In India: file at cybercrime.gov.in under the IT Act",
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="w-1 h-1 rounded-full bg-[#c4bdb5] shrink-0 mt-1.75" />
                            <span className="text-[12px] text-[#6b7280] leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

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
                onClick={() => { setResults(null); setInput(""); setContentUrl(""); setDraftCopied(false); setScriptCopied(false); setCaseRefAttached(null); setFileHashAttached(null); setReportCaseId(null); inputRef.current?.focus(); }}
                className="text-[12px] text-indigo-600 hover:underline"
              >
                Look up another domain
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
              Paste the URL where your content appears
            </p>
            <p className="text-[12px] text-[#9ca3af] max-w-xs mx-auto">
              Sniffer will find the removal contact and generate a ready-to-send request with your evidence attached.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}

// ── Template helpers ─────────────────────────────────────────────────────────

function formatCaseRef(caseId: string): string {
  return `SNF-${caseId.slice(0, 4).toUpperCase()}-${caseId.slice(4, 8).toUpperCase()}-${caseId.slice(9, 13).toUpperCase()}`;
}

function buildEmailDraft(
  domain: string,
  contentUrl: string,
  caseRef?: string | null,
  fileHash?: string | null,
): string {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const urlLine = contentUrl.trim() ? `\nContent URL: ${contentUrl.trim()}\n` : "";
  const evidenceBlock = caseRef
    ? `\n──────────────────────────────────────
Forensic Evidence (Sniffer · Impic Labs)
Case Reference: ${caseRef}${fileHash ? `\nSHA-256 Hash:   ${fileHash}` : ""}
──────────────────────────────────────\n`
    : "";
  return `Dear ${domain} Content Moderation Team,\n\nI am formally requesting the immediate removal of content hosted on ${domain} that was published without my knowledge or consent.${urlLine}${evidenceBlock}\nThis material is a serious violation of my privacy and your platform's own terms of service. I request its complete removal — including all thumbnails, previews, and cached copies — as a matter of urgency.\n\nPlease confirm removal within 48 hours. Failure to act will result in escalation to your hosting provider, domain registrar, and relevant legal authorities.\n\nRegards,\n[Your Full Name]\n${date}`;
}

export default function InvestigatePage() {
  return (
    <Suspense>
      <InvestigateContent />
    </Suspense>
  );
}

function buildFormScript(domain: string, contentUrl: string): string {
  const urlLine = contentUrl.trim() ? ` The specific content is located at: ${contentUrl.trim()}.` : "";
  return `I am formally requesting the removal of content hosted on ${domain} that was published without my consent.${urlLine} This is a serious violation of my privacy. I demand its immediate and complete removal, including all cached copies, thumbnails, and any derivatives. Failure to act within 48 hours will result in escalation to the hosting provider, domain registrar, and relevant authorities.`;
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
