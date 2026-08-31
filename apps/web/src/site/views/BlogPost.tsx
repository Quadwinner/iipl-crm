import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import { SiteLayout } from "@/site/layout/site-layout";
import { SEOHead } from "@/site/seo-head";
import { Calendar, Clock, ArrowLeft, User } from "lucide-react";
import { Linkedin, Twitter, Facebook } from "@/site/ui/brand-icons";
import { Button } from "@/site/ui/button";
import { Badge } from "@/site/ui/badge";
import { Card, CardContent } from "@/site/ui/card";
import { supabase } from "@/lib/supabase";
import { generateBlogJsonLd, generateBreadcrumbJsonLd } from "@/site/hooks/useBlogSEO";
import { fallbackBlogs } from "@/site/data/blogsData";

interface BlogPostData {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  author: string;
  author_role: string;
  read_time: string;
  created_at: string;
}

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase().from("blog_posts")
          .select("*")
          .eq("slug", slug || "")
          .eq("is_published", true)
          .maybeSingle();

        if (!error && data) {
          setPost({ ...data, image: data.cover_image_url ?? "" } as unknown as BlogPostData);
          const { data: related } = await supabase().from("blog_posts")
            .select("id, slug, title, excerpt, category, cover_image_url, published_at, created_at, author_name, body")
            .eq("is_published", true)
            .eq("category", data.category)
            .neq("id", data.id)
            .limit(3);

          if (related && related.length > 0) {
            setRelatedPosts(related.map((r) => ({ ...r, image: r.cover_image_url ?? "" })) as unknown as BlogPostData[]);
          } else {
            const localRelated = fallbackBlogs.filter((b) => b.category === data.category && b.slug !== data.slug).slice(0, 3);
            setRelatedPosts(localRelated as BlogPostData[]);
          }
        } else {
          const localPost = fallbackBlogs.find((b) => b.slug === slug);
          if (localPost) {
            setPost(localPost as BlogPostData);
            const localRelated = fallbackBlogs.filter((b) => b.category === localPost.category && b.slug !== localPost.slug).slice(0, 3);
            setRelatedPosts(localRelated as BlogPostData[]);
          } else {
            setPost(null);
          }
        }
      } catch {
        const localPost = fallbackBlogs.find((b) => b.slug === slug);
        if (localPost) {
          setPost(localPost as BlogPostData);
          const localRelated = fallbackBlogs.filter((b) => b.category === localPost.category && b.slug !== localPost.slug).slice(0, 3);
          setRelatedPosts(localRelated as BlogPostData[]);
        } else {
          setPost(null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading article...</p>
        </div>
      </SiteLayout>
    );
  }

  if (!post) {
    return (
      <SiteLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/blog")}>Back to Blog</Button>
          </div>
        </div>
      </SiteLayout>
    );
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const blogJsonLd = post ? generateBlogJsonLd(post) : undefined;
  const breadcrumbJsonLd = post ? generateBreadcrumbJsonLd(post) : undefined;

  return (
    <SiteLayout>
      {post && (
        <>
          <SEOHead
            title={post.title}
            description={post.excerpt}
            path={`/blog/${post.slug}`}
            type="article"
            image={post.image}
            jsonLd={blogJsonLd}
          />
          {breadcrumbJsonLd && (
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
          )}
        </>
      )}
      {/* Hero */}
      <section className="pt-32 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.1),transparent_50%)]" />
        
        <div className="container-wide relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <Link 
              to="/blog"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
            >
              <ArrowLeft size={16} />
              Back to Blog
            </Link>

            <Badge className="mb-4">{post.category}</Badge>
            
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{formatDate(post.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{post.read_time}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Image */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="container-wide mb-12"
      >
        <div className="max-w-4xl mx-auto">
          <div className="aspect-[2/1] rounded-2xl overflow-hidden">
            <img 
              src={post.image} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <section className="pb-20">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-[1fr_280px] gap-8 lg:gap-12">
              {/* Main Content */}
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="prose prose-lg dark:prose-invert max-w-none
                  prose-headings:font-display prose-headings:font-bold
                  prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                  prose-p:text-muted-foreground prose-p:leading-relaxed
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Sidebar */}
              <aside className="space-y-6 order-first lg:order-last">
                {/* Author Card */}
                <Card className="bg-card border-border sticky top-24">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <User className="w-8 h-8 text-primary" />
                      </div>
                      <h4 className="font-display font-bold">{post.author}</h4>
                      <p className="text-sm text-muted-foreground">{post.author_role}</p>
                    </div>

                    <div className="border-t border-border pt-4">
                      <h5 className="font-medium text-sm mb-3">Share this article</h5>
                      <div className="flex justify-center gap-3">
                        <a
                          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Twitter size={18} />
                        </a>
                        <a
                          href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(post.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Linkedin size={18} />
                        </a>
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Facebook size={18} />
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="section-padding bg-secondary/30">
          <div className="container-wide">
            <h2 className="font-display text-2xl font-bold mb-8">Related Articles</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {relatedPosts.map((relPost) => (
                <Link
                  key={relPost.id}
                  to={`/blog/${relPost.slug}`}
                  className="group block rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={relPost.image}
                      alt={relPost.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-6">
                    <Badge className="mb-3">{relPost.category}</Badge>
                    <h3 className="font-display text-lg font-bold group-hover:text-primary transition-colors line-clamp-2">
                      {relPost.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">{formatDate(relPost.created_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  );
};

export default BlogPost;
