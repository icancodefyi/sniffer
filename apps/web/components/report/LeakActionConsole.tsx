/*
PSEUDOCODE PLAN

1. Keep the component client-side because it needs:
   - browser fetch calls
   - clipboard access
   - modal open/close state
   - per-target interaction state for the report console

2. Fetch the discovery trace for the current case:
   - call /api/analysis/{caseId}/discover once on mount or when caseId changes
   - if the request fails, stop loading and show a safe empty/error state
   - if it succeeds, store the discovery payload

3. Transform discovery results into actionable targets:
   - group direct matches by domain
   - aggregate multiple matched page URLs for the same domain
   - aggregate multiple matched asset URLs for the same domain
   - keep the highest confidence score per domain
   - preserve network/operator metadata when available
   - add related domains that were not already present as direct matches
   - output one actionable card per domain

4. Fix the UX problem in the old file:
   - do not force the user to pick a domain chip and then act elsewhere
   - instead render domain cards directly in the report
   - each card exposes the two primary actions:
     - Investigate
     - Issue Takedown

5. Keep one active investigation target:
   - selectedDomain drives the lower investigation workspace
   - when the user clicks Investigate on a card:
     - select that domain
     - mark the target as investigated in local session state

6. Add a controlled takedown modal:
   - noticeDomain controls the modal open state
   - when the user clicks Issue Takedown:
     - select that domain
     - open the modal
     - mark the target as notice_ready in local session state
   - the modal should never ask the user to re-enter the URL/domain

7. For the selected domain, load intelligence and takedown data:
   - call /api/intelligence/{domain}
   - call /api/takedown/{domain}
   - run both in parallel
   - tolerate one succeeding while the other fails
   - surface a single error only if both fail

8. Generate the takedown notice from known evidence:
   - domain
   - case reference
   - matched page URLs
   - matched asset URLs
   - network/operator
   - CDN/provider
   - preferred takedown route
   - produce one ready-to-copy notice string

9. Improve safety and resilience:
   - guard clipboard writes with try/catch
   - show explicit empty states instead of returning null
   - avoid invalid Tailwind utility names
   - keep the UI functional while lookup data is still loading

10. Present the case report as an investigation console:
   - top: actionable target cards
   - middle: selected target investigation workspace
   - modal: direct takedown action for the selected target
   - footer links remain as optional fallback tools, not the primary flow
*/

"use client";

import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { DiscoveryResult } from "./types";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buildCaseRef } from "./utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

type TargetStage = "detected" | "investigated" | "notice_ready";

interface ActionDomain {
  domain: string;
  kind: "direct_match" | "related_domain";
  network?: string | null;
  confidence?: number | null;
  pageUrls: string[];
  imageUrls: string[];
  reason?: string | null;
}

interface Props {
  caseId: string;
}

const STATUS_STYLES: Record<
  string,
  { dot: string; label: string; text: string; bg: string; border: string }
