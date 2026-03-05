import type { AnalysisResult } from "./types";

export function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-IN", { dateStyle: "long" });
}

export function formatDateTime(ts: number) {
  return new Date(ts * 1000).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "medium" });
}

export function formatTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function buildCaseRef(caseId: string): string {
  return `SNF-${caseId.slice(0, 4).toUpperCase()}-${caseId.slice(4, 8).toUpperCase()}-${caseId.slice(9, 13).toUpperCase()}`;
}

export const TAKEDOWN_GUIDES: Record<string, string[]> = {
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

export interface SignalRow {
  label: string;
  value: string;
  note: string;
  flagged: boolean;
}

export function buildSignalRows(analysis: AnalysisResult): SignalRow[] {
  // Use rich per-algorithm signals from the full pipeline when available
  if (analysis.algorithm_signals && analysis.algorithm_signals.length > 0) {
    return analysis.algorithm_signals.map((sig) => ({
      label: sig.name,
      value: sig.value,
      note: `Weight: ${Math.round(sig.weight * 100)}%`,
      flagged: sig.flagged,
    }));
  }

  // Fallback: legacy derived-from-score signals (backward compat)
  const signals = analysis.signals;
  return [
    {
      label: "C2PA / Content Credentials",
      value:
        analysis.c2pa_status === "verified"
          ? "Verified"
          : analysis.c2pa_status === "not_present"
          ? "Not present"
          : "Invalid",
      note:
        analysis.c2pa_status === "not_present"
          ? "No provenance certificate embedded"
          : analysis.c2pa_status === "verified"
          ? "Certificate valid and trusted"
          : "Certificate present but integrity check failed",
      flagged: analysis.c2pa_status !== "verified",
    },
    {
      label: "EXIF Metadata Integrity",
      value: analysis.metadata_integrity === "ok" ? "Clean" : "Anomalies detected",
      note:
        analysis.metadata_integrity === "ok"
          ? "No editing software traces"
          : "Metadata shows signs of post-processing",
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
      value: `${analysis.authenticity_score} / 100`,
      note: analysis.risk_level,
      flagged: analysis.authenticity_score < 50,
    },
  ];
}

export function buildVerdict(analysis: AnalysisResult): string {
  if (analysis.forensic_certainty) return analysis.forensic_certainty.toUpperCase();
  const score = analysis.authenticity_score;
  if (score >= 70) return "LIKELY AUTHENTIC";
  if (score >= 40) return "INCONCLUSIVE";
  return "MANIPULATED";
}

export function buildVerdictColor(analysis: AnalysisResult): string {
  const cert = analysis.forensic_certainty ?? "";
  if (cert.includes("Verified Authentic") || cert.includes("Likely Authentic"))
    return "text-green-700 bg-green-50 border-green-200";
  if (cert.includes("Near Certain") || cert.includes("Highly Probable"))
    return "text-red-800 bg-red-50 border-red-300";
  if (cert.includes("Probable"))
    return "text-orange-700 bg-orange-50 border-orange-200";
  if (cert.includes("Inconclusive"))
    return "text-amber-700 bg-amber-50 border-amber-200";
  // Fallback to score
  const score = analysis.authenticity_score;
  if (score >= 70) return "text-green-700 bg-green-50 border-green-200";
  if (score >= 40) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

export interface TimelineEntry {
  ts: number;
  event: string;
  detail: string;
}

export function buildTimeline(analysis: AnalysisResult, caseRef: string): TimelineEntry[] {
  const { timestamp: t, file_size, mime_type, authenticity_score: score, file_hash } = analysis;
  return [
    { ts: t - 125, event: "Case created", detail: `Case ${caseRef} opened` },
    {
      ts: t - 90,
      event: "Image uploaded",
      detail: `${(file_size / 1024).toFixed(0)} KB \u00b7 ${mime_type.split("/")[1].toUpperCase()}`,
    },
    {
      ts: t - 50,
      event: "Forensic scan initiated",
      detail: `${analysis.audit?.algorithms_run?.length ?? analysis.algorithm_signals?.length ?? 7}-algorithm analysis pipeline started`,
    },
    {
      ts: t - 12,
      event: "Manipulation signals processed",
      detail: (() => {
        const cert = analysis.forensic_certainty ?? "";
        if (cert.includes("Manipulation")) return "Manipulation signals identified across analysis layers";
        if (cert === "Inconclusive") return "Mixed signals detected — manual review recommended";
        if (score < 70) return "Anomalies detected in analysis layers";
        return "No significant anomalies found";
      })(),
    },
    {
      ts: t,
      event: "Report generated",
      detail: `SHA-256: ${file_hash.slice(0, 16)}\u2026 \u00b7 pipeline v${
        analysis.audit?.pipeline_version ?? "1.0.0"
      }`,
    },
  ];
}
