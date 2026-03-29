alter table public.todo_comments
  add column if not exists parent_id uuid references public.todo_comments(id) on delete cascade;

alter table public.todo_comments
  add column if not exists author text not null default 'Ban';

create index if not exists todo_comments_parent_id_idx
  on public.todo_comments (parent_id);

create table if not exists public.todo_comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.todo_comments(id) on delete cascade,
  reaction text not null check (reaction in ('love', 'haha')),
  actor_id text not null,
  created_at timestamptz not null default now(),
  unique (comment_id, reaction, actor_id)
);

create index if not exists todo_comment_reactions_comment_id_idx
  on public.todo_comment_reactions (comment_id, created_at desc);

alter table public.todo_comment_reactions enable row level security;

drop policy if exists "public can read todo comment reactions" on public.todo_comment_reactions;
create policy "public can read todo comment reactions"
  on public.todo_comment_reactions for select to anon, authenticated using (true);

drop policy if exists "public can insert todo comment reactions" on public.todo_comment_reactions;
create policy "public can insert todo comment reactions"
  on public.todo_comment_reactions for insert to anon, authenticated with check (true);

drop policy if exists "public can delete todo comment reactions" on public.todo_comment_reactions;
create policy "public can delete todo comment reactions"
  on public.todo_comment_reactions for delete to anon, authenticated using (true);

