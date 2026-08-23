begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
begin
  if to_regclass('public.inquiries') is null then
    raise exception 'public.inquiries does not exist';
  end if;

  if to_regclass('public.inquiries_id_seq') is null then
    raise exception 'public.inquiries_id_seq does not exist';
  end if;
end
$$;

alter table public.inquiries enable row level security;

drop policy if exists "Allow public select"
  on public.inquiries;

drop policy if exists "Allow public insert"
  on public.inquiries;

revoke all privileges
  on table public.inquiries
  from anon;

revoke all privileges
  on sequence public.inquiries_id_seq
  from anon;

commit;