> = {
  verified: {
    dot: "bg-emerald-500",
    label: "Verified",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  partial: {
    dot: "bg-amber-400",
    label: "Partial",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  unverified: {
    dot: "bg-orange-400",
    label: "Unverified",
    text: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  scraped: {
    dot: "bg-blue-400",
    label: "Live Scan",
    text: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  not_found: {
    dot: "bg-[#d4cfc9]",
    label: "Not Found",
    text: "text-[#9ca3af]",
    bg: "bg-[#fafaf8]",
    border: "border-[#e8e4de]",
  },
};

const TARGET_STAGE_STYLES: Record<
  TargetStage,
  { label: string; text: string; bg: string; border: string }
> = {
  detected: {
    label: "Detected",
    text: "text-slate-700",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
  investigated: {
    label: "Investigated",
    text: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  notice_ready: {
    label: "Notice Ready",
    text: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
};

function pushUnique(values: string[], value: string | null | undefined): void {
  if (!value) return;
  if (!values.includes(value)) {
    values.push(value);
  }
}

function buildActionDomains(trace: DiscoveryResult | null): ActionDomain[] {
  if (!trace) return [];

  const byDomain = new Map<string, ActionDomain>();

  for (const match of trace.direct_matches) {
    const existing = byDomain.get(match.domain);

    if (!existing) {
      byDomain.set(match.domain, {
        domain: match.domain,
        kind: "direct_match",
        network: match.network,
        confidence: match.confidence,
        pageUrls: match.page_url ? [match.page_url] : [],
        imageUrls: match.image_url ? [match.image_url] : [],
      });
      continue;
    }

    existing.kind = "direct_match";
    existing.network = existing.network ?? match.network;
    existing.confidence = Math.max(existing.confidence ?? 0, match.confidence ?? 0);
    pushUnique(existing.pageUrls, match.page_url);
    pushUnique(existing.imageUrls, match.image_url);
  }

  for (const related of trace.related_domains) {
    const existing = byDomain.get(related.domain);

    if (!existing) {
      byDomain.set(related.domain, {
        domain: related.domain,
        kind: "related_domain",
        network: related.network,
        confidence: null,
        pageUrls: [],
        imageUrls: [],
        reason: related.reason,
      });
      continue;
    }

    existing.network = existing.network ?? related.network;
    existing.reason = existing.reason ?? related.reason;
  }

  return Array.from(byDomain.values()).sort((a, b) => {
    const aScore = a.confidence ?? -1;
    const bScore = b.confidence ?? -1;
    return bScore - aScore;
  });
}

function advanceTargetStage(current: TargetStage | undefined, next: TargetStage): TargetStage {
  const order: TargetStage[] = ["detected", "investigated", "notice_ready"];
  const currentIndex = current ? order.indexOf(current) : 0;
  const nextIndex = order.indexOf(next);
  return nextIndex > currentIndex ? next : current ?? "detected";
}

export function LeakActionConsole({ caseId }: Props): JSX.Element {
  const [trace, setTrace] = useState<DiscoveryResult | null>(null);
  const [traceLoading, setTraceLoading] = useState(true);
  const [traceError, setTraceError] = useState<string | null>(null);

  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [noticeDomain, setNoticeDomain] = useState<string | null>(null);
  const [targetStages, setTargetStages] = useState<Record<string, TargetStage>>({});

  const [intel, setIntel] = useState<IntelligenceResult | null>(null);
  const [takedown, setTakedown] = useState<TakedownResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [noticeCopied, setNoticeCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTrace() {
      setTraceLoading(true);
      setTraceError(null);

      try {
        const res = await fetch(`${API_URL}/api/analysis/${caseId}/discover`, {
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) {
            setTrace(null);
            setTraceError("Unable to load discovered targets for this case.");
            setTraceLoading(false);
          }
          return;
        }

        const data = (await res.json()) as DiscoveryResult;

        if (cancelled) return;

        setTrace(data);
        setTraceLoading(false);
      } catch {
        if (!cancelled) {
          setTrace(null);
          setTraceError("Unable to load discovered targets for this case.");
          setTraceLoading(false);
        }
      }
    }

    void loadTrace();

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const domains = useMemo<ActionDomain[]>(() => buildActionDomains(trace), [trace]);

  useEffect(() => {
    if (domains.length === 0) {
      setSelectedDomain("");
      return;
    }

    const stillExists = domains.some((item) => item.domain === selectedDomain);

    if (!selectedDomain || !stillExists) {
      setSelectedDomain(domains[0].domain);
    }
  }, [domains, selectedDomain]);

  useEffect(() => {
    if (!selectedDomain) return;

    let cancelled = false;

    async function lookup() {
      setLookupLoading(true);
      setLookupError(null);
      setIntel(null);
      setTakedown(null);

      const [intelRes, takedownRes] = await Promise.allSettled([
        fetch(`/api/intelligence/${encodeURIComponent(selectedDomain)}`),
        fetch(`/api/takedown/${encodeURIComponent(selectedDomain)}`),
      ]);

      if (cancelled) return;

      let hasAnyResult = false;

      if (intelRes.status === "fulfilled" && intelRes.value.ok) {
        setIntel((await intelRes.value.json()) as IntelligenceResult);
        hasAnyResult = true;
      }

      if (takedownRes.status === "fulfilled" && takedownRes.value.ok) {
        setTakedown((await takedownRes.value.json()) as TakedownResult);
        hasAnyResult = true;
      }

      if (!hasAnyResult) {
        setLookupError("Unable to load removal intelligence for this domain.");
      }

      setLookupLoading(false);
    }

    void lookup();

    return () => {
      cancelled = true;
    };
  }, [selectedDomain]);

  const activeDomain = useMemo(
    () => domains.find((item) => item.domain === selectedDomain) ?? null,
    [domains, selectedDomain],
  );

  const modalDomain = useMemo(
    () => domains.find((item) => item.domain === noticeDomain) ?? null,
    [domains, noticeDomain],
  );

  const takedownStatus = takedown?.status
    ? STATUS_STYLES[takedown.status] ?? STATUS_STYLES.not_found
    : null;

  const caseRef = buildCaseRef(caseId);

  const generatedNotice = useMemo(() => {
    if (!modalDomain) return "";

    const lines = [
      `Subject: Urgent takedown request for non-consensual intimate content on ${modalDomain.domain}`,
      "",
      "To the Trust & Safety / Abuse Team,",
      "",
      `I am reporting non-consensual intimate content that appears on ${modalDomain.domain}. Please remove the content and any mirrored copies without delay.`,
      "",
      `Case reference: ${caseRef}`,
      `Reported domain: ${modalDomain.domain}`,
      modalDomain.pageUrls.length > 0 ? "Matched page URLs:" : null,
      ...modalDomain.pageUrls.map((url) => `- ${url}`),
      modalDomain.imageUrls.length > 0 ? "Matched asset URLs:" : null,
      ...modalDomain.imageUrls.map((url) => `- ${url}`),
      intel?.network ? `Network / operator: ${intel.network}` : null,
      intel?.cdn_provider ? `CDN / infrastructure: ${intel.cdn_provider}` : null,
      takedown?.removal_type
        ? `Preferred takedown route: ${takedown.removal_type.replace(/_/g, " ")}`
        : null,
      "",
      "This report was generated by Sniffer as part of an abuse investigation. The content is being reported as non-consensual and harmful. Please confirm removal as soon as possible.",
      "",
      "Regards,",
      "Case holder",
    ].filter(Boolean);

    return lines.join("\n");
  }, [caseRef, intel, modalDomain, takedown]);

  async function copyNotice(): Promise<void> {
    if (!generatedNotice) return;

    try {
      await navigator.clipboard.writeText(generatedNotice);
      setNoticeCopied(true);
      window.setTimeout(() => setNoticeCopied(false), 2000);
    } catch {
      setNoticeCopied(false);
    }
  }

  function markTarget(domain: string, next: TargetStage): void {
    setTargetStages((current) => ({
      ...current,
      [domain]: advanceTargetStage(current[domain], next),
    }));
  }

  function handleInvestigate(domain: string): void {
    setSelectedDomain(domain);
    markTarget(domain, "investigated");
  }

  function handleIssueTakedown(domain: string): void {
    setSelectedDomain(domain);
    setNoticeDomain(domain);
    markTarget(domain, "notice_ready");
  }

  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-[#e8e4de] bg-white">
      <div className="flex items-center gap-2.5 bg-[#0a0a0a] px-5 py-3">
        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a8a29e]">
          Removal Console
        </p>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div>
          <p className="mb-1 text-[13px] font-semibold text-[#0a0a0a]">
            Every discovered domain is now an actionable investigation target
          </p>
          <p className="text-[12px] leading-relaxed text-[#6b7280]">
            Scan results should not force the user into another blank tool. Investigate the
            infrastructure or issue a takedown notice directly from the case report.
          </p>
        </div>

        {traceLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-xl border border-[#e8e4de] bg-[#fafaf8] p-5"
              >
                <div className="mb-4 h-4 w-40 rounded bg-[#f0ede8]" />
                <div className="mb-2 h-3 w-24 rounded bg-[#f0ede8]" />
                <div className="mb-2 h-3 w-52 rounded bg-[#f0ede8]" />
                <div className="h-3 w-44 rounded bg-[#f0ede8]" />
              </div>
            ))}
          </div>
        ) : traceError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
            {traceError}
          </div>
        ) : domains.length === 0 ? (
          <div className="rounded-xl border border-[#e8e4de] bg-[#fafaf8] px-4 py-4">
            <p className="text-[13px] font-medium text-[#0a0a0a]">No actionable domains detected yet</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#6b7280]">
              The scan did not return any matched or related domains for this case. Re-run the
              discovery scan or upload a different image sample.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {domains.map((item) => {
                const isActive = item.domain === selectedDomain;
                const stage = targetStages[item.domain] ?? "detected";
                const stageStyle = TARGET_STAGE_STYLES[stage];

                return (
                  <article
                    key={item.domain}
                    className={`rounded-xl border p-4 transition-colors ${
                      isActive
                        ? "border-rose-200 bg-rose-50/40"
                        : "border-[#e8e4de] bg-[#fafaf8]"
                    }`}
                  >
                    <div className="mb-3 flex flex-wrap items-start gap-2">
                      <p className="mr-auto text-[13px] font-semibold text-[#0a0a0a]">
                        {item.domain}
                      </p>

                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10.5px] font-mono ${stageStyle.bg} ${stageStyle.border} ${stageStyle.text}`}
                      >
                        {stageStyle.label}
                      </span>

                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10.5px] font-mono ${
                          item.kind === "direct_match"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-indigo-200 bg-indigo-50 text-indigo-700"
                        }`}
                      >
                        {item.kind === "direct_match" ? "Direct match" : "Related domain"}
                      </span>

                      {item.confidence != null && (
                        <span className="inline-flex items-center rounded-full border border-[#e8e4de] bg-white px-2.5 py-1 text-[10.5px] font-mono text-[#6b7280]">
                          {item.confidence}% confidence
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-[11px] text-[#9ca3af]">Network</p>
                        <p className="text-[12.5px] font-medium text-[#0a0a0a]">
                          {item.network ?? "Unknown"}
                        </p>
                      </div>

                      {item.reason && (
                        <div>
                          <p className="text-[11px] text-[#9ca3af]">Why this target matters</p>
                          <p className="text-[12px] leading-relaxed text-[#6b7280]">{item.reason}</p>
                        </div>
                      )}

                      <div>
                        <p className="mb-1 text-[11px] text-[#9ca3af]">Detected URLs</p>
                        {item.pageUrls.length > 0 ? (
                          <ul className="space-y-1">
                            {item.pageUrls.slice(0, 3).map((url) => (
                              <li
                                key={url}
                                className="truncate rounded-lg border border-[#e8e4de] bg-white px-2.5 py-2 font-mono text-[11px] text-[#374151]"
                                title={url}
                              >
                                {url}
                              </li>
                            ))}
                            {item.pageUrls.length > 3 && (
                              <li className="text-[11px] text-[#6b7280]">
                                +{item.pageUrls.length - 3} more detected URLs
                              </li>
                            )}
                          </ul>
                        ) : (
                          <p className="text-[12px] leading-relaxed text-[#6b7280]">
                            No direct page URLs were captured for this target yet.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleInvestigate(item.domain)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-white px-3.5 py-2 text-[12px] font-medium text-[#374151] transition-colors hover:border-[#0a0a0a]"
                        >
                          Investigate
                        </button>

                        <button
                          type="button"
                          onClick={() => handleIssueTakedown(item.domain)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-[12px] font-medium text-rose-700 transition-colors hover:border-rose-300 hover:bg-rose-100"
                        >
                          Issue Takedown
                        </button>

                        {item.pageUrls[0] && (
                          <a
                            href={item.pageUrls[0]}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a0a0a] px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#1a1a1a]"
                          >
                            Open matched page
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {activeDomain && (
              <div className="rounded-xl border border-[#e8e4de] bg-white">
                <div className="border-b border-[#f0ede8] px-5 py-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#a8a29e]">
                    Investigation Workspace
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-semibold text-[#0a0a0a]">{activeDomain.domain}</p>
                    <span className="rounded-full border border-[#e8e4de] bg-[#fafaf8] px-2.5 py-1 text-[10.5px] font-mono text-[#6b7280]">
                      Case {caseRef}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleIssueTakedown(activeDomain.domain)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-[12px] font-medium text-rose-700 transition-colors hover:border-rose-300 hover:bg-rose-100"
                    >
                      Issue Takedown Notice
                    </button>

                    <Link
                      href={`/investigate?caseId=${caseId}&domain=${encodeURIComponent(activeDomain.domain)}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-white px-3.5 py-2 text-[12px] font-medium text-[#374151] transition-colors hover:border-[#0a0a0a]"
                    >
                      Full domain workspace
                    </Link>
                  </div>

                  {lookupLoading ? (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="space-y-3 rounded-xl border border-[#e8e4de] bg-[#fafaf8] p-5 animate-pulse">
                        <div className="h-3 w-28 rounded bg-[#f0ede8]" />
                        <div className="h-3 w-40 rounded bg-[#f0ede8]" />
                        <div className="h-3 w-36 rounded bg-[#f0ede8]" />
                      </div>
                      <div className="space-y-3 rounded-xl border border-[#e8e4de] bg-[#fafaf8] p-5 animate-pulse">
                        <div className="h-3 w-28 rounded bg-[#f0ede8]" />
                        <div className="h-3 w-44 rounded bg-[#f0ede8]" />
                        <div className="h-3 w-32 rounded bg-[#f0ede8]" />
                      </div>
                    </div>
                  ) : lookupError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
                      {lookupError}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="rounded-xl border border-[#e8e4de] bg-white p-5">
                        <p className="mb-3 text-[10px] font-mono uppercase tracking-widest text-[#a8a29e]">
                          Infrastructure Intelligence
                        </p>
                        {intel?.found ? (
                          <div className="space-y-3">
                            <div>
                              <p className="text-[11px] text-[#9ca3af]">CDN Provider</p>
                              <p className="text-[13px] font-medium text-[#0a0a0a]">
                                {intel.cdn_provider ?? "Unknown"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] text-[#9ca3af]">Provider Type</p>
                              <p className="text-[13px] font-medium text-[#0a0a0a]">
                                {intel.provider_type?.replace(/_/g, " ") ?? "Unknown"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] text-[#9ca3af]">Network</p>
                              <p className="text-[13px] font-medium text-[#0a0a0a]">
                                {intel.network ?? activeDomain.network ?? "Unknown"}
                              </p>
                            </div>
                            <p className="border-t border-[#f0ede8] pt-2 text-[11.5px] leading-relaxed text-[#6b7280]">
                              This keeps the investigation grounded in operator and infrastructure
                              context before the user escalates to platform removal.
                            </p>
                          </div>
                        ) : (
                          <p className="text-[12px] leading-relaxed text-[#6b7280]">
                            No CDN intelligence found for this domain yet. You can still use the
                            takedown route below.
                          </p>
                        )}
                      </div>

                      <div className="rounded-xl border border-[#e8e4de] bg-white p-5">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-[#a8a29e]">
                            Takedown Route
                          </p>
                          {takedownStatus && (
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono ${takedownStatus.bg} ${takedownStatus.border} ${takedownStatus.text}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${takedownStatus.dot}`} />
                              {takedownStatus.label}
                            </span>
                          )}
                        </div>

                        {takedown?.found ? (
                          <div className="space-y-3">
                            <div>
                              <p className="text-[11px] text-[#9ca3af]">Removal Method</p>
                              <p className="text-[13px] font-medium text-[#0a0a0a]">
                                {takedown.removal_type?.replace(/_/g, " ") ?? "Unknown"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] text-[#9ca3af]">Abuse Contact</p>
                              <p className="break-all text-[13px] font-medium text-[#0a0a0a]">
                                {takedown.contact_email ?? "Not listed"}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                              {takedown.removal_page && (
                                <a
                                  href={takedown.removal_page}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a0a0a] px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#1a1a1a]"
                                >
                                  Open removal portal
                                </a>
                              )}
                              {takedown.contact_email && (
                                <a
                                  href={`mailto:${takedown.contact_email}?subject=${encodeURIComponent(
                                    `Takedown request for ${activeDomain.domain} (${caseRef})`,
                                  )}&body=${encodeURIComponent(generatedNotice)}`}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-white px-3.5 py-2 text-[12px] font-medium text-[#374151] transition-colors hover:border-[#0a0a0a]"
                                >
                                  Open email draft
                                </a>
                              )}
                            </div>
                            <p className="border-t border-[#f0ede8] pt-2 text-[11.5px] leading-relaxed text-[#6b7280]">
                              The report already resolved the domain and contact route. No re-entry
                              is required.
                            </p>
                          </div>
                        ) : (
                          <p className="text-[12px] leading-relaxed text-[#6b7280]">
                            No takedown route found for this domain yet. Use the full domain
                            workspace for a manual lookup or switch to another target.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <AlertDialog
              open={Boolean(noticeDomain)}
              onOpenChange={(open) => {
                if (!open) {
                  setNoticeDomain(null);
                  setNoticeCopied(false);
                }
              }}
            >
              <AlertDialogContent className="max-h-[90vh] max-w-4xl overflow-hidden bg-white p-0">
                <div className="flex items-center gap-2.5 border-b border-[#f0ede8] bg-[#0a0a0a] px-5 py-3">
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a8a29e]">
                    Takedown Notice
                  </p>
                </div>

                <div className="space-y-5 overflow-y-auto p-5">
                  <AlertDialogHeader className="items-start gap-1 text-left">
                    <AlertDialogTitle className="text-[18px] font-semibold text-[#0a0a0a]">
                      {modalDomain?.domain ?? "Selected domain"}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-left text-[12.5px] leading-relaxed text-[#6b7280]">
                      Detected domain, resolved route, ready notice, and direct action in one place.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-3 rounded-xl border border-[#e8e4de] bg-[#fafaf8] p-4">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[#a8a29e]">
                        Platform Details
                      </p>
                      <div>
                        <p className="text-[11px] text-[#9ca3af]">Case reference</p>
                        <p className="font-mono text-[11px] text-[#0a0a0a]">{caseRef}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#9ca3af]">Target domain</p>
                        <p className="text-[13px] font-medium text-[#0a0a0a]">
                          {modalDomain?.domain ?? "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#9ca3af]">Network</p>
                        <p className="text-[13px] font-medium text-[#0a0a0a]">
                          {intel?.network ?? modalDomain?.network ?? "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#9ca3af]">CDN / provider</p>
                        <p className="text-[13px] font-medium text-[#0a0a0a]">
                          {intel?.cdn_provider ?? "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#9ca3af]">Removal route</p>
                        <p className="text-[13px] font-medium text-[#0a0a0a]">
                          {takedown?.removal_type?.replace(/_/g, " ") ?? "Manual review needed"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#9ca3af]">Abuse contact</p>
                        <p className="break-all text-[13px] font-medium text-[#0a0a0a]">
                          {takedown?.contact_email ?? "Not listed"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-[#e8e4de] bg-white p-4">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[#a8a29e]">
                        Detected URLs
                      </p>

                      {modalDomain && modalDomain.pageUrls.length > 0 ? (
                        <div className="space-y-2">
                          {modalDomain.pageUrls.map((url) => (
                            <div
                              key={url}
                              className="truncate rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-3 py-2 font-mono text-[11px] text-[#374151]"
                              title={url}
                            >
                              {url}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[12px] leading-relaxed text-[#6b7280]">
                          No page URLs were captured for this target.
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 pt-2">
                        {takedown?.removal_page && (
                          <a
                            href={takedown.removal_page}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a0a0a] px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#1a1a1a]"
                          >
                            Open removal portal
                          </a>
                        )}
                        {takedown?.contact_email && modalDomain && (
                          <a
                            href={`mailto:${takedown.contact_email}?subject=${encodeURIComponent(
                              `Takedown request for ${modalDomain.domain} (${caseRef})`,
                            )}&body=${encodeURIComponent(generatedNotice)}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-white px-3.5 py-2 text-[12px] font-medium text-[#374151] transition-colors hover:border-[#0a0a0a]"
                          >
                            Open email draft
                          </a>
                        )}
                        {modalDomain?.pageUrls[0] && (
                          <a
                            href={modalDomain.pageUrls[0]}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-white px-3.5 py-2 text-[12px] font-medium text-[#374151] transition-colors hover:border-[#0a0a0a]"
                          >
                            Review matched page
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[#e8e4de] bg-white">
                    <div className="flex items-center justify-between gap-3 border-b border-[#f0ede8] px-4 py-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[#a8a29e]">
                        Ready Notice
                      </p>
                      <button
                        type="button"
                        onClick={() => void copyNotice()}
                        className="rounded-lg border border-[#e8e4de] px-3 py-1 text-[11px] text-[#6b7280] transition-colors hover:text-[#0a0a0a]"
                      >
                        {noticeCopied ? "Copied" : "Copy notice"}
                      </button>
                    </div>
                    <pre className="max-h-72 overflow-auto whitespace-pre-wrap bg-[#fafaf8] px-4 py-4 font-mono text-[11.5px] leading-relaxed text-[#374151]">
                      {generatedNotice}
                    </pre>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[11.5px] text-[#6b7280]">
                    {modalDomain && (
                      <span className="rounded-full border border-[#e8e4de] bg-[#fafaf8] px-2.5 py-1">
                        Detected domain: {modalDomain.domain}
                      </span>
                    )}
                    {takedownStatus && (
                      <span
                        className={`rounded-full border px-2.5 py-1 ${takedownStatus.bg} ${takedownStatus.border} ${takedownStatus.text}`}
                      >
                        Route status: {takedownStatus.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap justify-between gap-2 border-t border-[#f0ede8] bg-[#fafaf8] px-5 py-4">
                  <AlertDialogCancel className="rounded-lg border border-[#e8e4de] bg-white px-4 py-2 text-[12px] text-[#374151] hover:border-[#0a0a0a]">
                    Close
                  </AlertDialogCancel>

                  <div className="flex flex-wrap justify-end gap-2">
                    {modalDomain && (
                      <Link
                        href={`/investigate?caseId=${caseId}&domain=${encodeURIComponent(modalDomain.domain)}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-white px-3.5 py-2 text-[12px] font-medium text-[#374151] transition-colors hover:border-[#0a0a0a]"
                      >
                        Full domain workspace
                      </Link>
                    )}
                    {modalDomain && (
                      <Link
                        href={`/takedown?caseId=${caseId}&domain=${encodeURIComponent(modalDomain.domain)}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a0a0a] px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#1a1a1a]"
                      >
                        Formal notice generator
                      </Link>
                    )}
                  </div>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </section>
  );
}