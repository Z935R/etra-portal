// App-wide configuration constants

export const CONFIG = {
  app: {
    name: 'ETRA Training Portal',
    nameAr: 'منصة إترا للتدريب التقني',
    version: '1.0.0',
  },

  // Grade weights
  gradeWeights: {
    lessons: 0.15,
    quizzes: 0.25,
    assignments: 0.25,
    tickets: 0.25,
    attendance: 0.10,
  },

  // SLA in milliseconds
  sla: {
    critical: 1 * 60 * 60 * 1000,       // 1 hour
    high:     4 * 60 * 60 * 1000,       // 4 hours
    medium:   8 * 60 * 60 * 1000,       // 8 hours
    low:      24 * 60 * 60 * 1000,      // 24 hours
  },

  // SLA warning threshold (75%)
  slaWarningThreshold: 0.75,

  // Brand colors
  colors: {
    primary: '#7B5CC8',
    primaryDark: '#4B2D8F',
    primaryLight: '#9270ff',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  },

  // Pagination
  pageSize: 20,
  ticketPageSize: 15,

  // Quiz
  defaultPassingScore: 70,
  defaultMaxAttempts: 3,
};

export const ROUTES = {
  // Auth
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',

  // Trainee
  dashboard: '/dashboard',
  learning: '/learning',
  learningWeek: '/learning/:weekId',
  learningLesson: '/learning/lesson/:lessonId',
  quizzes: '/quizzes',
  quizAttempt: '/quizzes/:quizId',
  assignments: '/assignments',
  tickets: '/tickets',
  ticketDetail: '/tickets/:ticketId',
  grades: '/grades',
  attendancePage: '/attendance',
  announcements: '/announcements',
  profile: '/profile',

  // Admin
  adminDashboard: '/admin',
  adminTrainees: '/admin/trainees',
  adminContent: '/admin/content',
  adminQuizzes: '/admin/quizzes',
  adminAssignments: '/admin/assignments',
  adminTickets: '/admin/tickets',
  adminTicketDetail: '/admin/tickets/:ticketId',
  adminAttendance: '/admin/attendance',
  adminGrades: '/admin/grades',
  adminReports: '/admin/reports',
  adminAnnouncements: '/admin/announcements',
  adminSettings: '/admin/settings',
};
