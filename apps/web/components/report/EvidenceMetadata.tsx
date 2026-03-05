import type { AnalysisResult } from "./types";
import { HashDisplay } from "./HashDisplay";
import { formatDateTime } from "./utils";

interface Props {
  analysis: AnalysisResult;
  hashCopied: boolean;
  onCopy: () => void;
}

export function EvidenceMetadata({ analysis, hashCopied, onCopy }: Props) {
  return (
    <section className="mb-8">
      <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">Evidence Metadata</p>
      <div className="border border-[#e8e4de] rounded-xl overflow-hidden">
        <HashDisplay hash={analysis.file_hash} onCopy={onCopy} copied={hashCopied} />
        <div className="grid grid-cols-3 divide-x divide-[#f0ede8] border-t border-[#e8e4de]">
          {[
            { label: "File Size", value: `${(analysis.file_size / 1024).toFixed(1)} KB` },
            { label: "Format", value: analysis.mime_type.split("/")[1].toUpperCase() },
            { label: "Analyzed", value: formatDateTime(analysis.timestamp) },
          ].map((item) => (
            <div key={item.label} className="px-4 py-3">
              <p className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-widest mb-1">{item.label}</p>
              <p className="text-[12.5px] text-[#0a0a0a] font-medium">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

