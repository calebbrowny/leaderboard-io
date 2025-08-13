-- Enums
create type if not exists public.metric_type as enum ('time','reps','distance','weight');
create type if not exists public.sort_direction as enum ('asc','desc');
create type if not exists public.gender as enum ('male','female','other');
create type if not exists public.submission_status as enum ('PENDING','APPROVED','REJECTED');
create type if not exists public.app_role as enum ('admin','moderator','user');

-- Roles table
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- Role helper function
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  );
$$;

-- Policies for user_roles (admins manage roles)
create policy if not exists "Admins can manage roles" on public.user_roles
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy if not exists "Profiles are viewable by everyone" on public.profiles
for select using (true);

create policy if not exists "Users can insert their own profile" on public.profiles
for insert to authenticated
with check (auth.uid() = id);

create policy if not exists "Users can update their own profile" on public.profiles
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Challenges table
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  month int not null,
  year int not null,
  description text not null,
  rules text not null,
  prizes text not null,
  metric_type public.metric_type not null,
  sort_direction public.sort_direction not null,
  unit text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_challenges_active on public.challenges(is_active);
alter table public.challenges enable row level security;

create policy if not exists "Challenges readable by all" on public.challenges
for select using (true);

create policy if not exists "Challenges admin write" on public.challenges
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Submissions table
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid,
  full_name text not null,
  email text not null,
  gender public.gender not null,
  value_raw bigint not null,
  value_display text not null,
  proof_url text,
  notes text,
  status public.submission_status not null default 'PENDING',
  submitted_at timestamptz not null default now(),
  approved_at timestamptz,
  created_ip text
);
create index if not exists idx_submissions_challenge on public.submissions(challenge_id);
create index if not exists idx_submissions_status on public.submissions(status);
create index if not exists idx_submissions_gender on public.submissions(gender);
alter table public.submissions enable row level security;

create policy if not exists "Public can view approved submissions" on public.submissions
for select using (status = 'APPROVED');

create policy if not exists "Users can view their own submissions" on public.submissions
for select to authenticated
using (auth.uid() = user_id);

create policy if not exists "Authenticated can create submissions for self" on public.submissions
for insert to authenticated
with check (auth.uid() = user_id);

create policy if not exists "Admins can manage submissions" on public.submissions
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Leaderboards (user-created)
create table if not exists public.leaderboards (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  slug text not null unique,
  title text not null,
  description text,
  rules text,
  custom_domain text unique,
  metric_type public.metric_type not null,
  sort_direction public.sort_direction not null,
  unit text,
  created_at timestamptz not null default now()
);
-- Enforce single leaderboard per user for now (free tier)
create unique index if not exists uniq_leaderboards_owner on public.leaderboards(owner_user_id);

alter table public.leaderboards enable row level security;
create policy if not exists "Leaderboards are publicly viewable" on public.leaderboards
for select using (true);
create policy if not exists "Owner can insert their leaderboard" on public.leaderboards
for insert to authenticated with check (auth.uid() = owner_user_id);
create policy if not exists "Owner or admin can update their leaderboard" on public.leaderboards
for update to authenticated using (auth.uid() = owner_user_id or public.has_role(auth.uid(),'admin'))
with check (auth.uid() = owner_user_id or public.has_role(auth.uid(),'admin'));
create policy if not exists "Owner or admin can delete their leaderboard" on public.leaderboards
for delete to authenticated using (auth.uid() = owner_user_id or public.has_role(auth.uid(),'admin'));

-- Subscribers for Stripe
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text not null unique,
  stripe_customer_id text,
  subscribed boolean not null default false,
  subscription_tier text,
  subscription_end timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.subscribers enable row level security;

create policy if not exists "select_own_subscription" on public.subscribers
for select to authenticated using (user_id = auth.uid() or email = auth.email());
create policy if not exists "update_own_subscription" on public.subscribers
for update to authenticated using (user_id = auth.uid() or email = auth.email())
with check (user_id = auth.uid() or email = auth.email());
create policy if not exists "insert_subscription" on public.subscribers
for insert to authenticated with check (true);

-- Storage bucket for proofs
insert into storage.buckets (id, name, public)
values ('proofs','proofs', true)
on conflict (id) do nothing;

-- Storage policies
create policy if not exists "Public can read proofs" on storage.objects
for select using (bucket_id = 'proofs');

create policy if not exists "Users can upload to their folder" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'proofs' and
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy if not exists "Users can update/delete their own files or admins" on storage.objects
for update to authenticated using (
  bucket_id = 'proofs' and (
    auth.uid()::text = (storage.foldername(name))[1] or public.has_role(auth.uid(),'admin')
  )
) with check (
  bucket_id = 'proofs' and (
    auth.uid()::text = (storage.foldername(name))[1] or public.has_role(auth.uid(),'admin')
  )
);

create policy if not exists "Users can delete their own files or admins" on storage.objects
for delete to authenticated using (
  bucket_id = 'proofs' and (
    auth.uid()::text = (storage.foldername(name))[1] or public.has_role(auth.uid(),'admin')
  )
);

-- Realtime for submissions
alter table public.submissions replica identity full;
-- Add to realtime publication (if not already)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
  END IF;
END$$;