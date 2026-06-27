-- ═══════════════════════════════════════════════════════════════
-- ETRA Training Portal — Database Schema
-- Migration 001: Create all tables
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. profiles ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'trainee' CHECK (role IN ('admin', 'trainee')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. training_weeks ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_weeks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_number  INTEGER NOT NULL UNIQUE,
  title_ar     TEXT NOT NULL,
  title_en     TEXT,
  description_ar TEXT,
  is_locked    BOOLEAN NOT NULL DEFAULT FALSE,
  unlock_date  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. modules ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.modules (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_id      UUID NOT NULL REFERENCES public.training_weeks(id) ON DELETE CASCADE,
  title_ar     TEXT NOT NULL,
  title_en     TEXT,
  description_ar TEXT,
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. lessons ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lessons (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id            UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title_ar             TEXT NOT NULL,
  title_en             TEXT,
  content_ar           TEXT,
  video_url            TEXT,
  duration_minutes     INTEGER,
  order_index          INTEGER NOT NULL DEFAULT 0,
  is_published         BOOLEAN NOT NULL DEFAULT TRUE,
  objectives_ar        TEXT,
  practical_activity_ar TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. lesson_progress ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainee_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id          UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_completed       BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at       TIMESTAMPTZ,
  time_spent_minutes INTEGER,
  UNIQUE(trainee_id, lesson_id)
);

-- ── 6. quizzes ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quizzes (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id          UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title_ar           TEXT NOT NULL,
  passing_score      INTEGER NOT NULL DEFAULT 70,
  time_limit_minutes INTEGER DEFAULT 30,
  max_attempts       INTEGER NOT NULL DEFAULT 3,
  is_randomized      BOOLEAN NOT NULL DEFAULT FALSE,
  show_feedback      BOOLEAN NOT NULL DEFAULT TRUE,
  is_published       BOOLEAN NOT NULL DEFAULT TRUE
);

-- ── 7. quiz_questions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id             UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text_ar    TEXT NOT NULL,
  question_type       TEXT NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq','scenario','truefalse','ordering')),
  scenario_context_ar TEXT,
  points              INTEGER NOT NULL DEFAULT 5,
  order_index         INTEGER NOT NULL DEFAULT 0
);

-- ── 8. quiz_options ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_options (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id    UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text_ar TEXT NOT NULL,
  is_correct     BOOLEAN NOT NULL DEFAULT FALSE,
  explanation_ar TEXT,
  order_index    INTEGER NOT NULL DEFAULT 0
);

-- ── 9. quiz_attempts ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id        UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  trainee_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score          NUMERIC(5,2) NOT NULL DEFAULT 0,
  passed         BOOLEAN NOT NULL DEFAULT FALSE,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ,
  attempt_number INTEGER NOT NULL DEFAULT 1
);

-- ── 10. quiz_answers ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id        UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id       UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.quiz_options(id),
  is_correct        BOOLEAN NOT NULL DEFAULT FALSE,
  points_earned     NUMERIC(5,2) NOT NULL DEFAULT 0
);

-- ── 11. assignments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assignments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_id         UUID NOT NULL REFERENCES public.training_weeks(id) ON DELETE CASCADE,
  title_ar        TEXT NOT NULL,
  instructions_ar TEXT NOT NULL,
  due_date        TIMESTAMPTZ,
  max_score       INTEGER NOT NULL DEFAULT 100,
  submission_type TEXT NOT NULL DEFAULT 'text' CHECK (submission_type IN ('text','file','both')),
  is_published    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 12. assignment_submissions ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id  UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  trainee_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text_content   TEXT,
  file_url       TEXT,
  submitted_at   TIMESTAMPTZ,
  status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','graded','resubmit')),
  grade          NUMERIC(5,2),
  feedback_ar    TEXT,
  graded_at      TIMESTAMPTZ,
  graded_by      UUID REFERENCES public.profiles(id),
  UNIQUE(assignment_id, trainee_id)
);

-- ── 13. tickets ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tickets (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number          INTEGER NOT NULL UNIQUE,
  title_ar               TEXT NOT NULL,
  description_ar         TEXT NOT NULL,
  requester_name         TEXT,
  requester_department   TEXT,
  device_name            TEXT,
  category               TEXT NOT NULL CHECK (category IN ('hardware','software','windows','network','printer','account','password','other')),
  priority               TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status                 TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','assigned','analyzing','waiting','resolved','closed','reopened')),
  assigned_to            UUID REFERENCES public.profiles(id),
  created_by             UUID REFERENCES public.profiles(id),
  due_date               TIMESTAMPTZ,
  resolved_at            TIMESTAMPTZ,
  expected_diagnosis_ar  TEXT,
  expected_steps_ar      TEXT,
  expected_resolution_ar TEXT,
  grading_rubric_ar      TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-increment sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;

-- ── 14. ticket_updates ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ticket_updates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id   UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.profiles(id),
  update_type TEXT NOT NULL CHECK (update_type IN ('status_change','note','diagnosis','resolution','feedback','assignment')),
  content_ar  TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  old_status  TEXT,
  new_status  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 15. ticket_evaluations ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ticket_evaluations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id        UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  trainee_id       UUID NOT NULL REFERENCES public.profiles(id),
  admin_id         UUID NOT NULL REFERENCES public.profiles(id),
  diagnosis_score  INTEGER NOT NULL DEFAULT 0,
  steps_score      INTEGER NOT NULL DEFAULT 0,
  resolution_score INTEGER NOT NULL DEFAULT 0,
  total_score      INTEGER NOT NULL DEFAULT 0,
  feedback_ar      TEXT,
  evaluated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 16. attendance ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainee_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  week_number  INTEGER NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'inperson' CHECK (session_type IN ('remote','inperson')),
  status       TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','late','absent','excused')),
  notes        TEXT,
  recorded_by  UUID REFERENCES public.profiles(id),
  UNIQUE(trainee_id, date)
);

-- ── 17. announcements ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_ar     TEXT NOT NULL,
  content_ar   TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'normal' CHECK (type IN ('normal','important','urgent')),
  created_by   UUID REFERENCES public.profiles(id),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,
  is_published BOOLEAN NOT NULL DEFAULT TRUE
);

-- ── 18. grades ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grades (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainee_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_number        INTEGER NOT NULL,
  lessons_score      NUMERIC(5,2) NOT NULL DEFAULT 0,
  quizzes_score      NUMERIC(5,2) NOT NULL DEFAULT 0,
  assignments_score  NUMERIC(5,2) NOT NULL DEFAULT 0,
  tickets_score      NUMERIC(5,2) NOT NULL DEFAULT 0,
  attendance_score   NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_score        NUMERIC(5,2) NOT NULL DEFAULT 0,
  calculated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes_ar           TEXT,
  UNIQUE(trainee_id, week_number)
);

-- ── 19. notifications ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title_ar   TEXT NOT NULL,
  message_ar TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'info',
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  link       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_lessons_module         ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_trainee ON public.lesson_progress(trainee_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_trainee  ON public.quiz_attempts(trainee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned        ON public.tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_ticket_updates_ticket  ON public.ticket_updates(ticket_id);
CREATE INDEX IF NOT EXISTS idx_attendance_trainee     ON public.attendance(trainee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user     ON public.notifications(user_id);
