-- 📥 استيراد Excel للحسابات + التراجع عنه
-- كل استيراد بياخد نسخة من الجداول قبل ما يعدّل، والتراجع بيرجّعها زي ما كانت.

create table if not exists public.import_batches (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  actor uuid default auth.uid(),
  actor_name text,
  file_name text,
  summary jsonb,
  backup jsonb not null,
  undone_at timestamptz
);
alter table public.import_batches enable row level security;
drop policy if exists ib_admin on public.import_batches;
create policy ib_admin on public.import_batches for select using (public.my_role() = 'admin');

-- الجداول المسموح بيها ومفتاح كل جدول
create or replace function public._imp_key(t text) returns text language sql immutable as $$
  select case t when 'transactions' then 'id' when 'suppliers' then 'id' when 'employees' then 'id' when 'recurring' then 'id'
    when 'driver_moves' then 'id' when 'day_closes' then 'day' when 'customers' then 'phone' when 'customer_meta' then 'phone' end $$;

-- يخلّي الجدول مطابق للصفوف اللي جاية بالظبط (يضيف / يعدّل / يمسح)
create or replace function public._imp_sync(t text, rows jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare k text := public._imp_key(t); cols text; upd text; n_del int; n_up int;
begin
  if k is null then raise exception 'جدول غير مسموح: %', t; end if;
  select string_agg(quote_ident(column_name), ','), string_agg(quote_ident(column_name) || '=excluded.' || quote_ident(column_name), ',') filter (where column_name <> k)
    into cols, upd from information_schema.columns where table_schema = 'public' and table_name = t;
  execute format('delete from public.%I where %I::text not in (select x->>%L from jsonb_array_elements($1) x where x->>%L is not null)', t, k, k, k) using rows;
  get diagnostics n_del = row_count;
  execute format('insert into public.%I (%s) select %s from jsonb_populate_recordset(null::public.%I, $1) on conflict (%I) do update set %s', t, cols, cols, t, k, upd) using rows;
  get diagnostics n_up = row_count;
  return jsonb_build_object('deleted', n_del, 'saved', n_up);
end $$;

-- ترتيب الجداول (الموردين قبل الحركات علشان الربط)
create or replace function public._imp_order() returns text[] language sql immutable as $$
  select array['suppliers','employees','recurring','customers','customer_meta','transactions','driver_moves','day_closes'] $$;

create or replace function public.import_accounts(p jsonb, fname text default null) returns bigint
language plpgsql security definer set search_path = public as $$
declare t text; rows_old jsonb; bk jsonb := '{}'; sm jsonb := '{}'; bid bigint; nm text;
begin
  if public.my_role() is distinct from 'admin' then raise exception 'الأدمن بس اللي يقدر يستورد'; end if;
  if p is null or jsonb_typeof(p) <> 'object' or p = '{}' then raise exception 'الملف فاضي'; end if;
  for t in select jsonb_object_keys(p) loop
    if public._imp_key(t) is null then raise exception 'جدول غير مسموح: %', t; end if;
  end loop;
  perform set_config('goten.importing', '1', true);
  foreach t in array public._imp_order() loop
    continue when not p ? t;
    execute format('select coalesce(jsonb_agg(to_jsonb(x)), ''[]''::jsonb) from public.%I x', t) into rows_old;
    bk := bk || jsonb_build_object(t, rows_old);
    sm := sm || jsonb_build_object(t, public._imp_sync(t, p -> t) || jsonb_build_object('before', jsonb_array_length(rows_old)));
  end loop;
  select full_name into nm from public.profiles where id = auth.uid();
  insert into public.import_batches (actor_name, file_name, summary, backup) values (nm, fname, sm, bk) returning id into bid;
  insert into public.audit_log (actor, actor_name, tbl, action, row_id, info) values (auth.uid(), nm, 'import', 'import', bid::text, jsonb_build_object('note', 'استيراد Excel: ' || coalesce(fname, '')));
  return bid;
end $$;

-- التراجع عن آخر استيراد (يرجّع الجداول زي ما كانت قبله)
create or replace function public.undo_import(bid bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare b public.import_batches; t text; nm text; last_id bigint;
begin
  if public.my_role() is distinct from 'admin' then raise exception 'الأدمن بس اللي يقدر يتراجع'; end if;
  select * into b from public.import_batches where id = bid for update;
  if b.id is null then raise exception 'الاستيراد ده مش موجود'; end if;
  if b.undone_at is not null then raise exception 'الاستيراد ده اتلغى قبل كده'; end if;
  select max(id) into last_id from public.import_batches where undone_at is null;
  if last_id <> bid then raise exception 'لازم تلغي الاستيرادات اللي بعده الأول'; end if;
  perform set_config('goten.importing', '1', true);
  foreach t in array public._imp_order() loop
    continue when not b.backup ? t;
    perform public._imp_sync(t, b.backup -> t);
  end loop;
  update public.import_batches set undone_at = now() where id = bid;
  select full_name into nm from public.profiles where id = auth.uid();
  insert into public.audit_log (actor, actor_name, tbl, action, row_id, info) values (auth.uid(), nm, 'import', 'undo', bid::text, jsonb_build_object('note', 'تراجع عن استيراد: ' || coalesce(b.file_name, '')));
  return b.summary;
end $$;

-- سجل الاستيرادات (من غير النسخة الاحتياطية علشان يبقى خفيف)
create or replace function public.import_list() returns jsonb
language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'at', created_at, 'by', actor_name, 'file', file_name, 'summary', summary, 'undone_at', undone_at) order by id desc), '[]')
  from (select * from public.import_batches where public.my_role() = 'admin' order by id desc limit 30) x $$;

