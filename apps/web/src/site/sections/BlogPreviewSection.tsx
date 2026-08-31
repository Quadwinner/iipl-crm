
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar } from "lucide-react";

const posts = [
  { id: 1, slug: "web-design-trends-2026", title: "Top Web Design Trends to Watch in 2026", excerpt: "Discover the latest design patterns and visual trends shaping the future of web experiences.", category: "Design", date: "Jan 8, 2026", image: "https://images.unsplash.com/photo-1559028012-481c04fa702d?w=600&h=400&fit=crop" },
  { id: 2, slug: "seo-checklist-2026", title: "The Ultimate SEO Checklist for 2026", excerpt: "A comprehensive guide to optimizing your website for search engines in the AI era.", category: "SEO", date: "Jan 5, 2026", image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=600&h=400&fit=crop" },
  { id: 3, slug: "saas-case-study-techflow", title: "Case Study: How We Built TechFlow's SaaS Platform", excerpt: "A deep dive into building a project management platform that serves 10,000+ teams.", category: "Case Study", date: "Dec 15, 2025", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop" },
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const BlogPreviewSection = () => {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
      <div className="container-wide relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <span className="text-primary font-semibold uppercase tracking-wider text-sm">Our Blog</span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-4">
              Latest <span className="gradient-text">Insights</span>
            </h2>
          </div>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-primary font-medium hover:gap-4 transition-all"
          >
            View All Articles
            <ArrowRight size={18} />
          </Link>
        </motion.div>

        {/* Posts Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {posts.map((post) => (
            <motion.article key={post.id} variants={fadeUp}>
              <Link
                to={`/blog/${post.slug}`}
                className="group block rounded-3xl overflow-hidden bg-card/50 backdrop-blur-xl border border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.15)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-medium">
                      {post.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                    <Calendar size={14} className="text-primary" />
                    <span>{post.date}</span>
                  </div>
                  <h3 className="font-display text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
