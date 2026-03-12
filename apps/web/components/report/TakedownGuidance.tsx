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
}

export function TakedownGuidance({ platform, steps }: Props) {
  const [data, setData] = useState<TakedownData | null>(null);
  const [fetching, setFetching] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const domain = platform.includes(".") ? extractDomain(platform) : null;
  const hasSteps = !!steps?.length;

  useEffect(() => {
    if (!domain) return;
    setFetching(true);
    setData(null);
    fetch(`/api/takedown/${encodeURIComponent(domain)}`)
      .then((r) => (r.ok ? (r.json() as Promise<TakedownData>) : Promise.reject()))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setFetching(false));
  }, [domain]);

  // Nothing to render if no static steps and not a recognisable domain
  if (!hasSteps && !domain) return null;

  function copyEmail() {
    if (!data?.contact_email) return;
    navigator.clipboard.writeText(data.contact_email).then(() => {
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    });
  }

  const statusCfg = STATUS_CFG[data?.status ?? "not_found"];

  return (
    <section className="mb-8">
      <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">Takedown Guidance</p>
      <div className="border border-[#e8e4de] rounded-xl bg-white overflow-hidden">

        {/* Card header */}
        <div className="px-5 pt-5 pb-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="13" height="13" fill="none" stroke="#4f46e5" strokeWidth="2" viewBox="0 0 24 24">
              <path
                d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#0a0a0a]">Report on {platform}</p>
            <p className="text-[11px] text-[#9ca3af]">Use the Case ID and SHA-256 hash as supporting evidence</p>
          </div>
        </div>

        {/* Live intelligence block — domain-based platforms only */}
        {domain && (fetching || data !== null) && (
          <div className="mx-5 mb-4 rounded-lg border border-[#e8e4de] bg-[#fafaf8] overflow-hidden">
            {fetching ? (
              <div className="px-4 py-4 space-y-2.5 animate-pulse">
                <div className="flex gap-2">
                  <div className="h-5 w-20 bg-[#e8e4de] rounded-full" />
                  <div className="h-5 w-36 bg-[#e8e4de] rounded-full" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-52 bg-[#e8e4de] rounded-lg" />
                  <div className="h-8 w-36 bg-[#e8e4de] rounded-lg" />
                </div>
              </div>
            ) : data?.found ? (
              <>
                <div className="px-4 py-3.5">
                  {/* Status badge + meta */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10.5px] font-mono ${statusCfg.cls}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                    <span className="text-[10.5px] text-[#a8a29e] font-mono">
                      {data.source === "scraped" ? "via live scan" : "from dataset"}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    {data.contact_email && (
                      <button
                        onClick={copyEmail}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e8e4de] bg-white text-[12px] text-[#374151] hover:bg-[#f5f5f3] transition-colors"
                      >
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                        <span className="font-mono max-w-50 truncate">
                          {emailCopied ? "Copied!" : data.contact_email}
                        </span>
                      </button>
                    )}
                    {data.removal_page && (
                      <a
                        href={data.removal_page}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a0a0a] text-white text-[12px] hover:bg-[#1a1a1a] transition-colors"
                      >
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path
                            d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <polyline points="15 3 21 3 21 9" strokeLinecap="round" strokeLinejoin="round" />
                          <line x1="10" y1="14" x2="21" y2="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Open Removal Page
                      </a>
                    )}
                  </div>

                  {data.source === "scraped" && (
                    <p className="mt-2.5 text-[10.5px] text-[#a8a29e] font-mono">
                      ↗ retrieved via live scan of {domain} — verify before use
                    </p>
                  )}
                </div>

                {/* Confidence bar */}
                <div className="h-0.75 bg-[#f0ede8]">
                  <div
                    className="h-full bg-indigo-400 transition-all duration-700"
                    style={{ width: `${Math.round(data.confidence * 100)}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="px-4 py-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                <p className="text-[11.5px] text-[#9ca3af]">
                  No removal data found for <span className="font-mono">{domain}</span> — search their Help Center
                  manually.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Static step guide — known platforms (Instagram, Twitter, etc.) */}
        {hasSteps && (
          <div className="px-5 pb-5">
            <ol className="space-y-2.5">
              {steps!.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="font-mono text-[10.5px] text-[#a8a29e] w-4 shrink-0 mt-0.5">{i + 1}.</span>
                  <span className="text-[12.5px] text-[#374151] leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[11px] text-[#a8a29e] border-t border-[#f0ede8] pt-3">
              Visit {platform}&apos;s Help Center → Safety &amp; Privacy → Report Content for the official reporting
              form.
            </p>
          </div>
        )}

        {/* Footer note — domain-only case (no static steps) */}
        {!hasSteps && domain && !fetching && (
          <div className="px-5 pb-5">
            <p className="text-[11px] text-[#a8a29e] border-t border-[#f0ede8] pt-3">
              Include this report&apos;s Case ID and SHA-256 hash as supporting evidence in all correspondence.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
