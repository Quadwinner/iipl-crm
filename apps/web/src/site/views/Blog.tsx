import { useState, useEffect, useMemo } from "react";
import { BlogGridSkeleton } from "@/site/ui/skeleton-cards";
import { SEOHead } from "@/site/seo-head";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { SiteLayout } from "@/site/layout/site-layout";
import { Calendar, ArrowRight, Search, Clock, TrendingUp, Sparkles, Rss, Tag, X } from "lucide-react";
import { Input } from "@/site/ui/input";
import { Badge } from "@/site/ui/badge";
import { Button } from "@/site/ui/button";
import { supabase } from "@/lib/supabase";
import { PageHeroBanner } from "@/site/ui/page-hero-banner";
import { fallbackBlogs } from "@/site/data/blogsData";

// Categories are now dynamically extracted from posts

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  read_time: string;
  featured: boolean;
  created_at: string;
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data: rows, error } = await supabase().from("blog_posts")
          .select("id, slug, title, excerpt, category, cover_image_url, published_at, created_at")
          .eq("is_published", true)
          .order("published_at", { ascending: false, nullsFirst: false });

        // The CMS stores cover_image_url and has no read_time/featured flags;
        // adapt to the shape this view was written against.
        const data = rows?.map((r) => ({
          ...r,
          image: r.cover_image_url ?? "",
          read_time: "",
          featured: false,
          created_at: r.published_at ?? r.created_at,
        }));

        if (!error && data && data.length > 0) {
          setPosts(data as unknown as BlogPost[]);
        } else {
          setPosts(fallbackBlogs as BlogPost[]);
        }
      } catch {
        setPosts(fallbackBlogs as BlogPost[]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // Extract unique categories from actual posts
  const dynamicCategories = useMemo(() => {
    const cats = [...new Set(posts.map(p => p.category))];
    return ["All", ...cats.sort()];
  }, [posts]);

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPosts = posts.filter(post => post.featured);

  // The source repo pointed this at an `rss-feed` Edge Function on a different
  // Supabase project. This one has no such function, so the RSS link is hidden
  // rather than left pointing at a 404.
  const rssUrl: string | null = null;

  const hasActiveFilters = selectedCategory !== "All" || searchQuery.length > 0;
  const clearFilters = () => { setSelectedCategory("All"); setSearchQuery(""); };

  return (
    <SiteLayout>
      <SEOHead
        title="Tech Insights & AI Trends | Itoby Infotech Pvt Ltd (IIPL) - Engineering Blog"
        description="Read authoritative articles on Next.js 15, AI Voice Agents, B2B Lead Automation, PropTech, FinTech & Core Web Vitals from Itoby Infotech Pvt Ltd (IIPL)."
        path="/blog"
        type="website"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Itoby Infotech Pvt Ltd (IIPL) Tech Blog",
          description: "Authoritative software engineering, AI, and digital growth insights.",
        }}
      />

      {/* 3D Animated Hero & Breadcrumbs */}
      <PageHeroBanner
        title="Insights, Articles & Tech Trends"
        description="Stay updated with the latest trends, guides, and insights in web engineering, app development, digital marketing, and software design."
        badge="Knowledge & News"
        breadcrumbs={[{ label: "Blog" }]}
      />

            {/* Search + RSS */}
            <div className="section-padding pt-6 pb-10">
              <div className="container-wide">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex gap-3 items-center max-w-lg mx-auto"
                >
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input
                      type="text"
                      placeholder="Search articles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 bg-card/50 backdrop-blur-xl border-border/50 rounded-xl"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {rssUrl ? (
                  <motion.a
                    href={rssUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="shrink-0 w-12 h-12 rounded-xl bg-card/50 backdrop-blur-xl border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
                    title="RSS Feed"
                  >
                    <Rss size={20} />
                  </motion.a>
                  ) : null}
                </motion.div>
              </div>
            </div>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && selectedCategory === "All" && !searchQuery && (
        <section className="pb-16">
          <div className="container-wide">
            <div className="flex items-center gap-2 mb-8">
              <TrendingUp className="text-primary" size={20} />
              <h2 className="font-display text-xl font-bold">Featured Articles</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={`/blog/${post.slug}`}
                    className="group block rounded-3xl overflow-hidden bg-card/50 backdrop-blur-xl border border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.15)]"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                      <div className="absolute bottom-6 left-6 right-6">
                        <Badge className="mb-3 bg-primary/90 backdrop-blur-sm">{post.category}</Badge>
                        <h3 className="font-display text-xl lg:text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} className="text-primary" />
                          {formatDate(post.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} className="text-primary" />
                          {post.read_time}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog Grid */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute top-1/4 left-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
        <div className="container-wide relative z-10">
          {/* Categories with active filter chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-4">
              <Tag className="text-primary" size={16} />
              <span className="text-sm font-medium text-muted-foreground">Filter by category</span>
            </div>
            <div className="flex flex-wrap gap-3 p-4 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/30">
              {dynamicCategories.map((category) => {
                const count = category === "All" ? posts.length : posts.filter(p => p.category === category).length;
                return (
                  <motion.button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      selectedCategory === category
                        ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                        : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    {category}
                    {count > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        selectedCategory === category
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted-foreground/20 text-muted-foreground"
                      }`}>
                        {count}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Active filters summary */}
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-center gap-3 mt-4 flex-wrap"
              >
                <span className="text-sm text-muted-foreground">
                  {filteredPosts.length} {filteredPosts.length === 1 ? "result" : "results"}
                </span>
                {selectedCategory !== "All" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                    {selectedCategory}
                    <button onClick={() => setSelectedCategory("All")} className="hover:text-primary-foreground">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                    "{searchQuery}"
                    <button onClick={() => setSearchQuery("")} className="hover:text-primary-foreground">
                      <X size={12} />
                    </button>
                  </span>
                )}
                <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-primary underline">
                  Clear all
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* Posts */}
          {isLoading ? (
            <BlogGridSkeleton count={6} />
          ) : filteredPosts.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCategory}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filteredPosts.map((post) => (
                  <motion.article key={post.id} variants={fadeUp}>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="group block rounded-3xl overflow-hidden bg-card/50 backdrop-blur-xl border border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.15)] h-full"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden">
                          <img
                            src={post.image}
                            alt={post.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-primary/90 backdrop-blur-sm border-none">{post.category}</Badge>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-4 text-muted-foreground text-sm mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} className="text-primary" />
                            {formatDate(post.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} className="text-primary" />
                            {post.read_time}
                          </span>
                        </div>
                        <h3 className="font-display text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                          {post.excerpt}
                        </p>
                        <span className="inline-flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                          Read More
                          <ArrowRight size={16} />
                        </span>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="inline-block p-8 rounded-3xl bg-card/50 backdrop-blur-xl border border-border/50">
                <p className="text-muted-foreground text-lg mb-4">No articles found matching your criteria.</p>
                <Button
                  variant="outline"
                  onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
                  className="rounded-full"
                >
                  Clear Filters
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Newsletter - Glassmorphism */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.05),transparent_70%)]" />
        <div className="container-wide relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative max-w-2xl mx-auto text-center p-10 rounded-3xl bg-card/50 backdrop-blur-xl border border-border/50 shadow-xl overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <Sparkles className="text-primary mx-auto mb-4" size={28} />
              <h2 className="font-display text-3xl font-bold mb-4">
                Subscribe to Our Newsletter
              </h2>
              <p className="text-muted-foreground mb-8">
                Get the latest articles, tips, and insights delivered straight to your inbox.
                Join 5,000+ developers and designers who stay ahead of the curve.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="h-12 bg-card/50 backdrop-blur-sm border-border/50 rounded-xl"
                />
                <Button size="lg" className="shrink-0 rounded-xl">Subscribe</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                No spam, unsubscribe at any time.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default Blog;
