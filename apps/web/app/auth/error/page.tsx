import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <Link
          href="/"
          className="font-mono text-[13px] text-[#0a0a0a] tracking-widest uppercase hover:opacity-70 inline-block mb-8 transition-opacity"
        >
          Sniffer
        </Link>
        <div className="border border-red-100 rounded-xl bg-white px-6 py-8">
          <div className="w-10 h-10 rounded-full border border-red-200 bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg width="18" height="18" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-[16px] font-semibold text-[#0a0a0a] mb-2">Sign-in failed</h2>
          <p className="text-[12.5px] text-[#6b7280] leading-relaxed mb-5">
            The link may have expired or already been used. Please request a new one.
          </p>
          <Link
            href="/auth/signin"
            className="inline-block bg-[#0a0a0a] text-white text-[13px] font-medium px-5 py-2.5 rounded-xl hover:bg-[#1a1a1a] transition-colors"
          >
            Try again
          </Link>
        </div>
      </div>
    </div>
  );
}
