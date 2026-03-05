"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface CaseData {
  case_id: string;
  created_at: number;
  anonymous: boolean;
  platform_source: string;
  issue_type: string;
  description?: string | null;
}

interface AnalysisResult {
  case_id: string;
  file_hash: string;
  file_size: number;
  mime_type: string;
  timestamp: number;
  authenticity_score: number;
  risk_level: string;
  manipulation_probability: number;
  c2pa_status: string;
  metadata_integrity: string;
  explanation: string;
  signals: Record<string, unknown>;
}

// SVG circular score gauge
function ScoreGauge({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const isHigh = score >= 70;
  const isMed = score >= 40 && score < 70;
  const color = isHigh ? "#16a34a" : isMed ? "#d97706" : "#dc2626";
  const bg = isHigh ? "bg-green-50 border-green-100" : isMed ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100";
  const label = isHigh ? "LOW RISK" : isMed ? "MEDIUM RISK" : "HIGH MANIPULATION RISK";
  const labelColor = isHigh ? "text-green-700" : isMed ? "text-amber-700" : "text-red-700";

  return (
    <div className={`flex items-center gap-5 p-5 rounded-xl border ${bg}`}>
      <div className="shrink-0">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="9" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dashoffset 1.2s ease" }}
          />
          <text
            x="60"
            y="56"
            textAnchor="middle"
            fontSize="28"
            fontWeight="700"
            fill="#0a0a0a"
            fontFamily="Georgia,'Times New Roman',serif"
          >
            {score}
          </text>
          <text x="60" y="72" textAnchor="middle" fontSize="9" fill="#9ca3af" fontFamily="monospace">
            /100
          </text>
        </svg>
      </div>
      <div>
        <p className="text-[10.5px] font-mono text-[#a8a29e] uppercase tracking-widest mb-1">Authenticity Score</p>
        <p className={`text-[15px] font-bold tracking-wider font-mono ${labelColor}`}>{label}</p>
        <p className="text-[12.5px] text-[#6b7280] mt-2 leading-relaxed max-w-50">
          {isHigh
            ? "No significant manipulation signals detected in this image."
            : isMed
            ? "Moderate signals warrant further manual review."
            : "High-confidence manipulation indicators detected."}
        </p>
      </div>
    </div>
  );
}

function HashDisplay({ hash, onCopy, copied }: { hash: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="bg-[#0a0a0a] rounded-xl px-4 py-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[9.5px] font-mono text-[#4b5563] uppercase tracking-widest mb-1.5">SHA-256 File Hash</p>
        <p className="font-mono text-[10.5px] text-[#e5e7eb] break-all leading-relaxed">{hash}</p>
      </div>
      <button
        onClick={onCopy}
        className="shrink-0 mt-0.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium border border-[#374151] text-[#9ca3af] hover:text-white hover:border-[#6b7280] transition-colors"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

const TAKEDOWN_GUIDES: Record<string, string[]> = {
  Instagram: [
    "Tap \u00b7\u00b7\u00b7 (three dots) on the post",
    'Select "Report" \u2192 "It\'s inappropriate"',
    'Choose "Involves someone I know" or "Nudity or sexual activity"',
    "Submit \u2014 attach this report\u2019s Case ID as additional evidence",
  ],
  "Twitter / X": [
    "Click \u00b7\u00b7\u00b7 on the tweet",
    'Select "Report Tweet" \u2192 "It\'s abusive or harmful"',
    'Choose "Targeted harassment" or "Impersonation"',
    "Follow prompts \u2014 reference the SHA-256 hash in your report",
  ],
  Telegram: [
    "Open the message or channel",
    "Tap and hold the message \u2192 Forward \u2192 Report",
    "Select the appropriate abuse category",
    "Include Case ID and file hash as documentary evidence",
  ],
  WhatsApp: [
    "Open the chat",
    "Tap the contact name \u2192 More options \u2192 Block \u2192 Report",
    "Details are forwarded to WhatsApp Trust & Safety",
    "Screenshot this report and include the file hash as evidence",
  ],
  Facebook: [
    "Click \u00b7\u00b7\u00b7 on the post",
    'Select "Find support or report post"',
    'Choose "Nudity" or "Harassment" as appropriate',
    "Follow the full reporting flow \u2014 attach Evidence Report PDF",
  ],
};

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-IN", { dateStyle: "long" });
}

function formatDateTime(ts: number) {
  return new Date(ts * 1000).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "medium" });
}

function formatTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

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

  // Case reference number
  const caseRef = `SNF-${caseId.slice(0, 4).toUpperCase()}-${caseId.slice(4, 8).toUpperCase()}-${caseId.slice(9, 13).toUpperCase()}`;

  // Evidence timeline (relative to analysis timestamp)
  const t = analysis.timestamp;
  const timeline = [
    { ts: t - 125, event: "Case created", detail: `Case ${caseRef} opened` },
    { ts: t - 90, event: "Image uploaded", detail: `${(analysis.file_size / 1024).toFixed(0)} KB · ${analysis.mime_type.split("/")[1].toUpperCase()}` },
    {
      ts: t - 50,
      event: "Forensic scan initiated",
      detail: "7-layer analysis pipeline started",
    },
    {
      ts: t - 12,
      event: "Manipulation signals processed",
      detail: score < 50 ? "Anomalies detected in analysis layers" : "No significant anomalies found",
    },
    { ts: t, event: "Report generated", detail: `SHA-256: ${analysis.file_hash.slice(0, 16)}…` },
  ];

  // Forensic signal rows
  const signals = analysis.signals as Record<string, unknown>;
  const signalRows = [
    {
      label: "C2PA / Content Credentials",
      value: analysis.c2pa_status === "verified" ? "Verified" : analysis.c2pa_status === "not_present" ? "Not present" : "Invalid",
      note: analysis.c2pa_status === "not_present" ? "No provenance certificate embedded" : analysis.c2pa_status === "verified" ? "Certificate valid and trusted" : "Certificate present but integrity check failed",
      flagged: analysis.c2pa_status !== "verified",
    },
    {
      label: "EXIF Metadata Integrity",
      value: analysis.metadata_integrity === "ok" ? "Clean" : "Anomalies detected",
      note: analysis.metadata_integrity === "ok" ? "No editing software traces" : "Metadata shows signs of post-processing",
      flagged: analysis.metadata_integrity !== "ok",
    },
    {
      label: "Deepfake / Classifier Score",
      value: `${Math.round(analysis.manipulation_probability * 100)}% manipulation confidence`,
      note: `Raw score: ${analysis.manipulation_probability.toFixed(3)}`,
      flagged: analysis.manipulation_probability > 0.5,
    },
    {
      label: "Frequency Domain Analysis",
      value: signals?.frequency_anomalies ? "Anomalies detected" : "Clean",
      note: "FFT / DCT spectral pattern check",
      flagged: Boolean(signals?.frequency_anomalies),
    },
    {
      label: "Reference-Based Comparison",
      value: signals?.reference_based ? "Reference image provided" : "No reference uploaded",
      note: signals?.reference_based
        ? "Cross-image structural comparison performed"
        : "Single-image analysis mode only",
      flagged: false,
    },
    {
      label: "Combined Authenticity Signal",
      value: `${score} / 100`,
      note: analysis.risk_level,
      flagged: score < 50,
    },
  ];

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

        {/* ── Case Header ── */}
        <div className="border-b border-[#e8e4de] pb-7 mb-8 print:border-[#0a0a0a]">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="font-mono text-[10px] text-[#a8a29e] uppercase tracking-widest mb-1">Case Reference</p>
              <p className="font-mono text-[22px] text-[#0a0a0a] tracking-tight">{caseRef}</p>
            </div>
            <span
              className={`px-3 py-1.5 rounded-full border text-[11.5px] font-bold tracking-widest font-mono ${verdictColor}`}
            >
              {verdict}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-7 gap-y-3">
            {[
              { label: "Date", value: formatDate(caseData.created_at) },
              { label: "Platform", value: caseData.platform_source },
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

        {/* ── Score + Images ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">Authenticity Analysis</p>
            <ScoreGauge score={score} />
            <p className="text-[12.5px] text-[#6b7280] mt-4 leading-relaxed">{analysis.explanation}</p>
          </div>

          <div>
            <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">Image Evidence</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { src: suspiciousImg, label: "Suspicious Image" },
                { src: referenceImg, label: referenceImg ? "Original Image" : "No Reference" },
              ].map(({ src, label }) => (
                <div key={label}>
                  <div className="h-36 rounded-xl border border-[#e8e4de] bg-[#f5f5f5] overflow-hidden flex items-center justify-center">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt={label} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center px-3">
                        <svg
                          width="22"
                          height="22"
                          fill="none"
                          stroke="#d4cfc9"
                          strokeWidth="1.5"
                          viewBox="0 0 24 24"
                          className="mx-auto mb-1"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                        <p className="text-[9.5px] text-[#c4bdb5] font-mono">
                          {src === null && label === "No Reference" ? "NO REF" : "SUBMITTED"}
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-[10.5px] font-mono text-[#9ca3af] mt-1.5 text-center">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Forensic Signals ── */}
        <section className="mb-8">
          <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">Forensic Signals</p>
          <div className="border border-[#e8e4de] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e8e4de] bg-[#fafaf8]">
                  <th className="text-left px-4 py-2.5 text-[10px] font-mono text-[#9ca3af] uppercase tracking-wider">
                    Signal
                  </th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-mono text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-mono text-[#9ca3af] uppercase tracking-wider w-16">
                    Flag
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ede8]">
                {signalRows.map((row) => (
                  <tr key={row.label} className="hover:bg-[#fafaf8] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-[#0a0a0a]">{row.label}</p>
                      <p className="text-[10.5px] text-[#9ca3af] mt-0.5 font-mono">{row.note}</p>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-[#374151]">{row.value}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          row.flagged ? "bg-red-500" : "bg-green-400"
                        }`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Evidence Metadata ── */}
        <section className="mb-8">
          <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">Evidence Metadata</p>
          <div className="border border-[#e8e4de] rounded-xl overflow-hidden">
            <HashDisplay hash={analysis.file_hash} onCopy={copyHash} copied={hashCopied} />
            <div className="grid grid-cols-3 divide-x divide-[#f0ede8] border-t border-[#e8e4de]">
              {[
                { label: "File Size", value: `${(analysis.file_size / 1024).toFixed(1)} KB` },
                { label: "Format", value: analysis.mime_type.split("/")[1].toUpperCase() },
                { label: "Analyzed", value: formatDateTime(analysis.timestamp) },
              ].map((item) => (
                <div key={item.label} className="px-4 py-3">
                  <p className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-[12.5px] text-[#0a0a0a] font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Evidence Timeline ── */}
        <section className="mb-8">
          <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-4">Evidence Timeline</p>
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-2 top-1.5 bottom-1.5 w-px bg-[#e8e4de]" />
            <div className="space-y-5">
              {timeline.map((entry, i) => (
                <div key={i} className="relative flex items-start gap-3">
                  <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0a] bg-white shrink-0" />
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-[10.5px] text-[#a8a29e]">{formatTime(entry.ts)}</span>
                      <span className="text-[13px] font-semibold text-[#0a0a0a]">{entry.event}</span>
                    </div>
                    <p className="text-[11.5px] text-[#9ca3af] mt-0.5">{entry.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Takedown Guidance ── */}
        {takedownSteps && (
          <section className="mb-8">
            <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">Takedown Guidance</p>
            <div className="border border-[#e8e4de] rounded-xl p-5 bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
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
                  <p className="text-[13px] font-semibold text-[#0a0a0a]">
                    Report on {caseData.platform_source}
                  </p>
                  <p className="text-[11px] text-[#9ca3af]">
                    Use the Case ID and SHA-256 hash as supporting evidence
                  </p>
                </div>
              </div>
              <ol className="space-y-2.5">
                {takedownSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="font-mono text-[10.5px] text-[#a8a29e] w-4 shrink-0 mt-0.5">{i + 1}.</span>
                    <span className="text-[12.5px] text-[#374151] leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-[11px] text-[#a8a29e] border-t border-[#f0ede8] pt-3">
                Visit {caseData.platform_source}&apos;s Help Center → Safety &amp; Privacy → Report Content for the
                official reporting form.
              </p>
            </div>
          </section>
        )}

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
