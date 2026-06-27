import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/config';

// Layouts
import { MainLayout } from '../layouts/MainLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { AuthLayout } from '../layouts/AuthLayout';

// Auth pages (eager loaded)
import { LoginPage } from '../pages/auth/LoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';

// Trainee pages (lazy)
const DashboardPage        = lazy(() => import('../pages/trainee/DashboardPage').then(m => ({ default: m.DashboardPage })));
const LearningPathPage     = lazy(() => import('../pages/trainee/LearningPathPage').then(m => ({ default: m.LearningPathPage })));
const LessonPage           = lazy(() => import('../pages/trainee/LessonPage').then(m => ({ default: m.LessonPage })));
const QuizListPage         = lazy(() => import('../pages/trainee/QuizListPage').then(m => ({ default: m.QuizListPage })));
const QuizAttemptPage      = lazy(() => import('../pages/trainee/QuizAttemptPage').then(m => ({ default: m.QuizAttemptPage })));
const AssignmentsPage      = lazy(() => import('../pages/trainee/AssignmentsPage').then(m => ({ default: m.AssignmentsPage })));
const TicketsPage          = lazy(() => import('../pages/trainee/TicketsPage').then(m => ({ default: m.TicketsPage })));
const TicketDetailPage     = lazy(() => import('../pages/trainee/TicketDetailPage').then(m => ({ default: m.TicketDetailPage })));
const GradesPage           = lazy(() => import('../pages/trainee/GradesPage').then(m => ({ default: m.GradesPage })));
const AttendancePage       = lazy(() => import('../pages/trainee/AttendancePage').then(m => ({ default: m.AttendancePage })));
const AnnouncementsPage    = lazy(() => import('../pages/trainee/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })));
const ProfilePage          = lazy(() => import('../pages/trainee/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SimulatorsPage       = lazy(() => import('../pages/trainee/SimulatorsPage').then(m => ({ default: m.SimulatorsPage })));

// Admin pages (lazy)
const AdminDashboardPage   = lazy(() => import('../pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const TraineesPage         = lazy(() => import('../pages/admin/TraineesPage').then(m => ({ default: m.TraineesPage })));
const ContentPage          = lazy(() => import('../pages/admin/ContentPage').then(m => ({ default: m.ContentPage })));
const TicketManagementPage = lazy(() => import('../pages/admin/TicketManagementPage').then(m => ({ default: m.TicketManagementPage })));
const TicketAdminDetail    = lazy(() => import('../pages/admin/TicketAdminDetail').then(m => ({ default: m.TicketAdminDetail })));
const AttendanceMgmtPage   = lazy(() => import('../pages/admin/AttendanceMgmtPage').then(m => ({ default: m.AttendanceMgmtPage })));
const GradesMgmtPage       = lazy(() => import('../pages/admin/GradesMgmtPage').then(m => ({ default: m.GradesMgmtPage })));
const ReportsPage          = lazy(() => import('../pages/admin/ReportsPage').then(m => ({ default: m.ReportsPage })));
const AdminAnnouncementsPage = lazy(() => import('../pages/admin/AdminAnnouncementsPage').then(m => ({ default: m.AdminAnnouncementsPage })));
const AdminSettingsPage    = lazy(() => import('../pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));
const QuizzesMgmtPage      = lazy(() => import('../pages/admin/QuizzesMgmtPage').then(m => ({ default: m.QuizzesMgmtPage })));
const AssignmentsMgmtPage  = lazy(() => import('../pages/admin/AssignmentsMgmtPage').then(m => ({ default: m.AssignmentsMgmtPage })));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
  </div>
);

function RootRedirect() {
  const { profile, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!profile) return <Navigate to={ROUTES.login} replace />;
  if (profile.role === 'admin') return <Navigate to={ROUTES.adminDashboard} replace />;
  return <Navigate to={ROUTES.dashboard} replace />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
        </Route>

        {/* Trainee routes */}
        <Route element={
          <ProtectedRoute requiredRole="trainee">
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path={ROUTES.dashboard}      element={<DashboardPage />} />
          <Route path={ROUTES.learning}       element={<LearningPathPage />} />
          <Route path="/learning/lesson/:lessonId" element={<LessonPage />} />
          <Route path={ROUTES.quizzes}        element={<QuizListPage />} />
          <Route path="/quizzes/:quizId"      element={<QuizAttemptPage />} />
          <Route path={ROUTES.assignments}    element={<AssignmentsPage />} />
          <Route path={ROUTES.tickets}        element={<TicketsPage />} />
          <Route path="/tickets/:ticketId"    element={<TicketDetailPage />} />
          <Route path={ROUTES.grades}         element={<GradesPage />} />
          <Route path={ROUTES.attendancePage} element={<AttendancePage />} />
          <Route path={ROUTES.announcements}  element={<AnnouncementsPage />} />
          <Route path={ROUTES.profile}        element={<ProfilePage />} />
          <Route path="/simulators"           element={<SimulatorsPage />} />
        </Route>

        {/* Admin routes */}
        <Route element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path={ROUTES.adminDashboard}       element={<AdminDashboardPage />} />
          <Route path={ROUTES.adminTrainees}        element={<TraineesPage />} />
          <Route path={ROUTES.adminContent}         element={<ContentPage />} />
          <Route path="/admin/quizzes"              element={<QuizzesMgmtPage />} />
          <Route path="/admin/assignments"          element={<AssignmentsMgmtPage />} />
          <Route path={ROUTES.adminTickets}         element={<TicketManagementPage />} />
          <Route path="/admin/tickets/:ticketId"    element={<TicketAdminDetail />} />
          <Route path={ROUTES.adminAttendance}      element={<AttendanceMgmtPage />} />
          <Route path={ROUTES.adminGrades}          element={<GradesMgmtPage />} />
          <Route path={ROUTES.adminReports}         element={<ReportsPage />} />
          <Route path={ROUTES.adminAnnouncements}   element={<AdminAnnouncementsPage />} />
          <Route path={ROUTES.adminSettings}        element={<AdminSettingsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
