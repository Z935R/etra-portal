import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Lock, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Textarea, CardSkeleton, Badge } from '../../components/common';
import { ActivityTimeline } from '../../components/tickets/ActivityTimeline';
import { SLATimer } from '../../components/tickets/SLATimer';
import {
  formatTicketNumber, formatDateTimeAr
} from '../../lib/utils';
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, TICKET_CATEGORY_LABELS } from '../../constants/arabic';
import type { Ticket as ITicket, TicketUpdate, TicketEvaluation } from '../../types';

export function TicketAdminDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<ITicket | null>(null);
  const [updates, setUpdates] = useState<TicketUpdate[]>([]);
  const [evaluation, setEvaluation] = useState<TicketEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [internalNote, setInternalNote] = useState('');
  const [evalForm, setEvalForm] = useState({
    diagnosis_score: 0, steps_score: 0, resolution_score: 0, feedback_ar: '',
  });

  useEffect(() => { if (ticketId) fetchTicket(); }, [ticketId]);

  const fetchTicket = async () => {
    if (!ticketId) return;
    const [ticketRes, updatesRes, evalRes] = await Promise.all([
      supabase.from('tickets').select('*').eq('id', ticketId).single(),
      supabase
        .from('ticket_updates')
        .select('*, profiles!author_id(full_name, role)')
        .eq('ticket_id', ticketId)
        .order('created_at'),
      supabase.from('ticket_evaluations').select('*').eq('ticket_id', ticketId).maybeSingle(),
    ]);
    setTicket(ticketRes.data as ITicket);
    setUpdates(updatesRes.data?.map((u: any) => ({ ...u, author: u.profiles })) ?? []);
    setEvaluation(evalRes.data as TicketEvaluation | null);
    if (evalRes.data) {
      setEvalForm({
        diagnosis_score: evalRes.data.diagnosis_score,
        steps_score: evalRes.data.steps_score,
        resolution_score: evalRes.data.resolution_score,
        feedback_ar: evalRes.data.feedback_ar ?? '',
      });
    }
    setLoading(false);
  };

  const addInternalNote = async () => {
    if (!ticket || !profile || !internalNote.trim()) return;
    setSaving(true);
    await supabase.from('ticket_updates').insert({
      ticket_id: ticket.id,
      author_id: profile.id,
      update_type: 'note',
      content_ar: internalNote,
      is_internal: true,
    });
    toast.success('تمت إضافة الملاحظة الداخلية');
    setInternalNote('');
    fetchTicket();
    setSaving(false);
  };

  const submitEvaluation = async () => {
    if (!ticket || !profile) return;
    const total = Math.round(
      (evalForm.diagnosis_score + evalForm.steps_score + evalForm.resolution_score) / 3
    );
    setSaving(true);
    if (evaluation) {
      await supabase.from('ticket_evaluations').update({
        ...evalForm, total_score: total, evaluated_at: new Date().toISOString(),
      }).eq('id', evaluation.id);
    } else {
      await supabase.from('ticket_evaluations').insert({
        ticket_id: ticket.id,
        trainee_id: ticket.assigned_to,
        admin_id: profile.id,
        ...evalForm,
        total_score: total,
        evaluated_at: new Date().toISOString(),
      });
    }
    // Add feedback update
    await supabase.from('ticket_updates').insert({
      ticket_id: ticket.id,
      author_id: profile.id,
      update_type: 'feedback',
      content_ar: `التقييم: ${total}/100\n${evalForm.feedback_ar}`,
      is_internal: false,
    });
    toast.success('تم حفظ التقييم بنجاح');
    fetchTicket();
    setSaving(false);
  };

  const closeTicket = async () => {
    if (!ticket || !profile) return;
    await supabase.from('tickets').update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', ticket.id);
    await supabase.from('ticket_updates').insert({
      ticket_id: ticket.id,
      author_id: profile.id,
      update_type: 'status_change',
      content_ar: 'تم إغلاق التذكرة بواسطة المشرف',
      is_internal: false,
      old_status: ticket.status,
      new_status: 'closed',
    });
    toast.success('تم إغلاق التذكرة');
    fetchTicket();
  };

  if (loading) return <div className="max-w-4xl mx-auto"><CardSkeleton /></div>;
  if (!ticket) return <div className="text-center py-16 text-gray-500">التذكرة غير موجودة</div>;

  const ScoreInput = ({ label, field }: { label: string; field: 'diagnosis_score' | 'steps_score' | 'resolution_score' }) => (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="range" min={0} max={100} step={5}
          value={evalForm[field]}
          onChange={e => setEvalForm(f => ({ ...f, [field]: parseInt(e.target.value) }))}
          className="flex-1 accent-purple-600"
        />
        <span className="text-lg font-black text-primary-600 w-12 text-center">{evalForm[field]}</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowRight size={18} /> العودة للتذاكر
      </button>

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-primary-600">
                {formatTicketNumber(ticket.ticket_number)}
              </span>
              <span className={`status-${ticket.status}`}>{TICKET_STATUS_LABELS[ticket.status]}</span>
              <span className={`priority-${ticket.priority}`}>{TICKET_PRIORITY_LABELS[ticket.priority]}</span>
            </div>
            <h1 className="text-xl font-black text-gray-900 mb-2">{ticket.title_ar}</h1>
            <p className="text-sm text-gray-600">{ticket.description_ar}</p>
          </div>
          <div className="flex flex-col gap-2">
            <SLATimer createdAt={ticket.created_at} priority={ticket.priority} compact />
            {ticket.status !== 'closed' && (
              <Button variant="ghost" size="sm" onClick={closeTicket}>إغلاق التذكرة</Button>
            )}
          </div>
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expected answers (admin only) */}
        <div className="card p-5 border-2 border-primary-200">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={16} className="text-primary-600" />
            <h2 className="font-bold text-primary-700">الإجابات المتوقعة (للمشرف فقط)</h2>
          </div>
          <div className="space-y-4 text-sm">
            {ticket.expected_diagnosis_ar && (
              <div>
                <p className="font-semibold text-gray-600 mb-1">التشخيص المتوقع:</p>
                <p className="bg-blue-50 p-3 rounded-xl text-blue-900">{ticket.expected_diagnosis_ar}</p>
              </div>
            )}
            {ticket.expected_steps_ar && (
              <div>
                <p className="font-semibold text-gray-600 mb-1">الخطوات المتوقعة:</p>
                <p className="bg-purple-50 p-3 rounded-xl text-purple-900 whitespace-pre-wrap">{ticket.expected_steps_ar}</p>
              </div>
            )}
            {ticket.expected_resolution_ar && (
              <div>
                <p className="font-semibold text-gray-600 mb-1">الحل المتوقع:</p>
                <p className="bg-green-50 p-3 rounded-xl text-green-900">{ticket.expected_resolution_ar}</p>
              </div>
            )}
          </div>
        </div>

        {/* Evaluation */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star size={16} className="text-warning" />
            <h2 className="font-bold text-gray-700">تقييم إجابة المتدربة</h2>
          </div>
          <div className="space-y-4">
            <ScoreInput label="درجة التشخيص" field="diagnosis_score" />
            <ScoreInput label="درجة الخطوات" field="steps_score" />
            <ScoreInput label="درجة الحل" field="resolution_score" />
            <div className="bg-primary-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">المجموع الكلي</p>
              <p className="text-3xl font-black text-primary-600">
                {Math.round((evalForm.diagnosis_score + evalForm.steps_score + evalForm.resolution_score) / 3)}
              </p>
            </div>
            <Textarea
              label="التغذية الراجعة"
              value={evalForm.feedback_ar}
              onChange={e => setEvalForm(f => ({ ...f, feedback_ar: e.target.value }))}
              placeholder="اكتب تعليقاً للمتدربة..."
              rows={3}
            />
            <Button variant="primary" loading={saving} onClick={submitEvaluation} className="w-full" icon={<Send size={16} />}>
              {evaluation ? 'تحديث التقييم' : 'حفظ التقييم'}
            </Button>
          </div>
        </div>
      </div>

      {/* Internal note */}
      <div className="card p-5 border border-orange-200 bg-orange-50/30">
        <h2 className="font-bold text-orange-700 mb-3 flex items-center gap-2">
          <Lock size={16} /> إضافة ملاحظة داخلية
        </h2>
        <Textarea value={internalNote} onChange={e => setInternalNote(e.target.value)}
          placeholder="ملاحظة داخلية لا تراها المتدربة..." rows={2} />
        <div className="flex justify-end mt-2">
          <Button variant="secondary" size="sm" loading={saving} onClick={addInternalNote}>إضافة</Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-800 mb-4">سجل النشاط الكامل</h2>
        <ActivityTimeline updates={updates} />
      </div>
    </div>
  );
}
