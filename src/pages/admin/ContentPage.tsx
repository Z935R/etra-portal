import React, { useEffect, useState } from 'react';
import { BookOpen, ChevronDown, ChevronLeft, Plus, Edit2, Trash2, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button, Input, Modal, Textarea, CardSkeleton } from '../../components/common';
import { toast } from 'sonner';

export function ContentPage() {
  const [weeks, setWeeks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [expandedMod, setExpandedMod] = useState<string | null>(null);

  // Modals state
  const [showWeekModal, setShowWeekModal] = useState(false);
  const [showModModal, setShowModModal] = useState(false);
  const [showLessModal, setShowLessModal] = useState(false);
  
  // Forms state
  const [weekForm, setWeekForm] = useState<any>({});
  const [modForm, setModForm] = useState<any>({});
  const [lessForm, setLessForm] = useState<any>({});
  
  // Track selected IDs for nesting
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [selectedModId, setSelectedModId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingVideo(true);
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
      const { error } = await supabase.storage.from('lessons').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('lessons').getPublicUrl(fileName);
      setLessForm({ ...lessForm, video_url: data.publicUrl });
      toast.success('تم رفع الفيديو بنجاح');
    } catch (err: any) {
      toast.error('حدث خطأ أثناء رفع الفيديو: ' + err.message);
    } finally {
      setUploadingVideo(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch all nested
    const { data: weeksData } = await supabase
      .from('training_weeks')
      .select('*, modules(*, lessons(*))')
      .order('week_number', { ascending: true });
    
    // Sort modules and lessons
    const sortedWeeks = (weeksData || []).map((w: any) => ({
      ...w,
      modules: (w.modules || []).sort((a: any, b: any) => a.order_index - b.order_index).map((m: any) => ({
        ...m,
        lessons: (m.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index)
      }))
    }));

    setWeeks(sortedWeeks);
    setLoading(false);
  };

  // --- WEEKS CRUD ---
  const saveWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { 
      week_number: weekForm.week_number, 
      title_ar: weekForm.title_ar, 
      title_en: weekForm.title_en,
      description_ar: weekForm.description_ar 
    };

    let error;
    if (weekForm.id) {
      ({ error } = await supabase.from('training_weeks').update(payload).eq('id', weekForm.id));
    } else {
      ({ error } = await supabase.from('training_weeks').insert(payload));
    }

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('تم الحفظ بنجاح');
    setShowWeekModal(false);
    fetchData();
  };

  const deleteWeek = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الأسبوع؟ سيتم حذف جميع الوحدات والدروس المرتبطة به!')) return;
    const { error } = await supabase.from('training_weeks').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('تم الحذف'); fetchData(); }
  };

  // --- MODULES CRUD ---
  const saveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { 
      week_id: selectedWeekId,
      title_ar: modForm.title_ar, 
      title_en: modForm.title_en,
      description_ar: modForm.description_ar,
      order_index: modForm.order_index || 0
    };

    let error;
    if (modForm.id) {
      ({ error } = await supabase.from('modules').update(payload).eq('id', modForm.id));
    } else {
      ({ error } = await supabase.from('modules').insert(payload));
    }

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('تم الحفظ بنجاح');
    setShowModModal(false);
    fetchData();
  };

  const deleteModule = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الوحدة؟ سيتم حذف جميع الدروس المرتبطة بها!')) return;
    const { error } = await supabase.from('modules').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('تم الحذف'); fetchData(); }
  };

  // --- LESSONS CRUD ---
  const saveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { 
      module_id: selectedModId,
      title_ar: lessForm.title_ar, 
      title_en: lessForm.title_en,
      content_ar: lessForm.content_ar,
      video_url: lessForm.video_url,
      duration_minutes: lessForm.duration_minutes || 0,
      order_index: lessForm.order_index || 0,
      objectives_ar: lessForm.objectives_ar,
      practical_activity_ar: lessForm.practical_activity_ar
    };

    let error;
    if (lessForm.id) {
      ({ error } = await supabase.from('lessons').update(payload).eq('id', lessForm.id));
    } else {
      ({ error } = await supabase.from('lessons').insert(payload));
    }

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('تم الحفظ بنجاح');
    setShowLessModal(false);
    fetchData();
  };

  const deleteLesson = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الدرس؟')) return;
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('تم الحذف'); fetchData(); }
  };


  if (loading) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">إدارة المحتوى</h1>
          <p className="section-subtitle">عرض وإدارة محتوى الأسابيع التدريبية</p>
        </div>
        <Button onClick={() => { setWeekForm({ week_number: weeks.length + 1 }); setShowWeekModal(true); }}>
          <Plus size={18} className="ml-2" /> إضافة أسبوع تدريبي
        </Button>
      </div>

      <div className="space-y-4">
        {weeks.map(week => (
          <div key={week.id} className="card overflow-hidden">
            <div className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors border-b border-gray-50">
              <button
                onClick={() => setExpandedWeek(expandedWeek === week.id ? null : week.id)}
                className="flex-1 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center text-white font-black text-xl">
                    {week.week_number}
                  </div>
                  <div className="text-right">
                    <h2 className="font-bold text-gray-900">الأسبوع {week.week_number}</h2>
                    <p className="text-sm text-gray-500">{week.title_ar}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4">
                  <span className="text-sm text-gray-400">{week.modules.length} وحدات</span>
                  <ChevronLeft size={20} className={`text-gray-400 transition-transform ${expandedWeek === week.id ? 'rotate-90' : ''}`} />
                </div>
              </button>
              
              <div className="flex items-center gap-2">
                <button onClick={() => { setSelectedWeekId(week.id); setModForm({ order_index: week.modules.length + 1 }); setShowModModal(true); }} className="text-primary hover:bg-primary-50 p-2 rounded-lg" title="إضافة وحدة">
                  <Plus size={18} />
                </button>
                <button onClick={() => { setWeekForm(week); setShowWeekModal(true); }} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg" title="تعديل">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => deleteWeek(week.id)} className="text-danger hover:bg-danger-50 p-2 rounded-lg" title="حذف">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {expandedWeek === week.id && (
              <div className="bg-gray-50/50">
                {week.modules.map((mod: any, mi: number) => (
                  <div key={mod.id} className="border-b border-gray-100 last:border-0">
                    <div className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
                      <button
                        onClick={() => setExpandedMod(expandedMod === mod.id ? null : mod.id)}
                        className="flex-1 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-xs font-bold">
                            {mi + 1}
                          </span>
                          <span className="font-semibold text-gray-800 text-sm">{mod.title_ar}</span>
                        </div>
                        <div className="flex items-center gap-2 px-4">
                          <span className="text-xs text-gray-400">{mod.lessons.length} دروس</span>
                          <ChevronLeft size={16} className={`text-gray-400 transition-transform ${expandedMod === mod.id ? 'rotate-90' : ''}`} />
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        <button onClick={() => { setSelectedModId(mod.id); setLessForm({ order_index: mod.lessons.length + 1 }); setShowLessModal(true); }} className="text-primary hover:bg-primary-50 p-1.5 rounded-lg" title="إضافة درس">
                          <Plus size={16} />
                        </button>
                        <button onClick={() => { setModForm(mod); setSelectedWeekId(week.id); setShowModModal(true); }} className="text-gray-500 hover:bg-gray-100 p-1.5 rounded-lg" title="تعديل">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteModule(mod.id)} className="text-danger hover:bg-danger-50 p-1.5 rounded-lg" title="حذف">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {expandedMod === mod.id && (
                      <div className="px-6 pb-3 space-y-1.5">
                        {mod.lessons.map((lesson: any, li: number) => (
                          <div key={lesson.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 text-sm text-gray-700 transition-all">
                            <div className="flex items-center gap-3">
                              <span className="w-5 h-5 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-xs">
                                {li + 1}
                              </span>
                              <BookOpen size={14} className="text-primary-400" />
                              <span>{lesson.title_ar}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity" style={{ opacity: 1 }}>
                               <button onClick={() => { setLessForm(lesson); setSelectedModId(mod.id); setShowLessModal(true); }} className="text-gray-500 hover:text-primary p-1" title="تعديل">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => deleteLesson(lesson.id)} className="text-gray-500 hover:text-danger p-1" title="حذف">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Week Modal */}
      <Modal open={showWeekModal} onClose={() => setShowWeekModal(false)} title={weekForm.id ? "تعديل أسبوع" : "إضافة أسبوع"}>
        <form onSubmit={saveWeek} className="space-y-4">
          <Input label="رقم الأسبوع" type="number" value={weekForm.week_number || ''} onChange={e => setWeekForm({...weekForm, week_number: +e.target.value})} required />
          <Input label="العنوان (بالعربية)" value={weekForm.title_ar || ''} onChange={e => setWeekForm({...weekForm, title_ar: e.target.value})} required />
          <Input label="العنوان (بالإنجليزية)" value={weekForm.title_en || ''} onChange={e => setWeekForm({...weekForm, title_en: e.target.value})} />
          <Textarea label="الوصف" value={weekForm.description_ar || ''} onChange={e => setWeekForm({...weekForm, description_ar: e.target.value})} />
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving} className="flex-1">حفظ</Button>
            <Button type="button" variant="secondary" onClick={() => setShowWeekModal(false)} className="flex-1">إلغاء</Button>
          </div>
        </form>
      </Modal>

      {/* Module Modal */}
      <Modal open={showModModal} onClose={() => setShowModModal(false)} title={modForm.id ? "تعديل وحدة" : "إضافة وحدة"}>
        <form onSubmit={saveModule} className="space-y-4">
          <Input label="الترتيب" type="number" value={modForm.order_index || ''} onChange={e => setModForm({...modForm, order_index: +e.target.value})} required />
          <Input label="العنوان (بالعربية)" value={modForm.title_ar || ''} onChange={e => setModForm({...modForm, title_ar: e.target.value})} required />
          <Input label="العنوان (بالإنجليزية)" value={modForm.title_en || ''} onChange={e => setModForm({...modForm, title_en: e.target.value})} />
          <Textarea label="الوصف" value={modForm.description_ar || ''} onChange={e => setModForm({...modForm, description_ar: e.target.value})} />
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving} className="flex-1">حفظ</Button>
            <Button type="button" variant="secondary" onClick={() => setShowModModal(false)} className="flex-1">إلغاء</Button>
          </div>
        </form>
      </Modal>

      {/* Lesson Modal */}
      <Modal open={showLessModal} onClose={() => setShowLessModal(false)} title={lessForm.id ? "تعديل درس" : "إضافة درس"}>
        <form onSubmit={saveLesson} className="space-y-4 max-h-[70vh] overflow-y-auto px-2">
          <Input label="الترتيب" type="number" value={lessForm.order_index || ''} onChange={e => setLessForm({...lessForm, order_index: +e.target.value})} required />
          <Input label="العنوان (بالعربية)" value={lessForm.title_ar || ''} onChange={e => setLessForm({...lessForm, title_ar: e.target.value})} required />
          <Input label="العنوان (بالإنجليزية)" value={lessForm.title_en || ''} onChange={e => setLessForm({...lessForm, title_en: e.target.value})} />
          <Textarea label="المحتوى (بالعربية)" value={lessForm.content_ar || ''} onChange={e => setLessForm({...lessForm, content_ar: e.target.value})} />
          <div>
            <Input label="رابط الفيديو (يوتيوب أو رابط مباشر)" value={lessForm.video_url || ''} onChange={e => setLessForm({...lessForm, video_url: e.target.value})} />
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">أو</span>
              <label className="cursor-pointer bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-primary-100 transition-colors">
                <Upload size={14} />
                {uploadingVideo ? 'جاري الرفع...' : 'رفع مقطع محلي'}
                <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={uploadingVideo} />
              </label>
            </div>
          </div>
          <Input label="المدة (بالدقائق)" type="number" value={lessForm.duration_minutes || ''} onChange={e => setLessForm({...lessForm, duration_minutes: +e.target.value})} />
          <Textarea label="الأهداف" value={lessForm.objectives_ar || ''} onChange={e => setLessForm({...lessForm, objectives_ar: e.target.value})} />
          <Textarea label="النشاط العملي" value={lessForm.practical_activity_ar || ''} onChange={e => setLessForm({...lessForm, practical_activity_ar: e.target.value})} />
          <div className="flex gap-2 pt-2 pb-4">
            <Button type="submit" loading={saving} className="flex-1">حفظ</Button>
            <Button type="button" variant="secondary" onClick={() => setShowLessModal(false)} className="flex-1">إلغاء</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
