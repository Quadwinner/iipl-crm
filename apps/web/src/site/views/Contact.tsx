import { useState } from "react";
import { SEOHead } from "@/site/seo-head";
import { motion } from "framer-motion";
import { SiteLayout } from "@/site/layout/site-layout";
import { Button } from "@/site/ui/button";
import { Input } from "@/site/ui/input";
import { Textarea } from "@/site/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/site/ui/select";
import { Label } from "@/site/ui/label";
import {
  Mail, Phone, MapPin, MessageCircle, Send, CheckCircle,
  User, Building2, FileText, Sparkles, ArrowRight, Clock,
  Globe, Headphones,
} from "lucide-react";
import { useToast } from "@/site/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { ContactInfoCards } from "@/site/sections/ContactInfoCards";
import { OfficeLocations } from "@/site/sections/OfficeLocations";
import { FAQSection } from "@/site/sections/FAQSection";
import { PageHeroBanner } from "@/site/ui/page-hero-banner";

const contactInfo = [
  { icon: Mail, title: "Email Us", value: "info@itobyinfotech.com", href: "mailto:info@itobyinfotech.com", color: "text-blue-500", bg: "bg-blue-500/10", hoverBg: "group-hover:bg-blue-500" },
  { icon: Phone, title: "Call Us", value: "+91 9142773500", href: "tel:+919142773500", color: "text-emerald-500", bg: "bg-emerald-500/10", hoverBg: "group-hover:bg-emerald-500" },
  { icon: MapPin, title: "Visit Us", value: "Sector-4, Noida, UP", href: "#", color: "text-violet-500", bg: "bg-violet-500/10", hoverBg: "group-hover:bg-violet-500" },
  { icon: MessageCircle, title: "WhatsApp", value: "Chat with us", href: "https://wa.me/919142773500", color: "text-primary", bg: "bg-primary/10", hoverBg: "group-hover:bg-primary" },
];

const services = [
  "Web Design & Development", "Mobile App Development", "Digital Marketing",
  "Software Solutions", "Microsoft Office 365", "UI/UX Design",
  "E-commerce Development", "API Development", "Cloud Solutions", "Other",
];

