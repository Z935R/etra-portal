import React, { useEffect, useState } from 'react';
import { Bell, AlertTriangle, Info, Megaphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { EmptyState, Badge, CardSkeleton } from '../../components/common';
import { formatDateAr } from '../../lib/utils';
import { AR } from '../../constants/arabic';
import type { Announcement } from '../../types';

const typeConfig = {
  normal:    { icon: <Info size={20} />,           cls: 'bg-info/10 text-info',     label: 'عادي' },
  important: { icon: <Bell size={20} />,           cls: 'bg-warning/10 text-warning', label: 'مهم' },
  urgent:    { icon: <AlertTriangle size={20} />,  cls: 'bg-danger/10 text-danger',   label: 'عاجل' },
};

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*, profiles!created_by(full_name)')
      .eq('is_published', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('published_at', { ascending: false });
    setAnnouncements((data ?? []).map((a: any) => ({ ...a, author: a.profiles })) as Announcement[]);
    setLoading(false);
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">الإعلانات</h1>
        <p className="section-subtitle">تابعي آخر الأخبار والتحديثات</p>
      </div>

      {announcements.length === 0 && (
        <EmptyState icon={<Megaphone size={48} />} title={AR.emptyAnnouncements} />
      )}

      <div className="space-y-4">
        {announcements.map((ann, i) => {
          const cfg = typeConfig[ann.type] ?? typeConfig.normal;
          return (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`card p-5 border-r-4 ${
                ann.type === 'urgent' ? 'border-r-danger' :
                ann.type === 'important' ? 'border-r-warning' : 'border-r-info'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.cls}`}>
                  {cfg.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="font-bold text-gray-900">{ann.title_ar}</h3>
                    <Badge variant={
                      ann.type === 'urgent' ? 'danger' :
                      ann.type === 'important' ? 'warning' : 'info'
                    }>
                      {cfg.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{ann.content_ar}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    {ann.author && <span>بواسطة: {(ann.author as any).full_name}</span>}
                    {ann.published_at && <span>{formatDateAr(ann.published_at)}</span>}
                    {ann.expires_at && (
                      <span className="text-warning">تنتهي: {formatDateAr(ann.expires_at)}</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
