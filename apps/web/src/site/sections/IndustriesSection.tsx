import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Building2, ShoppingCart, Heart, GraduationCap, Factory, Banknote, ShieldCheck, Truck } from "lucide-react";

import { Floating3DBubbles } from "@/site/ui/floating-3d-bubbles";

const industries = [
  { icon: Banknote, name: "Fintech & Banking", slug: "fintech", projects: 25 },
  { icon: ShoppingCart, name: "Retail & E-Commerce", slug: "retail", projects: 40 },
  { icon: Heart, name: "Healthcare & MedTech", slug: "healthcare", projects: 18 },
  { icon: GraduationCap, name: "Education & EdTech", slug: "education", projects: 22 },
  { icon: Factory, name: "Manufacturing & IoT", slug: "manufacturing", projects: 15 },
  { icon: ShieldCheck, name: "Insurance & InsurTech", slug: "insurance", projects: 12 },
  { icon: Truck, name: "Logistics & Supply Chain", slug: "logistics", projects: 30 },
  { icon: Building2, name: "Real Estate & PropTech", slug: "real-estate", projects: 20 },
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

export const IndustriesSection = () => {
  return (
    <section className="section-padding bg-card/30 relative overflow-hidden">
      <Floating3DBubbles count={16} />
      <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold uppercase tracking-wider text-sm">Global Industry Solutions</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Digital Innovation Across <span className="gradient-text">Key Industries</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            We deliver bespoke custom software development, AI solutions, and SaaS platforms
            tailored to solve business problems across major global industries.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {industries.map((industry) => (
            <motion.div
              key={industry.slug}
              variants={fadeUp}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group"
            >
              <Link
                to={`/industries/${industry.slug}`}
                className="block p-6 rounded-3xl bg-card/50 backdrop-blur-xl border border-border/50 hover:border-primary/50 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] transition-all duration-500 text-center h-full cursor-pointer overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                    <industry.icon size={26} />
                  </div>
                  <h3 className="font-display font-bold text-base text-foreground mb-1 group-hover:text-primary transition-colors">
                    {industry.name}
                  </h3>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {industry.projects}+ Case Studies
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
