-- ═══════════════════════════════════════════════════════════════
-- ETRA Training Portal — Security Hardening (Audit Fixes)
-- Migration 005
-- ═══════════════════════════════════════════════════════════════

-- 1. Prevent Profile Role Escalation
CREATE OR REPLACE FUNCTION public.check_profile_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF public.get_user_role() != 'admin' THEN
            NEW.role = OLD.role;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_role_escalation ON public.profiles;
CREATE TRIGGER prevent_role_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.check_profile_role_escalation();

-- 2. Prevent Assignment Grade Tampering
CREATE OR REPLACE FUNCTION public.check_assignment_tampering()
RETURNS TRIGGER AS $$
BEGIN
    IF public.get_user_role() != 'admin' THEN
        NEW.grade = OLD.grade;
        NEW.graded_at = OLD.graded_at;
        NEW.graded_by = OLD.graded_by;
        NEW.feedback_ar = OLD.feedback_ar;
        
        IF NEW.status = 'graded' AND OLD.status != 'graded' THEN
            NEW.status = OLD.status;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_assignment_tampering ON public.assignment_submissions;
CREATE TRIGGER prevent_assignment_tampering
BEFORE UPDATE ON public.assignment_submissions
FOR EACH ROW EXECUTE FUNCTION public.check_assignment_tampering();

-- 3. Secure Quiz Answers (Auto-grade based on DB options)
CREATE OR REPLACE FUNCTION public.secure_quiz_answers()
RETURNS TRIGGER AS $$
DECLARE
    v_is_correct BOOLEAN;
    v_points NUMERIC;
BEGIN
    IF NEW.selected_option_id IS NOT NULL THEN
        SELECT is_correct INTO v_is_correct
        FROM public.quiz_options
        WHERE id = NEW.selected_option_id;

        IF v_is_correct THEN
            SELECT points INTO v_points
            FROM public.quiz_questions
            WHERE id = NEW.question_id;
            
            NEW.is_correct = TRUE;
            NEW.points_earned = COALESCE(v_points, 0);
        ELSE
            NEW.is_correct = FALSE;
            NEW.points_earned = 0;
        END IF;
    ELSE
        NEW.is_correct = FALSE;
        NEW.points_earned = 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_quiz_answer_tampering ON public.quiz_answers;
CREATE TRIGGER prevent_quiz_answer_tampering
BEFORE INSERT OR UPDATE ON public.quiz_answers
FOR EACH ROW EXECUTE FUNCTION public.secure_quiz_answers();

-- 4. Secure Quiz Attempts (Auto-calculate score based on real DB answers)
CREATE OR REPLACE FUNCTION public.secure_quiz_attempts()
RETURNS TRIGGER AS $$
DECLARE
    v_total_earned NUMERIC;
    v_total_points NUMERIC;
    v_passing_score INTEGER;
    v_quiz_id UUID;
BEGIN
    IF NEW.completed_at IS NOT NULL THEN
        v_quiz_id := NEW.quiz_id;

        SELECT passing_score INTO v_passing_score FROM public.quizzes WHERE id = v_quiz_id;

        SELECT COALESCE(SUM(points_earned), 0) INTO v_total_earned
        FROM public.quiz_answers
        WHERE attempt_id = NEW.id;

        SELECT COALESCE(SUM(points), 0) INTO v_total_points
        FROM public.quiz_questions
        WHERE quiz_id = v_quiz_id;

        IF v_total_points > 0 THEN
            NEW.score = ROUND((v_total_earned / v_total_points) * 100);
        ELSE
            NEW.score = 0;
        END IF;

        NEW.passed = (NEW.score >= COALESCE(v_passing_score, 0));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_quiz_attempt_tampering ON public.quiz_attempts;
CREATE TRIGGER prevent_quiz_attempt_tampering
BEFORE UPDATE ON public.quiz_attempts
FOR EACH ROW EXECUTE FUNCTION public.secure_quiz_attempts();

-- 5. Secure Tickets (Prevent tampering with critical fields)
CREATE OR REPLACE FUNCTION public.check_ticket_tampering()
RETURNS TRIGGER AS $$
BEGIN
    IF public.get_user_role() != 'admin' THEN
        NEW.ticket_number = OLD.ticket_number;
        NEW.title_ar = OLD.title_ar;
        NEW.description_ar = OLD.description_ar;
        NEW.category = OLD.category;
        NEW.priority = OLD.priority;
        NEW.created_by = OLD.created_by;
        NEW.assigned_to = OLD.assigned_to;
        NEW.sla_deadline = OLD.sla_deadline;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_ticket_tampering ON public.tickets;
CREATE TRIGGER prevent_ticket_tampering
BEFORE UPDATE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.check_ticket_tampering();
