import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Clock, AlertCircle, CheckCircle2, Filter, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AR, TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, TICKET_CATEGORY_LABELS } from '../../constants/arabic';
import { formatTicketNumber, formatDateAr, getSLAInfo } from '../../lib/utils';
import { EmptyState, Input, CardSkeleton } from '../../components/common';
import type { Ticket as ITicket } from '../../types';

export function TicketsPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (profile) fetchTickets();
  }, [profile]);

  const fetchTickets = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('assigned_to', profile.id)
      .order('created_at', { ascending: false });
    setTickets((data ?? []) as ITicket[]);
    setLoading(false);
  };

  const filtered = tickets.filter(t => {
    const matchSearch = !search ||
      t.title_ar.includes(search) ||
      formatTicketNumber(t.ticket_number).toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusClass: Record<string, string> = {
    new: 'status-new', assigned: 'status-assigned',
    analyzing: 'status-analyzing', waiting: 'status-waiting',
    resolved: 'status-resolved', closed: 'status-closed', reopened: 'status-reopened',
  };

  const priorityClass: Record<string, string> = {
    low: 'priority-low', medium: 'priority-medium',
    high: 'priority-high', critical: 'priority-critical',
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">تذاكري</h1>
        <p className="section-subtitle">حلّي التذاكر المسندة إليك وطوّري مهارات الدعم الفني</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="بحث برقم أو عنوان التذكرة..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          rightIcon={<Search size={18} />}
          className="flex-1"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="">كل الحالات</option>
          {Object.entries(TICKET_STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 && (
        <EmptyState
          icon={<Ticket size={48} />}
          title={search || filterStatus ? 'لا توجد نتائج مطابقة' : AR.emptyTickets}
          description={search || filterStatus ? 'جرّبي تعديل معايير البحث' : 'ستظهر هنا التذاكر التي يسندها لك المشرف'}
        />
      )}

      <div className="space-y-3">
        {filtered.map((ticket, i) => {
          const sla = getSLAInfo(ticket.created_at, ticket.priority);
          const isActive = !['resolved', 'closed'].includes(ticket.status);

          return (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-4 cursor-pointer hover:border-primary-300 transition-all"
              onClick={() => navigate(`/tickets/${ticket.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-primary-600">
                      {formatTicketNumber(ticket.ticket_number)}
                    </span>
                    <span className={statusClass[ticket.status] ?? 'badge-gray'}>
                      {TICKET_STATUS_LABELS[ticket.status]}
                    </span>
                    <span className={priorityClass[ticket.priority] ?? 'priority-low'}>
                      {TICKET_PRIORITY_LABELS[ticket.priority]}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{ticket.title_ar}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{ticket.description_ar}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{TICKET_CATEGORY_LABELS[ticket.category]}</span>
                    <span>•</span>
                    <span>{formatDateAr(ticket.created_at)}</span>
                    {ticket.requester_name && (
                      <>
                        <span>•</span>
                        <span>المُبلِّغ: {ticket.requester_name}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* SLA indicator */}
                {isActive && (
                  <div className={`flex flex-col items-center gap-1 flex-shrink-0 sla-${sla.status}`}>
                    <Clock size={18} />
                    <div className="w-2 h-16 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`w-full rounded-full transition-all ${
                          sla.status === 'breach' ? 'bg-danger' :
                          sla.status === 'warning' ? 'bg-warning' : 'bg-success'
                        }`}
                        style={{ height: `${sla.percentage}%`, marginTop: `${100 - sla.percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
