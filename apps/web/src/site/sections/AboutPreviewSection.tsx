
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, ShieldCheck, Sparkles, Terminal, Activity } from "lucide-react";
import { Button } from "@/site/ui/button";
import { useRef, useState } from "react";

const features = [
  "Custom Software & Web Solutions",
  "Agile Development & Goal-Driven Execution",
  "12 Months Dedicated Premium Support",
];

const listItemVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export const AboutPreviewSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x: x * 30, y: y * 30 });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <section className="section-padding relative overflow-hidden" ref={sectionRef}>
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
      <div className="container-wide relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* 3D Dashboard Mockup Container */}
          <motion.div
            initial={{ opacity: 0, x: -80, scale: 0.95 }}
            animate={isInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -80, scale: 0.95 }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            className="relative"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 rounded-3xl blur-2xl" />
            
            {/* Floating Badge 1 - Client Satisfaction */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute top-12 -left-6 z-20 hidden sm:flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl text-xs font-semibold text-foreground"
            >
              <CheckCircle className="text-primary" size={16} />
              <span>99% Client Satisfaction</span>
            </motion.div>

            {/* Floating Badge 2 - Agile Assured */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute top-6 -right-4 z-20 hidden sm:flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl text-xs font-semibold text-foreground"
            >
              <ShieldCheck className="text-primary animate-pulse" size={16} />
              <span>Agile Quality Assured</span>
            </motion.div>

            {/* 3D Perspective Card Container */}
            <motion.div
              style={{
                rotateX: -mousePos.y,
                rotateY: mousePos.x,
                transformStyle: "preserve-3d",
              }}
              className="relative w-full aspect-[4/3] rounded-3xl border border-border/50 bg-card/30 backdrop-blur-xl p-4 sm:p-6 overflow-hidden shadow-2xl flex items-center justify-center min-h-[300px] sm:min-h-[380px]"
            >
              {/* Tech lines grid background */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,hsl(var(--primary))_1px,transparent_1px)] bg-[size:24px_24px]" />
              <div className="absolute inset-10 rounded-full bg-gradient-to-tr from-primary/10 to-glow-secondary/10 blur-3xl opacity-60 pointer-events-none" />

              {/* Layer 1: Code Terminal Container */}
              <motion.div
                animate={{
                  y: [0, -6, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-6 sm:top-10 left-4 sm:left-8 w-[80%] sm:w-[70%] rounded-2xl border border-border/80 bg-background/95 p-3.5 sm:p-4 shadow-2xl font-mono text-[10px] sm:text-xs text-muted-foreground select-none"
              >
                <div className="flex items-center gap-1.5 border-b border-border/50 pb-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-destructive/80" />
                  <span className="w-2 h-2 rounded-full bg-amber-500/80" />
                  <span className="w-2 h-2 rounded-full bg-primary/80" />
                  <span className="ml-1 text-[8px] sm:text-[10px] text-muted-foreground/60 flex items-center gap-1">
                    <Terminal size={10} /> itoby-dev-server.js
                  </span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-cyan-400"><span className="text-muted-foreground/50">$</span> npm run build:agency</p>
                  <p className="text-primary/90">&gt; compiling custom software modules...</p>
                  <p className="text-foreground/90 font-semibold">&gt; web_design_system compiled [OK]</p>
                  <p className="text-glow-secondary/90 animate-pulse">&gt; sync connection to global databases: active</p>
                </div>
              </motion.div>

              {/* Layer 2: Metric Trendline Container */}
              <motion.div
                animate={{
                  y: [0, 8, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute bottom-6 sm:bottom-10 right-4 sm:right-8 w-[65%] sm:w-[55%] rounded-2xl border border-border/80 bg-card/95 p-4 sm:p-5 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] sm:text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Activity size={10} className="text-primary" /> System Traffic
                  </span>
                  <span className="text-[8px] sm:text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">+340%</span>
                </div>
                
                {/* Dynamic graph layout using CSS bars */}
                <div className="flex items-end gap-1.5 sm:gap-2 h-12 sm:h-16 pt-2">
                  <div className="w-full h-[30%] bg-border/80 rounded-sm" />
                  <div className="w-full h-[55%] bg-border/80 rounded-sm" />
                  <div className="w-full h-[40%] bg-border/80 rounded-sm" />
                  <div className="w-full h-[70%] bg-primary/30 rounded-sm" />
                  <div className="w-full h-[95%] bg-primary rounded-sm shadow-[0_0_15px_hsl(var(--primary)/0.4)]" />
                </div>
              </motion.div>

              {/* Layer 3: Tech Node Connections Map */}
              <motion.div
                animate={{
                  scale: [0.9, 1.1, 0.9],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-1/4 right-[8%] sm:right-[12%] p-2 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center shadow-lg"
              >
                <Sparkles className="text-primary animate-spin-slow" size={20} />
              </motion.div>
            </motion.div>

            {/* Experience Badge - Glassmorphism */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -20 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 15 }}
              whileHover={{ scale: 1.08, rotate: 3 }}
              className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/80 flex flex-col items-center justify-center shadow-2xl z-20"
            >
              <span className="text-2xl sm:text-4xl font-display font-bold text-primary">11+</span>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground text-center">Years of<br/>Experience</span>
            </motion.div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 80 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="space-y-6"
          >
            <span className="text-primary font-bold uppercase tracking-wider text-xs px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 inline-block shadow-sm">
              About Itoby Infotech Pvt Ltd (IIPL)
            </span>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              A Global Digital Engineering Partner{" "}
              <span className="gradient-text">Built to Scale Enterprises Worldwide</span>
            </h2>

            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              At <strong className="text-foreground font-bold">Itoby Infotech Pvt Ltd (IIPL)</strong>, we don't just build websites—we engineer enterprise SaaS applications, 
              custom software, AI voice calling bots, and high-converting web apps. Serving clients across <span className="text-foreground font-semibold">India, USA, Canada, Australia, Dubai (UAE) & UK</span>, 
              we combine bespoke software development with our suite of 5 proprietary IIPL SaaS platforms.
            </p>

            <motion.ul
              className="space-y-3"
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.6 } } }}
            >
              {features.map((feature, index) => (
                <motion.li
                  key={index}
                  variants={listItemVariants}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50"
                >
                  <CheckCircle className="text-primary shrink-0" size={18} />
                  <span className="text-foreground text-sm font-medium">{feature}</span>
                </motion.li>
              ))}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <Button variant="hero" size="lg" className="mt-4" asChild>
                <Link to="/about">
                  More About Us
                  <ArrowRight size={18} />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
