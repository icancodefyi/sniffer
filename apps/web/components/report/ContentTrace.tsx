"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { DiscoveryResult } from "@/components/report/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const MATCH_LABELS: Record<string, string> = {
  exact: "Exact visual match",
  near_duplicate: "Near-duplicate",
  probable: "Probable match",
};

const MATCH_CLASSES: Record<string, string> = {
  exact: "bg-emerald-50 border-emerald-200 text-emerald-700",
  near_duplicate: "bg-indigo-50 border-indigo-200 text-indigo-700",
  probable: "bg-amber-50 border-amber-200 text-amber-700",
};

interface Props {
  caseId: string;
}

export function ContentTrace({ caseId }: Props) {
  const [trace, setTrace] = useState<DiscoveryResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const res = await fetch(`${API_URL}/api/analysis/${caseId}/discover`, { cache: "no-store" });
        if (res.status === 404) {
          if (!cancelled) {
            setTrace(null);
            setLoading(false);
          }
          return;
        }

        if (!res.ok) {
          throw new Error("Trace lookup failed");
        }

        const data = await res.json() as DiscoveryResult;
        if (cancelled) return;
        setTrace(data);
        setLoading(false);

        if (data.status === "running" || data.status === "queued") {
          timer = setTimeout(poll, 2500);
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [caseId]);

  const summary = useMemo(() => {
    if (!trace) return null;
    return `${trace.domains_scanned} domains · ${trace.pages_scanned} pages · ${trace.candidates_evaluated} assets checked`;
  }, [trace]);

  if (loading) {
    return (
      <section className="mb-8">
        <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">Network Trace</p>
        <div className="rounded-xl border border-[#e8e4de] bg-white px-5 py-5 animate-pulse space-y-3">
          <div className="h-3 w-32 rounded bg-[#f0ede8]" />
          <div className="h-10 w-full rounded-xl bg-[#f0ede8]" />
          <div className="h-20 w-full rounded-xl bg-[#f0ede8]" />
        </div>
      </section>
    );
  }

  if (!trace) {
    return null;
  }

  return (
    <section className="mb-8">
      <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">Network Trace</p>
      <div className="rounded-xl border border-[#e8e4de] bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f0ede8] flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold text-[#0a0a0a]">Trace where this image appears</p>
            <p className="text-[11px] text-[#9ca3af]">
              We scan known high-risk video sites, compare thumbnails and posters, then expand to sister domains on the same network.
            </p>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10.5px] font-mono ${trace.status === "completed" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : trace.status === "failed" ? "bg-red-50 border-red-200 text-red-700" : "bg-indigo-50 border-indigo-200 text-indigo-700"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${trace.status === "completed" ? "bg-emerald-500" : trace.status === "failed" ? "bg-red-500" : "bg-indigo-500"}`} />
            {trace.status === "completed" ? "Scan complete" : trace.status === "failed" ? "Scan failed" : "Scanning"}
          </span>
        </div>

        <div className="px-5 py-5 space-y-6">
          {summary && (
            <div className="flex flex-wrap gap-2 text-[11px] font-mono text-[#6b7280]">
              <span className="px-2.5 py-1 rounded-full border border-[#e8e4de] bg-[#fafaf8]">{summary}</span>
              {trace.prioritized_network && (
                <span className="px-2.5 py-1 rounded-full border border-indigo-100 bg-indigo-50 text-indigo-700">
                  Prioritised network: {trace.prioritized_network}
                </span>
              )}
            </div>
          )}

          {trace.status === "failed" && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
              {trace.error ?? "The trace job failed before returning results."}
            </div>
          )}

          {(trace.status === "running" || trace.status === "queued") && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-4">
              <p className="text-[12.5px] font-medium text-indigo-900 mb-1">Scanning mirrors and preview assets</p>
              <p className="text-[12px] text-indigo-700 leading-relaxed">
                This job checks homepage thumbnails, video posters, and preview images across the known domain network. Direct visual matches become evidence; same-network domains are surfaced separately because mirrors often swap thumbnails.
              </p>
            </div>
          )}

          {trace.status === "completed" && trace.direct_matches.length === 0 && (
            <div className="rounded-xl border border-[#e8e4de] bg-[#fafaf8] px-4 py-4">
              <p className="text-[12.5px] font-medium text-[#0a0a0a] mb-1">No direct visual match found yet</p>
              <p className="text-[12px] text-[#6b7280] leading-relaxed">
                This usually means the network changed the poster or thumbnail. The trace engine still scans sister domains, but only visually verified matches are listed as evidence.
              </p>
            </div>
          )}

          {trace.direct_matches.length > 0 && (
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-5 h-5 rounded-full border border-[#e8e4de] bg-[#fafaf8] flex items-center justify-center font-mono text-[9px] text-[#9ca3af] shrink-0">1</span>
                <p className="text-[12.5px] font-semibold text-[#0a0a0a]">Direct visual matches</p>
              </div>
              <div className="pl-8 space-y-3">
                {trace.direct_matches.map((match) => (
                  <div key={`${match.domain}-${match.image_url}`} className="rounded-xl border border-[#e8e4de] bg-[#fafaf8] p-4">
                    <div className="flex flex-wrap items-start gap-2 mb-2">
                      <p className="text-[13px] font-semibold text-[#0a0a0a] mr-auto">{match.domain}</p>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10.5px] font-mono ${MATCH_CLASSES[match.match_type]}`}>
                        {MATCH_LABELS[match.match_type]}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-[#e8e4de] bg-white px-2.5 py-1 text-[10.5px] font-mono text-[#6b7280]">
                        {match.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[#6b7280] mb-3 leading-relaxed">
                      Asset type: {match.asset_type} · SSIM {match.ssim_score} · pHash distance {match.phash_distance}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a href={match.page_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a0a0a] px-3.5 py-2 text-[12px] font-medium text-white hover:bg-[#1a1a1a] transition-colors">
                        Open matched page
                      </a>
                      <a href={match.image_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-white px-3.5 py-2 text-[12px] font-medium text-[#374151] hover:border-[#0a0a0a] transition-colors">
                        Open matched image
                      </a>
                      <Link
                        href={`/investigate?caseId=${encodeURIComponent(caseId)}&domain=${encodeURIComponent(match.domain)}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-[12px] font-medium text-indigo-700 hover:border-indigo-300 transition-colors"
                      >
                        Step 2: Investigate Domain
                      </Link>
                      <Link
                        href={`/takedown?caseId=${encodeURIComponent(caseId)}&domain=${encodeURIComponent(match.domain)}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-white px-3.5 py-2 text-[12px] font-medium text-[#374151] hover:border-[#0a0a0a] transition-colors"
                      >
                        Step 3: Prepare Takedown
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {trace.related_domains.length > 0 && (
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-5 h-5 rounded-full border border-[#e8e4de] bg-[#fafaf8] flex items-center justify-center font-mono text-[9px] text-[#9ca3af] shrink-0">2</span>
                <p className="text-[12.5px] font-semibold text-[#0a0a0a]">Likely sister domains in the same network</p>
              </div>
              <div className="pl-8 grid grid-cols-1 md:grid-cols-2 gap-3">
                {trace.related_domains.map((domain) => (
                  <div key={`${domain.network}-${domain.domain}`} className="rounded-xl border border-[#e8e4de] bg-white p-4">
                    <p className="text-[13px] font-semibold text-[#0a0a0a] mb-1">{domain.domain}</p>
                    <p className="text-[11.5px] text-indigo-600 font-mono mb-2">{domain.network}</p>
                    <p className="text-[11.5px] text-[#6b7280] leading-relaxed">{domain.reason}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/investigate?caseId=${encodeURIComponent(caseId)}&domain=${encodeURIComponent(domain.domain)}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[11.5px] font-medium text-indigo-700 hover:border-indigo-300 transition-colors"
                      >
                        Investigate
                      </Link>
                      <Link
                        href={`/takedown?caseId=${encodeURIComponent(caseId)}&domain=${encodeURIComponent(domain.domain)}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-white px-3 py-1.5 text-[11.5px] font-medium text-[#374151] hover:border-[#0a0a0a] transition-colors"
                      >
                        Takedown
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}