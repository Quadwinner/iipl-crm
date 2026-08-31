import { useState } from "react";
import { SEOHead } from "@/site/seo-head";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { SiteLayout } from "@/site/layout/site-layout";
import { useDbProjects } from "@/site/hooks/useDbProjects";
import { ArrowUpRight, Filter, TrendingUp, Layers } from "lucide-react";
import { CTASection } from "@/site/sections/CTASection";
import { PortfolioStatsSection } from "@/site/sections/PortfolioStatsSection";
import { TestimonialsSection } from "@/site/sections/TestimonialsSection";
import { WorkProcessSection } from "@/site/sections/WorkProcessSection";
import ROICalculatorSection from "@/site/sections/ROICalculatorSection";

import techflowImage from "@/site/assets/portfolio/techflow-saas.webp";
import easy2buyImage from "@/site/assets/portfolio/easy2buy-ecommerce.webp";
import fittrackImage from "@/site/assets/portfolio/fittrack-app.webp";
import b2bSaasImage from "@/site/assets/portfolio/b2b-saas-marketing.webp";
import healthcareImage from "@/site/assets/portfolio/healthcare-portal.webp";
import quickpayImage from "@/site/assets/portfolio/quickpay-fintech.webp";
import rainfraImage from "@/site/assets/portfolio/rainfra-architecture.webp";
import kaspereyeImage from "@/site/assets/portfolio/kaspereye-security.webp";
import solidedgeImage from "@/site/assets/portfolio/solidedge-construction.png";
import juxtudioImage from "@/site/assets/portfolio/juxtudio-architecture.png";
import rentItobyImage from "@/site/assets/portfolio/rent-itoby.png";
import leadItobyImage from "@/site/assets/portfolio/lead-itoby.png";

import { PageHeroBanner } from "@/site/ui/page-hero-banner";

const categories = ["All", "Website", "E-commerce", "App", "Marketing", "Software", "Microsoft 365"];

