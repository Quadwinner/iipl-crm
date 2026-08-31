
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, LogIn, Search, ExternalLink, Sparkles, Code2, Layers } from "lucide-react";
import { Button } from "@/site/ui/button";

const serviceLinks = [
  { name: "Web Design & Development", path: "/services/web-design" },
  { name: "Mobile App Development", path: "/services/mobile-app" },
  { name: "Digital Marketing", path: "/services/digital-marketing" },
  { name: "Custom Software Solutions", path: "/services/software-solutions" },
  { name: "Microsoft 365 Services", path: "/services/microsoft-365" },
  { name: "AI Development", path: "/services/ai-development-company" },
  { name: "SaaS Development", path: "/services/saas-development-company" },
  { name: "AI Agent Development", path: "/services/ai-agent-development" },
  { name: "AI Chatbot Development", path: "/services/ai-chatbot-development" },
  { name: "ERP Development", path: "/services/erp-development" },
  { name: "CRM Development", path: "/services/crm-development" },
];

const saasProductNavLinks = [
  { name: "IIPL Lead (AI Cold Email & B2B CRM)", path: "https://lead.itobyinfotech.com", isExternal: true, badge: "Flagship" },
  { name: "IIPL Renting (Office & Tenant CRM)", path: "/app/rental", isExternal: false, badge: "PropTech" },
  { name: "IIPL Billing (GST Invoicing SaaS)", path: "https://billing.itobyinfotech.com", isExternal: true, badge: "GST" },
  { name: "IIPL Cashmemo (Cash Invoice Builder)", path: "https://cashmemo.itobyinfotech.com", isExternal: true, badge: "POS" },
  { name: "IIPL Calling (AI Voice Agents)", path: "https://royalblue-ant-234341.hostingersite.com/", isExternal: true, badge: "Voice AI" },
];

const navLinks = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Services & SaaS", path: "/services", hasDropdown: true },
  { name: "Portfolio", path: "/portfolio" },
  { name: "Blog", path: "/blog" },
  { name: "Contact", path: "/contact" },
];

const menuItemVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
  exit: (i: number) => ({
    opacity: 0,
    x: 50,
    transition: {
      delay: i * 0.02,
      duration: 0.2,
    },
  }),
};

interface HeaderProps {
  onOpenSearch?: () => void;
}

