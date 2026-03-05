const PROBLEMS = [
  {
    n: "01",
    title: "Invisible to the naked eye",
    desc: "Modern GAN-generated images are pixel-perfect fakes. Even trained investigators miss the artifacts. Manipulation happens at a frequency no human can sustainably monitor.",
    stat: "~96% of fake images go undetected",
  },
  {
    n: "02",
    title: "Evidence breaks in transit",
    desc: "Re-uploads, screenshots, and message forwards silently strip EXIF data and break provenance. By the time a complaint is filed, the image is forensically unverifiable.",
    stat: "No verifiable chain of custody",
  },
  {
    n: "03",
    title: "No clear path to takedown",
    desc: "Platform abuse systems require evidence in specific formats. Without a structured forensic report, requests go ignored — and perpetrators face no consequence.",
    stat: "Avg. 72h delay on platform review",
  },
];

export function ProblemSection() {
  return (
    <section className="w-full bg-white py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">

        {/* Header — left-aligned with a right pull-quote stat for visual weight */}
        <div className="mb-20 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8a29e]">
              The Problem
            </p>
            <h2
              className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal leading-[1.1] tracking-tight text-[#0a0a0a]"
              style={{ maxWidth: "520px" }}
            >
              Manipulation is easy.<br />Verification is not.
            </h2>
          </div>
          {/* Pull-quote stat — makes the section feel like a real report */}
          <div className="border-l-2 border-red-300 pl-5" style={{ maxWidth: "240px" }}>
            <p className="font-mono text-[32px] font-bold leading-none text-[#0a0a0a]">500M+</p>
            <p className="mt-2 text-[13px] leading-snug text-[#6b7280]">
              non-consensual deepfake images circulated online in 2024
            </p>
          </div>
        </div>

        {/* Three columns — divided by 1px rules, no cards */}
        <div className="grid grid-cols-1 border-t border-[#e8e4de] md:grid-cols-3">
          {PROBLEMS.map((p, i) => (
            <div
              key={p.n}
              className={[
                "flex flex-col gap-5 py-10",
                i < 2 ? "border-b border-[#e8e4de] md:border-b-0 md:border-r md:pr-12" : "",
                i > 0 ? "md:pl-12" : "",
              ].join(" ")}
            >
              <span className="font-mono text-[12px] font-medium text-[#c4bdb5]">{p.n}</span>
              <div>
                <h3 className="mb-3 text-[20px] font-semibold leading-snug text-[#0a0a0a]">{p.title}</h3>
                <p className="text-[15px] leading-[1.7] text-[#6b7280]">{p.desc}</p>
              </div>
              <div className="mt-auto border-t border-[#f0ece6] pt-5">
                <p className="font-mono text-[11.5px] text-[#a8a29e]">{p.stat}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
