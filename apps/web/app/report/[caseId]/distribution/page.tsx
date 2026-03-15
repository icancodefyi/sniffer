"use client";

import Link from "next/link";
import { useReportWorkflow } from "@/components/report/ReportWorkflowContext";
import { ContentTrace } from "@/components/report/ContentTrace";

export default function DistributionStepPage() {
  const { caseId, caseData } = useReportWorkflow();
  if (!caseData) return null;

  const mockedLeaks = [
    { domain: "mydesi.ltd", confidence: "96.4%", match: "Exact visual match" },
    { domain: "fsiblog.pro", confidence: "94.8%", match: "Exact visual match" },
    { domain: "mydesi.click", confidence: "91.2%", match: "Sister domain propagation" },
  ];

  return (
    <>
      <div className="mb-4 rounded-xl border border-[#e8e4de] bg-white px-5 py-4">
        <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-2">Step 2 · Distribution Trace</p>
        <p className="text-[12.5px] text-[#374151] mb-3 leading-relaxed">
          Mocked leak map for demo flow. Verified platform evidence appears in the live trace section below.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {mockedLeaks.map((item) => (
            <div key={item.domain} className="rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-3 py-2.5">
              <p className="text-[12px] font-semibold text-[#0a0a0a]">{item.domain}</p>
              <p className="text-[10.5px] text-[#6b7280] mt-0.5">{item.match}</p>
              <p className="text-[10px] font-mono text-[#9ca3af] mt-1">{item.confidence} confidence</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 animate-[fadeIn_.3s_ease]">
        <ContentTrace caseId={caseId} />
      </div>

      <div className="mb-8 rounded-xl border border-[#e8e4de] bg-white px-5 py-4 print:hidden">
        <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-2">Next Step</p>
        <p className="text-[12.5px] text-[#374151] mb-3 leading-relaxed">
          Prepare platform-specific takedown actions using the evidence and trace context.
        </p>
        <Link
          href={`/report/${caseId}/takedown`}
          className="inline-flex items-center gap-2 text-[12px] font-medium bg-[#0a0a0a] text-white px-4 py-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
        >
          Takedown content from these platforms
        </Link>
      </div>
    </>
  );
}
