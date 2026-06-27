import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Badge, CardSkeleton, EmptyState, Button } from '../../components/common';
import { AR } from '../../constants/arabic';
import type { Quiz, QuizAttempt } from '../../types';

interface QuizWithAttempts extends Quiz {
  attempts: QuizAttempt[];
  module_title?: string;
}

export function QuizListPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<QuizWithAttempts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) fetchQuizzes();
  }, [profile]);

  const fetchQuizzes = async () => {
    if (!profile) return;
    try {
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*, modules(title_ar)')
        .eq('is_published', true);

      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('trainee_id', profile.id);

      const attemptsMap = new Map<string, QuizAttempt[]>();
      (attempts ?? []).forEach((a: QuizAttempt) => {
        const arr = attemptsMap.get(a.quiz_id) ?? [];
        arr.push(a);
        attemptsMap.set(a.quiz_id, arr);
      });

      const enriched = (quizData ?? []).map((q: any) => ({
        ...q,
        module_title: q.modules?.title_ar,
        attempts: attemptsMap.get(q.id) ?? [],
      }));

      setQuizzes(enriched as QuizWithAttempts[]);
    } finally {
      setLoading(false);
    }
  };

  const getBestAttempt = (attempts: QuizAttempt[]) =>
    attempts.length > 0
      ? attempts.reduce((best, a) => (a.score > best.score ? a : best))
      : null;

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">الاختبارات</h1>
        <p className="section-subtitle">اختبارات سيناريو عملية لتقييم مهاراتك</p>
      </div>

      {quizzes.length === 0 && (
        <EmptyState
          icon={<ClipboardList size={48} />}
          title={AR.emptyQuizzes}
          description="سيتم إضافة الاختبارات قريباً"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quizzes.map((quiz, i) => {
          const best = getBestAttempt(quiz.attempts);
          const attemptsLeft = quiz.max_attempts - quiz.attempts.length;
          const canAttempt = attemptsLeft > 0;

          return (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card p-5 flex flex-col gap-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{quiz.module_title}</p>
                  <h3 className="font-bold text-gray-900">{quiz.title_ar}</h3>
                </div>
                {best?.passed ? (
                  <Badge variant="success"><CheckCircle2 size={12} /> ناجح</Badge>
                ) : best && !best.passed ? (
                  <Badge variant="danger"><AlertCircle size={12} /> راسب</Badge>
                ) : (
                  <Badge variant="gray">لم تبدأ</Badge>
                )}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {quiz.time_limit_minutes && (
                  <div className="flex items-center gap-1">
                    <Clock size={13} />
                    <span>{quiz.time_limit_minutes} دقيقة</span>
                  </div>
                )}
                <span>درجة النجاح: {quiz.passing_score}%</span>
                <span>المحاولات: {quiz.attempts.length}/{quiz.max_attempts}</span>
              </div>

              {/* Best score */}
              {best && (
                <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">أفضل نتيجة:</span>
                  <span className={`text-lg font-black ${
                    best.passed ? 'text-success' : 'text-danger'
                  }`}>
                    {Math.round(best.score)}%
                  </span>
                </div>
              )}

              {/* Action */}
              <Button
                variant={canAttempt ? 'primary' : 'ghost'}
                disabled={!canAttempt}
                onClick={() => navigate(`/quizzes/${quiz.id}`)}
                icon={best ? <RotateCcw size={16} /> : undefined}
                className="w-full"
              >
                {!canAttempt
                  ? 'انتهت المحاولات'
                  : best
                  ? 'إعادة المحاولة'
                  : AR.startQuiz}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
