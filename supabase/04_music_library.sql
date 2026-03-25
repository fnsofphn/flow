create table if not exists public.music_library_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  youtube_url text not null,
  source_kind text not null check (source_kind in ('video', 'playlist')),
  youtube_video_id text,
  youtube_playlist_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists music_library_items_created_at_idx
  on public.music_library_items (created_at desc);

alter table public.music_library_items enable row level security;

drop policy if exists "public can read music library items" on public.music_library_items;
create policy "public can read music library items"
  on public.music_library_items
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public can insert music library items" on public.music_library_items;
create policy "public can insert music library items"
  on public.music_library_items
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public can update music library items" on public.music_library_items;
create policy "public can update music library items"
  on public.music_library_items
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "public can delete music library items" on public.music_library_items;
create policy "public can delete music library items"
  on public.music_library_items
  for delete
  to anon, authenticated
  using (true);
