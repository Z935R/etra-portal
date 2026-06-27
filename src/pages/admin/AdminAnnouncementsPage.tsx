import React, { useEffect, useState } from 'react';
import { Plus, Megaphone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Modal, Input, Textarea, Badge, CardSkeleton } from '../../components/common';
import { formatDateAr } from '../../lib/utils';
import type { Announcement, AnnouncementType } from '../../types';

export function AdminAnnouncementsPage() {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title_ar: '', content_ar: '', type: 'normal' as AnnouncementType, expires_at: '' });

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from('announcements').select('*').order('published_at', { ascending: false });
    setAnnouncements((data ?? []) as Announcement[]);
    setLoading(false);
  };

  const createAnnouncement = async () => {
    if (!form.title_ar || !form.content_ar) return toast.error('يرجى ملء العنوان والمحتوى');
    setSaving(true);
    await supabase.from('announcements').insert({
      title_ar: form.title_ar,
      content_ar: form.content_ar,
      type: form.type,
      created_by: profile?.id,
      published_at: new Date().toISOString(),
      expires_at: form.expires_at || null,
      is_published: true,
    });
    toast.success('تم نشر الإعلان');
    setForm({ title_ar: '', content_ar: '', type: 'normal', expires_at: '' });
    setShowCreate(false);
    fetchAnnouncements();
    setSaving(false);
  };

  const deleteAnnouncement = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    setAnnouncements(a => a.filter(x => x.id !== id));
    toast.success('تم حذف الإعلان');
  };

  if (loading) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">الإعلانات</h1>
          <p className="section-subtitle">إدارة إعلانات المنصة للمتدربات</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
          إضافة إعلان
        </Button>
      </div>

      <div className="space-y-3">
        {announcements.map(ann => (
          <div key={ann.id} className="card p-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900">{ann.title_ar}</h3>
                <Badge variant={ann.type === 'urgent' ? 'danger' : ann.type === 'important' ? 'warning' : 'gray'}>
                  {ann.type === 'urgent' ? 'عاجل' : ann.type === 'important' ? 'مهم' : 'عادي'}
                </Badge>
                {!ann.is_published && <Badge variant="gray">مسودة</Badge>}
              </div>
              <p className="text-sm text-gray-600">{ann.content_ar}</p>
              <p className="text-xs text-gray-400 mt-2">
                {ann.published_at ? formatDateAr(ann.published_at) : 'غير منشور'}
                {ann.expires_at && ` — ينتهي: ${formatDateAr(ann.expires_at)}`}
              </p>
            </div>
            <button
              onClick={() => deleteAnnouncement(ann.id)}
              className="text-gray-300 hover:text-danger transition-colors p-1"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="إضافة إعلان جديد"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>إلغاء</Button>
            <Button variant="primary" loading={saving} onClick={createAnnouncement}>نشر الإعلان</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="عنوان الإعلان" value={form.title_ar}
            onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} id="ann-title" />
          <div>
            <label className="label">نوع الإعلان</label>
            <select className="input" value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as AnnouncementType }))}>
              <option value="normal">عادي</option>
              <option value="important">مهم</option>
              <option value="urgent">عاجل</option>
            </select>
          </div>
          <Textarea label="محتوى الإعلان" value={form.content_ar}
            onChange={e => setForm(f => ({ ...f, content_ar: e.target.value }))} rows={4} />
          <div>
            <label className="label">تاريخ انتهاء الصلاحية (اختياري)</label>
            <input type="date" className="input" value={form.expires_at}
              onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
