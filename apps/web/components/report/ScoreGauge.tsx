interface Props {
  score: number;
}

export function ScoreGauge({ score }: Props) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const isHigh = score >= 70;
  const isMed = score >= 40 && score < 70;
  const color = isHigh ? "#16a34a" : isMed ? "#d97706" : "#dc2626";
  const bg = isHigh ? "bg-green-50 border-green-100" : isMed ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100";
  const label = isHigh ? "LOW RISK" : isMed ? "MEDIUM RISK" : "HIGH MANIPULATION RISK";
  const labelColor = isHigh ? "text-green-700" : isMed ? "text-amber-700" : "text-red-700";

  return (
    <div className={`flex items-center gap-5 p-5 rounded-xl border ${bg}`}>
      <div className="shrink-0">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="9" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dashoffset 1.2s ease" }}
          />
          <text
            x="60"
            y="56"
            textAnchor="middle"
            fontSize="28"
            fontWeight="700"
            fill="#0a0a0a"
            fontFamily="Georgia,'Times New Roman',serif"
          >
            {score}
          </text>
          <text x="60" y="72" textAnchor="middle" fontSize="9" fill="#9ca3af" fontFamily="monospace">
            /100
          </text>
        </svg>
      </div>
      <div>
        <p className="text-[10.5px] font-mono text-[#a8a29e] uppercase tracking-widest mb-1">Authenticity Score</p>
        <p className={`text-[15px] font-bold tracking-wider font-mono ${labelColor}`}>{label}</p>
        <p className="text-[12.5px] text-[#6b7280] mt-2 leading-relaxed max-w-50">
          {isHigh
            ? "No significant manipulation signals detected in this image."
            : isMed
            ? "Moderate signals warrant further manual review."
            : "High-confidence manipulation indicators detected."}
        </p>
      </div>
    </div>
  );
}
