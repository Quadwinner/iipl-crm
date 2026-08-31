
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowUpRight,
  ExternalLink,
  Bot,
  Building2,
  Receipt,
  FileSpreadsheet,
  PhoneCall,
  CheckCircle2,
  Zap,
  Globe2,
  ShieldCheck,
  Building,
} from "lucide-react";
import { Button } from "@/site/ui/button";
import { TiltCard } from "@/site/ui/tilt-card";
import { Floating3DBubbles } from "@/site/ui/floating-3d-bubbles";

export interface SaasProduct {
  id: string;
  shortName: string;
  fullName: string;
  tagline: string;
  description: string;
  url?: string;
  icon: any;
  category: string;
  badge: string;
  gradient: string;
  features: string[];
  metrics: string;
}

export const saasProducts: SaasProduct[] = [
  {
    id: "lead",
    shortName: "IIPL Lead",
    fullName: "IIPL Lead — AI Cold Email & B2B Lead Automation",
    tagline: "Flagship B2B Prospecting & Cold Email CRM",
    description:
      "All-in-one B2B sales automation engine. Scrape Google Maps leads, audit target websites in 15s with AI, write custom pitch proposals, and dispatch multi-sender cold email campaigns.",
    url: "https://lead.itobyinfotech.com",
    icon: Bot,
    category: "AI Sales Automation",
    badge: "Flagship Product",
    gradient: "from-indigo-500 via-purple-500 to-pink-500",
    features: ["Google Maps Scraper", "AI Site Auditor", "Multi-Sender Outbox", "AI Proposals"],
    metrics: "4x Lead Velocity",
  },
  {
    id: "renting",
    shortName: "IIPL Renting",
    fullName: "IIPL Renting — Office Renting & Tenant CRM",
    tagline: "Commercial Office Leasing & Property Management",
    description:
      "Enterprise office space renting and tenant management SaaS. Automate rent collection, tenant onboarding, agreement generation, and fleet occupancy tracking.",
    url: "/app/rental",
    icon: Building2,
    category: "PropTech & Rental SaaS",
    badge: "Office Leasing",
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    features: ["Tenant Management", "Auto Rent Reminders", "Agreement Generator", "Fleet Analytics"],
    metrics: "0% Overbooking",
  },
  {
    id: "billing",
    shortName: "IIPL Billing",
    fullName: "IIPL Billing — GST Invoice & Revenue SaaS",
    tagline: "Automated GST Invoicing & Client Ledgers",
    description:
      "Next-gen GST billing and accounting software. Generate tax invoices, track client ledgers, manage recurring retainer billing, and integrate payment gateways.",
    url: "https://billing.itobyinfotech.com",
    icon: Receipt,
    category: "FinTech & Invoicing",
    badge: "GST Approved",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    features: ["Instant GST Invoices", "E-Way Sync", "Recurring Retainers", "Multi-Currency"],
    metrics: "100% Tax Compliant",
  },
  {
    id: "cashmemo",
    shortName: "IIPL Cashmemo",
    fullName: "IIPL Cashmemo — Digital Cash Receipt Generator",
    tagline: "Instant Retail Cash Memo & Receipt Platform",
    description:
      "Super-fast digital cash memo & cash invoice generator for retail stores, agencies, and vendors. Instant WhatsApp PDF sharing and thermal print compatibility.",
    url: "https://cashmemo.itobyinfotech.com",
    icon: FileSpreadsheet,
    category: "Retail & POS Billing",
    badge: "Instant Receipts",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    features: ["Instant Cash Memos", "WhatsApp PDF Share", "Thermal Print Ready", "Daily Cash Registry"],
    metrics: "Instant PDF",
  },
  {
    id: "calling",
    shortName: "IIPL Calling",
    fullName: "IIPL Calling — AI Restaurant & Sales Voice Agents",
    tagline: "Conversational AI Phone Calling & Voice Bots",
    description:
      "Autonomous conversational AI voice agents for restaurant table reservations, insurance policy renewal reminders, lead qualification, and cold sales calling.",
    url: "https://royalblue-ant-234341.hostingersite.com/",
    icon: PhoneCall,
    category: "Voice AI & Telecom",
    badge: "Voice AI",
    gradient: "from-rose-500 via-purple-500 to-indigo-500",
    features: ["AI Restro Calling", "Insurance Renewal Bot", "Real-Time Voice AI", "Appointment Scheduler"],
    metrics: "24/7 AI Voice",
  },
];

