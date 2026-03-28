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

alter table public.news_articles enable row level security;
alter table public.apify_sync_state enable row level security;

-- No policies: anon/authenticated clients cannot read/write.
-- Server-side code uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
