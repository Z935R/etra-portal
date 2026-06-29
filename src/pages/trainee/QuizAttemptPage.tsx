import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button, CardSkeleton } from '../../components/common';
import { formatDuration } from '../../lib/utils';
import type { Quiz, QuizQuestion, QuizOption } from '../../types';

interface QuizState {
  quiz: Quiz;
  questions: (QuizQuestion & { options: QuizOption[] })[];
  currentIndex: number;
  answers: Map<string, string>; // questionId -> optionId
  phase: 'intro' | 'active' | 'result';
  timeLeft: number;
  score: number;
  passed: boolean;
  attemptId: string | null;
}

export function QuizAttemptPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<QuizState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (quizId && profile) fetchQuiz();
  }, [quizId, profile]);

  // Timer
  useEffect(() => {
    if (state?.phase !== 'active' || !state.timeLeft) return;
    if (state.timeLeft <= 0) { handleSubmit(); return; }
    const t = setInterval(() => {
      setState(s => s ? { ...s, timeLeft: s.timeLeft - 1 } : s);
    }, 1000);
    return () => clearInterval(t);
  }, [state?.phase, state?.timeLeft]);

  const fetchQuiz = async () => {
    if (!quizId || !profile) return;
    try {
      const { data: quiz } = await supabase
        .from('quizzes').select('*').eq('id', quizId).single();

      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('*, quiz_options(*)')
        .eq('quiz_id', quizId)
        .order('order_index');

      if (!quiz || !questions) return;

      const qs = (questions as (QuizQuestion & { quiz_options: QuizOption[] })[]).map(q => ({
        ...q,
        options: (q.quiz_options ?? []).sort((a, b) => a.order_index - b.order_index),
      }));

      setState({
        quiz: quiz as Quiz,
        questions: qs,
        currentIndex: 0,
        answers: new Map(),
        phase: 'intro',
        timeLeft: (quiz.time_limit_minutes ?? 30) * 60,
        score: 0,
        passed: false,
        attemptId: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    if (!state || !profile) return;
    // Get attempt number
    const { count } = await supabase
      .from('quiz_attempts')
      .select('id', { count: 'exact' })
      .eq('quiz_id', state.quiz.id)
      .eq('trainee_id', profile.id);

    const { data: attempt } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: state.quiz.id,
        trainee_id: profile.id,
        score: 0,
        passed: false,
        started_at: new Date().toISOString(),
        attempt_number: (count ?? 0) + 1,
      })
      .select()
      .single();

    setState(s => s ? { ...s, phase: 'active', attemptId: attempt?.id ?? null } : s);
  };

  const selectAnswer = (questionId: string, optionId: string) => {
    setState(s => {
      if (!s) return s;
      const newAnswers = new Map(s.answers);
      newAnswers.set(questionId, optionId);
      return { ...s, answers: newAnswers };
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!state || !profile || submitting) return;
    setSubmitting(true);

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;
    const answerInserts: any[] = [];

    for (const q of state.questions) {
      totalPoints += q.points;
      const selectedId = state.answers.get(q.id);
      const selectedOption = q.options.find(o => o.id === selectedId);
      const isCorrect = selectedOption?.is_correct ?? false;
      if (isCorrect) earnedPoints += q.points;

      answerInserts.push({
        attempt_id: state.attemptId,
        question_id: q.id,
        selected_option_id: selectedId ?? null,
        is_correct: isCorrect,
        points_earned: isCorrect ? q.points : 0,
      });
    }

    const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = scorePercent >= state.quiz.passing_score;

    // Save answers FIRST so the DB trigger can calculate the score correctly
    const { error: answersError } = await supabase.from('quiz_answers').insert(answerInserts);
    if (answersError) {
      console.error('Error saving answers:', answersError);
    }

    // THEN update the attempt. The DB trigger will sum the points from the answers.
    await supabase.from('quiz_attempts').update({
      score: scorePercent, // Frontend calculation (will be overridden by DB trigger for security)
      passed,
      completed_at: new Date().toISOString(),
    }).eq('id', state.attemptId);

    setState(s => s ? { ...s, phase: 'result', score: scorePercent, passed } : s);
    setSubmitting(false);
    toast.success(passed ? '🎉 أحسنت! لقد نجحت في الاختبار.' : 'حاولي مجدداً — يمكنك تحقيق نتيجة أفضل!');
  }, [state, profile, submitting]);

  if (loading) return <div className="max-w-2xl mx-auto"><CardSkeleton /></div>;
  if (!state) return null;

  // ── Intro phase ───────────────────────────────────────────────────
  if (state.phase === 'intro') {
    return (
      <div className="max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-8 text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trophy size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">{state.quiz.title_ar}</h1>
          <div className="grid grid-cols-3 gap-4 my-6 text-center">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xl font-black text-primary-600">{state.questions.length}</p>
              <p className="text-xs text-gray-500">سؤال</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xl font-black text-primary-600">{state.quiz.time_limit_minutes}</p>
              <p className="text-xs text-gray-500">دقيقة</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xl font-black text-primary-600">{state.quiz.passing_score}%</p>
              <p className="text-xs text-gray-500">للنجاح</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">اقرئي كل سؤال بعناية واختاري الإجابة الصحيحة. الاختبارات تقييمية ولا توجد إجابات عشوائية.</p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate(-1)} className="flex-1">إلغاء</Button>
            <Button variant="primary" onClick={startQuiz} className="flex-1">بدء الاختبار</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Result phase ──────────────────────────────────────────────────
  if (state.phase === 'result') {
    return (
      <div className="max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-8 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            state.passed ? 'bg-success/15' : 'bg-danger/15'
          }`}>
            {state.passed
              ? <CheckCircle2 size={40} className="text-success" />
              : <XCircle size={40} className="text-danger" />}
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">
            {state.passed ? '🎉 أحسنت! نجحت في الاختبار' : 'حاولي مجدداً'}
          </h1>
          <div className={`text-5xl font-black my-6 ${state.passed ? 'text-success' : 'text-danger'}`}>
            {state.score}%
          </div>
          <p className="text-sm text-gray-500 mb-6">
            {state.passed
              ? `أجبت بشكل صحيح على ${Math.round((state.score / 100) * state.questions.length)} من ${state.questions.length} سؤال`
              : `درجة النجاح المطلوبة: ${state.quiz.passing_score}%`}
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate('/quizzes')} className="flex-1">
              العودة للاختبارات
            </Button>
            <Button variant="primary" onClick={() => navigate(0)} className="flex-1">
              إعادة المحاولة
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Active quiz ───────────────────────────────────────────────────
  const currentQ = state.questions[state.currentIndex];
  const selectedOption = state.answers.get(currentQ.id);
  const progress = ((state.currentIndex + 1) / state.questions.length) * 100;
  const isLast = state.currentIndex === state.questions.length - 1;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Timer + Progress */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600">
          <Clock size={18} />
          <span className={`font-mono font-bold text-lg ${
            state.timeLeft < 60 ? 'text-danger animate-pulse' : ''
          }`}>
            {formatDuration(state.timeLeft * 1000)}
          </span>
        </div>
        <div className="flex-1 mx-6">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className="text-sm text-gray-500 font-medium">
          {state.currentIndex + 1} / {state.questions.length}
        </span>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="card p-6 space-y-5"
        >
          {/* Type badge */}
          <div className="flex items-center justify-between">
            <span className="badge bg-primary-100 text-primary-700">
              {currentQ.question_type === 'scenario' ? '🔍 سيناريو عملي'
               : currentQ.question_type === 'mcq' ? '📋 اختيار من متعدد'
               : currentQ.question_type === 'truefalse' ? '✓ صح أو خطأ'
               : '📐 ترتيب'}
            </span>
            <span className="text-xs text-gray-400">{currentQ.points} نقطة</span>
          </div>

          {/* Scenario context */}
          {currentQ.scenario_context_ar && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs font-bold text-blue-600 mb-2">الموقف:</p>
              <p className="text-sm text-blue-900 leading-relaxed">{currentQ.scenario_context_ar}</p>
            </div>
          )}

          {/* Question text */}
          <h2 className="text-lg font-bold text-gray-900 leading-relaxed">
            {currentQ.question_text_ar}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => {
              const letters = ['أ', 'ب', 'ج', 'د'];
              const isSelected = selectedOption === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => selectAnswer(currentQ.id, opt.id)}
                  className={`quiz-option w-full text-right ${isSelected ? 'selected' : ''}`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    isSelected ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {letters[idx]}
                  </span>
                  <span className="flex-1">{opt.option_text_ar}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setState(s => s ? { ...s, currentIndex: s.currentIndex - 1 } : s)}
          disabled={state.currentIndex === 0}
          icon={<ChevronRight size={16} />}
        >
          السابق
        </Button>

        {isLast ? (
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={submitting}
            className="flex-1"
          >
            إنهاء الاختبار
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() => setState(s => s ? { ...s, currentIndex: s.currentIndex + 1 } : s)}
            iconEnd={<ChevronLeft size={16} />}
          >
            التالي
          </Button>
        )}
      </div>
    </div>
  );
}
