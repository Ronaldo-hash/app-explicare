-- ==============================================================================
-- MIGRATION: PROCESS HISTORY TRACKING
-- Run this in Supabase SQL Editor
-- ==============================================================================

-- 1. Create history table
CREATE TABLE IF NOT EXISTS public.process_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES public.videos_pecas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who made the change
  action TEXT NOT NULL, -- 'created', 'status_changed', 'responsible_changed', 'info_updated'
  details JSONB DEFAULT '{}'::jsonb, -- Store old/new values
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.process_history ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Admins/Members can view all history
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'process_history' AND policyname = 'Team can view all history') THEN
    CREATE POLICY "Team can view all history" 
    ON public.process_history FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'member')
      )
    );
  END IF;
END $$;

-- Clients can only view history of their own videos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'process_history' AND policyname = 'Clients can view own process history') THEN
    CREATE POLICY "Clients can view own process history" 
    ON public.process_history FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM public.videos_pecas 
        WHERE id = process_history.video_id 
        AND client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    );
  END IF;
END $$;

-- Allow system/functions to insert history
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'process_history' AND policyname = 'System can insert history') THEN
    CREATE POLICY "System can insert history" 
    ON public.process_history FOR INSERT 
    WITH CHECK (true);
  END IF;
END $$;

-- 4. Automate history tracking with Triggers (optional, but better for consistency)
-- This trigger logs changes to status and responsible_id automatically
CREATE OR REPLACE FUNCTION public.log_process_changes()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Attempt to get current user ID (might be null if triggered by system/edge function)
  current_user_id := auth.uid();

  -- Log Status Change
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.process_history (video_id, user_id, action, details)
    VALUES (NEW.id, current_user_id, 'status_changed', jsonb_build_object('old', OLD.status, 'new', NEW.status));
  END IF;

  -- Log Responsible Change
  IF (TG_OP = 'UPDATE' AND OLD.responsible_id IS DISTINCT FROM NEW.responsible_id) THEN
    INSERT INTO public.process_history (video_id, user_id, action, details)
    VALUES (NEW.id, current_user_id, 'responsible_changed', jsonb_build_object('old', OLD.responsible_id, 'new', NEW.responsible_id));
  END IF;
  
  -- Log Creation
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.process_history (video_id, user_id, action, details)
    VALUES (NEW.id, current_user_id, 'created', '{}'::jsonb);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS log_process_changes_trigger ON public.videos_pecas;
CREATE TRIGGER log_process_changes_trigger
AFTER INSERT OR UPDATE ON public.videos_pecas
FOR EACH ROW EXECUTE PROCEDURE public.log_process_changes();
