import { motion } from "framer-motion";
import { TrendingUp, Users, Clock, Award } from "lucide-react";

const stats = [
  { icon: TrendingUp, value: "300%", label: "Average ROI Increase" },
  { icon: Users, value: "2M+", label: "Users Reached" },
  { icon: Clock, value: "99.9%", label: "Uptime Guarantee" },
  { icon: Award, value: "4.9/5", label: "Client Satisfaction" },
];

export const PortfolioStatsSection = () => {
  return (
    <section className="py-16 bg-card/50">
      <div className="container-wide">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-6 rounded-2xl bg-card border border-border"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
              >
                <stat.icon className="text-primary" size={24} />
              </motion.div>
              <p className="text-3xl sm:text-4xl font-display font-bold text-primary mb-1">
                {stat.value}
              </p>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