export const SaasProductsSection = () => {
  return (
    <section className="section-padding relative overflow-hidden bg-background">
      {/* 3D Glass Floating Orbs */}
      <Floating3DBubbles count={20} />

      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-accent/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="container-wide relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4.5 py-2 rounded-full bg-primary/10 border border-primary/20 mb-5 shadow-xl">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-primary text-xs font-extrabold uppercase tracking-widest">
              SaaS Ecosystem by Itoby Infotech Pvt Ltd (IIPL)
            </span>
          </div>

          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5">
            Proprietary <span className="bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">IIPL SaaS Products</span> & AI Suite
          </h2>

          <p className="text-muted-foreground text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
            In addition to custom client engineering, <span className="text-foreground font-bold">Itoby Infotech Pvt Ltd (IIPL)</span> develops and operates enterprise SaaS products & AI automation platforms designed for global business scalability.
          </p>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-primary">
            <ShieldCheck size={14} />
            <span>Note: IIPL is the official registered abbreviation for Itoby Infotech Pvt Ltd</span>
          </div>
        </motion.div>

        {/* 5 SaaS Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {saasProducts.map((prod, idx) => {
            const Icon = prod.icon;
            return (
              <motion.div
                key={prod.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={idx === 0 ? "md:col-span-2 lg:col-span-1" : ""}
              >
                <TiltCard className="h-full">
                  <div className="relative overflow-hidden rounded-3xl min-h-[440px] h-full bg-card/80 backdrop-blur-2xl border border-white/15 dark:border-primary/25 hover:border-primary/80 transition-all duration-500 shadow-2xl hover:shadow-[0_25px_60px_-15px_hsl(var(--primary)/0.35)] p-6 sm:p-7 flex flex-col justify-between group card-shimmer-effect">
                    
                    {/* Top Glow Accent Bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${prod.gradient}`} />

                    {/* Top Badge & Metric Row */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-md">
                          <Icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/10 text-foreground border border-white/15">
                            {prod.badge}
                          </span>
                          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md">
                            {prod.metrics}
                          </span>
                        </div>
                      </div>

                      {/* Header */}
                      <span className="text-[11px] font-extrabold text-primary uppercase tracking-widest block mb-1">
                        {prod.category}
                      </span>
                      <h3 className="font-display text-2xl font-extrabold text-foreground group-hover:text-primary transition-colors leading-tight mb-2">
                        {prod.shortName}
                      </h3>
                      <p className="text-xs font-semibold text-muted-foreground mb-3">
                        {prod.tagline}
                      </p>
                      <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-6 line-clamp-3">
                        {prod.description}
                      </p>

                      {/* Features List */}
                      <div className="grid grid-cols-2 gap-2 mb-6 pt-4 border-t border-border/50">
                        {prod.features.map((feat) => (
                          <div key={feat} className="flex items-center gap-1.5 text-xs font-medium text-foreground/90">
                            <CheckCircle2 size={13} className="text-primary shrink-0" />
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom CTA Row */}
                    <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-3 mt-auto">
                      {prod.url ? (
                        prod.url.startsWith("/") ? (
                          <Link
                            to={prod.url}
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            <Globe2 size={13} />
                            <span>Open in your workspace</span>
                          </Link>
                        ) : (
                          <a
                            href={prod.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            <Globe2 size={13} />
                            <span>{prod.url.replace("https://", "")}</span>
                          </a>
                        )
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                          <Zap size={13} className="text-primary" />
                          Enterprise Voice AI
                        </span>
                      )}

                      {prod.url ? (
                        <Button asChild size="sm" className="rounded-xl font-bold gap-1.5 shadow-lg shadow-primary/25">
                          {prod.url.startsWith("/") ? (
                            <Link to={prod.url}>
                              Launch SaaS
                              <ArrowUpRight size={13} />
                            </Link>
                          ) : (
                            <a href={prod.url} target="_blank" rel="noopener noreferrer">
                              Launch SaaS
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </Button>
                      ) : (
                        <Button asChild size="sm" variant="outline" className="rounded-xl font-bold gap-1.5 border-primary/30 hover:border-primary">
                          <Link to="/contact">
                            Request Demo
                            <ArrowUpRight size={13} />
                          </Link>
                        </Button>
                      )}
                    </div>

                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>

        {/* Global IIPL Enterprise Bottom Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-14 p-8 rounded-3xl bg-card/60 backdrop-blur-2xl border border-border/80 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-display text-xl font-extrabold text-foreground flex items-center justify-center md:justify-start gap-2">
              <Building size={20} className="text-primary" />
              Need a Custom Enterprise SaaS or AI Solution?
            </h4>
            <p className="text-muted-foreground text-sm">
              Our engineering team at <strong className="text-foreground">Itoby Infotech Pvt Ltd (IIPL)</strong> builds white-label SaaS, rental platforms, billing software, and custom AI agents.
            </p>
          </div>

          <Button asChild size="lg" className="rounded-2xl font-bold gap-2 shrink-0 shadow-xl shadow-primary/25">
            <Link to="/request-quote">
              Get SaaS Estimate
              <ArrowUpRight size={16} />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
