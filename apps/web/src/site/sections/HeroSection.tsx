
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Code, Globe, Smartphone, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/site/ui/button";
import { AnimatedCounter } from "@/site/ui/animated-counter";
import { GlowingParticles3D } from "@/site/ui/glowing-particles-3d";
import { useRef, useState, useEffect } from "react";
import heroBg from "@/site/assets/hero-bg.jpg";

const rotatingWords = ["Websites", "Apps", "Brands", "Campaigns"];

const stats = [
  { value: 1200, suffix: "+", label: "Projects Delivered" },
  { value: 50, suffix: "+", label: "Happy Clients" },
  { value: 11, suffix: "+", label: "Years Experience" },
];

const floatingIcons = [
  { Icon: Code, delay: 0 },
  { Icon: Globe, delay: 0.5 },
  { Icon: Smartphone, delay: 1 },
  { Icon: TrendingUp, delay: 1.5 },
];

// Text reveal animation variants
const textRevealVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const letterVariants = {
  hidden: { opacity: 0, y: 100 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const [wordIndex, setWordIndex] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });


  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const rafId = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafId.current !== null) return;

    rafId.current = requestAnimationFrame(() => {
      const innerWidth = window.innerWidth || 1200;
      const innerHeight = window.innerHeight || 800;
      const x = (clientX / innerWidth - 0.5) * 20;
      const y = (clientY / innerHeight - 0.5) * 20;
      setMousePos({ x, y });
      rafId.current = null;
    });
  };

  const bgUrl = typeof heroBg === "string" ? heroBg : (heroBg as any)?.src || heroBg;

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-[90vh] sm:min-h-screen flex items-center justify-center overflow-hidden bg-background"
    >
      {/* Interactive 3D Glowing Particle Canvas */}
      <GlowingParticles3D count={60} interactive={true} />

      {/* Background Image with Parallax */}
      <motion.div
        style={{ y: backgroundY }}
        className="absolute inset-0 z-0 overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 scale-105"
          style={{ backgroundImage: `url(${bgUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      </motion.div>

      {/* Cyber Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] lg:w-[800px] h-[300px] sm:h-[500px] lg:h-[800px] rounded-full bg-primary/5 blur-[120px] sm:blur-[180px] pointer-events-none"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-10 w-[250px] sm:w-[400px] lg:w-[600px] h-[250px] sm:h-[400px] lg:h-[600px] rounded-full bg-glow-secondary/5 blur-[100px] sm:blur-[160px] pointer-events-none"
        />

        {/* 3D Glass Orbs */}
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-24 sm:w-32 h-24 sm:h-32 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-3xl hidden md:block"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/3 w-[200px] sm:w-[300px] lg:w-[400px] h-[200px] sm:h-[300px] lg:h-[400px] rounded-full bg-primary/5 blur-[80px] sm:blur-[120px] hidden sm:block pointer-events-none"
        />
      </div>

      {/* Floating Particles - fewer on mobile */}
      {[
        { left: "15.5%", top: "72.4%", duration: 3.5, delay: 0.2, x: 15 },
        { left: "35.2%", top: "85.1%", duration: 4.2, delay: 1.1, x: -20 },
        { left: "55.8%", top: "65.3%", duration: 3.8, delay: 0.5, x: 25 },
        { left: "75.1%", top: "90.2%", duration: 4.8, delay: 1.8, x: -15 },
        { left: "25.4%", top: "75.7%", duration: 3.2, delay: 2.3, x: 10 },
        { left: "45.9%", top: "94.6%", duration: 4.5, delay: 0.8, x: -25 },
        { left: "65.3%", top: "80.4%", duration: 3.9, delay: 1.4, x: 20 },
        { left: "85.7%", top: "68.9%", duration: 4.1, delay: 2.1, x: -10 },
      ].map((particle, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.5, 0],
            y: [0, -100],
            x: [0, particle.x],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeOut",
          }}
          className="absolute w-1 h-1 rounded-full bg-primary/50 hidden sm:block"
          style={{
            left: particle.left,
            top: particle.top,
          }}
        />
      ))}

      <motion.div style={{ y: textY, opacity }} className="container-wide relative z-10 pt-24 sm:pt-32 pb-16 sm:pb-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div className="space-y-6 sm:space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
            >
              <motion.span 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-primary"
              />
              <span className="text-xs sm:text-sm font-semibold text-foreground dark:text-primary">
                Itoby Infotech Pvt Ltd (IIPL) • Global Digital Agency & Enterprise SaaS Lab
              </span>
              <Sparkles size={14} className="text-primary" />
            </motion.div>

            {/* Headline with Letter Animation */}
            <div className="overflow-hidden">
              <motion.h1
                initial="hidden"
                animate="visible"
                className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.1]"
              >
                <motion.span 
                  custom={0}
                  variants={textRevealVariants}
                  className="block"
                >
                  We Build
                </motion.span>
                <motion.span 
                  custom={1}
                  variants={textRevealVariants}
                  className="block"
                >
                  {"High-Converting".split("").map((letter, i) => (
                    <motion.span
                      key={i}
                      custom={i}
                      variants={letterVariants}
                      initial="hidden"
                      animate="visible"
                      className="inline-block gradient-text"
                    >
                      {letter === " " ? "\u00A0" : letter}
                    </motion.span>
                  ))}
                </motion.span>
                <motion.span 
                  custom={2}
                  variants={textRevealVariants}
                  className="block"
                >
                  Digital{" "}
                  <span className="inline-block relative h-[1.1em] overflow-hidden align-bottom">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={wordIndex}
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -40, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="inline-block gradient-text"
                      >
                        {rotatingWords[wordIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </motion.span>
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed"
            >
              <strong className="text-foreground font-bold">Itoby Infotech Pvt Ltd (IIPL)</strong> is a premier global digital engineering agency and SaaS software lab. 
              We build Next.js applications, mobile apps, custom software, digital marketing, and proprietary <span className="text-primary font-semibold">IIPL SaaS & AI Voice Platforms</span> for clients across India, USA, Canada, Australia, Dubai (UAE), UK & worldwide.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              <Button variant="hero" size="lg" className="w-full sm:w-auto group font-bold shadow-lg shadow-primary/25" asChild>
                <Link to="/contact">
                  Discuss Your Project
                  <motion.span
                    className="inline-block"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight size={20} />
                  </motion.span>
                </Link>
              </Button>
              <Button variant="hero-outline" size="lg" className="w-full sm:w-auto group font-semibold" asChild>
                <Link to="/services">
                  Explore Our Services
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap gap-6 sm:gap-8 pt-6 sm:pt-8 border-t border-border"
            >
              {stats.map((stat, index) => (
                <motion.div 
                  key={index} 
                  className="space-y-1"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <p className="text-2xl sm:text-3xl font-display font-bold text-primary">
                    <AnimatedCounter 
                      value={stat.value} 
                      suffix={stat.suffix}
                      duration={2}
                    />
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Visual Element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block relative"
          >
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Interactive Floating Widgets */}
              <motion.div
                style={{
                  x: mousePos.x * 1.2,
                  y: mousePos.y * 1.2,
                }}
                className="absolute -top-6 -left-16 z-20 hidden xl:flex items-center gap-3 p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/80 shadow-2xl hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <TrendingUp size={20} className="text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Conversion</p>
                  <h4 className="text-sm font-bold font-display text-foreground">+124% Growth</h4>
                </div>
              </motion.div>

              <motion.div
                style={{
                  x: -mousePos.x * 0.8,
                  y: -mousePos.y * 0.8,
                }}
                className="absolute top-1/2 -right-20 z-20 hidden xl:flex items-center gap-3 p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/80 shadow-2xl hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Globe size={20} className="text-cyan-400" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">SEO Traffic</p>
                  <h4 className="text-sm font-bold font-display text-foreground">+340% Traffic</h4>
                </div>
              </motion.div>

              <motion.div
                style={{
                  x: mousePos.x * 0.5,
                  y: -mousePos.y * 0.5,
                }}
                className="absolute -bottom-8 left-8 z-20 hidden xl:flex items-center gap-3 p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/80 shadow-2xl hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center relative">
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  <Code size={20} className="text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Active Delivery</p>
                  <h4 className="text-sm font-bold font-display text-foreground">24/7 Support</h4>
                </div>
              </motion.div>
              {/* Animated Rings */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 rounded-full border border-glow-secondary/20"
              />
              
              {/* Inner Content */}
              <div className="absolute inset-12 rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/80 backdrop-blur-md border border-primary/20 shadow-xl flex items-center justify-center">
                <div className="text-center p-6">
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      rotateY: [0, 360],
                    }}
                    transition={{ 
                      y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                      rotateY: { duration: 8, repeat: Infinity, ease: "linear" },
                    }}
                    className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.3)]"
                  >
                    <span className="text-4xl font-display font-bold text-primary-foreground">IIPL</span>
                  </motion.div>
                  <motion.p 
                    className="font-display font-bold text-xl"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Itoby Infotech
                  </motion.p>
                  <p className="text-sm text-muted-foreground">Digital Excellence</p>
                </div>
              </div>

              {/* Floating Icon Elements */}
              {floatingIcons.map(({ Icon, delay }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: [0, -15, 0],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    opacity: { delay: delay + 0.5, duration: 0.5 },
                    scale: { delay: delay + 0.5, duration: 0.5 },
                    y: { duration: 4, repeat: Infinity, delay },
                    rotate: { duration: 6, repeat: Infinity, delay },
                  }}
                  className={`absolute w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center shadow-lg hover:border-primary hover:shadow-[0_0_20px_hsl(75_100%_50%/0.2)] transition-all cursor-pointer ${
                    i === 0 ? "-top-2 left-1/4" :
                    i === 1 ? "top-1/4 -right-2" :
                    i === 2 ? "bottom-1/4 -left-2" :
                    "-bottom-2 right-1/4"
                  }`}
                >
                  <Icon className="text-primary" size={24} />
                </motion.div>
              ))}

              {/* Glow orbs */}
              <motion.div
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-0 right-0 w-20 h-20 rounded-full bg-primary/30 blur-xl"
              />
              <motion.div
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-glow-secondary/30 blur-xl"
              />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Scroll</span>
          <div className="w-6 h-10 rounded-full border-2 border-primary/50 flex items-start justify-center p-1">
            <motion.div
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-primary"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};
