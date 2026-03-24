create extension if not exists pgcrypto;

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  task text not null,
  assignee text not null,
  deadline timestamptz not null,
  cost numeric(12, 0) not null default 0,
  location text,
  map_url text,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  memory_date date not null,
  location text not null,
  image_url text not null,
  description text not null,
  likes integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.date_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  scheduled_for timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.date_plan_activities (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.date_plans(id) on delete cascade,
  name text not null,
  cost numeric(12, 0) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists todos_deadline_idx on public.todos (deadline desc);
create index if not exists memories_memory_date_idx on public.memories (memory_date desc);
create index if not exists date_plans_scheduled_for_idx on public.date_plans (scheduled_for desc);
create index if not exists date_plan_activities_plan_id_idx on public.date_plan_activities (plan_id, sort_order);

alter table public.todos enable row level security;
alter table public.memories enable row level security;
alter table public.date_plans enable row level security;
alter table public.date_plan_activities enable row level security;

drop policy if exists "public can read todos" on public.todos;
create policy "public can read todos" on public.todos for select to anon, authenticated using (true);
drop policy if exists "public can insert todos" on public.todos;
create policy "public can insert todos" on public.todos for insert to anon, authenticated with check (true);
drop policy if exists "public can update todos" on public.todos;
create policy "public can update todos" on public.todos for update to anon, authenticated using (true) with check (true);
drop policy if exists "public can delete todos" on public.todos;
create policy "public can delete todos" on public.todos for delete to anon, authenticated using (true);

drop policy if exists "public can read memories" on public.memories;
create policy "public can read memories" on public.memories for select to anon, authenticated using (true);
drop policy if exists "public can insert memories" on public.memories;
create policy "public can insert memories" on public.memories for insert to anon, authenticated with check (true);
drop policy if exists "public can update memories" on public.memories;
create policy "public can update memories" on public.memories for update to anon, authenticated using (true) with check (true);
drop policy if exists "public can delete memories" on public.memories;
create policy "public can delete memories" on public.memories for delete to anon, authenticated using (true);

drop policy if exists "public can read date plans" on public.date_plans;
create policy "public can read date plans" on public.date_plans for select to anon, authenticated using (true);
drop policy if exists "public can insert date plans" on public.date_plans;
create policy "public can insert date plans" on public.date_plans for insert to anon, authenticated with check (true);
drop policy if exists "public can update date plans" on public.date_plans;
create policy "public can update date plans" on public.date_plans for update to anon, authenticated using (true) with check (true);
drop policy if exists "public can delete date plans" on public.date_plans;
create policy "public can delete date plans" on public.date_plans for delete to anon, authenticated using (true);

drop policy if exists "public can read date plan activities" on public.date_plan_activities;
create policy "public can read date plan activities" on public.date_plan_activities for select to anon, authenticated using (true);
drop policy if exists "public can insert date plan activities" on public.date_plan_activities;
create policy "public can insert date plan activities" on public.date_plan_activities for insert to anon, authenticated with check (true);
drop policy if exists "public can update date plan activities" on public.date_plan_activities;
create policy "public can update date plan activities" on public.date_plan_activities for update to anon, authenticated using (true) with check (true);
drop policy if exists "public can delete date plan activities" on public.date_plan_activities;
create policy "public can delete date plan activities" on public.date_plan_activities for delete to anon, authenticated using (true);

insert into public.todos (task, assignee, deadline, cost, location, map_url, done)
select * from (
  values
    ('Mua ve xem phim Dune 2', 'Nam', '2026-03-25T19:00:00+07', 250000, 'CGV Landmark 81', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.274371454522!2d106.7191142148011!3d10.790282992312015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528ab1a145625%3A0x6b45a9990b79144!2sLandmark%2081!5e0!3m2!1sen!2s!4v1645432123456!5m2!1sen!2s', false),
    ('Dat ban nha hang ky niem', 'Cy', '2026-03-26T20:00:00+07', 1500000, 'The Deck Saigon', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.123456789!2d106.73456789!3d10.80123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317526123456789%3A0x123456789abcdef!2sThe%20Deck%20Saigon!5e0!3m2!1sen!2s!4v1645432123456!5m2!1sen!2s', true),
    ('Mua qua sinh nhat me', 'Nam', '2026-04-01T10:00:00+07', 500000, 'Vincom Center', null, false)
) as seed(task, assignee, deadline, cost, location, map_url, done)
where not exists (select 1 from public.todos);

insert into public.memories (title, memory_date, location, image_url, description, likes)
select * from (
  values
    ('Chuyen di Da Lat', '2025-12-25', 'Da Lat, Lam Dong', 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=2070&auto=format&fit=crop', 'Lan dau tien don Giang Sinh cung nhau tren thanh pho suong mu. Lanh nhung am ap.', 12),
    ('Ky niem 1 nam', '2026-02-14', 'Nha hang The Deck', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop', 'Bua toi lang man ben song Sai Gon. Cy da khoc khi nhan qua.', 24),
    ('Lan dau nau an chung', '2025-08-10', 'Can ho nho', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop', 'Mon mi Y hoi man nhung van an het sach.', 8)
) as seed(title, memory_date, location, image_url, description, likes)
where not exists (select 1 from public.memories);

with inserted_plan as (
  insert into public.date_plans (title, scheduled_for)
  select 'Ky niem 2 nam yeu nhau', '2026-05-10T18:00:00+07'
  where not exists (select 1 from public.date_plans)
  returning id
)
insert into public.date_plan_activities (plan_id, name, cost, sort_order)
select inserted_plan.id, seed.name, seed.cost, seed.sort_order
from inserted_plan
cross join (
  values
    ('An toi The Deck', 2500000, 0),
    ('Xem phim', 300000, 1),
    ('Dao pho di bo', 100000, 2)
) as seed(name, cost, sort_order);