const fallbackProjects = [
  {
    slug: "techflow",
    title: "TechFlow SaaS Platform",
    category: "Software",
    description: "A comprehensive SaaS solution for workflow automation with advanced analytics and real-time collaboration.",
    image: techflowImage,
    results: "300% ROI",
    tech: ["React", "Node.js", "PostgreSQL", "AWS"],
    client: "TechFlow Inc.",
    source: "hardcoded" as const,
  },
  {
    slug: "easy2buy",
    title: "Easy2Buy E-commerce",
    category: "E-commerce",
    description: "Modern e-commerce platform with AI-powered recommendations and seamless payment integration.",
    image: easy2buyImage,
    results: "250% Sales ↑",
    tech: ["Next.js", "Stripe", "MongoDB", "AI"],
    client: "Easy2Buy",
    source: "hardcoded" as const,
  },
  {
    slug: "fittrack",
    title: "FitTrack Mobile App",
    category: "App",
    description: "Fitness tracking app with personalized workout plans, nutrition guidance and ML-powered insights.",
    image: fittrackImage,
    results: "1M+ Downloads",
    tech: ["React Native", "Firebase", "ML Kit"],
    client: "FitTrack",
    source: "hardcoded" as const,
  },
  {
    slug: "b2b-saas",
    title: "B2B SaaS Campaign",
    category: "Marketing",
    description: "Comprehensive digital marketing strategy that multiplied lead generation by 4x in 6 months.",
    image: b2bSaasImage,
    results: "400% Leads ↑",
    tech: ["Google Ads", "SEO", "Analytics"],
    client: "B2B SaaS Corp",
    source: "hardcoded" as const,
  },
  {
    slug: "healthcare-portal",
    title: "Healthcare Management Portal",
    category: "Website",
    description: "Secure patient management system with telemedicine and appointment scheduling.",
    image: healthcareImage,
    results: "95% Efficiency",
    tech: ["React", "Django", "PostgreSQL"],
    client: "MedCare Solutions",
    source: "hardcoded" as const,
  },
  {
    slug: "quickpay",
    title: "QuickPay FinTech",
    category: "Software",
    description: "Next-gen payment processing with blockchain security and instant settlements.",
    image: quickpayImage,
    results: "99.9% Uptime",
    tech: ["Vue.js", "Blockchain", "Microservices"],
    client: "QuickPay",
    source: "hardcoded" as const,
  },
  {
    slug: "rainfra-studio",
    title: "RA Infra Studio – Architecture Portfolio",
    category: "Website",
    description: "A stunning dark-themed portfolio website for a leading architecture and interior design firm with immersive project showcases.",
    image: rainfraImage,
    results: "+200% Inquiries",
    tech: ["React", "Framer Motion", "Three.js"],
    client: "RA Infra Studio",
    source: "hardcoded" as const,
  },
  {
    slug: "kaspereye-security",
    title: "Kaspereye Security Solutions",
    category: "Website",
    description: "Professional B2B website for a leading physical security and surveillance systems provider.",
    image: kaspereyeImage,
    results: "+180% Leads",
    tech: ["React", "Tailwind CSS", "Supabase"],
    client: "Kaspereye Security",
    source: "hardcoded" as const,
  },
  {
    slug: "solidedgeconstructions",
    title: "Solid Edge Constructions",
    category: "Website",
    description: "Premium website for a civil engineering and construction firm to attract high-value commercial contracts.",
    image: solidedgeImage,
    results: "+140% Leads",
    tech: ["React", "Vite", "Tailwind CSS"],
    client: "Solid Edge Constructions",
    source: "hardcoded" as const,
  },
  {
    slug: "juxtudio",
    title: "Juxtudio – Architecture & Interior Design",
    category: "Website",
    description: "Minimalist luxury portfolio for an architecture and interior design studio with immersive parallax galleries.",
    image: juxtudioImage,
    results: "+95% Bookings",
    tech: ["React", "GSAP", "Framer Motion"],
    client: "Juxtudio Design Studio",
    source: "hardcoded" as const,
  },
  {
    slug: "rent-itoby",
    title: "Rent Itoby – Rental CRM Dashboard",
    category: "App",
    description: "A state-of-the-art rental CRM for managing equipment, vehicle fleets, and property leasing with auto-booking and payment integration.",
    image: rentItobyImage,
    results: "0% Overbooking",
    tech: ["React", "Node.js", "Stripe API"],
    client: "Itoby Rental Systems",
    source: "hardcoded" as const,
  },
  {
    slug: "lead-itoby",
    title: "Lead Itoby – Lead Scoring CRM",
    category: "Software",
    description: "Automated lead generation and scoring CRM with drip campaign automation and real-time conversion tracking.",
    image: leadItobyImage,
    results: "+110% Conversions",
    tech: ["React", "Python", "PostgreSQL"],
    client: "Itoby Marketing Solutions",
    source: "hardcoded" as const,
  },
];

