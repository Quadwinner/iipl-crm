
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import { Globe, Smartphone, TrendingUp, Code2, Cloud, ArrowUpRight, Sparkles, Bot, Building2, Receipt, FileSpreadsheet, PhoneCall, ExternalLink } from "lucide-react";
import { TiltCard } from "@/site/ui/tilt-card";
import { Floating3DBubbles } from "@/site/ui/floating-3d-bubbles";

export interface ServiceItem {
  icon: any;
  title: string;
  description: string;
  path: string;
  category: "saas" | "development" | "marketing" | "cloud";
  isSaaS?: boolean;
  isExternal?: boolean;
  badge?: string;
}

const services: ServiceItem[] = [
  // IIPL SaaS Products
  {
    icon: Bot,
    title: "IIPL Lead",
    description: "AI Cold Email & B2B Lead Generation CRM. Google Maps scraper, 15s AI site auditor & outreach outbox.",
    path: "https://lead.itobyinfotech.com",
    category: "saas",
    isSaaS: true,
    isExternal: true,
    badge: "Flagship SaaS",
  },
  {
    icon: Building2,
    title: "IIPL Renting",
    description: "Enterprise commercial office leasing & tenant CRM. Rent collection, agreement generator & fleet tracking.",
    path: "/app/rental",
    category: "saas",
    isSaaS: true,
    isExternal: true,
    badge: "PropTech CRM",
  },
  {
    icon: Receipt,
    title: "IIPL Billing",
    description: "Automated GST invoicing, client ledgers, retainer subscriptions & payment gateway integration.",
    path: "https://billing.itobyinfotech.com",
    category: "saas",
    isSaaS: true,
    isExternal: true,
    badge: "FinTech GST",
  },
  {
    icon: FileSpreadsheet,
    title: "IIPL Cashmemo",
    description: "Instant retail cash invoice generator. Instant WhatsApp PDF sharing & thermal printer ready.",
    path: "https://cashmemo.itobyinfotech.com",
    category: "saas",
    isSaaS: true,
    isExternal: true,
    badge: "POS Receipts",
  },
  {
    icon: PhoneCall,
    title: "IIPL Calling",
    description: "Autonomous conversational AI voice agents for restaurant table bookings, insurance renewals & follow-ups.",
    path: "https://royalblue-ant-234341.hostingersite.com/",
    category: "saas",
    isSaaS: true,
    isExternal: true,
    badge: "Voice AI Bot",
  },

  // Core Digital Services
  {
    icon: Code2,
    title: "Custom Software Development",
    description: "Bespoke enterprise software, microservices architecture, and scalable workflow automation.",
    path: "/services/custom-software-development",
    category: "development",
  },
  {
    icon: Bot,
    title: "AI Development Services",
    description: "Enterprise RAG AI models, LLM fine-tuning, and intelligent automation systems.",
    path: "/services/ai-development-company",
    category: "development",
  },
  {
    icon: Sparkles,
    title: "SaaS Development Company",
    description: "Multi-tenant cloud SaaS products with Supabase PostgreSQL RLS and sub-second performance.",
    path: "/services/saas-development-company",
    category: "development",
  },
  {
    icon: Globe,
    title: "Web Design & Development",
    description: "High-converting Next.js 15 web applications engineered for 100/100 Core Web Vitals.",
    path: "/services/web-design",
    category: "development",
  },
  {
    icon: Smartphone,
    title: "Mobile App Development",
    description: "Native iOS, Android, and Flutter cross-platform apps built for high scale.",
    path: "/services/mobile-app",
    category: "development",
  },
  {
    icon: Bot,
    title: "AI Agent Development",
    description: "Autonomous multi-tool AI agents capable of planning and executing complex API workflows.",
    path: "/services/ai-agent-development",
    category: "development",
  },
  {
    icon: PhoneCall,
    title: "AI Chatbot Development",
    description: "24/7 conversational RAG AI chatbots for customer support and lead intake.",
    path: "/services/ai-chatbot-development",
    category: "development",
  },
  {
    icon: Building2,
    title: "ERP Software Development",
    description: "Custom ERP systems for manufacturing, inventory control, and financial operations.",
    path: "/services/erp-development",
    category: "development",
  },
  {
    icon: TrendingUp,
    title: "CRM Software Development",
    description: "Tailored sales pipeline CRMs, lead scoring automation, and tenant portals.",
    path: "/services/crm-development",
    category: "development",
  },
  {
    icon: TrendingUp,
    title: "Digital Marketing",
    description: "Data-driven SEO, GEO AI search optimization, and performance marketing.",
    path: "/services/digital-marketing",
    category: "marketing",
  },
  {
    icon: Cloud,
    title: "Microsoft Office 365",
    description: "Enterprise Microsoft 365 cloud migration, security compliance, and licensing.",
    path: "/services/microsoft-365",
    category: "cloud",
  },
];

