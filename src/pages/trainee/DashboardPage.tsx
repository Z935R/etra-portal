import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, FileText, Ticket, BarChart2, ArrowLeft,
  TrendingUp, Bell, Star, CheckCircle2, Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { AR } from '../../constants/arabic';
import { ROUTES } from '../../constants/config';
import { StatCard } from '../../components/dashboard/StatCard';
import { ProgressRing } from '../../components/dashboard/ProgressRing';
import { WeeklyChart } from '../../components/dashboard/WeeklyChart';
import { CardSkeleton, Badge } from '../../components/common';
import { formatDateAr, timeAgoAr } from '../../lib/utils';
import type { Announcement, Notification as INotification } from '../../types';

interface DashboardStats {
  completedLessons: number;
  totalLessons: number;
  pendingAssignments: number;
  openTickets: number;
  avgQuizScore: number;
  overallProgress: number;
}

const chartData: any[] = [];

export function DashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [latestFeedback, setLatestFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [motivational] = useState(() => {
    const words = ['استمري في تألقك 🌟', 'نحن فخورون بتقدمك 🚀', 'مجهود رائع 💪', 'لا تتوقفي عن التعلم 📚', 'أنتِ في الطريق الصحيح ✨'];
    return words[Math.floor(Math.random() * words.length)];
  });
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'صباح الخير' : 'مساء الخير');
    if (profile) fetchDashboard();
  }, [profile]);

  const fetchDashboard = async () => {
    if (!profile) return;
    try {
      const [lessonsRes, progressRes, assignRes, ticketsRes, quizRes, annRes, feedbackRes] =
        await Promise.all([
          supabase.from('lessons').select('id', { count: 'exact' }).eq('is_published', true),
          supabase.from('lesson_progress').select('id', { count: 'exact' })
            .eq('trainee_id', profile.id).eq('is_completed', true),
          supabase.from('assignments').select('id', { count: 'exact' }).eq('is_published', true),
          supabase.from('tickets').select('id', { count: 'exact' })
            .eq('assigned_to', profile.id)
            .not('status', 'in', '("closed","resolved")'),
          supabase.from('quiz_attempts').select('score')
            .eq('trainee_id', profile.id).not('completed_at', 'is', null),
          supabase.from('announcements').select('*')
            .eq('is_published', true).order('published_at', { ascending: false }).limit(3),
          supabase.from('ticket_updates').select('content_ar, created_at')
            .eq('update_type', 'feedback').order('created_at', { ascending: false }).limit(1),
        ]);

      const totalLessons = lessonsRes.count ?? 0;
      const completedLessons = progressRes.count ?? 0;
      const scores = (quizRes.data ?? []).map((a: { score: number }) => a.score);
      const avgQuizScore = scores.length > 0
        ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
        : 0;
      const overallProgress = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

      setStats({
        completedLessons,
        totalLessons,
        pendingAssignments: assignRes.count ?? 0,
        openTickets: ticketsRes.count ?? 0,
        avgQuizScore,
        overallProgress,
      });
      setAnnouncements((annRes.data ?? []) as Announcement[]);
      setLatestFeedback(feedbackRes.data?.[0]?.content_ar ?? null);
    } finally {
      setLoading(false);
    }
  };

  const announcementBadge = (type: string) => {
    if (type === 'urgent') return <Badge variant="danger">عاجل</Badge>;
    if (type === 'important') return <Badge variant="warning">مهم</Badge>;
    return <Badge variant="gray">عادي</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {greeting}، {profile?.full_name?.split(' ')[0]} 👋 <span className="text-primary-600 text-lg mr-2 font-bold">{motivational}</span>
          </h1>
          <p className="text-gray-500 mt-1">{AR.currentWeek}: الأسبوع الأول — مقدمة في الدعم الفني</p>
        </div>
        <button
          onClick={() => navigate(ROUTES.learning)}
          className="btn-primary btn flex items-center gap-2 self-start"
        >
          <span>{AR.continuelearning}</span>
          <ArrowLeft size={16} />
        </button>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          title={AR.completedLessons}
          value={`${stats?.completedLessons ?? 0}/${stats?.totalLessons ?? 0}`}
          icon={<BookOpen size={22} className="text-primary-600" />}
          iconBg="bg-primary-100"
          subtitle="درساً مكتملاً"
        />
        <StatCard
          title={AR.pendingAssignments}
          value={stats?.pendingAssignments ?? 0}
          icon={<FileText size={22} className="text-warning" />}
          iconBg="bg-warning/15"
          subtitle="مهمة معلقة"
        />
        <StatCard
          title={AR.openTickets}
          value={stats?.openTickets ?? 0}
          icon={<Ticket size={22} className="text-info" />}
          iconBg="bg-info/15"
          subtitle="تذكرة مفتوحة"
        />
        <StatCard
          title={AR.avgQuizScore}
          value={`${stats?.avgQuizScore ?? 0}%`}
          icon={<BarChart2 size={22} className="text-success" />}
          iconBg="bg-success/15"
          subtitle="متوسط الدرجات"
        />
      </motion.div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress + chart */}
        <div className="lg:col-span-2 space-y-6">
          <WeeklyChart data={chartData} title={AR.weeklyProgress} />

          {/* Latest feedback */}
          {latestFeedback && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Star size={18} className="text-warning" />
                <h3 className="font-bold text-gray-800">{AR.latestFeedback}</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{latestFeedback}</p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Progress ring */}
          <div className="card p-6 flex flex-col items-center">
            <h3 className="font-bold text-gray-800 mb-4">{AR.overallProgress}</h3>
            <ProgressRing
              value={stats?.overallProgress ?? 0}
              size={140}
              label="نسبة الإكمال"
            />
          </div>

          {/* Announcements */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={18} className="text-primary-600" />
              <h3 className="font-bold text-gray-800">{AR.recentAnnouncements}</h3>
            </div>
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">{AR.emptyAnnouncements}</p>
              ) : (
                announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3 rounded-xl border border-gray-100 hover:border-primary-200 transition-colors cursor-pointer"
                    onClick={() => navigate(ROUTES.announcements)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-800 leading-tight">{ann.title_ar}</p>
                      {announcementBadge(ann.type)}
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{ann.content_ar}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
