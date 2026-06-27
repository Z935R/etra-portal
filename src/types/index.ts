// ═══════════════════════════════════════════════════════════════════
// All TypeScript types for ETRA Training Portal
// ═══════════════════════════════════════════════════════════════════

// ── Auth & Users ─────────────────────────────────────────────────
export type UserRole = 'admin' | 'trainee';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// ── Training Content ─────────────────────────────────────────────
export interface TrainingWeek {
  id: string;
  week_number: number;
  title_ar: string;
  title_en: string;
  description_ar?: string;
  is_locked: boolean;
  unlock_date?: string;
  created_at: string;
}

export interface Module {
  id: string;
  week_id: string;
  title_ar: string;
  title_en: string;
  description_ar?: string;
  order_index: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title_ar: string;
  title_en: string;
  content_ar?: string;
  video_url?: string;
  duration_minutes?: number;
  order_index: number;
  is_published: boolean;
  objectives_ar?: string;
  practical_activity_ar?: string;
  created_at: string;
}

export interface LessonProgress {
  id: string;
  trainee_id: string;
  lesson_id: string;
  is_completed: boolean;
  completed_at?: string;
  time_spent_minutes?: number;
}

// ── Quizzes ───────────────────────────────────────────────────────
export type QuestionType = 'mcq' | 'scenario' | 'truefalse' | 'ordering';

export interface Quiz {
  id: string;
  module_id: string;
  title_ar: string;
  passing_score: number;
  time_limit_minutes?: number;
  max_attempts: number;
  is_randomized: boolean;
  show_feedback: boolean;
  is_published: boolean;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text_ar: string;
  question_type: QuestionType;
  scenario_context_ar?: string;
  points: number;
  order_index: number;
  options?: QuizOption[];
}

export interface QuizOption {
  id: string;
  question_id: string;
  option_text_ar: string;
  is_correct: boolean;
  explanation_ar?: string;
  order_index: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  trainee_id: string;
  score: number;
  passed: boolean;
  started_at: string;
  completed_at?: string;
  attempt_number: number;
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id?: string;
  is_correct: boolean;
  points_earned: number;
}

// ── Assignments ───────────────────────────────────────────────────
export type SubmissionType = 'text' | 'file' | 'both';
export type SubmissionStatus = 'draft' | 'submitted' | 'graded' | 'resubmit';

export interface Assignment {
  id: string;
  week_id: string;
  title_ar: string;
  instructions_ar: string;
  due_date?: string;
  max_score: number;
  submission_type: SubmissionType;
  is_published: boolean;
  created_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  trainee_id: string;
  text_content?: string;
  file_url?: string;
  submitted_at?: string;
  status: SubmissionStatus;
  grade?: number;
  feedback_ar?: string;
  graded_at?: string;
  graded_by?: string;
}

// ── Tickets ───────────────────────────────────────────────────────
export type TicketCategory =
  | 'hardware' | 'software' | 'windows' | 'network'
  | 'printer' | 'account' | 'password' | 'other';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export type TicketStatus =
  | 'new' | 'assigned' | 'analyzing' | 'waiting'
  | 'resolved' | 'closed' | 'reopened';

export type UpdateType =
  | 'status_change' | 'note' | 'diagnosis' | 'resolution'
  | 'feedback' | 'assignment';

export interface Ticket {
  id: string;
  ticket_number: number;
  title_ar: string;
  description_ar: string;
  requester_name: string;
  requester_department?: string;
  device_name?: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to?: string;
  created_by?: string;
  due_date?: string;
  resolved_at?: string;
  // Admin-only hidden fields:
  expected_diagnosis_ar?: string;
  expected_steps_ar?: string;
  expected_resolution_ar?: string;
  grading_rubric_ar?: string;
  created_at: string;
  updated_at: string;
  // Joins:
  assigned_profile?: Profile;
  created_profile?: Profile;
}

export interface TicketUpdate {
  id: string;
  ticket_id: string;
  author_id: string;
  update_type: UpdateType;
  content_ar: string;
  is_internal: boolean;
  old_status?: TicketStatus;
  new_status?: TicketStatus;
  created_at: string;
  author?: Profile;
}

export interface TicketEvaluation {
  id: string;
  ticket_id: string;
  trainee_id: string;
  admin_id: string;
  diagnosis_score: number;
  steps_score: number;
  resolution_score: number;
  total_score: number;
  feedback_ar?: string;
  evaluated_at: string;
}

// ── Attendance ────────────────────────────────────────────────────
export type SessionType = 'remote' | 'inperson';
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

export interface Attendance {
  id: string;
  trainee_id: string;
  date: string;
  week_number: number;
  session_type: SessionType;
  status: AttendanceStatus;
  notes?: string;
  recorded_by?: string;
  trainee?: Profile;
}

// ── Announcements ─────────────────────────────────────────────────
export type AnnouncementType = 'normal' | 'important' | 'urgent';

export interface Announcement {
  id: string;
  title_ar: string;
  content_ar: string;
  type: AnnouncementType;
  created_by?: string;
  published_at?: string;
  expires_at?: string;
  is_published: boolean;
  author?: Profile;
}

// ── Grades ────────────────────────────────────────────────────────
export interface Grade {
  id: string;
  trainee_id: string;
  week_number: number;
  lessons_score: number;
  quizzes_score: number;
  assignments_score: number;
  tickets_score: number;
  attendance_score: number;
  total_score: number;
  calculated_at: string;
  notes_ar?: string;
  trainee?: Profile;
}

// ── Notifications ─────────────────────────────────────────────────
export interface Notification {
  id: string;
  user_id: string;
  title_ar: string;
  message_ar: string;
  type: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

// ── Dashboard stats ───────────────────────────────────────────────
export interface TraineeDashboardStats {
  completedLessons: number;
  totalLessons: number;
  pendingAssignments: number;
  openTickets: number;
  averageQuizScore: number;
  overallProgress: number;
}

export interface AdminDashboardStats {
  activeTrainees: number;
  averageCompletion: number;
  openTickets: number;
  resolvedTickets: number;
  pendingAssignments: number;
}

// ── Simulator types ───────────────────────────────────────────────
export interface NetworkDevice {
  id: string;
  type: 'pc' | 'switch' | 'router';
  label: string;
  x: number;
  y: number;
  ip?: string;
  subnet?: string;
  gateway?: string;
}

export interface NetworkConnection {
  id: string;
  fromId: string;
  toId: string;
}

export interface HardwareComponent {
  id: string;
  nameAr: string;
  nameEn: string;
  purposeAr: string;
  icon: string;
  commonProblemsAr: string[];
}
