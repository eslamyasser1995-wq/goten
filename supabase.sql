-- ===================================================================
-- إسلامكو ISLAMKO – قاعدة البيانات (Supabase)
-- انسخ الملف كله والصقه في: Supabase > SQL Editor > New query > Run
-- ===================================================================

-- 1) الحسابات (أدمن / مندوب)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  phone text,
  role text not null default 'pending' check (role in ('pending','driver','admin','blocked')),
  created_at timestamptz default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- 2) الأقسام والمنتجات والبنرات والإعدادات
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null, name_en text, image text,
  sort int default 0, active boolean default true
);
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories on delete set null,
  name_ar text not null, name_en text, desc_ar text, desc_en text,
  price numeric(10,3) not null check (price >= 0), old_price numeric(10,3),
  unit_ar text default 'كيلو', unit_en text default 'kg', image text,
  in_stock boolean default true, active boolean default true, featured boolean default false,
  sort int default 0, created_at timestamptz default now()
);
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  image text not null, title text, sort int default 0, active boolean default true
);
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  delivery_fee numeric(10,3) default 1, min_order numeric(10,3) default 5,
  free_delivery_over numeric(10,3), store_open boolean default true,
  whatsapp text, notice_ar text, notice_en text
);
insert into public.settings (id) values (1) on conflict do nothing;
alter table public.settings add column if not exists store_name text;
alter table public.settings add column if not exists tagline_ar text;
alter table public.settings add column if not exists tagline_en text;
alter table public.settings add column if not exists logo text;
alter table public.settings add column if not exists header_color text;

-- 3) الطلبات
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no bigint generated always as identity (start with 1001),
  customer_name text not null check (length(customer_name) between 2 and 80),
  phone text not null check (phone ~ '^965[0-9]{8}$'),
  area text not null, block text, street text, avenue text, house text, floor_apt text,
  notes text check (length(notes) <= 500), slot text, payment text default 'cash',
  items jsonb not null, subtotal numeric(10,3), delivery_fee numeric(10,3), total numeric(10,3),
  status text not null default 'new' check (status in ('new','confirmed','preparing','out_for_delivery','delivered','cancelled')),
  driver_id uuid references public.profiles on delete set null,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- 4) تسجيل الطلب: الأسعار تُحسب من قاعدة البيانات (العميل ما يقدر يغيّر السعر)
create or replace function public.place_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare it jsonb; pr public.products; items jsonb := '[]'::jsonb; sub numeric := 0;
        s public.settings; fee numeric; q int; o public.orders;
begin
  select * into s from public.settings where id = 1;
  if not s.store_open then raise exception 'STORE_CLOSED'; end if;
  if jsonb_array_length(coalesce(p->'items','[]'::jsonb)) > 60 then raise exception 'TOO_MANY'; end if;
  for it in select value from jsonb_array_elements(coalesce(p->'items','[]'::jsonb)) loop
    q := greatest(1, least(99, coalesce((it->>'qty')::int, 1)));
    select * into pr from public.products where id = (it->>'id')::uuid and active and in_stock;
    if not found then raise exception 'PRODUCT_UNAVAILABLE'; end if;
    items := items || jsonb_build_object('id',pr.id,'name_ar',pr.name_ar,'name_en',pr.name_en,'price',pr.price,'qty',q,'unit_ar',pr.unit_ar,'image',pr.image);
    sub := sub + pr.price * q;
  end loop;
  if jsonb_array_length(items) = 0 then raise exception 'EMPTY'; end if;
  if sub < coalesce(s.min_order, 0) then raise exception 'MIN_ORDER'; end if;
  fee := case when s.free_delivery_over is not null and sub >= s.free_delivery_over then 0 else coalesce(s.delivery_fee, 0) end;
  insert into public.orders (customer_name, phone, area, block, street, avenue, house, floor_apt, notes, slot, payment, items, subtotal, delivery_fee, total)
  values (p->>'customer_name', p->>'phone', p->>'area', p->>'block', p->>'street', p->>'avenue', p->>'house', p->>'floor_apt', p->>'notes', p->>'slot',
          case when p->>'payment' = 'knet_on_delivery' then 'knet_on_delivery' else 'cash' end, items, sub, fee, sub + fee)
  returning * into o;
  return jsonb_build_object('id', o.id, 'order_no', o.order_no, 'total', o.total);
