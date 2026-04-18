import Hero from "@/components/Hero";
import CommunityShowcase from "@/components/CommunityShowcase";
import StatsSection from "@/components/StatsSection";
import HowItWorks from "@/components/HowItWorks";
import FeaturesGrid from "@/components/FeaturesGrid";
import CTABanner from "@/components/CTABanner";
import Footer from "@/components/Footer";

export default function Landing() {
  return (
    <main className="page-enter">
      <Hero />
      <CommunityShowcase />
      <StatsSection />
      <HowItWorks />
      <FeaturesGrid />
      <CTABanner />
      <Footer />
    </main>
  );
}
