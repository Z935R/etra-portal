import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Eye, Star, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Button, Input, Select, CardSkeleton, EmptyState, Badge, Modal, Textarea
} from '../../components/common';
import { AR, TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, TICKET_CATEGORY_LABELS } from '../../constants/arabic';
import { formatTicketNumber, formatDateAr } from '../../lib/utils';
import { ROUTES } from '../../constants/config';
import type { Ticket as ITicket, Profile, TicketStatus, TicketPriority, TicketCategory } from '../../types';

interface CreateTicketForm {
  title_ar: string;
  description_ar: string;
  requester_name: string;
  requester_department: string;
  device_name: string;
  category: TicketCategory;
  priority: TicketPriority;
  assigned_to: string;
  due_date: string;
  expected_diagnosis_ar: string;
  expected_steps_ar: string;
  expected_resolution_ar: string;
}

const EMPTY_FORM: CreateTicketForm = {
  title_ar: '', description_ar: '', requester_name: '',
  requester_department: '', device_name: '',
  category: 'hardware', priority: 'medium',
  assigned_to: '', due_date: '',
  expected_diagnosis_ar: '', expected_steps_ar: '', expected_resolution_ar: '',
};

export function TicketManagementPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<(ITicket & { assigned_profile?: Profile })[]>([]);
  const [trainees, setTrainees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateTicketForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [ticketsRes, traineesRes] = await Promise.all([
      supabase.from('tickets').select('*, profiles!assigned_to(full_name, id)')
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'trainee'),
    ]);
    setTickets((ticketsRes.data ?? []).map((t: any) => ({
      ...t,
      assigned_profile: t.profiles,
    })) as (ITicket & { assigned_profile?: Profile })[]);
    setTrainees((traineesRes.data ?? []) as Profile[]);
    setLoading(false);
  };

  const saveTicket = async () => {
    if (!form.title_ar || !form.description_ar || !form.assigned_to) {
      return toast.error('يرجى ملء الحقول المطلوبة');
    }
    setSaving(true);
    
    const payload = {
      title_ar: form.title_ar,
      description_ar: form.description_ar,
      requester_name: form.requester_name,
      requester_department: form.requester_department,
      device_name: form.device_name,
      category: form.category,
      priority: form.priority,
      assigned_to: form.assigned_to,
      due_date: form.due_date || null,
      expected_diagnosis_ar: form.expected_diagnosis_ar,
      expected_steps_ar: form.expected_steps_ar,
      expected_resolution_ar: form.expected_resolution_ar,
    };

    if (editingId) {
      await supabase.from('tickets').update(payload).eq('id', editingId);
      toast.success('تم تحديث التذكرة بنجاح');
    } else {
      const { count } = await supabase.from('tickets').select('id', { count: 'exact' });
      await supabase.from('tickets').insert({
        ...payload,
        ticket_number: (count ?? 0) + 1,
        status: 'assigned',
        created_by: profile?.id,
      });
      toast.success('تم إنشاء التذكرة وإسنادها بنجاح');
    }

    setForm(EMPTY_FORM);
    setShowCreate(false);
    setEditingId(null);
    fetchData();
    setSaving(false);
  };

  const deleteTicket = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('هل أنت متأكد من حذف هذه التذكرة؟')) return;
    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('تم الحذف'); fetchData(); }
  };

  const openEditModal = (e: React.MouseEvent, t: ITicket) => {
    e.stopPropagation();
    setForm({
      title_ar: t.title_ar, description_ar: t.description_ar,
      requester_name: t.requester_name || '', requester_department: t.requester_department || '',
      device_name: t.device_name || '', category: t.category, priority: t.priority,
      assigned_to: t.assigned_to || '', due_date: t.due_date ? t.due_date.slice(0, 16) : '',
      expected_diagnosis_ar: t.expected_diagnosis_ar || '',
      expected_steps_ar: t.expected_steps_ar || '',
      expected_resolution_ar: t.expected_resolution_ar || '',
    });
    setEditingId(t.id);
    setShowCreate(true);
  };

  const filtered = tickets.filter(t => {
    const matchSearch = !search ||
      t.title_ar.includes(search) ||
      formatTicketNumber(t.ticket_number).toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || t.status === filterStatus;
    const matchPriority = !filterPriority || t.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const statusClass: Record<string, string> = {
    new: 'status-new', assigned: 'status-assigned', analyzing: 'status-analyzing',
    waiting: 'status-waiting', resolved: 'status-resolved', closed: 'status-closed',
    reopened: 'status-reopened',
  };

  const priorityClass: Record<string, string> = {
    low: 'priority-low', medium: 'priority-medium',
    high: 'priority-high', critical: 'priority-critical',
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">إدارة التذاكر</h1>
          <p className="section-subtitle">أنشئ وتابع تذاكر التدريب وقيّم إجابات المتدربات</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowCreate(true); }}>
          إنشاء تذكرة
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)}
          rightIcon={<Search size={18} />} className="flex-1" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input w-40">
          <option value="">كل الحالات</option>
          {Object.entries(TICKET_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="input w-40">
          <option value="">كل الأولويات</option>
          {Object.entries(TICKET_PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['new', 'analyzing', 'waiting', 'resolved'].map(s => (
          <div key={s} className="card p-4 text-center">
            <div className="text-2xl font-black text-primary-600">
              {tickets.filter(t => t.status === s).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">{TICKET_STATUS_LABELS[s]}</div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <EmptyState icon={<Star size={48} />} title="لا توجد تذاكر" />}

      <div className="space-y-3">
        {filtered.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="card p-4 cursor-pointer"
            onClick={() => navigate(`/admin/tickets/${t.id}`)}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs font-bold text-primary-600">
                    {formatTicketNumber(t.ticket_number)}
                  </span>
                  <span className={statusClass[t.status]}>{TICKET_STATUS_LABELS[t.status]}</span>
                  <span className={priorityClass[t.priority]}>{TICKET_PRIORITY_LABELS[t.priority]}</span>
                  <span className="badge bg-gray-100 text-gray-600 text-xs">{TICKET_CATEGORY_LABELS[t.category]}</span>
                </div>
                <h3 className="font-bold text-gray-900">{t.title_ar}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>مسندة لـ: {t.assigned_profile?.full_name ?? 'غير مسندة'}</span>
                  <span>•</span>
                  <span>{formatDateAr(t.created_at)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between gap-2">
                <Eye size={18} className="text-gray-400 flex-shrink-0" />
                <div className="flex gap-2">
                  <button onClick={(e) => openEditModal(e, t)} className="text-gray-400 hover:text-primary transition-colors p-1 bg-white hover:bg-primary-50 rounded" title="تعديل">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={(e) => deleteTicket(e, t.id)} className="text-gray-400 hover:text-danger transition-colors p-1 bg-white hover:bg-danger-50 rounded" title="حذف">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create ticket modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={editingId ? "تعديل التذكرة" : "إنشاء تذكرة جديدة"}
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>إلغاء</Button>
            <Button variant="primary" loading={saving} onClick={saveTicket}>{editingId ? 'حفظ التعديلات' : 'إنشاء التذكرة'}</Button>
          </>
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">عنوان التذكرة *</label>
              <input className="input" value={form.title_ar}
                onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="label">وصف المشكلة *</label>
              <textarea className="input resize-none" rows={3} value={form.description_ar}
                onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} />
            </div>
            <div>
              <label className="label">اسم المُبلِّغ</label>
              <input className="input" value={form.requester_name}
                onChange={e => setForm(f => ({ ...f, requester_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">القسم</label>
              <input className="input" value={form.requester_department}
                onChange={e => setForm(f => ({ ...f, requester_department: e.target.value }))} />
            </div>
            <div>
              <label className="label">اسم الجهاز</label>
              <input className="input" value={form.device_name}
                onChange={e => setForm(f => ({ ...f, device_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">التصنيف</label>
              <select className="input" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as TicketCategory }))}>
                {Object.entries(TICKET_CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">الأولوية</label>
              <select className="input" value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as TicketPriority }))}>
                {Object.entries(TICKET_PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">إسناد إلى *</label>
              <select className="input" value={form.assigned_to}
                onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                <option value="">اختر متدربة...</option>
                {trainees.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">الموعد النهائي</label>
              <input className="input" type="datetime-local" value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>

          {/* Hidden expected answers */}
          <hr className="border-primary-100" />
          <p className="text-sm font-bold text-primary-700 flex items-center gap-2">
            🔒 الإجابات المتوقعة (للمشرف فقط — مخفية عن المتدربة)
          </p>
          <div>
            <label className="label">التشخيص المتوقع</label>
            <textarea className="input resize-none" rows={2} value={form.expected_diagnosis_ar}
              onChange={e => setForm(f => ({ ...f, expected_diagnosis_ar: e.target.value }))} />
          </div>
          <div>
            <label className="label">الخطوات المتوقعة</label>
            <textarea className="input resize-none" rows={3} value={form.expected_steps_ar}
              onChange={e => setForm(f => ({ ...f, expected_steps_ar: e.target.value }))} />
          </div>
          <div>
            <label className="label">الحل المتوقع</label>
            <textarea className="input resize-none" rows={2} value={form.expected_resolution_ar}
              onChange={e => setForm(f => ({ ...f, expected_resolution_ar: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
