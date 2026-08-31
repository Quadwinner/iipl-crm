export interface BlogSEOData {
  title: string;
  excerpt: string;
  slug: string;
  category: string;
  author: string;
  image: string;
  created_at: string;
  updated_at?: string;
  content: string;
}

export function generateBlogJsonLd(post: BlogSEOData, siteUrl = "https://www.itobyinfotech.com") {
  const url = `${siteUrl}/blog/${post.slug}`;
  const wordCount = post.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    url,
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Itoby Infotech",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: "https://www.itobyinfotech.com/images/logo.png",
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    wordCount,
    timeRequired: `PT${readTime}M`,
    articleSection: post.category,
  };
}

export function generateBreadcrumbJsonLd(post: BlogSEOData, siteUrl = "https://www.itobyinfotech.com") {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${siteUrl}/blog/${post.slug}` },
    ],
  };
}

export function computeSEOScore(post: BlogSEOData): { score: number; tips: string[] } {
  const tips: string[] = [];
  let score = 0;

  // Title length
  if (post.title.length >= 30 && post.title.length <= 60) score += 15;
  else tips.push("Title should be 30-60 characters");

  // Excerpt / meta desc
  if (post.excerpt.length >= 120 && post.excerpt.length <= 160) score += 15;
  else tips.push("Excerpt should be 120-160 chars for meta description");

  // Image
  if (post.image && post.image.length > 0) score += 10;
  else tips.push("Add a featured image");

  // Content length
  const wordCount = post.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  if (wordCount >= 800) score += 20;
  else if (wordCount >= 400) { score += 10; tips.push("Aim for 800+ words for better SEO"); }
  else tips.push("Content too short — aim for 800+ words");

  // Has headings
  if (/<h[2-3]/i.test(post.content)) score += 10;
  else tips.push("Use H2/H3 headings to structure content");

  // Has internal links
  if (/href=["']\//.test(post.content)) score += 10;
  else tips.push("Add internal links to other pages");

  // Slug quality
  if (post.slug.length <= 60 && !post.slug.includes("_")) score += 10;
  else tips.push("Keep slug short and use hyphens");

  // Category set
  if (post.category && post.category.length > 0) score += 10;
  else tips.push("Set a category");

  return { score: Math.min(100, score), tips };
}
