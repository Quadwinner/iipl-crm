import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Clock, Globe, PhoneCall, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/site/ui/button";

interface OfficeHub {
  id: string;
  name: string;
  country: string;
  flag: string;
  type: string;
  address: string;
  timezone: string;
  phone: string;
  email: string;
  coords: { x: number; y: number }; // Percentage position on map
  status: "active" | "standby";
}

interface GlobalOfficeMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const officeHubs: OfficeHub[] = [
  {
    id: "noida",
    name: "Noida Headquarters",
    country: "India",
    flag: "🇮🇳",
    type: "Global Headquarters & R&D Center",
    address: "Sector-4, Noida, Uttar Pradesh 201301",
    timezone: "Asia/Kolkata",
    phone: "+91 91427 73500",
    email: "info@itobyinfotech.com",
    coords: { x: 70, y: 46 },
    status: "active",
  },
  {
    id: "delhi",
    name: "Delhi Regional Hub",
    country: "India",
    flag: "🇮🇳",
    type: "Software Development & Operations",
    address: "L100, Laxmi Nagar, Delhi 110092",
    timezone: "Asia/Kolkata",
    phone: "+91 91427 73500",
    email: "info@itobyinfotech.com",
    coords: { x: 69, y: 45 },
    status: "active",
  },
  {
    id: "usa",
    name: "California Operations",
    country: "United States",
    flag: "🇺🇸",
    type: "US Client & Technology Hub",
    address: "513 W Bonaventure Ave, Tracy, CA 95391, USA",
    timezone: "America/Los_Angeles",
    phone: "+1 (888) 581-3028",
    email: "usa@itobyinfotech.com",
    coords: { x: 22, y: 38 },
    status: "active",
  },
];

export const GlobalOfficeMapModal = ({ isOpen, onClose }: GlobalOfficeMapModalProps) => {
  const [selectedHubId, setSelectedHubId] = useState("noida");
  const [timeStrings, setTimeStrings] = useState<Record<string, string>>({});

  // Update live timezone clocks every second
  useEffect(() => {
    const updateClocks = () => {
      const times: Record<string, string> = {};
      officeHubs.forEach((hub) => {
        try {
          times[hub.id] = new Date().toLocaleTimeString("en-US", {
            timeZone: hub.timezone,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          });
        } catch {
          times[hub.id] = "--:--";
        }
      });
      setTimeStrings(times);
    };

    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const selectedHub = officeHubs.find((h) => h.id === selectedHubId) || officeHubs[0];

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
          {/* Header Bar */}
          <div className="flex items-center justify-between p-4 px-6 border-b border-border/60 bg-muted/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground text-base sm:text-lg leading-tight">
                  Global Engineering Hubs & Live Timezones
                </h3>
                <p className="text-xs text-muted-foreground">Itoby Infotech operates 24/7 across 5 global strategic locations</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto custom-scrollbar grid lg:grid-cols-12 gap-8">
            {/* Left: World Map & Node Pins (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Interactive Global Map
                </span>
                <span className="text-xs text-muted-foreground">Click pins to inspect location</span>
              </div>

              {/* Map Graphic Container */}
              <div className="relative w-full aspect-[16/9] bg-muted/40 rounded-2xl border border-border/60 overflow-hidden flex items-center justify-center p-4">
                {/* World Grid Pattern */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Pulsing Location Pins */}
                {officeHubs.map((hub) => {
                  const isSelected = hub.id === selectedHubId;
                  return (
                    <button
                      key={hub.id}
                      onClick={() => setSelectedHubId(hub.id)}
                      style={{ left: `${hub.coords.x}%`, top: `${hub.coords.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
                    >
                      <div className="relative flex items-center justify-center">
                        <span className={`absolute w-6 h-6 rounded-full bg-primary/40 animate-ping ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-75"}`} />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-lg transition-all duration-300 ${
                          isSelected ? "bg-primary scale-125 ring-4 ring-primary/30" : "bg-card border border-border/80 hover:scale-110"
                        }`}>
                          {hub.flag}
                        </div>
                      </div>
                      <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-background/90 text-foreground whitespace-nowrap shadow border border-border/50">
                        {hub.name.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Hub Selection Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {officeHubs.map((hub) => {
                  const isSelected = hub.id === selectedHubId;
                  return (
                    <button
                      key={hub.id}
                      onClick={() => setSelectedHubId(hub.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground font-bold shadow"
                          : "border-border/50 bg-card/50 text-muted-foreground hover:bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{hub.flag}</span>
                        <span className="text-xs font-semibold truncate">{hub.name.split(" ")[0]}</span>
                      </div>
                      <p className="font-mono text-[10px] text-primary mt-1">{timeStrings[hub.id] || "Loading..."}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Selected Hub Details (5 cols) */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-secondary/30 border border-border/60 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2.5 py-0.5 rounded bg-primary/10">
                    {selectedHub.type}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    24/7 Active
                  </span>
                </div>

                <h4 className="font-display text-xl font-bold text-foreground flex items-center gap-2 mb-2">
                  <span>{selectedHub.flag}</span> {selectedHub.name}
                </h4>

                {/* Live Local Time Box */}
                <div className="p-4 rounded-xl bg-card border border-primary/20 mb-6 text-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-primary" /> Live Local Time ({selectedHub.timezone})
                  </p>
                  <p className="font-mono text-2xl font-extrabold text-primary">
                    {timeStrings[selectedHub.id] || "00:00:00 AM"}
                  </p>
                </div>

                {/* Address & Contact Specs */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{selectedHub.address}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <PhoneCall className="w-4 h-4 text-primary shrink-0" />
                    <a href={`tel:${selectedHub.phone}`} className="hover:text-foreground font-mono">{selectedHub.phone}</a>
                  </div>
                </div>
              </div>

              {/* Book Strategy Call CTA */}
              <Button
                variant="default"
                size="sm"
                className="w-full rounded-xl gap-2 text-xs"
                onClick={() => {
                  onClose();
                  window.location.href = "/book-appointment";
                }}
              >
                Book Strategy Call With This Regional Hub <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
