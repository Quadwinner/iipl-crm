-- Migration: public site content
-- Every table here follows the same shape: anon may read published rows, only an
-- ADMINISTRATOR may write. Copy lives in these rows, never in components, so the
-- site can be edited from the CMS without a redeploy.

-- ── Singleton settings row ───────────────────────────────────────────────────
create table public.site_settings (
  id integer primary key default 1,
  company_name text not null default '',
  tagline text not null default '',
  intro text not null default '',
  email text not null default '',
  phone text not null default '',
  whatsapp text not null default '',
  address text not null default '',
  business_hours text not null default '',
  socials jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id = 1)
);

create trigger site_settings_touch_updated_at
  before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ── Services ─────────────────────────────────────────────────────────────────
create table public.service_offerings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null default '',
  summary text not null default '',
  body text not null default '',
  icon text not null default 'Sparkles',
  highlights jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger service_offerings_touch_updated_at
  before update on public.service_offerings
  for each row execute function public.touch_updated_at();

-- ── Industries ───────────────────────────────────────────────────────────────
create table public.industries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  summary text not null default '',
  icon text not null default 'Building2',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger industries_touch_updated_at
  before update on public.industries
  for each row execute function public.touch_updated_at();

-- ── Portfolio ────────────────────────────────────────────────────────────────
create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  client_name text not null default '',
  category text not null default '',
  summary text not null default '',
  body text not null default '',
  image_url text,
  tags jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger portfolio_items_touch_updated_at
  before update on public.portfolio_items
  for each row execute function public.touch_updated_at();

-- ── Blog ─────────────────────────────────────────────────────────────────────
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  author_name text not null default '',
  cover_image_url text,
  tags jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger blog_posts_touch_updated_at
  before update on public.blog_posts
  for each row execute function public.touch_updated_at();

-- ── Testimonials ─────────────────────────────────────────────────────────────
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_title text not null default '',
  company text not null default '',
  quote text not null,
  rating integer check (rating between 1 and 5),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger testimonials_touch_updated_at
  before update on public.testimonials
  for each row execute function public.touch_updated_at();

-- ── RLS: anon reads published, ADMINISTRATOR writes ──────────────────────────
alter table public.site_settings enable row level security;
alter table public.service_offerings enable row level security;
alter table public.industries enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.blog_posts enable row level security;
alter table public.testimonials enable row level security;

create policy site_settings_select_all on public.site_settings
  for select to anon, authenticated using (true);
create policy site_settings_write_admin on public.site_settings
  for all to authenticated
  using (public.is_administrator()) with check (public.is_administrator());

create policy service_offerings_select_published on public.service_offerings
  for select to anon, authenticated using (is_published or public.is_administrator());
create policy service_offerings_write_admin on public.service_offerings
  for all to authenticated
  using (public.is_administrator()) with check (public.is_administrator());

create policy industries_select_published on public.industries
  for select to anon, authenticated using (is_published or public.is_administrator());
create policy industries_write_admin on public.industries
  for all to authenticated
  using (public.is_administrator()) with check (public.is_administrator());

create policy portfolio_items_select_published on public.portfolio_items
  for select to anon, authenticated using (is_published or public.is_administrator());
create policy portfolio_items_write_admin on public.portfolio_items
  for all to authenticated
  using (public.is_administrator()) with check (public.is_administrator());

create policy blog_posts_select_published on public.blog_posts
  for select to anon, authenticated using (is_published or public.is_administrator());
create policy blog_posts_write_admin on public.blog_posts
  for all to authenticated
  using (public.is_administrator()) with check (public.is_administrator());

create policy testimonials_select_published on public.testimonials
  for select to anon, authenticated using (is_published or public.is_administrator());
create policy testimonials_write_admin on public.testimonials
  for all to authenticated
  using (public.is_administrator()) with check (public.is_administrator());

grant select on public.site_settings, public.service_offerings, public.industries,
  public.portfolio_items, public.blog_posts, public.testimonials to anon, authenticated;
grant insert, update, delete on public.site_settings, public.service_offerings,
  public.industries, public.portfolio_items, public.blog_posts, public.testimonials
  to authenticated;
grant all on public.site_settings, public.service_offerings, public.industries,
  public.portfolio_items, public.blog_posts, public.testimonials to service_role;
