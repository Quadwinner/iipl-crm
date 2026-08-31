import { motion } from "framer-motion";
import {
  Zap, Palette, Search, Headphones, Shield, BadgeIndianRupee
} from "lucide-react";

import { Floating3DBubbles } from "@/site/ui/floating-3d-bubbles";

const features = [
  { icon: Zap, title: "Fast Delivery", description: "Lightning-fast project turnaround without compromising on quality. Your time matters to us." },
  { icon: Palette, title: "Modern Design", description: "Cutting-edge aesthetics that captivate audiences and set your brand apart from competition." },
  { icon: Search, title: "SEO Optimized", description: "Built for visibility from day one. Every project is optimized for search engine performance." },
  { icon: Headphones, title: "24/7 Support", description: "Round-the-clock dedicated support to ensure your digital presence never misses a beat." },
  { icon: Shield, title: "Secure & Reliable", description: "Enterprise-grade security and 99.9% uptime guarantee for peace of mind." },
  { icon: BadgeIndianRupee, title: "Best Pricing", description: "Premium quality at competitive rates. Maximum value for your investment." },
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const WhyChooseUsSection = () => {
  return (
    <section className="section-padding relative overflow-hidden">
      <Floating3DBubbles count={18} />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      <div className="absolute top-1/4 left-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />

      {/* Decorative rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-primary/5"
      />

      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold uppercase tracking-wider text-sm">Our Strategic Advantage</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Engineered for Digital <span className="gradient-text">Success & Growth</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            We merge technical software engineering with conversion-focused design to deliver 
            custom digital products that rank higher, engage audiences, and drive real business growth.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative"
            >
              <div className="relative p-8 rounded-3xl bg-card/50 backdrop-blur-xl border border-border/50 hover:border-primary/50 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] transition-all duration-500 h-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                <div className="relative w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-6">
                  <feature.icon size={28} className="text-primary" />
                </div>

                <h3 className="relative font-display text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="relative text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>

                <span className="absolute top-6 right-6 text-6xl font-display font-bold text-border/20 group-hover:text-primary/15 transition-colors duration-300">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
