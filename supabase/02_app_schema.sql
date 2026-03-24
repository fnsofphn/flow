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

create table if not exists public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null check (entry_type in ('contribution', 'expense', 'adjustment')),
  amount numeric(12, 0) not null check (amount >= 0),
  currency text not null default 'VND',
  person text,
  reason text not null,
  entry_at timestamptz not null default now(),
  source text,
  created_at timestamptz not null default now()
);

create table if not exists public.emotional_notes (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  emotion text not null,
  unlock_date timestamptz not null,
  is_opened boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.dream_entries (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  analysis text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'H?p d?ng b?o m?u',
  content text not null default '',
  monthly_silver_salary numeric(12, 2) not null default 0,
  bonus_silver numeric(12, 2) not null default 0,
  payment_cycle text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contract_documents
  add column if not exists monthly_silver_salary numeric(12, 2) not null default 0;

alter table public.contract_documents
  add column if not exists bonus_silver numeric(12, 2) not null default 0;

alter table public.contract_documents
  add column if not exists payment_cycle text not null default '';

create table if not exists public.contract_silver_payments (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12, 2) not null check (amount >= 0),
  reason text not null,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists todos_deadline_idx on public.todos (deadline desc);
create index if not exists memories_memory_date_idx on public.memories (memory_date desc);
create index if not exists date_plans_scheduled_for_idx on public.date_plans (scheduled_for desc);
create index if not exists date_plan_activities_plan_id_idx on public.date_plan_activities (plan_id, sort_order);
create index if not exists finance_entries_entry_at_idx on public.finance_entries (entry_at desc);
create index if not exists emotional_notes_unlock_date_idx on public.emotional_notes (unlock_date asc);
create index if not exists dream_entries_created_at_idx on public.dream_entries (created_at desc);
create index if not exists contract_silver_payments_paid_at_idx on public.contract_silver_payments (paid_at desc);

alter table public.todos enable row level security;
alter table public.memories enable row level security;
alter table public.date_plans enable row level security;
alter table public.date_plan_activities enable row level security;
alter table public.finance_entries enable row level security;
alter table public.emotional_notes enable row level security;
alter table public.dream_entries enable row level security;
alter table public.contract_documents enable row level security;
alter table public.contract_silver_payments enable row level security;

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

drop policy if exists "public can read finance entries" on public.finance_entries;
create policy "public can read finance entries" on public.finance_entries for select to anon, authenticated using (true);
drop policy if exists "public can insert finance entries" on public.finance_entries;
create policy "public can insert finance entries" on public.finance_entries for insert to anon, authenticated with check (true);
drop policy if exists "public can update finance entries" on public.finance_entries;
create policy "public can update finance entries" on public.finance_entries for update to anon, authenticated using (true) with check (true);
drop policy if exists "public can delete finance entries" on public.finance_entries;
create policy "public can delete finance entries" on public.finance_entries for delete to anon, authenticated using (true);

drop policy if exists "public can read emotional notes" on public.emotional_notes;
create policy "public can read emotional notes" on public.emotional_notes for select to anon, authenticated using (true);
drop policy if exists "public can insert emotional notes" on public.emotional_notes;
create policy "public can insert emotional notes" on public.emotional_notes for insert to anon, authenticated with check (true);
drop policy if exists "public can update emotional notes" on public.emotional_notes;
create policy "public can update emotional notes" on public.emotional_notes for update to anon, authenticated using (true) with check (true);
drop policy if exists "public can delete emotional notes" on public.emotional_notes;
create policy "public can delete emotional notes" on public.emotional_notes for delete to anon, authenticated using (true);

drop policy if exists "public can read dream entries" on public.dream_entries;
create policy "public can read dream entries" on public.dream_entries for select to anon, authenticated using (true);
drop policy if exists "public can insert dream entries" on public.dream_entries;
create policy "public can insert dream entries" on public.dream_entries for insert to anon, authenticated with check (true);
drop policy if exists "public can delete dream entries" on public.dream_entries;
create policy "public can delete dream entries" on public.dream_entries for delete to anon, authenticated using (true);

drop policy if exists "public can read contract documents" on public.contract_documents;
create policy "public can read contract documents" on public.contract_documents for select to anon, authenticated using (true);
drop policy if exists "public can insert contract documents" on public.contract_documents;
create policy "public can insert contract documents" on public.contract_documents for insert to anon, authenticated with check (true);
drop policy if exists "public can update contract documents" on public.contract_documents;
create policy "public can update contract documents" on public.contract_documents for update to anon, authenticated using (true) with check (true);

drop policy if exists "public can read contract silver payments" on public.contract_silver_payments;
create policy "public can read contract silver payments" on public.contract_silver_payments for select to anon, authenticated using (true);
drop policy if exists "public can insert contract silver payments" on public.contract_silver_payments;
create policy "public can insert contract silver payments" on public.contract_silver_payments for insert to anon, authenticated with check (true);
drop policy if exists "public can delete contract silver payments" on public.contract_silver_payments;
create policy "public can delete contract silver payments" on public.contract_silver_payments for delete to anon, authenticated using (true);

insert into public.todos (task, assignee, deadline, cost, location, map_url, done)
select * from (
  values
    ('Mua vé xem phim Dune 2', 'Nam', '2026-03-25T19:00:00+07'::timestamptz, 250000::numeric, 'CGV Landmark 81', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.274371454522!2d106.7191142148011!3d10.790282992312015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528ab1a145625%3A0x6b45a9990b79144!2sLandmark%2081!5e0!3m2!1sen!2s!4v1645432123456!5m2!1sen!2s', false),
    ('Ð?t bàn nhà hàng k? ni?m', 'Cy', '2026-03-26T20:00:00+07'::timestamptz, 1500000::numeric, 'The Deck Saigon', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.123456789!2d106.73456789!3d10.80123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317526123456789%3A0x123456789abcdef!2sThe%20Deck%20Saigon!5e0!3m2!1sen!2s!4v1645432123456!5m2!1sen!2s', true),
    ('Mua quà sinh nh?t m?', 'Nam', '2026-04-01T10:00:00+07'::timestamptz, 500000::numeric, 'Vincom Center', null, false)
) as seed(task, assignee, deadline, cost, location, map_url, done)
where not exists (select 1 from public.todos);

insert into public.memories (title, memory_date, location, image_url, description, likes)
select * from (
  values
    ('Chuy?n di Ðà L?t', '2025-12-25'::date, 'Ðà L?t, Lâm Ð?ng', 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=2070&auto=format&fit=crop', 'L?n d?u tiên dón Giáng Sinh cùng nhau trên thành ph? suong mù. L?nh nhung ?m áp.', 12),
    ('K? ni?m 1 nam', '2026-02-14'::date, 'Nhà hàng The Deck', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop', 'B?a t?i lãng m?n bên sông Sài Gòn. Cy dã khóc khi nh?n quà.', 24),
    ('L?n d?u n?u an chung', '2025-08-10'::date, 'Can h? nh?', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop', 'Món mì Ý hoi m?n nhung v?n an h?t s?ch.', 8)
) as seed(title, memory_date, location, image_url, description, likes)
where not exists (select 1 from public.memories);

with inserted_plan as (
  insert into public.date_plans (title, scheduled_for)
  select 'K? ni?m 2 nam yêu nhau', '2026-05-10T18:00:00+07'::timestamptz
  where not exists (select 1 from public.date_plans)
  returning id
)
insert into public.date_plan_activities (plan_id, name, cost, sort_order)
select inserted_plan.id, seed.name, seed.cost, seed.sort_order
from inserted_plan
cross join (
  values
    ('An t?i The Deck', 2500000::numeric, 0),
    ('Xem phim', 300000::numeric, 1),
    ('D?o ph? di b?', 100000::numeric, 2)
) as seed(name, cost, sort_order);

insert into public.contract_documents (title, content, monthly_silver_salary, bonus_silver, payment_cycle)
select
  'H?p d?ng b?o m?u',
  'Ði?u 1. Bên B ch?u trách nhi?m cham sóc, nh?c nh? và d?ng hành cùng Bên A m?i ngày.\n\nÐi?u 2. Luong co b?n du?c chi tr? b?ng lu?ng b?c theo th?a thu?n gi?a hai bên.\n\nÐi?u 3. Hai bên có quy?n t? b? sung di?u kho?n chi ti?t.',
  0.5,
  0.1,
  'Thanh toán vào ngày 25 h?ng tháng'
where not exists (select 1 from public.contract_documents);
