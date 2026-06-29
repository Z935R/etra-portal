import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle2, Clock, Target, Zap, Video } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button, CardSkeleton } from '../../components/common';
import type { Lesson, LessonProgress } from '../../types';

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (lessonId && profile) fetchLesson();
  }, [lessonId, profile]);

  const fetchLesson = async () => {
    if (!lessonId || !profile) return;
    try {
      const [lessonRes, progressRes] = await Promise.all([
        supabase.from('lessons').select('*').eq('id', lessonId).single(),
        supabase.from('lesson_progress').select('*')
          .eq('lesson_id', lessonId).eq('trainee_id', profile.id).maybeSingle(),
      ]);
      setLesson(lessonRes.data as Lesson);
      setProgress(progressRes.data as LessonProgress | null);
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async () => {
    if (!lesson || !profile) return;
    setMarking(true);
    const timeSpent = Math.round((Date.now() - startTime) / 60000);

    if (progress) {
      await supabase.from('lesson_progress').update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        time_spent_minutes: timeSpent,
      }).eq('id', progress.id);
    } else {
      await supabase.from('lesson_progress').insert({
        trainee_id: profile.id,
        lesson_id: lesson.id,
        is_completed: true,
        completed_at: new Date().toISOString(),
        time_spent_minutes: timeSpent,
      });
    }

    setProgress(p => p ? { ...p, is_completed: true } : null);
    toast.success('تم تحديد الدرس كمكتمل! 🎉');
    setMarking(false);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <CardSkeleton />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">الدرس غير موجود</p>
      </div>
    );
  }

  const isCompleted = progress?.is_completed;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowRight size={18} />
        <span>العودة لمسار التعلم</span>
      </button>

      {/* Lesson header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">{lesson.title_ar}</h1>
            <p className="text-gray-500 text-sm mt-1">{lesson.title_en}</p>
          </div>
          {isCompleted && (
            <div className="flex items-center gap-2 bg-success/10 text-success px-3 py-1.5 rounded-xl">
              <CheckCircle2 size={16} />
              <span className="text-sm font-semibold">مكتمل</span>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {lesson.duration_minutes && (
            <div className="flex items-center gap-1.5">
              <Clock size={15} />
              <span>{lesson.duration_minutes} دقيقة</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Objectives */}
      {lesson.objectives_ar && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target size={18} className="text-primary-600" />
            <h2 className="font-bold text-gray-800">الأهداف التعليمية</h2>
          </div>
          <div className="space-y-2">
            {lesson.objectives_ar.split('\n').filter(Boolean).map((obj, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-primary-500 font-bold mt-0.5">•</span>
                <span>{obj}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video */}
      {lesson.video_url && (
        <div className="card overflow-hidden">
          <div className="p-4 flex items-center gap-2 border-b border-gray-100">
            <Video size={18} className="text-primary-600" />
            <span className="font-semibold text-gray-800">فيديو الدرس</span>
          </div>
          <div className="aspect-video bg-gray-900 flex items-center justify-center">
            {(lesson.video_url.includes('youtube.com') || lesson.video_url.includes('youtu.be')) ? (
              <iframe
                src={(() => {
                  try {
                    const url = new URL(lesson.video_url);
                    let vId = url.searchParams.get('v');
                    if (url.hostname.includes('youtu.be')) vId = url.pathname.slice(1);
                    return vId ? `https://www.youtube.com/embed/${vId}` : lesson.video_url;
                  } catch { return lesson.video_url; }
                })()}
                className="w-full h-full"
                allowFullScreen
                title={lesson.title_ar}
              />
            ) : (
              <video
                src={lesson.video_url}
                className="w-full h-full outline-none"
                controls
                controlsList="nodownload"
              />
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {lesson.content_ar && (
        <div className="card p-6">
          <div className="prose prose-sm md:prose-base max-w-none text-gray-700 leading-loose marker:text-primary-600 prose-headings:text-gray-900 prose-headings:font-bold prose-img:rounded-xl prose-img:w-full prose-img:shadow-sm prose-a:text-primary-600 prose-strong:text-primary-700" style={{ fontFamily: 'Cairo, sans-serif' }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
            >
              {lesson.content_ar}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Practical Activity */}
      {lesson.practical_activity_ar && (
        <div className="card p-5 border-2 border-primary-200 bg-primary-50/30">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className="text-primary-600" />
            <h2 className="font-bold text-primary-800">النشاط التطبيقي</h2>
          </div>
          <div className="prose prose-sm max-w-none text-primary-900 leading-loose prose-strong:text-primary-800 marker:text-primary-600">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
            >
              {lesson.practical_activity_ar}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Mark complete */}
      <div className="card p-5 flex items-center justify-between">
        <p className="text-gray-600 text-sm">
          {isCompleted ? 'لقد أكملت هذا الدرس بنجاح!' : 'هل انتهيت من قراءة الدرس؟'}
        </p>
        <Button
          variant={isCompleted ? 'secondary' : 'primary'}
          onClick={markComplete}
          loading={marking}
          disabled={isCompleted}
          icon={isCompleted ? <CheckCircle2 size={16} /> : undefined}
        >
          {isCompleted ? 'مكتمل' : 'تحديد كمكتمل'}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)} icon={<ArrowRight size={16} />}>
          الدرس السابق
        </Button>
        <Button variant="secondary" onClick={() => navigate(ROUTES_LEARNING)} iconEnd={<ArrowLeft size={16} />}>
          الدرس التالي
        </Button>
      </div>
    </div>
  );
}

const ROUTES_LEARNING = '/learning';
