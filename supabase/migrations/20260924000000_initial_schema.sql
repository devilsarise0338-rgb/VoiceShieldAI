-- ====================================================================
-- VoiceShield AI (SIH26104) - Supabase PostgreSQL Schema & Security Policies
-- Problem Statement: AI-Powered Real-Time Detection & Prevention of Voice Cloning
-- Target Project: VoiceShield AI (lqxlbghegajswpkldtmb)
-- ====================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Public user profiles tied to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'security_analyst' CHECK (role IN ('security_analyst', 'admin', 'incident_responder')),
  organization TEXT DEFAULT 'Cyber Defense Cell',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. SPEAKER PROFILES (Enrolled voice prints for identity verification)
CREATE TABLE IF NOT EXISTS public.speaker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  department TEXT,
  phone_number TEXT,
  enrollment_status TEXT NOT NULL DEFAULT 'pending' CHECK (enrollment_status IN ('enrolled', 'pending', 'failed', 'processing')),
  reference_audio_path TEXT,
  audio_duration_seconds NUMERIC(6, 2) DEFAULT 0,
  sample_rate_hz INTEGER DEFAULT 44100,
  voiceprint_hash TEXT,
  total_verifications INTEGER DEFAULT 0,
  last_verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. AUDIO ANALYSES (Core voice cloning detection records)
CREATE TABLE IF NOT EXISTS public.audio_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  speaker_profile_id UUID REFERENCES public.speaker_profiles(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('live_stream', 'audio_upload', 'telephony_stream', 'reference_sample')),
  file_name TEXT,
  file_path TEXT,
  duration_seconds NUMERIC(8, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  result_label TEXT CHECK (result_label IN ('authentic', 'suspicious', 'synthetic_clone', 'inconclusive')),
  risk_level TEXT CHECK (risk_level IN ('safe', 'low', 'medium', 'high', 'critical')),
  authenticity_score NUMERIC(5, 2), -- 0.00 to 100.00
  spoof_risk_score NUMERIC(5, 2), -- 0.00 to 100.00
  speaker_similarity_score NUMERIC(5, 2), -- 0.00 to 100.00
  model_confidence NUMERIC(5, 2), -- 0.00 to 100.00
  model_version TEXT DEFAULT 'VoiceShield-RawNet3-v2.4',
  spectral_artifacts JSONB DEFAULT '[]'::jsonb,
  explanation TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ
);

-- 4. DETECTION EVENTS (Timeline of acoustic anomalies detected within an analysis)
CREATE TABLE IF NOT EXISTS public.detection_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.audio_analyses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('acoustic_anomaly', 'pitch_inflection_loss', 'phase_discontinuity', 'speaker_mismatch', 'waveform_slice')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('safe', 'low', 'medium', 'high', 'critical')),
  confidence NUMERIC(5, 2) NOT NULL,
  time_offset_ms INTEGER NOT NULL DEFAULT 0,
  details TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. ALERTS (Security threat notifications generated from suspicious detections)
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.audio_analyses(id) ON DELETE SET NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'under_review', 'resolved', 'dismissed')),
  source_type TEXT NOT NULL DEFAULT 'live_stream',
  target_identity TEXT,
  spoof_probability NUMERIC(5, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. INVESTIGATIONS (Forensic investigation cases for impersonation incidents)
CREATE TABLE IF NOT EXISTS public.investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id UUID REFERENCES public.alerts(id) ON DELETE SET NULL,
  analysis_id UUID REFERENCES public.audio_analyses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'escalated', 'resolved', 'closed')),
  assigned_to TEXT,
  detected_caller TEXT,
  target_individual TEXT,
  timeline_events JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. INVESTIGATION NOTES (Collaborative forensic notes)
CREATE TABLE IF NOT EXISTS public.investigation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. SECURITY REPORTS (Formal audit and verification summaries)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.audio_analyses(id) ON DELETE SET NULL,
  report_title TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('incident_forensic', 'speaker_audit', 'executive_summary')),
  classification_label TEXT NOT NULL,
  risk_assessment TEXT NOT NULL CHECK (risk_assessment IN ('safe', 'low', 'medium', 'high', 'critical')),
  confidence_score NUMERIC(5, 2) NOT NULL,
  evidence_summary TEXT NOT NULL,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. AUDIT LOGS (Immutable tracking of access and actions)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_audio_analyses_user_id ON public.audio_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_analyses_risk ON public.audio_analyses(risk_level);
CREATE INDEX IF NOT EXISTS idx_audio_analyses_created ON public.audio_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_status ON public.alerts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity);
CREATE INDEX IF NOT EXISTS idx_investigations_user ON public.investigations(user_id);
CREATE INDEX IF NOT EXISTS idx_speaker_profiles_user ON public.speaker_profiles(user_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict data isolation: Users can only view and modify their own records.
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detection_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Speaker Profiles: User ownership
CREATE POLICY "Users can view own speaker profiles" ON public.speaker_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own speaker profiles" ON public.speaker_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own speaker profiles" ON public.speaker_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own speaker profiles" ON public.speaker_profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Audio Analyses: User ownership
CREATE POLICY "Users can view own analyses" ON public.audio_analyses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON public.audio_analyses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses" ON public.audio_analyses
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Detection Events: Joined via analysis ownership
CREATE POLICY "Users can view detection events of own analyses" ON public.detection_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audio_analyses a
      WHERE a.id = detection_events.analysis_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert detection events for own analyses" ON public.detection_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audio_analyses a
      WHERE a.id = detection_events.analysis_id AND a.user_id = auth.uid()
    )
  );

-- Alerts: User ownership
CREATE POLICY "Users can view own alerts" ON public.alerts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.alerts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts" ON public.alerts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Investigations: User ownership
CREATE POLICY "Users can view own investigations" ON public.investigations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investigations" ON public.investigations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investigations" ON public.investigations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Investigation Notes: User ownership
CREATE POLICY "Users can view notes of accessible investigations" ON public.investigation_notes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.investigations inv
      WHERE inv.id = investigation_notes.investigation_id AND inv.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create notes on own investigations" ON public.investigation_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.investigations inv
      WHERE inv.id = investigation_notes.investigation_id AND inv.user_id = auth.uid()
    )
  );

-- Reports: User ownership
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Audit Logs: View own logs only
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ====================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- Whenever a user signs up via Supabase Auth, populate public.profiles
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'security_analyst'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- STORAGE BUCKET DEFINITIONS & POLICIES
-- Private buckets for sensitive voice biometrics and audio evidence
-- ====================================================================

-- Insert private storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('voice-reference-audio', 'voice-reference-audio', false),
  ('analysis-audio', 'analysis-audio', false),
  ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Users can only upload, read, update, and delete files in their own folder (folder name = user_id)
DROP POLICY IF EXISTS "User storage read access" ON storage.objects;
CREATE POLICY "User storage read access" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id IN ('voice-reference-audio', 'analysis-audio', 'reports') AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "User storage upload access" ON storage.objects;
CREATE POLICY "User storage upload access" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('voice-reference-audio', 'analysis-audio', 'reports') AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "User storage update access" ON storage.objects;
CREATE POLICY "User storage update access" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('voice-reference-audio', 'analysis-audio', 'reports') AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id IN ('voice-reference-audio', 'analysis-audio', 'reports') AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "User storage delete access" ON storage.objects;
CREATE POLICY "User storage delete access" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('voice-reference-audio', 'analysis-audio', 'reports') AND (auth.uid())::text = (storage.foldername(name))[1]);
