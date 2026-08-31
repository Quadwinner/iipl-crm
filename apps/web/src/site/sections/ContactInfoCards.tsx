import { motion } from "framer-motion";
import { Clock, Globe, Headphones, Shield } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Quick Response",
    description: "We respond to all inquiries within 24 hours. Your time is valuable to us.",
    gradient: "from-blue-500/20 via-blue-500/10 to-transparent",
    iconColor: "text-blue-500",
    glow: "group-hover:shadow-blue-500/20",
  },
  {
    icon: Globe,
    title: "Global Availability",
    description: "Serving clients across 15+ countries with flexible communication hours.",
    gradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    iconColor: "text-emerald-500",
    glow: "group-hover:shadow-emerald-500/20",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    description: "Each project gets a dedicated project manager for seamless communication.",
    gradient: "from-violet-500/20 via-violet-500/10 to-transparent",
    iconColor: "text-violet-500",
    glow: "group-hover:shadow-violet-500/20",
  },
  {
    icon: Shield,
    title: "NDA Protection",
    description: "Your ideas are safe with us. We sign NDAs before discussing sensitive projects.",
    gradient: "from-primary/20 via-primary/10 to-transparent",
    iconColor: "text-primary",
    glow: "group-hover:shadow-primary/20",
  },
];

export const ContactInfoCards = () => {
  return (
    <section className="py-12">
      <div className="container-wide">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className={`relative p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-500 text-center group overflow-hidden cursor-default ${feature.glow} hover:shadow-xl`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />
              <div className="relative z-10">
                <motion.div
                  whileHover={{ scale: 1.15, rotate: 8 }}
                  className={`w-14 h-14 rounded-2xl bg-background/50 border border-border/50 flex items-center justify-center mx-auto mb-4 ${feature.iconColor} group-hover:shadow-lg transition-all duration-300`}
                >
                  <feature.icon size={26} />
                </motion.div>
                <h3 className="font-display text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