const Portfolio = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const { dbProjects, isLoading } = useDbProjects();

  // Merge database projects with hardcoded projects (deduplicated by slug)
  const projects = [
    ...dbProjects,
    ...fallbackProjects.filter((fb) => !dbProjects.some((db) => db.slug === fb.slug)),
  ];

  const filteredProjects =
    activeCategory === "All"
      ? projects
      : projects.filter((p) => p.category === activeCategory);

  return (
    <SiteLayout>
      <SEOHead
        title="Our Portfolio | Itoby Infotech Pvt Ltd (IIPL) - Web & Mobile Case Studies"
        description="Explore case studies and software projects engineered by Itoby Infotech Pvt Ltd (IIPL) for clients in India, USA, Canada, Australia, Dubai (UAE) & UK."
        path="/portfolio"
      />

      {/* 3D Animated Hero & Breadcrumbs */}
      <PageHeroBanner
        title="Showcasing Our Digital Masterpieces"
        description="Explore our portfolio of successful digital transformations across web engineering, mobile apps, software solutions, and marketing campaigns."
        badge="Our Proven Case Studies"
        breadcrumbs={[{ label: "Portfolio" }]}
      />

      <PortfolioStatsSection />

      {/* Portfolio Grid */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute top-1/3 left-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
        <div className="container-wide relative z-10">
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-14 p-3 sm:p-4 rounded-2xl bg-card/40 backdrop-blur-md border border-border/30 max-w-fit mx-auto"
          >
            <div className="flex items-center gap-2 mr-2 text-muted-foreground">
              <Filter size={18} />
              <span className="text-sm font-medium hidden sm:inline">Filter:</span>
            </div>
            {categories.map((category) => {
              const count = category === "All" ? dbProjects.length : dbProjects.filter(p => p.category === category).length;
              if (count === 0 && category !== "All") return null;
              return (
                <motion.button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 ${
                    activeCategory === category
                      ? "bg-primary text-primary-foreground shadow-[0_0_25px_hsl(var(--primary)/0.35)]"
                      : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {category}
                  <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full ${
                    activeCategory === category
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  }`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Loading */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-3xl bg-card/50 border border-border/30 overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-secondary/40" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-secondary/40 rounded w-1/4" />
                    <div className="h-6 bg-secondary/40 rounded w-3/4" />
                    <div className="h-4 bg-secondary/40 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.slug}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -10 }}
                    className="group"
                  >
                    <Link
                      to={`/portfolio/${project.slug}`}
                      className="block rounded-3xl overflow-hidden bg-card/40 backdrop-blur-xl border border-border/40 hover:border-primary/50 transition-all duration-500 hover:shadow-[0_30px_80px_-20px_hsl(var(--primary)/0.2)]"
                    >
                      {/* Image Container */}
                      <div className="relative aspect-[16/10] overflow-hidden">
                        {project.image ? (
                          <img
                            src={typeof project.image === "string" ? project.image : (project.image as any)?.src}
                            alt={project.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <Layers className="w-12 h-12 text-primary/40" />
                          </div>
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

                        {/* Hover Glow */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_80%,hsl(var(--primary)/0.1),transparent_60%)]" />

                        {/* Result Badge */}
                        {project.results && (
                          <div className="absolute top-4 left-4 z-10">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/20 backdrop-blur-xl border border-primary/30 text-primary text-xs font-bold shadow-lg">
                              <TrendingUp size={11} />
                              {project.results}
                            </span>
                          </div>
                        )}

                        {/* Arrow */}
                        <div className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 scale-75 group-hover:scale-100 transition-all duration-400 shadow-xl">
                          <ArrowUpRight className="text-primary-foreground" size={18} />
                        </div>

                        {/* Bottom Content on Image */}
                        <div className="absolute bottom-4 left-4 right-4 z-10">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-1 rounded-md bg-primary/90 text-primary-foreground text-[10px] font-semibold uppercase tracking-wider">
                              {project.category}
                            </span>
                            {project.client && (
                              <span className="px-2.5 py-1 rounded-md bg-card/50 backdrop-blur-md text-foreground/80 text-[10px] font-medium border border-border/30">
                                {project.client}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 sm:p-6">
                        <h3 className="font-display text-lg sm:text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-1">
                          {project.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>

                        {/* Tech Tags */}
                        {project.tech && project.tech.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {project.tech.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2.5 py-1 text-[10px] sm:text-xs rounded-full bg-secondary/60 text-muted-foreground border border-border/20 group-hover:border-primary/20 group-hover:text-foreground transition-colors"
                              >
                                {tag}
                              </span>
                            ))}
                            {project.tech.length > 3 && (
                              <span className="px-2.5 py-1 text-[10px] sm:text-xs rounded-full bg-secondary/40 text-muted-foreground">
                                +{project.tech.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {!isLoading && filteredProjects.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Layers className="w-10 h-10 text-primary/50" />
              </div>
              <p className="text-muted-foreground text-lg">No projects found in this category.</p>
            </motion.div>
          )}
        </div>
      </section>

      <ROICalculatorSection />
      <WorkProcessSection />
      <TestimonialsSection />
      <CTASection />
    </SiteLayout>
  );
};

export default Portfolio;
