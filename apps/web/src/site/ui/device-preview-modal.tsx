import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Monitor, Tablet, Smartphone, ExternalLink, Globe, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/site/ui/button";

interface DevicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    title: string;
    category: string;
    image: string;
    description?: string;
    liveUrl?: string;
    tech?: string[];
  } | null;
}

type DeviceMode = "desktop" | "tablet" | "mobile";

export const DevicePreviewModal = ({ isOpen, onClose, project }: DevicePreviewModalProps) => {
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!project) return null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const getContainerWidth = () => {
    switch (device) {
      case "mobile":
        return "max-w-[375px] h-[667px]";
      case "tablet":
        return "max-w-[768px] h-[600px]";
      case "desktop":
      default:
        return "max-w-[1100px] h-[650px]";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-xl"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-6xl bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Header Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 px-6 border-b border-border/60 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground text-base sm:text-lg leading-tight">
                    {project.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{project.category} Interactive Preview</p>
                </div>
              </div>

              {/* Device Mode Switcher */}
              <div className="flex items-center gap-1 p-1 bg-secondary/80 rounded-xl border border-border/50">
                <button
                  onClick={() => setDevice("desktop")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    device === "desktop"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>

                <button
                  onClick={() => setDevice("tablet")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    device === "tablet"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tablet</span>
                </button>

                <button
                  onClick={() => setDevice("mobile")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    device === "mobile"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="rounded-xl"
                  title="Reload Preview"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
                </Button>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Address Bar Simulator */}
            <div className="flex items-center gap-3 px-6 py-2 bg-background/50 border-b border-border/40 text-xs">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 flex items-center gap-2 px-3 py-1 bg-muted/40 rounded-lg border border-border/40 text-muted-foreground font-mono text-[11px] overflow-hidden">
                <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">https://preview.itobyinfotech.com/showcase/{project.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}</span>
              </div>
            </div>

            {/* Device Viewport Canvas */}
            <div className="flex-1 bg-zinc-950 p-4 sm:p-8 flex items-center justify-center overflow-auto min-h-[400px]">
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`w-full ${getContainerWidth()} bg-background rounded-2xl overflow-hidden border-4 border-zinc-800 shadow-2xl flex flex-col relative transition-all duration-300 ${
                  isRefreshing ? "opacity-40 blur-[1px]" : "opacity-100"
                }`}
              >
                {/* Device Camera Notch for Mobile/Tablet */}
                {device !== "desktop" && (
                  <div className="w-full bg-zinc-900 py-1.5 flex justify-center shrink-0">
                    <div className="w-16 h-3 bg-zinc-800 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-zinc-700" />
                    </div>
                  </div>
                )}

                {/* Simulated Content Frame */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-auto object-top min-h-full"
                  />
                </div>
              </motion.div>
            </div>

            {/* Modal Footer Info */}
            <div className="p-4 px-6 border-t border-border/60 bg-card flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground">Technologies:</span>
                {project.tech ? (
                  project.tech.map((t) => (
                    <span key={t} className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground">React • Tailwind • TypeScript</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-2 text-xs"
                onClick={() => window.open("/portfolio", "_blank")}
              >
                Full Case Study <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