const budgetRanges = [
  "Under ₹50,000", "₹50,000 - ₹1,00,000", "₹1,00,000 - ₹3,00,000",
  "₹3,00,000 - ₹5,00,000", "₹5,00,000+", "Not sure yet",
];

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional().or(z.literal("")),
  service: z.string().min(1, "Please select a service"),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
});

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", service: "", company: "", budget: "", message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setIsSubmitting(true);
    try {
      // Single public write path: submit_lead() is security definer and rate
      // limited to 5 per email per hour. The leads table has no INSERT policy,
      // so this is the only way a visitor's enquiry can reach the database.
      const { error: dbError } = await supabase().rpc("submit_lead", {
        p_full_name: formData.name.trim(),
        p_email: formData.email.trim(),
        p_phone: formData.phone.trim(),
        p_company: formData.company.trim(),
        p_service_interest: formData.service,
        p_budget_range: formData.budget,
        p_message: formData.message.trim(),
        p_source: "CONTACT_FORM",
        p_page_path: window.location.pathname,
      });
      // 53400 is the rate limit; its message is written for the visitor.
      if (dbError) throw new Error(dbError.message);
      setIsSuccess(true);
      toast({ title: "Message Sent Successfully! ✨", description: "We'll get back to you within 24 hours." });
      setFormData({ name: "", email: "", phone: "", service: "", company: "", budget: "", message: "" });
    } catch (error: unknown) {
      console.error("Form submission error:", error);
      const errorMessage = error instanceof Error ? error.message : "Please try again later.";
      toast({ title: "Something went wrong", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <SiteLayout>
        <SEOHead title="Contact Our Digital Agency & Developers" description="Get in touch with Itoby Infotech for web design, app development, and digital marketing." path="/contact" />
        <section className="min-h-[70vh] flex items-center justify-center pt-20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-glow-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-lg mx-auto p-8 relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-glow-secondary flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30"
            >
              <CheckCircle className="text-primary-foreground" size={48} />
            </motion.div>
            <h1 className="font-display text-4xl font-bold mb-4">Thank You! 🎉</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Your message has been sent successfully. Our team will review your inquiry and get back to you within 24 hours.
            </p>
            <Button variant="hero" size="xl" onClick={() => setIsSuccess(false)}>Send Another Message</Button>
          </motion.div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <SEOHead
        title="Contact Us | Itoby Infotech Pvt Ltd (IIPL) - Global Digital Agency & Developers"
        description="Get in touch with Itoby Infotech Pvt Ltd (IIPL) for web design, app development, custom software, digital marketing & IIPL SaaS inquiries across India, USA, Canada, Australia, Dubai (UAE) & UK."
        path="/contact"
      />

      {/* 3D Animated Hero & Breadcrumbs */}
      <PageHeroBanner
        title="Let's Build Something Extraordinary Together"
        description="Have a project in mind? Share your ideas with us and let's create exceptional digital experiences together."
        badge="Get in Touch"
        breadcrumbs={[{ label: "Contact Us" }]}
      />

      {/* Quick Info Cards */}
      <ContactInfoCards />

      {/* Contact Section */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Contact Info Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 space-y-6"
            >
              <div>
                <h2 className="font-display text-2xl font-bold mb-3">Get in Touch</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Ready to start your project? Reach out through any channel or fill out the form.
                </p>
              </div>

              <div className="space-y-3">
                {contactInfo.map((item, index) => (
                  <motion.a
                    key={item.title}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 5, scale: 1.02 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/5"
                  >
                    <div className={`w-12 h-12 rounded-xl ${item.bg} ${item.hoverBg} flex items-center justify-center shrink-0 transition-all duration-300`}>
                      <item.icon className={`${item.color} group-hover:text-primary-foreground transition-colors`} size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-muted-foreground text-xs truncate">{item.value}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </motion.a>
                ))}
              </div>

              {/* Map */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl overflow-hidden border border-border/50 h-56 shadow-lg"
              >
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7007.085787731622!2d77.31791908933936!3d28.58348592401647!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce457175bd67f%3A0xe15e16d1018e02ac!2sSector%204%2C%20Noida%2C%20Uttar%20Pradesh%20201301!5e0!3m2!1sen!2sin!4v1775572636629!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Itoby Infotech Location"
                />
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="grid grid-cols-3 gap-3"
              >
                {[
                  { value: "24h", label: "Response Time", icon: Clock },
                  { value: "15+", label: "Countries", icon: Globe },
                  { value: "100%", label: "Satisfaction", icon: Headphones },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 text-center">
                    <stat.icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
                    <p className="text-lg font-display font-bold">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-3"
            >
              <div className="relative p-6 sm:p-8 md:p-10 rounded-3xl bg-card/50 backdrop-blur-xl border border-border/50 shadow-2xl shadow-primary/5 overflow-hidden">
                {/* Glassmorphism glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-glow-secondary/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Send className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-bold">Tell Us About Your Project</h2>
                      <p className="text-xs text-muted-foreground">We'll get back to you within 24 hours</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="space-y-1.5">
                        <Label htmlFor="name" className="flex items-center gap-1.5 text-xs font-medium">
                          <User className="w-3 h-3 text-muted-foreground" /> Full Name *
                        </Label>
                        <Input
                          id="name" placeholder="John Doe" value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className={`h-11 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 ${errors.name ? 'border-destructive' : ''}`}
                        />
                        {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }} className="space-y-1.5">
                        <Label htmlFor="email" className="flex items-center gap-1.5 text-xs font-medium">
                          <Mail className="w-3 h-3 text-muted-foreground" /> Email Address *
                        </Label>
                        <Input
                          id="email" type="email" placeholder="info@itobyinfotech.com" value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={`h-11 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 ${errors.email ? 'border-destructive' : ''}`}
                        />
                        {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
                      </motion.div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="space-y-1.5">
                        <Label htmlFor="phone" className="flex items-center gap-1.5 text-xs font-medium">
                          <Phone className="w-3 h-3 text-muted-foreground" /> Phone Number
                        </Label>
                        <Input
                          id="phone" type="tel" placeholder="+91 91427 73500" value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="h-11 rounded-xl bg-background/50 border-border/50 focus:border-primary/50"
                        />
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.25 }} className="space-y-1.5">
                        <Label htmlFor="company" className="flex items-center gap-1.5 text-xs font-medium">
                          <Building2 className="w-3 h-3 text-muted-foreground" /> Company Name
                        </Label>
                        <Input
                          id="company" placeholder="Your Company" value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="h-11 rounded-xl bg-background/50 border-border/50 focus:border-primary/50"
                        />
                      </motion.div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-xs font-medium">
                          <Sparkles className="w-3 h-3 text-muted-foreground" /> Service Interested In *
                        </Label>
                        <Select value={formData.service} onValueChange={(value) => setFormData({ ...formData, service: value })}>
                          <SelectTrigger className={`h-11 rounded-xl bg-background/50 border-border/50 ${errors.service ? 'border-destructive' : ''}`}>
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border/50 rounded-xl">
                            {services.map((service) => (
                              <SelectItem key={service} value={service}>{service}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.service && <p className="text-destructive text-xs">{errors.service}</p>}
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.35 }} className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-xs font-medium">
                          <FileText className="w-3 h-3 text-muted-foreground" /> Estimated Budget
                        </Label>
                        <Select value={formData.budget} onValueChange={(value) => setFormData({ ...formData, budget: value })}>
                          <SelectTrigger className="h-11 rounded-xl bg-background/50 border-border/50">
                            <SelectValue placeholder="Select budget range" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border/50 rounded-xl">
                            {budgetRanges.map((range) => (
                              <SelectItem key={range} value={range}>{range}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="space-y-1.5">
                      <Label htmlFor="message" className="flex items-center gap-1.5 text-xs font-medium">
                        <MessageCircle className="w-3 h-3 text-muted-foreground" /> Project Details *
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us about your project, goals, and timeline..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className={`min-h-[130px] rounded-xl bg-background/50 border-border/50 focus:border-primary/50 resize-none ${errors.message ? 'border-destructive' : ''}`}
                      />
                      {errors.message && <p className="text-destructive text-xs">{errors.message}</p>}
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.45 }}>
                      <Button type="submit" variant="hero" size="xl" className="w-full rounded-xl" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
                        ) : (
                          <>Send Message <Send size={18} /></>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <OfficeLocations />
      <FAQSection />

      {/* Schedule Meeting CTA */}
      <section className="section-padding">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative text-center max-w-2xl mx-auto p-10 rounded-3xl bg-card/50 backdrop-blur-xl border border-border/50 overflow-hidden shadow-2xl shadow-primary/5"
          >
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-glow-secondary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl font-bold mb-4">
                Prefer a <span className="gradient-text">Direct Call?</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                Schedule a free 30-minute consultation. We'll discuss your requirements and provide expert recommendations.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button variant="hero" size="xl"><a href="book-appointment">Schedule a Meeting</a></Button>
                <Button variant="hero-outline" size="xl" asChild>
                  <a href="tel:+919142773500"><Phone size={20} /> Call Now</a>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default Contact;
