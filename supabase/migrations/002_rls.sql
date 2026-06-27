-- ═══════════════════════════════════════════════════════════════
-- ETRA Training Portal — Row Level Security Policies
-- Migration 002: RLS policies
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_weeks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_updates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_evaluations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;

-- Helper function to get role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── profiles ─────────────────────────────────────────────────────
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "profiles_insert_admin" ON public.profiles
  FOR INSERT WITH CHECK (public.get_user_role() = 'admin' OR auth.uid() = id);

-- ── training_weeks ───────────────────────────────────────────────
CREATE POLICY "weeks_select_all" ON public.training_weeks
  FOR SELECT USING (NOT is_locked OR public.get_user_role() = 'admin');

CREATE POLICY "weeks_admin_all" ON public.training_weeks
  FOR ALL USING (public.get_user_role() = 'admin');

-- ── modules ──────────────────────────────────────────────────────
CREATE POLICY "modules_select_all" ON public.modules
  FOR SELECT USING (TRUE);

CREATE POLICY "modules_admin_all" ON public.modules
  FOR ALL USING (public.get_user_role() = 'admin');

-- ── lessons ──────────────────────────────────────────────────────
CREATE POLICY "lessons_select_published" ON public.lessons
  FOR SELECT USING (is_published = TRUE OR public.get_user_role() = 'admin');

CREATE POLICY "lessons_admin_all" ON public.lessons
  FOR ALL USING (public.get_user_role() = 'admin');

-- ── lesson_progress ──────────────────────────────────────────────
CREATE POLICY "progress_select_own" ON public.lesson_progress
  FOR SELECT USING (trainee_id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "progress_insert_own" ON public.lesson_progress
  FOR INSERT WITH CHECK (trainee_id = auth.uid());

CREATE POLICY "progress_update_own" ON public.lesson_progress
  FOR UPDATE USING (trainee_id = auth.uid() OR public.get_user_role() = 'admin');

-- ── quizzes ──────────────────────────────────────────────────────
CREATE POLICY "quizzes_select_published" ON public.quizzes
  FOR SELECT USING (is_published = TRUE OR public.get_user_role() = 'admin');

CREATE POLICY "quizzes_admin_all" ON public.quizzes
  FOR ALL USING (public.get_user_role() = 'admin');

-- ── quiz_questions ───────────────────────────────────────────────
CREATE POLICY "questions_select_all" ON public.quiz_questions
  FOR SELECT USING (TRUE);

CREATE POLICY "questions_admin_all" ON public.quiz_questions
  FOR ALL USING (public.get_user_role() = 'admin');

-- ── quiz_options ─────────────────────────────────────────────────
CREATE POLICY "options_select_all" ON public.quiz_options
  FOR SELECT USING (TRUE);

CREATE POLICY "options_admin_all" ON public.quiz_options
  FOR ALL USING (public.get_user_role() = 'admin');

-- ── quiz_attempts ────────────────────────────────────────────────
CREATE POLICY "attempts_select_own" ON public.quiz_attempts
  FOR SELECT USING (trainee_id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "attempts_insert_own" ON public.quiz_attempts
  FOR INSERT WITH CHECK (trainee_id = auth.uid());

CREATE POLICY "attempts_update_own" ON public.quiz_attempts
  FOR UPDATE USING (trainee_id = auth.uid() OR public.get_user_role() = 'admin');

-- ── quiz_answers ─────────────────────────────────────────────────
CREATE POLICY "answers_select_own" ON public.quiz_answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.quiz_attempts a WHERE a.id = attempt_id AND (a.trainee_id = auth.uid() OR public.get_user_role() = 'admin'))
  );

CREATE POLICY "answers_insert_own" ON public.quiz_answers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.quiz_attempts a WHERE a.id = attempt_id AND a.trainee_id = auth.uid())
  );

-- ── assignments ──────────────────────────────────────────────────
CREATE POLICY "assignments_select_published" ON public.assignments
  FOR SELECT USING (is_published = TRUE OR public.get_user_role() = 'admin');

CREATE POLICY "assignments_admin_all" ON public.assignments
  FOR ALL USING (public.get_user_role() = 'admin');

-- ── assignment_submissions ───────────────────────────────────────
CREATE POLICY "subs_select_own" ON public.assignment_submissions
  FOR SELECT USING (trainee_id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "subs_insert_own" ON public.assignment_submissions
  FOR INSERT WITH CHECK (trainee_id = auth.uid());

CREATE POLICY "subs_update_own" ON public.assignment_submissions
  FOR UPDATE USING (trainee_id = auth.uid() OR public.get_user_role() = 'admin');

-- ── tickets ──────────────────────────────────────────────────────
-- Trainees can see their own tickets (but not hidden fields)
CREATE POLICY "tickets_select_trainee" ON public.tickets
  FOR SELECT USING (
    assigned_to = auth.uid() OR created_by = auth.uid() OR public.get_user_role() = 'admin'
  );

CREATE POLICY "tickets_admin_all" ON public.tickets
  FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "tickets_update_trainee" ON public.tickets
  FOR UPDATE USING (assigned_to = auth.uid() OR public.get_user_role() = 'admin');

-- ── ticket_updates ───────────────────────────────────────────────
CREATE POLICY "updates_select" ON public.ticket_updates
  FOR SELECT USING (
    is_internal = FALSE AND (
      EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND (t.assigned_to = auth.uid() OR t.created_by = auth.uid()))
    ) OR public.get_user_role() = 'admin'
  );

CREATE POLICY "updates_insert_trainee" ON public.ticket_updates
  FOR INSERT WITH CHECK (
    is_internal = FALSE AND author_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.assigned_to = auth.uid())
    OR public.get_user_role() = 'admin'
  );

-- ── ticket_evaluations ───────────────────────────────────────────
CREATE POLICY "evals_select" ON public.ticket_evaluations
  FOR SELECT USING (trainee_id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "evals_admin_all" ON public.ticket_evaluations
  FOR ALL USING (public.get_user_role() = 'admin');

-- ── attendance ───────────────────────────────────────────────────
CREATE POLICY "attendance_select_own" ON public.attendance
  FOR SELECT USING (trainee_id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "attendance_admin_all" ON public.attendance
  FOR ALL USING (public.get_user_role() = 'admin');

-- ── announcements ────────────────────────────────────────────────
CREATE POLICY "ann_select_published" ON public.announcements
  FOR SELECT USING (is_published = TRUE OR public.get_user_role() = 'admin');

CREATE POLICY "ann_admin_all" ON public.announcements
  FOR ALL USING (public.get_user_role() = 'admin');

-- ── grades ───────────────────────────────────────────────────────
CREATE POLICY "grades_select_own" ON public.grades
  FOR SELECT USING (trainee_id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "grades_admin_all" ON public.grades
  FOR ALL USING (public.get_user_role() = 'admin');

-- ── notifications ────────────────────────────────────────────────
CREATE POLICY "notifs_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "notifs_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifs_admin_all" ON public.notifications
  FOR ALL USING (public.get_user_role() = 'admin');
