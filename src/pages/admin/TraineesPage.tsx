import React, { useEffect, useState } from 'react';
import { Users, BarChart2, Ticket, CheckCircle2, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { CardSkeleton, Avatar, Badge, Button, Input, Modal } from '../../components/common';
import { ProgressBar } from '../../components/common';
import { toast } from 'sonner';
import type { Profile } from '../../types';

interface TraineeRow extends Profile {
  completedLessons: number;
  totalLessons: number;
  openTickets: number;
  avgScore: number;
}

export function TraineesPage() {
  const [trainees, setTrainees] = useState<TraineeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTrainees(); }, []);

  const fetchTrainees = async () => {
    const { data: profiles } = await supabase
      .from('profiles').select('*').eq('role', 'trainee');

    const { count: totalLessons } = await supabase
      .from('lessons').select('id', { count: 'exact' }).eq('is_published', true);

    const enriched = await Promise.all(
      (profiles ?? []).map(async (p: Profile) => {
        const [progressRes, ticketsRes, quizRes] = await Promise.all([
          supabase.from('lesson_progress').select('id', { count: 'exact' })
            .eq('trainee_id', p.id).eq('is_completed', true),
          supabase.from('tickets').select('id', { count: 'exact' })
            .eq('assigned_to', p.id).not('status', 'in', '("closed","resolved")'),
          supabase.from('quiz_attempts').select('score')
            .eq('trainee_id', p.id).not('completed_at', 'is', null),
        ]);
        const scores = (quizRes.data ?? []).map((a: { score: number }) => a.score);
        const avgScore = scores.length
          ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
          : 0;
        return {
          ...p,
          completedLessons: progressRes.count ?? 0,
          totalLessons: totalLessons ?? 0,
          openTickets: ticketsRes.count ?? 0,
          avgScore,
        };
      })
    );
    setTrainees(enriched as TraineeRow[]);
    setLoading(false);
  };

  const handleCreateTrainee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.full_name || !addForm.email || !addForm.password) return toast.error('يرجى تعبئة جميع الحقول');
    
    setSaving(true);
    const { error } = await supabase.rpc('admin_create_user', {
      p_email: addForm.email,
      p_password: addForm.password,
      p_full_name: addForm.full_name
    });

    setSaving(false);
    if (error) {
      toast.error('حدث خطأ أثناء إنشاء الحساب: ' + error.message);
    } else {
      toast.success('تمت إضافة المتدربة بنجاح');
      setShowAddModal(false);
      setAddForm({ full_name: '', email: '', password: '' });
      setLoading(true);
      fetchTrainees();
    }
  };

  const handleDisableTrainee = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في تعطيل حساب المتدربة ${name}؟ لن تتمكن من تسجيل الدخول بعد الآن.`)) return;
    
    const { error } = await supabase.rpc('admin_disable_user', { p_user_id: id });
    if (error) {
      toast.error('حدث خطأ أثناء تعطيل الحساب');
    } else {
      toast.success('تم تعطيل الحساب بنجاح');
      setTrainees(prev => prev.filter(t => t.id !== id));
    }
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">المتدربات</h1>
          <p className="section-subtitle">متابعة أداء وتقدم المتدربات</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>إضافة متدربة</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {trainees.map((t, i) => {
          const progress = t.totalLessons > 0
            ? Math.round((t.completedLessons / t.totalLessons) * 100)
            : 0;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={t.full_name} size="lg" />
                <div>
                  <p className="font-bold text-gray-900">{t.full_name}</p>
                  <p className="text-xs text-gray-400">{t.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 flex items-center gap-1">
                      <BookOpen size={12} /> إكمال الدروس
                    </span>
                    <span className="font-bold">{t.completedLessons}/{t.totalLessons}</span>
                  </div>
                  <ProgressBar value={progress} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-primary-50 rounded-xl p-2">
                    <p className="text-lg font-black text-primary-600">{t.avgScore}%</p>
                    <p className="text-[10px] text-gray-500">متوسط الاختبارات</p>
                  </div>
                  <div className="bg-warning/10 rounded-xl p-2">
                    <p className="text-lg font-black text-warning">{t.openTickets}</p>
                    <p className="text-[10px] text-gray-500">تذاكر مفتوحة</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Table view */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-700">جدول المتدربات</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>المتدربة</th>
                <th>إكمال الدروس</th>
                <th>متوسط الاختبارات</th>
                <th>التذاكر المفتوحة</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {trainees.map(t => {
                const progress = t.totalLessons > 0
                  ? Math.round((t.completedLessons / t.totalLessons) * 100)
                  : 0;
                return (
                  <tr key={t.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={t.full_name} size="sm" />
                        <span className="font-medium">{t.full_name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={progress} />
                        <span className="text-xs text-gray-500 w-12">{progress}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`font-bold ${
                        t.avgScore >= 80 ? 'text-success' :
                        t.avgScore >= 60 ? 'text-warning' : 'text-danger'
                      }`}>{t.avgScore}%</span>
                    </td>
                    <td>{t.openTickets}</td>
                    <td>
                      <Badge variant={progress > 50 ? 'success' : 'warning'}>
                        {progress > 50 ? 'متقدمة' : 'تحتاج متابعة'}
                      </Badge>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleDisableTrainee(t.id, t.full_name)}
                        className="text-danger hover:text-danger-600 bg-danger-50 hover:bg-danger-100 p-2 rounded-lg transition-colors text-xs font-bold"
                      >
                        تعطيل
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="إضافة متدربة جديدة">
        <form onSubmit={handleCreateTrainee} className="space-y-4">
          <Input 
            label="الاسم الرباعي" 
            placeholder="مثال: نورة محمد العتيبي"
            value={addForm.full_name}
            onChange={e => setAddForm({...addForm, full_name: e.target.value})}
          />
          <Input 
            label="البريد الإلكتروني" 
            type="email"
            placeholder="مثال: noura@etra.sa"
            value={addForm.email}
            onChange={e => setAddForm({...addForm, email: e.target.value})}
          />
          <Input 
            label="كلمة المرور" 
            type="password"
            placeholder="كلمة مرور الدخول"
            value={addForm.password}
            onChange={e => setAddForm({...addForm, password: e.target.value})}
          />
          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={saving} className="flex-1">حفظ وإنشاء الحساب</Button>
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">إلغاء</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