end $$;

-- 5) تتبع الطلب برقمه السري (uuid) بدون تسجيل دخول
create or replace function public.track_order(oid uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id',o.id,'order_no',o.order_no,'status',o.status,'items',o.items,'subtotal',o.subtotal,
    'delivery_fee',o.delivery_fee,'total',o.total,'created_at',o.created_at,'area',o.area,'slot',o.slot,'payment',o.payment,
    'driver_name',d.full_name,'driver_phone',d.phone)
  from public.orders o left join public.profiles d on d.id = o.driver_id where o.id = oid
$$;

-- 6) المندوب يغيّر حالة طلباته فقط
create or replace function public.driver_set_status(oid uuid, st text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() <> 'driver' then raise exception 'NOT_DRIVER'; end if;
  if st not in ('out_for_delivery','delivered') then raise exception 'BAD_STATUS'; end if;
  update public.orders set status = st, updated_at = now()
   where id = oid and driver_id = auth.uid() and status not in ('delivered','cancelled');
  if not found then raise exception 'NOT_ALLOWED'; end if;
end $$;

revoke all on function public.place_order(jsonb), public.track_order(uuid), public.driver_set_status(uuid,text) from public;
grant execute on function public.place_order(jsonb), public.track_order(uuid) to anon, authenticated;
grant execute on function public.driver_set_status(uuid,text) to authenticated;

-- 7) الصلاحيات (Row Level Security)
alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.banners    enable row level security;
alter table public.settings   enable row level security;
alter table public.orders     enable row level security;

drop policy if exists "read" on public.categories;  create policy "read" on public.categories for select using (true);
drop policy if exists "admin" on public.categories; create policy "admin" on public.categories for all using (public.my_role()='admin') with check (public.my_role()='admin');
drop policy if exists "read" on public.products;    create policy "read" on public.products for select using (true);
drop policy if exists "admin" on public.products;   create policy "admin" on public.products for all using (public.my_role()='admin') with check (public.my_role()='admin');
drop policy if exists "read" on public.banners;     create policy "read" on public.banners for select using (true);
drop policy if exists "admin" on public.banners;    create policy "admin" on public.banners for all using (public.my_role()='admin') with check (public.my_role()='admin');
drop policy if exists "read" on public.settings;    create policy "read" on public.settings for select using (true);
drop policy if exists "admin" on public.settings;   create policy "admin" on public.settings for update using (public.my_role()='admin') with check (public.my_role()='admin');

drop policy if exists "self or admin" on public.profiles; create policy "self or admin" on public.profiles for select using (id = auth.uid() or public.my_role()='admin');
drop policy if exists "admin update" on public.profiles;  create policy "admin update" on public.profiles for update using (public.my_role()='admin') with check (public.my_role()='admin');

drop policy if exists "admin or driver read" on public.orders; create policy "admin or driver read" on public.orders for select using (public.my_role()='admin' or (public.my_role()='driver' and driver_id = auth.uid()));
drop policy if exists "admin update" on public.orders;         create policy "admin update" on public.orders for update using (public.my_role()='admin') with check (public.my_role()='admin');
drop policy if exists "admin delete" on public.orders;         create policy "admin delete" on public.orders for delete using (public.my_role()='admin');

-- 8) تخزين الصور (مجلد عام للقراءة، الرفع للأدمن فقط)
insert into storage.buckets (id, name, public) values ('images', 'images', true) on conflict (id) do nothing;
drop policy if exists "islamko read images" on storage.objects;   create policy "islamko read images" on storage.objects for select using (bucket_id = 'images');
drop policy if exists "islamko upload images" on storage.objects; create policy "islamko upload images" on storage.objects for insert with check (bucket_id = 'images' and public.my_role() = 'admin');
drop policy if exists "islamko delete images" on storage.objects; create policy "islamko delete images" on storage.objects for delete using (bucket_id = 'images' and public.my_role() = 'admin');

-- ===================================================================
-- بعد ما تسجّل حسابك من صفحة admin.html، شغّل السطر ده (غيّر الإيميل):
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
-- ===================================================================
