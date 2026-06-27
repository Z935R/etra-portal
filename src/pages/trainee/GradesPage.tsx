import React, { useEffect, useState } from 'react';
import { BarChart2, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CardSkeleton, EmptyState } from '../../components/common';
import { ProgressBar } from '../../components/common';
import { AR } from '../../constants/arabic';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import type { Grade } from '../../types';

export function GradesPage() {
  const { profile } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (profile) fetchGrades(); }, [profile]);

  const fetchGrades = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('grades').select('*').eq('trainee_id', profile.id).order('week_number');
    setGrades((data ?? []) as Grade[]);
    setLoading(false);
  };

  if (loading) return <div className="space-y-4">{[1,2].map(i => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">درجاتي</h1>
        <p className="section-subtitle">تابعي أداءك في كل محور تقييمي</p>
      </div>

      {grades.length === 0 && (
        <EmptyState icon={<BarChart2 size={48} />} title={AR.emptyGrades}
          description="ستظهر درجاتك هنا بعد إتمام النشاطات" />
      )}

      <div className="space-y-6">
        {grades.map((grade, i) => {
          const radarData = [
            { subject: 'الدروس',      value: grade.lessons_score },
            { subject: 'الاختبارات', value: grade.quizzes_score },
            { subject: 'المهام',      value: grade.assignments_score },
            { subject: 'التذاكر',    value: grade.tickets_score },
            { subject: 'الحضور',     value: grade.attendance_score },
          ];

          const scoreColor = grade.total_score >= 90 ? 'text-success'
            : grade.total_score >= 70 ? 'text-warning' : 'text-danger';

          return (
            <motion.div key={grade.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }} className="card overflow-hidden">
              {/* Week header */}
              <div className="bg-gradient-primary p-4 flex items-center justify-between">
                <div>
                  <h2 className="font-black text-white text-lg">الأسبوع {grade.week_number}</h2>
                  <p className="text-white/70 text-sm">تقييم شامل</p>
                </div>
                <div className="text-center">
                  <div className={`text-4xl font-black ${scoreColor === 'text-success' ? 'text-white' : 'text-yellow-300'}`}>
                    {Math.round(grade.total_score)}%
                  </div>
                  <p className="text-white/70 text-xs">المجموع الكلي</p>
                </div>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Score breakdown */}
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-700 text-sm">توزيع الدرجات</h3>
                  {[
                    { label: 'الدروس (15%)',      value: grade.lessons_score },
                    { label: 'الاختبارات (25%)',  value: grade.quizzes_score },
                    { label: 'المهام (25%)',       value: grade.assignments_score },
                    { label: 'التذاكر (25%)',     value: grade.tickets_score },
                    { label: 'الحضور (10%)',      value: grade.attendance_score },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-bold text-gray-800">{item.value}%</span>
                      </div>
                      <ProgressBar value={item.value} />
                    </div>
                  ))}
                </div>

                {/* Radar chart */}
                <div>
                  <h3 className="font-bold text-gray-700 text-sm mb-3">مخطط الأداء</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontFamily: 'Cairo', fontSize: 11 }} />
                      <Radar name="الدرجات" dataKey="value" stroke="#7B5CC8" fill="#7B5CC8" fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {grade.notes_ar && (
                <div className="px-5 pb-5">
                  <div className="bg-primary-50 rounded-xl p-3 text-sm text-primary-900">
                    <span className="font-bold">ملاحظة المشرف:</span> {grade.notes_ar}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
