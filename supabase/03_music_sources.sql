create table if not exists public.music_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'YouTube của chúng ta',
  subtitle text not null default '',
  youtube_url text not null,
  source_kind text not null check (source_kind in ('video', 'playlist')),
  youtube_video_id text,
  youtube_playlist_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists music_sources_updated_at_idx
  on public.music_sources (updated_at desc);

alter table public.music_sources enable row level security;

drop policy if exists "public can read music sources" on public.music_sources;
create policy "public can read music sources"
  on public.music_sources
  for select
  to anon, authenticated
  using (true);

drop policy if exists "authenticated can insert music sources" on public.music_sources;
create policy "authenticated can insert music sources"
  on public.music_sources
  for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated can update music sources" on public.music_sources;
create policy "authenticated can update music sources"
  on public.music_sources
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can delete music sources" on public.music_sources;
create policy "authenticated can delete music sources"
  on public.music_sources
  for delete
  to authenticated
  using (true);
