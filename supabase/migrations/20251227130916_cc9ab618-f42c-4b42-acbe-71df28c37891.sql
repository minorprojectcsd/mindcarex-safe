
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('PATIENT', 'DOCTOR');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles table (id = auth.users.id, no separate user_id)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  specialization TEXT,
  license_number TEXT,
  primary_doctor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id),
  patient_id UUID NOT NULL REFERENCES auth.users(id),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Schedules table
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id),
  patient_id UUID NOT NULL REFERENCES auth.users(id),
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
  duration INTEGER DEFAULT 60,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Messages table (with sender_role)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_role app_role,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Emotion metrics table (Flask writes only)
CREATE TABLE public.emotion_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  emotion TEXT NOT NULL CHECK (emotion IN ('happy', 'sad', 'neutral', 'angry', 'stressed', 'fearful', 'surprised', 'disgusted')),
  confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Chat analysis table (Flask writes only)
CREATE TABLE public.chat_analysis (
  session_id UUID PRIMARY KEY REFERENCES public.sessions(id) ON DELETE CASCADE,
  sentiment TEXT,
  risk_score FLOAT CHECK (risk_score >= 0 AND risk_score <= 1),
  keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Session summaries table (Flask writes only)
CREATE TABLE public.session_summaries (
  session_id UUID PRIMARY KEY REFERENCES public.sessions(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Session emotion summary (aggregates for performance)
CREATE TABLE public.session_emotion_summary (
  session_id UUID PRIMARY KEY REFERENCES public.sessions(id) ON DELETE CASCADE,
  avg_happy FLOAT DEFAULT 0,
  avg_sad FLOAT DEFAULT 0,
  avg_neutral FLOAT DEFAULT 0,
  avg_angry FLOAT DEFAULT 0,
  avg_stressed FLOAT DEFAULT 0,
  avg_fearful FLOAT DEFAULT 0,
  avg_surprised FLOAT DEFAULT 0,
  avg_disgusted FLOAT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_messages_session_id ON public.messages(session_id);
CREATE INDEX idx_emotions_session_id ON public.emotion_metrics(session_id);
CREATE INDEX idx_sessions_doctor_id ON public.sessions(doctor_id);
CREATE INDEX idx_sessions_patient_id ON public.sessions(patient_id);
CREATE INDEX idx_schedules_doctor_id ON public.schedules(doctor_id);
CREATE INDEX idx_schedules_patient_id ON public.schedules(patient_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotion_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_emotion_summary ENABLE ROW LEVEL SECURITY;

-- USER_ROLES RLS
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- PROFILES RLS
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Doctors can view assigned patient profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'DOCTOR')
  AND primary_doctor_id = auth.uid()
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- SESSIONS RLS
CREATE POLICY "Session participants can view sessions"
ON public.sessions FOR SELECT
TO authenticated
USING (doctor_id = auth.uid() OR patient_id = auth.uid());

CREATE POLICY "Doctors can create sessions"
ON public.sessions FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'DOCTOR')
  AND doctor_id = auth.uid()
);

CREATE POLICY "Doctors can update their sessions"
ON public.sessions FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'DOCTOR')
  AND doctor_id = auth.uid()
);

-- SCHEDULES RLS
CREATE POLICY "Users can view their schedules"
ON public.schedules FOR SELECT
TO authenticated
USING (doctor_id = auth.uid() OR patient_id = auth.uid());

CREATE POLICY "Doctors can create schedules"
ON public.schedules FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'DOCTOR')
  AND doctor_id = auth.uid()
);

CREATE POLICY "Doctors can update their schedules"
ON public.schedules FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'DOCTOR')
  AND doctor_id = auth.uid()
);

CREATE POLICY "Doctors can delete their schedules"
ON public.schedules FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'DOCTOR')
  AND doctor_id = auth.uid()
);

-- MESSAGES RLS
CREATE POLICY "Session participants can view messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = session_id
    AND (s.doctor_id = auth.uid() OR s.patient_id = auth.uid())
  )
);

CREATE POLICY "Session participants can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = session_id
    AND (s.doctor_id = auth.uid() OR s.patient_id = auth.uid())
  )
);

-- AI DATA TABLES: SERVICE ROLE ONLY (Flask backend writes)
CREATE POLICY "Service role can insert emotion metrics"
ON public.emotion_metrics FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Session participants can view emotion metrics"
ON public.emotion_metrics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = session_id
    AND (s.doctor_id = auth.uid() OR s.patient_id = auth.uid())
  )
);

CREATE POLICY "Service role can insert chat analysis"
ON public.chat_analysis FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Session participants can view chat analysis"
ON public.chat_analysis FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = session_id
    AND (s.doctor_id = auth.uid() OR s.patient_id = auth.uid())
  )
);

CREATE POLICY "Service role can insert session summaries"
ON public.session_summaries FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Session participants can view session summaries"
ON public.session_summaries FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = session_id
    AND (s.doctor_id = auth.uid() OR s.patient_id = auth.uid())
  )
);

CREATE POLICY "Service role can manage emotion summary"
ON public.session_emotion_summary FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Session participants can view emotion summary"
ON public.session_emotion_summary FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = session_id
    AND (s.doctor_id = auth.uid() OR s.patient_id = auth.uid())
  )
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
