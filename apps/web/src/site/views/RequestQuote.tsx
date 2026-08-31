import { useState } from "react";
import { ProposalModal } from "@/site/ui/proposal-modal";
import {  } from "@/site/hooks/useCurrency";
import { SEOHead } from "@/site/seo-head";
import { PageHeroBanner } from "@/site/ui/page-hero-banner";
import { motion, AnimatePresence } from "framer-motion";
import { SiteLayout } from "@/site/layout/site-layout";
import { Button } from "@/site/ui/button";
import { Input } from "@/site/ui/input";
import { Label } from "@/site/ui/label";
import { Textarea } from "@/site/ui/textarea";
import {  } from "@/site/ui/badge";
import { Card } from "@/site/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, CheckCircle, Globe, Smartphone, Megaphone, Code, Shield, IndianRupee, Clock, Sparkles, Send, User, Mail, Phone, Building2, FileText, Zap, Star, TrendingUp } from "lucide-react";

const services = [
  { id: "web-design", label: "Web Design & Development", icon: Globe, price: 25000, desc: "Responsive, modern websites" },
  { id: "mobile-app", label: "Mobile App Development", icon: Smartphone, price: 50000, desc: "iOS & Android applications" },
  { id: "digital-marketing", label: "Digital Marketing", icon: Megaphone, price: 15000, desc: "SEO, Ads & Social Media" },
  { id: "software-solutions", label: "Custom Software", icon: Code, price: 75000, desc: "Tailored business solutions" },
  { id: "microsoft-365", label: "Microsoft 365 Solutions", icon: Shield, price: 20000, desc: "Cloud & productivity tools" },
];

const budgets = [
  { id: "under-50k", label: "Under ₹50,000", range: [0, 50000], emoji: "💡" },
  { id: "50k-1l", label: "₹50K - ₹1 Lakh", range: [50000, 100000], emoji: "🚀" },
  { id: "1l-3l", label: "₹1L - ₹3 Lakh", range: [100000, 300000], emoji: "⚡" },
  { id: "3l-5l", label: "₹3L - ₹5 Lakh", range: [300000, 500000], emoji: "🔥" },
  { id: "5l-plus", label: "₹5 Lakh+", range: [500000, 1000000], emoji: "💎" },
];

const timelines = [
  { id: "urgent", label: "Urgent", subtext: "1-2 weeks", multiplier: 1.5, icon: Zap },
  { id: "standard", label: "Standard", subtext: "1-2 months", multiplier: 1.0, icon: Clock },
  { id: "relaxed", label: "Relaxed", subtext: "2-4 months", multiplier: 0.9, icon: TrendingUp },
  { id: "flexible", label: "Flexible", subtext: "No deadline", multiplier: 0.85, icon: Star },
];

const stepLabels = ["Services", "Budget & Timeline", "Your Details"];

