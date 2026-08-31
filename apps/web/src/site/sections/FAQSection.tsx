import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/site/ui/accordion";

const faqs = [
  {
    question: "What does Itoby Infotech Pvt. Ltd. do?",
    answer: "Itoby Infotech Pvt. Ltd. (IIPL) is a premier global software engineering company & SaaS lab. We build custom software solutions, AI voice calling agents, multi-tenant SaaS platforms, mobile applications, and high-converting Next.js web applications for growing businesses and enterprise clients."
  },
  {
    question: "Does Itoby Infotech build custom software and SaaS products?",
    answer: "Yes. We engineer bespoke custom software and multi-tenant SaaS applications from scratch using Next.js 15, TypeScript, Node.js, and Supabase PostgreSQL with Row Level Security (RLS)."
  },
  {
    question: "Does Itoby Infotech develop AI agents and chatbots?",
    answer: "Yes. We build autonomous AI agents and 24/7 conversational chatbots powered by OpenAI models, Pgvector RAG retrieval, and real-time telephony WebSockets for automated lead intake and customer service."
  },
  {
    question: "What technologies does Itoby Infotech use?",
    answer: "Our core engineering stack includes Next.js 15 App Router, React 19, TypeScript, Node.js, Python, Supabase PostgreSQL, Docker, AWS, and Vercel Edge infrastructure."
  },
  {
    question: "How long does custom software development take?",
    answer: "A Minimum Viable Product (MVP) custom software build takes 8 to 12 weeks. Enterprise ERP systems and complex multi-tenant SaaS portals take 14 to 24 weeks depending on scope."
  },
  {
    question: "Do you provide ongoing post-launch maintenance and SLA support?",
    answer: "Yes. All projects include 12 months of premium technical support, security patch management, database backups, and 24/7 SLA infrastructure monitoring."
  },
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export const FAQSection = () => {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const leftInView = useInView(leftRef, { once: true, amount: 0.3 });
  const rightInView = useInView(rightRef, { once: true, amount: 0.2 });

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  return (
    <section className="section-padding bg-card/30 relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="absolute top-1/3 left-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
      <div className="container-wide relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Column */}
          <motion.div
            ref={leftRef}
            initial={{ opacity: 0, x: -60 }}
            animate={leftInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -60 }}
            transition={{ duration: 0.7 }}
            className="lg:sticky lg:top-32"
          >
            <span className="text-primary font-semibold uppercase tracking-wider text-sm inline-block">FAQs</span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Got questions? We've got answers. If you don't find what you're
              looking for, feel free to reach out to our team.
            </p>

            <motion.div
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={leftInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {[
                { val: "1200+", label: "Projects Delivered" },
                { val: "99%", label: "Client Satisfaction" },
              ].map((s) => (
                <motion.div
                  key={s.label}
                  className="p-4 rounded-3xl bg-card/50 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all"
                  whileHover={{ scale: 1.03, y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-2xl font-display font-bold text-primary">{s.val}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column - Accordion */}
          <motion.div
            ref={rightRef}
            variants={staggerContainer}
            initial="hidden"
            animate={rightInView ? "visible" : "hidden"}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div key={index} variants={fadeUp} whileHover={{ scale: 1.01 }}>
                  <AccordionItem
                    value={`item-${index}`}
                    className="border border-border/50 rounded-2xl px-6 data-[state=open]:border-primary/50 transition-colors bg-card/50 backdrop-blur-xl overflow-hidden"
                  >
                    <AccordionTrigger className="text-left font-medium hover:text-primary transition-colors py-5">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
