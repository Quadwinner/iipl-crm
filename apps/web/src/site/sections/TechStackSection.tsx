import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Floating3DBubbles } from "@/site/ui/floating-3d-bubbles";
import { TechStack3DOrbit } from "@/site/ui/tech-stack-3d-orbit";
import { TechArchitectureModal } from "@/site/ui/tech-architecture-modal";
import { Button } from "@/site/ui/button";
import { Activity, ArrowRight } from "lucide-react";

const techStack = [
  { name: "Next.js", slug: "nextjs", category: "Frontend" },
  { name: "React", slug: "react", category: "Frontend" },
  { name: "Node.js", slug: "nodejs", category: "Backend" },
  { name: "Python", slug: "python", category: "Backend" },
  { name: "Supabase", slug: "supabase-development", category: "Cloud" },
  { name: "PostgreSQL", slug: "postgresql-development", category: "Backend" },
  { name: "OpenAI API", slug: "openai-integration", category: "AI" },
  { name: "AI Automation", slug: "ai-automation", category: "AI" },
];

const categoryGlows: Record<string, string> = {
  Frontend: "hover:border-cyan-500/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]",
  Backend: "hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]",
  AI: "hover:border-primary/50 hover:shadow-[0_0_25px_hsl(var(--primary)/0.25)]",
  Cloud: "hover:border-sky-500/50 hover:shadow-[0_0_25px_rgba(14,165,233,0.25)]",
};

export const TechStackSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isArchOpen, setIsArchOpen] = useState(false);

  const categories = [
    "All",
    "Frontend",
    "Backend",
    "AI",
    "Cloud",
  ];

  const filteredTech = activeCategory === "All"
    ? techStack
    : techStack.filter(tech => tech.category === activeCategory);

  return (
    <section className="section-padding bg-card/30 relative overflow-hidden">
      <TechArchitectureModal
        isOpen={isArchOpen}
        onClose={() => setIsArchOpen(false)}
      />
      <Floating3DBubbles count={20} />
      <TechStack3DOrbit />
      <div className="container-wide relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-primary font-semibold uppercase tracking-wider text-sm"
          >
            Capabilities
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6"
          >
            Engineering <span className="gradient-text">Tech Stack</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-muted-foreground text-lg"
          >
            We leverage high-throughput cloud architectures to build solutions that are 
            sub-second fast, secure, and future-proof.
          </motion.p>
        </motion.div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 max-w-4xl mx-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 relative ${
                activeCategory === category
                  ? "text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground bg-card/40 border border-border/50"
              }`}
            >
              {activeCategory === category && (
                <motion.div
                  layoutId="activeTechTab"
                  className="absolute inset-0 bg-primary rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {category}
            </button>
          ))}
        </div>

        {/* Tech Grid */}
        <motion.div
          ref={ref}
          layout
          className="flex flex-wrap justify-center gap-3 sm:gap-4 min-h-[120px] mb-12"
        >
          <AnimatePresence mode="popLayout">
            {filteredTech.map((tech) => (
              <motion.div
                key={tech.slug}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                whileHover={{ 
                  scale: 1.08, 
                  y: -6,
                  transition: { duration: 0.2 }
                }}
              >
                <Link
                  to={`/technology/${tech.slug}`}
                  className={`block px-5 py-3 rounded-xl bg-card border border-border transition-all duration-300 cursor-pointer text-center ${
                    categoryGlows[tech.category] || "hover:border-primary/50"
                  }`}
                >
                  <p className="font-bold text-sm text-foreground hover:text-primary transition-colors">{tech.name}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">{tech.category}</p>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* System Architecture Blueprint Button */}
        <div className="text-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsArchOpen(true)}
            className="rounded-2xl gap-2 border-primary/40 text-primary hover:bg-primary/10 shadow-lg shadow-primary/10"
          >
            <Activity className="w-4 h-4" /> Inspect System Architecture Blueprints <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
