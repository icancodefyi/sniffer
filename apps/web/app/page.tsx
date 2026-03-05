import {
  Navbar,
  HeroSection,
  ProblemSection,
  HowItWorksSection,
  ReportPreviewSection,
  FeaturesSection,
  AudienceSection,
  CTASection,
  Footer,
} from "@/components/landing";

export default function Page() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesSection />
        <ReportPreviewSection />
        <AudienceSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}