"use client";

import type { C2paResult } from "./types";

interface Props {
  c2pa: C2paResult | undefined;
}

const STATUS_CONFIG = {
  verified: {
    label: "Verified",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    dot: "bg-emerald-500",
  },
  trust_warning: {
    label: "Verified (cert unanchored)",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-600">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    dot: "bg-amber-500",
  },
  invalid: {
    label: "Invalid — modified after signing",
    badge: "bg-red-50 text-red-700 border-red-200",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-600">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    dot: "bg-red-500",
  },
  not_present: {
    label: "Not Present",
    badge: "bg-[#f5f5f4] text-[#9ca3af] border-[#e8e4de]",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#9ca3af]">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <line x1="12" y1="8" x2="12" y2="16" strokeDasharray="2 2" />
      </svg>
    ),
    dot: "bg-[#d4cfc9]",
  },
} as const;

function formatSigningTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return iso;
  }
}

export function C2PAProvenance({ c2pa }: Props) {
  const status = (c2pa?.status ?? "not_present") as keyof typeof STATUS_CONFIG;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_present;

  return (
    <section className="mb-8">
      <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">
        C2PA Content Credentials
      </p>

      <div className="border border-[#e8e4de] rounded-xl overflow-hidden">

        {/* ── Status header ── */}
        <div className="px-4 py-3 flex items-center gap-3 border-b border-[#f0ede8]">
          {cfg.icon}
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
            {cfg.label}
          </span>
          {status === "trust_warning" && (
            <span className="text-[11px] text-[#9ca3af] leading-tight">
              Certificate not in CAI Trust List — structure is cryptographically intact
            </span>
          )}
          {status === "invalid" && (
            <span className="text-[11px] text-red-500 leading-tight">
              File was altered after the provenance certificate was issued
            </span>
          )}
          {status === "not_present" && (
            <span className="text-[11px] text-[#9ca3af]">
              No Content Credentials embedded — common after social media upload (platforms strip manifests)
            </span>
          )}
        </div>

        {/* ── Signer + Tool grid (only when manifest present) ── */}
        {c2pa && status !== "not_present" && (
          <>
            <div className="grid grid-cols-2 divide-x divide-[#f0ede8] border-b border-[#f0ede8]">
              {c2pa.issuer && (
                <div className="px-4 py-3 min-w-0">
                  <p className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-widest mb-1">Signed by</p>
                  <p className="text-[12.5px] text-[#0a0a0a] font-medium truncate" title={c2pa.issuer}>
                    {c2pa.issuer}
                  </p>
                  {c2pa.issuer_org && c2pa.issuer_org !== c2pa.issuer && (
                    <p className="text-[11px] text-[#9ca3af] mt-0.5">{c2pa.issuer_org}</p>
                  )}
                </div>
              )}
              {c2pa.generator_tool && (
                <div className="px-4 py-3 min-w-0">
                  <p className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-widest mb-1">Origin Tool</p>
                  <p className="text-[12.5px] text-[#0a0a0a] font-medium truncate" title={c2pa.generator_tool}>
                    {c2pa.generator_tool}
                  </p>
                </div>
              )}
            </div>

            {c2pa.signing_time && (
              <div className="px-4 py-3 border-b border-[#f0ede8]">
                <p className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-widest mb-1">Signed At</p>
                <p className="text-[12.5px] text-[#0a0a0a]">{formatSigningTime(c2pa.signing_time)}</p>
              </div>
            )}

            {/* ── AI-generated declaration ── */}
            {c2pa.ai_generated && (
              <div className="px-4 py-3 border-b border-[#f0ede8] bg-amber-50">
                <div className="flex items-start gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 mt-0.5 shrink-0">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <div>
                    <p className="text-[12px] font-semibold text-amber-800">AI-Generated Content Declared</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      The manifest includes a{" "}
                      <span className="font-mono">trainedAlgorithmicMedia</span> assertion — the signer
                      explicitly declared this content was created by AI.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Actions provenance chain ── */}
            {c2pa.actions_summary && c2pa.actions_summary.length > 0 && (
              <div className="px-4 py-3 border-b border-[#f0ede8]">
                <p className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-widest mb-2">
                  Provenance Actions
                </p>
                <ol className="space-y-2">
                  {c2pa.actions_summary.map((action, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-0.75 shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-[#f0ede8] text-[9px] font-mono text-[#6b7280]">
                        {i + 1}
                      </span>
                      <span className="text-[12px] text-[#374151]">{action}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* ── Assertions ── */}
            {c2pa.assertions && c2pa.assertions.length > 0 && (
              <div className="px-4 py-3">
                <p className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-widest mb-2">
                  Assertions ({c2pa.assertions.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c2pa.assertions.map((assertion, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono bg-[#f5f5f4] border border-[#e8e4de] px-2 py-0.5 rounded text-[#6b7280]"
                      title={assertion}
                    >
                      {assertion}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
