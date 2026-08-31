-- Migration: superapp seed
-- Content transcribed from the live site at https://itobyinfotech.com
-- (/services/*, /products, /industries) on 2026-09-01. Idempotent: re-running
-- refreshes copy without duplicating rows.
--
-- portfolio_items, blog_posts and testimonials are intentionally left EMPTY.
-- This is a live company site; client work and reviews are not invented here.

-- ── Site settings ────────────────────────────────────────────────────────────
insert into public.site_settings (
  id, company_name, tagline, intro, email, phone, whatsapp, address,
  business_hours, socials
) values (
  1,
  'Itoby Infotech Pvt Ltd',
  'We Build High-Converting Digital Websites',
  'Itoby Infotech Pvt Ltd (IIPL) is a premier global digital engineering agency and SaaS software lab. We build Next.js applications, mobile apps, custom software, digital marketing, and proprietary IIPL SaaS & AI Voice Platforms for clients across India, USA, Canada, Australia, Dubai (UAE), UK & worldwide.',
  'info@itobyinfotech.com',
  '+91 91427 73500',
  '+919142773500',
  'Sector-4, Noida, UP, India',
  'Mon-Sat, 9AM-6PM IST',
  jsonb_build_object(
    'linkedin', 'https://linkedin.com/company/itobyinfotech',
    'twitter',  'https://twitter.com/itobyinfotech',
    'instagram','https://instagram.com/itobyinfotech',
    'facebook', 'https://facebook.com/itobyinfotech',
    'youtube',  'https://youtube.com/@itobyinfotech'
  )
)
on conflict (id) do update set
  company_name   = excluded.company_name,
  tagline        = excluded.tagline,
  intro          = excluded.intro,
  email          = excluded.email,
  phone          = excluded.phone,
  whatsapp       = excluded.whatsapp,
  address        = excluded.address,
  business_hours = excluded.business_hours,
  socials        = excluded.socials;

-- ── Services (9) ─────────────────────────────────────────────────────────────
insert into public.service_offerings (slug, title, category, summary, icon, highlights, sort_order) values
  ('web-design', 'Web Design & Development', 'Engineering',
   'Premium websites that captivate audiences, drive conversions, and establish your brand as an industry leader.',
   'Globe',
   '["UI/UX Design","Website Development","E-commerce Solutions","Performance Optimization"]'::jsonb, 10),

  ('mobile-app', 'Mobile App Development', 'Engineering',
   'Native and cross-platform mobile applications built for speed, scale, and exceptional user experience.',
   'Smartphone',
   '["Android & iOS Apps","Flutter Development","API Integration","App Maintenance"]'::jsonb, 20),

  ('software-solutions', 'Software Solutions', 'Engineering',
   'Custom software and automation tools designed to streamline operations and boost productivity.',
   'Code2',
   '["CRM/ERP Systems","Admin Panels","Automation Tools","Custom Integrations"]'::jsonb, 30),

  ('saas-development-company', 'SaaS Development', 'Platforms',
   'Itoby Infotech Pvt. Ltd. engineers multi-tenant SaaS platforms, subscription billing engines, self-service portals, and scalable cloud architectures.',
   'Layers',
   '["Multi-Tenant Software Architecture & RLS Isolation","Automated Subscription & Tiered Usage Billing","Self-Service User Workspace & Team Onboarding","API Monetization & Webhook Event Engine"]'::jsonb, 40),

  ('ai-development-company', 'AI Development', 'Artificial Intelligence',
   'Itoby Infotech Pvt. Ltd. delivers custom AI development services, RAG enterprise search engines, LLM fine-tuning, and intelligent automation systems.',
   'BrainCircuit',
   '["Custom LLM Fine-Tuning & Prompt Architecture","Enterprise RAG Vector Search & Document Engines","AI Predictive Analytics & Data Pipeline Automation","Computer Vision, OCR & Document Extraction"]'::jsonb, 50),

  ('ai-agent-development', 'AI Agent Development', 'Artificial Intelligence',
   'Itoby Infotech Pvt. Ltd. builds autonomous AI agents, multi-agent workflow automation systems, tool-calling microservices, and human-in-the-loop enterprise AI assistants.',
   'Bot',
   '["Multi-Agent Workflow Orchestration & Task Planning","Tool & API Function Calling Integration","Human-in-the-Loop Approval & Governance Controls","Retrieval-Augmented Generation (RAG) Document Memory"]'::jsonb, 60),

  ('ai-chatbot-development', 'AI Chatbot Development', 'Artificial Intelligence',
   'Itoby Infotech Pvt. Ltd. builds 24/7 AI chatbots, RAG document knowledge assistants, lead qualification bots, and seamless human support handoff systems.',
   'MessagesSquare',
   '["24/7 automated customer support with sub-second response times","RAG-powered document knowledge retrieval for accurate answers","Seamless human support agent escalation and live chat handoff","Multi-channel embedding across Next.js websites, mobile apps, and WhatsApp"]'::jsonb, 70),

  ('digital-marketing', 'Digital Marketing', 'Growth',
   'Data-driven marketing strategies that bring qualified leads, increase visibility, and maximize ROI.',
   'TrendingUp',
   '["SEO Services","Google Ads","Social Media Marketing","Content Marketing"]'::jsonb, 80),

  ('microsoft-365', 'Microsoft Office 365', 'Workplace',
   'Complete Microsoft 365 setup, migration, and support services to modernize your workplace.',
   'Mail',
   '["M365 Setup","Business Email","SharePoint & Teams","Security Configuration"]'::jsonb, 90)
on conflict (slug) do update set
  title = excluded.title, category = excluded.category, summary = excluded.summary,
  icon = excluded.icon, highlights = excluded.highlights, sort_order = excluded.sort_order;

-- ── Industries (8) ───────────────────────────────────────────────────────────
insert into public.industries (slug, name, summary, icon, sort_order) values
  ('fintech', 'Fintech & Banking',
   'PCI-DSS compliant financial software, digital wallets, payment gateways, micro-lending platforms, and GST invoicing.',
   'Landmark', 10),
  ('retail', 'Retail & E-Commerce',
   'Custom Next.js headless e-commerce storefronts, Shopify Plus integrations, WooCommerce platforms, and multi-vendor marketplaces.',
   'ShoppingCart', 20),
  ('healthcare', 'Healthcare & MedTech',
   'Custom healthcare software, patient portals, medical inventory engines, and automated scheduling.',
   'HeartPulse', 30),
  ('education', 'Education & EdTech',
   'Custom EdTech platforms, virtual classroom portals, interactive learning management systems (LMS), and student analytics.',
   'GraduationCap', 40),
  ('manufacturing', 'Manufacturing & IoT',
   'IoT-enabled manufacturing ERP systems, automated shop floor management, inventory control, and supply chain tracking.',
   'Factory', 50),
  ('insurance', 'Insurance',
   'Secure InsurTech platforms, automated claims processing portals, AI policy recommendation engines, and customer portals.',
   'ShieldCheck', 60),
  ('logistics', 'Logistics & Supply Chain',
   'Real-time fleet tracking portals, dispatch optimization engines, warehouse management software, and supply chain tracking.',
   'Truck', 70),
  ('real-estate', 'Real Estate & PropTech',
   'Custom PropTech solutions, commercial leasing CRMs, MLS listing integrations, and tenant management portals.',
   'Building2', 80)
on conflict (slug) do update set
  name = excluded.name, summary = excluded.summary,
  icon = excluded.icon, sort_order = excluded.sort_order;

-- ── Products / modules (5) ───────────────────────────────────────────────────
insert into public.app_modules (
  key, name, tagline, summary, features, icon, accent, base_path, status,
  allowed_roles, listed_publicly, marketing_slug, sort_order
) values
  ('rental', 'IIPL Renting',
   'Commercial Property Leasing & Tenant Management CRM',
   'Empowers real estate developers, leasing brokers, and property managers to manage unit availability, automate tenant lease renewals, and collect monthly rent.',
   '["Interactive Property Availability & Unit Floorplan Matrix","Digital Tenant Lease Agreement Generator","Automated Rent Collection & PDF Receipt Delivery"]'::jsonb,
   'Building2', '#2563eb', '/app/rental', 'ACTIVE',
   '{ADMINISTRATOR,MAINTENANCE_STAFF,OFFICE_OWNER}'::public.role[], true, 'renting', 10),

  ('lead', 'IIPL Lead',
   'AI Cold Email & B2B Lead Generation CRM',
   'Enterprise platform for B2B lead discovery and sales outreach. Scrapes decision-maker contacts from Google Maps and LinkedIn, runs automated AI site audits, and triggers personalized email campaigns.',
   '["Real-time Google Maps & Local Business Scraper","15-Second Instant AI Website Performance Auditor","Automated Cold Email Sequence & Dunning Engine"]'::jsonb,
   'Target', '#7c3aed', '/app/lead', 'COMING_SOON',
   '{ADMINISTRATOR,MAINTENANCE_STAFF,OFFICE_OWNER}'::public.role[], true, 'leadflow', 20),

  ('billing', 'IIPL Billing',
   'Enterprise Cloud GST Invoicing & Accounting Software',
   'Simplifies GST tax compliance, automated PDF invoice creation, recurring retainer billing, and client payment links for SMBs, freelancers, and enterprises.',
   '["Automated HSN/SAC Tax Code Indexing & GST Calculation","One-Click PDF Tax Invoice & Credit Note Builder","Instant WhatsApp & Email Invoice Delivery"]'::jsonb,
   'ReceiptIndianRupee', '#059669', '/app/billing', 'COMING_SOON',
   '{ADMINISTRATOR,MAINTENANCE_STAFF,OFFICE_OWNER}'::public.role[], true, 'billing', 30),

  ('cashmemo', 'IIPL Cashmemo',
   'Instant Retail Digital Cash Memo Builder via WhatsApp',
   'Eliminates paper thermal receipts. Retail cashiers enter items on a lightweight dashboard, generating digital PDF receipts delivered to customer WhatsApp numbers.',
   '["5-Second Digital Cash Memo Generation","Direct WhatsApp Cloud API Delivery","Bar-code Scanner Web App Support"]'::jsonb,
   'ScrollText', '#ea580c', '/app/cashmemo', 'COMING_SOON',
   '{ADMINISTRATOR,MAINTENANCE_STAFF,OFFICE_OWNER}'::public.role[], true, 'cashmemo', 40),

  ('calling', 'IIPL Calling',
   'Conversational AI Voice Calling Agents',
   'Deploys conversational AI voice agents capable of conducting natural phone calls, qualifying sales leads, booking calendar appointments, and answering customer support inquiries 24/7.',
   '["Sub-800ms Human-Like Conversation Latency","Outbound Automated Cold Calling & Lead Triage","Inbound 24/7 Customer Service Answering Bot"]'::jsonb,
   'PhoneCall', '#db2777', '/app/calling', 'COMING_SOON',
   '{ADMINISTRATOR,MAINTENANCE_STAFF,OFFICE_OWNER}'::public.role[], true, 'calling', 50)
on conflict (key) do update set
  name = excluded.name, tagline = excluded.tagline, summary = excluded.summary,
  features = excluded.features, icon = excluded.icon, accent = excluded.accent,
  base_path = excluded.base_path, status = excluded.status,
  allowed_roles = excluded.allowed_roles, listed_publicly = excluded.listed_publicly,
  marketing_slug = excluded.marketing_slug, sort_order = excluded.sort_order;
