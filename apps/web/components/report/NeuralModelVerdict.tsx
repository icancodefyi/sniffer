import type { AiDetectionResult } from "./types";

interface Props {
  ai?: AiDetectionResult | null;
}

function getConfidenceBand(prob: number): {
  label: string;
  color: string;
  barColor: string;
  bg: string;
  border: string;
  dot: string;
} {
  if (prob >= 0.80) return {
    label: "High Confidence — Deepfake Detected",
    color: "text-red-700",
    barColor: "bg-red-500",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
  };
  if (prob >= 0.60) return {
    label: "Moderate Confidence — Likely Deepfake",
    color: "text-amber-700",
    barColor: "bg-amber-400",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-400",
  };
  if (prob >= 0.40) return {
    label: "Inconclusive — Further Analysis Needed",
    color: "text-[#6b7280]",
    barColor: "bg-gray-400",
    bg: "bg-[#fafaf8]",
    border: "border-[#e8e4de]",
    dot: "bg-gray-400",
  };
  return {
    label: "Low Confidence — Likely Authentic",
    color: "text-emerald-700",
    barColor: "bg-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  };
}

export function NeuralModelVerdict({ ai }: Props) {
  if (!ai) return null;

  const modelProb = ai.model_probability ?? null;
  const heuristicProb = ai.heuristic_probability ?? ai.ai_probability;
  const fusedProb = ai.ai_probability;
  const hasModel = modelProb !== null && !ai.model_error;
  const modelName = ai.model_name ?? "prithivMLmods/Deep-Fake-Detector-v2-Model";
  const modelLabel = ai.model_label ?? "Unknown";
  const source = ai.signal_source ?? "heuristic_fallback";

  const displayProb = hasModel ? modelProb! : fusedProb;
  const band = getConfidenceBand(displayProb);
  const pct = Math.round(displayProb * 100);

  return (
    <section className="mb-8">
      <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">
        Neural Deepfake Classifier
      </p>

      <div className={`rounded-xl border ${band.border} overflow-hidden`}>
        {/* Header bar */}
        <div className={`${band.bg} px-5 py-3.5 flex items-center gap-3`}>
          <span className={`w-2 h-2 rounded-full shrink-0 ${band.dot}`} />
          <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider ${band.color}`}>
            {band.label}
          </span>
          {hasModel && (
            <span className="ml-auto text-[10px] font-mono text-[#9ca3af] hidden sm:block truncate max-w-55">
              {modelName}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="bg-white px-5 py-5">
          {hasModel ? (
            <>
              {/* Big probability readout */}
              <div className="flex items-end gap-3 mb-4">
                <span className={`text-[48px] font-bold leading-none tracking-tight ${band.color}`}>
                  {pct}%
                </span>
                <div className="pb-1.5">
                  <p className="text-[12px] font-semibold text-[#0a0a0a]">
                    {modelLabel === "Deepfake" ? "Deepfake probability" : "Realism probability (inverted)"}
                  </p>
                  <p className="text-[10.5px] text-[#9ca3af] font-mono">Neural model output</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-[#f0ede8] rounded-full overflow-hidden mb-5">
                <div
                  className={`h-full rounded-full transition-all ${band.barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Two-column breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-4 py-3">
                  <p className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-wider mb-1">Model verdict</p>
                  <p className="text-[13px] font-semibold text-[#0a0a0a]">{modelLabel}</p>
                  <p className="text-[11px] text-[#6b7280] font-mono mt-0.5">{Math.round(modelProb! * 100)}% confidence</p>
                </div>
                <div className="rounded-lg border border-[#e8e4de] bg-[#fafaf8] px-4 py-3">
                  <p className="text-[10px] font-mono text-[#9ca3af] uppercase tracking-wider mb-1">Forensic signals</p>
                  <p className="text-[13px] font-semibold text-[#0a0a0a]">
                    {Math.round(heuristicProb * 100)}% AI probability
                  </p>
                  <p className="text-[11px] text-[#6b7280] font-mono mt-0.5">FFT · PRNU · CA analysis</p>
                </div>
              </div>

              {/* Fused score note */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10.5px] text-[#9ca3af] font-mono">
                  Fused score: {Math.round(fusedProb * 100)}%
                  &nbsp;·&nbsp;
                  75% model weight + 25% forensic weight
                </span>
              </div>
            </>
          ) : (
            /* Fallback: model unavailable */
            <>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-[48px] font-bold leading-none tracking-tight text-[#6b7280]">
                  {Math.round(fusedProb * 100)}%
                </span>
                <div className="pb-1.5">
                  <p className="text-[12px] font-semibold text-[#0a0a0a]">AI probability (forensic signals)</p>
                  <p className="text-[10.5px] text-[#9ca3af] font-mono">Neural model unavailable — heuristic fallback active</p>
                </div>
              </div>
              <div className="h-1.5 w-full bg-[#f0ede8] rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full ${band.barColor}`}
                  style={{ width: `${Math.round(fusedProb * 100)}%` }}
                />
              </div>
              <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
                <p className="text-[11px] text-amber-700 font-mono">
                  Neural model inference unavailable. Score derived from FFT spectral grid, PRNU kurtosis, and chromatic aberration analysis only.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
