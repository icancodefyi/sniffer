"use client";

import Link from "next/link";
import { useReportWorkflow } from "@/components/report/ReportWorkflowContext";
import {
  buildActionPriority,
  buildCaseRef,
  buildFinalRiskScore,
  buildModelFirstSummary,
  buildSignalRows,
} from "@/components/report/utils";
import { ScoreGauge } from "@/components/report/ScoreGauge";
import { ImageEvidence } from "@/components/report/ImageEvidence";
import { NeuralModelVerdict } from "@/components/report/NeuralModelVerdict";
import { ForensicSignals } from "@/components/report/ForensicSignals";
import { TamperHeatmap } from "@/components/report/TamperHeatmap";
import { C2PAProvenance } from "@/components/report/C2PAProvenance";

export default function AnalysisStepPage() {
  const { caseId, caseData, analysis, suspiciousImg, referenceImg } = useReportWorkflow();
  if (!caseData) return null;

  if (!analysis) {
    return (
      <div className="mb-8 rounded-xl border border-[#e8e4de] bg-white px-5 py-4">
        <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-2">Step 1 · Analyze Evidence</p>
        <p className="text-[13px] font-semibold text-[#0a0a0a] mb-1">Analysis is not available for this case yet</p>
        <p className="text-[12.5px] text-[#6b7280] leading-relaxed mb-3">
          The case record exists and can be tracked, but no forensic output has been generated for this case ID.
        </p>
        <Link
          href={`/report/${caseId}/distribution`}
          className="inline-flex items-center gap-2 text-[12px] font-medium bg-[#0a0a0a] text-white px-4 py-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
        >
          Continue to distribution trace
        </Link>
      </div>
    );
  }

  const score = buildFinalRiskScore(analysis);
  const summaryText = buildModelFirstSummary(analysis);
  const priority = buildActionPriority(score);
  const signalRows = buildSignalRows(analysis);
  const showEla = Boolean(analysis.reference_based);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 mb-6 items-start">
        <div>
          <ScoreGauge score={score} />
        </div>
        <div className="min-w-0">
          <ImageEvidence
            suspiciousImg={suspiciousImg}
            referenceImg={referenceImg}
            tamperHeatmap={showEla ? analysis.tamper_heatmap : undefined}
            compact
          />
        </div>
      </div>

      <div
        className={`mb-6 rounded-xl border px-4 py-3 flex items-start gap-3 ${
          priority.tone === "critical"
            ? "border-red-200 bg-red-50"
            : priority.tone === "high"
            ? "border-orange-200 bg-orange-50"
            : priority.tone === "review"
            ? "border-amber-200 bg-amber-50"
            : priority.tone === "observe"
            ? "border-yellow-200 bg-yellow-50"
            : "border-emerald-200 bg-emerald-50"
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
            priority.tone === "critical"
              ? "bg-red-500"
              : priority.tone === "high"
              ? "bg-orange-500"
              : priority.tone === "review"
              ? "bg-amber-500"
              : priority.tone === "observe"
              ? "bg-yellow-500"
              : "bg-emerald-500"
          }`}
        />
        <div>
          <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-1">Action Priority</p>
          <p className="text-[13.5px] font-semibold text-[#0a0a0a]">{priority.title}</p>
          <p className="text-[12px] text-[#374151] mt-1">{priority.note}</p>
        </div>
      </div>

      <NeuralModelVerdict ai={analysis.ai_detection} />

      <div className="mb-8 rounded-xl border border-[#e8e4de] bg-white px-5 py-4">
        <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">Analysis Summary</p>
        <p className="text-[12.5px] text-[#374151] leading-[1.75]">{summaryText}</p>
      </div>

      <ForensicSignals rows={signalRows} />

      {showEla && (
        <TamperHeatmap
          elaHeatmap={analysis.ela_heatmap}
          tamperRegions={analysis.tamper_regions}
        />
      )}

      <C2PAProvenance c2pa={analysis.c2pa_result} />

      <div className="mb-8 rounded-xl border border-[#e8e4de] bg-white px-5 py-4 print:hidden">
        <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-2">Next Step</p>
        <p className="text-[12.5px] text-[#374151] mb-3 leading-relaxed">
          Continue to distribution tracing to identify where this content is being mirrored and circulated.
        </p>
        <Link
          href={`/report/${caseId}/distribution`}
          className="inline-flex items-center gap-2 text-[12px] font-medium bg-[#0a0a0a] text-white px-4 py-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
        >
          See where content has been distributed
        </Link>
      </div>
    </>
  );
}
