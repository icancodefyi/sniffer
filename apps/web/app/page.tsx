import {
  Navbar,
  HeroSection,
  ProblemSection,
  HowItWorksSection,
  ReportPreviewSection,
  FeaturesSection,
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
        <CTASection />
      </main>
      <Footer />
    </>
  );
}