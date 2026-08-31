import { motion, useInView } from "framer-motion";
import { Award, Star, Trophy, Medal } from "lucide-react";
import { useRef } from "react";

const awards = [
  { icon: Trophy, title: "Best Web Agency", year: "2024", organization: "Digital Excellence Awards" },
  { icon: Award, title: "Top IT Service Provider", year: "2023", organization: "India Tech Awards" },
  { icon: Star, title: "5-Star Rating", year: "2024", organization: "Google Business" },
  { icon: Medal, title: "Certified Partner", year: "2024", organization: "Microsoft 365" },
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export const AwardsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section className="py-12 sm:py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-card/30" />
      <div className="absolute top-0 right-1/3 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h3 className="font-display text-xl sm:text-2xl font-bold text-center sm:text-left">
            Awards & <span className="text-primary">Recognition</span>
          </h3>
        </motion.div>

        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {awards.map((award) => (
            <motion.div
              key={award.title}
              variants={fadeUp}
              whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.3 } }}
              className="group p-4 sm:p-6 rounded-3xl bg-card/50 backdrop-blur-xl border border-border/50 hover:border-primary/50 transition-all duration-500 text-center overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <motion.div
                  whileHover={{ rotate: 15, scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors"
                >
                  <award.icon size={24} className="text-primary" />
                </motion.div>
                <h4 className="font-display font-bold text-sm sm:text-base mb-1 group-hover:text-primary transition-colors">
                  {award.title}
                </h4>
                <p className="text-xs text-primary font-semibold mb-1">{award.year}</p>
                <p className="text-xs text-muted-foreground">{award.organization}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
