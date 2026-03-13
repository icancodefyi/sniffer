"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SignInContent() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await signIn("nodemailer", { email, callbackUrl, redirect: false });
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="mb-8">
          <Link
            href="/"
            className="font-mono text-[13px] text-[#0a0a0a] tracking-widest uppercase hover:opacity-70 transition-opacity"
          >
            Sniffer
          </Link>
        </div>

        {sent ? (
          <div className="border border-[#e8e4de] rounded-xl bg-white px-6 py-8 text-center">
            <div className="w-10 h-10 rounded-full border border-emerald-200 bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <svg width="18" height="18" fill="none" stroke="#10b981" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h2 className="text-[16px] font-semibold text-[#0a0a0a] mb-2">Check your inbox</h2>
            <p className="text-[12.5px] text-[#6b7280] leading-relaxed">
              We sent a magic link to{" "}
              <span className="font-medium text-[#374151]">{email}</span>.
              Click it to sign in — no password needed.
            </p>
            <p className="text-[11px] text-[#9ca3af] mt-4">Link expires in 24 hours. Check spam if you don&apos;t see it.</p>
          </div>
        ) : (
          <div className="border border-[#e8e4de] rounded-xl bg-white px-6 py-8">
            <h1 className="text-[18px] font-semibold text-[#0a0a0a] mb-1.5">Sign in</h1>
            <p className="text-[12.5px] text-[#6b7280] mb-6 leading-relaxed">
              We&apos;ll email you a magic link — no password needed.
              Your privacy is protected.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
                className="w-full rounded-xl border border-[#e8e4de] bg-[#fafaf8] px-4 py-3 text-[13px] text-[#0a0a0a] placeholder:text-[#c4bdb5] focus:outline-none focus:border-[#0a0a0a] transition-colors"
              />
              <button
                type="submit"
                disabled={!email.trim() || loading}
                className="w-full bg-[#0a0a0a] text-white text-[13px] font-semibold py-3 rounded-xl hover:bg-[#1a1a1a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {loading ? "Sending…" : "Send magic link"}
              </button>
            </form>
            <p className="text-[11px] text-[#9ca3af] mt-5 text-center leading-relaxed">
              No spam. Used only for secure account access.
            </p>
          </div>
        )}

        <p className="text-center mt-6">
          <Link href="/" className="text-[12px] text-[#9ca3af] hover:text-[#0a0a0a] transition-colors">
            ← Back to Sniffer
          </Link>
        </p>

      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
