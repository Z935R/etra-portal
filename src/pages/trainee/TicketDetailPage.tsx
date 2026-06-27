import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Plus, Send, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, TICKET_CATEGORY_LABELS, AR
} from '../../constants/arabic';
import {
  formatTicketNumber, formatDateTimeAr, getSLAInfo, timeAgoAr
} from '../../lib/utils';
import { Button, Textarea, CardSkeleton, Badge } from '../../components/common';
import { SLATimer } from '../../components/tickets/SLATimer';
import { ActivityTimeline } from '../../components/tickets/ActivityTimeline';
import type { Ticket as ITicket, TicketUpdate, TicketStatus } from '../../types';

const TRAINEE_STATUSES: { value: TicketStatus; label: string }[] = [
  { value: 'analyzing', label: 'قيد التحليل' },
  { value: 'waiting',   label: 'بانتظار المستخدم' },
  { value: 'resolved',  label: 'محلولة' },
];

export function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<ITicket | null>(null);
  const [updates, setUpdates] = useState<TicketUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Trainee fields
  const [diagnosis, setDiagnosis] = useState('');
  const [steps, setSteps] = useState<string[]>(['']);
  const [rootCause, setRootCause] = useState('');
  const [resolution, setResolution] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newStatus, setNewStatus] = useState<TicketStatus | ''>('');

  useEffect(() => {
    if (ticketId && profile) fetchTicket();
  }, [ticketId, profile]);

  const fetchTicket = async () => {
    if (!ticketId || !profile) return;
    const [ticketRes, updatesRes] = await Promise.all([
      supabase.from('tickets').select('*').eq('id', ticketId).single(),
      supabase
        .from('ticket_updates')
        .select('*, profiles!author_id(full_name, role)')
        .eq('ticket_id', ticketId)
        .eq('is_internal', false)
        .order('created_at'),
    ]);
    if (ticketRes.data) {
      const t = ticketRes.data as ITicket;
      setTicket(t);
    }
    if (updatesRes.data) {
      setUpdates(updatesRes.data.map((u: any) => ({
        ...u,
        author: u.profiles,
      })) as TicketUpdate[]);
    }
    setLoading(false);
  };

  const addUpdate = async (type: string, content: string, newSt?: TicketStatus) => {
    if (!ticket || !profile || !content.trim()) return;
    const update: any = {
      ticket_id: ticket.id,
      author_id: profile.id,
      update_type: type,
      content_ar: content.trim(),
      is_internal: false,
    };
    if (newSt) {
      update.old_status = ticket.status;
      update.new_status = newSt;
    }
    await supabase.from('ticket_updates').insert(update);
    if (newSt) {
      await supabase.from('tickets').update({
        status: newSt,
        updated_at: new Date().toISOString(),
      }).eq('id', ticket.id);
      setTicket(t => t ? { ...t, status: newSt } : t);
    }
    await fetchTicket();
  };

  const saveDiagnosis = async () => {
    if (!diagnosis.trim()) return toast.error('يرجى كتابة التشخيص الأولي');
    setSaving(true);
    await addUpdate('diagnosis', `**التشخيص الأولي:**\n${diagnosis}`);
    // Change status to analyzing
    if (ticket?.status === 'new' || ticket?.status === 'assigned') {
      await addUpdate('status_change', 'تم تغيير الحالة إلى قيد التحليل', 'analyzing');
    }
    toast.success('تم حفظ التشخيص');
    setSaving(false);
  };

  const addStep = () => setSteps(s => [...s, '']);
  const updateStep = (i: number, val: string) => {
    setSteps(s => s.map((step, idx) => idx === i ? val : step));
  };
  const removeStep = (i: number) => setSteps(s => s.filter((_, idx) => idx !== i));

  const saveSteps = async () => {
    const validSteps = steps.filter(s => s.trim());
    if (!validSteps.length) return toast.error('أضيفي خطوة واحدة على الأقل');
    setSaving(true);
    const content = `**خطوات استكشاف الأخطاء:**\n${validSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    await addUpdate('note', content);
    toast.success('تم حفظ الخطوات');
    setSaving(false);
  };

  const submitResolution = async () => {
    if (!rootCause.trim() || !resolution.trim()) {
      return toast.error('يرجى كتابة السبب الجذري والحل النهائي');
    }
    setSaving(true);
    const content = `**السبب الجذري:** ${rootCause}\n\n**الحل النهائي:** ${resolution}`;
    await addUpdate('resolution', content, 'resolved');
    toast.success('تم تسليم الحل! سيقوم المشرف بالمراجعة قريباً 🎉');
    setSaving(false);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    await addUpdate('note', newNote);
    setNewNote('');
    toast.success('تمت إضافة الملاحظة');
    setSaving(false);
  };

  const changeStatus = async () => {
    if (!newStatus) return;
    setSaving(true);
    await addUpdate('status_change', `تم تغيير الحالة إلى ${TICKET_STATUS_LABELS[newStatus]}`, newStatus);
    setNewStatus('');
    toast.success('تم تحديث الحالة');
    setSaving(false);
  };

  if (loading) return <div className="max-w-3xl mx-auto space-y-4"><CardSkeleton /></div>;
  if (!ticket) return <div className="text-center py-16 text-gray-500">التذكرة غير موجودة</div>;

  const sla = getSLAInfo(ticket.created_at, ticket.priority);
  const isClosed = ['resolved', 'closed'].includes(ticket.status);

  const statusClass: Record<string, string> = {
    new: 'status-new', assigned: 'status-assigned',
    analyzing: 'status-analyzing', waiting: 'status-waiting',
    resolved: 'status-resolved', closed: 'status-closed', reopened: 'status-reopened',
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowRight size={18} />
        العودة للتذاكر
      </button>

      {/* Ticket Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-mono text-sm font-bold text-primary-600">
                  {formatTicketNumber(ticket.ticket_number)}
                </span>
                <span className={statusClass[ticket.status]}>
                  {TICKET_STATUS_LABELS[ticket.status]}
                </span>
                <span className={`badge ${priorityColors[ticket.priority]}`}>
                  {TICKET_PRIORITY_LABELS[ticket.priority]}
                </span>
                <span className="badge bg-gray-100 text-gray-600">
                  {TICKET_CATEGORY_LABELS[ticket.category]}
                </span>
              </div>
              <h1 className="text-xl font-black text-gray-900">{ticket.title_ar}</h1>
            </div>
            <SLATimer createdAt={ticket.created_at} priority={ticket.priority} compact />
          </div>

          {/* Description */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-500 mb-2">وصف المشكلة:</p>
            <p className="text-sm text-gray-800 leading-relaxed">{ticket.description_ar}</p>
          </div>

          {/* Requester info */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            {ticket.requester_name && (
              <div>
                <p className="text-xs text-gray-400">المُبلِّغ</p>
                <p className="font-semibold text-gray-800">{ticket.requester_name}</p>
              </div>
            )}
            {ticket.requester_department && (
              <div>
                <p className="text-xs text-gray-400">القسم</p>
                <p className="font-semibold text-gray-800">{ticket.requester_department}</p>
              </div>
            )}
            {ticket.device_name && (
              <div>
                <p className="text-xs text-gray-400">الجهاز</p>
                <p className="font-semibold text-gray-800 font-mono">{ticket.device_name}</p>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>أُنشئت: {formatDateTimeAr(ticket.created_at)}</span>
            {ticket.due_date && (
              <span className="text-warning font-semibold">
                موعد التسليم: {formatDateTimeAr(ticket.due_date)}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* SLA full bar */}
      <SLATimer createdAt={ticket.created_at} priority={ticket.priority} />

      {/* ── Trainee Work Area ── */}
      {!isClosed && (
        <div className="space-y-4">
          {/* Section 1: Diagnosis */}
          <div className="card p-5">
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">١</span>
              التشخيص الأولي
            </h2>
            <Textarea
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              placeholder="ما هو تشخيصك الأولي للمشكلة؟ ما الأسباب المحتملة التي ستتحقق منها أولاً؟"
              rows={3}
            />
            <div className="flex justify-end mt-3">
              <Button variant="secondary" size="sm" loading={saving} onClick={saveDiagnosis}>
                حفظ التشخيص
              </Button>
            </div>
          </div>

          {/* Section 2: Steps */}
          <div className="card p-5">
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">٢</span>
              خطوات استكشاف الأخطاء
            </h2>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary-600 w-6 text-center">{i + 1}</span>
                  <input
                    className="input flex-1"
                    value={step}
                    onChange={e => updateStep(i, e.target.value)}
                    placeholder={`الخطوة ${i + 1}...`}
                  />
                  {steps.length > 1 && (
                    <button onClick={() => removeStep(i)} className="text-gray-400 hover:text-danger p-1">✕</button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3">
              <button onClick={addStep} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800 font-medium">
                <Plus size={16} />
                إضافة خطوة
              </button>
              <Button variant="secondary" size="sm" loading={saving} onClick={saveSteps}>
                حفظ الخطوات
              </Button>
            </div>
          </div>

          {/* Section 3: Change status */}
          <div className="card p-5">
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">٣</span>
              تحديث حالة التذكرة
            </h2>
            <div className="flex gap-3">
              <select
                className="input flex-1"
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as TicketStatus | '')}
              >
                <option value="">اختر الحالة الجديدة...</option>
                {TRAINEE_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <Button variant="secondary" size="sm" onClick={changeStatus} disabled={!newStatus}>
                تحديث
              </Button>
            </div>
          </div>

          {/* Section 4: Add note */}
          <div className="card p-5">
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">٤</span>
              إضافة ملاحظة
            </h2>
            <Textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="ملاحظة أو تحديث إضافي..."
              rows={2}
            />
            <div className="flex justify-end mt-3">
              <Button variant="secondary" size="sm" loading={saving} onClick={addNote} icon={<Plus size={14} />}>
                إضافة
              </Button>
            </div>
          </div>

          {/* Section 5: Final resolution */}
          <div className="card p-5 border-2 border-success/30 bg-success/5">
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-success text-white rounded-full flex items-center justify-center text-xs font-bold">٥</span>
              تسليم الحل النهائي
            </h2>
            <div className="space-y-3">
              <Textarea
                label="السبب الجذري"
                value={rootCause}
                onChange={e => setRootCause(e.target.value)}
                placeholder="ما هو السبب الجذري للمشكلة؟"
                rows={2}
              />
              <Textarea
                label="الحل النهائي"
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                placeholder="صفي الحل الذي طبّقتِه وتأكّدتِ من نجاحه..."
                rows={3}
              />
            </div>
            <div className="flex justify-end mt-3">
              <Button
                variant="success"
                loading={saving}
                onClick={submitResolution}
                icon={<Send size={16} />}
              >
                تسليم الحل
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Closed ticket message */}
      {isClosed && (
        <div className="card p-5 bg-success/5 border-2 border-success/20 text-center">
          <p className="font-bold text-success">تم إغلاق هذه التذكرة بنجاح ✓</p>
          <p className="text-sm text-gray-500 mt-1">يمكنك مراجعة سجل النشاط أدناه</p>
        </div>
      )}

      {/* Activity Timeline */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-800 mb-4">سجل النشاط</h2>
        <ActivityTimeline updates={updates} />
      </div>
    </div>
  );
}
