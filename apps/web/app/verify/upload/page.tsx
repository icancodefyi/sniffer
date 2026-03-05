"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const ANALYSIS_STEPS = [
  "Creating case evidence",
  "Analyzing image metadata",
  "Scanning for manipulation signals",
  "Comparing image structures",
  "Generating forensic report",
];

type Phase = "suspicious" | "reference_question" | "reference_upload" | "analyzing";

function UploadContent() {
  const router = useRouter();
  const params = useSearchParams();
  const caseId = params.get("caseId");

  const [phase, setPhase] = useState<Phase>("suspicious");
  const [suspiciousFile, setSuspiciousFile] = useState<File | null>(null);
  const [suspiciousPreview, setSuspiciousPreview] = useState<string | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [refDragging, setRefDragging] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const suspiciousInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!caseId) router.replace("/verify");
  }, [caseId, router]);

  function handleSuspiciousFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10 MB.");
      return;
    }
    setError(null);
    setSuspiciousFile(file);
    setSuspiciousPreview(URL.createObjectURL(file));
  }

  function handleReferenceFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    setError(null);
    setReferenceFile(file);
    setReferencePreview(URL.createObjectURL(file));
  }

  async function storePreview(src: string, key: string) {
    try {
      const canvas = document.createElement("canvas");
      const img = new Image();
      img.src = src;
      await new Promise<void>((res) => {
        img.onload = () => res();
      });
      canvas.width = Math.min(img.width, 480);
      canvas.height = Math.round((canvas.width / img.width) * img.height);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      sessionStorage.setItem(key, canvas.toDataURL("image/jpeg", 0.75));
    } catch {
      // non-critical
    }
  }

  async function startAnalysis(withReference: boolean) {
    if (!suspiciousFile || !caseId) return;
    setPhase("analyzing");
    setAnalysisStep(0);
    setError(null);

    // Store image thumbnails for report page
    if (suspiciousPreview) await storePreview(suspiciousPreview, `sniffer_suspicious_${caseId}`);
    if (withReference && referencePreview) await storePreview(referencePreview, `sniffer_reference_${caseId}`);

    // Advance steps every 700ms
    const interval = setInterval(() => {
      setAnalysisStep((s) => {
        if (s >= ANALYSIS_STEPS.length - 1) {
          clearInterval(interval);
          return s;
        }
        return s + 1;
      });
    }, 700);

    const minDelay = new Promise<void>((res) => setTimeout(res, 3800));

    try {
      const formData = new FormData();
      formData.append("suspicious_image", suspiciousFile);
      if (withReference && referenceFile) {
        formData.append("reference_image", referenceFile);
      }

      const [res] = await Promise.all([
        fetch(`${API_URL}/api/analysis/${caseId}/run`, {
          method: "POST",
          body: formData,
        }),
        minDelay,
      ]);

      clearInterval(interval);
      setAnalysisStep(ANALYSIS_STEPS.length - 1);

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(err.detail || "Analysis failed");
      }

      await new Promise<void>((res) => setTimeout(res, 400));
      router.push(`/report/${caseId}`);
    } catch (e) {
      clearInterval(interval);
      setPhase("suspicious");
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    }
  }

  if (!caseId) return null;

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Nav */}
      <header className="border-b border-[#e8e4de] px-6 py-4 flex items-center gap-3 bg-white">
        <Link
          href="/"
          className="font-mono text-[13px] text-[#0a0a0a] tracking-widest uppercase hover:opacity-70 transition-opacity"
        >
          Sniffer
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <Link href="/verify" className="text-[13px] text-[#9ca3af] hover:text-[#0a0a0a] transition-colors">
          New Case
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <span className="font-mono text-[12px] text-[#9ca3af]">{caseId.slice(0, 8).toUpperCase()}</span>
      </header>

      {/* Analysis overlay */}
      {phase === "analyzing" && (
        <div className="fixed inset-0 bg-[#0a0a0a]/96 z-50 flex items-center justify-center">
          <div className="max-w-sm w-full px-8">
            <p className="font-mono text-[10.5px] text-[#4b5563] uppercase tracking-widest mb-10 text-center">
              Sniffer · Forensic Analysis Engine
            </p>

            {/* Steps list */}
            <div className="space-y-5 mb-10">
              {ANALYSIS_STEPS.map((label, i) => {
                const done = i < analysisStep;
                const active = i === analysisStep;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                        done
                          ? "bg-indigo-600"
                          : active
                          ? "border-2 border-indigo-500"
                          : "border border-[#374151]"
                      }`}
                    >
                      {done && (
                        <svg width="9" height="9" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {active && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                    </div>
                    <span
                      className={`text-[13px] transition-colors duration-300 ${
                        done ? "text-[#4b5563]" : active ? "text-white" : "text-[#2d3748]"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="h-px bg-[#1f2937] rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-700 ease-out"
                style={{ width: `${((analysisStep + 1) / ANALYSIS_STEPS.length) * 100}%` }}
              />
            </div>
            <p className="text-[10.5px] text-[#4b5563] mt-3 text-center font-mono">
              {Math.round(((analysisStep + 1) / ANALYSIS_STEPS.length) * 100)}% complete
            </p>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Phase 1: Upload suspicious image */}
        {phase === "suspicious" && (
          <div>
            <p className="font-mono text-[11px] text-indigo-500 uppercase tracking-widest mb-3">Upload</p>
            <h1
              className="text-3xl text-[#0a0a0a] leading-snug mb-2"
              style={{ fontFamily: "Georgia,'Times New Roman',serif", fontWeight: 400 }}
            >
              Upload the suspicious image
            </h1>
            <p className="text-sm text-[#6b7280] mb-8">
              Supports JPG, PNG, WEBP — up to 10 MB. This image will be submitted for forensic analysis.
            </p>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleSuspiciousFile(file);
              }}
              onClick={() => suspiciousInputRef.current?.click()}
              className={`relative w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                dragging
                  ? "border-indigo-400 bg-indigo-50"
                  : suspiciousFile
                  ? "border-[#e8e4de] bg-white cursor-default"
                  : "border-[#d4cfc9] bg-white hover:border-[#0a0a0a] hover:bg-[#fafaf8]"
              }`}
            >
              <input
                ref={suspiciousInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleSuspiciousFile(f);
                }}
              />
              {suspiciousFile && suspiciousPreview ? (
                <div className="p-6 flex gap-5 items-start" onClick={(e) => e.stopPropagation()}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={suspiciousPreview}
                    alt="Suspicious"
                    className="w-24 h-24 object-cover rounded-xl border border-[#e8e4de] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#0a0a0a] truncate">{suspiciousFile.name}</p>
                    <p className="text-[12px] text-[#9ca3af] mt-0.5">
                      {(suspiciousFile.size / 1024).toFixed(0)} KB ·{" "}
                      {suspiciousFile.type.split("/")[1].toUpperCase()}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSuspiciousFile(null);
                        setSuspiciousPreview(null);
                      }}
                      className="mt-3 text-[12px] text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <svg width="10" height="10" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
                  <div className="w-12 h-12 rounded-xl border border-[#e8e4de] flex items-center justify-center bg-[#fafaf8]">
                    <svg width="22" height="22" fill="none" stroke="#a8a29e" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path
                        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path d="M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#374151]">
                      {dragging ? "Drop to upload" : "Drag & drop your image here"}
                    </p>
                    <p className="text-[12px] text-[#9ca3af] mt-1">or click to browse files</p>
                  </div>
                  <p className="text-[11px] text-[#c4bdb5] font-mono">JPG · PNG · WEBP · MAX 10 MB</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-between items-center mt-8">
              <Link href="/verify" className="text-[13px] text-[#6b7280] hover:text-[#0a0a0a] transition-colors">
                ← Back to questions
              </Link>
              <button
                type="button"
                onClick={() => setPhase("reference_question")}
                disabled={!suspiciousFile}
                className="px-6 py-2.5 bg-[#0a0a0a] text-white text-[13px] font-medium rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1a1a1a] transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Reference question */}
        {phase === "reference_question" && (
          <div>
            <p className="font-mono text-[11px] text-indigo-500 uppercase tracking-widest mb-3">Reference Image</p>
            <h1
              className="text-3xl text-[#0a0a0a] leading-snug mb-2"
              style={{ fontFamily: "Georgia,'Times New Roman',serif", fontWeight: 400 }}
            >
              Do you have the original image?
            </h1>
            <p className="text-sm text-[#6b7280] mb-8">
              Providing the original enables deeper forensic comparison — pixel diff, structural similarity, and hash
              validation across both images.
            </p>

            <div className="flex flex-col gap-3">
              {/* Upload reference */}
              <button
                type="button"
                onClick={() => setPhase("reference_upload")}
                className="text-left p-5 border-2 border-[#0a0a0a] rounded-xl bg-white hover:bg-[#fafaf8] transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0a0a0a] flex items-center justify-center shrink-0">
                    <svg width="17" height="17" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#0a0a0a]">Upload Original Image</p>
                    <p className="text-[12px] text-[#6b7280] mt-1">
                      Reference-based forensic comparison — pixel-level diff and structural similarity analysis
                    </p>
                  </div>
                </div>
              </button>

              {/* Skip reference */}
              <button
                type="button"
                onClick={() => startAnalysis(false)}
                className="text-left p-5 border border-[#e8e4de] rounded-xl bg-white hover:border-[#a8a29e] transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#f5f3ef] flex items-center justify-center shrink-0">
                    <svg width="17" height="17" fill="none" stroke="#9ca3af" strokeWidth="1.5" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4l3 3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#374151]">Continue Without Reference</p>
                    <p className="text-[12px] text-[#9ca3af] mt-1">
                      Single-image analysis — metadata, pattern detection, and classifier-based scoring
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setPhase("suspicious")}
              className="mt-8 text-[13px] text-[#6b7280] hover:text-[#0a0a0a] transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Phase 3: Upload reference image */}
        {phase === "reference_upload" && (
          <div>
            <p className="font-mono text-[11px] text-indigo-500 uppercase tracking-widest mb-3">Original Image</p>
            <h1
              className="text-3xl text-[#0a0a0a] leading-snug mb-2"
              style={{ fontFamily: "Georgia,'Times New Roman',serif", fontWeight: 400 }}
            >
              Upload the original image
            </h1>
            <p className="text-sm text-[#6b7280] mb-6">
              Compared against the suspicious image pixel-by-pixel to detect manipulation regions.
            </p>

            {/* Side-by-side preview */}
            {suspiciousPreview && (
              <div className="mb-5 p-4 border border-[#e8e4de] rounded-xl bg-white flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={suspiciousPreview}
                  alt="Suspicious"
                  className="w-14 h-14 object-cover rounded-lg border border-[#e8e4de] shrink-0"
                />
                <div className="flex-1 text-center">
                  <span className="block text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest">
                    vs
                  </span>
                </div>
                <div
                  className={`w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border-2 border-dashed ${
                    referenceFile ? "border-[#e8e4de]" : "border-[#d4cfc9]"
                  }`}
                >
                  {referencePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={referencePreview} alt="Reference" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] text-[#c4bdb5] font-mono text-center leading-tight px-1">
                      ADD
                      <br />
                      ORIG
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Reference dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setRefDragging(true);
              }}
              onDragLeave={() => setRefDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setRefDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleReferenceFile(file);
              }}
              onClick={() => referenceInputRef.current?.click()}
              className={`relative w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                refDragging
                  ? "border-indigo-400 bg-indigo-50"
                  : referenceFile
                  ? "border-[#e8e4de] bg-white cursor-default"
                  : "border-[#d4cfc9] bg-white hover:border-[#0a0a0a] hover:bg-[#fafaf8]"
              }`}
            >
              <input
                ref={referenceInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleReferenceFile(f);
                }}
              />
              {referenceFile && referencePreview ? (
                <div className="p-5 flex gap-4 items-start" onClick={(e) => e.stopPropagation()}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={referencePreview}
                    alt="Reference"
                    className="w-20 h-20 object-cover rounded-xl border border-[#e8e4de] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#0a0a0a] truncate">{referenceFile.name}</p>
                    <p className="text-[12px] text-[#9ca3af] mt-0.5">
                      {(referenceFile.size / 1024).toFixed(0)} KB
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setReferenceFile(null);
                        setReferencePreview(null);
                      }}
                      className="mt-2 text-[12px] text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <svg width="10" height="10" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-12 px-6 text-center">
                  <svg width="22" height="22" fill="none" stroke="#a8a29e" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path
                      d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-[13px] font-medium text-[#374151]">
                    {refDragging ? "Drop to upload" : "Upload original image"}
                  </p>
                  <p className="text-[11px] text-[#c4bdb5] font-mono">JPG · PNG · WEBP</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-between items-center mt-8">
              <button
                type="button"
                onClick={() => setPhase("reference_question")}
                className="text-[13px] text-[#6b7280] hover:text-[#0a0a0a] transition-colors"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => startAnalysis(true)}
                disabled={!referenceFile}
                className="px-6 py-2.5 bg-[#0a0a0a] text-white text-[13px] font-medium rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1a1a1a] transition-colors"
              >
                Run Forensic Analysis →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense>
      <UploadContent />
    </Suspense>
  );
}
