import React, { useEffect, useState } from 'react';
import { GraduationCap, Calculator, Save, Download } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Avatar, CardSkeleton } from '../../components/common';
import type { Profile, Grade } from '../../types';

interface TraineeGrade extends Profile {
  grades: Grade[];
  currentGrade?: Grade;
}

export function GradesMgmtPage() {
  const { profile } = useAuth();
  const [trainees, setTrainees] = useState<TraineeGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weekNumber, setWeekNumber] = useState(1);
  const [editMap, setEditMap] = useState<Map<string, Partial<Grade>>>(new Map());

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [profilesRes, gradesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'trainee'),
      supabase.from('grades').select('*'),
    ]);
    const gradesByTrainee = new Map<string, Grade[]>();
    (gradesRes.data ?? []).forEach((g: Grade) => {
      const arr = gradesByTrainee.get(g.trainee_id) ?? [];
      arr.push(g);
      gradesByTrainee.set(g.trainee_id, arr);
    });
    setTrainees(
      (profilesRes.data ?? []).map((p: Profile) => ({
        ...p,
        grades: gradesByTrainee.get(p.id) ?? [],
        currentGrade: gradesByTrainee.get(p.id)?.find(g => g.week_number === weekNumber),
      })) as TraineeGrade[]
    );
    setLoading(false);
  };

  const setField = (traineeId: string, field: string, value: number) => {
    setEditMap(m => {
      const curr = m.get(traineeId) ?? {};
      return new Map(m).set(traineeId, { ...curr, [field]: value });
    });
  };

  const calcTotal = (edit: Partial<Grade>) => {
    const l = (edit.lessons_score ?? 0) * 0.15;
    const q = (edit.quizzes_score ?? 0) * 0.25;
    const a = (edit.assignments_score ?? 0) * 0.25;
    const t = (edit.tickets_score ?? 0) * 0.25;
    const at = (edit.attendance_score ?? 0) * 0.10;
    return Math.round(l + q + a + t + at);
  };

  const exportCSV = () => {
    let csv = '\uFEFF'; // BOM for Arabic support in Excel
    csv += 'اسم المتدربة,الدروس,الاختبارات,المهام,التذاكر,الحضور,المجموع\n';
    
    trainees.forEach(t => {
      const g = t.currentGrade || ({} as Partial<Grade>);
      const edit = editMap.get(t.id) || ({} as Partial<Grade>);
      const l = edit.lessons_score ?? g.lessons_score ?? 0;
      const q = edit.quizzes_score ?? g.quizzes_score ?? 0;
      const a = edit.assignments_score ?? g.assignments_score ?? 0;
      const tic = edit.tickets_score ?? g.tickets_score ?? 0;
      const at = edit.attendance_score ?? g.attendance_score ?? 0;
      const total = calcTotal({ lessons_score: l, quizzes_score: q, assignments_score: a, tickets_score: tic, attendance_score: at });
      
      csv += `"${t.full_name}",${l},${q},${a},${tic},${at},${total}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `درجات_الأسبوع_${weekNumber}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveGrades = async () => {
    if (!profile) return;
    setSaving(true);
    for (const [traineeId, edit] of editMap.entries()) {
      const existing = trainees.find(t => t.id === traineeId)?.currentGrade;
      const payload = {
        trainee_id: traineeId,
        week_number: weekNumber,
        lessons_score: edit.lessons_score ?? 0,
        quizzes_score: edit.quizzes_score ?? 0,
        assignments_score: edit.assignments_score ?? 0,
        tickets_score: edit.tickets_score ?? 0,
        attendance_score: edit.attendance_score ?? 0,
        total_score: calcTotal(edit),
        calculated_at: new Date().toISOString(),
        notes_ar: edit.notes_ar ?? '',
      };
      if (existing) {
        await supabase.from('grades').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('grades').insert(payload);
      }
    }
    toast.success('تم حفظ الدرجات بنجاح');
    setEditMap(new Map());
    fetchData();
    setSaving(false);
  };

  if (loading) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">إدارة الدرجات</h1>
          <p className="section-subtitle">أدخل درجات المتدربات لكل أسبوع</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input w-36" value={weekNumber} onChange={e => setWeekNumber(+e.target.value)}>
            <option value={1}>الأسبوع 1</option>
            <option value={2}>الأسبوع 2</option>
          </select>
          <Button variant="ghost" onClick={exportCSV} icon={<Download size={18} />}>
            تصدير Excel
          </Button>
          <Button onClick={saveGrades} loading={saving} icon={<Save size={18} />}>
            حفظ الدرجات
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {trainees.map(t => {
          const edit = editMap.get(t.id) ?? {};
          const g = t.currentGrade;
          const vals = {
            lessons_score: edit.lessons_score ?? g?.lessons_score ?? 0,
            quizzes_score: edit.quizzes_score ?? g?.quizzes_score ?? 0,
            assignments_score: edit.assignments_score ?? g?.assignments_score ?? 0,
            tickets_score: edit.tickets_score ?? g?.tickets_score ?? 0,
            attendance_score: edit.attendance_score ?? g?.attendance_score ?? 0,
            notes_ar: edit.notes_ar ?? g?.notes_ar ?? '',
          };
          const total = calcTotal(vals);

          return (
            <div key={t.id} className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={t.full_name} />
                <h3 className="font-bold text-gray-900">{t.full_name}</h3>
                <div className={`mr-auto text-2xl font-black ${
                  total >= 80 ? 'text-success' : total >= 60 ? 'text-warning' : 'text-danger'
                }`}>
                  {total}%
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { field: 'lessons_score',     label: 'الدروس (15%)' },
                  { field: 'quizzes_score',     label: 'الاختبارات (25%)' },
                  { field: 'assignments_score', label: 'المهام (25%)' },
                  { field: 'tickets_score',     label: 'التذاكر (25%)' },
                  { field: 'attendance_score',  label: 'الحضور (10%)' },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">{label}</label>
                    <input
                      type="number" min={0} max={100}
                      className="input text-center font-bold"
                      value={(vals as any)[field]}
                      onChange={e => setField(t.id, field, Math.min(100, Math.max(0, +e.target.value)))}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <label className="text-xs text-gray-500 font-medium mb-1 block">ملاحظات</label>
                <input
                  className="input text-sm"
                  value={vals.notes_ar}
                  onChange={e => setField(t.id, 'notes_ar', e.target.value as any)}
                  placeholder="ملاحظات اختيارية..."
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
