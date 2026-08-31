import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Cpu, Database, Server, Cloud, ShieldCheck, Sparkles, ArrowRight, Activity } from "lucide-react";
import { Button } from "@/site/ui/button";

interface ArchitectureNode {
  id: string;
  name: string;
  category: "frontend" | "backend" | "database" | "cloud" | "security";
  icon: typeof Cpu;
  description: string;
  tech: string[];
  metrics: { label: string; value: string }[];
}

interface TechArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const architecturePresets = [
  { id: "saas", label: "SaaS Web Architecture", desc: "High-scale multi-tenant web application setup" },
  { id: "mobile", label: "Mobile App Ecosystem", desc: "Cross-platform iOS/Android app with real-time sync" },
  { id: "ecommerce", label: "Enterprise E-Commerce", desc: "High-volume headless commerce with Stripe & PWA" },
  { id: "ai", label: "AI & ML Automation Engine", desc: "LLM agents, vector DBs & automated workflows" },
];

const nodesByPreset: Record<string, ArchitectureNode[]> = {
  saas: [
    {
      id: "fe",
      name: "High-Performance Edge Frontend",
      category: "frontend",
      icon: Cpu,
      description: "React 18 + TypeScript SPA/SSR served via Cloudflare Global Edge CDN for sub-100ms global load times.",
      tech: ["React 18", "Vite", "Tailwind CSS", "Framer Motion", "TypeScript"],
      metrics: [
        { label: "Lighthouse Score", value: "98/100" },
        { label: "Global Latency", value: "< 45ms" },
      ],
    },
    {
      id: "be",
      name: "Microservice API Gateway",
      category: "backend",
      icon: Server,
      description: "Decoupled Node.js / Express microservices with GraphQL & REST endpoints, rate limiting, and JWT authentication.",
      tech: ["Node.js", "Express", "GraphQL", "Docker", "Kubernetes"],
      metrics: [
        { label: "Throughput", value: "50k req/sec" },
        { label: "Uptime SLA", value: "99.99%" },
      ],
    },
    {
      id: "db",
      name: "Distributed Database & Cache",
      category: "database",
      icon: Database,
      description: "PostgreSQL relational database with read replicas combined with Redis cluster for instant cache hits.",
      tech: ["PostgreSQL", "Supabase", "Redis Cache", "Prisma ORM"],
      metrics: [
        { label: "Query Time", value: "< 4ms" },
        { label: "Data Backup", value: "Hourly Auto Snapshots" },
      ],
    },
    {
      id: "cloud",
      name: "Cloud Infrastructure & CI/CD",
      category: "cloud",
      icon: Cloud,
      description: "Automated GitHub Actions deployment pipeline targeting AWS Elastic Container Service with zero-downtime rolling updates.",
      tech: ["AWS ECS", "Docker", "GitHub Actions", "Cloudflare CDN"],
      metrics: [
        { label: "Deploy Time", value: "3.5 Mins" },
        { label: "Auto-Scaling", value: "1-100 Nodes" },
      ],
    },
    {
      id: "sec",
      name: "Enterprise Security Shield",
      category: "security",
      icon: ShieldCheck,
      description: "End-to-end TLS 1.3 encryption, DDoS protection, GDPR compliance controls, and automated dependency vulnerability auditing.",
      tech: ["SSL / TLS 1.3", "WAF Shield", "GDPR Compliant", "OAuth 2.0"],
      metrics: [
        { label: "Security Rating", value: "Grade A+" },
        { label: "Vulnerability Scans", value: "Daily Automated" },
      ],
    },
  ],
  mobile: [
    {
      id: "mob-fe",
      name: "Cross-Platform Native Client",
      category: "frontend",
      icon: Cpu,
      description: "React Native app compiled natively for iOS & Android with 60 FPS animations and offline SQLite caching.",
      tech: ["React Native", "Expo", "SQLite Offline", "Reanimated 3"],
      metrics: [
        { label: "Frame Rate", value: "60 FPS Constant" },
        { label: "Bundle Size", value: "< 18 MB" },
      ],
    },
    {
      id: "mob-sync",
      name: "Real-Time WebSocket Sync",
      category: "backend",
      icon: Server,
      description: "Bidirectional WebSocket connection for live notifications, chat messaging, and instant order tracking updates.",
      tech: ["WebSockets", "Socket.io", "Push Notifications", "Firebase Cloud Messaging"],
      metrics: [
        { label: "Sync Speed", value: "Real-Time (< 20ms)" },
        { label: "Push Deliverability", value: "99.8%" },
      ],
    },
  ],
};

