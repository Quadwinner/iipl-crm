import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Gauge, Sparkles, CheckCircle2, ArrowRight, Zap, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/site/ui/button";
import { Input } from "@/site/ui/input";

interface SiteAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AuditResult {
  url: string;
  speedScore: number;
  mobileScore: number;
  seoScore: number;
  securityScore: number;
  issuesFound: string[];
  recommendations: string[];
}

export const SiteAuditModal = ({ isOpen, onClose }: SiteAuditModalProps) => {
  const [urlInput, setUrlInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  if (!isOpen) return null;

  const handleRunAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsAnalyzing(true);
    setAuditResult(null);

    // Simulate AI audit analysis pipeline
    setTimeout(() => {
      let formattedUrl = urlInput.trim();
      if (!formattedUrl.startsWith("http")) {
        formattedUrl = `https://${formattedUrl}`;
      }

      setAuditResult({
        url: formattedUrl,
        speedScore: Math.floor(52 + Math.random() * 20), // Simulated current site score (needs upgrade)
        mobileScore: Math.floor(58 + Math.random() * 18),
        seoScore: Math.floor(64 + Math.random() * 20),
        securityScore: 85,
        issuesFound: [
          "Slow Largest Contentful Paint (LCP) > 3.4 seconds",
          "Unoptimized JPEG images without WebP compression",
          "Missing JSON-LD Schema markup for Google Rich Snippets",
          "Render-blocking JavaScript slowing mobile page load",
        ],
        recommendations: [
          "Upgrade to Itoby Edge React/Vite stack for < 100ms load speeds",
          "Convert images to next-gen WebP/AVIF with blur placeholders",
          "Inject automated Schema.org metadata for top SERP rankings",
          "Implement PWA offline caching & cyber-glow UI redesign",
        ],
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 70) return "text-amber-500 border-amber-500/30 bg-amber-500/10";
    return "text-red-500 border-red-500/30 bg-red-500/10";
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-background/85 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
          className="relative z-10 w-full max-w-3xl bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between p-4 px-6 border-b border-border/60 bg-muted/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Gauge className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground text-base sm:text-lg leading-tight">
                  Instant AI Website & UX Performance Audit
                </h3>
                <p className="text-xs text-muted-foreground">Analyze your website speed, mobile score & growth bottlenecks</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Input Section */}
          <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar space-y-6">
            <form onSubmit={handleRunAudit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter your website URL (e.g. mycompany.com)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="pl-10 rounded-2xl h-12 text-sm bg-background border-border/60"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isAnalyzing || !urlInput.trim()}
                className="rounded-2xl h-12 px-6 gap-2 text-xs font-bold shrink-0 shadow-lg shadow-primary/20"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-primary-foreground" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" /> Run Instant Audit
                  </>
                )}
              </Button>
            </form>

            {/* Analyzing Animated State */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 rounded-2xl bg-primary/5 border border-primary/20 text-center space-y-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <RefreshCw className="w-7 h-7 text-primary animate-spin" />
                </div>
                <div>
                  <h4 className="font-display text-lg font-bold text-foreground">Scanning Website Architecture...</h4>
                  <p className="text-xs text-muted-foreground mt-1">Checking Lighthouse PageSpeed, Core Web Vitals, Mobile UX & SEO markup</p>
                </div>
                <div className="w-full max-w-xs mx-auto h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="h-full w-full bg-primary origin-left"
                  />
                </div>
              </motion.div>
            )}

            {/* Audit Results View */}
            {auditResult && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <span className="text-xs font-bold text-muted-foreground">Audit Target:</span>
                  <span className="font-mono text-xs font-semibold text-primary">{auditResult.url}</span>
                </div>

                {/* Scores Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className={`p-4 rounded-2xl border text-center ${getScoreColor(auditResult.speedScore)}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1">Page Speed</p>
                    <p className="font-display text-3xl font-extrabold">{auditResult.speedScore}/100</p>
                    <span className="text-[9px] font-medium block mt-1">Needs Speed Boost</span>
                  </div>

                  <div className={`p-4 rounded-2xl border text-center ${getScoreColor(auditResult.mobileScore)}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1">Mobile UX</p>
                    <p className="font-display text-3xl font-extrabold">{auditResult.mobileScore}/100</p>
                    <span className="text-[9px] font-medium block mt-1">Unoptimized Mobile</span>
                  </div>

                  <div className={`p-4 rounded-2xl border text-center ${getScoreColor(auditResult.seoScore)}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1">SEO Rating</p>
                    <p className="font-display text-3xl font-extrabold">{auditResult.seoScore}/100</p>
                    <span className="text-[9px] font-medium block mt-1">Missing Schema</span>
                  </div>

                  <div className={`p-4 rounded-2xl border text-center ${getScoreColor(auditResult.securityScore)}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1">Security</p>
                    <p className="font-display text-3xl font-extrabold">{auditResult.securityScore}/100</p>
                    <span className="text-[9px] font-medium block mt-1">SSL Encrypted</span>
                  </div>
                </div>

                {/* Bottlenecks Found */}
                <div className="p-4 rounded-2xl bg-card border border-border/60">
                  <h4 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Detected Performance & Growth Bottlenecks
                  </h4>
                  <ul className="space-y-2">
                    {auditResult.issuesFound.map((issue) => (
                      <li key={issue} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Fixes */}
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                  <h4 className="font-display text-sm font-bold text-primary mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Itoby Infotech Recommended Transformation
                  </h4>
                  <ul className="space-y-2 mb-4">
                    {auditResult.recommendations.map((rec) => (
                      <li key={rec} className="text-xs text-foreground font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant="default"
                    size="sm"
                    className="w-full rounded-xl gap-2 text-xs"
                    onClick={() => {
                      onClose();
                      window.location.href = `/request-quote?url=${encodeURIComponent(auditResult.url)}`;
                    }}
                  >
                    Get Free Proposal To Upgrade This Website <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
