import type { CaseData } from "./types";
import { formatDate } from "./utils";

interface Props {
  caseRef: string;
  verdict: string;
  verdictColor: string;
  caseData: CaseData;
  forensicCertainty?: string;
  tamperRegionCount?: number;
}

export function CaseHeader({ caseRef, verdict, verdictColor, caseData, forensicCertainty, tamperRegionCount }: Props) {
  const regionLabel =
    tamperRegionCount != null && tamperRegionCount > 0
      ? ` — ${tamperRegionCount} region${tamperRegionCount > 1 ? "s" : ""} identified`
      : "";

  return (
    <div className="border-b border-[#e8e4de] pb-7 mb-8 print:border-[#0a0a0a]">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="font-mono text-[10px] text-[#a8a29e] uppercase tracking-widest mb-1">Case Reference</p>
          <p className="font-mono text-[22px] text-[#0a0a0a] tracking-tight">{caseRef}</p>
        </div>
        <div className="text-right">
          <span
            className={`px-3 py-1.5 rounded-full border text-[11.5px] font-bold tracking-widest font-mono ${verdictColor}`}
          >
            {verdict}
          </span>
          {forensicCertainty && (
            <p className="text-[11px] text-[#6b7280] mt-1.5 font-mono">
              {forensicCertainty}
              {regionLabel}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-7 gap-y-3">
        {[
          { label: "Date", value: formatDate(caseData.created_at) },
          { label: "Platform", value: caseData.platform_source },
          { label: "Issue Type", value: caseData.issue_type },
          { label: "Report Type", value: caseData.anonymous ? "Anonymous" : "Named" },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest">{item.label}</p>
            <p className="text-[13px] text-[#374151] font-medium mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>

      {caseData.description && (
        <p className="mt-4 text-[13px] text-[#6b7280] border-l-2 border-[#e8e4de] pl-4 italic leading-relaxed">
          &ldquo;{caseData.description}&rdquo;
        </p>
      )}
    </div>
  );
}
