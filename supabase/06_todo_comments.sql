create table if not exists public.todo_comments (
  id uuid primary key default gen_random_uuid(),
  todo_id uuid not null references public.todos(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists todo_comments_todo_id_created_at_idx
  on public.todo_comments (todo_id, created_at desc);

alter table public.todo_comments enable row level security;

drop policy if exists "public can read todo comments" on public.todo_comments;
create policy "public can read todo comments"
  on public.todo_comments for select to anon, authenticated using (true);

drop policy if exists "public can insert todo comments" on public.todo_comments;
create policy "public can insert todo comments"
  on public.todo_comments for insert to anon, authenticated with check (true);

drop policy if exists "public can delete todo comments" on public.todo_comments;
create policy "public can delete todo comments"
  on public.todo_comments for delete to anon, authenticated using (true);
