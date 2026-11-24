-- ===================================================================
-- Goten – اختيارات المنتج + مواعيد التوصيل + كوبونات الخصم
-- ===================================================================

-- 1) اختيارات المنتج (تنضيف / تقطيع / وزن ...)
-- [{"name":"التنظيف","choices":[{"name":"بدون","price":0},{"name":"تنظيف كامل","price":0.25}]}]
alter table public.products add column if not exists options jsonb not null default '[]'::jsonb;

-- 2) مواعيد التوصيل
alter table public.settings add column if not exists slots jsonb default '["10:00 – 12:00","12:00 – 14:00","16:00 – 18:00","18:00 – 20:00","20:00 – 22:00"]'::jsonb;
alter table public.settings add column if not exists slot_days int default 2;
alter table public.settings add column if not exists slot_cutoff int default 60;
alter table public.settings add column if not exists allow_asap boolean default true;

-- 3) الكوبونات
create table if not exists public.coupons (
  code text primary key check (code = upper(code) and length(code) between 2 and 30),
  kind text not null default 'percent' check (kind in ('percent','fixed','free_delivery')),
  value numeric(10,3) not null default 0 check (value >= 0),
  min_order numeric(10,3) not null default 0,
  max_discount numeric(10,3),
  max_uses int,
  uses int not null default 0,
  once_per_phone boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  note text,
  created_at timestamptz default now()
);
alter table public.coupons enable row level security;
drop policy if exists "admin" on public.coupons;
create policy "admin" on public.coupons for all using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
grant select, insert, update, delete on public.coupons to authenticated;

alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount numeric(10,3) not null default 0;

-- حساب الخصم (داخلي)
create or replace function public._coupon_discount(cc text, sub numeric, ph text, lock boolean default false)
returns table (code text, kind text, discount numeric, free_delivery boolean)
language plpgsql security definer set search_path = public as $$
declare cp public.coupons;
begin
  if lock then select * into cp from public.coupons c where c.code = upper(trim(cc)) for update;
  else select * into cp from public.coupons c where c.code = upper(trim(cc)); end if;
  if not found or not cp.active then raise exception 'COUPON_INVALID'; end if;
  if (cp.starts_at is not null and now() < cp.starts_at) or (cp.ends_at is not null and now() > cp.ends_at) then raise exception 'COUPON_EXPIRED'; end if;
  if cp.max_uses is not null and cp.uses >= cp.max_uses then raise exception 'COUPON_LIMIT'; end if;
  if sub < cp.min_order then raise exception 'COUPON_MIN:%', cp.min_order; end if;
  if cp.once_per_phone and coalesce(ph, '') <> '' and exists (
       select 1 from public.orders o where o.phone = ph and o.coupon_code = cp.code and o.status <> 'cancelled') then
    raise exception 'COUPON_USED';
  end if;
  code := cp.code; kind := cp.kind; free_delivery := cp.kind = 'free_delivery';
  discount := case cp.kind
    when 'percent' then least(round(sub * cp.value / 100, 3), coalesce(cp.max_discount, sub))
    when 'fixed' then least(cp.value, sub)
    else 0 end;
  return next;
end $$;
revoke all on function public._coupon_discount(text, numeric, text, boolean) from public, anon, authenticated;

-- الزبون يجرّب الكوبون قبل الطلب
create or replace function public.check_coupon(cc text, sub numeric, ph text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  select * into r from public._coupon_discount(cc, coalesce(sub, 0), ph, false);
  return jsonb_build_object('code', r.code, 'kind', r.kind, 'discount', r.discount, 'free_delivery', r.free_delivery);
end $$;
revoke all on function public.check_coupon(text, numeric, text) from public;
grant execute on function public.check_coupon(text, numeric, text) to anon, authenticated;

-- 4) تسجيل الطلب: الاختيارات + الكوبون + الموعد + المخزون
create or replace function public.place_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare it jsonb; pr public.products; items jsonb := '[]'::jsonb; sub numeric := 0;
        s public.settings; fee numeric; q int; o public.orders;
        g jsonb; ch jsonb; sel text; opts jsonb; extra numeric; unit numeric; tot jsonb := '{}'::jsonb;
        cc text := upper(trim(coalesce(p->>'coupon', ''))); cr record; disc numeric := 0;
