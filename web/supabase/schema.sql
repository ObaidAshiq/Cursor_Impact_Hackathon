-- Run this in Supabase: SQL Editor → New query → paste → Run.
-- Stores Apify news items for the Next.js feed (server reads via service role).

create table if not exists public.news_articles (
  slug text primary key,
  title text not null,
  url text not null unique,
  publisher text,
  published_at timestamptz,
  raw_item jsonb not null,
  ingested_at timestamptz not null default now()
);

create index if not exists news_articles_ingested_at_idx
  on public.news_articles (ingested_at desc);

create table if not exists public.apify_sync_state (
  id smallint primary key default 1,
  constraint apify_sync_state_singleton check (id = 1),
  last_run_at timestamptz
);

insert into public.apify_sync_state (id, last_run_at)
values (1, null)
on conflict (id) do nothing;

create table if not exists public.impact_events (
  slug text primary key,
  event jsonb not null,
  category text not null,
  updated_at timestamptz not null,
  provenance text not null,
  source_hash text not null,
  ingested_at timestamptz not null default now(),
  job_run_id text
);

create index if not exists impact_events_updated_at_idx
  on public.impact_events (updated_at desc);

create index if not exists impact_events_category_idx
  on public.impact_events (category);

create index if not exists impact_events_provenance_idx
  on public.impact_events (provenance);

alter table public.news_articles enable row level security;
alter table public.apify_sync_state enable row level security;
alter table public.impact_events enable row level security;

-- No policies: anon/authenticated clients cannot read/write.
-- Server-side code uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
