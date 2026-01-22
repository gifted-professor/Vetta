create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  credits int not null default 20,
  role text not null default 'trial',
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

grant select on table public.profiles to authenticated;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.deduct_credits()
returns table (credits int, role text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.profiles p
  set credits = p.credits - 1,
      updated_at = now()
  where p.id = auth.uid()
    and p.credits > 0
  returning p.credits, p.role;
end;
$$;

revoke execute on function public.deduct_credits() from public;
grant execute on function public.deduct_credits() to authenticated;

insert into public.profiles (id)
select u.id
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
