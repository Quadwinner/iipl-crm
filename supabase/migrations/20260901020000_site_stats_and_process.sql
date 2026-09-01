-- Migration: site_settings.stats and .process
-- The company home page shows a figures strip and a "how we work" sequence.
-- Both belong to the content layer, not the component, so they stay editable
-- from the CMS like every other piece of site copy.

alter table public.site_settings
  add column if not exists stats jsonb not null default '[]'::jsonb,
  add column if not exists process jsonb not null default '[]'::jsonb;

comment on column public.site_settings.stats is
  'Figures strip on the home page: [{value, suffix, label}]. Company-authored claims.';
comment on column public.site_settings.process is
  'How-we-work sequence on the home page: [{step, title, body}].';

update public.site_settings set
  stats = '[
    {"value": "1,200", "suffix": "+", "label": "Projects delivered"},
    {"value": "50",    "suffix": "+", "label": "Happy clients"},
    {"value": "11",    "suffix": "+", "label": "Years experience"},
    {"value": "15",    "suffix": "+", "label": "Countries served"}
  ]'::jsonb,
  process = '[
    {"step": "01", "title": "Discover",  "body": "We start with your goals, your customers and the constraints you actually have — not a template."},
    {"step": "02", "title": "Design",    "body": "Interfaces and flows designed against real content, reviewed with you before a line of production code."},
    {"step": "03", "title": "Engineer",  "body": "Next.js, React Native and Postgres, built to be handed over: typed, tested and documented."},
    {"step": "04", "title": "Ship & run","body": "Deployed on infrastructure you own, monitored, and supported after launch."}
  ]'::jsonb
where id = 1;
