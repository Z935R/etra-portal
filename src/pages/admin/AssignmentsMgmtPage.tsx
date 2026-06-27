import React, { useEffect, useState } from 'react';
import { FileText, Plus, Edit2, Trash2, Users, Download, CheckCircle, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button, Input, Modal, Textarea, CardSkeleton } from '../../components/common';
import { toast } from 'sonner';

export function AssignmentsMgmtPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [weeks, setWeeks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Submissions Modal State
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch weeks for the dropdown
    const { data: weeksData } = await supabase.from('training_weeks').select('id, title_ar, week_number').order('week_number');
    setWeeks(weeksData || []);

    // Fetch assignments
    const { data: assignmentsData } = await supabase
      .from('assignments')
      .select('*, training_weeks(title_ar, week_number)')
      .order('created_at', { ascending: false });

    setAssignments(assignmentsData || []);
    setLoading(false);
  };

  const viewSubmissions = async (assignment: any) => {
    setSelectedAssignment(assignment);
    setShowSubModal(true);
    setLoadingSubs(true);
    const { data } = await supabase
      .from('assignment_submissions')
      .select('*, profiles!trainee_id(full_name, email)')
      .eq('assignment_id', assignment.id)
      .order('submitted_at', { ascending: false });
    setSubmissions(data || []);
    setLoadingSubs(false);
  };

  const saveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { 
      week_id: form.week_id, 
      title_ar: form.title_ar, 
      instructions_ar: form.instructions_ar,
      due_date: form.due_date || null,
      max_score: form.max_score || 100,
      submission_type: form.submission_type || 'text',
    };

    let error;
    if (form.id) {
      ({ error } = await supabase.from('assignments').update(payload).eq('id', form.id));
    } else {
      ({ error } = await supabase.from('assignments').insert(payload));
    }

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('تم الحفظ بنجاح');
    setShowModal(false);
    fetchData();
  };

  const deleteAssignment = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المهمة؟ سيتم حذف جميع تسليمات المتدربات!')) return;
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('تم الحذف'); fetchData(); }
  };

  if (loading) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">إدارة المهام</h1>
          <p className="section-subtitle">أنشئ وعدل المهام الأسبوعية (Assignments)</p>
        </div>
        <Button onClick={() => { setForm({ submission_type: 'both' }); setShowModal(true); }}>
          <Plus size={18} className="ml-2" /> إضافة مهمة جديدة
        </Button>
      </div>

      <div className="space-y-4">
        {assignments.map(assignment => (
          <div key={assignment.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{assignment.title_ar}</h2>
                  <p className="text-sm text-gray-500">
                    الأسبوع {assignment.training_weeks?.week_number} - {assignment.training_weeks?.title_ar}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => viewSubmissions(assignment)} className="text-primary-600 hover:bg-primary-50 p-2 rounded-lg" title="عرض التسليمات">
                  <Users size={18} />
                </button>
                <button onClick={() => { setForm(assignment); setShowModal(true); }} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg" title="تعديل">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => deleteAssignment(assignment.id)} className="text-danger hover:bg-danger-50 p-2 rounded-lg" title="حذف">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {assignments.length === 0 && (
          <div className="text-center text-gray-500 py-10">لا توجد مهام حالياً</div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={form.id ? "تعديل مهمة" : "إضافة مهمة"}>
        <form onSubmit={saveAssignment} className="space-y-4">
          <div>
            <label className="label">الأسبوع التدريبي</label>
            <select className="input" value={form.week_id || ''} onChange={e => setForm({...form, week_id: e.target.value})} required>
              <option value="">اختر الأسبوع...</option>
              {weeks.map(w => <option key={w.id} value={w.id}>الأسبوع {w.week_number}: {w.title_ar}</option>)}
            </select>
          </div>
          <Input label="عنوان المهمة" value={form.title_ar || ''} onChange={e => setForm({...form, title_ar: e.target.value})} required />
          <Textarea label="تعليمات المهمة" value={form.instructions_ar || ''} onChange={e => setForm({...form, instructions_ar: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="الدرجة القصوى" type="number" value={form.max_score || ''} onChange={e => setForm({...form, max_score: +e.target.value})} />
            <Input label="تاريخ التسليم" type="datetime-local" value={form.due_date ? form.due_date.slice(0, 16) : ''} onChange={e => setForm({...form, due_date: e.target.value})} />
          </div>
          <div>
            <label className="label">نوع التسليم</label>
            <select className="input" value={form.submission_type || 'text'} onChange={e => setForm({...form, submission_type: e.target.value})}>
              <option value="text">نص فقط</option>
              <option value="file">ملف فقط</option>
              <option value="both">نص أو ملف</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving} className="flex-1">حفظ</Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">إلغاء</Button>
          </div>
        </form>
      </Modal>

      {/* Submissions Modal */}
      <Modal open={showSubModal} onClose={() => setShowSubModal(false)} title={`تسليمات: ${selectedAssignment?.title_ar}`}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {loadingSubs ? (
            <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
          ) : submissions.length === 0 ? (
            <div className="text-center text-gray-500 py-10">لا توجد تسليمات لهذه المهمة حتى الآن.</div>
          ) : (
            submissions.map(sub => (
              <div key={sub.id} className="card p-4 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{sub.profiles?.full_name || 'طالب غير معروف'}</h3>
                    <p className="text-xs text-gray-500">{sub.profiles?.email}</p>
                  </div>
                  <div className="text-xs px-2 py-1 bg-gray-100 rounded-lg text-gray-600">
                    {new Date(sub.submitted_at || sub.created_at).toLocaleDateString('ar-SA')}
                  </div>
                </div>
                
                {sub.text_content && (
                  <div className="bg-gray-50 p-3 rounded-xl mb-3 text-sm text-gray-700 whitespace-pre-wrap">
                    <div className="flex items-center gap-2 mb-2 text-primary-600 font-semibold"><MessageSquare size={14}/> إجابة المتدربة:</div>
                    {sub.text_content}
                  </div>
                )}
                
                {sub.file_url && (
                  <div className="mb-3">
                    <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-2 rounded-lg transition-colors font-semibold">
                      <Download size={16} />
                      تحميل الملف المرفق
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2 pt-3 border-t border-gray-100">
                  <div className="flex-1 flex items-center gap-2">
                    <CheckCircle size={16} className={sub.grade ? "text-success" : "text-gray-300"} />
                    <span className="text-sm font-semibold text-gray-700">الدرجة: {sub.grade ?? 'لم تقيم'} / {selectedAssignment?.max_score}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
