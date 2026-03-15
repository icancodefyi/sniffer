"use client";

import { useEffect, useState } from "react";
import { extractDomain } from "@/lib/url";

interface TakedownData {
  domain: string;
  found: boolean;
  removal_type: string | null;
  removal_page: string | null;
  contact_email: string | null;
  status: "verified" | "partial" | "unverified" | "scraped" | "not_found";
  confidence: number;
  source: "dataset" | "scraped" | "not_found";
}

interface IntelligenceData {
  domain: string;
  found: boolean;
  cdn_provider: string | null;
  network: string | null;
  confidence: number;
  source: string;
}

const STATUS_CFG = {
  verified:   { dot: "bg-emerald-500", label: "Verified",   cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  partial:    { dot: "bg-amber-400",   label: "Partial",    cls: "bg-amber-50 border-amber-200 text-amber-700" },
  unverified: { dot: "bg-orange-400",  label: "Unverified", cls: "bg-orange-50 border-orange-200 text-orange-700" },
  scraped:    { dot: "bg-blue-400",    label: "Live Scan",  cls: "bg-blue-50 border-blue-200 text-blue-700" },
  not_found:  { dot: "bg-gray-300",    label: "Not Found",  cls: "bg-gray-50 border-gray-200 text-gray-500" },
} as const;

interface Props {
  platform: string;
  steps?: string[];
  caseId?: string;
  fileHash?: string;
  caseRef?: string;
}

function buildEmailDraft(domain: string, contentUrl: string, caseRef?: string, fileHash?: string): string {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const urlLine = contentUrl.trim() ? `\nContent URL: ${contentUrl.trim()}\n` : "";
  const evidenceBlock = caseRef
    ? `\n──────────────────────────────────────\nForensic Evidence (Sniffer · Impic Labs)\nCase Reference: ${caseRef}${fileHash ? `\nSHA-256 Hash:   ${fileHash}` : ""}\n──────────────────────────────────────\n`
    : "";
  return `Dear ${domain} Content Moderation Team,\n\nI am formally requesting the immediate removal of content hosted on ${domain} that was published without my knowledge or consent.${urlLine}${evidenceBlock}\nThis material is a serious violation of my privacy and your platform's own terms of service. I request its complete removal — including all thumbnails, previews, and cached copies — as a matter of urgency.\n\nPlease confirm removal within 48 hours. Failure to act will result in escalation to your hosting provider, domain registrar, and relevant legal authorities.\n\nRegards,\n[Your Full Name]\n${date}`;
}

function buildFormScript(domain: string, contentUrl: string): string {
  const urlLine = contentUrl.trim() ? ` The specific content is located at: ${contentUrl.trim()}.` : "";
  return `I am formally requesting the removal of content hosted on ${domain} that was published without my consent.${urlLine} This is a serious violation of my privacy. I demand its immediate and complete removal, including all cached copies, thumbnails, and any derivatives. Failure to act within 48 hours will result in escalation to the hosting provider, domain registrar, and relevant authorities.`;
}

export function TakedownGuidance({ platform, steps, caseId: _caseId, fileHash, caseRef }: Props) {
  const [takedown, setTakedown] = useState<TakedownData | null>(null);
  const [intelligence, setIntelligence] = useState<IntelligenceData | null>(null);
  const [fetching, setFetching] = useState(false);
  const [contentUrl, setContentUrl] = useState("");
  const [draftCopied, setDraftCopied] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);

  const domain = platform.includes(".") ? extractDomain(platform) : null;
  const hasSteps = !!steps?.length;

  useEffect(() => {
    if (!domain) return;

    // Known platforms already have local, curated steps. Do not block UI on remote services.
    if (hasSteps) {
      setFetching(false);
      return;
    }

    const timeoutMs = 7000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    setFetching(true);
    Promise.allSettled([
      fetch(`/api/takedown/${encodeURIComponent(domain)}`, { signal: controller.signal }),
      fetch(`/api/intelligence/${encodeURIComponent(domain)}`, { signal: controller.signal }),
    ]).then(([tdRes, intelRes]) => {
      if (tdRes.status === "fulfilled" && tdRes.value.ok) {
        void (tdRes.value.json() as Promise<TakedownData>).then(setTakedown);
      }
      if (intelRes.status === "fulfilled" && intelRes.value.ok) {
        void (intelRes.value.json() as Promise<IntelligenceData>).then(setIntelligence);
      }
    }).finally(() => {
      clearTimeout(timeoutId);
      setFetching(false);
    });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [domain, hasSteps]);

  if (!hasSteps && !domain) return null;

  const statusCfg = STATUS_CFG[takedown?.status ?? "not_found"];
  const evidenceChecklist = [
    { text: "Screenshot the page with the content clearly visible",       done: !!caseRef },
    { text: "Copy the direct URL of the specific content",                done: false      },
    { text: "Note the date you first found it",                           done: !!caseRef },
    { text: "Save your Sniffer report — valid supporting evidence",       done: !!caseRef },
  ];

  return (
    <section className="mb-8">
      <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">Request Removal</p>
      <div className="border border-[#e8e4de] rounded-xl bg-white overflow-hidden">

        {/* Card header */}
        <div className="px-5 pt-5 pb-4 border-b border-[#f0ede8] flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <svg width="13" height="13" fill="none" stroke="#4f46e5" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0a0a0a]">Remove content from {platform}</p>
              <p className="text-[11px] text-[#9ca3af]">
                {takedown?.source === "scraped" ? "Retrieved via live scan" : domain ? "From Sniffer dataset" : "Manual steps provided"}
              </p>
            </div>
          </div>
          {takedown?.found && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10.5px] font-mono shrink-0 ${statusCfg.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
          )}
        </div>

        {/* Evidence badge */}
        {caseRef && (
          <div className="mx-5 mt-4 flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-lg border border-emerald-200 bg-emerald-50">
            <svg width="12" height="12" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="text-[11px] font-semibold text-emerald-800">Forensic evidence attached</p>
              <p className="font-mono text-[10px] text-emerald-600">{caseRef} · SHA-256 included in draft</p>
            </div>
          </div>
        )}

        {/* Fetching skeleton */}
        {fetching && (
          <div className="px-5 py-5 space-y-3 animate-pulse">
            <div className="h-3 w-40 bg-[#f0ede8] rounded" />
            <div className="h-9 w-full bg-[#f0ede8] rounded-lg" />
            <div className="h-24 w-full bg-[#f0ede8] rounded-xl" />
          </div>
        )}

        {!fetching && (
          <div className="px-5 py-5 space-y-6">

            {/* Live scan warning */}
            {takedown?.source === "scraped" && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
                <svg width="13" height="13" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
                  <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
                </svg>
                <p className="text-[11.5px] text-amber-800 leading-relaxed">
                  <span className="font-semibold">Live scan result —</span> this removal page was found by scanning the site in real time. Verify the link is correct before submitting.
                </p>
              </div>
            )}

            {/* Step 1 — Evidence */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-5 h-5 rounded-full border border-[#e8e4de] bg-[#fafaf8] flex items-center justify-center font-mono text-[9px] text-[#9ca3af] shrink-0">1</span>
                <p className="text-[12.5px] font-semibold text-[#0a0a0a]">Gather your evidence</p>
              </div>
              {caseRef && (
                <p className="pl-8 mb-2 text-[11.5px] text-emerald-700">
                  Your Sniffer report <span className="font-mono">{caseRef}</span> covers items 1, 3 and 4 below.
                </p>
              )}
              <ul className="pl-8 space-y-2">
                {evidenceChecklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    {item.done ? (
                      <svg width="12" height="12" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-[#c4bdb5] shrink-0 mt-1.75" />
                    )}
                    <span className={`text-[12px] leading-relaxed ${item.done ? "text-[#9ca3af] line-through decoration-[#c4bdb5]" : "text-[#6b7280]"}`}>
                      {item.text}
                    </span>
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
                <input
                  type="text"
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder="Paste the content URL to personalise your draft (optional)"
                  className="w-full rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-3.5 py-2.5 text-[12px] text-[#374151] placeholder:text-[#c4bdb5] focus:outline-none focus:border-[#a8a29e] transition-colors"
                />

                {domain && takedown?.found ? (
                  takedown.contact_email ? (
                    /* Email draft */
                    <div className="rounded-xl border border-[#e8e4de] overflow-hidden">
                      <div className="px-4 py-2.5 bg-[#fafaf8] border-b border-[#f0ede8] flex items-center gap-2">
                        <svg width="11" height="11" fill="none" stroke="#a8a29e" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <span className="font-mono text-[10px] text-[#a8a29e] uppercase tracking-widest">Ready-to-send draft</span>
                        <span className="ml-auto font-mono text-[10.5px] text-[#374151]">→ {takedown.contact_email}</span>
                      </div>
                      <div className="px-4 pt-3 pb-1 border-b border-[#f0ede8]">
                        <p className="font-mono text-[9.5px] text-[#a8a29e] uppercase tracking-widest mb-0.5">Subject</p>
                        <p className="text-[12.5px] text-[#374151] font-medium pb-2.5">
                          Urgent Content Removal Request – {domain}
                        </p>
                      </div>
                      <pre className="px-4 py-3.5 text-[11.5px] text-[#374151] leading-[1.8] whitespace-pre-wrap font-sans select-text overflow-x-auto max-h-52 overflow-y-auto bg-white">
                        {buildEmailDraft(domain, contentUrl, caseRef, fileHash)}
                      </pre>
                      <div className="px-4 py-3 bg-[#fafaf8] border-t border-[#f0ede8] flex items-center gap-2.5">
                        <button
                          onClick={() => {
                            const text = `Subject: Urgent Content Removal Request – ${domain}\n\n${buildEmailDraft(domain, contentUrl, caseRef, fileHash)}`;
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
                          href={`mailto:${takedown.contact_email}?subject=${encodeURIComponent(`Urgent Content Removal Request – ${domain}`)}&body=${encodeURIComponent(buildEmailDraft(domain, contentUrl, caseRef, fileHash))}`}
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
                  ) : takedown.removal_page ? (
                    /* Form script */
                    <div className="rounded-xl border border-[#e8e4de] overflow-hidden">
                      <div className="px-4 py-2.5 bg-[#fafaf8] border-b border-[#f0ede8] flex items-center gap-2 min-w-0">
                        <svg width="11" height="11" fill="none" stroke="#a8a29e" strokeWidth="1.8" viewBox="0 0 24 24" className="shrink-0">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span className="font-mono text-[10px] text-[#a8a29e] uppercase tracking-widest shrink-0">Removal form</span>
                        <a
                          href={takedown.removal_page}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 font-mono text-[10.5px] text-indigo-600 hover:underline truncate min-w-0"
                        >
                          {takedown.removal_page}
                        </a>
                      </div>
                      <p className="px-4 pt-3 pb-0 font-mono text-[9.5px] text-[#a8a29e] uppercase tracking-widest">Copy and paste into the form</p>
                      <p className="px-4 py-3.5 text-[12.5px] text-[#374151] leading-[1.75] select-text bg-white">
                        {buildFormScript(domain, contentUrl)}
                      </p>
                      <div className="px-4 py-3 bg-[#fafaf8] border-t border-[#f0ede8] flex items-center gap-2.5">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(buildFormScript(domain, contentUrl)).then(() => {
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
                          href={takedown.removal_page}
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
                    /* Found but missing contact details */
                    <div className="rounded-xl border border-[#e8e4de] bg-[#fafaf8] px-4 py-4 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <svg width="13" height="13" fill="none" stroke="#d97706" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
                          <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
                        </svg>
                        <p className="text-[12px] text-[#374151] leading-relaxed">
                          This site accepts email removal requests but we don&apos;t have the address on file.
                          Send your request to their <span className="font-medium">DMCA</span> or <span className="font-medium">Contact</span> page.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`https://${domain}/dmca`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[12px] text-[#374151] border border-[#e8e4de] bg-white px-3 py-1.5 rounded-lg hover:border-[#0a0a0a] transition-colors"
                        >
                          Try /dmca
                          <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </a>
                        <a
                          href={`https://${domain}/contact`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[12px] text-[#374151] border border-[#e8e4de] bg-white px-3 py-1.5 rounded-lg hover:border-[#0a0a0a] transition-colors"
                        >
                          Try /contact
                          <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </a>
                      </div>
                      <p className="text-[11px] text-[#9ca3af]">Copy the email draft below once you find the address and attach your Sniffer report as evidence.</p>
                      <pre className="text-[11.5px] text-[#374151] leading-[1.8] whitespace-pre-wrap font-sans select-text overflow-x-auto bg-white border border-[#e8e4de] rounded-lg px-4 py-3 max-h-40 overflow-y-auto">
                        {buildEmailDraft(domain, contentUrl, caseRef, fileHash)}
                      </pre>
                      <button
                        onClick={() => {
                          const text = `Subject: Urgent Content Removal Request – ${domain}\n\n${buildEmailDraft(domain, contentUrl, caseRef, fileHash)}`;
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
                  )
                ) : hasSteps ? (
                  /* Static step guide for known platforms */
                  <div className="rounded-xl border border-[#e8e4de] bg-white px-5 py-4">
                    <ol className="space-y-2.5">
                      {steps!.map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="font-mono text-[10.5px] text-[#a8a29e] w-4 shrink-0 mt-0.5">{i + 1}.</span>
                          <span className="text-[12.5px] text-[#374151] leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-4 text-[11px] text-[#a8a29e] border-t border-[#f0ede8] pt-3">
                      Visit {platform}&apos;s Help Center → Safety &amp; Privacy → Report Content for the official reporting form.
                    </p>
                  </div>
                ) : domain ? (
                  /* No data found */
                  <div className="rounded-xl border border-[#e8e4de] bg-[#fafaf8] px-4 py-3.5 flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c4bdb5] shrink-0 mt-1" />
                    <p className="text-[12px] text-[#6b7280] leading-relaxed">
                      No removal data found for <span className="font-mono text-[#374151]">{domain}</span>. Search their Help Center or Legal page manually, or use the domain registrar contact from whois.domaintools.com.
                    </p>
                  </div>
                ) : null}

                {/* Network operator insight */}
                {intelligence?.found && intelligence.network && (
                  <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3.5 py-3">
                    <p className="text-[11.5px] text-indigo-800 leading-relaxed">
                      <span className="font-semibold">{intelligence.network}</span> operates the infrastructure behind {domain}. Filing directly with the network operator often gets faster results than the individual site.
                    </p>
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

            <p className="text-[11px] text-[#a8a29e] border-t border-[#f0ede8] pt-4">
              Include this report&apos;s Case ID and SHA-256 hash as supporting evidence in all correspondence.
            </p>

          </div>
        )}

        {takedown?.found && (
          <div className="h-0.75 bg-[#f0ede8]">
            <div
              className="h-full bg-indigo-400 transition-all duration-700"
              style={{ width: `${Math.round(takedown.confidence * 100)}%` }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
