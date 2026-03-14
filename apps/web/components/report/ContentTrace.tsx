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

function formatDomainLabel(value?: string | null) {
  if (!value) return "unknown";
  return value.trim().toLowerCase();
}

function PlatformLogo({ domain, size = 56 }: { domain?: string | null; size?: number }) {
  const normalizedDomain = formatDomainLabel(domain);
  const [logoMissing, setLogoMissing] = useState(false);

  if (!domain || logoMissing) {
    return (
      <div
        className="flex items-center justify-center rounded-3xl border border-white/70 bg-white/90 text-[#0a0a0a] shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
        style={{ width: size, height: size }}
      >
        <span className="font-mono text-[13px] uppercase tracking-[0.24em] text-[#6b7280]">{normalizedDomain.slice(0, 2)}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/supported-platforms/${normalizedDomain}.webp`}
      alt={`${normalizedDomain} logo`}
      width={size}
      height={size}
      onError={() => setLogoMissing(true)}
      className="rounded-3xl border border-white/70 bg-white/90 object-contain p-2.5 shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
    />
  );
}

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
      <div>
        <div className="rounded-xl border border-[#e8e4de] bg-white px-5 py-5 animate-pulse space-y-3">
          <div className="h-3 w-32 rounded bg-[#f0ede8]" />
          <div className="h-10 w-full rounded-xl bg-[#f0ede8]" />
          <div className="h-20 w-full rounded-xl bg-[#f0ede8]" />
        </div>
      </div>
    );
  }

  if (!trace) {
    return null;
  }

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-[#e8e4de] bg-white print:rounded-none print:border-0 print:border-b print:border-[#e8e4de]">
        <div className="border-b border-[#e8e4de] px-6 py-4 sm:px-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-semibold text-[#0a0a0a]">Visual match scan</p>
              <p className="mt-0.5 text-[12px] text-[#6b7280]">Perceptual similarity scan across high-risk domains and known mirror networks.</p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-[#e8e4de] bg-[#fafaf8] px-2.5 py-1 text-[10px] font-mono text-[#6b7280]">
              <span className={`w-1.5 h-1.5 rounded-full ${trace.status === "completed" ? "bg-[#0a0a0a]" : trace.status === "failed" ? "bg-[#d1d5db]" : "bg-[#9ca3af]"}`} />
              {trace.status === "completed" ? "Complete" : trace.status === "failed" ? "Failed" : "Scanning…"}
            </span>
          </div>
        </div>

        <div className="px-6 py-6 space-y-5 sm:px-7">
          {summary && (
            <div className="flex flex-wrap gap-2 text-[11px] font-mono text-[#6b7280]">
              <span className="rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-2.5 py-1">{summary}</span>
              {trace.prioritized_network && (
                <span className="rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-2.5 py-1">
                  Priority: {trace.prioritized_network}
                </span>
              )}
            </div>
          )}

          {trace.status === "failed" && (
            <div className="rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-4 py-3 text-[12px] text-[#6b7280]">
              {trace.error ?? "Trace scan failed. Please try again."}
            </div>
          )}

          {(trace.status === "running" || trace.status === "queued") && (
            <div className="rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-4 py-4">
              <p className="text-[12px] font-medium text-[#0a0a0a] mb-1">Scan in progress</p>
              <p className="text-[12px] text-[#6b7280] leading-relaxed">
                Checking homepage thumbnails, video posters, and preview images across the domain network.
              </p>
            </div>
          )}

          {trace.status === "completed" && trace.direct_matches.length === 0 && (
            <div className="rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-4 py-4">
              <p className="text-[12px] font-medium text-[#0a0a0a] mb-1">No visual matches found</p>
              <p className="text-[12px] text-[#6b7280]">
                Sister domains are still available in the investigation report for reference.
              </p>
            </div>
          )}

          {trace.direct_matches.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold text-[#0a0a0a] mb-3">Direct visual matches ({trace.direct_matches.length})</p>
              <div className="space-y-3">
                {trace.direct_matches.map((match) => (
                  <div key={`${match.domain}-${match.image_url}`} className="rounded-lg border border-[#e8e4de] bg-[#fafaf8] p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <PlatformLogo domain={match.domain} size={48} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-[13px] font-semibold text-[#0a0a0a]">{match.domain}</p>
                            {match.network && (
                              <span className="inline-flex items-center rounded-full border border-[#e8e4de] bg-white px-2 py-0.5 text-[10px] font-mono text-[#6b7280]">{match.network}</span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10.5px] font-mono ${MATCH_CLASSES[match.match_type]}`}>
                              {MATCH_LABELS[match.match_type]}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-[#e8e4de] bg-[#fafaf8] px-2.5 py-1 text-[10.5px] font-mono text-[#6b7280]">
                              {match.confidence}% confidence
                            </span>
                          </div>
                          <p className="mt-2 text-[12px] text-[#6b7280]">
                            {match.asset_type} · SSIM {match.ssim_score} · Match {match.confidence}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <MetricTile label="Type" value={match.asset_type} />
                      <MetricTile label="SSIM" value={String(match.ssim_score)} />
                      <MetricTile label="pHash" value={String(match.phash_distance)} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={match.page_url} target="_blank" rel="noreferrer" className="inline-flex text-[11px] font-medium text-[#0a0a0a] hover:opacity-70 transition-opacity underline">
                        View match
                      </a>
                      <a href={match.image_url} target="_blank" rel="noreferrer" className="inline-flex text-[11px] font-medium text-[#0a0a0a] hover:opacity-70 transition-opacity underline">
                        View image
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {trace.related_domains && trace.related_domains.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold text-[#0a0a0a] mb-3">Sister domains ({trace.related_domains.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {trace.related_domains.map((domain) => (
                  <div key={`${domain.network}-${domain.domain}`} className="rounded-lg border border-[#e8e4de] bg-[#fafaf8] p-4">
                    <div className="flex items-start gap-3">
                      <PlatformLogo domain={domain.domain} size={40} />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#0a0a0a]">{domain.domain}</p>
                        <p className="mt-0.5 text-[11px] text-[#6b7280]">{domain.network}</p>
                        <p className="mt-1 text-[11px] text-[#9ca3af]">{domain.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-2.5 py-2">
      <p className="text-[9px] font-mono uppercase tracking-[0.22em] text-[#9ca3af]">{label}</p>
      <p className="mt-1 text-[11px] font-medium text-[#0a0a0a]">{value}</p>
    </div>
  );
}