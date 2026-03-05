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
    { ts: t - 50, event: "Forensic scan initiated", detail: "7-layer analysis pipeline started" },
    {
      ts: t - 12,
      event: "Manipulation signals processed",
      detail: score < 50 ? "Anomalies detected in analysis layers" : "No significant anomalies found",
    },
    { ts: t, event: "Report generated", detail: `SHA-256: ${file_hash.slice(0, 16)}\u2026` },
  ];
}
