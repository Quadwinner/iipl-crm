import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Sparkles, Sliders, ArrowRight, Zap } from "lucide-react";
import { useCurrency } from "@/site/hooks/useCurrency";
import { Button } from "@/site/ui/button";

const basePlans = [
  {
    name: "Starter",
    priceInr: 25000,
    priceUsd: 350,
    priceAud: 520,
    priceCad: 480,
    period: "starting",
    description: "Perfect for small businesses getting started online",
    popular: false,
    features: {
      "Custom Website": true,
      "Mobile Responsive": true,
      "SEO Optimization": true,
      "Social Media Setup": false,
      "E-commerce": false,
      "Custom Software": false,
      "Mobile App": false,
      "Microsoft 365": false,
      "Dedicated Manager": false,
      "Priority Support": false,
    },
  },
  {
    name: "Professional",
    priceInr: 75000,
    priceUsd: 950,
    priceAud: 1450,
    priceCad: 1300,
    period: "starting",
    description: "Comprehensive solution for growing businesses",
    popular: true,
    features: {
      "Custom Website": true,
      "Mobile Responsive": true,
      "SEO Optimization": true,
      "Social Media Setup": true,
      "E-commerce": true,
      "Custom Software": true,
      "Mobile App": false,
      "Microsoft 365": false,
      "Dedicated Manager": true,
      "Priority Support": true,
    },
  },
  {
    name: "Enterprise",
    priceInr: 180000,
    priceUsd: 2200,
    priceAud: 3300,
    priceCad: 3000,
    period: "starting",
    description: "Full-scale digital transformation for enterprises",
    popular: false,
    features: {
      "Custom Website": true,
      "Mobile Responsive": true,
      "SEO Optimization": true,
      "Social Media Setup": true,
      "E-commerce": true,
      "Custom Software": true,
      "Mobile App": true,
      "Microsoft 365": true,
      "Dedicated Manager": true,
      "Priority Support": true,
    },
  },
];

const customizableFeatures = [
  { id: "web", name: "Custom Responsive Website", inr: 25000, usd: 350 },
  { id: "seo", name: "Advanced SEO & Schema Markup", inr: 12000, usd: 150 },
  { id: "ecom", name: "E-Commerce & Payment Gateway", inr: 20000, usd: 250 },
  { id: "app", name: "iOS & Android Mobile App", inr: 45000, usd: 600 },
  { id: "crm", name: "Custom ERP / CRM Integration", inr: 30000, usd: 400 },
  { id: "m365", name: "Microsoft 365 Security & Cloud", inr: 15000, usd: 200 },
];

const featureNames = Object.keys(basePlans[0].features);

