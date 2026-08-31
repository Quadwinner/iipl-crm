
import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, Linkedin, Twitter } from "@/site/ui/brand-icons";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  ArrowUpRight,
  MessageCircle,
  Loader2,
  CheckCircle2,
  CalendarDays,
  Globe,
  ChevronDown,
  Coins,
  Bot,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Button } from "@/site/ui/button";
import { useRef, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Footer3DBackground } from "@/site/ui/footer-3d-background";
import { useCurrency, type CurrencyType } from "@/site/hooks/useCurrency";

const saasProductsList = [
  { name: "IIPL Lead (AI Cold Email & B2B CRM)", path: "https://lead.itobyinfotech.com", isExternal: true },
  { name: "IIPL Renting (Office Rent & Tenant CRM)", path: "/app/rental", isExternal: false },
  { name: "IIPL Billing (GST & Invoicing SaaS)", path: "https://billing.itobyinfotech.com", isExternal: true },
  { name: "IIPL Cashmemo (Cash Invoice Generator)", path: "https://cashmemo.itobyinfotech.com", isExternal: true },
  { name: "IIPL Calling (AI Voice Calling Agents)", path: "https://royalblue-ant-234341.hostingersite.com/", isExternal: true },
];

const services = [
  { name: "Web Design & Development", path: "/services/web-design" },
  { name: "Mobile App Development", path: "/services/mobile-app" },
  { name: "Mobile App Development Services", path: "/services/mobile-app-development" },
  { name: "Digital Marketing", path: "/services/digital-marketing" },
  { name: "Software Solutions", path: "/services/software-solutions" },
  { name: "Microsoft Office 365", path: "/services/microsoft-365" },
];

const quickLinks = [
  { name: "About Us", path: "/about" },
  { name: "SaaS Products Hub", path: "/products" },
  { name: "Client Case Studies", path: "/case-studies" },
  { name: "Industries Served", path: "/industries" },
  { name: "Technology Stack", path: "/technology" },
  { name: "Pricing Guides", path: "/pricing" },
  { name: "Tech Comparisons", path: "/comparison" },
  { name: "Resources & Checklists", path: "/resources" },
  { name: "Our Portfolio", path: "/portfolio" },
  { name: "Careers & Hiring", path: "/careers" },
  { name: "Blog & Insights", path: "/blog" },
  { name: "Install Progressive Web App (PWA)", path: "/install" },
  { name: "Contact Us", path: "/contact" },
  { name: "Book Appointment", path: "/book-appointment" },
];

const socialLinks = [
  { icon: Linkedin, href: "https://www.linkedin.com/in/itoby-infotech-629529428", label: "LinkedIn" },
  { icon: Twitter, href: "https://twitter.com/itobyinfotech", label: "Twitter" },
  { icon: Instagram, href: "https://www.instagram.com/itobyinfotechpvtltd/", label: "Instagram" },
  { icon: Facebook, href: "https://www.facebook.com/itobyinfotech2017", label: "Facebook" },
  { icon: Youtube, href: "https://youtube.com/@itobyinfotech", label: "YouTube" },
];

const currenciesList: { code: CurrencyType; symbol: string; flag: string; label: string }[] = [
  { code: "USD", symbol: "$", flag: "🇺🇸", label: "USD ($)" },
  { code: "INR", symbol: "₹", flag: "🇮🇳", label: "INR (₹)" },
  { code: "EUR", symbol: "€", flag: "🇪🇺", label: "EUR (€)" },
  { code: "GBP", symbol: "£", flag: "🇬🇧", label: "GBP (£)" },
  { code: "AUD", symbol: "A$", flag: "🇦🇺", label: "AUD (A$)" },
  { code: "CAD", symbol: "C$", flag: "🇨🇦", label: "CAD (C$)" },
  { code: "AED", symbol: "AED", flag: "🇦🇪", label: "AED" },
];

