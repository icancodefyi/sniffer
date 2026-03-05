interface Props {
  suspiciousImg: string | null;
  referenceImg: string | null;
  tamperHeatmap?: string | null;
}

function ImagePanel({ src, label, badge }: { src: string | null; label: string; badge?: string }) {
  return (
    <div>
      <div className="h-36 rounded-xl border border-[#e8e4de] bg-[#f5f5f5] overflow-hidden flex items-center justify-center relative">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center px-3">
            <svg
              width="22"
              height="22"
              fill="none"
              stroke="#d4cfc9"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              className="mx-auto mb-1"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <p className="text-[9.5px] text-[#c4bdb5] font-mono">
              {label === "No Reference" ? "NO REF" : "SUBMITTED"}
            </p>
          </div>
        )}
        {badge && (
          <span className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      <p className="text-[10.5px] font-mono text-[#9ca3af] mt-1.5 text-center">{label}</p>
    </div>
  );
}

export function ImageEvidence({ suspiciousImg, referenceImg, tamperHeatmap }: Props) {
  const hasTamper = Boolean(tamperHeatmap);
  const cols = hasTamper ? "grid-cols-3" : "grid-cols-2";

  return (
    <div>
      <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">Image Evidence</p>
      <div className={`grid ${cols} gap-3`}>
        <ImagePanel src={suspiciousImg} label="Suspicious Image" />
        <ImagePanel src={referenceImg} label={referenceImg ? "Original Image" : "No Reference"} />
        {hasTamper && (
          <ImagePanel src={tamperHeatmap!} label="Tamper Overlay" badge="HEATMAP" />
        )}
      </div>
    </div>
  );
}
