-- ═══════════════════════════════════════════════════════════════
-- ETRA Training Portal — Functions & Triggers
-- Migration 003
-- ═══════════════════════════════════════════════════════════════

-- Auto-create profile on auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'trainee')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to calculate grade totals
CREATE OR REPLACE FUNCTION public.calculate_grade(
  p_lessons      NUMERIC,
  p_quizzes      NUMERIC,
  p_assignments  NUMERIC,
  p_tickets      NUMERIC,
  p_attendance   NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  RETURN ROUND(
    p_lessons     * 0.15 +
    p_quizzes     * 0.25 +
    p_assignments * 0.25 +
    p_tickets     * 0.25 +
    p_attendance  * 0.10,
    2
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Realtime: enable for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
