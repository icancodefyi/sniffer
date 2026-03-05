import Image from "next/image";
import Link from "next/link";

const STATS = [
  { value: "99.2%", label: "Detection accuracy" },
  { value: "<60s", label: "Mean analysis time" },
  { value: "SHA-256", label: "Cryptographic hashing" },
];

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-white">

      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-170 w-170 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at 80% 20%, #e0e7ff 0%, #c7d2fe 28%, transparent 68%)",
        }}
      />

      {/* Two-column grid */}
      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-64px)] max-w-7xl grid-cols-1 items-center pt-20 pb-20 lg:grid-cols-[1fr_420px]">

        {/* Left copy */}
        <div className="flex flex-col justify-center px-4 sm:px-8 py-16 xl:px-16 lg:py-0">

          {/* Ornament */}
          <div aria-hidden="true" className="mb-6 flex items-center gap-3 opacity-50">
            <svg width="50" height="34" viewBox="0 0 50 34" fill="none">
              <path d="M46 6C38 2 25 2 21 12C17 22 25 31 34 29C43 27 45 18 39 14C33 10 24 14 26 21" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="26" cy="21" r="1.5" fill="#818cf8" />
            </svg>
            <svg width="50" height="34" viewBox="0 0 50 34" fill="none" className="-scale-x-100">
              <path d="M46 6C38 2 25 2 21 12C17 22 25 31 34 29C43 27 45 18 39 14C33 10 24 14 26 21" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="26" cy="21" r="1.5" fill="#818cf8" />
            </svg>
          </div>

          {/* Badge */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[12.5px] font-medium text-indigo-600 shadow-[0_0_0_1px_rgba(99,102,241,0.22),0_2px_10px_rgba(0,0,0,0.06)]">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-indigo-400" />
              AI-Powered Media Authenticity Verification
            </span>
          </div>

          {/* H1 — font-serif maps to Georgia; text-5xl (48px) guarantees 2 lines in this column */}
          <h1 className="mb-5 font-serif text-3xl sm:text-4xl md:text-5xl font-medium leading-[1.1] tracking-tight text-[#0a0a0a]">
            Verify Manipulated Images.
            <br />
            Protect Your Digital Identity.
          </h1>

          {/* Sub-copy */}
          <p className="mb-8 max-w-md text-[17px] leading-[1.7] text-[#6b7280]">
            Multi-layer forensic analysis to detect deepfakes and image tampering.
            Generate cryptographic evidence reports for legal takedown and platform abuse filings.
          </p>

          {/* CTAs */}
          <div className="mb-4 flex flex-wrap gap-3">
            <Link
              href="/verify"
              className="inline-flex items-center gap-2 rounded-full bg-[#0a0a0a] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-75"
            >
              Create Verification Case
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/protect"
              className="inline-flex items-center rounded-full border border-[#e0d8d0] bg-white px-6 py-3 text-sm font-medium text-[#3d3530] transition-colors hover:border-indigo-400 hover:text-indigo-600"
            >
              Protect Your Images
            </Link>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#b0a89e]">
            <span>Private by default</span>
            <span aria-hidden="true" className="inline-block h-px w-3.5 bg-[#e0dbd5]" />
            <span>Anonymous reporting</span>
            <span aria-hidden="true" className="inline-block h-px w-3.5 bg-[#e0dbd5]" />
            <span>No account required</span>
          </div>
        </div>

        {/* Right illustration */}
        <div className="relative hidden h-full lg:block">
          <Image
            src="/illustration.png"
            alt="Split-face: authentic photo left, deepfake forensic breakdown right"
            fill
            priority
            className="object-cover object-[50%_6%]"
          />
          {/* right fade */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10"
            style={{ background: "linear-gradient(to right, transparent, #fff)" }}
          />
          {/* bottom fade */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40"
            style={{ background: "linear-gradient(to bottom, transparent, #fff)" }}
          />
        </div>
      </div>

      {/* Stats strip */}
      <div className="relative z-10 border-t border-[#f0ece6] bg-[#fafaf9]">
        <dl className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-[#f0ece6] px-0">
          {STATS.map((s) => (
            <div key={s.label} className="px-3 sm:px-8 py-5 sm:py-6 text-center">
              <dt className="mb-0.5 text-lg sm:text-xl font-semibold tracking-tight text-[#0a0a0a]">
                {s.value}
              </dt>
              <dd className="text-xs text-[#9ca3af]">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
