import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Avatar, CardSkeleton } from '../../components/common';
import { formatDateAr } from '../../lib/utils';
import { ATTENDANCE_STATUS_LABELS } from '../../constants/arabic';
import type { Profile, Attendance, AttendanceStatus, SessionType } from '../../types';

export function AttendanceMgmtPage() {
  const { profile } = useAuth();
  const [trainees, setTrainees] = useState<Profile[]>([]);
  const [records, setRecords] = useState<Map<string, AttendanceStatus>>(new Map());
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weekNumber, setWeekNumber] = useState(1);
  const [sessionType, setSessionType] = useState<SessionType>('inperson');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<Attendance[]>([]);

  useEffect(() => { fetchTrainees(); }, []);
  useEffect(() => { if (date) fetchHistory(); }, [date]);

  const fetchTrainees = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'trainee');
    setTrainees((data ?? []) as Profile[]);
    const initial = new Map<string, AttendanceStatus>();
    (data ?? []).forEach((t: Profile) => initial.set(t.id, 'present'));
    setRecords(initial);
    setLoading(false);
  };

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('attendance')
      .select('*, profiles!trainee_id(full_name)')
      .eq('date', date)
      .order('created_at');
    setHistory((data ?? []) as Attendance[]);
  };

  const setStatus = (traineeId: string, status: AttendanceStatus) => {
    setRecords(r => new Map(r).set(traineeId, status));
  };

  const saveAttendance = async () => {
    if (!profile) return;
    setSaving(true);
    const inserts = trainees.map(t => ({
      trainee_id: t.id,
      date,
      week_number: weekNumber,
      session_type: sessionType,
      status: records.get(t.id) ?? 'present',
      recorded_by: profile.id,
    }));
    // Upsert
    const { error } = await supabase.from('attendance').upsert(inserts, {
      onConflict: 'trainee_id,date',
    });
    if (error) toast.error('خطأ في حفظ الحضور');
    else toast.success('تم تسجيل الحضور بنجاح');
    fetchHistory();
    setSaving(false);
  };

  if (loading) return <CardSkeleton />;

  const STATUS_COLORS: Record<AttendanceStatus, string> = {
    present: 'border-success bg-success/10 text-success',
    late:    'border-warning bg-warning/10 text-warning',
    absent:  'border-danger bg-danger/10 text-danger',
    excused: 'border-info bg-info/10 text-info',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">تسجيل الحضور</h1>
        <p className="section-subtitle">سجّل حضور المتدربات لكل جلسة</p>
      </div>

      <div className="card p-5">
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <label className="label">التاريخ</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">الأسبوع</label>
            <select className="input" value={weekNumber} onChange={e => setWeekNumber(+e.target.value)}>
              <option value={1}>الأسبوع 1</option>
              <option value={2}>الأسبوع 2</option>
            </select>
          </div>
          <div>
            <label className="label">نوع الجلسة</label>
            <select className="input" value={sessionType} onChange={e => setSessionType(e.target.value as SessionType)}>
              <option value="inperson">حضوري</option>
              <option value="remote">عن بعد</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {trainees.map(t => {
            const status = records.get(t.id) ?? 'present';
            return (
              <div key={t.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <Avatar name={t.full_name} size="sm" />
                  <span className="font-semibold text-gray-800">{t.full_name}</span>
                </div>
                <div className="flex gap-2">
                  {(['present', 'late', 'absent', 'excused'] as AttendanceStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setStatus(t.id, s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                        status === s
                          ? STATUS_COLORS[s]
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {ATTENDANCE_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="primary" loading={saving} onClick={saveAttendance} icon={<Save size={16} />}>
            حفظ الحضور
          </Button>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-gray-700 mb-3">سجل حضور {formatDateAr(date)}</h3>
          <div className="space-y-2">
            {history.map(r => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span>{(r as any).profiles?.full_name}</span>
                <span className={`badge ${
                  r.status === 'present' ? 'badge-success' :
                  r.status === 'late' ? 'badge-warning' :
                  r.status === 'absent' ? 'badge-danger' : 'badge-info'
                }`}>{ATTENDANCE_STATUS_LABELS[r.status]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
