import { motion } from "framer-motion";
import { SEOHead } from "@/site/seo-head";
import { Link } from "react-router-dom";
import { SiteLayout } from "@/site/layout/site-layout";
import { Globe, Smartphone, TrendingUp, Code2, Cloud, ArrowRight, CheckCircle } from "lucide-react";
import { CTASection } from "@/site/sections/CTASection";
import { TestimonialsSection } from "@/site/sections/TestimonialsSection";
import { ServiceComparisonSection } from "@/site/sections/ServiceComparisonSection";
import { PageHeroBanner } from "@/site/ui/page-hero-banner";

const services = [
  {
    icon: Globe,
    title: "Web Design & Development",
    description: "Premium websites that captivate audiences, drive conversions, and establish your brand as an industry leader.",
    features: ["UI/UX Design", "Website Development", "E-commerce Solutions", "Performance Optimization"],
    path: "/services/web-design",
    gradient: "from-blue-500/20 to-cyan-500/20",
    stat: "200+ Sites",
  },
  {
    icon: Smartphone,
    title: "Mobile App Development",
    description: "Native and cross-platform mobile applications built for speed, scale, and exceptional user experience.",
    features: ["Android & iOS Apps", "Flutter Development", "API Integration", "App Maintenance"],
    path: "/services/mobile-app",
    gradient: "from-purple-500/20 to-pink-500/20",
    stat: "50+ Apps",
  },
  {
    icon: TrendingUp,
    title: "Digital Marketing",
    description: "Data-driven marketing strategies that bring qualified leads, increase visibility, and maximize ROI.",
    features: ["SEO Services", "Google Ads", "Social Media Marketing", "Content Marketing"],
    path: "/services/digital-marketing",
    gradient: "from-green-500/20 to-emerald-500/20",
    stat: "10M+ Reach",
  },
  {
    icon: Code2,
    title: "Software Solutions",
    description: "Custom software and automation tools designed to streamline operations and boost productivity.",
    features: ["CRM/ERP Systems", "Admin Panels", "Automation Tools", "Custom Integrations"],
    path: "/services/software-solutions",
    gradient: "from-orange-500/20 to-amber-500/20",
    stat: "100+ Systems",
  },
  {
    icon: Cloud,
    title: "Microsoft Office 365",
    description: "Complete Microsoft 365 setup, migration, and support services to modernize your workplace.",
    features: ["M365 Setup", "Business Email", "SharePoint & Teams", "Security Configuration"],
    path: "/services/microsoft-365",
    gradient: "from-indigo-500/20 to-violet-500/20",
    stat: "99.9% Uptime",
  },
];

const processSteps = [
  { num: "01", title: "Discovery", desc: "We analyze your requirements, goals, and target audience to craft a tailored strategy." },
  { num: "02", title: "Design", desc: "Our designers create stunning UI/UX mockups that align with your brand identity." },
  { num: "03", title: "Develop", desc: "Engineers build your solution using cutting-edge technologies and best practices." },
  { num: "04", title: "Deploy", desc: "We launch, test, and optimize your project for maximum performance and scalability." },
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const Services = () => {
  return (
    <SiteLayout>
      <SEOHead
        title="Services & SaaS Suite | Itoby Infotech Pvt Ltd (IIPL) - Web Design, Apps & Software"
        description="Explore digital agency services & proprietary SaaS by Itoby Infotech Pvt Ltd (IIPL): Web Design, Mobile Apps, Digital Marketing, Custom Software, Microsoft 365, IIPL Lead, Renting, Billing, Cashmemo & Calling for clients in India, USA, Canada, Australia, Dubai (UAE) & UK."
        path="/services"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Service",
          provider: {
            "@type": "Organization",
            name: "Itoby Infotech Pvt Ltd (IIPL)",
            url: "https://www.itobyinfotech.com",
          },
          serviceType: "Global Digital Agency & SaaS Engineering Services",
          areaServed: ["IN", "US", "CA", "AU", "AE", "GB"],
        }}
      />

      {/* 3D Animated Hero & Breadcrumbs */}
      <PageHeroBanner
        title="Complete Digital Solutions & Engineering"
        description="Comprehensive digital solutions engineered to transform your business, accelerate growth, and establish your brand authority."
        badge="End-to-End Digital Capability"
        breadcrumbs={[{ label: "Services" }]}
      />

      {/* Services List - Glassmorphism */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
        <div className="container-wide relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-8"
          >
            {services.map((service) => (
              <motion.div key={service.title} variants={fadeUp}>
                <Link
                  to={service.path}
                  className="group block relative p-8 md:p-12 rounded-3xl bg-card/50 backdrop-blur-xl border border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.15)] overflow-hidden"
                >
                  {/* Background gradient on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-8">
                    <div className="shrink-0">
                      <motion.div
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors border border-primary/10"
                      >
                        <service.icon size={40} className="text-primary" />
                      </motion.div>
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h2 className="font-display text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors">
                          {service.title}
                        </h2>
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                          {service.stat}
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-4 max-w-2xl">
                        {service.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {service.features.map((feature) => (
                          <span
                            key={feature}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 backdrop-blur-sm text-muted-foreground text-sm border border-border/30"
                          >
                            <CheckCircle size={12} className="text-primary" />
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <div className="w-12 h-12 rounded-full bg-secondary/50 backdrop-blur-sm flex items-center justify-center group-hover:bg-primary transition-colors border border-border/30 group-hover:border-primary/50">
                        <ArrowRight className="text-muted-foreground group-hover:text-primary-foreground transition-colors" size={24} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Process Section - Glassmorphism */}
      <section className="section-padding bg-card/30 relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
        <div className="container-wide relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-primary font-semibold uppercase tracking-wider text-sm">Our Process</span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
              How We <span className="gradient-text">Work</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              A proven process that delivers results, every time.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {processSteps.map((step) => (
              <motion.div
                key={step.num}
                variants={fadeUp}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="relative p-6 rounded-3xl bg-card/50 backdrop-blur-xl border border-border/50 hover:border-primary/50 transition-all group overflow-hidden text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <span className="text-5xl font-display font-bold text-primary/20 group-hover:text-primary/40 transition-colors">
                    {step.num}
                  </span>
                  <h3 className="font-display text-xl font-bold mt-2 mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <ServiceComparisonSection />
      <TestimonialsSection />
      <CTASection />
    </SiteLayout>
  );
};

export default Services;