export const Header = ({ onOpenSearch }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);

  const servicesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = useLocation().pathname;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleServicesMouseEnter = () => {
    if (servicesTimeoutRef.current) clearTimeout(servicesTimeoutRef.current);
    setIsServicesOpen(true);
  };

  const handleServicesMouseLeave = () => {
    servicesTimeoutRef.current = setTimeout(() => {
      setIsServicesOpen(false);
    }, 150);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "glass-dark bg-background/90 backdrop-blur-xl border-b border-border/60 py-3 shadow-lg"
            : "bg-transparent py-5"
        }`}
      >
        <div className="container-wide">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary flex items-center justify-center group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] transition-shadow duration-300">
                  <span className="text-primary-foreground font-display font-bold text-base sm:text-xl">
                    IIPL
                  </span>
                </div>
                <span className="text-foreground font-display font-bold text-sm sm:text-xl">
                  Itoby<span className="text-primary"> Infotech</span>
                </span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => {
                if (link.hasDropdown) {
                  return (
                    <div
                      key={link.path}
                      className="relative"
                      onMouseEnter={handleServicesMouseEnter}
                      onMouseLeave={handleServicesMouseLeave}
                    >
                      <Link
                        to={link.path}
                        className={`group flex items-center gap-1 text-sm font-semibold transition-colors relative py-1 ${
                          pathname.startsWith("/services")
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {link.name}
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${isServicesOpen ? "rotate-180 text-primary" : ""}`}
                        />
                        {pathname.startsWith("/services") && (
                          <motion.span
                            layoutId="activeNav"
                            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                          />
                        )}
                      </Link>

                      {/* Megamenu Dropdown combining Services & IIPL SaaS */}
                      <AnimatePresence>
                        {isServicesOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full -left-20 pt-2 z-50"
                          >
                            <div className="w-[880px] rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl p-4 shadow-2xl grid grid-cols-3 gap-4">
                              {/* Col 1: Digital Agency Services */}
                              <div className="space-y-1 bg-secondary/30 p-3 rounded-2xl border border-border/40 max-h-[380px] overflow-y-auto">
                                <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-primary px-2 py-1 mb-1">
                                  <Code2 size={14} />
                                  Digital Services
                                </div>
                                <Link
                                  to="/services"
                                  className="block px-2.5 py-1.5 text-xs font-bold text-foreground hover:text-primary rounded-xl hover:bg-secondary transition-colors"
                                >
                                  All Services Overview →
                                </Link>
                                {serviceLinks.map((service) => (
                                  <Link
                                    key={service.path}
                                    to={service.path}
                                    className="block px-2.5 py-1.5 text-xs font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
                                  >
                                    {service.name}
                                  </Link>
                                ))}
                              </div>

                              {/* Col 2: IIPL SaaS Platforms */}
                              <div className="space-y-1 bg-primary/5 p-3 rounded-2xl border border-primary/20">
                                <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-primary px-2 py-1 mb-1">
                                  <Sparkles size={14} className="animate-pulse" />
                                  Live SaaS Apps
                                </div>
                                {saasProductNavLinks.map((prod) => (
                                  <a
                                    key={prod.name}
                                    href={prod.path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold rounded-xl hover:bg-primary/15 hover:text-primary transition-colors group"
                                  >
                                    <span className="flex items-center gap-1.5 truncate">
                                      <ExternalLink size={12} className="text-primary shrink-0" />
                                      {prod.name}
                                    </span>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary shrink-0">
                                      {prod.badge}
                                    </span>
                                  </a>
                                ))}
                              </div>

                              {/* Col 3: Software Products Hub */}
                              <div className="space-y-1 bg-secondary/20 p-3 rounded-2xl border border-border/40">
                                <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-primary px-2 py-1 mb-1">
                                  <Layers size={14} />
                                  Products Hub
                                </div>
                                <Link
                                  to="/products"
                                  className="block px-2.5 py-1.5 text-xs font-bold text-foreground hover:text-primary rounded-xl hover:bg-secondary transition-colors"
                                >
                                  All Products Hub →
                                </Link>
                                <Link
                                  to="/products/leadflow"
                                  className="block px-2.5 py-1.5 text-xs font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
                                >
                                  LeadFlow B2B SaaS
                                </Link>
                                <Link
                                  to="/products/billing"
                                  className="block px-2.5 py-1.5 text-xs font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
                                >
                                  IIPL Billing GST SaaS
                                </Link>
                                <Link
                                  to="/products/whatsapp"
                                  className="block px-2.5 py-1.5 text-xs font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
                                >
                                  IIPL Cashmemo WhatsApp
                                </Link>
                                <Link
                                  to="/products/renting"
                                  className="block px-2.5 py-1.5 text-xs font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
                                >
                                  PropTech Renting CRM
                                </Link>
                                <Link
                                  to="/products/calling"
                                  className="block px-2.5 py-1.5 text-xs font-medium rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
                                >
                                  IIPL Calling Voice AI
                                </Link>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative text-sm font-medium transition-colors group ${
                      pathname === link.path
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {link.name}
                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 bg-primary rounded-full transition-all duration-300 ${
                        pathname === link.path ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Actions & Theme Toggles */}
            <div className="hidden lg:flex items-center gap-4">
              {onOpenSearch && (
                <button
                  onClick={onOpenSearch}
                  className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors cursor-pointer"
                  aria-label="Search"
                >
                  <Search size={20} />
                </button>
              )}
              <Link
                to="/admin"
                className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                aria-label="Admin Login"
              >
                <LogIn size={20} />
              </Link>
              <Button size="lg" className="gap-2 shadow-lg hover:shadow-primary/25" asChild>
                <Link to="/request-quote">Get a Free Quote</Link>
              </Button>
            </div>

            {/* Mobile Toggle */}
            <div className="flex items-center gap-2 lg:hidden">
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl bg-card border border-border text-foreground focus:outline-none"
                aria-label="Toggle Mobile Menu"
                whileTap={{ scale: 0.9 }}
              >
                <div className="relative w-5 h-4 flex flex-col justify-between">
                  <motion.span
                    animate={isMobileMenuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-0.5 bg-foreground rounded-full block origin-center"
                  />
                  <motion.span
                    animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-0.5 bg-foreground rounded-full block"
                  />
                  <motion.span
                    animate={isMobileMenuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-0.5 bg-foreground rounded-full block origin-center"
                  />
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Fullscreen Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 lg:hidden glass-dark bg-background/98 backdrop-blur-3xl pt-20 pb-8 px-5 overflow-y-auto"
          >
            <div className="flex flex-col justify-between min-h-full space-y-6 pt-4">
              <nav className="flex flex-col space-y-3">
                {navLinks.map((link, i) => {
                  if (link.hasDropdown) {
                    return (
                      <motion.div
                        key={link.path}
                        custom={i}
                        variants={menuItemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="rounded-2xl bg-card/40 border border-border/50 overflow-hidden"
                      >
                        <div className="flex items-center justify-between p-3.5">
                          <Link
                            to={link.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-xl font-display font-bold text-foreground hover:text-primary transition-colors flex items-center gap-2"
                          >
                            <Layers size={18} className="text-primary" />
                            {link.name}
                          </Link>

                          <button
                            onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
                            className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            aria-label="Toggle Services Dropdown"
                          >
                            <ChevronDown
                              size={18}
                              className={`transition-transform duration-300 ${isMobileServicesOpen ? "rotate-180" : ""}`}
                            />
                          </button>
                        </div>

                        <AnimatePresence>
                          {isMobileServicesOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden border-t border-border/50 bg-secondary/30 p-3 space-y-4"
                            >
                              <div>
                                <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                                  <Code2 size={13} /> Digital Services
                                </p>
                                <div className="space-y-1 pl-2">
                                  {serviceLinks.map((svc) => (
                                    <Link
                                      key={svc.path}
                                      to={svc.path}
                                      onClick={() => setIsMobileMenuOpen(false)}
                                      className="block py-1.5 px-2.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                    >
                                      {svc.name}
                                    </Link>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                                  <Sparkles size={13} /> IIPL SaaS Products
                                </p>
                                <div className="space-y-1 pl-2">
                                  {saasProductNavLinks.map((prod) => (
                                    <a
                                      key={prod.name}
                                      href={prod.path}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                    >
                                      <span>{prod.name}</span>
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                                        {prod.badge}
                                      </span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={link.path}
                      custom={i}
                      variants={menuItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <Link
                        to={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block p-3.5 rounded-2xl bg-card/40 border border-border/50 text-xl font-display font-bold text-foreground hover:text-primary transition-colors"
                      >
                        {link.name}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-border/40 space-y-3">
                <Button className="w-full font-bold rounded-2xl py-6" asChild>
                  <Link to="/request-quote" onClick={() => setIsMobileMenuOpen(false)}>
                    Get a Free Quote
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
