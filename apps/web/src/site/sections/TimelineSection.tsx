import { motion, useScroll, useTransform } from "framer-motion";
import { Rocket, Users, Trophy, Building, Globe, Star } from "lucide-react";
import { useRef } from "react";

const milestones = [
  { year: "2013", title: "Company Founded", description: "Started as a small web design studio in Patna with a vision to help local businesses go digital.", icon: Rocket },
  { year: "2015", title: "Team Expansion", description: "Grew to 10+ team members and expanded services to include mobile app development.", icon: Users },
  { year: "2017", title: "First Major Award", description: "Recognized as 'Best Digital Agency' at Bihar IT Awards for our innovative solutions.", icon: Trophy },
  { year: "2019", title: "New Office", description: "Moved to a larger office space to accommodate our growing team of 25+ professionals.", icon: Building },
  { year: "2021", title: "Global Reach", description: "Expanded services internationally, serving clients across 15+ countries.", icon: Globe },
  { year: "2024", title: "Industry Leader", description: "Completed 500+ projects and became a Microsoft 365 certified partner.", icon: Star },
];

export const TimelineSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold uppercase tracking-wider text-sm">Our Journey</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Milestones & <span className="gradient-text">Growth</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            A decade of innovation, growth, and commitment to excellence in digital solutions.
          </p>
        </motion.div>

        <div ref={containerRef} className="relative">
          {/* Static line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border/30 md:-translate-x-1/2" />
          {/* Animated progress line */}
          <motion.div
            className="absolute left-4 md:left-1/2 top-0 w-0.5 bg-primary md:-translate-x-1/2 origin-top"
            style={{ height: lineHeight }}
          />

          <div className="space-y-16">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? 60 : -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`relative flex flex-col md:flex-row gap-8 ${index % 2 === 0 ? "md:flex-row-reverse" : ""}`}
              >
                {/* Content */}
                <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : ""}`}>
                  <div className={`ml-12 md:ml-0 ${index % 2 === 0 ? "md:mr-12" : "md:ml-12"}`}>
                    <motion.div
                      whileHover={{ y: -5, transition: { duration: 0.3 } }}
                      className="relative p-6 rounded-3xl bg-card/50 backdrop-blur-xl border border-border/50 hover:border-primary/50 transition-all group overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                      <div className="relative z-10">
                        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold mb-3 border border-primary/20">
                          {milestone.year}
                        </span>
                        <h3 className="font-display text-xl font-bold mb-2">{milestone.title}</h3>
                        <p className="text-muted-foreground">{milestone.description}</p>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Icon - Glowing dot */}
                <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center">
                  <motion.div
                    whileHover={{ scale: 1.3 }}
                    className="relative w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
                  >
                    <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
                    <milestone.icon className="text-primary-foreground" size={14} />
                  </motion.div>
                </div>

                <div className="hidden md:block flex-1" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
