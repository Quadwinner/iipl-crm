import { motion } from "framer-motion";
import { useRef } from "react";
import { AnimatedCounter } from "@/site/ui/animated-counter";
import { Code2, Trophy, Clock, Briefcase, Globe } from "lucide-react";

const stats = [
  { icon: Code2, value: 1200, suffix: "+", label: "Projects Delivered", description: "Successfully completed projects" },
  { icon: Trophy, value: 25, suffix: "+", label: "Awards Won", description: "Industry recognitions" },
  { icon: Clock, value: 11, suffix: "+", label: "Years Experience", description: "Delivering excellence" },
  { icon: Briefcase, value: 50, suffix: "+", label: "Team Members", description: "Expert professionals" },
  { icon: Globe, value: 8, suffix: "+", label: "Countries Served", description: "Global presence" },
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const StatsCounterSection = () => {
  const ref = useRef(null);

  return (
    <section ref={ref} className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-card/50 to-background" />
      <div className="absolute top-0 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />

      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold uppercase tracking-wider text-sm">Proven Track Record</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Numbers That Validate <span className="gradient-text">Our Success</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            A glance at the milestones that define our journey as a leading digital agency, delivering premium web design, 
            custom software development, and digital marketing solutions globally.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="relative group"
            >
              <div className="relative p-6 rounded-3xl bg-card/50 backdrop-blur-xl border border-border/50 hover:border-primary/50 transition-all duration-500 text-center h-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors"
                  >
                    <stat.icon className="text-primary" size={24} />
                  </motion.div>
                  <p className="text-3xl sm:text-4xl font-display font-bold text-primary mb-1">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2.5} margin="0px" />
                  </p>
                  <p className="font-medium text-foreground text-sm mb-1">{stat.label}</p>
                  <p className="text-muted-foreground text-xs hidden sm:block">{stat.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
