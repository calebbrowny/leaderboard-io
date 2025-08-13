-- Create enums safely
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'metric_type') THEN
    CREATE TYPE public.metric_type AS ENUM ('time','reps','distance','weight');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sort_direction') THEN
    CREATE TYPE public.sort_direction AS ENUM ('asc','desc');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender') THEN
    CREATE TYPE public.gender AS ENUM ('male','female','other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
    CREATE TYPE public.submission_status AS ENUM ('PENDING','APPROVED','REJECTED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
  END IF;
END $$;

-- Roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Role helper function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- Policies for user_roles (admins manage roles)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Admins can manage roles'
  ) THEN
    CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  month int NOT NULL,
  year int NOT NULL,
  description text NOT NULL,
  rules text NOT NULL,
  prizes text NOT NULL,
  metric_type public.metric_type NOT NULL,
  sort_direction public.sort_direction NOT NULL,
  unit text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON public.challenges(is_active);
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'challenges' AND policyname = 'Challenges readable by all'
  ) THEN
    CREATE POLICY "Challenges readable by all" ON public.challenges FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'challenges' AND policyname = 'Challenges admin write'
  ) THEN
    CREATE POLICY "Challenges admin write" ON public.challenges FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid,
  full_name text NOT NULL,
  email text NOT NULL,
  gender public.gender NOT NULL,
  value_raw bigint NOT NULL,
  value_display text NOT NULL,
  proof_url text,
  notes text,
  status public.submission_status NOT NULL DEFAULT 'PENDING',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  created_ip text
);
CREATE INDEX IF NOT EXISTS idx_submissions_challenge ON public.submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_gender ON public.submissions(gender);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'submissions' AND policyname = 'Public can view approved submissions'
  ) THEN
    CREATE POLICY "Public can view approved submissions" ON public.submissions FOR SELECT USING (status = 'APPROVED');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'submissions' AND policyname = 'Users can view their own submissions'
  ) THEN
    CREATE POLICY "Users can view their own submissions" ON public.submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'submissions' AND policyname = 'Authenticated can create submissions for self'
  ) THEN
    CREATE POLICY "Authenticated can create submissions for self" ON public.submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'submissions' AND policyname = 'Admins can manage submissions'
  ) THEN
    CREATE POLICY "Admins can manage submissions" ON public.submissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Leaderboards (user-created)
CREATE TABLE IF NOT EXISTS public.leaderboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  rules text,
  custom_domain text UNIQUE,
  metric_type public.metric_type NOT NULL,
  sort_direction public.sort_direction NOT NULL,
  unit text,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Enforce single leaderboard per user for now (free tier)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_leaderboards_owner ON public.leaderboards(owner_user_id);
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leaderboards' AND policyname = 'Leaderboards are publicly viewable'
  ) THEN
    CREATE POLICY "Leaderboards are publicly viewable" ON public.leaderboards FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leaderboards' AND policyname = 'Owner can insert their leaderboard'
  ) THEN
    CREATE POLICY "Owner can insert their leaderboard" ON public.leaderboards FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leaderboards' AND policyname = 'Owner or admin can update their leaderboard'
  ) THEN
    CREATE POLICY "Owner or admin can update their leaderboard" ON public.leaderboards FOR UPDATE TO authenticated USING (auth.uid() = owner_user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = owner_user_id OR public.has_role(auth.uid(),'admin'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leaderboards' AND policyname = 'Owner or admin can delete their leaderboard'
  ) THEN
    CREATE POLICY "Owner or admin can delete their leaderboard" ON public.leaderboards FOR DELETE TO authenticated USING (auth.uid() = owner_user_id OR public.has_role(auth.uid(),'admin'));
  END IF;
END $$;

-- Subscribers for Stripe
CREATE TABLE IF NOT EXISTS public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL UNIQUE,
  stripe_customer_id text,
  subscribed boolean NOT NULL DEFAULT false,
  subscription_tier text,
  subscription_end timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscribers' AND policyname = 'select_own_subscription'
  ) THEN
    CREATE POLICY "select_own_subscription" ON public.subscribers FOR SELECT TO authenticated USING (user_id = auth.uid() OR email = auth.email());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscribers' AND policyname = 'update_own_subscription'
  ) THEN
    CREATE POLICY "update_own_subscription" ON public.subscribers FOR UPDATE TO authenticated USING (user_id = auth.uid() OR email = auth.email()) WITH CHECK (user_id = auth.uid() OR email = auth.email());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscribers' AND policyname = 'insert_subscription'
  ) THEN
    CREATE POLICY "insert_subscription" ON public.subscribers FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- Storage bucket for proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('proofs','proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can read proofs'
  ) THEN
    CREATE POLICY "Public can read proofs" ON storage.objects FOR SELECT USING (bucket_id = 'proofs');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload to their folder'
  ) THEN
    CREATE POLICY "Users can upload to their folder" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update/delete their own files or admins'
  ) THEN
    CREATE POLICY "Users can update/delete their own files or admins" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'proofs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin'))) WITH CHECK (bucket_id = 'proofs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own files or admins'
  ) THEN
    CREATE POLICY "Users can delete their own files or admins" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'proofs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));
  END IF;
END $$;

-- Realtime for submissions
ALTER TABLE public.submissions REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
  END IF;
END $$;