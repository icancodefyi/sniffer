import Link from "next/link";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">

        <Link
          href="/"
          className="font-mono text-[13px] text-[#0a0a0a] tracking-widest uppercase hover:opacity-70 inline-block mb-8 transition-opacity"
        >
          Sniffer
        </Link>

        <div className="border border-[#e8e4de] rounded-xl bg-white px-6 py-8">
          <div className="w-10 h-10 rounded-full border border-emerald-200 bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <svg width="18" height="18" fill="none" stroke="#10b981" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h2 className="text-[16px] font-semibold text-[#0a0a0a] mb-2">Check your inbox</h2>
          <p className="text-[12.5px] text-[#6b7280] leading-relaxed">
            A magic link has been sent to your email address.
            Click it to sign in — no password needed.
          </p>
          <p className="text-[11px] text-[#9ca3af] mt-4">
            Link expires in 24 hours. Check spam if you don&apos;t see it.
          </p>
        </div>

        <Link href="/" className="inline-block mt-6 text-[12px] text-[#9ca3af] hover:text-[#0a0a0a] transition-colors">
          ← Back to Sniffer
        </Link>

      </div>
    </div>
  );
}
