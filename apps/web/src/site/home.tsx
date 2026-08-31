import { SiteLayout } from './layout/site-layout'
import { AboutPreviewSection } from './sections/AboutPreviewSection'
import { AwardsSection } from './sections/AwardsSection'
import { BlogPreviewSection } from './sections/BlogPreviewSection'
import { CTASection } from './sections/CTASection'
import { ClientsMarqueeSection } from './sections/ClientsMarqueeSection'
import { FAQSection } from './sections/FAQSection'
import { FeaturedProjectsSection } from './sections/FeaturedProjectsSection'
import { HeroSection } from './sections/HeroSection'
import { IndustriesSection } from './sections/IndustriesSection'
import { ProcessSection } from './sections/ProcessSection'
import { SaasProductsSection } from './sections/SaasProductsSection'
import { ServicesSection } from './sections/ServicesSection'
import { StatsCounterSection } from './sections/StatsCounterSection'
import { TechStackSection } from './sections/TechStackSection'
import { TestimonialsSection } from './sections/TestimonialsSection'
import { WhyChooseUsSection } from './sections/WhyChooseUsSection'
import { useDbProjects } from './hooks/useDbProjects'

/**
 * The public home page, in the same section order as the company site.
 */
export function SiteHome() {
  useDbProjects()

  return (
    <SiteLayout>
      <HeroSection />
      <ClientsMarqueeSection />
      <StatsCounterSection />
      <AboutPreviewSection />
      <ServicesSection />
      <SaasProductsSection />
      <IndustriesSection />
      <WhyChooseUsSection />
      <ProcessSection />
      <FeaturedProjectsSection />
      <AwardsSection />
      <TestimonialsSection />
      <TechStackSection />
      <FAQSection />
      <BlogPreviewSection />
      <CTASection />
    </SiteLayout>
  )
}
