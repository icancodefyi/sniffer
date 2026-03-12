"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StepIndicator } from "@/components/verify/StepIndicator";
import { StepPlatform } from "@/components/verify/StepPlatform";
import { StepIssueType } from "@/components/verify/StepIssueType";
import { StepDescription } from "@/components/verify/StepDescription";
import { TOTAL_STEPS } from "@/components/verify/constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function VerifyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [anonymous] = useState<boolean>(true);
  const [platform, setPlatform] = useState("");
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");

  function canAdvance() {
    if (step === 1) return platform !== "";
    if (step === 2) return issueType !== "";
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
        <span className="text-[13px] text-[#9ca3af]">Analyze an Image</span>
      </header>

      <main className="max-w-xl mx-auto px-6 py-14">
        <StepIndicator step={step} />
        {step === 1 && <StepPlatform value={platform} onChange={setPlatform} />}
        {step === 2 && <StepIssueType value={issueType} onChange={setIssueType} />}
        {step === 3 && (
          <StepDescription
            value={description}
            onChange={setDescription}
            anonymous={anonymous}
            platform={platform}
            issueType={issueType}
          />
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
