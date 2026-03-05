const STEPS = [
  {
    n: "01",
    title: "Upload the image",
    desc: "Any JPEG, PNG, or WebP. No account needed. The file is SHA-256 hashed on receipt — your original is never retained after analysis.",
    detail: "SHA-256 hash on upload",
    aside: "We never store your image",
  },
  {
    n: "02",
    title: "Seven-layer forensic analysis",
    desc: "Error-level analysis, EXIF integrity check, GAN artifact detection, facial landmark distortion, clone region mapping, noise patterns, and compression fingerprinting — run concurrently.",
    detail: "~30–60 seconds",
    aside: "All layers run in parallel",
  },
  {
    n: "03",
    title: "Download a signed evidence report",
    desc: "A structured PDF with per-layer confidence scores, a cryptographic case ID, and a SHA-256 image hash. Formatted to meet platform takedown and legal filing requirements.",
    detail: "PDF · case ID · signature",
    aside: "Accepted by major platforms",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full bg-[#fafaf8] py-32">
      <div className="mx-auto max-w-7xl px-8">

        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8a29e]">
          How it works
        </p>
        <div className="mb-20 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2
            className="font-serif text-5xl font-normal leading-[1.1] tracking-tight text-[#0a0a0a]"
            style={{ maxWidth: "460px" }}
          >
            From image to evidence<br />in three steps.
          </h2>
          <p className="text-[15px] leading-[1.7] text-[#6b7280]" style={{ maxWidth: "300px" }}>
            No account. No install. Results in under a minute.
          </p>
        </div>

        {/* Steps */}
        <ol className="grid grid-cols-1 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              className={[
                "flex flex-col",
                i < 2 ? "border-b border-[#e8e4de] pb-12 md:border-b-0 md:border-r md:pb-0 md:pr-12" : "",
                i > 0 ? "pt-12 md:pt-0 md:pl-12" : "",
              ].join(" ")}
            >
              {/* Number + connecting line */}
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#e8e4de] bg-white font-mono text-[12px] font-semibold text-[#0a0a0a]">
                  {s.n}
                </div>
                {i < 2 && (
                  <div className="hidden flex-1 border-t border-dashed border-[#d6d0c8] md:block" />
                )}
              </div>

              <h3 className="mb-3 text-[19px] font-semibold leading-snug text-[#0a0a0a]">{s.title}</h3>
              <p className="mb-6 text-[15px] leading-[1.7] text-[#6b7280]">{s.desc}</p>

              {/* Two-line footer: timing + privacy note */}
              <div className="mt-auto space-y-1 border-t border-[#ede9e3] pt-5">
                <p className="font-mono text-[11.5px] font-medium text-[#0a0a0a]">{s.detail}</p>
                <p className="font-mono text-[11px] text-[#a8a29e]">{s.aside}</p>
              </div>
            </li>
          ))}
        </ol>

      </div>
    </section>
  );
}
