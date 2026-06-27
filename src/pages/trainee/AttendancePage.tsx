import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CardSkeleton, EmptyState, Badge } from '../../components/common';
import { formatDateAr } from '../../lib/utils';
import { ATTENDANCE_STATUS_LABELS } from '../../constants/arabic';
import type { Attendance } from '../../types';

export function AttendancePage() {
  const { profile } = useAuth();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (profile) fetchAttendance(); }, [profile]);

  const fetchAttendance = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('attendance').select('*').eq('trainee_id', profile.id).order('date', { ascending: false });
    setAttendance((data ?? []) as Attendance[]);
    setLoading(false);
  };

  const statusConfig: Record<string, { icon: React.ReactNode; cls: string }> = {
    present: { icon: <CheckCircle2 size={16} />, cls: 'text-success' },
    late:    { icon: <Clock size={16} />,        cls: 'text-warning' },
    absent:  { icon: <XCircle size={16} />,      cls: 'text-danger' },
    excused: { icon: <AlertCircle size={16} />,  cls: 'text-info' },
  };

  const stats = {
    present: attendance.filter(a => a.status === 'present').length,
    late:    attendance.filter(a => a.status === 'late').length,
    absent:  attendance.filter(a => a.status === 'absent').length,
    excused: attendance.filter(a => a.status === 'excused').length,
  };

  const attendanceRate = attendance.length > 0
    ? Math.round(((stats.present + stats.late) / attendance.length) * 100)
    : 0;

  if (loading) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">حضوري</h1>
        <p className="section-subtitle">سجل حضورك وغيابك في جلسات التدريب</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'حاضر', count: stats.present, color: 'bg-success/10 text-success' },
          { label: 'متأخر', count: stats.late,    color: 'bg-warning/10 text-warning' },
          { label: 'غائب', count: stats.absent,   color: 'bg-danger/10 text-danger' },
          { label: 'معذور', count: stats.excused, color: 'bg-info/10 text-info' },
        ].map(item => (
          <div key={item.label} className={`card p-4 text-center ${item.color} border-0`}>
            <div className="text-3xl font-black">{item.count}</div>
            <div className="text-sm font-medium">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Rate */}
      <div className="card p-5 flex items-center justify-between">
        <span className="font-bold text-gray-700">نسبة الحضور الإجمالية</span>
        <span className={`text-2xl font-black ${
          attendanceRate >= 90 ? 'text-success' : attendanceRate >= 75 ? 'text-warning' : 'text-danger'
        }`}>{attendanceRate}%</span>
      </div>

      {attendance.length === 0 && (
        <EmptyState icon={<Calendar size={48} />} title="لا يوجد سجل حضور بعد" />
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>الأسبوع</th>
              <th>نوع الجلسة</th>
              <th>الحالة</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((record) => {
              const cfg = statusConfig[record.status];
              return (
                <tr key={record.id}>
                  <td className="font-medium">{formatDateAr(record.date)}</td>
                  <td>الأسبوع {record.week_number}</td>
                  <td>{record.session_type === 'remote' ? 'عن بعد' : 'حضوري'}</td>
                  <td>
                    <span className={`flex items-center gap-1.5 font-semibold ${cfg?.cls}`}>
                      {cfg?.icon}
                      {ATTENDANCE_STATUS_LABELS[record.status]}
                    </span>
                  </td>
                  <td className="text-gray-400 text-sm">{record.notes ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
