import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, BookOpen, ClipboardList, FileText, Ticket,
  BarChart2, Calendar, Bell, User, Settings,
  Users, Package, Shield, TrendingUp, X, Megaphone,
  GraduationCap, Monitor
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AR } from '../../constants/arabic';
import { ROUTES } from '../../constants/config';
import type { UserRole } from '../../types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const traineeNav: NavItem[] = [
  { label: AR.navDashboard,     path: ROUTES.dashboard,      icon: Home },
  { label: AR.navLearning,      path: ROUTES.learning,       icon: BookOpen },
  { label: AR.navQuizzes,       path: ROUTES.quizzes,        icon: ClipboardList },
  { label: AR.navAssignments,   path: ROUTES.assignments,    icon: FileText },
  { label: AR.navTickets,       path: ROUTES.tickets,        icon: Ticket },
  { label: AR.navGrades,        path: ROUTES.grades,         icon: BarChart2 },
  { label: AR.navAttendance,    path: ROUTES.attendancePage, icon: Calendar },
  { label: AR.navAnnouncements, path: ROUTES.announcements,  icon: Bell },
  { label: 'المحاكيات',         path: '/simulators',          icon: Monitor },
  { label: AR.navProfile,       path: ROUTES.profile,        icon: User },
];

const adminNav: NavItem[] = [
  { label: AR.navAdminDashboard, path: ROUTES.adminDashboard,   icon: Home },
  { label: AR.navTrainees,       path: ROUTES.adminTrainees,    icon: Users },
  { label: AR.navContent,        path: ROUTES.adminContent,     icon: BookOpen },
  { label: AR.navQuizzes,        path: '/admin/quizzes',        icon: ClipboardList },
  { label: AR.navAssignments,    path: '/admin/assignments',    icon: FileText },
  { label: AR.navTicketMgmt,     path: ROUTES.adminTickets,     icon: Ticket },
  { label: AR.navAttendanceMgmt, path: ROUTES.adminAttendance,  icon: Calendar },
  { label: AR.navGradesMgmt,     path: ROUTES.adminGrades,      icon: GraduationCap },
  { label: AR.navAnnouncements,  path: ROUTES.adminAnnouncements, icon: Megaphone },
  { label: AR.navReports,        path: ROUTES.adminReports,     icon: TrendingUp },
  { label: AR.navSettings,       path: ROUTES.adminSettings,    icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  role: UserRole;
}

export function Sidebar({ open, onClose, role }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const navItems = role === 'admin' ? adminNav : traineeNav;

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.login);
  };

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      {/* Logo area */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/etra-logo.png" alt="ETRA Logo" className="w-12 h-auto drop-shadow-md" />
            <div>
              <div className="text-white font-black text-sm leading-tight">إترا</div>
              <div className="text-white/60 text-xs">منصة التدريب</div>
            </div>
          </div>
          {/* Mobile close */}
          <button
            onClick={onClose}
            className="md:hidden text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {profile?.full_name?.charAt(0) ?? '?'}
          </div>
          <div className="overflow-hidden">
            <div className="text-white text-sm font-semibold truncate">{profile?.full_name}</div>
            <div className="text-white/50 text-xs">
              {role === 'admin' ? 'مشرف' : 'متدربة'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="py-4 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              end={item.path === ROUTES.dashboard || item.path === ROUTES.adminDashboard}
            >
              <Icon className="nav-icon" size={18} />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="nav-item w-full text-white/60 hover:text-white hover:bg-red-500/20"
        >
          <Shield size={18} className="nav-icon" />
          <span>{AR.logout}</span>
        </button>
      </div>
    </aside>
  );
}
