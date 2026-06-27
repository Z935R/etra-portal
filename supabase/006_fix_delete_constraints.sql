-- ═══════════════════════════════════════════════════════════════
-- ETRA Training Portal — Fix Delete Constraints
-- Migration 006
-- ═══════════════════════════════════════════════════════════════

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Dynamically drop all foreign keys referencing public.profiles(id)
    -- that don't have CASCADE or SET NULL (or just drop all and recreate them)
    -- To be safe, we will just alter the specific ones we know are causing issues.
    
    -- Drop constraints if they exist
    ALTER TABLE IF EXISTS public.assignment_submissions DROP CONSTRAINT IF EXISTS assignment_submissions_graded_by_fkey;
    ALTER TABLE IF EXISTS public.tickets DROP CONSTRAINT IF EXISTS tickets_assigned_to_fkey;
    ALTER TABLE IF EXISTS public.tickets DROP CONSTRAINT IF EXISTS tickets_created_by_fkey;
    ALTER TABLE IF EXISTS public.ticket_updates DROP CONSTRAINT IF EXISTS ticket_updates_author_id_fkey;
    ALTER TABLE IF EXISTS public.ticket_evaluations DROP CONSTRAINT IF EXISTS ticket_evaluations_trainee_id_fkey;
    ALTER TABLE IF EXISTS public.ticket_evaluations DROP CONSTRAINT IF EXISTS ticket_evaluations_admin_id_fkey;
    ALTER TABLE IF EXISTS public.attendance DROP CONSTRAINT IF EXISTS attendance_recorded_by_fkey;
    ALTER TABLE IF EXISTS public.announcements DROP CONSTRAINT IF EXISTS announcements_created_by_fkey;

    -- Make admin_id nullable so we can SET NULL
    ALTER TABLE public.ticket_evaluations ALTER COLUMN admin_id DROP NOT NULL;

    -- Re-add constraints with proper ON DELETE actions
    ALTER TABLE public.assignment_submissions 
        ADD CONSTRAINT assignment_submissions_graded_by_fkey 
        FOREIGN KEY (graded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

    ALTER TABLE public.tickets 
        ADD CONSTRAINT tickets_assigned_to_fkey 
        FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
        
    ALTER TABLE public.tickets 
        ADD CONSTRAINT tickets_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

    ALTER TABLE public.ticket_updates 
        ADD CONSTRAINT ticket_updates_author_id_fkey 
        FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    ALTER TABLE public.ticket_evaluations 
        ADD CONSTRAINT ticket_evaluations_trainee_id_fkey 
        FOREIGN KEY (trainee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    ALTER TABLE public.ticket_evaluations 
        ADD CONSTRAINT ticket_evaluations_admin_id_fkey 
        FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

    ALTER TABLE public.attendance 
        ADD CONSTRAINT attendance_recorded_by_fkey 
        FOREIGN KEY (recorded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

    ALTER TABLE public.announcements 
        ADD CONSTRAINT announcements_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

END $$;
