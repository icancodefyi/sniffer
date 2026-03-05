interface Props {
  platform: string;
  steps: string[];
}

export function TakedownGuidance({ platform, steps }: Props) {
  return (
    <section className="mb-8">
      <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">Takedown Guidance</p>
      <div className="border border-[#e8e4de] rounded-xl p-5 bg-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <svg width="13" height="13" fill="none" stroke="#4f46e5" strokeWidth="2" viewBox="0 0 24 24">
              <path
                d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#0a0a0a]">Report on {platform}</p>
            <p className="text-[11px] text-[#9ca3af]">
              Use the Case ID and SHA-256 hash as supporting evidence
            </p>
          </div>
        </div>

        <ol className="space-y-2.5">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="font-mono text-[10.5px] text-[#a8a29e] w-4 shrink-0 mt-0.5">{i + 1}.</span>
              <span className="text-[12.5px] text-[#374151] leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>

        <p className="mt-4 text-[11px] text-[#a8a29e] border-t border-[#f0ede8] pt-3">
          Visit {platform}&apos;s Help Center → Safety &amp; Privacy → Report Content for the official reporting
          form.
        </p>
      </div>
    </section>
  );
}