export const TechArchitectureModal = ({ isOpen, onClose }: TechArchitectureModalProps) => {
  const [selectedPreset, setSelectedPreset] = useState("saas");
  const [activeNodeId, setActiveNodeId] = useState("fe");

  if (!isOpen) return null;

  const currentNodes = nodesByPreset[selectedPreset] || nodesByPreset.saas;
  const activeNode = currentNodes.find((n) => n.id === activeNodeId) || currentNodes[0];

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
          className="relative z-10 w-full max-w-5xl bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 px-6 border-b border-border/60 bg-muted/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground text-base sm:text-lg leading-tight">
                  System Architecture & Tech Flow Visualizer
                </h3>
                <p className="text-xs text-muted-foreground">Interactive blueprint of Itoby Infotech's engineering standards</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preset Blueprint Selector */}
          <div className="p-4 px-6 bg-background/50 border-b border-border/40 flex flex-wrap gap-2">
            {architecturePresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedPreset(preset.id);
                  const firstNode = (nodesByPreset[preset.id] || nodesByPreset.saas)[0];
                  setActiveNodeId(firstNode.id);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                  selectedPreset === preset.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Main Visualizer Diagram & Detail Panel */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto custom-scrollbar grid lg:grid-cols-12 gap-8">
            {/* Left Column: Interactive Node Flow Diagram (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Interactive Blueprint Nodes
                </span>
                <span className="text-xs text-muted-foreground">Click any node to inspect specs</span>
              </div>

              <div className="space-y-3">
                {currentNodes.map((node, idx) => {
                  const isActive = node.id === activeNodeId;
                  const NodeIcon = node.icon;
                  return (
                    <motion.div
                      key={node.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      onClick={() => setActiveNodeId(node.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 group flex items-center justify-between ${
                        isActive
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20 ring-1 ring-primary/30"
                          : "border-border/60 bg-card/60 hover:border-primary/40 hover:bg-card/90"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                          isActive ? "bg-primary text-primary-foreground shadow-md" : "bg-primary/10 text-primary group-hover:bg-primary/20"
                        }`}>
                          <NodeIcon className="w-5.5 h-5.5" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                            {node.name}
                          </h4>
                          <div className="flex gap-2 mt-1">
                            {node.tech.slice(0, 3).map((t) => (
                              <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-muted/60 text-muted-foreground font-mono">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <ArrowRight className={`w-4 h-4 transition-transform ${
                        isActive ? "text-primary translate-x-1" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                      }`} />
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Node Inspector Panel (5 cols) */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-secondary/30 border border-border/60 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <activeNode.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2 py-0.5 rounded bg-primary/10">
                      {activeNode.category}
                    </span>
                    <h4 className="font-display text-lg font-bold text-foreground mt-1">
                      {activeNode.name}
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                  {activeNode.description}
                </p>

                {/* Performance & Security Metrics */}
                <div className="space-y-3 mb-6">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Engineering SLA Benchmarks</span>
                  <div className="grid grid-cols-2 gap-3">
                    {activeNode.metrics.map((m) => (
                      <div key={m.label} className="p-3 rounded-xl bg-card border border-border/50">
                        <p className="text-[10px] text-muted-foreground uppercase">{m.label}</p>
                        <p className="font-display font-extrabold text-sm text-primary mt-0.5">{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tech Stack Pills */}
                <div>
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 block">Technology Stack</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeNode.tech.map((t) => (
                      <span key={t} className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Call to action inside Inspector */}
              <Button
                variant="default"
                size="sm"
                className="w-full rounded-xl gap-2 text-xs"
                onClick={() => {
                  onClose();
                  window.location.href = "/request-quote";
                }}
              >
                Build Architecture Like This <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
