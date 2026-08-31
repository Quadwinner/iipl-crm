import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Cpu, ShoppingCart, Activity, GraduationCap, DollarSign, 
  Utensils, Plane, Car, Leaf, Tv, Trophy, Shirt 
} from "lucide-react";

const clients = [
  { name: "TechFlow Inc.", icon: Cpu },
  { name: "RetailMax", icon: ShoppingCart },
  { name: "HealthFirst", icon: Activity },
  { name: "EduLearn", icon: GraduationCap },
  { name: "FinanceHub", icon: DollarSign },
  { name: "FoodChain", icon: Utensils },
  { name: "TravelEase", icon: Plane },
  { name: "AutoDrive", icon: Car },
  { name: "GreenEnergy", icon: Leaf },
  { name: "MediaPro", icon: Tv },
  { name: "SportZone", icon: Trophy },
  { name: "FashionX", icon: Shirt },
];

export const ClientsMarqueeSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section 
      ref={ref}
      className="py-8 sm:py-12 overflow-hidden bg-background border-y border-border/50"
    >
      <div className="container-wide mb-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center text-sm text-muted-foreground uppercase tracking-wider"
        >
          Trusted by Leading Brands
        </motion.p>
      </div>
      
      {/* Marquee Container */}
      <motion.div 
        className="relative"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {/* Gradient Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        {/* Scrolling Content Container */}
        <div className="flex overflow-hidden select-none gap-4 sm:gap-8 md:gap-12 group">
          <div className="flex shrink-0 justify-around gap-4 sm:gap-8 md:gap-12 min-w-full animate-marquee group-hover:[animation-play-state:paused]">
            {clients.map((client, index) => (
              <div
                key={`marquee-1-${index}`}
                className="group/logo flex items-center gap-2.5 flex-shrink-0 px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-card hover:shadow-[0_0_25px_hsl(var(--primary)/0.25)] transition-all duration-300 transform hover:-translate-y-1 cursor-default"
              >
                <client.icon className="text-muted-foreground/60 group-hover/logo:text-primary transition-colors" size={18} />
                <span className="text-sm sm:text-base font-medium text-muted-foreground group-hover/logo:text-primary transition-colors whitespace-nowrap">
                  {client.name}
                </span>
              </div>
            ))}
          </div>
          <div className="flex shrink-0 justify-around gap-4 sm:gap-8 md:gap-12 min-w-full animate-marquee group-hover:[animation-play-state:paused]" aria-hidden="true">
            {clients.map((client, index) => (
              <div
                key={`marquee-2-${index}`}
                className="group/logo flex items-center gap-2.5 flex-shrink-0 px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-card hover:shadow-[0_0_25px_hsl(var(--primary)/0.25)] transition-all duration-300 transform hover:-translate-y-1 cursor-default"
              >
                <client.icon className="text-muted-foreground/60 group-hover/logo:text-primary transition-colors" size={18} />
                <span className="text-sm sm:text-base font-medium text-muted-foreground group-hover/logo:text-primary transition-colors whitespace-nowrap">
                  {client.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
};
