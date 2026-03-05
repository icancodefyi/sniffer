"use client";

import { useState } from "react";
import type { AuditTrail as AuditTrailType } from "./types";

interface Props {
  audit: AuditTrailType;
}

export function AuditTrail({ audit }: Props) {
  const [hashCopied, setHashCopied] = useState(false);

  function copyReportHash() {
    navigator.clipboard.writeText(audit.report_hash).then(() => {
      setHashCopied(true);
      setTimeout(() => setHashCopied(false), 2000);
    });
  }

  const timestamp = new Date(audit.analysis_timestamp * 1000).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
  });

  return (
    <div className="mt-8 rounded-xl border border-[#e8e4de] bg-[#fafaf8] px-5 py-4">
      <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">
        Chain of Custody · Audit Trail
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest">Pipeline</p>
          <p className="text-[12px] font-mono text-[#374151] mt-0.5">v{audit.pipeline_version}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest">Algorithms</p>
          <p className="text-[12px] font-mono text-[#374151] mt-0.5">{audit.algorithms_run.length} run</p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest">Analysed At</p>
          <p className="text-[12px] font-mono text-[#374151] mt-0.5">{timestamp}</p>
        </div>
      </div>

      {/* Report hash */}
      <div className="rounded-lg border border-[#e8e4de] bg-white px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-1">Report Hash (SHA-256)</p>
          <p className="font-mono text-[11px] text-[#374151] truncate">{audit.report_hash}</p>
        </div>
        <button
          onClick={copyReportHash}
          className="shrink-0 text-[11px] font-mono border border-[#e8e4de] px-2.5 py-1 rounded-lg text-[#6b7280] hover:text-[#0a0a0a] hover:border-[#0a0a0a] transition-colors print:hidden"
        >
          {hashCopied ? "Copied!" : "Copy"}
        </button>
      </div>

      <p className="text-[10px] text-[#a8a29e] mt-2 font-mono">
        This report hash can be used to verify that the document has not been altered since generation.
      </p>

      {/* Algorithms list */}
      <details className="mt-3 print:hidden">
        <summary className="text-[10px] font-mono text-[#a8a29e] cursor-pointer hover:text-[#6b7280] transition-colors uppercase tracking-widest">
          View algorithms run ↓
        </summary>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {audit.algorithms_run.map((alg) => (
            <span
              key={alg}
              className="text-[10px] font-mono bg-[#f5f5f4] border border-[#e8e4de] px-2 py-0.5 rounded text-[#6b7280]"
            >
              {alg.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      </details>
    </div>
  );
}
