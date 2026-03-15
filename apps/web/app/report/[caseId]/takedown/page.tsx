"use client";

import { useReportWorkflow } from "@/components/report/ReportWorkflowContext";
import { buildCaseRef, buildTimeline, TAKEDOWN_GUIDES } from "@/components/report/utils";
import { TakedownGuidance } from "@/components/report/TakedownGuidance";
import { EvidenceMetadata } from "@/components/report/EvidenceMetadata";
import { EvidenceTimeline } from "@/components/report/EvidenceTimeline";
import { AuditTrail } from "@/components/report/AuditTrail";

export default function TakedownStepPage() {
  const { caseId, caseData, analysis, hashCopied, copyHash } = useReportWorkflow();
  if (!caseData || !analysis) return null;

  const caseRef = buildCaseRef(caseId);
  const timeline = buildTimeline(analysis, caseRef);
  const takedownSteps = TAKEDOWN_GUIDES[caseData.platform_source];

  return (
    <>
      <div className="mb-4 rounded-xl border border-[#e8e4de] bg-white px-5 py-4">
        <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-2">Step 3 · Execute Takedown</p>
        <p className="text-[12.5px] text-[#374151] leading-relaxed">
          Use verified evidence and platform-specific procedures below to submit and escalate content removal.
        </p>
      </div>

      <TakedownGuidance
        platform={caseData.platform_source}
        steps={takedownSteps}
        caseId={caseId}
        fileHash={analysis.file_hash}
        caseRef={caseRef}
      />

      <EvidenceMetadata analysis={analysis} hashCopied={hashCopied} onCopy={copyHash} />
      <EvidenceTimeline entries={timeline} />
      {analysis.audit && <AuditTrail audit={analysis.audit} />}
    </>
  );
}
