-- Migration: blog_posts.category
-- The blog index filters by category and the post page pulls related posts from
-- the same category. Additive: existing rows default to an empty string.

alter table public.blog_posts
  add column if not exists category text not null default '';

create index if not exists blog_posts_category_idx
  on public.blog_posts (category, published_at desc);

comment on column public.blog_posts.category is
  'Free-text grouping used by the blog index filter and related-posts lookup.';
