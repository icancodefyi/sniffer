import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { ThreatMeter } from "@/components/dashboard/ThreatMeter";
import { SignalRadar } from "@/components/dashboard/SignalRadar";
import { PlatformDistribution } from "@/components/dashboard/PlatformDistribution";
import { SyntheticBreakdown } from "@/components/dashboard/SyntheticBreakdown";
import { ContentSignals } from "@/components/dashboard/ContentSignals";
import { ThreatTimeline } from "@/components/dashboard/ThreatTimeline";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { EngineStatus } from "@/components/dashboard/EngineStatus";

export const metadata = {
  title: "Dashboard — Sniffer",
  description:
    "Real-time insights into manipulated media and deepfake threats detected across the platform.",
};

const STATS = [
  { label: "Total Verifications", value: "4,812", delta: "+38 today" },
  { label: "Deepfakes Detected", value: "1,247", delta: "+12 today", alert: true },
  { label: "Registry Entries", value: "892", delta: "+6 today" },
  { label: "Takedown Notices", value: "341", delta: "+3 today" },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <Navbar />

      {/* Page header */}
      <div className="border-b border-[#e8e4de] bg-white pt-18">
        <div className="max-w-350 mx-auto px-4 sm:px-8 py-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#a8a29e] mb-2">
                Intelligence Platform
              </p>
              <h1 className="text-[1.6rem] sm:text-[2rem] font-semibold tracking-tight text-[#0a0a0a]">
                Media Integrity Intelligence Dashboard
              </h1>
              <p className="text-[13.5px] text-[#6b7280] mt-2 max-w-xl leading-relaxed">
                Real-time insights into manipulated media and deepfake threats detected across the platform.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Link
                href="/verify"
                className="px-4 py-2 rounded-full text-[12.5px] font-medium bg-[#0a0a0a] text-white hover:bg-[#1a1a1a] transition-colors"
              >
                New Verification
              </Link>
              <Link
                href="/protect"
                className="px-4 py-2 rounded-full text-[12.5px] font-medium border border-[#e8e4de] text-[#374151] bg-white hover:border-[#0a0a0a] transition-colors"
              >
                Registry
              </Link>
            </div>
          </div>

          {/* Top-level stats ticker */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 mt-6 border border-[#e8e4de] rounded-xl overflow-hidden">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={`px-5 py-4 bg-white ${i < STATS.length - 1 ? "border-r border-[#e8e4de]" : ""}`}
              >
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#a8a29e] mb-1">
                  {s.label}
                </p>
                <p className="text-[22px] font-semibold font-mono text-[#0a0a0a] tabular-nums">
                  {s.value}
                </p>
                <p
                  className="text-[11px] font-mono mt-0.5"
                  style={{ color: s.alert ? "#ef4444" : "#9ca3af" }}
                >
                  {s.delta}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard grid */}
      <div className="max-w-350 mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Row 1: Threat Meter + Signal Radar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ThreatMeter />
          <SignalRadar />
        </div>

        {/* Row 2: Platform + Synthetic + Engine Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <PlatformDistribution />
          <SyntheticBreakdown />
          <EngineStatus />
        </div>

        {/* Row 3: Content Signals + Live Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
          <ContentSignals />
          <ThreatTimeline />
        </div>

        {/* Row 4: Activity Heatmap */}
        <ActivityHeatmap />
      </div>

      {/* Footer */}
      <div className="border-t border-[#e8e4de] py-6 bg-white mt-4">
          <div className="max-w-350 mx-auto px-4 sm:px-8 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[10.5px] text-[#a8a29e]">
            SNIFFER · MEDIA INTELLIGENCE DASHBOARD · 2026
          </p>
          <p className="font-mono text-[10px] text-[#c4bdb5]">
            Metrics are partially simulated for demonstration purposes
          </p>
        </div>
      </div>
    </div>
  );
}