begin
  select * into s from public.settings where id = 1;
  if not s.store_open then raise exception 'STORE_CLOSED'; end if;
  if jsonb_array_length(coalesce(p->'items','[]'::jsonb)) > 60 then raise exception 'TOO_MANY'; end if;
  for it in select value from jsonb_array_elements(coalesce(p->'items','[]'::jsonb)) loop
    q := greatest(1, least(99, coalesce((it->>'qty')::int, 1)));
    select * into pr from public.products where id = (it->>'id')::uuid and active and in_stock;
    if not found then raise exception 'PRODUCT_UNAVAILABLE'; end if;
    tot := tot || jsonb_build_object(pr.id::text, coalesce((tot->>pr.id::text)::int, 0) + q);
    if pr.stock is not null and pr.stock < (tot->>pr.id::text)::int then raise exception 'OUT_OF_STOCK:%', pr.name_ar; end if;
    opts := '[]'::jsonb; extra := 0;
    for g in select value from jsonb_array_elements(coalesce(pr.options, '[]'::jsonb)) loop
      sel := (select x->>'c' from jsonb_array_elements(coalesce(it->'opts', '[]'::jsonb)) x where x->>'g' = g->>'name' limit 1);
      ch := null;
      if sel is not null then select x into ch from jsonb_array_elements(coalesce(g->'choices', '[]'::jsonb)) x where x->>'name' = sel limit 1; end if;
      if ch is null then ch := g->'choices'->0; end if;
      if ch is null then continue; end if;
      extra := extra + coalesce((ch->>'price')::numeric, 0);
      opts := opts || jsonb_build_object('g', g->>'name', 'c', ch->>'name', 'price', coalesce((ch->>'price')::numeric, 0));
    end loop;
    unit := greatest(0, pr.price + extra);
    items := items || jsonb_build_object('id',pr.id,'name_ar',pr.name_ar,'name_en',pr.name_en,'price',unit,'base_price',pr.price,'opts',opts,'qty',q,'unit_ar',pr.unit_ar,'image',pr.image);
    sub := sub + unit * q;
  end loop;
  if jsonb_array_length(items) = 0 then raise exception 'EMPTY'; end if;
  if sub < coalesce(s.min_order, 0) then raise exception 'MIN_ORDER'; end if;
  fee := case when s.free_delivery_over is not null and sub >= s.free_delivery_over then 0 else coalesce(s.delivery_fee, 0) end;
  if cc <> '' then
    select * into cr from public._coupon_discount(cc, sub, p->>'phone', true);
    disc := cr.discount;
    if cr.free_delivery then fee := 0; end if;
    update public.coupons set uses = uses + 1 where code = cr.code;
  end if;
  insert into public.orders (customer_name, phone, area, block, street, avenue, house, floor_apt, notes, slot, payment, marketing_opt_in, items, subtotal, delivery_fee, total, coupon_code, discount)
  values (p->>'customer_name', p->>'phone', p->>'area', p->>'block', p->>'street', p->>'avenue', p->>'house', p->>'floor_apt', p->>'notes', left(p->>'slot', 60),
          case when p->>'payment' = 'knet_on_delivery' then 'knet_on_delivery' else 'cash' end, coalesce((p->>'marketing_opt_in')::boolean, false),
          items, sub, fee, greatest(0, sub - disc + fee), nullif(cc, ''), disc)
  returning * into o;
  return jsonb_build_object('id', o.id, 'order_no', o.order_no, 'total', o.total);
end $$;

-- 5) التتبع يرجّع الخصم كمان
create or replace function public.track_order(oid uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id',o.id,'order_no',o.order_no,'status',o.status,'items',o.items,'subtotal',o.subtotal,
    'delivery_fee',o.delivery_fee,'total',o.total,'discount',o.discount,'coupon_code',o.coupon_code,'created_at',o.created_at,'area',o.area,'slot',o.slot,'payment',o.payment,
    'driver_name',d.full_name,'driver_phone',d.phone)
  from public.orders o left join public.profiles d on d.id = o.driver_id where o.id = oid
$$;