export const ServicesSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", label: "All Services & SaaS" },
    { id: "saas", label: "IIPL SaaS & AI Suite", isHighlight: true },
    { id: "development", label: "Development & Design" },
    { id: "marketing", label: "Marketing" },
    { id: "cloud", label: "Cloud Services" },
  ];

  const filteredServices =
    activeCategory === "all"
      ? services
      : services.filter((service) => service.category === activeCategory);

  return (
    <section className="section-padding bg-card/30 relative overflow-hidden" id="services-section">
      <Floating3DBubbles count={20} />
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />

      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="text-primary font-bold uppercase tracking-wider text-xs px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 inline-flex items-center gap-1.5 shadow-sm mb-4">
            <Sparkles size={14} className="animate-pulse" />
            Engineered by Itoby Infotech Pvt Ltd (IIPL)
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mt-2 mb-5">
            Services & SaaS Engineered to <span className="gradient-text">Scale Your Business</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            Explore premium web design, mobile apps, digital marketing & our proprietary <span className="text-foreground font-bold">IIPL SaaS & AI Voice Platforms</span> built for enterprise efficiency.
          </p>
        </motion.div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 relative cursor-pointer ${
                activeCategory === category.id
                  ? "text-primary-foreground font-extrabold shadow-lg"
                  : category.isHighlight
                  ? "text-primary bg-primary/10 border border-primary/30 hover:bg-primary/20"
                  : "text-muted-foreground hover:text-foreground bg-card/60 border border-border/60 hover:bg-secondary"
              }`}
            >
              {activeCategory === category.id && (
                <motion.div
                  layoutId="activeServiceTab"
                  className="absolute inset-0 bg-primary rounded-full -z-10 shadow-lg shadow-primary/25"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="flex items-center gap-1.5">
                {category.isHighlight && <Sparkles size={13} className="text-primary animate-pulse" />}
                {category.label}
              </span>
            </button>
          ))}
        </div>

        <motion.div
          ref={ref}
          layout
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.title}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="h-full"
                >
                  <TiltCard className="h-full">
                    {service.isExternal ? (
                      <a
                        href={service.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block h-full p-7 rounded-3xl bg-card/70 backdrop-blur-xl border border-border/80 hover:border-primary/80 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.25)] relative overflow-hidden flex flex-col justify-between"
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-5">
                            <motion.div
                              className="w-13 h-13 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-md"
                              whileHover={{ rotate: 5, scale: 1.05 }}
                            >
                              <Icon size={24} className="text-primary group-hover:text-primary-foreground transition-colors" />
                            </motion.div>

                            <div className="flex items-center gap-1.5">
                              {service.badge && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-primary/15 text-primary border border-primary/30">
                                  {service.badge}
                                </span>
                              )}
                              <ExternalLink
                                size={18}
                                className="text-primary opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"
                              />
                            </div>
                          </div>

                          <h3 className="font-display text-xl font-extrabold mb-2.5 group-hover:text-primary transition-colors flex items-center gap-2">
                            {service.title}
                          </h3>
                          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                            {service.description}
                          </p>
                        </div>

                        <div className="relative z-10 pt-4 mt-4 border-t border-border/50 flex items-center justify-between text-xs font-bold text-primary">
                          <span>Launch SaaS Platform</span>
                          <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </div>
                      </a>
                    ) : (
                      <Link
                        to={service.path}
                        className="group block h-full p-7 rounded-3xl bg-card/70 backdrop-blur-xl border border-border/80 hover:border-primary/80 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.25)] relative overflow-hidden flex flex-col justify-between"
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-5">
                            <motion.div
                              className="w-13 h-13 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-md"
                              whileHover={{ rotate: 5, scale: 1.05 }}
                            >
                              <Icon size={24} className="text-primary group-hover:text-primary-foreground transition-colors" />
                            </motion.div>

                            <div className="flex items-center gap-1.5">
                              {service.badge && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-primary/15 text-primary border border-primary/30">
                                  {service.badge}
                                </span>
                              )}
                              <ArrowUpRight
                                size={22}
                                className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transform translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-all"
                              />
                            </div>
                          </div>

                          <h3 className="font-display text-xl font-extrabold mb-2.5 group-hover:text-primary transition-colors">
                            {service.title}
                          </h3>
                          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                            {service.description}
                          </p>
                        </div>

                        <div className="relative z-10 pt-4 mt-4 border-t border-border/50 flex items-center justify-between text-xs font-bold text-primary">
                          <span>View Details</span>
                          <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </div>
                      </Link>
                    )}
                  </TiltCard>
                </motion.div>
              );
            })}

            {/* CTA Card */}
            <motion.div
              layout
              key="cta-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="h-full"
            >
              <TiltCard className="h-full">
                <Link
                  to="/services"
                  className="group flex flex-col items-center justify-center h-full p-8 rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 backdrop-blur-xl border border-primary/30 hover:border-primary transition-all duration-500 hover:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.25)]"
                >
                  <motion.div
                    className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 shadow-lg"
                    whileHover={{ scale: 1.15, rotate: 45 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <ArrowUpRight size={32} className="text-primary" />
                  </motion.div>
                  <p className="font-display text-lg font-extrabold text-center text-foreground group-hover:text-primary transition-colors">
                    Explore All Services & SaaS
                  </p>
                </Link>
              </TiltCard>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};
