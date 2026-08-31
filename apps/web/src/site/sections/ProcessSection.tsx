import { motion, useInView } from "framer-motion";
import { Search, Palette, Code, TestTube, Rocket } from "lucide-react";
import { useRef } from "react";

import { Floating3DBubbles } from "@/site/ui/floating-3d-bubbles";

const steps = [
  { icon: Search, number: "01", title: "Discover & Strategy", description: "We analyze your business goals, target audience, and competition to create a winning strategy." },
  { icon: Palette, number: "02", title: "UI/UX Design", description: "Our designers craft intuitive, beautiful interfaces that resonate with your users." },
  { icon: Code, number: "03", title: "Development", description: "Expert developers bring designs to life with clean, scalable, and performant code." },
  { icon: TestTube, number: "04", title: "Testing & Launch", description: "Rigorous QA testing ensures a flawless launch across all devices and browsers." },
  { icon: Rocket, number: "05", title: "Growth & Support", description: "Ongoing optimization, maintenance, and support to keep you ahead of competition." },
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 60, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export const ProcessSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section className="section-padding relative overflow-hidden">
      <Floating3DBubbles count={15} />
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold uppercase tracking-wider text-sm">How We Work</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Our <span className="gradient-text">Proven Process</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            A structured approach that ensures every project is delivered on time,
            on budget, and beyond expectations.
          </p>
        </motion.div>

        <div className="relative">
          {/* Animated 3D Neon Connecting Beam */}
          <div className="hidden lg:block absolute top-1/3 left-10 right-10 h-1 bg-gradient-to-r from-primary/10 via-primary/60 to-primary/10 rounded-full shadow-[0_0_15px_hsl(var(--primary))] overflow-hidden -translate-y-1/2">
            <motion.div
              className="w-24 h-full bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_20px_#fff]"
              animate={{ x: ["-100%", "1000%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <motion.div
            ref={ref}
            variants={staggerContainer}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8"
          >
            {steps.map((step) => (
              <motion.div key={step.number} variants={fadeUp} className="relative">
                <div className="relative z-10 flex flex-col items-center text-center group">
                  <div className="relative mb-4 sm:mb-6">
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 8 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 flex items-center justify-center group-hover:border-primary/50 group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)] transition-all duration-500"
                    >
                      <step.icon size={24} className="text-primary sm:w-8 sm:h-8" />
                    </motion.div>
                    <motion.span
                      className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-bold flex items-center justify-center shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
                      whileHover={{ scale: 1.2 }}
                    >
                      {step.number}
                    </motion.span>
                  </div>
                  <h3 className="font-display text-sm sm:text-lg font-bold mb-1 sm:mb-2 group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
