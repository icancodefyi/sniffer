const PLATFORMS = [
  { name: "Instagram", pct: 38, color: "#818cf8", cases: 156 },
  { name: "Telegram", pct: 27, color: "#f472b6", cases: 112 },
  { name: "X / Twitter", pct: 18, color: "#34d399", cases: 74 },
  { name: "WhatsApp", pct: 10, color: "#fbbf24", cases: 41 },
  { name: "Other", pct: 7, color: "#9ca3af", cases: 29 },
];

export function PlatformDistribution() {
  return (
    <div className="rounded-xl border border-[#e8e4de] bg-white p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#a8a29e]">Platform Risk Map</p>
        <span className="text-[10px] font-mono text-[#c4bdb5]">LAST 7D</span>
      </div>

      <div className="flex-1 flex flex-col justify-between gap-3.5">
        {PLATFORMS.map((p) => (
          <div key={p.name}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                <span className="text-[12.5px] font-medium text-[#374151]">{p.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-[#9ca3af] tabular-nums">{p.cases} cases</span>
                <span className="font-mono text-[12px] font-bold text-[#0a0a0a] tabular-nums w-9 text-right">
                  {p.pct}%
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-[#f5f3f0] overflow-hidden">
              <div
                className="h-2 rounded-full"
                style={{ width: `${p.pct}%`, background: p.color, opacity: 0.85 }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-[#f0ede8] flex items-center justify-between">
        <p className="text-[10px] font-mono text-[#a8a29e]">412 total cases analysed</p>
        <p className="text-[10px] font-mono text-[#c4bdb5]">Based on platform field</p>
      </div>
    </div>
  );
}