revoke all on function public._imp_sync(text, jsonb) from public, anon, authenticated;
grant execute on function public.import_accounts(jsonb, text), public.undo_import(bigint), public.import_list() to authenticated;

-- وقت الاستيراد: مفيش إشعارات «مبلغ كبير/ميزانية» ولا سطر في السجل لكل صف
create or replace function public.tx_big_alert() returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare lim numeric;
begin
  if current_setting('goten.importing', true) = '1' then return new; end if;
  select big_payment into lim from public.settings where id = 1;
  if new.kind in ('receivable_paid','sale','income') and lim is not null and lim > 0 and new.amount >= lim then
    perform public._admin_alert('⚠️ مبلغ كبير اتسجّل', coalesce(new.party_name, '') || ' – ' || to_char(new.amount, 'FM999990.000') || ' د.ك' || coalesce(' – ' || new.note, '') || ' – اتأكد منه');
  end if;
  return new;
end $function$;

create or replace function public.tx_budget_alert() returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare b numeric; spent numeric; m date := date_trunc('month', coalesce(new.date, current_date))::date;
begin
  if current_setting('goten.importing', true) = '1' then return new; end if;
  if new.kind <> 'expense' then return new; end if;
  select (budgets->>coalesce(new.category, 'أخرى'))::numeric into b from public.settings where id = 1;
  if b is null or b <= 0 then return new; end if;
  select coalesce(sum(amount), 0) into spent from public.transactions where kind = 'expense' and coalesce(category, 'أخرى') = coalesce(new.category, 'أخرى') and date >= m and date < (m + interval '1 month');
  if spent >= b and spent - new.amount < b then perform public._admin_alert('🚨 عدّيت ميزانية ' || coalesce(new.category, 'أخرى'), 'صرفت ' || to_char(spent, 'FM999990.000') || ' من ' || to_char(b, 'FM999990.000') || ' د.ك الشهر ده');
  elsif spent >= b * 0.8 and spent - new.amount < b * 0.8 then perform public._admin_alert('⚠️ قرّبت من ميزانية ' || coalesce(new.category, 'أخرى'), 'صرفت ' || to_char(spent, 'FM999990.000') || ' من ' || to_char(b, 'FM999990.000') || ' د.ك (80%)'); end if;
  return new;
end $function$;

create or replace function public.audit_money() returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare nm text; r jsonb; o jsonb;
begin
  if current_setting('goten.importing', true) = '1' then return coalesce(new, old); end if;
  select full_name into nm from public.profiles where id = auth.uid();
  r := case when tg_op = 'DELETE' then null else to_jsonb(new) end; o := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  if tg_op = 'UPDATE' and r - 'updated_at' = o - 'updated_at' then return new; end if;
  insert into public.audit_log (actor, actor_name, tbl, action, row_id, amount_old, amount_new, info)
  values (auth.uid(), coalesce(nm, case when auth.uid() is null then 'النظام' else null end), tg_table_name, lower(tg_op), coalesce(r->>'id', o->>'id', r->>'day', o->>'day'),
    nullif(coalesce(o->>'amount', o->>'total', o->>'counted_cash'), '')::numeric, nullif(coalesce(r->>'amount', r->>'total', r->>'counted_cash'), '')::numeric,
    jsonb_build_object('kind', coalesce(r->>'kind', o->>'kind'), 'party', coalesce(r->>'party_name', o->>'party_name', r->>'customer_name', o->>'customer_name'), 'note', coalesce(r->>'note', o->>'note'), 'no', coalesce(r->>'order_no', o->>'order_no', r->>'receipt_no', o->>'receipt_no'),
      'pay_old', o->>'payment', 'pay_new', r->>'payment', 'status_old', o->>'status', 'status_new', r->>'status'));
  return coalesce(new, old);
end $function$;
