-- =====================================================================
-- Online in-person appointment system (نوبت‌دهی حضوری)
-- Run ONCE in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: tables use "if not exists", seed rows are upserted.
--
-- Requires the existing public.is_admin() function (already used by the admin pages).
-- The clinics / hours / prices seeded at the bottom are MIRRORED in src/data/booking.js.
-- Patients never read or write the appointments table directly: they go through the
-- booking_* functions below, which validate everything on the server.
-- =====================================================================

-- ---------- tables ----------

create table if not exists public.booking_clinics (
  id        text primary key,
  name      text not null,
  address   text,
  is_active boolean not null default true
);

-- weekday follows Postgres/JS convention: 0 = Sunday ... 6 = Saturday
create table if not exists public.booking_hours (
  clinic_id  text not null references public.booking_clinics(id) on delete cascade,
  weekday    smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time   time not null check (end_time > start_time),
  primary key (clinic_id, weekday, start_time)
);

create table if not exists public.booking_categories (
  id          text primary key,
  label       text not null,
  price_toman integer not null check (price_toman >= 0)
);

create table if not exists public.booking_appointments (
  id          bigint generated always as identity primary key,
  clinic_id   text not null references public.booking_clinics(id),
  appt_date   date not null,
  start_time  time not null,
  category_id text references public.booking_categories(id),
  price_toman integer,
  owner_name  text not null,
  phone       text not null,
  pet_name    text,
  pet_species text,
  reason      text,
  status      text not null default 'confirmed'
              check (status in ('confirmed', 'done', 'cancelled', 'no_show', 'blocked')),
  manage_code text not null,
  created_at  timestamptz not null default now()
);

-- one live appointment per clinic + date + time (cancelled ones free the slot again)
create unique index if not exists booking_one_per_slot
  on public.booking_appointments (clinic_id, appt_date, start_time)
  where status <> 'cancelled';

create index if not exists booking_appt_phone_idx on public.booking_appointments (phone);
create index if not exists booking_appt_date_idx  on public.booking_appointments (appt_date);

-- ---------- row level security ----------

alter table public.booking_clinics      enable row level security;
alter table public.booking_hours        enable row level security;
alter table public.booking_categories   enable row level security;
alter table public.booking_appointments enable row level security;

drop policy if exists booking_clinics_read on public.booking_clinics;
create policy booking_clinics_read on public.booking_clinics
  for select to anon, authenticated using (true);

drop policy if exists booking_hours_read on public.booking_hours;
create policy booking_hours_read on public.booking_hours
  for select to anon, authenticated using (true);

drop policy if exists booking_categories_read on public.booking_categories;
create policy booking_categories_read on public.booking_categories
  for select to anon, authenticated using (true);

-- appointments contain personal data: only the admin can read / change them directly
drop policy if exists booking_appointments_admin on public.booking_appointments;
create policy booking_appointments_admin on public.booking_appointments
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.booking_appointments from anon;

-- This project does not grant table privileges automatically, so give them explicitly.
-- RLS above still restricts the appointments table to the admin only.
grant select, insert, update, delete on public.booking_appointments to authenticated;
grant usage, select on sequence public.booking_appointments_id_seq to authenticated;
grant select on public.booking_clinics, public.booking_hours, public.booking_categories to anon, authenticated;

-- ---------- helpers ----------

