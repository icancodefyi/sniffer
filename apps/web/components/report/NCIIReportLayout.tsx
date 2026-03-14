"use client";

import Link from "next/link";
import { ContentTrace } from "./ContentTrace";
import type { CaseData } from "./types";
import { buildCaseRef } from "./utils";
import { formatDate } from "./utils";

interface Props {
  caseId: string;
  caseData: CaseData;
  suspiciousImg: string | null;
  isCaseSaved: boolean;
  isSaving: boolean;
  saveSent: boolean;
  saveEmail: string;
  onSaveEmailChange: (v: string) => void;
  onSendMagicLink: (e: React.FormEvent) => void;
  onSaveCase: () => void;
  sessionUserId?: string;
}

export function NCIIReportLayout({
  caseId,
  caseData,
  suspiciousImg,
  isCaseSaved,
  isSaving,
  saveSent,
  saveEmail,
  onSaveEmailChange,
  onSendMagicLink,
  onSaveCase,
  sessionUserId,
}: Props) {
  const caseRef = buildCaseRef(caseId);

  return (
    <div className="min-h-screen bg-[#fafaf8] print:bg-white">
      {/* Sticky nav */}
      <header className="border-b border-[#e8e4de] px-6 py-4 flex items-center gap-3 bg-white print:hidden sticky top-0 z-10">
        <Link href="/" className="font-mono text-[13px] text-[#0a0a0a] tracking-widest uppercase hover:opacity-70 transition-opacity">
          Sniffer
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <span className="text-[13px] text-[#9ca3af]">Leak Investigation Report</span>
        <div className="ml-auto print:hidden">
          <button
            onClick={() => window.print()}
            className="text-[12px] font-medium bg-[#0a0a0a] text-white px-4 py-1.5 rounded-full hover:bg-[#1a1a1a] transition-colors flex items-center gap-1.5"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Download Report
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 print:py-6 print:px-10">

        {/* ── Save report ────────────────────────────────────────────── */}
        {isCaseSaved ? (
          <div className="mb-6 flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50">
            <svg width="13" height="13" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-[12.5px] text-emerald-800 font-medium">Report saved to your account</p>
            <Link href="/dashboard" className="ml-auto text-[12px] text-emerald-700 hover:underline shrink-0">
              View dashboard →
            </Link>
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-[#e8e4de] bg-white overflow-hidden">
            <div className="px-5 py-4">
              {saveSent ? (
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full border border-emerald-200 bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="11" height="11" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#0a0a0a] mb-0.5">Check your inbox</p>
                    <p className="text-[12px] text-[#6b7280]">Magic link sent to <span className="font-medium text-[#374151]">{saveEmail}</span></p>
                  </div>
                </div>
              ) : sessionUserId ? (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-semibold text-[#0a0a0a]">Save this report</p>
                    <p className="text-[12px] text-[#6b7280]">Track this case in your account dashboard.</p>
                  </div>
                  <button
                    onClick={onSaveCase}
                    disabled={isSaving}
                    className="shrink-0 flex items-center gap-1.5 text-[12px] font-medium bg-[#0a0a0a] text-white px-4 py-2 rounded-lg hover:bg-[#1a1a1a] transition-colors disabled:opacity-60"
                  >
                    {isSaving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {isSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-[13px] font-semibold text-[#0a0a0a] mb-1">Track this case</p>
                  <p className="text-[12px] text-[#6b7280] mb-3">Save this report to your account — we&apos;ll email you a magic link.</p>
                  <form onSubmit={onSendMagicLink} className="flex gap-2">
                    <input
                      type="email"
                      value={saveEmail}
                      onChange={(e) => onSaveEmailChange(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="flex-1 rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-3.5 py-2 text-[12.5px] text-[#0a0a0a] placeholder:text-[#c4bdb5] focus:outline-none focus:border-[#0a0a0a] transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!saveEmail.trim() || isSaving}
                      className="flex items-center gap-1.5 text-[12px] font-medium bg-[#0a0a0a] text-white px-4 py-2 rounded-lg hover:bg-[#1a1a1a] transition-colors disabled:opacity-40 shrink-0"
                    >
                      {isSaving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      {isSaving ? "Sending…" : "Save report"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Case Header ─────────────────────────────────────────────── */}
        <div className="border-b border-[#e8e4de] pb-7 mb-8">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="font-mono text-[10px] text-[#a8a29e] uppercase tracking-widest mb-1">Case Reference</p>
              <p className="font-mono text-[22px] text-[#0a0a0a] tracking-tight">{caseRef}</p>
            </div>
            <div className="text-right space-y-1.5">
              <span className="block px-3 py-1.5 rounded-full border border-rose-200 bg-rose-50 text-[11.5px] font-bold tracking-widest font-mono text-rose-700">
                LEAK INVESTIGATION
              </span>
              <span className="block px-3 py-1 rounded-full border border-[#e8e4de] bg-[#fafaf8] text-[10px] font-mono text-[#6b7280]">
                Pipeline 2 · NCII
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-7 gap-y-3">
            {[
              { label: "Date", value: formatDate(caseData.created_at) },
              { label: "Source Platform", value: caseData.platform_source },
              { label: "Issue Type", value: caseData.issue_type },
              { label: "Report Type", value: caseData.anonymous ? "Anonymous" : "Named" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest">{item.label}</p>
                <p className="text-[13px] text-[#374151] font-medium mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          {caseData.description && (
            <p className="mt-4 text-[13px] text-[#6b7280] border-l-2 border-[#e8e4de] pl-4 italic leading-relaxed">
              &ldquo;{caseData.description}&rdquo;
            </p>
          )}
        </div>

        {/* ── Uploaded image thumbnail ────────────────────────────────── */}
        {suspiciousImg && (
          <div className="mb-8 rounded-xl border border-[#e8e4de] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-[#f0ede8]">
              <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest">Traced Image</p>
            </div>
            <div className="p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={suspiciousImg}
                alt="Image submitted for leak scan"
                className="max-h-56 rounded-lg object-contain mx-auto"
              />
            </div>
          </div>
        )}

        {/* ── Hero: Leak Discovery Scan ────────────────────────────────── */}
        <ContentTrace caseId={caseId} />

        <div className="mb-8 rounded-xl border border-[#e8e4de] bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f0ede8]">
            <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest">Next Step</p>
          </div>
          <div className="px-5 py-5 space-y-4">
            <p className="text-[13px] font-semibold text-[#0a0a0a]">This page is evidence only</p>
            <p className="text-[12.5px] text-[#6b7280] leading-relaxed">
              Continue to Investigate to find contact routes for each target domain. Then move to Takedown to generate and send your final notice.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/investigate?caseId=${caseId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0a0a0a] text-white text-[13px] font-medium rounded-full hover:bg-[#1a1a1a] transition-colors"
              >
                Continue to Investigate
              </Link>
              <Link
                href={`/takedown?caseId=${caseId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#e8e4de] text-[#374151] text-[13px] font-medium rounded-full hover:border-[#0a0a0a] transition-colors"
              >
                Go to Takedown
              </Link>
            </div>
          </div>
        </div>

        {/* ── Evidence Timeline ─────────────────────────────────────────── */}
        <div className="mb-8 rounded-xl border border-[#e8e4de] bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f0ede8]">
            <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest">Case Timeline</p>
          </div>
          <div className="px-5 py-4 space-y-3">
            {[
              { label: "Case opened", value: new Date(caseData.created_at * 1000).toLocaleString() },
              { label: "Case reference", value: caseRef },
              { label: "Investigation type", value: "NCII Leak Discovery — Pipeline 2" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4">
                <p className="text-[11.5px] font-mono text-[#9ca3af]">{item.label}</p>
                <p className="text-[12px] text-[#374151] font-medium text-right">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#e8e4de] pt-6 flex items-center justify-between print:border-[#0a0a0a]">
          <div>
            <p className="font-mono text-[10px] text-[#a8a29e] tracking-widest">SNIFFER · IMPIC LABS · 2026</p>
            <p className="font-mono text-[9px] text-[#c4bdb5] mt-0.5">
              This report is generated automatically and does not constitute legal advice.
            </p>
          </div>
          <div className="flex gap-4 print:hidden">
            <Link href="/leak" className="text-[12px] text-rose-600 hover:underline">
              New Leak Investigation
            </Link>
            <button onClick={() => window.print()} className="text-[12px] text-[#6b7280] hover:text-[#0a0a0a] transition-colors">
              Print Report
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
