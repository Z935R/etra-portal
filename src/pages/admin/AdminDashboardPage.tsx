import React, { useEffect, useState } from 'react';
import { Users, Ticket, FileText, TrendingUp, Plus, Megaphone, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { StatCard } from '../../components/dashboard/StatCard';
import { WeeklyChart } from '../../components/dashboard/WeeklyChart';
import { CardSkeleton, Button } from '../../components/common';
import { AR, TICKET_STATUS_LABELS } from '../../constants/arabic';
import { formatTicketNumber, timeAgoAr } from '../../lib/utils';
import { ROUTES } from '../../constants/config';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type { Ticket as ITicket } from '../../types';

const performanceData = [
  { name: 'لجين', lessons: 85, quizzes: 78, tickets: 90 },
  { name: 'سارة', lessons: 70, quizzes: 85, tickets: 75 },
  { name: 'نورة', lessons: 92, quizzes: 70, tickets: 80 },
];

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    trainees: 0, openTickets: 0, resolvedTickets: 0,
    pendingAssignments: 0, avgCompletion: 0,
  });
  const [recentTickets, setRecentTickets] = useState<ITicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    const [traineeRes, openRes, resolvedRes, pendingRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'trainee'),
      supabase.from('tickets').select('id', { count: 'exact' }).not('status', 'in', '("resolved","closed")'),
      supabase.from('tickets').select('id', { count: 'exact' }).in('status', ['resolved', 'closed']),
      supabase.from('assignment_submissions').select('id', { count: 'exact' }).eq('status', 'submitted'),
    ]);
    const { data: recentData } = await supabase.from('tickets').select('*')
      .order('created_at', { ascending: false }).limit(5);

    setStats({
      trainees: traineeRes.count ?? 0,
      openTickets: openRes.count ?? 0,
      resolvedTickets: resolvedRes.count ?? 0,
      pendingAssignments: pendingRes.count ?? 0,
      avgCompletion: 68,
    });
    setRecentTickets((recentData ?? []) as ITicket[]);
    setLoading(false);
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <CardSkeleton key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">لوحة التحكم</h1>
          <p className="section-subtitle">نظرة عامة على أداء المتدربات</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={AR.activeTrainees}       value={stats.trainees}           icon={<Users size={22} className="text-primary-600" />} iconBg="bg-primary-100" />
        <StatCard title="تذاكر مفتوحة"           value={stats.openTickets}        icon={<Ticket size={22} className="text-warning" />}    iconBg="bg-warning/15" />
        <StatCard title="تذاكر محلولة"           value={stats.resolvedTickets}    icon={<TrendingUp size={22} className="text-success" />} iconBg="bg-success/15" />
        <StatCard title={AR.assignmentsReview}    value={stats.pendingAssignments} icon={<FileText size={22} className="text-info" />}     iconBg="bg-info/15" />
      </div>

      {/* Quick actions */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-700 mb-4">{AR.quickActions}</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary"   size="sm" icon={<Plus size={16} />}      onClick={() => navigate(ROUTES.adminTickets)}>
            {AR.createTicket}
          </Button>
          <Button variant="secondary" size="sm" icon={<Megaphone size={16} />} onClick={() => navigate(ROUTES.adminAnnouncements)}>
            {AR.addAnnouncement}
          </Button>
          <Button variant="secondary" size="sm" icon={<Calendar size={16} />} onClick={() => navigate(ROUTES.adminAttendance)}>
            {AR.recordAttendance}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trainee performance */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-700 mb-4">مقارنة أداء المتدربات</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0eeff" />
              <XAxis dataKey="name" tick={{ fontFamily: 'Cairo', fontSize: 12 }} />
              <YAxis tick={{ fontFamily: 'Cairo', fontSize: 12 }} domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="lessons"   name="دروس"      stroke="#9270ff" strokeWidth={2} dot />
              <Line type="monotone" dataKey="quizzes"   name="اختبارات"  stroke="#7B5CC8" strokeWidth={2} dot />
              <Line type="monotone" dataKey="tickets"   name="تذاكر"     stroke="#4B2D8F" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent tickets */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-700">آخر التذاكر</h3>
            <button onClick={() => navigate(ROUTES.adminTickets)} className="text-sm text-primary-600 hover:underline">
              عرض الكل
            </button>
          </div>
          <div className="space-y-3">
            {recentTickets.map(t => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/admin/tickets/${t.id}`)}
              >
                <div>
                  <p className="text-sm font-bold text-gray-800">{t.title_ar}</p>
                  <p className="text-xs text-gray-400">{formatTicketNumber(t.ticket_number)} • {timeAgoAr(t.created_at)}</p>
                </div>
                <span className={`status-${t.status} badge text-xs`}>
                  {TICKET_STATUS_LABELS[t.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
