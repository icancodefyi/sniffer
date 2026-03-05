"use client";

import { useState, useRef } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const PLATFORMS = ["Instagram", "Facebook", "X / Twitter", "WhatsApp", "Telegram", "Other"];

interface TakedownResult {
  file_hash: string;
  registry_match: boolean;
  reference_id: string | null;
  registered_at: number | null;
  platform: string;
  report_url: string;
  notice_text: string;
  generated_at: number;
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function TakedownPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [platform, setPlatform] = useState("Instagram");
  const [description, setDescription] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TakedownResult | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (!f.type.startsWith("image/")) { setError("Please upload a JPG, PNG, or WEBP image."); return; }
    if (f.size > 10 * 1024 * 1024) { setError("File must be under 10 MB."); return; }
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

  async function submit() {
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
      setResult(await res.json() as TakedownResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function copyNotice() {
    if (!result) return;
    navigator.clipboard.writeText(result.notice_text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Nav */}
      <header className="border-b border-[#e8e4de] px-6 py-4 flex items-center gap-3 bg-white sticky top-0 z-10">
        <Link href="/" className="font-mono text-[13px] text-[#0a0a0a] tracking-widest uppercase hover:opacity-70 transition-opacity">
          Sniffer
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <span className="text-[13px] text-[#9ca3af]">Takedown Request</span>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/protect" className="text-[12px] text-[#6b7280] hover:text-[#0a0a0a] border border-[#e8e4de] px-3 py-1.5 rounded-lg transition-colors">
            Protect Images
          </Link>
          <Link href="/verify" className="text-[12px] font-medium bg-[#0a0a0a] text-white px-4 py-1.5 rounded-full hover:bg-[#1a1a1a] transition-colors">
            Verify an Image
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
              <svg width="16" height="16" fill="none" stroke="#4f46e5" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-mono text-[10px] text-[#a8a29e] uppercase tracking-widest">Takedown Generator</p>
          </div>
          <h1 className="text-[26px] font-bold text-[#0a0a0a] tracking-tight mb-3">
            Issue a Takedown Notice
          </h1>
          <p className="text-[13.5px] text-[#6b7280] leading-relaxed max-w-prose">
            Upload the image you found being misused online. We will compute its cryptographic hash,
            check it against the Sniffer Protection Registry, and generate a ready-to-send formal
            takedown notice for the relevant platform.
          </p>
        </div>

        {!result ? (
          /* ── Upload & configure form ── */
          <div className="space-y-5">

            {/* Image upload */}
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
                  <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
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

            {/* Platform picker */}
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

            {/* Context */}
            <div>
              <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-2">
                Additional Context <span className="normal-case text-[#c4bdb5]">(optional)</span>
              </p>
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
              onClick={submit}
              disabled={!file || loading}
              className="w-full flex items-center justify-center gap-2 bg-[#0a0a0a] text-white text-[13px] font-semibold py-3.5 rounded-full hover:bg-[#1a1a1a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating notice…
                </>
              ) : (
                <>
                  Generate Takedown Notice
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>

        ) : (
          /* ── Result ── */
          <div className="space-y-5">

            {/* Match status banner */}
            <div className={`rounded-xl border overflow-hidden ${result.registry_match ? "border-emerald-200" : "border-[#e8e4de]"}`}>
              <div className={`px-5 py-3 flex items-center gap-3 ${result.registry_match ? "bg-emerald-50 border-b border-emerald-200" : "bg-[#fafaf8] border-b border-[#e8e4de]"}`}>
                {result.registry_match ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <p className="text-[12px] font-semibold text-emerald-800">Registry Match Found</p>
                    <span className="ml-auto font-mono text-[10px] text-emerald-600 uppercase tracking-widest">Ownership Confirmed</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#d4cfc9] shrink-0" />
                    <p className="text-[12px] font-semibold text-[#374151]">No Registry Match</p>
                    <span className="ml-auto font-mono text-[10px] text-[#9ca3af] uppercase tracking-widest">General Report</span>
                  </>
                )}
              </div>
              <div className="bg-white px-5 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-widest mb-1">Image Hash</p>
                    <p className="font-mono text-[10.5px] text-[#374151] break-all">{result.file_hash.slice(0, 20)}…{result.file_hash.slice(-8)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-widest mb-1">Target Platform</p>
                    <p className="text-[12.5px] text-[#0a0a0a] font-medium">{result.platform}</p>
                  </div>
                  {result.registry_match && result.reference_id && (
                    <div>
                      <p className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-widest mb-1">Protection Ref</p>
                      <p className="font-mono text-[10.5px] text-emerald-700">{result.reference_id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  )}
                  {result.registry_match && result.registered_at && (
                    <div>
                      <p className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-widest mb-1">Registered At</p>
                      <p className="text-[11px] text-[#374151]">{formatDate(result.registered_at)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notice text */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest">Takedown Notice</p>
                <button
                  onClick={copyNotice}
                  className="flex items-center gap-1.5 text-[11px] text-[#6b7280] hover:text-[#0a0a0a] border border-[#e8e4de] px-3 py-1 rounded-lg transition-colors"
                >
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  {copied ? "Copied!" : "Copy notice"}
                </button>
              </div>
              <pre className="rounded-xl border border-[#e8e4de] bg-white px-5 py-4 text-[11.5px] text-[#374151] leading-relaxed whitespace-pre-wrap font-mono overflow-auto max-h-80">
                {result.notice_text}
              </pre>
            </div>

            {/* Submit link */}
            <a
              href={result.report_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4 hover:bg-indigo-100 transition-colors group"
            >
              <div>
                <p className="text-[12.5px] font-semibold text-indigo-900">Submit to {result.platform}</p>
                <p className="text-[11px] text-indigo-600 mt-0.5">Open {result.platform}'s official report / DMCA form</p>
              </div>
              <svg width="14" height="14" fill="none" stroke="#4f46e5" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 group-hover:translate-x-0.5 transition-transform">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>

            {/* Also run forensic analysis CTA */}
            <div className="rounded-xl border border-[#e8e4de] bg-white px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[12.5px] font-semibold text-[#0a0a0a]">Run Full Forensic Analysis</p>
                <p className="text-[11px] text-[#9ca3af] mt-0.5">Generate a detailed evidence report to attach to your takedown filing</p>
              </div>
              <Link
                href="/verify"
                className="shrink-0 ml-4 inline-flex items-center gap-1.5 text-[12px] font-medium bg-[#0a0a0a] text-white px-4 py-2 rounded-full hover:bg-[#1a1a1a] transition-colors"
              >
                Verify Image
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <button
              onClick={() => { setResult(null); clearFile(); setDescription(""); }}
              className="w-full text-[12px] text-[#9ca3af] hover:text-[#374151] transition-colors py-2"
            >
              ← Start a new request
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
