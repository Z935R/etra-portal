import React, { useEffect, useState } from 'react';
import { HelpCircle, Plus, Edit2, Trash2, ChevronLeft, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button, Input, Modal, Textarea, CardSkeleton } from '../../components/common';
import { toast } from 'sonner';

export function QuizzesMgmtPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);

  // Modals state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  
  // Forms state
  const [quizForm, setQuizForm] = useState<any>({});
  const [questionForm, setQuestionForm] = useState<any>({});
  const [optionsForm, setOptionsForm] = useState<{id?: string, text: string, is_correct: boolean}[]>([
    { text: '', is_correct: true },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ]);
  
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch modules for the dropdown
    const { data: modsData } = await supabase.from('modules').select('id, title_ar');
    setModules(modsData || []);

    // Fetch quizzes with nested questions and options
    const { data: quizzesData } = await supabase
      .from('quizzes')
      .select('*, modules(title_ar), quiz_questions(*, quiz_options(*))');
    
    // Sort questions
    const sortedQuizzes = (quizzesData || []).map((q: any) => ({
      ...q,
      quiz_questions: (q.quiz_questions || []).sort((a: any, b: any) => a.order_index - b.order_index)
    }));

    setQuizzes(sortedQuizzes);
    setLoading(false);
  };

  // --- QUIZZES CRUD ---
  const saveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { 
      module_id: quizForm.module_id, 
      title_ar: quizForm.title_ar, 
      passing_score: quizForm.passing_score || 70,
      time_limit_minutes: quizForm.time_limit_minutes || 30,
      max_attempts: quizForm.max_attempts || 3,
    };

    let error;
    if (quizForm.id) {
      ({ error } = await supabase.from('quizzes').update(payload).eq('id', quizForm.id));
    } else {
      ({ error } = await supabase.from('quizzes').insert(payload));
    }

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('تم الحفظ بنجاح');
    setShowQuizModal(false);
    fetchData();
  };

  const deleteQuiz = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الاختبار؟ سيتم حذف جميع أسئلته!')) return;
    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('تم الحذف'); fetchData(); }
  };

  // --- QUESTIONS CRUD ---
  const saveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (optionsForm.filter(o => o.text.trim()).length < 2) return toast.error('يجب إدخال خيارين على الأقل');
    if (!optionsForm.some(o => o.is_correct)) return toast.error('يجب تحديد إجابة صحيحة واحدة على الأقل');

    setSaving(true);
    const qPayload = { 
      quiz_id: selectedQuizId,
      question_text_ar: questionForm.question_text_ar, 
      points: questionForm.points || 5,
      order_index: questionForm.order_index || 0,
      question_type: 'mcq'
    };

    let qId = questionForm.id;
    if (qId) {
      const { error } = await supabase.from('quiz_questions').update(qPayload).eq('id', qId);
      if (error) { setSaving(false); return toast.error(error.message); }
    } else {
      const { data, error } = await supabase.from('quiz_questions').insert(qPayload).select().single();
      if (error) { setSaving(false); return toast.error(error.message); }
      qId = data.id;
    }

    // Save options (delete old ones and insert new)
    await supabase.from('quiz_options').delete().eq('question_id', qId);
    
    const validOptions = optionsForm.filter(o => o.text.trim()).map(o => ({
      question_id: qId,
      option_text_ar: o.text.trim(),
      is_correct: o.is_correct
    }));

    const { error: optError } = await supabase.from('quiz_options').insert(validOptions);
    
    setSaving(false);
    if (optError) return toast.error(optError.message);
    
    toast.success('تم الحفظ بنجاح');
    setShowQuestionModal(false);
    fetchData();
  };

  const deleteQuestion = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
    const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('تم الحذف'); fetchData(); }
  };

  if (loading) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">إدارة الاختبارات</h1>
          <p className="section-subtitle">أنشئ وعدل الاختبارات وأسئلتها</p>
        </div>
        <Button onClick={() => { setQuizForm({}); setShowQuizModal(true); }}>
          <Plus size={18} className="ml-2" /> إضافة اختبار جديد
        </Button>
      </div>

      <div className="space-y-4">
        {quizzes.map(quiz => (
          <div key={quiz.id} className="card overflow-hidden">
            <div className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors border-b border-gray-50">
              <button
                onClick={() => setExpandedQuiz(expandedQuiz === quiz.id ? null : quiz.id)}
                className="flex-1 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                    <HelpCircle size={24} />
                  </div>
                  <div className="text-right">
                    <h2 className="font-bold text-gray-900">{quiz.title_ar}</h2>
                    <p className="text-sm text-gray-500">الوحدة: {quiz.modules?.title_ar || 'غير محدد'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4">
                  <span className="text-sm text-gray-400">{quiz.quiz_questions.length} أسئلة</span>
                  <ChevronLeft size={20} className={`text-gray-400 transition-transform ${expandedQuiz === quiz.id ? 'rotate-90' : ''}`} />
                </div>
              </button>
              
              <div className="flex items-center gap-2">
                <button onClick={() => { 
                  setSelectedQuizId(quiz.id); 
                  setQuestionForm({ order_index: quiz.quiz_questions.length + 1 }); 
                  setOptionsForm([{text:'', is_correct:true}, {text:'', is_correct:false}, {text:'', is_correct:false}, {text:'', is_correct:false}]);
                  setShowQuestionModal(true); 
                }} className="text-primary hover:bg-primary-50 p-2 rounded-lg" title="إضافة سؤال">
                  <Plus size={18} />
                </button>
                <button onClick={() => { setQuizForm(quiz); setShowQuizModal(true); }} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg" title="تعديل">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => deleteQuiz(quiz.id)} className="text-danger hover:bg-danger-50 p-2 rounded-lg" title="حذف">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {expandedQuiz === quiz.id && (
              <div className="bg-gray-50/50 px-6 py-4 space-y-3">
                {quiz.quiz_questions.map((q: any, qi: number) => (
                  <div key={q.id} className="bg-white p-4 rounded-xl border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {qi + 1}
                        </span>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{q.question_text_ar}</p>
                          <div className="mt-3 space-y-2">
                            {q.quiz_options.map((opt: any, oi: number) => (
                              <div key={oi} className={`text-xs px-3 py-1.5 rounded-md ${opt.is_correct ? 'bg-success/10 text-success font-bold' : 'bg-gray-50 text-gray-500'}`}>
                                {opt.option_text_ar}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { 
                          setQuestionForm(q); 
                          setSelectedQuizId(quiz.id); 
                          setOptionsForm(q.quiz_options.map((o:any) => ({ text: o.option_text_ar, is_correct: o.is_correct })));
                          setShowQuestionModal(true); 
                        }} className="text-gray-400 hover:text-primary p-1" title="تعديل">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => deleteQuestion(q.id)} className="text-gray-400 hover:text-danger p-1" title="حذف">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {quiz.quiz_questions.length === 0 && (
                  <div className="text-center text-sm text-gray-400 py-4">لا توجد أسئلة في هذا الاختبار</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quiz Modal */}
      <Modal open={showQuizModal} onClose={() => setShowQuizModal(false)} title={quizForm.id ? "تعديل الاختبار" : "إضافة اختبار"}>
        <form onSubmit={saveQuiz} className="space-y-4">
          <div>
            <label className="label">الوحدة التدريبية</label>
            <select className="input" value={quizForm.module_id || ''} onChange={e => setQuizForm({...quizForm, module_id: e.target.value})} required>
              <option value="">اختر الوحدة...</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.title_ar}</option>)}
            </select>
          </div>
          <Input label="عنوان الاختبار" value={quizForm.title_ar || ''} onChange={e => setQuizForm({...quizForm, title_ar: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="درجة النجاح (%)" type="number" value={quizForm.passing_score || ''} onChange={e => setQuizForm({...quizForm, passing_score: +e.target.value})} />
            <Input label="الوقت (بالدقائق)" type="number" value={quizForm.time_limit_minutes || ''} onChange={e => setQuizForm({...quizForm, time_limit_minutes: +e.target.value})} />
            <Input label="الحد الأقصى للمحاولات" type="number" value={quizForm.max_attempts || ''} onChange={e => setQuizForm({...quizForm, max_attempts: +e.target.value})} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving} className="flex-1">حفظ</Button>
            <Button type="button" variant="secondary" onClick={() => setShowQuizModal(false)} className="flex-1">إلغاء</Button>
          </div>
        </form>
      </Modal>

      {/* Question Modal */}
      <Modal open={showQuestionModal} onClose={() => setShowQuestionModal(false)} title={questionForm.id ? "تعديل سؤال" : "إضافة سؤال"} size="lg">
        <form onSubmit={saveQuestion} className="space-y-4">
          <Input label="الترتيب" type="number" value={questionForm.order_index || ''} onChange={e => setQuestionForm({...questionForm, order_index: +e.target.value})} required />
          <Textarea label="نص السؤال" value={questionForm.question_text_ar || ''} onChange={e => setQuestionForm({...questionForm, question_text_ar: e.target.value})} required />
          <Input label="النقاط" type="number" value={questionForm.points || ''} onChange={e => setQuestionForm({...questionForm, points: +e.target.value})} required />
          
          <div className="pt-2 border-t border-gray-100">
            <label className="label mb-2">الخيارات (اختر الإجابة الصحيحة)</label>
            <div className="space-y-2">
              {optionsForm.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="correct_option" 
                    checked={opt.is_correct} 
                    onChange={() => {
                      const newOpts = [...optionsForm];
                      newOpts.forEach(o => o.is_correct = false);
                      newOpts[idx].is_correct = true;
                      setOptionsForm(newOpts);
                    }}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <input 
                    type="text" 
                    placeholder={`الخيار ${idx + 1}`}
                    value={opt.text}
                    onChange={(e) => {
                      const newOpts = [...optionsForm];
                      newOpts[idx].text = e.target.value;
                      setOptionsForm(newOpts);
                    }}
                    className="input flex-1 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving} className="flex-1">حفظ</Button>
            <Button type="button" variant="secondary" onClick={() => setShowQuestionModal(false)} className="flex-1">إلغاء</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
