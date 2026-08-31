import { motion } from "framer-motion";
import { MessageSquare, Search, Palette, Code, Rocket, HeartHandshake } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    number: "01",
    title: "Discovery Call",
    description: "We start with understanding your business goals, target audience, and project requirements through an in-depth consultation.",
  },
  {
    icon: Search,
    number: "02",
    title: "Research & Strategy",
    description: "Our team conducts market research, competitor analysis, and develops a comprehensive strategy tailored to your needs.",
  },
  {
    icon: Palette,
    number: "03",
    title: "Design & Prototype",
    description: "We create wireframes and interactive prototypes, ensuring the design aligns with your brand and user expectations.",
  },
  {
    icon: Code,
    number: "04",
    title: "Development",
    description: "Our developers bring designs to life using cutting-edge technologies, following best practices for performance and security.",
  },
  {
    icon: Rocket,
    number: "05",
    title: "Testing & Launch",
    description: "Rigorous testing across devices and browsers ensures a flawless launch. We handle deployment and go-live support.",
  },
  {
    icon: HeartHandshake,
    number: "06",
    title: "Support & Growth",
    description: "Post-launch, we provide ongoing support, maintenance, and optimization to ensure continued success and growth.",
  },
];

export const WorkProcessSection = () => {
  return (
    <section className="section-padding bg-gradient-to-b from-background via-card/30 to-background">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold uppercase tracking-wider text-sm">
            How We Work
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Our Proven <span className="gradient-text">Process</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            A structured approach that ensures every project is delivered on time, on budget, and beyond expectations.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 h-full">
                {/* Number Badge */}
                <span className="absolute -top-3 -left-3 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display font-bold text-lg shadow-[0_0_20px_hsl(75_100%_50%/0.3)]">
                  {step.number}
                </span>

                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 mt-4 group-hover:bg-primary transition-colors"
                >
                  <step.icon className="text-primary group-hover:text-primary-foreground" size={28} />
                </motion.div>

                <h3 className="font-display text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && index % 3 !== 2 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
