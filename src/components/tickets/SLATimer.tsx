import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getSLAInfo, formatDuration } from '../../lib/utils';
import { TICKET_PRIORITY_LABELS } from '../../constants/arabic';
import type { TicketPriority } from '../../types';

interface SLATimerProps {
  createdAt: string;
  priority: TicketPriority;
  compact?: boolean;
}

export function SLATimer({ createdAt, priority, compact }: SLATimerProps) {
  const [sla, setSla] = useState(getSLAInfo(createdAt, priority));

  useEffect(() => {
    const interval = setInterval(() => {
      setSla(getSLAInfo(createdAt, priority));
    }, 60000); // update every minute
    return () => clearInterval(interval);
  }, [createdAt, priority]);

  const colorClass = {
    ok:      'text-success',
    warning: 'text-warning',
    breach:  'text-danger',
  }[sla.status];

  const bgClass = {
    ok:      'bg-success/10 border-success/20',
    warning: 'bg-warning/10 border-warning/20',
    breach:  'bg-danger/10 border-danger/20',
  }[sla.status];

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 text-xs font-bold ${colorClass} px-2 py-1 rounded-lg border ${bgClass}`}>
        <Clock size={14} />
        {sla.status === 'breach' ? 'منتهي SLA' : formatDuration(sla.remaining)}
      </div>
    );
  }

  return (
    <div className={`card p-4 border ${bgClass}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock size={16} className={colorClass} />
          <span className="text-sm font-bold text-gray-700">مؤشر SLA</span>
          <span className="badge bg-gray-100 text-gray-600 text-xs">
            {TICKET_PRIORITY_LABELS[priority]}
          </span>
        </div>
        <div className={`text-sm font-bold ${colorClass}`}>
          {sla.status === 'breach' ? (
            <span className="flex items-center gap-1"><AlertTriangle size={14} /> انتهى وقت SLA</span>
          ) : (
            <span>{formatDuration(sla.remaining)} متبقي</span>
          )}
        </div>
      </div>
      <div className="progress-bar">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            sla.status === 'breach'  ? 'bg-danger' :
            sla.status === 'warning' ? 'bg-warning' : 'bg-success'
          }`}
          style={{ width: `${sla.percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>بدأت</span>
        <span>{Math.round(sla.percentage)}% من الوقت مضى</span>
        <span>النهاية</span>
      </div>
    </div>
  );
}