create or replace function public.booking_norm_phone(p text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  x text;
begin
  -- Persian + Arabic-Indic digits -> ASCII, then strip everything that is not a digit
  x := regexp_replace(
         translate(coalesce(p, ''), '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789'),
         '[^0-9]', '', 'g');
  if length(x) = 12 and left(x, 2) = '98' then
    x := '0' || substr(x, 3);
  end if;
  return x;
end;
$$;

-- ---------- public API (called from the website via supabase.rpc) ----------

-- which slots are already taken (no personal data is exposed)
create or replace function public.booking_get_booked_slots(p_clinic text, p_from date, p_to date)
returns table (appt_date date, start_time time)
language sql
stable
security definer
set search_path = public
as $$
  select a.appt_date, a.start_time
  from public.booking_appointments a
  where a.clinic_id = p_clinic
    and a.status <> 'cancelled'
    and a.appt_date between p_from and least(p_to, p_from + 62)
$$;

-- create an appointment; every rule is re-checked here, never trusted from the browser
create or replace function public.booking_create(
  p_clinic      text,
  p_date        date,
  p_time        time,
  p_category    text,
  p_owner_name  text,
  p_phone       text,
  p_pet_name    text,
  p_pet_species text,
  p_reason      text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now   timestamp := (now() at time zone 'Asia/Tehran');
  v_phone text := public.booking_norm_phone(p_phone);
  v_price integer;
  v_code  text;
begin
  if p_owner_name is null or length(btrim(p_owner_name)) < 2 or length(p_owner_name) > 80 then
    raise exception 'invalid_name';
  end if;
  if v_phone !~ '^09[0-9]{9}$' then
    raise exception 'invalid_phone';
  end if;
  if p_date is null or p_time is null then
    raise exception 'slot_unavailable';
  end if;

  select c.price_toman into v_price from public.booking_categories c where c.id = p_category;
  if v_price is null then
    raise exception 'invalid_category';
  end if;

  if not exists (select 1 from public.booking_clinics c where c.id = p_clinic and c.is_active) then
    raise exception 'invalid_clinic';
  end if;

  -- at least 60 minutes from now, at most 35 days ahead
  if (p_date + p_time) < v_now + interval '60 minutes'
     or (p_date + p_time) > v_now + interval '35 days' then
    raise exception 'slot_unavailable';
  end if;

  -- must fall inside the clinic's working hours, on a 30-minute boundary
  if not exists (
    select 1 from public.booking_hours h
    where h.clinic_id = p_clinic
      and h.weekday = extract(dow from p_date)::int
      and p_time >= h.start_time
      and p_time + interval '30 minutes' <= h.end_time
      and (extract(epoch from (p_time - h.start_time))::int % 1800) = 0
  ) then
    raise exception 'slot_unavailable';
  end if;

  -- basic abuse guard: at most 2 upcoming active appointments per phone number
  if (select count(*) from public.booking_appointments a
      where a.phone = v_phone
        and a.status = 'confirmed'
        and (a.appt_date + a.start_time) >= v_now) >= 2 then
    raise exception 'too_many_active';
  end if;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  begin
    insert into public.booking_appointments
      (clinic_id, appt_date, start_time, category_id, price_toman,
       owner_name, phone, pet_name, pet_species, reason, manage_code)
    values
      (p_clinic, p_date, p_time, p_category, v_price,
       btrim(p_owner_name), v_phone,
       left(nullif(btrim(coalesce(p_pet_name, '')), ''), 80),
       left(nullif(btrim(coalesce(p_pet_species, '')), ''), 80),
       left(nullif(btrim(coalesce(p_reason, '')), ''), 1000),
       v_code);
  exception when unique_violation then
    raise exception 'slot_taken';
  end;

  return jsonb_build_object('code', v_code, 'price', v_price);
end;
$$;

-- look up an appointment with its tracking code + the phone number it was booked with
create or replace function public.booking_find(p_code text, p_phone text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r jsonb;
begin
  select jsonb_build_object(
           'clinic_id',   a.clinic_id,
           'date',        a.appt_date,
           'time',        to_char(a.start_time, 'HH24:MI'),
           'status',      a.status,
           'price',       a.price_toman,
           'category_id', a.category_id,
           'owner_name',  a.owner_name)
    into r
    from public.booking_appointments a
   where a.manage_code = upper(btrim(p_code))
     and a.phone = public.booking_norm_phone(p_phone)
     and a.status <> 'blocked';
  return r; -- null when nothing matches
end;
$$;

-- cancel a still-upcoming appointment (frees the slot)
create or replace function public.booking_cancel(p_code text, p_phone text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamp := (now() at time zone 'Asia/Tehran');
  n integer;
begin
  update public.booking_appointments a
     set status = 'cancelled'
   where a.manage_code = upper(btrim(p_code))
     and a.phone = public.booking_norm_phone(p_phone)
     and a.status = 'confirmed'
     and (a.appt_date + a.start_time) > v_now;
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

revoke all on function public.booking_norm_phone(text) from public;
revoke all on function public.booking_get_booked_slots(text, date, date) from public;
revoke all on function public.booking_create(text, date, time, text, text, text, text, text, text) from public;
revoke all on function public.booking_find(text, text) from public;
revoke all on function public.booking_cancel(text, text) from public;

grant execute on function public.booking_get_booked_slots(text, date, date) to anon, authenticated;
grant execute on function public.booking_create(text, date, time, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.booking_find(text, text) to anon, authenticated;
grant execute on function public.booking_cancel(text, text) to anon, authenticated;

-- ---------- seed data (mirrors src/data/booking.js) ----------

insert into public.booking_clinics (id, name, address) values
  ('miracle', 'کلینیک میراکل', 'تهرانپارس، خیابان زفرقندی، پلاک ۹۰، واحد ۱'),
  ('roma',    'کلینیک دامپزشکی روما', 'نیاوران، کاشانک، خیابان پورابتهاج، بن‌بست طائی، پلاک ۶، طبقه اول')
on conflict (id) do update set name = excluded.name, address = excluded.address;

-- Miracle: Sat, Tue, Thu 17:00-20:00      Roma: Sun 13-19, Mon 17-20, Wed 13-19
insert into public.booking_hours (clinic_id, weekday, start_time, end_time) values
  ('miracle', 6, '17:00', '20:00'),
  ('miracle', 2, '17:00', '20:00'),
  ('miracle', 4, '17:00', '20:00'),
  ('roma',    0, '13:00', '19:00'),
  ('roma',    1, '17:00', '20:00'),
  ('roma',    3, '13:00', '19:00')
on conflict (clinic_id, weekday, start_time) do nothing;

insert into public.booking_categories (id, label, price_toman) values
  ('bird',         'پرندگان',                      900000),
  ('small_rodent', 'جوندگان کوچک',                 900000),
  ('small_mammal', 'پستانداران اگزوتیک کوچک',      1000000),
  ('turtle',       'لاک‌پشت‌ها',                   1100000),
  ('reptile',      'سایر خزندگان',                 1400000)
on conflict (id) do update set label = excluded.label, price_toman = excluded.price_toman;
