"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const TOTAL_STEPS = 4;

const PLATFORMS = [
  { value: "Instagram" },
  { value: "Telegram" },
  { value: "Twitter / X" },
  { value: "WhatsApp" },
  { value: "Facebook" },
  { value: "Other" },
];

const ISSUE_TYPES = [
  { value: "Deepfake / face swap", desc: "AI-generated or face-swapped image" },
  { value: "Edited image", desc: "Digitally altered or retouched content" },
  { value: "Harassment / blackmail", desc: "Image used to threaten or target someone" },
  { value: "Fake news", desc: "Visual misinformation or false context" },
  { value: "Other", desc: "Any other image manipulation concern" },
];

const STEP_LABELS = ["Privacy", "Platform", "Issue", "Details"];

export default function VerifyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [anonymous, setAnonymous] = useState<boolean | null>(null);
  const [platform, setPlatform] = useState("");
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");

  function canAdvance() {
    if (step === 1) return anonymous !== null;
    if (step === 2) return platform !== "";
    if (step === 3) return issueType !== "";
    return true;
  }

  function advance() {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
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
          anonymous,
          platform_source: platform,
          issue_type: issueType,
          description: description.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail || "Failed to create case");
      }
      const json = await res.json() as { case_id: string };
      router.push(`/verify/upload?caseId=${json.case_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal nav */}
      <header className="border-b border-[#f0ede8] px-6 py-4 flex items-center gap-3">
        <Link
          href="/"
          className="font-mono text-[13px] text-[#0a0a0a] tracking-widest uppercase hover:opacity-70 transition-opacity"
        >
          Sniffer
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <span className="text-[13px] text-[#9ca3af]">Start Verification</span>
      </header>

      <main className="max-w-xl mx-auto px-6 py-14">
        {/* Step indicator */}
        <div className="flex items-start gap-0 mb-12">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            return (
              <div key={n} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono border transition-all ${
                      done
                        ? "bg-[#0a0a0a] border-[#0a0a0a] text-white"
                        : active
                        ? "bg-white border-indigo-500 text-indigo-600 ring-2 ring-indigo-100"
                        : "bg-white border-[#e0dbd4] text-[#a8a29e]"
                    }`}
                  >
                    {done ? (
                      <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      n
                    )}
                  </div>
                  <span className={`text-[10px] font-mono ${active ? "text-indigo-600" : "text-[#a8a29e]"}`}>
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-2 mb-4 transition-colors ${
                      done ? "bg-[#0a0a0a]" : "bg-[#e0dbd4]"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1: Anonymous? */}
        {step === 1 && (
          <div>
            <p className="font-mono text-[11px] text-indigo-500 uppercase tracking-widest mb-3">
              Step 1 of 4
            </p>
            <h1
              className="text-3xl text-[#0a0a0a] leading-snug mb-2"
              style={{ fontFamily: "Georgia,'Times New Roman',serif", fontWeight: 400 }}
            >
              Do you want to report anonymously?
            </h1>
            <p className="text-[14px] text-[#6b7280] mb-8">
              Anonymous reports are fully accepted. No personal information required or stored.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: true, label: "Yes, anonymously", desc: "No personal data stored" },
                { value: false, label: "No, with my details", desc: "Enables case follow-up" },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setAnonymous(opt.value)}
                  className={`text-left p-5 border rounded-xl transition-all ${
                    anonymous === opt.value
                      ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-100"
                      : "border-[#e8e4de] bg-white hover:border-[#0a0a0a]"
                  }`}
                >
                  <p className="text-[14px] font-semibold text-[#0a0a0a] mb-1">{opt.label}</p>
                  <p className="text-[12px] text-[#9ca3af]">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Platform */}
        {step === 2 && (
          <div>
            <p className="font-mono text-[11px] text-indigo-500 uppercase tracking-widest mb-3">
              Step 2 of 4
            </p>
            <h1
              className="text-3xl text-[#0a0a0a] leading-snug mb-2"
              style={{ fontFamily: "Georgia,'Times New Roman',serif", fontWeight: 400 }}
            >
              Where did you find the manipulated content?
            </h1>
            <p className="text-[14px] text-[#6b7280] mb-8">
              This becomes part of the evidence report and determines takedown guidance.
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {PLATFORMS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPlatform(p.value)}
                  className={`py-4 px-3 border rounded-xl text-[13px] font-medium transition-all ${
                    platform === p.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
                      : "border-[#e8e4de] bg-white text-[#374151] hover:border-[#0a0a0a]"
                  }`}
                >
                  {p.value}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Issue type */}
        {step === 3 && (
          <div>
            <p className="font-mono text-[11px] text-indigo-500 uppercase tracking-widest mb-3">
              Step 3 of 4
            </p>
            <h1
              className="text-3xl text-[#0a0a0a] leading-snug mb-2"
              style={{ fontFamily: "Georgia,'Times New Roman',serif", fontWeight: 400 }}
            >
              What type of issue is this?
            </h1>
            <p className="text-[14px] text-[#6b7280] mb-8">
              Categorizes the forensic analysis and indexes the case correctly.
            </p>
            <div className="flex flex-col gap-2.5">
              {ISSUE_TYPES.map((it) => (
                <button
                  key={it.value}
                  type="button"
                  onClick={() => setIssueType(it.value)}
                  className={`text-left p-4 border rounded-xl transition-all flex items-center justify-between gap-4 ${
                    issueType === it.value
                      ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-100"
                      : "border-[#e8e4de] bg-white hover:border-[#0a0a0a]"
                  }`}
                >
                  <div>
                    <span className="block text-[14px] font-semibold text-[#0a0a0a]">{it.value}</span>
                    <span className="block text-[12px] text-[#9ca3af] mt-0.5">{it.desc}</span>
                  </div>
                  {issueType === it.value && (
                    <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
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

        {/* Step 4: Description */}
        {step === 4 && (
          <div>
            <p className="font-mono text-[11px] text-indigo-500 uppercase tracking-widest mb-3">
              Step 4 of 4
            </p>
            <h1
              className="text-3xl text-[#0a0a0a] leading-snug mb-2"
              style={{ fontFamily: "Georgia,'Times New Roman',serif", fontWeight: 400 }}
            >
              Describe what happened
            </h1>
            <p className="text-[14px] text-[#6b7280] mb-8">
              Optional — but your account helps build a stronger evidence report. Keep it factual.
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. A manipulated photo of me appeared on Instagram targeting my professional reputation..."
              maxLength={500}
              rows={5}
              className="w-full border border-[#e8e4de] rounded-xl px-4 py-3 text-[14px] text-[#0a0a0a] placeholder:text-[#c4bdb5] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-none"
            />
            <p className="text-[11px] text-[#a8a29e] text-right mt-1">{description.length}/500</p>

            {/* Case summary review */}
            <div className="mt-5 border border-[#e8e4de] rounded-xl divide-y divide-[#f0ede8]">
              {[
                { label: "Report type", value: anonymous ? "Anonymous" : "With details" },
                { label: "Platform", value: platform },
                { label: "Issue type", value: issueType },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center px-4 py-3">
                  <span className="text-[12px] text-[#9ca3af]">{row.label}</span>
                  <span className="text-[12px] font-medium text-[#0a0a0a]">{row.value}</span>
                </div>
              ))}
            </div>

            <p className="text-[11.5px] text-[#a8a29e] mt-3 leading-relaxed">
              By submitting this case you agree that the information provided is truthful to the best of your knowledge.
              This data is used solely for forensic analysis.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <button
            type="button"
            onClick={() => (step > 1 ? setStep((s) => s - 1) : router.push("/"))}
            className="text-[13px] text-[#6b7280] hover:text-[#0a0a0a] transition-colors"
          >
            ← {step > 1 ? "Back" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={advance}
            disabled={!canAdvance() || loading}
            className="px-6 py-2.5 bg-[#0a0a0a] text-white text-[13px] font-medium rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1a1a1a] transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating case...
              </>
            ) : step === TOTAL_STEPS ? (
              "Create Case & Upload →"
            ) : (
              "Continue →"
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
