"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const CYBERCRIME_EMAIL = "hello@cybercrime.gov.in";

const PLATFORMS = ["Instagram", "Facebook", "X / Twitter", "WhatsApp", "Telegram", "Other"];

interface RegistryTakedownResult {
  file_hash: string;
  registry_match: boolean;
  reference_id: string | null;
  registered_at: number | null;
  platform: string;
  report_url: string;
  notice_text: string;
  generated_at: number;
}

interface DomainTakedownResult {
  domain: string;
  found: boolean;
  removal_type: string | null;
  removal_page: string | null;
  contact_email: string | null;
  status: string;
  confidence: number;
  source: string;
}

interface DomainIntelligenceResult {
  domain: string;
  found: boolean;
  cdn_provider: string | null;
  provider_type: string | null;
  network: string | null;
  confidence: number;
  source: string;
}

interface DiscoveryTraceResult {
  direct_matches: Array<{
    domain: string;
    page_url: string;
  }>;
}

interface CaseSummary {
  case_id: string;
  created_at: number;
  anonymous: boolean;
  platform_source: string;
  issue_type: string;
  description?: string | null;
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildCaseRef(caseId: string) {
  const parts = caseId.split("-");
  if (parts.length >= 3) {
    return `SNF-${parts[0].slice(0, 4).toUpperCase()}-${parts[1].slice(0, 4).toUpperCase()}-${parts[2].slice(0, 4).toUpperCase()}`;
  }
  const compact = caseId.replace(/-/g, "").toUpperCase();
  return `SNF-${compact.slice(0, 4)}-${compact.slice(4, 8)}-${compact.slice(8, 12)}`;
}

function buildGuidedNotice(params: {
  domain: string;
  caseId?: string | null;
  network?: string | null;
  removalType?: string | null;
  contentUrl?: string;
}) {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const caseLine = params.caseId ? `Case Reference: ${buildCaseRef(params.caseId)}\n` : "";
  const networkLine = params.network ? `Hosting Network: ${params.network}\n` : "";
  const routeLine = params.removalType ? `Preferred Route: ${params.removalType.replace(/_/g, " ")}\n` : "";
  const contentLine = params.contentUrl?.trim() ? `Content URL: ${params.contentUrl.trim()}\n` : "";

  return `Subject: Urgent removal request for non-consensual content on ${params.domain}\n\nDear Trust & Safety Team,\n\nI am requesting immediate removal of non-consensual intimate content hosted on ${params.domain}.\n\n${caseLine}${networkLine}${routeLine}${contentLine}\nThis content violates privacy and consent, and I request removal of all copies, previews, and cached variants.\n\nPlease confirm action within 48 hours.\n\nRegards,\n[Your Name]\n${date}`;
}

export default function TakedownPage() {
  const searchParams = useSearchParams();
  const caseIdFromQuery = searchParams.get("caseId")?.trim() || null;
  const domainFromQuery = searchParams.get("domain")?.trim() || null;
  const isGuidedFlow = Boolean(domainFromQuery);

  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);
  const [domainTakedown, setDomainTakedown] = useState<DomainTakedownResult | null>(null);
  const [domainIntel, setDomainIntel] = useState<DomainIntelligenceResult | null>(null);
  const [caseSummary, setCaseSummary] = useState<CaseSummary | null>(null);
  const [contentUrl, setContentUrl] = useState("");
  const [autoDetectedUrls, setAutoDetectedUrls] = useState<string[]>([]);
  const [guidedCopied, setGuidedCopied] = useState(false);
  const [cybercrimeCopied, setCybercrimeCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [platform, setPlatform] = useState("Instagram");
  const [description, setDescription] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RegistryTakedownResult | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!isGuidedFlow || !domainFromQuery) return;
    const domain = domainFromQuery;

    let cancelled = false;

