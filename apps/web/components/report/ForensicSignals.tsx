"use client";

import { useMemo, useState } from "react";
import type { SignalRow } from "./utils";

interface Props {
  rows: SignalRow[];
}

interface SignalInfo {
  title: string;
  plainMeaning: string;
  whyItMatters: string;
}

function normalizeSignalLabel(label: string): string {
  return label.toLowerCase().replace(/\s+/g, " ").trim();
}

function getSignalInfo(label: string): SignalInfo {
  const key = normalizeSignalLabel(label);

  if (key.includes("structural similarity") || key.includes("ssim")) {
    return {
      title: "Structural Similarity (SSIM)",
      plainMeaning: "Checks how visually similar this image is to a trusted reference image. If there is no reference, this metric cannot be computed.",
      whyItMatters: "When available, large visual differences can indicate edits, swaps, or heavy manipulation.",
    };
  }

  if (key.includes("perceptual hash") || key.includes("phash") || key.includes("dhash") || key.includes("ahash")) {
    return {
      title: "Perceptual Hash Consensus",
      plainMeaning: "Uses three image fingerprints to compare overall visual structure with a reference. If no reference exists, result is unavailable.",
      whyItMatters: "A mismatch across multiple hashes is a strong sign the suspicious image is not the same visual content as the reference.",
    };
  }

  if (key.includes("color histogram") || key.includes("kl-divergence")) {
    return {
      title: "Color Histogram KL-Divergence",
      plainMeaning: "Compares color distribution patterns between suspicious and reference images. No reference means this metric is unavailable.",
      whyItMatters: "Large color-distribution shifts can suggest color grading, compositing, or generated content artifacts.",
    };
  }

  if (key.includes("error level analysis") || key.includes("ela")) {
    return {
      title: "Error Level Analysis (ELA)",
      plainMeaning: "Highlights compression inconsistencies in JPEG images. Uneven residuals can mean some regions were edited differently.",
      whyItMatters: "Edited regions often compress differently than untouched regions, making ELA useful for spotting tampered areas.",
    };
  }

  if (key.includes("dct") || key.includes("double-compression")) {
    return {
      title: "DCT Double-Compression Artefacts",
      plainMeaning: "Looks for signs that an image was saved as JPEG more than once.",
      whyItMatters: "Double compression commonly appears after editing and re-saving, so it can support manipulation findings.",
    };
  }

  if (key.includes("noise") || key.includes("prnu")) {
    return {
      title: "Noise Consistency Analysis",
      plainMeaning: "Checks whether sensor/noise characteristics look natural and consistent.",
      whyItMatters: "Generated or spliced images can have unnatural noise patterns compared with camera-captured photos.",
    };
  }

  if (key.includes("orb") || key.includes("keypoint")) {
    return {
      title: "ORB Feature Keypoint Match Rate",
      plainMeaning: "Compares local visual feature points against a reference image. Without a reference, this cannot be computed.",
      whyItMatters: "Low keypoint agreement can indicate structural differences caused by edits or content replacement.",
    };
  }

  if (key.includes("c2pa") || key.includes("provenance")) {
    return {
      title: "C2PA Provenance Verification",
      plainMeaning: "Checks for signed Content Credentials metadata that records origin and edit history.",
      whyItMatters: "A valid C2PA signature provides strong provenance evidence. Not present does not prove fake, but reduces traceability.",
    };
  }

  return {
    title: label,
    plainMeaning: "This metric is one signal in the forensic pipeline and should be interpreted with the other signals together.",
    whyItMatters: "No single metric is final proof by itself; the report uses weighted fusion for the final risk score.",
  };
}

export function ForensicSignals({ rows }: Props) {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  const activeInfo = useMemo(() => {
    if (!activeLabel) return null;
    return getSignalInfo(activeLabel);
  }, [activeLabel]);

  return (
    <section className="mb-8">
      <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">Forensic Signals</p>
      <div className="border border-[#e8e4de] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e8e4de] bg-[#fafaf8]">
              <th className="text-left px-4 py-2.5 text-[10px] font-mono text-[#9ca3af] uppercase tracking-wider">
                Signal
              </th>
              <th className="text-left px-4 py-2.5 text-[10px] font-mono text-[#9ca3af] uppercase tracking-wider">
                Status
              </th>
              <th className="text-center px-4 py-2.5 text-[10px] font-mono text-[#9ca3af] uppercase tracking-wider w-16">
                Flag
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0ede8]">
            {rows.map((row) => (
              <tr key={row.label} className="hover:bg-[#fafaf8] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <p className="text-[13px] font-medium text-[#0a0a0a] leading-relaxed">{row.label}</p>
                    <button
                      type="button"
                      onClick={() => setActiveLabel(row.label)}
                      className="mt-0.5 shrink-0 w-4 h-4 rounded-full border border-[#d6d3d1] text-[#9ca3af] hover:text-[#0a0a0a] hover:border-[#0a0a0a] transition-colors flex items-center justify-center"
                      aria-label={`Explain ${row.label}`}
                      title="What does this mean?"
                    >
                      <span className="font-mono text-[10px] leading-none">i</span>
                    </button>
                  </div>
                  <p className="text-[10.5px] text-[#9ca3af] mt-0.5 font-mono">{row.note}</p>
                </td>
                <td className="px-4 py-3 text-[12.5px] text-[#374151]">{row.value}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      row.flagged ? "bg-red-500" : "bg-green-400"
                    }`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeInfo && activeLabel && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4"
          onClick={() => setActiveLabel(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-[#e8e4de] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[#f0ede8] flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-1">Metric Explanation</p>
                <h3 className="text-[16px] font-semibold text-[#0a0a0a] tracking-tight">{activeInfo.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveLabel(null)}
                className="text-[#9ca3af] hover:text-[#0a0a0a] transition-colors p-1"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-1">What It Means</p>
                <p className="text-[13px] text-[#374151] leading-relaxed">{activeInfo.plainMeaning}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-1">Why It Matters</p>
                <p className="text-[13px] text-[#374151] leading-relaxed">{activeInfo.whyItMatters}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
