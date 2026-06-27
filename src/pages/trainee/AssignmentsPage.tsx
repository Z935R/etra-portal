import React, { useEffect, useState } from 'react';
import { FileText, Upload, Send, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Textarea, Badge, CardSkeleton, EmptyState } from '../../components/common';
import { AR } from '../../constants/arabic';
import { formatDateAr } from '../../lib/utils';
import type { Assignment, AssignmentSubmission } from '../../types';

interface AssignmentWithSubmission extends Assignment {
  submission?: AssignmentSubmission;
}

export function AssignmentsPage() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (profile) fetchAssignments(); }, [profile]);

  const fetchAssignments = async () => {
    if (!profile) return;
    const [assignRes, subRes] = await Promise.all([
      supabase.from('assignments').select('*').eq('is_published', true).order('due_date'),
      supabase.from('assignment_submissions').select('*').eq('trainee_id', profile.id),
    ]);
    const subMap = new Map((subRes.data ?? []).map((s: AssignmentSubmission) => [s.assignment_id, s]));
    setAssignments(
      (assignRes.data ?? []).map((a: Assignment) => ({ ...a, submission: subMap.get(a.id) })) as AssignmentWithSubmission[]
    );
    setLoading(false);
  };

  const submit = async (assignment: AssignmentWithSubmission, isDraft: boolean) => {
    if (!profile) return;
    if (!text.trim() && !fileToUpload && assignment.submission_type !== 'file') {
      return toast.error('يرجى كتابة إجابتك أو إرفاق ملف');
    }
    setSaving(true);
    
    let fileUrl = assignment.submission?.file_url;
    if (fileToUpload) {
      const ext = fileToUpload.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('assignments').upload(fileName, fileToUpload);
      if (error) {
        toast.error('حدث خطأ أثناء رفع الملف');
        setSaving(false);
        return;
      }
      const { data } = supabase.storage.from('assignments').getPublicUrl(fileName);
      fileUrl = data.publicUrl;
    }

    const sub = assignment.submission;
    if (sub) {
      await supabase.from('assignment_submissions').update({
        text_content: text,
        file_url: fileUrl,
        status: isDraft ? 'draft' : 'submitted',
        submitted_at: isDraft ? null : new Date().toISOString(),
      }).eq('id', sub.id);
    } else {
      await supabase.from('assignment_submissions').insert({
        assignment_id: assignment.id,
        trainee_id: profile.id,
        text_content: text,
        file_url: fileUrl,
        status: isDraft ? 'draft' : 'submitted',
        submitted_at: isDraft ? null : new Date().toISOString(),
      });
    }
    toast.success(isDraft ? 'تم الحفظ كمسودة' : 'تم تسليم المهمة! ✓');
    setActiveId(null);
    setText('');
    setFileToUpload(null);
    fetchAssignments();
    setSaving(false);
  };

  const statusBadge = (sub?: AssignmentSubmission) => {
    if (!sub) return <Badge variant="gray">لم تُسلَّم</Badge>;
    if (sub.status === 'graded') return <Badge variant="success">مقيّمة — {sub.grade ?? 0}/{sub.assignment_id ? '' : ''}</Badge>;
    if (sub.status === 'submitted') return <Badge variant="info">مسلّمة</Badge>;
    if (sub.status === 'draft') return <Badge variant="warning">مسودة</Badge>;
    if (sub.status === 'resubmit') return <Badge variant="danger">أعيدي التسليم</Badge>;
    return null;
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">المهام</h1>
        <p className="section-subtitle">سلّمي مهامك في الوقت المحدد لتحصلي على أفضل الدرجات</p>
      </div>

      {assignments.length === 0 && (
        <EmptyState icon={<FileText size={48} />} title={AR.emptyAssignments} />
      )}

      <div className="space-y-4">
        {assignments.map((a, i) => {
          const isActive = activeId === a.id;
          const isGraded = a.submission?.status === 'graded';
          const isPastDue = a.due_date && new Date(a.due_date) < new Date();

          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{a.title_ar}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>الدرجة القصوى: {a.max_score}</span>
                      {a.due_date && (
                        <span className={isPastDue && !isGraded ? 'text-danger font-semibold' : ''}>
                          <Clock size={12} className="inline ml-1" />
                          {formatDateAr(a.due_date)}
                          {isPastDue && ' (منتهي)'}
                        </span>
                      )}
                    </div>
                  </div>
                  {statusBadge(a.submission)}
                </div>

                <p className="text-sm text-gray-600 leading-relaxed mb-4">{a.instructions_ar}</p>

                {/* Grade/feedback */}
                {isGraded && a.submission && (
                  <div className="bg-success/5 border border-success/20 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-success flex items-center gap-2">
                        <CheckCircle2 size={16} /> تم التقييم
                      </span>
                      <span className="text-xl font-black text-success">
                        {a.submission.grade}/{a.max_score}
                      </span>
                    </div>
                    {a.submission.feedback_ar && (
                      <p className="text-sm text-gray-700">{a.submission.feedback_ar}</p>
                    )}
                  </div>
                )}

                {/* Submit form */}
                {!isGraded && (
                  <>
                    {isActive ? (
                      <div className="space-y-3">
                        <Textarea
                          value={text}
                          onChange={e => setText(e.target.value)}
                          placeholder="اكتبي إجابتك هنا..."
                          rows={5}
                        />
                        <div className="flex items-center gap-2 mb-3 text-sm">
                          <label className="cursor-pointer bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 hover:bg-primary-100 transition-colors">
                            <Upload size={14} />
                            إرفاق ملف
                            <input type="file" className="hidden" onChange={e => e.target.files && setFileToUpload(e.target.files[0])} />
                          </label>
                          {fileToUpload && <span className="text-gray-600">{fileToUpload.name}</span>}
                          {!fileToUpload && a.submission?.file_url && (
                            <a href={a.submission.file_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                              الملف المرفق مسبقاً
                            </a>
                          )}
                        </div>
                        <div className="flex gap-3 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => { setActiveId(null); setFileToUpload(null); }}>إلغاء</Button>
                          <Button variant="secondary" size="sm" loading={saving} onClick={() => submit(a, true)}>
                            حفظ مسودة
                          </Button>
                          <Button variant="primary" size="sm" loading={saving} onClick={() => submit(a, false)} icon={<Send size={14} />}>
                            تسليم
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setActiveId(a.id);
                          setText(a.submission?.text_content ?? '');
                        }}
                        disabled={Boolean(isPastDue) && !a.submission}
                      >
                        {a.submission?.status === 'draft' || a.submission?.status === 'resubmit'
                          ? 'تعديل وتسليم'
                          : a.submission?.status === 'submitted'
                          ? 'عرض التسليم'
                          : 'تسليم المهمة'}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
