insert into storage.buckets (id, name, public)
select 'memories-images', 'memories-images', true
where not exists (
  select 1 from storage.buckets where id = 'memories-images'
);

drop policy if exists "public can view memory images" on storage.objects;
create policy "public can view memory images"
on storage.objects for select
to public
using (bucket_id = 'memories-images');

drop policy if exists "public can upload memory images" on storage.objects;
create policy "public can upload memory images"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'memories-images');

drop policy if exists "public can update memory images" on storage.objects;
create policy "public can update memory images"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'memories-images')
with check (bucket_id = 'memories-images');

drop policy if exists "public can delete memory images" on storage.objects;
create policy "public can delete memory images"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'memories-images');
