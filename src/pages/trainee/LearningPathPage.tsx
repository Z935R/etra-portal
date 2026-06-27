import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock, CheckCircle2, PlayCircle, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AR } from '../../constants/arabic';
import { ProgressBar, CardSkeleton, EmptyState, Badge } from '../../components/common';
import type { TrainingWeek, Module, Lesson, LessonProgress } from '../../types';

interface WeekWithModules extends TrainingWeek {
  modules: (Module & { lessons: (Lesson & { progress?: LessonProgress })[] })[];
}

export function LearningPathPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [weeks, setWeeks] = useState<WeekWithModules[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  useEffect(() => {
    if (profile) fetchContent();
  }, [profile]);

  const fetchContent = async () => {
    if (!profile) return;
    try {
      const { data: weeksData } = await supabase
        .from('training_weeks')
        .select(`
          *,
          modules (
            *,
            lessons (*)
          )
        `)
        .order('week_number');

      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('trainee_id', profile.id);

      const progressMap = new Map(
        (progressData ?? []).map((p: LessonProgress) => [p.lesson_id, p])
      );

      const enriched = (weeksData ?? []).map((week: any) => ({
        ...week,
        modules: (week.modules ?? [])
          .sort((a: Module, b: Module) => a.order_index - b.order_index)
          .map((mod: any) => ({
            ...mod,
            lessons: (mod.lessons ?? [])
              .sort((a: Lesson, b: Lesson) => a.order_index - b.order_index)
              .map((lesson: Lesson) => ({
                ...lesson,
                progress: progressMap.get(lesson.id),
              })),
          })),
      }));

      setWeeks(enriched as WeekWithModules[]);
      if (enriched.length > 0) setExpandedWeek(enriched[0].id);
    } finally {
      setLoading(false);
    }
  };

  const getWeekProgress = (week: WeekWithModules) => {
    const allLessons = week.modules.flatMap(m => m.lessons);
    if (!allLessons.length) return 0;
    const completed = allLessons.filter(l => l.progress?.is_completed).length;
    return Math.round((completed / allLessons.length) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => <CardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">مسار التعلم</h1>
        <p className="section-subtitle">تابعي تقدمك في كل أسبوع ووحدة</p>
      </div>

      {weeks.length === 0 && (
        <EmptyState
          icon={<BookOpen size={48} />}
          title={AR.emptyLessons}
          description="سيتم إضافة المحتوى قريباً"
        />
      )}

      <div className="space-y-4">
        {weeks.map((week, wi) => {
          const pct = getWeekProgress(week);
          const isOpen = expandedWeek === week.id;

          return (
            <motion.div
              key={week.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: wi * 0.08 }}
              className="card overflow-hidden"
            >
              {/* Week header */}
              <button
                onClick={() => setExpandedWeek(isOpen ? null : week.id)}
                className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                disabled={week.is_locked}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${
                    week.is_locked ? 'bg-gray-100 text-gray-400' : 'bg-gradient-primary text-white'
                  }`}>
                    {week.week_number}
                  </div>
                  <div className="text-right">
                    <h2 className="font-bold text-gray-900">{week.title_ar}</h2>
                    <p className="text-sm text-gray-500">{week.title_en}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {week.is_locked ? (
                    <Lock size={18} className="text-gray-400" />
                  ) : (
                    <div className="text-left">
                      <p className="text-xs text-gray-500 mb-1">{pct}% مكتمل</p>
                      <ProgressBar value={pct} />
                    </div>
                  )}
                  <ChevronLeft
                    size={20}
                    className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                  />
                </div>
              </button>

              {/* Modules */}
              {isOpen && !week.is_locked && (
                <div className="border-t border-gray-100">
                  {week.modules.map((mod) => {
                    const modLessons = mod.lessons;
                    const modCompleted = modLessons.filter(l => l.progress?.is_completed).length;
                    const modPct = modLessons.length > 0
                      ? Math.round((modCompleted / modLessons.length) * 100)
                      : 0;

                    return (
                      <div key={mod.id} className="border-b border-gray-50 last:border-b-0">
                        <div className="px-5 py-3 bg-gray-50/60 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{mod.title_ar}</p>
                            <p className="text-xs text-gray-400">{mod.title_en}</p>
                          </div>
                          <div className="text-left">
                            <span className="text-xs text-gray-500">{modCompleted}/{modLessons.length} دروس</span>
                          </div>
                        </div>

                        <div className="px-5 py-2 space-y-1">
                          {modLessons.map((lesson) => {
                            const done = lesson.progress?.is_completed;
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => navigate(`/learning/lesson/${lesson.id}`)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm transition-all duration-150 ${
                                  done
                                    ? 'text-success hover:bg-success/5'
                                    : 'text-gray-700 hover:bg-primary-50'
                                }`}
                              >
                                {done ? (
                                  <CheckCircle2 size={18} className="text-success flex-shrink-0" />
                                ) : (
                                  <PlayCircle size={18} className="text-primary-400 flex-shrink-0" />
                                )}
                                <span className="flex-1 text-right font-medium">{lesson.title_ar}</span>
                                {lesson.duration_minutes && (
                                  <span className="text-xs text-gray-400">
                                    {lesson.duration_minutes} د
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