const languagesList = [
  { code: "en-US", name: "English (US)", flag: "🇺🇸" },
  { code: "en-UK", name: "English (UK)", flag: "🇬🇧" },
  { code: "en-IN", name: "English (IN)", flag: "🇮🇳" },
  { code: "hi-IN", name: "Hindi (हिन्दी)", flag: "🇮🇳" },
  { code: "es-ES", name: "Español", flag: "🇪🇸" },
  { code: "fr-FR", name: "Français", flag: "🇫🇷" },
  { code: "de-DE", name: "Deutsch", flag: "🇩🇪" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const whatsappNumber = "919142773500";
  const whatsappMessage = encodeURIComponent("Hi! I'm interested in your digital services.");
  const whatsappLink = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${whatsappMessage}`;

  const { currency, setCurrency } = useCurrency();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en-US");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  const newsletterRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const newsletterInView = useInView(newsletterRef, { once: true, amount: 0.3 });
  const mainInView = useInView(mainRef, { once: true, amount: 0.1 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("itoby-language");
      if (savedLang) setSelectedLang(savedLang);
    }
  }, []);

  const activeCurrency = currenciesList.find((c) => c.code === currency) || currenciesList[0];
  const activeLang = languagesList.find((l) => l.code === selectedLang) || languagesList[0];

  const handleLangChange = (code: string) => {
    setSelectedLang(code);
    setIsLangOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("itoby-language", code);
      toast.success(`Language set to ${languagesList.find((l) => l.code === code)?.name}`);
    }
  };

  return (
    <footer className="relative bg-card border-t border-border overflow-hidden text-foreground">
      {/* Advanced 3D Interactive Background */}
      <Footer3DBackground />

      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-glow-secondary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Newsletter Section */}
      <div className="relative border-b border-border" ref={newsletterRef}>
        <div className="container-wide py-10 sm:py-14">
          <motion.div
            className="flex flex-col items-center gap-6 text-center"
            initial={{ opacity: 0, y: 40 }}
            animate={newsletterInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.7 }}
          >
            <div className="text-center">
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold mb-2">
                Stay Updated with <span className="gradient-text">Our Insights</span>
              </h3>
              <p className="text-muted-foreground text-sm max-w-xl mx-auto">Get the latest tech trends, IIPL product updates & news delivered to your inbox.</p>
            </div>
            <motion.form
              className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center justify-center"
              initial={{ opacity: 0, x: 30 }}
              animate={newsletterInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              onSubmit={async (e) => {
                e.preventDefault();
                const trimmed = email.trim();
                if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
                  toast.error("Please enter a valid email address.");
                  return;
                }
                setIsSubmitting(true);
                try {
                  // No newsletter table: subscriptions go through the same
                  // rate-limited submit_lead path as every other public form,
                  // so they land in the leads inbox.
                  const { error } = await supabase().rpc("submit_lead", {
                    p_full_name: trimmed.split("@")[0],
                    p_email: trimmed,
                    p_message: "Newsletter subscription",
                    p_source: "OTHER",
                    p_page_path: window.location.pathname,
                  });
                  if (error) {
                    toast.error(error.message);
                    return;
                  }
                  toast.success("Successfully subscribed! 🎉");
                  setIsSubscribed(true);
                  setEmail("");
                } catch {
                  toast.error("Something went wrong. Please try again.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              {isSubscribed ? (
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <CheckCircle2 size={18} />
                  <span>Thank you for subscribing!</span>
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    className="h-11 px-4 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_20px_hsl(var(--primary)/0.2)] transition-all w-full sm:w-72"
                    disabled={isSubmitting}
                    required
                  />
                  <Button variant="hero" size="lg" className="shrink-0 group cursor-pointer h-11 px-6 text-sm font-bold" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Subscribe"}
                    {!isSubmitting && (
                      <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    )}
                  </Button>
                </>
              )}
            </motion.form>
          </motion.div>
        </div>
      </div>

      {/* Modern 3D Interactive Contact Cards Bar */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md py-7">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
            {/* Address */}
            <a
              href="https://maps.google.com/?q=Noida,Uttar Pradesh,India"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 sm:p-5 rounded-2xl bg-secondary/50 border border-border/80 hover:border-primary/80 hover:bg-secondary/90 transition-all duration-300 flex items-center gap-4 group shadow-md"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                <MapPin size={22} className="text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-primary tracking-widest">Headquarters</p>
                <h5 className="font-display font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                  Sector-4, Noida, UP, India
                </h5>
                <p className="text-xs text-muted-foreground">Itoby Infotech Pvt Ltd (IIPL)</p>
              </div>
            </a>

            {/* Phone */}
            <a
              href="tel:+919142773500"
              className="p-4 sm:p-5 rounded-2xl bg-secondary/50 border border-border/80 hover:border-primary/80 hover:bg-secondary/90 transition-all duration-300 flex items-center gap-4 group shadow-md"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                <Phone size={22} className="text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-primary tracking-widest">Direct Hotline</p>
                <h5 className="font-display font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                  +91 91427 73500
                </h5>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={12} className="text-primary" /> Mon-Sat, 9AM-6PM IST
                </p>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:info@itobyinfotech.com"
              className="p-4 sm:p-5 rounded-2xl bg-secondary/50 border border-border/80 hover:border-primary/80 hover:bg-secondary/90 transition-all duration-300 flex items-center gap-4 group shadow-md"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                <Mail size={22} className="text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-primary tracking-widest">Email Inquiry</p>
                <h5 className="font-display font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                  info@itobyinfotech.com
                </h5>
                <p className="text-xs text-muted-foreground">Fast Response & Quote Support</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Content Grid */}
      <motion.div
        ref={mainRef}
        className="container-wide py-12 lg:py-14 relative"
        variants={containerVariants}
        initial="hidden"
        animate={mainInView ? "visible" : "hidden"}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Company Info */}
          <motion.div variants={itemVariants} className="space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <motion.div
                className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] transition-shadow"
                whileHover={{ rotate: 5, scale: 1.05 }}
              >
                <span className="text-primary-foreground font-display font-bold text-xl">IIPL</span>
              </motion.div>
              <span className="text-foreground font-display font-bold text-xl">
                Itoby<span className="text-primary"> Infotech</span>
              </span>
            </Link>

            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              <strong className="text-foreground font-semibold">Itoby Infotech Pvt Ltd (IIPL)</strong> is a premier global digital agency & SaaS engineering firm delivering AI lead automation, rental CRMs, billing systems, app development, and enterprise software.
            </p>

            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/15 transition-colors shadow-sm"
                  aria-label={social.label}
                >
                  <social.icon size={17} />
                </motion.a>
              ))}
            </div>

            {/* WhatsApp CTA */}
            <motion.a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/30 transition-all text-xs font-bold shadow-sm"
            >
              <MessageCircle size={17} />
              Chat on WhatsApp
            </motion.a>
          </motion.div>

          {/* IIPL SaaS Products */}
          <motion.div variants={itemVariants}>
            <h4 className="font-display font-extrabold text-base sm:text-lg mb-4 flex items-center gap-2 text-primary">
              <Bot size={18} />
              IIPL SaaS Suite
            </h4>
            <ul className="space-y-2.5">
              {saasProductsList.map((prod) => (
                <li key={prod.name}>
                  {prod.isExternal ? (
                    <a
                      href={prod.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1.5 group"
                    >
                      <ExternalLink size={13} className="text-primary shrink-0 group-hover:scale-110 transition-transform" />
                      <span>{prod.name}</span>
                    </a>
                  ) : (
                    <Link
                      to={prod.path}
                      className="text-muted-foreground hover:text-primary text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1.5 group"
                    >
                      <ArrowUpRight size={13} className="text-primary shrink-0 group-hover:scale-110 transition-transform" />
                      <span>{prod.name}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Services */}
          <motion.div variants={itemVariants}>
            <h4 className="font-display font-extrabold text-base sm:text-lg mb-4">Our Digital Services</h4>
            <ul className="space-y-2.5">
              {services.map((service) => (
                <li key={service.name}>
                  <Link
                    to={service.path}
                    className="text-muted-foreground hover:text-primary text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1.5 group"
                  >
                    <span className="w-0 group-hover:w-3.5 transition-all overflow-hidden">
                      <ArrowUpRight size={13} className="text-primary" />
                    </span>
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h4 className="font-display font-extrabold text-base sm:text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-muted-foreground hover:text-primary text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1.5 group"
                  >
                    <span className="w-0 group-hover:w-3.5 transition-all overflow-hidden">
                      <ArrowUpRight size={13} className="text-primary" />
                    </span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </motion.div>

      {/* Book Appointment CTA */}
      <div className="relative border-t border-border">
        <div className="container-wide py-8 sm:py-10">
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-between gap-5 p-6 sm:p-8 rounded-3xl bg-primary/10 border border-primary/25 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center sm:text-left">
              <h3 className="font-display text-xl sm:text-2xl font-extrabold mb-1">Ready to Start Your Digital Project?</h3>
              <p className="text-muted-foreground text-xs sm:text-sm max-w-xl">
                Book a free 30-min strategy session with IIPL engineering leadership.
              </p>
            </div>
            <Link to="/book-appointment">
              <Button variant="hero" size="lg" className="group shrink-0 cursor-pointer h-12 px-7 text-sm font-bold shadow-lg shadow-primary/25 rounded-2xl">
                <CalendarDays size={18} />
                Book Appointment
                <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar with Currency & Language Selectors */}
      <div className="border-t border-border py-6 relative bg-background/50 backdrop-blur-md">
        <div className="container-wide flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-muted-foreground">
          <p className="text-center md:text-left">
            © {currentYear} Itoby Infotech Pvt Ltd (IIPL). All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <a href="/sitemap.xml" className="hover:text-primary transition-colors">
              Sitemap
            </a>

            {/* Footer Currency Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsCurrencyOpen(!isCurrencyOpen);
                  setIsLangOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/80 bg-secondary/80 hover:border-primary/60 hover:bg-secondary transition-all text-xs font-bold text-foreground cursor-pointer shadow-sm"
              >
                <Coins size={13} className="text-primary" />
                <span>
                  {activeCurrency.flag} {activeCurrency.code} ({activeCurrency.symbol})
                </span>
                <ChevronDown size={12} className={`transition-transform ${isCurrencyOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {isCurrencyOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bottom-full right-0 mb-2 z-50 w-44 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl p-1.5"
                  >
                    <div className="text-[10px] font-bold text-muted-foreground uppercase px-2.5 py-1">Select Currency</div>
                    <div className="space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
                      {currenciesList.map((cur) => (
                        <button
                          key={cur.code}
                          onClick={() => {
                            setCurrency(cur.code);
                            setIsCurrencyOpen(false);
                            toast.success(`Currency set to ${cur.label}`);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            currency === cur.code
                              ? "bg-primary text-primary-foreground font-bold"
                              : "hover:bg-secondary text-foreground"
                          }`}
                        >
                          <span>
                            {cur.flag} {cur.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Language Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsLangOpen(!isLangOpen);
                  setIsCurrencyOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/80 bg-secondary/80 hover:border-primary/60 hover:bg-secondary transition-all text-xs font-bold text-foreground cursor-pointer shadow-sm"
              >
                <Globe size={13} className="text-primary" />
                <span>
                  {activeLang.flag} {activeLang.name}
                </span>
                <ChevronDown size={12} className={`transition-transform ${isLangOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {isLangOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bottom-full right-0 mb-2 z-50 w-48 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl p-1.5"
                  >
                    <div className="text-[10px] font-bold text-muted-foreground uppercase px-2.5 py-1">Select Language</div>
                    <div className="space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
                      {languagesList.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLangChange(lang.code)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            selectedLang === lang.code
                              ? "bg-primary text-primary-foreground font-bold"
                              : "hover:bg-secondary text-foreground"
                          }`}
                        >
                          <span>
                            {lang.flag} {lang.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
