"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { CaseData, AnalysisResult } from "@/components/report/types";
import { buildCaseRef, buildSignalRows, buildTimeline, TAKEDOWN_GUIDES } from "@/components/report/utils";
import { CaseHeader } from "@/components/report/CaseHeader";
import { ScoreGauge } from "@/components/report/ScoreGauge";
import { ImageEvidence } from "@/components/report/ImageEvidence";
import { ForensicSignals } from "@/components/report/ForensicSignals";
import { EvidenceMetadata } from "@/components/report/EvidenceMetadata";
import { EvidenceTimeline } from "@/components/report/EvidenceTimeline";
import { TakedownGuidance } from "@/components/report/TakedownGuidance";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [suspiciousImg, setSuspiciousImg] = useState<string | null>(null);
  const [referenceImg, setReferenceImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hashCopied, setHashCopied] = useState(false);

  useEffect(() => {
    if (!caseId) {
      router.replace("/verify");
      return;
    }

    // Load cached image thumbnails
    setSuspiciousImg(sessionStorage.getItem(`sniffer_suspicious_${caseId}`));
    setReferenceImg(sessionStorage.getItem(`sniffer_reference_${caseId}`));

    Promise.all([
      fetch(`${API_URL}/api/cases/${caseId}`).then((r) => {
        if (!r.ok) throw new Error("Case not found");
        return r.json() as Promise<CaseData>;
      }),
      fetch(`${API_URL}/api/analysis/${caseId}/result`).then((r) => {
        if (!r.ok) throw new Error("Analysis result not found");
        return r.json() as Promise<AnalysisResult>;
      }),
    ])
      .then(([c, a]) => {
        setCaseData(c);
        setAnalysis(a);
      })
      .catch((e: unknown) => setFetchError(e instanceof Error ? e.message : "Failed to load report"))
      .finally(() => setLoading(false));
  }, [caseId, router]);

  function copyHash() {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis.file_hash).then(() => {
      setHashCopied(true);
      setTimeout(() => setHashCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-7 h-7 border-2 border-[#e8e4de] border-t-[#0a0a0a] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[13px] text-[#9ca3af] font-mono">Loading forensic report…</p>
        </div>
      </div>
    );
  }

  if (fetchError || !analysis || !caseData) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <p className="text-[14px] text-red-600 mb-4">{fetchError ?? "Report not found"}</p>
          <Link href="/verify" className="text-[13px] text-indigo-600 hover:underline">
            ← Start a new verification
          </Link>
        </div>
      </div>
    );
  }

  const score = analysis.authenticity_score;
  const isHigh = score >= 70;
  const isMed = score >= 40 && score < 70;
  const verdict = isHigh ? "LIKELY AUTHENTIC" : isMed ? "INCONCLUSIVE" : "MANIPULATED";
  const verdictColor = isHigh
    ? "text-green-700 bg-green-50 border-green-200"
    : isMed
    ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-red-700 bg-red-50 border-red-200";

  const caseRef = buildCaseRef(caseId);
  const signalRows = buildSignalRows(analysis);
  const timeline = buildTimeline(analysis, caseRef);
  const takedownSteps = TAKEDOWN_GUIDES[caseData.platform_source];

  return (
    <div className="min-h-screen bg-[#fafaf8] print:bg-white">
      {/* Nav — print hidden */}
      <header className="border-b border-[#e8e4de] px-6 py-4 flex items-center gap-3 bg-white print:hidden sticky top-0 z-10">
        <Link
          href="/"
          className="font-mono text-[13px] text-[#0a0a0a] tracking-widest uppercase hover:opacity-70 transition-opacity"
        >
          Sniffer
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <span className="text-[13px] text-[#9ca3af]">Forensic Report</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={copyHash}
            className="text-[12px] text-[#6b7280] hover:text-[#0a0a0a] border border-[#e8e4de] px-3 py-1.5 rounded-lg transition-colors"
          >
            {hashCopied ? "Copied!" : "Copy Hash"}
          </button>
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

      <main className="max-w-3xl mx-auto px-6 py-10 print:py-6 print:px-10">

        <CaseHeader caseRef={caseRef} verdict={verdict} verdictColor={verdictColor} caseData={caseData} />

        {/* ── Score + Images ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">Authenticity Analysis</p>
            <ScoreGauge score={score} />
            <p className="text-[12.5px] text-[#6b7280] mt-4 leading-relaxed">{analysis.explanation}</p>
          </div>

          <ImageEvidence suspiciousImg={suspiciousImg} referenceImg={referenceImg} />
        </div>

        <ForensicSignals rows={signalRows} />

        <EvidenceMetadata analysis={analysis} hashCopied={hashCopied} onCopy={copyHash} />

        <EvidenceTimeline entries={timeline} />

        {takedownSteps && <TakedownGuidance platform={caseData.platform_source} steps={takedownSteps} />}

        {/* ── Footer strip ── */}
        <div className="border-t border-[#e8e4de] pt-6 flex items-center justify-between print:border-[#0a0a0a]">
          <div>
            <p className="font-mono text-[10px] text-[#a8a29e] tracking-widest">SNIFFER · IMPIC LABS · 2026</p>
            <p className="font-mono text-[9px] text-[#c4bdb5] mt-0.5">
              This report is generated automatically and does not constitute legal advice.
            </p>
          </div>
          <div className="flex gap-4 print:hidden">
            <Link
              href="/verify"
              className="text-[12px] text-indigo-600 hover:underline"
            >
              New Verification
            </Link>
            <button
              onClick={() => window.print()}
              className="text-[12px] text-[#6b7280] hover:text-[#0a0a0a] transition-colors"
            >
              Print Report
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
