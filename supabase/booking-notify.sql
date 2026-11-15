-- =====================================================================
-- Telegram notification for new / cancelled appointments.
-- Run AFTER supabase/booking.sql. Safe to re-run.
--
-- A trigger on booking_appointments posts a message to the Telegram Bot API (through pg_net).
-- The bot token + chat id are NOT stored in this repo: after running this file, save them once with
--
--   insert into private.booking_settings (key, value) values
--     ('telegram_bot_token', '<token from @BotFather>'),
--     ('telegram_chat_id',   '<your numeric chat id>')
--   on conflict (key) do update set value = excluded.value;
--
-- The private schema is not exposed by the Supabase API; anon/authenticated have no access to it.
-- Notifications are sent only for changes made by patients (anon role) or from the SQL editor.
-- Changes made by the admin in /appointments-admin (authenticated role) do not notify.
-- The trigger can never make a booking fail: any error inside it is swallowed.
-- =====================================================================

create extension if not exists pg_net with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.booking_settings (
  key   text primary key,
  value text not null
);
alter table private.booking_settings enable row level security;
revoke all on private.booking_settings from public, anon, authenticated;

-- "شنبه ۲۳ آبان ۱۴۰۵" for a Gregorian date (same algorithm the site uses for display)
create or replace function private.booking_jalali(d date)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  gy int := extract(year from d)::int;
  gm int := extract(month from d)::int;
  gd int := extract(day from d)::int;
  g_d_m int[] := array[0,31,59,90,120,151,181,212,243,273,304,334];
  months text[] := array['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  weekdays text[] := array['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'];
  gy2 int;
  days int;
  jy int;
  jm int;
  jd int;
begin
  gy2 := case when gm > 2 then gy + 1 else gy end;
  days := 355666 + (365 * gy) + ((gy2 + 3) / 4) - ((gy2 + 99) / 100) + ((gy2 + 399) / 400) + gd + g_d_m[gm];
  jy := -1595 + (33 * (days / 12053));
  days := days % 12053;
  jy := jy + (4 * (days / 1461));
  days := days % 1461;
  if days > 365 then
    jy := jy + ((days - 1) / 365);
    days := (days - 1) % 365;
  end if;
  if days < 186 then
    jm := 1 + (days / 31);
    jd := 1 + (days % 31);
  else
    jm := 7 + ((days - 186) / 30);
    jd := 1 + ((days - 186) % 30);
  end if;
  return weekdays[extract(dow from d)::int + 1] || ' ' || jd || ' ' || months[jm] || ' ' || jy;
end;
$$;

create or replace function private.booking_notify()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_token  text;
  v_chat   text;
  v_role   text;
  v_title  text;
  v_clinic text;
  v_cat    text;
  v_msg    text;
begin
  begin
    -- skip changes made by the signed-in admin through the panel
    v_role := coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb) ->> 'role', '');
    if v_role = 'authenticated' then
      return null;
    end if;

    select value into v_token from private.booking_settings where key = 'telegram_bot_token';
    select value into v_chat  from private.booking_settings where key = 'telegram_chat_id';
    if v_token is null or v_chat is null then
      return null;
    end if;

    v_title := case when tg_op = 'INSERT' then '🗓 نوبت جدید' else '❌ نوبت لغو شد' end;
    select name  into v_clinic from public.booking_clinics   where id = new.clinic_id;
    select label into v_cat    from public.booking_categories where id = new.category_id;

    v_msg := v_title || E'\n'
      || 'کلینیک: ' || coalesce(v_clinic, new.clinic_id) || E'\n'
      || 'زمان: ' || private.booking_jalali(new.appt_date) || ' — ساعت ' || to_char(new.start_time, 'HH24:MI') || E'\n'
      || 'نام: ' || new.owner_name || E'\n'
      || 'موبایل: ' || new.phone || E'\n'
      || 'حیوان: ' || coalesce(v_cat, '-')
         || coalesce(' — ' || new.pet_species, '') || coalesce(' (' || new.pet_name || ')', '') || E'\n'
      || 'هزینه ویزیت کامل: ' || coalesce(replace(to_char(new.price_toman, 'FM999G999G999'), ',', '٬') || ' تومان', '-')
      || case when new.reason is not null then E'\nعلت مراجعه: ' || new.reason else '' end
      || E'\nکد: ' || new.manage_code;

    -- Persian digits for everything except the phone number and tracking code lines
    v_msg := translate(v_msg, '0123456789', '۰۱۲۳۴۵۶۷۸۹');
    v_msg := regexp_replace(v_msg, 'موبایل: [۰-۹]+', 'موبایل: ' || new.phone);
    v_msg := regexp_replace(v_msg, 'کد: [^[:space:]]+$', 'کد: ' || new.manage_code);

    perform net.http_post(
      url     := 'https://api.telegram.org/bot' || v_token || '/sendMessage',
      body    := jsonb_build_object('chat_id', v_chat, 'text', v_msg, 'disable_web_page_preview', true),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  exception when others then
    null; -- a notification problem must never break a booking
  end;
  return null;
end;
$$;

revoke all on function private.booking_notify() from public, anon, authenticated;
revoke all on function private.booking_jalali(date) from public, anon, authenticated;

drop trigger if exists booking_notify_insert on public.booking_appointments;
create trigger booking_notify_insert
  after insert on public.booking_appointments
  for each row when (new.status = 'confirmed')
  execute function private.booking_notify();

drop trigger if exists booking_notify_cancel on public.booking_appointments;
create trigger booking_notify_cancel
  after update of status on public.booking_appointments
  for each row when (old.status = 'confirmed' and new.status = 'cancelled')
  execute function private.booking_notify();