export const ServiceComparisonSection = () => {
  const { currency, symbol } = useCurrency();
  const [activeTab, setActiveTab] = useState<"matrix" | "builder">("matrix");
  const [selectedAddons, setSelectedAddons] = useState<string[]>(["web", "seo"]);

  const getPlanPrice = (plan: typeof basePlans[0]) => {
    let val = plan.priceUsd;
    if (currency === "INR") val = plan.priceInr;
    if (currency === "AUD") val = plan.priceAud;
    if (currency === "CAD") val = plan.priceCad;
    return `${symbol}${val.toLocaleString()}`;
  };

  const calculateCustomTotal = () => {
    let sumInr = 0;
    let sumUsd = 0;
    selectedAddons.forEach((addonId) => {
      const feat = customizableFeatures.find((f) => f.id === addonId);
      if (feat) {
        sumInr += feat.inr;
        sumUsd += feat.usd;
      }
    });

    const val = currency === "INR" ? sumInr : Math.round(sumUsd * (currency === "AUD" ? 1.5 : currency === "CAD" ? 1.35 : 1));
    return `${symbol}${val.toLocaleString()}`;
  };

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section className="section-padding bg-card/30 relative overflow-hidden">
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />

      <div className="container-wide relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <span className="text-primary font-semibold uppercase tracking-wider text-sm">
            Compare Plans & Custom Pricing
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
            Choose Your <span className="gradient-text">Perfect Solution</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Transparent pricing formatted in your preferred currency ({currency}). Pick a standard package or configure your custom feature plan.
          </p>
        </motion.div>

        {/* View Switcher Tabs */}
        <div className="flex justify-center mb-12">
          <div className="p-1.5 rounded-2xl bg-secondary/60 border border-border/60 flex items-center gap-2">
            <button
              onClick={() => setActiveTab("matrix")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                activeTab === "matrix"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Standard Comparison Matrix
            </button>
            <button
              onClick={() => setActiveTab("builder")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 ${
                activeTab === "builder"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Custom Feature Configurator
            </button>
          </div>
        </div>

        {/* Tab 1: Comparison Matrix */}
        {activeTab === "matrix" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-x-auto"
          >
            <div className="min-w-[700px]">
              {/* Plan Headers */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div />
                {basePlans.map((plan) => (
                  <div
                    key={plan.name}
                    className={`relative p-6 rounded-2xl text-center ${
                      plan.popular
                        ? "bg-primary/10 border-2 border-primary/50 shadow-xl shadow-primary/10"
                        : "bg-card/50 border border-border/50"
                    } backdrop-blur-xl`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary rounded-full text-primary-foreground text-xs font-bold flex items-center gap-1">
                        <Sparkles size={12} /> Most Popular
                      </div>
                    )}
                    <h3 className="font-display text-xl font-bold mb-1">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1 mb-2">
                      <span className="text-3xl font-bold text-primary">{getPlanPrice(plan)}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                    <p className="text-muted-foreground text-xs">{plan.description}</p>
                  </div>
                ))}
              </div>

              {/* Feature Rows */}
              {featureNames.map((feature, i) => (
                <div
                  key={feature}
                  className={`grid grid-cols-4 gap-4 py-3 px-4 rounded-xl ${
                    i % 2 === 0 ? "bg-card/30" : ""
                  }`}
                >
                  <div className="flex items-center text-sm font-medium">
                    {feature}
                  </div>
                  {basePlans.map((plan) => (
                    <div key={`${plan.name}-${feature}`} className="flex items-center justify-center">
                      {plan.features[feature as keyof typeof plan.features] ? (
                        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
                          <Check size={14} className="text-primary" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-muted/30 flex items-center justify-center">
                          <X size={14} className="text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}

              {/* CTA Row */}
              <div className="grid grid-cols-4 gap-4 mt-8">
                <div />
                {basePlans.map((plan) => (
                  <div key={`cta-${plan.name}`} className="flex justify-center">
                    <Button
                      variant={plan.popular ? "hero" : "outline"}
                      size="lg"
                      className="w-full rounded-xl gap-2 text-xs"
                      onClick={() => {
                        window.location.href = `/request-quote?plan=${encodeURIComponent(plan.name)}`;
                      }}
                    >
                      Get Started <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Interactive Custom Feature Builder */}
        {activeTab === "builder" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto grid lg:grid-cols-12 gap-8 items-start"
          >
            {/* Feature Checkboxes (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-2">
                Select Your Required Features
              </span>
              {customizableFeatures.map((feat) => {
                const isSelected = selectedAddons.includes(feat.id);
                const featPrice = `${symbol}${(currency === "INR" ? feat.inr : feat.usd * (currency === "AUD" ? 1.5 : currency === "CAD" ? 1.35 : 1)).toLocaleString()}`;
                return (
                  <div
                    key={feat.id}
                    onClick={() => toggleAddon(feat.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-md ring-1 ring-primary/30"
                        : "border-border/60 bg-card/60 hover:bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected ? "bg-primary text-primary-foreground" : "border border-border/80 bg-background"
                      }`}>
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                      <span className="font-display font-semibold text-sm text-foreground">{feat.name}</span>
                    </div>

                    <span className="font-mono text-xs font-bold text-primary">+ {featPrice}</span>
                  </div>
                );
              })}
            </div>

            {/* Configured Price Summary Card (5 cols) */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-card border border-primary/30 shadow-2xl space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <h4 className="font-display text-lg font-bold text-foreground">Custom Plan Summary</h4>
                </div>
                <p className="text-xs text-muted-foreground">Estimated package cost based on {selectedAddons.length} selected features.</p>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/50 border border-border/50 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Estimated Investment</span>
                <span className="font-display text-4xl font-extrabold text-primary">{calculateCustomTotal()}</span>
                <span className="text-xs text-muted-foreground block mt-1">Formatted in {currency}</span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Included Features:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAddons.map((id) => {
                    const f = customizableFeatures.find((item) => item.id === id);
                    return (
                      <span key={id} className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium">
                        {f?.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full rounded-2xl gap-2 text-xs"
                onClick={() => {
                  window.location.href = `/request-quote?custom=${encodeURIComponent(selectedAddons.join(","))}`;
                }}
              >
                Proceed With Custom Plan <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};
