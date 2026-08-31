
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/site/ui/button";
import { Floating3DBubbles } from "@/site/ui/floating-3d-bubbles";

export const CTASection = () => {
  const whatsappNumber = "919142773500";
  const whatsappMessage = encodeURIComponent("Hi! I'm interested in your digital services. Can we discuss my project?");
  const whatsappLink = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${whatsappMessage}`;

  return (
    <section className="section-padding relative overflow-hidden">
      <Floating3DBubbles count={15} />
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Glassmorphism Background */}
          <div className="absolute inset-0 bg-card/50 backdrop-blur-xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,hsl(var(--primary)/0.1),transparent_50%)]" />
          <div className="absolute inset-0 border border-border/50 rounded-3xl" />

          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(hsl(var(--primary)/0.5) 1px, transparent 1px),
                               linear-gradient(90deg, hsl(var(--primary)/0.5) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }} />
          </div>

          {/* Content */}
          <div className="relative z-10 py-16 sm:py-20 px-6 sm:px-8 md:px-16 text-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm text-primary text-sm font-medium"
            >
              Let's Start Your Project
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6"
            >
              Ready to Build Something{" "}
              <span className="gradient-text">Great?</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-10"
            >
              Let's discuss your project and discover how we can help transform
              your business with cutting-edge digital solutions.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button variant="hero" size="xl" className="w-full sm:w-auto group" asChild>
                <Link to="/contact">
                  Get Free Consultation
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight size={20} />
                  </motion.span>
                </Link>
              </Button>

              <motion.a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-14 px-8 rounded-xl bg-[#25D366] text-white font-bold text-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(37,211,102,0.4)]"
              >
                <MessageCircle size={22} />
                Chat on WhatsApp
              </motion.a>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-muted-foreground"
            >
              {["Free Consultation", "No Commitment", "24hr Response Time"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
                  {item}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Decorative Glow Orbs */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
};
