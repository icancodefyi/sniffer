import type { TimelineEntry } from "./utils";
import { formatTime } from "./utils";

interface Props {
  entries: TimelineEntry[];
}

export function EvidenceTimeline({ entries }: Props) {
  return (
    <section className="mb-8">
      <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-4">Evidence Timeline</p>
      <div className="relative pl-6">
        <div className="absolute left-2 top-1.5 bottom-1.5 w-px bg-[#e8e4de]" />
        <div className="space-y-5">
          {entries.map((entry, i) => (
            <div key={i} className="relative flex items-start gap-3">
              <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0a] bg-white shrink-0" />
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-[10.5px] text-[#a8a29e]">{formatTime(entry.ts)}</span>
                  <span className="text-[13px] font-semibold text-[#0a0a0a]">{entry.event}</span>
                </div>
                <p className="text-[11.5px] text-[#9ca3af] mt-0.5">{entry.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
