import Link from "next/link";

export default function StartPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-[#f0ede8] px-6 py-4 flex items-center gap-3">
        <Link
          href="/"
          className="font-mono text-[13px] text-[#0a0a0a] tracking-widest uppercase hover:opacity-70 transition-opacity"
        >
          Sniffer
        </Link>
        <span className="text-[#d4cfc9]">/</span>
        <span className="text-[13px] text-[#9ca3af]">Start Investigation</span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="font-mono text-[11px] text-indigo-500 uppercase tracking-widest mb-4">
            Sniffer · Cyber Investigation Platform
          </p>
          <h1
            className="text-4xl text-[#0a0a0a] leading-snug mb-4"
            style={{ fontFamily: "Georgia,'Times New Roman',serif", fontWeight: 400 }}
          >
            What do you need to investigate?
          </h1>
          <p className="text-[14px] text-[#6b7280]">
            Choose the right pipeline — each is built for a specific type of investigation.
          </p>
        </div>

        {/* Pipeline cards */}
        <div className="flex flex-col gap-4">

          {/* Pipeline 1 — Deepfake */}
          <Link
            href="/verify"
            className="group relative block p-7 rounded-2xl border border-[#e8e4de] bg-white hover:border-indigo-400 hover:shadow-[0_0_0_3px_rgba(99,102,241,0.08)] transition-all"
          >
            <div className="flex items-start gap-5">
              {/* Icon */}
              <div className="shrink-0 w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mt-0.5">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth="1.75">
                  <circle cx="11" cy="11" r="8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 21l-2-2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 11h6M11 8v6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <p className="text-[17px] font-semibold text-[#0a0a0a] tracking-tight">
                    Pipeline 1 — Deepfake &amp; AI Manipulation
                  </p>
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 font-mono text-[9.5px] text-indigo-600 uppercase tracking-wider">
                    Forensic Analysis
                  </span>
                </div>
                <p className="text-[13.5px] text-[#6b7280] leading-relaxed mb-4">
                  Detect whether an image has been AI-generated, face-swapped, or digitally tampered. 
                  Produces a forensic authenticity score with per-signal evidence.
                </p>
                {/* Feature pills */}
                <div className="flex flex-wrap gap-2">
                  {["Authenticity Score", "ELA Tamper Heatmap", "Metadata Inspection", "C2PA Provenance", "AI Detection"].map((f) => (
                    <span key={f} className="px-2.5 py-1 rounded-full border border-[#e8e4de] bg-[#fafaf8] text-[11px] text-[#6b7280] font-mono">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="shrink-0 w-8 h-8 rounded-full border border-[#e8e4de] bg-[#fafaf8] group-hover:border-indigo-300 group-hover:bg-indigo-50 flex items-center justify-center transition-colors mt-0.5">
                <svg width="13" height="13" fill="none" stroke="#6366f1" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Pipeline 2 — NCII */}
          <Link
            href="/leak"
            className="group relative block p-7 rounded-2xl border border-[#e8e4de] bg-white hover:border-rose-400 hover:shadow-[0_0_0_3px_rgba(244,63,94,0.07)] transition-all"
          >
            <div className="flex items-start gap-5">
              {/* Icon */}
              <div className="shrink-0 w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center mt-0.5">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#f43f5e" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="10" strokeLinecap="round" />
                  <path d="M2 12h4M18 12h4M12 2v4M12 18v4" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <p className="text-[17px] font-semibold text-[#0a0a0a] tracking-tight">
                    Pipeline 2 — NCII Leak Discovery &amp; Takedown
                  </p>
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 font-mono text-[9.5px] text-rose-600 uppercase tracking-wider">
                    Leak Scan
                  </span>
                </div>
                <p className="text-[13.5px] text-[#6b7280] leading-relaxed mb-4">
                  Find where an image has been shared without consent across adult video networks, 
                  identify the hosting infrastructure, and get platform-specific removal guidance.
                </p>
                {/* Feature pills */}
                <div className="flex flex-wrap gap-2">
                  {["Network Domain Scan", "Visual Match Detection", "CDN Intelligence", "DMCA Contacts", "Removal Guidance"].map((f) => (
                    <span key={f} className="px-2.5 py-1 rounded-full border border-[#e8e4de] bg-[#fafaf8] text-[11px] text-[#6b7280] font-mono">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="shrink-0 w-8 h-8 rounded-full border border-[#e8e4de] bg-[#fafaf8] group-hover:border-rose-300 group-hover:bg-rose-50 flex items-center justify-center transition-colors mt-0.5">
                <svg width="13" height="13" fill="none" stroke="#f43f5e" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Shared infrastructure note */}
        <div className="mt-8 px-5 py-4 rounded-xl border border-[#f0ede8] bg-[#fafaf8]">
          <div className="flex items-start gap-3">
            <svg width="14" height="14" fill="none" stroke="#a8a29e" strokeWidth="2" viewBox="0 0 24 24" className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="text-[12px] font-semibold text-[#374151] mb-0.5">Shared components across both pipelines</p>
              <p className="text-[11.5px] text-[#9ca3af] leading-relaxed">
                Case Manager, Evidence Report Generator, and Threat Scoring are shared. Each pipeline produces a 
                case ID you can save, revisit, and reference in legal correspondence.
              </p>
              <Link href="/supported-platforms" className="inline-flex mt-2 text-[11.5px] text-rose-600 hover:underline">
                View Supported Platforms →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
