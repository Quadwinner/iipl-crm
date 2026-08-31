import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/site/ui/button";
import { GlobalOfficeMapModal } from "@/site/ui/global-office-map-modal";

const offices = [
  {
    city: "Noida",
    country: "India (HQ)",
    address: "Sector-4, Noida, Uttar Pradesh 201301",
    phone: "+91 91427 73500",
    email: "info@itobyinfotech.com",
    hours: "Mon - Sat: 9:00 AM - 6:00 PM IST",
  },
  {
    city: "Delhi",
    country: "India",
    address: "L100, Laxmi Nagar, Delhi 110092",
    phone: "+91 91427 73500",
    email: "info@itobyinfotech.com",
    hours: "Mon - Sat: 9:00 AM - 6:00 PM IST",
  },
  {
    city: "California",
    country: "United States",
    address: "513 W Bonaventure Ave, Tracy, CA 95391, USA",
    phone: "+1 (888) 581-3028",
    email: "usa@itobyinfotech.com",
    hours: "Mon - Fri: 9:00 AM - 5:00 PM PST",
  },
];

export const OfficeLocations = () => {
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <section className="section-padding bg-card/30">
      <GlobalOfficeMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
      />
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="text-primary font-semibold uppercase tracking-wider text-sm">
            Our Offices
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-4 mb-4">
            Visit Us <span className="gradient-text">Globally</span>
          </h2>
          <p className="text-muted-foreground">
            We have offices across multiple locations to serve you better.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {offices.map((office, index) => (
            <motion.div
              key={office.city}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                    <MapPin className="text-primary group-hover:text-primary-foreground" size={24} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold">{office.city}</h3>
                    <p className="text-primary text-sm">{office.country}</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <p className="text-muted-foreground flex items-start gap-3">
                    <MapPin size={18} className="shrink-0 mt-0.5 text-primary" />
                    {office.address}
                  </p>
                  <p className="text-muted-foreground flex items-center gap-3">
                    <Phone size={18} className="shrink-0 text-primary" />
                    <a href={`tel:${office.phone}`} className="hover:text-primary transition-colors">
                      {office.phone}
                    </a>
                  </p>
                  <p className="text-muted-foreground flex items-center gap-3">
                    <Mail size={18} className="shrink-0 text-primary" />
                    <a href={`mailto:${office.email}`} className="hover:text-primary transition-colors">
                      {office.email}
                    </a>
                  </p>
                  <p className="text-muted-foreground flex items-center gap-3">
                    <Clock size={18} className="shrink-0 text-primary" />
                    {office.hours}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Global Map & Live Clocks Button */}
        <div className="text-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsMapOpen(true)}
            className="rounded-2xl gap-2 border-primary/40 text-primary hover:bg-primary/10 shadow-lg shadow-primary/10"
          >
            <Globe className="w-4 h-4" /> Open Interactive Global Map & Live Timezones <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