    async function loadGuidance() {
      setGuidanceLoading(true);
      setGuidanceError(null);
      setDomainTakedown(null);
      setDomainIntel(null);

      const [takedownRes, intelRes] = await Promise.allSettled([
        fetch(`/api/takedown/${encodeURIComponent(domain)}`),
        fetch(`/api/intelligence/${encodeURIComponent(domain)}`),
      ]);

      if (cancelled) return;

      let hasAny = false;

      if (takedownRes.status === "fulfilled" && takedownRes.value.ok) {
        setDomainTakedown((await takedownRes.value.json()) as DomainTakedownResult);
        hasAny = true;
      }

      if (intelRes.status === "fulfilled" && intelRes.value.ok) {
        setDomainIntel((await intelRes.value.json()) as DomainIntelligenceResult);
        hasAny = true;
      }

      if (!hasAny) {
        setGuidanceError("Could not load platform guidance for this domain. You can still use the manual notice below.");
      }

      setGuidanceLoading(false);
    }

    void loadGuidance();

    return () => {
      cancelled = true;
    };
  }, [domainFromQuery, isGuidedFlow]);

  useEffect(() => {
    if (!isGuidedFlow || !caseIdFromQuery || !domainFromQuery) return;
    const caseId = caseIdFromQuery;
    const domain = domainFromQuery;

    let cancelled = false;

    async function attachMatchedUrl() {
      try {
        const res = await fetch(`${API_URL}/api/analysis/${encodeURIComponent(caseId)}/discover`, {
          cache: "no-store",
        });
        if (!res.ok) return;

        const trace = (await res.json()) as DiscoveryTraceResult;
        const urls = trace.direct_matches
          .filter((m) => m.domain.toLowerCase() === domain.toLowerCase())
          .map((m) => m.page_url)
          .filter((v, i, arr) => Boolean(v) && arr.indexOf(v) === i);

        if (cancelled || urls.length === 0) return;
        setAutoDetectedUrls(urls);
        setContentUrl((prev) => (prev.trim() ? prev : urls[0]));
      } catch {
        // Non-blocking: guided flow still works without auto-detected URL.
      }
    }

    void attachMatchedUrl();

    return () => {
      cancelled = true;
    };
  }, [caseIdFromQuery, domainFromQuery, isGuidedFlow]);

  useEffect(() => {
    if (!caseIdFromQuery) return;
    const caseId = caseIdFromQuery;

    let cancelled = false;

    async function loadCaseSummary() {
      try {
        const res = await fetch(`${API_URL}/api/cases/${encodeURIComponent(caseId)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as CaseSummary;
        if (!cancelled) setCaseSummary(data);
      } catch {
        // Non-blocking for final takedown flow.
      }
    }

    void loadCaseSummary();

    return () => {
      cancelled = true;
    };
  }, [caseIdFromQuery]);

  function handleFile(f: File) {
    if (!f.type.startsWith("image/")) {
      setError("Please upload a JPG, PNG, or WEBP image.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File must be under 10 MB.");
      return;
    }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  }

  async function submitLegacy() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("image", file);
      form.append("platform", platform);
      if (description.trim()) form.append("description", description.trim());

      const res = await fetch(`${API_URL}/api/registry/takedown-notice`, { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? "Request failed");
      }
      setResult((await res.json()) as RegistryTakedownResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function copyLegacyNotice() {
    if (!result) return;
    navigator.clipboard.writeText(result.notice_text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const guidedNotice = useMemo(() => {
    if (!domainFromQuery) return "";
    return buildGuidedNotice({
      domain: domainFromQuery,
      caseId: caseIdFromQuery,
      network: domainIntel?.network,
      removalType: domainTakedown?.removal_type,
      contentUrl,
    });
  }, [caseIdFromQuery, contentUrl, domainFromQuery, domainIntel?.network, domainTakedown?.removal_type]);

  const cybercrimeComplaintText = useMemo(() => {
    if (!domainFromQuery) return "";

    const caseRef = caseIdFromQuery ? buildCaseRef(caseIdFromQuery) : "Not provided";
    const reportUrl = caseIdFromQuery ? `${origin || ""}/report/${caseIdFromQuery}` : "Not available";
    const createdAt = caseSummary?.created_at ? new Date(caseSummary.created_at * 1000).toLocaleString("en-GB") : "Not available";
    const issueType = caseSummary?.issue_type ?? "NCII / privacy violation";
    const platformSource = caseSummary?.platform_source ?? "Not provided";
    const reportType = caseSummary ? (caseSummary.anonymous ? "Anonymous" : "Named") : "Unknown";
    const narrative = caseSummary?.description?.trim() ? caseSummary.description.trim() : "No additional victim narrative provided in case intake.";
    const detectedUrls = autoDetectedUrls.length > 0
      ? autoDetectedUrls.map((u) => `- ${u}`).join("\n")
      : "- Not available";

    return [
      "Dear Cybercrime Authority,",
      "",
      "I am filing an urgent NCII cybercrime complaint with machine-generated evidence from Sniffer.",
      "",
      "Case Details:",
      `Case ID: ${caseIdFromQuery ?? "Not provided"}`,
      `Case Reference: ${caseRef}`,
      `Filed At: ${createdAt}`,
      `Report Type: ${reportType}`,
      `Issue Type: ${issueType}`,
      `Source Platform (intake): ${platformSource}`,
      "",
      "Victim Narrative:",
      narrative,
      "",
      "Technical Evidence Summary:",
      `Target Domain: ${domainFromQuery}`,
      `Hosting Network: ${domainIntel?.network ?? "Unknown"}`,
      `CDN Provider: ${domainIntel?.cdn_provider ?? "Unknown"}`,
      `Removal Method: ${domainTakedown?.removal_type?.replace(/_/g, " ") ?? "Manual submission"}`,
      `Platform Contact Email: ${domainTakedown?.contact_email ?? "Not listed"}`,
      `Platform Removal Page: ${domainTakedown?.removal_page ?? "Not listed"}`,
      "",
      "Detected Matched URLs:",
      detectedUrls,
      "",
      `Primary Content URL: ${contentUrl.trim() || autoDetectedUrls[0] || "Not provided"}`,
      "",
      "Current Platform Notice Draft:",
      guidedNotice,
      "",
      "Evidence PDF / Report Link:",
      reportUrl,
      "(Open this report and click 'Download Report' to save PDF, then attach it to this email before sending.)",
      "",
      "Requested Actions:",
      "1. Register this as an NCII cybercrime complaint.",
      "2. Issue immediate takedown/escalation instructions to the hosting ecosystem.",
      "3. Preserve forensic and platform-side logs for investigation.",
      "4. Share complaint acknowledgment and next procedural steps.",
      "",
      "Regards,",
      "[Your Name]",
    ].join("\n");
  }, [
    autoDetectedUrls,
    caseIdFromQuery,
    caseSummary,
    contentUrl,
    domainFromQuery,
    domainIntel?.cdn_provider,
    domainIntel?.network,
    domainTakedown?.contact_email,
    domainTakedown?.removal_page,
    domainTakedown?.removal_type,
    guidedNotice,
    origin,
  ]);

  const cybercrimeSubject = useMemo(() => {
    if (!domainFromQuery) return "Cybercrime NCII Report";
    const caseRef = caseIdFromQuery ? buildCaseRef(caseIdFromQuery) : "Not provided";
    return `Urgent NCII Cybercrime Complaint - ${caseRef} - ${domainFromQuery}`;
  }, [caseIdFromQuery, domainFromQuery]);

  const cybercrimeGmailHref = useMemo(() => {
    if (!domainFromQuery) return "";
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CYBERCRIME_EMAIL)}&su=${encodeURIComponent(cybercrimeSubject)}&body=${encodeURIComponent(cybercrimeComplaintText)}`;
  }, [cybercrimeComplaintText, cybercrimeSubject, domainFromQuery]);

  function copyCybercrimeComplaint() {
    if (!cybercrimeComplaintText) return;
    navigator.clipboard.writeText(cybercrimeComplaintText).then(() => {
      setCybercrimeCopied(true);
      setTimeout(() => setCybercrimeCopied(false), 2500);
    });
  }

  const cybercrimePrimaryUrl = contentUrl.trim() || autoDetectedUrls[0] || "Not provided";

  function copyGuidedNotice() {
    if (!guidedNotice) return;
    navigator.clipboard.writeText(guidedNotice).then(() => {
      setGuidedCopied(true);
      setTimeout(() => setGuidedCopied(false), 2500);
    });
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <header className="border-b border-[#e8e4de] px-6 py-4 flex items-center gap-3 bg-white sticky top-0 z-10">
        <Link href="/" className="font-mono text-[13px] text-[#0a0a0a] tracking-widest uppercase hover:opacity-70 transition-opacity">
          Sniffer
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <span className="text-[13px] text-[#9ca3af]">Step 3 · Takedown</span>
        <div className="ml-auto flex items-center gap-2">
          {caseIdFromQuery && domainFromQuery && (
            <Link
              href={`/investigate?caseId=${encodeURIComponent(caseIdFromQuery)}&domain=${encodeURIComponent(domainFromQuery)}`}
              className="text-[12px] text-[#6b7280] hover:text-[#0a0a0a] border border-[#e8e4de] px-3 py-1.5 rounded-lg transition-colors"
            >
              Back to Investigate
            </Link>
          )}
          <Link href="/start" className="text-[12px] font-medium bg-[#0a0a0a] text-white px-4 py-1.5 rounded-full hover:bg-[#1a1a1a] transition-colors">
            New Investigation
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
              <svg width="16" height="16" fill="none" stroke="#4f46e5" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-mono text-[10px] text-[#a8a29e] uppercase tracking-widest">Step 3 · Takedown</p>
          </div>
          <h1 className="text-[26px] font-bold text-[#0a0a0a] tracking-tight mb-3">
            Final Takedown Action
          </h1>
          <p className="text-[13.5px] text-[#6b7280] leading-relaxed max-w-prose">
            {isGuidedFlow
              ? "This final step uses the target domain from Investigate. Review the resolved contact route, copy your notice, and submit it."
              : "Standalone mode: upload an image and generate a general takedown notice from registry and platform signals."
            }
          </p>
          {(caseIdFromQuery || domainFromQuery) && (
            <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
              <p className="text-[11.5px] font-mono text-indigo-700 uppercase tracking-widest mb-1">Case context</p>
              <p className="text-[12.5px] text-indigo-900 leading-relaxed">
                {caseIdFromQuery ? `Case ID: ${caseIdFromQuery}` : "Direct takedown flow"}
                {domainFromQuery ? ` · Domain: ${domainFromQuery}` : ""}
              </p>
            </div>
          )}
        </div>

        {isGuidedFlow ? (
          <div className="space-y-5">
            {autoDetectedUrls.length > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-[11.5px] font-mono text-emerald-700 uppercase tracking-widest mb-1">Detected matched page</p>
                <a
                  href={autoDetectedUrls[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12.5px] text-emerald-800 hover:underline break-all"
                >
                  {autoDetectedUrls[0]}
                </a>
                {autoDetectedUrls.length > 1 && (
                  <p className="text-[11px] text-emerald-700 mt-1">
                    +{autoDetectedUrls.length - 1} more matched page URL(s) found for this domain.
                  </p>
                )}
              </div>
            )}

            <div>
              <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-2">Optional: specific content URL</p>
              <input
                type="text"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                placeholder="Paste specific page URL to strengthen notice (optional)"
                className="w-full rounded-xl border border-[#e8e4de] bg-white px-4 py-3 text-[12.5px] text-[#374151] placeholder:text-[#c4bdb5] focus:outline-none focus:border-[#0a0a0a] transition-colors"
              />
            </div>

            {guidanceLoading && (
              <div className="rounded-xl border border-[#e8e4de] bg-white p-5 animate-pulse space-y-3">
                <div className="h-3 w-36 bg-[#f0ede8] rounded" />
                <div className="h-3 w-56 bg-[#f0ede8] rounded" />
                <div className="h-3 w-44 bg-[#f0ede8] rounded" />
              </div>
            )}

            {guidanceError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800">
                {guidanceError}
              </div>
            )}

            <div className="rounded-xl border border-[#e8e4de] bg-white overflow-hidden">
              <div className="px-5 py-3 border-b border-[#f0ede8] bg-[#fafaf8] flex items-center justify-between gap-3">
                <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest">Resolved takedown route</p>
                {domainTakedown?.status && (
                  <span className="text-[10px] font-mono text-[#6b7280] uppercase tracking-widest">{domainTakedown.status.replace(/_/g, " ")}</span>
                )}
              </div>
              <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-widest mb-1">Domain</p>
                  <p className="text-[12.5px] text-[#0a0a0a] font-medium">{domainFromQuery}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-widest mb-1">Network</p>
                  <p className="text-[12.5px] text-[#0a0a0a] font-medium">{domainIntel?.network ?? "Unknown"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-widest mb-1">Removal Method</p>
                  <p className="text-[12.5px] text-[#0a0a0a] font-medium">{domainTakedown?.removal_type?.replace(/_/g, " ") ?? "Manual submission"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-widest mb-1">Contact Email</p>
                  <p className="text-[12.5px] text-[#0a0a0a] font-medium break-all">{domainTakedown?.contact_email ?? "Not listed"}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest">Final Notice (Domain-specific)</p>
                <button
                  onClick={copyGuidedNotice}
                  className="flex items-center gap-1.5 text-[11px] text-[#6b7280] hover:text-[#0a0a0a] border border-[#e8e4de] px-3 py-1 rounded-lg transition-colors"
                >
                  {guidedCopied ? "Copied!" : "Copy Notice"}
                </button>
              </div>
              <pre className="rounded-xl border border-[#e8e4de] bg-white px-5 py-4 text-[11.5px] text-[#374151] leading-relaxed whitespace-pre-wrap font-mono overflow-auto max-h-80">
                {guidedNotice}
              </pre>
            </div>

            <div className="flex flex-wrap gap-2">
              {domainTakedown?.removal_page && (
                <a
                  href={domainTakedown.removal_page}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a0a0a] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#1a1a1a] transition-colors"
                >
                  Open Removal Form
                </a>
              )}

              {domainTakedown?.contact_email && (
                <a
                  href={`mailto:${domainTakedown.contact_email}?subject=${encodeURIComponent(`Urgent takedown request - ${domainFromQuery}`)}&body=${encodeURIComponent(guidedNotice)}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-white px-4 py-2 text-[12px] font-medium text-[#374151] hover:border-[#0a0a0a] transition-colors"
                >
                  Open Email Draft
                </a>
              )}

              {cybercrimeGmailHref && (
                <a
                  href={cybercrimeGmailHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-[12px] font-medium text-red-700 hover:border-red-300 hover:bg-red-100 transition-colors"
                >
                  Report to Cybercrime Authority
                </a>
              )}

              <button
                type="button"
                onClick={copyCybercrimeComplaint}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-white px-4 py-2 text-[12px] font-medium text-[#374151] hover:border-[#0a0a0a] transition-colors"
              >
                {cybercrimeCopied ? "Copied Full Complaint" : "Copy Full Complaint"}
              </button>

              {!domainTakedown?.removal_page && !domainTakedown?.contact_email && domainFromQuery && (
                <>
                  <a
                    href={`https://${domainFromQuery}/dmca`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-white px-4 py-2 text-[12px] font-medium text-[#374151] hover:border-[#0a0a0a] transition-colors"
                  >
                    Try /dmca
                  </a>
                  <a
                    href={`https://${domainFromQuery}/contact`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4de] bg-white px-4 py-2 text-[12px] font-medium text-[#374151] hover:border-[#0a0a0a] transition-colors"
                  >
                    Try /contact
                  </a>
                </>
              )}
            </div>

            <p className="text-[11.5px] text-[#9ca3af] leading-relaxed">
              Click "Report to Cybercrime Authority", then use "Copy Full Complaint", and attach the report PDF from <span className="font-mono">{caseIdFromQuery ? `${origin}/report/${caseIdFromQuery}` : "your case report"}</span> before sending to {CYBERCRIME_EMAIL}. Primary URL: <span className="font-mono">{cybercrimePrimaryUrl}</span>
            </p>
          </div>
        ) : !result ? (
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-2">Image Found Online</p>
              {file && preview ? (
                <div className="flex gap-4 items-start rounded-xl border border-[#e8e4de] bg-white p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt={file.name} className="w-20 h-20 object-cover rounded-lg border border-[#e8e4de] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#0a0a0a] truncate">{file.name}</p>
                    <p className="text-[11.5px] text-[#9ca3af] mt-0.5">{(file.size / 1024).toFixed(0)} KB · {file.type.split("/")[1].toUpperCase()}</p>
                    <button onClick={clearFile} className="mt-2 text-[11px] text-red-500 hover:text-red-700 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  onClick={() => inputRef.current?.click()}
                  className={`rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                    dragging ? "border-indigo-400 bg-indigo-50" : "border-[#d4cfc9] bg-white hover:border-[#0a0a0a] hover:bg-[#fafaf8]"
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                  <div className="flex flex-col items-center py-10 text-center">
                    <div className="w-10 h-10 rounded-xl bg-[#f0efe9] border border-[#e8e4de] flex items-center justify-center mb-3">
                      <svg width="18" height="18" fill="none" stroke="#9ca3af" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" />
                        <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="text-[13px] font-medium text-[#374151] mb-1">Drop the infringing image here</p>
                    <p className="text-[11.5px] text-[#9ca3af]">JPG, PNG, WEBP · up to 10 MB · click to browse</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-2">Platform Where Found</p>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`px-3.5 py-1.5 rounded-full border text-[12px] font-medium transition-all ${
                      platform === p
                        ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                        : "bg-white text-[#374151] border-[#e8e4de] hover:border-[#0a0a0a]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-2">Additional Context</p>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Where did you find it? What harm does it cause? Any other relevant details..."
                className="w-full rounded-xl border border-[#e8e4de] bg-white px-4 py-3 text-[12.5px] text-[#374151] placeholder:text-[#c4bdb5] resize-none focus:outline-none focus:border-[#0a0a0a] transition-colors"
              />
            </div>

            {error && <p className="text-[12px] text-red-600 px-1">{error}</p>}

            <button
              onClick={submitLegacy}
              disabled={!file || loading}
              className="w-full flex items-center justify-center gap-2 bg-[#0a0a0a] text-white text-[13px] font-semibold py-3.5 rounded-full hover:bg-[#1a1a1a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Generating notice..." : "Generate Takedown Notice"}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className={`rounded-xl border overflow-hidden ${result.registry_match ? "border-emerald-200" : "border-[#e8e4de]"}`}>
              <div className={`px-5 py-3 flex items-center gap-3 ${result.registry_match ? "bg-emerald-50 border-b border-emerald-200" : "bg-[#fafaf8] border-b border-[#e8e4de]"}`}>
                <p className="text-[12px] font-semibold text-[#374151]">{result.registry_match ? "Registry Match Found" : "No Registry Match"}</p>
                <span className="ml-auto font-mono text-[10px] text-[#9ca3af] uppercase tracking-widest">{result.registry_match ? "Ownership Confirmed" : "General Report"}</span>
              </div>
              <div className="bg-white px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-widest mb-1">Image Hash</p>
                  <p className="font-mono text-[10.5px] text-[#374151] break-all">{result.file_hash.slice(0, 20)}...{result.file_hash.slice(-8)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-widest mb-1">Target Platform</p>
                  <p className="text-[12.5px] text-[#0a0a0a] font-medium">{result.platform}</p>
                </div>
                {result.registry_match && result.registered_at && (
                  <div>
                    <p className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-widest mb-1">Registered At</p>
                    <p className="text-[11px] text-[#374151]">{formatDate(result.registered_at)}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest">Takedown Notice</p>
                <button onClick={copyLegacyNotice} className="text-[11px] text-[#6b7280] hover:text-[#0a0a0a] border border-[#e8e4de] px-3 py-1 rounded-lg transition-colors">
                  {copied ? "Copied!" : "Copy notice"}
                </button>
              </div>
              <pre className="rounded-xl border border-[#e8e4de] bg-white px-5 py-4 text-[11.5px] text-[#374151] leading-relaxed whitespace-pre-wrap font-mono overflow-auto max-h-80">
                {result.notice_text}
              </pre>
            </div>

            <a
              href={result.report_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a0a0a] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#1a1a1a] transition-colors"
            >
              Submit to {result.platform}
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
