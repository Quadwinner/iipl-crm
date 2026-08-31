
import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, TrendingUp, DollarSign, BarChart3, ArrowRight, Gauge, Zap } from "lucide-react";
import { Button } from "@/site/ui/button";
import { Input } from "@/site/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/site/ui/select";
import { Slider } from "@/site/ui/slider";
import { Link } from "react-router-dom";
import { SiteAuditModal } from "@/site/ui/site-audit-modal";

interface ROIResult {
  projectedRevenue: number;
  roiPercentage: number;
  paybackMonths: number;
  yearlyGrowth: number;
}

const serviceMultipliers: Record<string, { revenueMultiplier: number; growthRate: number; label: string }> = {
  web: { revenueMultiplier: 2.5, growthRate: 35, label: "Web Design & Development" },
  mobile: { revenueMultiplier: 3.0, growthRate: 45, label: "Mobile App Development" },
  marketing: { revenueMultiplier: 4.0, growthRate: 55, label: "Digital Marketing" },
  software: { revenueMultiplier: 3.5, growthRate: 40, label: "Custom Software" },
  m365: { revenueMultiplier: 2.0, growthRate: 25, label: "Microsoft 365 Services" },
};

const formatCurrency = (value: number, currency: string) => {
  if (currency === "INR") {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
    return `₹${value.toLocaleString("en-IN")}`;
  }
  
  const symbol = currency === "AUD" ? "A$" : currency === "CAD" ? "C$" : "$";
  if (value >= 1000000) return `${symbol}${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${symbol}${(value / 1000).toFixed(0)}K`;
  return `${symbol}${value.toLocaleString("en-US")}`;
};

const ROICalculatorSection = () => {
  const [currency, setCurrency] = useState<"USD" | "AUD" | "CAD" | "INR">("USD");
  const [service, setService] = useState("web");
  const [currentRevenue, setCurrentRevenue] = useState("15000");
  const [investmentAmount, setInvestmentAmount] = useState([10000]);
  const [result, setResult] = useState<ROIResult | null>(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  const handleCurrencyChange = (cur: "USD" | "AUD" | "CAD" | "INR") => {
    setCurrency(cur);
    setResult(null);
    if (cur === "INR") {
      setCurrentRevenue("500000");
      setInvestmentAmount([300000]);
    } else {
      setCurrentRevenue("15000");
      setInvestmentAmount([10000]);
    }
  };

  const calculate = () => {
    const rev = parseInt(currentRevenue) || 0;
    const invest = investmentAmount[0];
    const mult = serviceMultipliers[service];

    const projected = rev + invest * mult.revenueMultiplier;
    const roi = ((projected - rev - invest) / invest) * 100;
    const payback = Math.ceil(invest / ((projected - rev) / 12));

    setResult({
      projectedRevenue: Math.round(projected),
      roiPercentage: Math.round(roi),
      paybackMonths: payback,
      yearlyGrowth: mult.growthRate,
    });
  };

  return (
    <section className="section-padding bg-muted/30">
      <div className="container-wide max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Calculator className="w-4 h-4 inline mr-1" /> ROI Calculator
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            Calculate Your <span className="text-primary">Return on Investment</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            See projected growth based on industry benchmarks from our 100+ successful projects.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-2xl p-6 space-y-6"
          >
            {/* Currency Selector */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Currency</label>
              <div className="grid grid-cols-4 gap-2">
                {(["USD", "AUD", "CAD", "INR"] as const).map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => handleCurrencyChange(cur)}
                    className={`py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-all ${
                      currency === cur
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {cur === "AUD" ? "A$ (AUD)" : cur === "CAD" ? "C$ (CAD)" : cur === "INR" ? "₹ (INR)" : "$ (USD)"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Service Type</label>
              <Select value={service} onValueChange={setService}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(serviceMultipliers).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Current Monthly Revenue ({currency === "INR" ? "₹" : "$"})
              </label>
              <Input
                type="number"
                value={currentRevenue}
                onChange={(e) => setCurrentRevenue(e.target.value)}
                placeholder={currency === "INR" ? "500000" : "15000"}
                className="bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Investment Amount: <span className="text-primary font-bold">{formatCurrency(investmentAmount[0], currency)}</span>
              </label>
              <Slider
                value={investmentAmount}
                onValueChange={setInvestmentAmount}
                min={currency === "INR" ? 50000 : 1000}
                max={currency === "INR" ? 5000000 : 150000}
                step={currency === "INR" ? 50000 : 2500}
                className="my-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{currency === "INR" ? "₹50K" : "$1K"}</span>
                <span>{currency === "INR" ? "₹50L" : "$150K"}</span>
              </div>
            </div>

            <Button variant="hero" className="w-full" onClick={calculate}>
              <Calculator className="w-4 h-4 mr-2" /> Calculate ROI
            </Button>
          </motion.div>

          {/* Result Side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-center"
          >
            {result ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                <h3 className="text-lg font-display font-bold text-foreground">Projected Results</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/10 rounded-xl p-4 text-center">
                    <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-primary">{result.roiPercentage}%</div>
                    <div className="text-xs text-muted-foreground">Projected ROI</div>
                  </div>
                  <div className="bg-primary/10 rounded-xl p-4 text-center">
                    <DollarSign className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">{formatCurrency(result.projectedRevenue, currency)}</div>
                    <div className="text-xs text-muted-foreground">Monthly Revenue</div>
                  </div>
                  <div className="bg-primary/10 rounded-xl p-4 text-center">
                    <BarChart3 className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">{result.yearlyGrowth}%</div>
                    <div className="text-xs text-muted-foreground">Annual Growth</div>
                  </div>
                  <div className="bg-primary/10 rounded-xl p-4 text-center">
                    <Calculator className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">{result.paybackMonths} mo</div>
                    <div className="text-xs text-muted-foreground">Payback Period</div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  * Based on average results from 100+ projects. Actual results may vary.
                </p>

                <Button variant="hero" className="w-full" asChild>
                  <Link to="/request-quote">
                    Get Started <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </motion.div>
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Calculator className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-2">Ready to Calculate?</h3>
                <p className="text-sm text-muted-foreground">
                  Select your currency, fill in the details, and click "Calculate ROI" to see your projected returns.
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Instant Website Audit Banner */}
        <div className="mt-12 p-6 rounded-3xl bg-card border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Gauge className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-display font-bold text-foreground text-base">Want to analyze your existing website?</h4>
              <p className="text-xs text-muted-foreground">Run an instant AI performance, speed & mobile UX audit on your domain.</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAuditOpen(true)}
            className="rounded-xl gap-2 text-xs border-primary/40 text-primary hover:bg-primary/10 shrink-0"
          >
            <Zap className="w-3.5 h-3.5" /> Run Instant Site Audit
          </Button>
        </div>
      </div>

      <SiteAuditModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
      />
    </section>
  );
};

export default ROICalculatorSection;