const RequestQuote = () => {
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState("");
  const [selectedTimeline, setSelectedTimeline] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const calculateEstimate = () => {
    const baseTotal = selectedServices.reduce((sum, id) => {
      const service = services.find((s) => s.id === id);
      return sum + (service?.price || 0);
    }, 0);
    const timeline = timelines.find((t) => t.id === selectedTimeline);
    const multiplier = timeline?.multiplier || 1;
    const estimated = Math.round(baseTotal * multiplier);
    const min = Math.round(estimated * 0.8);
    const max = Math.round(estimated * 1.3);
    return { min, max, estimated };
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const canProceed = () => {
    if (step === 1) return selectedServices.length > 0;
    if (step === 2) return selectedBudget && selectedTimeline;
    if (step === 3) return name && email && description;
    return false;
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;
    setIsSubmitting(true);
    const estimate = calculateEstimate();
    const estimatedCost = `${formatCurrency(estimate.min)} - ${formatCurrency(estimate.max)}`;
    try {
      // Same rate-limited public path as the contact form. Timeline and the
      // estimate are folded into the message so nothing is lost — there is no
      // separate quote table, and leads are where staff work these.
      const { error } = await supabase().rpc("submit_lead", {
        p_full_name: name.trim(),
        p_email: email.trim(),
        p_phone: phone.trim(),
        p_company: company.trim(),
        p_service_interest: selectedServices.join(", "),
        p_budget_range: selectedBudget,
        p_message: [
          description.trim(),
          `Timeline: ${selectedTimeline || "not specified"}`,
          `Indicative estimate: ${estimatedCost}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
        p_source: "QUOTE_REQUEST",
        p_page_path: window.location.pathname,
      });
      if (error) throw new Error(error.message);
      setIsSubmitted(true);
      toast.success("Quote request submitted successfully!");
    } catch {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimate = calculateEstimate();
  const progress = (step / 3) * 100;

  const [isProposalOpen, setIsProposalOpen] = useState(false);

  if (isSubmitted) {
    return (
      <SiteLayout>
        <SEOHead title="Request a Quote" description="Get a free project estimate from Itoby Infotech." path="/request-quote" />
        <ProposalModal
          isOpen={isProposalOpen}
          onClose={() => setIsProposalOpen(false)}
          quoteData={{
            selectedServices,
            selectedFeatures: [],
            timeline: selectedTimeline,
            budget: selectedBudget,
            estimate,
            currencySymbol: "₹",
            formattedMin: formatCurrency(estimate.min),
            formattedMax: formatCurrency(estimate.max),
            contactInfo: { name, email, company }
          }}
        />
        <section className="section-padding min-h-[70vh] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-glow-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          </div>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-lg mx-auto relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-glow-secondary flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30"
            >
              <CheckCircle className="w-12 h-12 text-primary-foreground" />
            </motion.div>
            <h2 className="font-display text-4xl font-bold mb-4">Thank You! 🎉</h2>
            <p className="text-muted-foreground mb-3 text-lg">Your quote request has been submitted successfully.</p>
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
              <IndianRupee className="w-5 h-5 text-primary" />
              <span className="text-primary font-bold text-lg">{formatCurrency(estimate.min)} - {formatCurrency(estimate.max)}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-8">Our team will review your requirements and get back to you within 24 hours.</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button variant="outline" size="lg" onClick={() => setIsProposalOpen(true)} className="rounded-xl gap-2 border-primary/40 text-primary hover:bg-primary/10">
                <FileText className="w-4 h-4" /> View & Print Proposal PDF
              </Button>
              <Button variant="default" size="lg" onClick={() => window.location.href = "/"} className="rounded-xl">Back to Home</Button>
            </div>
          </motion.div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <SEOHead title="Request a Quote" description="Get a free project estimate from Itoby Infotech." path="/request-quote" />

      {/* 3D Animated Hero & Breadcrumbs */}
      <PageHeroBanner
        title="Get an Instant Project Cost Estimate"
        description="Tell us about your project requirements and get a instant cost estimate with a detailed proposal delivered in 24 hours."
        badge="Instant Cost Calculator"
        breadcrumbs={[{ label: "Request Quote" }]}
      />

      <section className="section-padding pt-4">
        <div className="container max-w-5xl">
          {/* Progress Bar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-10">
            <div className="flex items-center justify-between mb-3">
              {stepLabels.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: step === i + 1 ? 1.1 : 1 }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      step > i + 1
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : step === i + 1
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-primary/20"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {step > i + 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </motion.div>
                  <span className={`text-sm font-medium hidden sm:block ${step >= i + 1 ? "text-foreground" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-glow-secondary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Form — 3 cols */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {/* Step 1 */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-bold mb-2">What do you need?</h2>
                      <p className="text-muted-foreground">Select one or more services for your project.</p>
                    </div>
                    <div className="grid gap-3">
                      {services.map((service, index) => {
                        const isSelected = selectedServices.includes(service.id);
                        return (
                          <motion.button
                            key={service.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => toggleService(service.id)}
                            className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-300 group ${
                              isSelected
                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary/30"
                                : "border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/40 hover:bg-card/80"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                isSelected
                                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                                  : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                              }`}>
                                <service.icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm sm:text-base">{service.label}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{service.desc}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className={`text-sm font-bold ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                                  {formatCurrency(service.price)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">starting</p>
                              </div>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected ? "border-primary bg-primary" : "border-border"
                              }`}>
                                {isSelected && <CheckCircle className="w-4 h-4 text-primary-foreground" />}
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-8">
                    <div>
                      <h2 className="font-display text-2xl font-bold mb-2">Budget Range</h2>
                      <p className="text-muted-foreground">What's your approximate budget?</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {budgets.map((b, index) => (
                        <motion.button
                          key={b.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.06 }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedBudget(b.id)}
                          className={`p-4 rounded-2xl border text-center transition-all duration-300 ${
                            selectedBudget === b.id
                              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary/30"
                              : "border-border/50 bg-card/50 hover:border-primary/40"
                          }`}
                        >
                          <span className="text-2xl mb-2 block">{b.emoji}</span>
                          <span className="font-semibold text-sm block">{b.label}</span>
                        </motion.button>
                      ))}
                    </div>

                    <div>
                      <h2 className="font-display text-2xl font-bold mb-2">Timeline</h2>
                      <p className="text-muted-foreground">When do you need it?</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {timelines.map((t, index) => (
                        <motion.button
                          key={t.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.06 }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedTimeline(t.id)}
                          className={`p-4 rounded-2xl border text-left transition-all duration-300 flex items-center gap-3 ${
                            selectedTimeline === t.id
                              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary/30"
                              : "border-border/50 bg-card/50 hover:border-primary/40"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            selectedTimeline === t.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                          }`}>
                            <t.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{t.label}</p>
                            <p className="text-xs text-muted-foreground">{t.subtext}</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-bold mb-2">Your Details</h2>
                      <p className="text-muted-foreground">Tell us about yourself and your project.</p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2 text-sm">
                          <User className="w-3.5 h-3.5 text-muted-foreground" /> Full Name *
                        </Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="h-12 rounded-xl" required />
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email Address *
                        </Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="h-12 rounded-xl" required />
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Phone Number
                        </Label>
                        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="h-12 rounded-xl" />
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-2">
                        <Label htmlFor="company" className="flex items-center gap-2 text-sm">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> Company
                        </Label>
                        <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your company" className="h-12 rounded-xl" />
                      </motion.div>
                    </div>
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
                      <Label htmlFor="description" className="flex items-center gap-2 text-sm">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" /> Project Description *
                      </Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your project requirements, goals, and any specific features you need..."
                        rows={5}
                        className="rounded-xl resize-none"
                        required
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                {step > 1 ? (
                  <Button variant="outline" size="lg" onClick={() => setStep(step - 1)} className="rounded-xl gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </Button>
                ) : (
                  <div />
                )}
                {step < 3 ? (
                  <Button size="lg" onClick={() => setStep(step + 1)} disabled={!canProceed()} className="rounded-xl gap-2">
                    Next Step <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button size="lg" onClick={handleSubmit} disabled={!canProceed() || isSubmitting} className="rounded-xl gap-2 min-w-[200px]">
                    {isSubmitting ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
                    ) : (
                      <><Send className="w-4 h-4" /> Submit Request</>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Estimate Sidebar — 2 cols */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 space-y-4">
                {/* Live Estimate Card */}
                <Card className="p-0 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold">Live Estimate</h3>
                        <p className="text-[10px] text-muted-foreground">Updates as you select</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    {selectedServices.length > 0 ? (
                      <div className="space-y-5">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Selected Services</p>
                          <div className="space-y-2">
                            {selectedServices.map((id) => {
                              const service = services.find((s) => s.id === id);
                              return (
                                <motion.div
                                  key={id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/50"
                                >
                                  <div className="flex items-center gap-2">
                                    {service && <service.icon className="w-3.5 h-3.5 text-primary" />}
                                    <span className="text-sm font-medium">{service?.label}</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">{formatCurrency(service?.price || 0)}</span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>

                        {selectedBudget && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Budget</p>
                            <p className="text-sm font-medium">{budgets.find((b) => b.id === selectedBudget)?.label}</p>
                          </div>
                        )}

                        {selectedTimeline && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Timeline</p>
                            <p className="text-sm font-medium">
                              {timelines.find((t) => t.id === selectedTimeline)?.label}
                              <span className="text-muted-foreground"> · {timelines.find((t) => t.id === selectedTimeline)?.subtext}</span>
                            </p>
                          </div>
                        )}

                        <div className="border-t border-border/50 pt-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Estimated Cost</p>
                          <div className="flex items-baseline gap-2">
                            <motion.p
                              key={estimate.min}
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              className="text-3xl font-display font-bold text-primary"
                            >
                              {formatCurrency(estimate.min)}
                            </motion.p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">to {formatCurrency(estimate.max)}</p>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsProposalOpen(true)}
                          className="w-full rounded-xl gap-2 text-xs border-primary/30 text-primary hover:bg-primary/10 mt-2"
                        >
                          <FileText className="w-3.5 h-3.5" /> Preview Proposal PDF
                        </Button>

                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          * Approximate estimate. Final pricing depends on project scope & complexity.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-muted-foreground">
                        <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                          <IndianRupee className="w-7 h-7 opacity-30" />
                        </div>
                        <p className="text-sm font-medium">Select services to see estimate</p>
                        <p className="text-xs mt-1 text-muted-foreground">Your live quote will appear here</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Trust indicators */}
                <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-xs">100% Free & No Obligation</p>
                      <p className="text-[10px] text-muted-foreground">Get your quote without any commitment</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proposal Modal Preview */}
      <ProposalModal
        isOpen={isProposalOpen}
        onClose={() => setIsProposalOpen(false)}
        quoteData={{
          selectedServices,
          selectedFeatures: [],
          timeline: selectedTimeline,
          budget: selectedBudget,
          estimate,
          currencySymbol: "₹",
          formattedMin: formatCurrency(estimate.min),
          formattedMax: formatCurrency(estimate.max),
          contactInfo: { name, email, company }
        }}
      />
    </SiteLayout>
  );
};

export default RequestQuote;
