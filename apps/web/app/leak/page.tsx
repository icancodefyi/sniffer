"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const SOURCES = [
  { value: "Adult video site", desc: "e.g. PornHub, xVideos, RedTube" },
  { value: "Telegram", desc: "Private channel or group share" },
  { value: "Instagram", desc: "Story, post, or reel" },
  { value: "Twitter / X", desc: "Post or direct message" },
  { value: "Other website", desc: "Any other platform or domain" },
];

export default function LeakPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");

  function advance() {
    if (step === 1) {
      setStep(2);
    } else {
      submit();
    }
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/cases/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymous: true,
          platform_source: source,
          issue_type: "Non-consensual image sharing",
          description: description.trim() || undefined,
          pipeline_type: "ncii",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || "Failed to create case");
      }
      const json = await res.json() as { case_id: string };
      router.push(`/leak/upload?caseId=${json.case_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-[#f0ede8] px-6 py-4 flex items-center gap-3">
        <Link
          href="/"
          className="font-mono text-[13px] text-[#0a0a0a] tracking-widest uppercase hover:opacity-70 transition-opacity"
        >
          Sniffer
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <Link href="/start" className="text-[13px] text-[#9ca3af] hover:text-[#0a0a0a] transition-colors">
          Start Investigation
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <span className="text-[13px] text-[#9ca3af]">Leak Discovery</span>
      </header>

      <main className="max-w-xl mx-auto px-6 py-14">

        {/* Step indicators */}
        <div className="flex items-center gap-1.5 mb-10">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] border transition-colors
                  ${s <= step ? "bg-rose-500 border-rose-500 text-white" : "border-[#e8e4de] text-[#9ca3af]"}`}
              >
                {s < step ? (
                  <svg width="9" height="9" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : s}
              </div>
              {s < 2 && <div className={`w-8 h-px ${s < step ? "bg-rose-300" : "bg-[#e8e4de]"}`} />}
            </div>
          ))}
          <span className="ml-2 text-[11px] text-[#9ca3af] font-mono">
            {step === 1 ? "Where was it found?" : "Describe the situation"}
          </span>
        </div>

        {/* Step 1: Source */}
        {step === 1 && (
          <div>
            <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-100">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span className="font-mono text-[10px] text-rose-600 uppercase tracking-widest">Pipeline 2 · NCII Leak Investigation</span>
            </div>
            <h1
              className="text-3xl text-[#0a0a0a] leading-snug mb-2 mt-3"
              style={{ fontFamily: "Georgia,'Times New Roman',serif", fontWeight: 400 }}
            >
              Where did you find the content?
            </h1>
            <p className="text-[14px] text-[#6b7280] mb-8">
              We&apos;ll scan that platform&apos;s network and sister domains for the image.
            </p>
            <div className="flex flex-col gap-2.5">
              {SOURCES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSource(s.value)}
                  className={`text-left p-4 border rounded-xl transition-all flex items-center justify-between gap-4 ${
                    source === s.value
                      ? "border-rose-400 bg-rose-50 ring-1 ring-rose-100"
                      : "border-[#e8e4de] bg-white hover:border-[#0a0a0a]"
                  }`}
                >
                  <div>
                    <span className="block text-[14px] font-semibold text-[#0a0a0a]">{s.value}</span>
                    <span className="block text-[12px] text-[#9ca3af] mt-0.5">{s.desc}</span>
                  </div>
                  {source === s.value && (
                    <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center shrink-0">
                      <svg width="9" height="9" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Description */}
        {step === 2 && (
          <div>
            <h1
              className="text-3xl text-[#0a0a0a] leading-snug mb-2"
              style={{ fontFamily: "Georgia,'Times New Roman',serif", fontWeight: 400 }}
            >
              Any additional context?
            </h1>
            <p className="text-[14px] text-[#6b7280] mb-8">
              Optional — any notes about when it appeared, URL fragment, or other details.
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="e.g. Found on multiple sites, first noticed last week on a Telegram group..."
              className="w-full rounded-xl border border-[#e8e4de] bg-[#fafaf8] px-4 py-3 text-[13.5px] text-[#0a0a0a] placeholder:text-[#c4bdb5] focus:outline-none focus:border-[#0a0a0a] transition-colors resize-none"
            />
            <p className="text-[11px] text-[#b0a89e] mt-2">This description is kept private and only used to contextualize the case.</p>
          </div>
        )}

        {error && (
          <div className="mt-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <button
            type="button"
            onClick={() => (step > 1 ? setStep((s) => s - 1) : router.push("/start"))}
            className="text-[13px] text-[#6b7280] hover:text-[#0a0a0a] transition-colors"
          >
            ← {step > 1 ? "Back" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={advance}
            disabled={(step === 1 && source === "") || loading}
            className="px-6 py-2.5 bg-rose-500 text-white text-[13px] font-medium rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-600 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating case...
              </>
            ) : step === 2 ? (
              "Continue to Upload →"
            ) : (
              "Continue →"
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
