import { motion, AnimatePresence } from "framer-motion";
import { X, Printer, Sparkles, CheckCircle2, ShieldCheck, Clock, FileText } from "lucide-react";
import { Button } from "@/site/ui/button";

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteData: {
    selectedServices: string[];
    selectedFeatures: string[];
    timeline: string;
    budget: string;
    estimate: { min: number; max: number };
    currencySymbol: string;
    formattedMin: string;
    formattedMax: string;
    contactInfo?: {
      name: string;
      email: string;
      company?: string;
    };
  };
}

export const ProposalModal = ({ isOpen, onClose, quoteData }: ProposalModalProps) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto print:p-0 print:static print:z-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-background/80 backdrop-blur-xl print:hidden"
        />

        {/* Proposal Document Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
          className="relative z-10 w-full max-w-4xl bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black"
        >
          {/* Header Action Bar */}
          <div className="flex items-center justify-between p-4 px-6 border-b border-border/60 bg-muted/40 print:hidden">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-display font-bold text-foreground text-sm">
                Executive Project Estimate & Proposal Summary
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="rounded-xl gap-2 text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </Button>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Printable Proposal Document Body */}
          <div className="p-6 sm:p-10 overflow-y-auto custom-scrollbar space-y-8 print:p-4">
            {/* Proposal Title Header */}
            <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-2">
                  <Sparkles className="w-4 h-4" />
                  Official Project Cost Estimate
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Itoby Infotech Project Proposal
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Prepared for: <span className="text-foreground font-semibold">{quoteData.contactInfo?.name || "Valued Client"}</span> {quoteData.contactInfo?.company ? `(${quoteData.contactInfo.company})` : ""}
                </p>
              </div>

              <div className="text-left sm:text-right text-xs text-muted-foreground space-y-1">
                <p><span className="font-semibold text-foreground">Date:</span> {currentDate}</p>
                <p><span className="font-semibold text-foreground">Ref No:</span> ITOBY-EXP-{Math.floor(100000 + Math.random() * 900000)}</p>
                <p><span className="font-semibold text-foreground">Validity:</span> 30 Days</p>
              </div>
            </div>

            {/* Price Estimate Highlight Box */}
            <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Estimated Total Investment</p>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-primary">
                  {quoteData.formattedMin} – {quoteData.formattedMax}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Includes end-to-end design, engineering, QA, and deployment.</p>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border/60 text-xs font-medium text-foreground">
                <Clock className="w-4 h-4 text-primary" />
                <span>Timeline: {quoteData.timeline || "Estimated 2-4 Weeks"}</span>
              </div>
            </div>

            {/* Scope & Selected Services */}
            <div>
              <h3 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" /> Selected Deliverables & Services
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {quoteData.selectedServices.map((service) => (
                  <div key={service} className="p-3.5 rounded-xl bg-card border border-border/60 text-xs font-semibold text-foreground flex items-center justify-between">
                    <span className="capitalize">{service.replace("-", " ")}</span>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px]">Included</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Addons & Features */}
            {quoteData.selectedFeatures.length > 0 && (
              <div>
                <h3 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" /> Included Features & Extensions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {quoteData.selectedFeatures.map((feature) => (
                    <span key={feature} className="px-3 py-1.5 rounded-xl bg-secondary text-xs text-foreground font-medium border border-border/40">
                      ✓ {feature.replace("-", " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Included Guarantees */}
            <div className="grid sm:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-2xl bg-card/60 border border-border/60 text-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary font-bold text-sm">100%</div>
                <h4 className="font-bold text-xs mb-1">Code Ownership</h4>
                <p className="text-[11px] text-muted-foreground">Complete IP rights transfer upon delivery</p>
              </div>

              <div className="p-4 rounded-2xl bg-card/60 border border-border/60 text-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary font-bold text-sm">30d</div>
                <h4 className="font-bold text-xs mb-1">Free Post-Launch Warranty</h4>
                <p className="text-[11px] text-muted-foreground">Bug fixes & performance support</p>
              </div>

              <div className="p-4 rounded-2xl bg-card/60 border border-border/60 text-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary font-bold text-sm">24/7</div>
                <h4 className="font-bold text-xs mb-1">Dedicated Project Manager</h4>
                <p className="text-[11px] text-muted-foreground">Regular sprint updates & Slack channel</p>
              </div>
            </div>

            {/* Footer Signoff */}
            <div className="pt-6 border-t border-border/60 flex flex-wrap justify-between items-center text-xs text-muted-foreground">
              <p>© {new Date().getFullYear()} Itoby Infotech. All rights reserved.</p>
              <p>Email: sales@itobyinfotech.com | Tel: +91-9142773500</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
