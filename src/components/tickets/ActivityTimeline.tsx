import React from 'react';
import { timeAgoAr } from '../../lib/utils';
import type { TicketUpdate } from '../../types';

const UPDATE_ICONS: Record<string, string> = {
  status_change: '🔄',
  note:          '📝',
  diagnosis:     '🔍',
  resolution:    '✅',
  feedback:      '⭐',
  assignment:    '👤',
};

const UPDATE_LABELS: Record<string, string> = {
  status_change: 'تم تغيير الحالة',
  note:          'ملاحظة جديدة',
  diagnosis:     'تشخيص أولي',
  resolution:    'حل مقدَّم',
  feedback:      'تغذية راجعة',
  assignment:    'تعيين',
};

interface ActivityTimelineProps {
  updates: TicketUpdate[];
}

export function ActivityTimeline({ updates }: ActivityTimelineProps) {
  if (updates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        لا يوجد نشاط بعد — ابدئي بكتابة التشخيص الأولي
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {updates.map((update, i) => {
        const isLast = i === updates.length - 1;
        return (
          <div key={update.id} className="timeline-item">
            {/* Connector line */}
            {!isLast && (
              <div
                className="absolute right-4 top-10 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 to-transparent"
                style={{ right: '19px' }}
              />
            )}

            {/* Dot */}
            <div className="timeline-dot bg-primary-50 border-2 border-primary-200 flex-shrink-0">
              {UPDATE_ICONS[update.update_type] ?? '📌'}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-bold text-gray-700">
                  {UPDATE_LABELS[update.update_type]}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {timeAgoAr(update.created_at)}
                </span>
              </div>
              {update.author && (
                <p className="text-xs text-gray-400 mb-1.5">
                  بواسطة: {update.author.full_name}
                </p>
              )}
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {update.content_ar}
              </div>

              {/* Status change arrows */}
              {update.update_type === 'status_change' && update.old_status && update.new_status && (
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span className="badge bg-gray-100 text-gray-600">{update.old_status}</span>
                  <span>←</span>
                  <span className="badge bg-primary-100 text-primary-700">{update.new_status}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
