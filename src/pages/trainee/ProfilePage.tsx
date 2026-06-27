import React, { useState } from 'react';
import { User, Mail, Key, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, Avatar } from '../../components/common';
import { supabase } from '../../lib/supabase';

export function ProfilePage() {
  const { profile, refreshProfile, updatePassword } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase.from('profiles').update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', profile.id);
    await refreshProfile();
    toast.success('تم تحديث الملف الشخصي');
    setSaving(false);
  };

  const changePassword = async () => {
    if (!newPw || newPw !== confirmPw) return toast.error('كلمات المرور غير متطابقة');
    if (newPw.length < 8) return toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    setSavingPw(true);
    const { error } = await updatePassword(newPw);
    setSavingPw(false);
    if (error) return toast.error('تعذّر تغيير كلمة المرور');
    toast.success('تم تغيير كلمة المرور بنجاح');
    setNewPw(''); setConfirmPw('');
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="section-title">الملف الشخصي</h1>
        <p className="section-subtitle">إدارة بياناتك الشخصية</p>
      </div>

      {/* Profile info */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-4 mb-2">
          <Avatar name={profile?.full_name ?? '?'} size="lg" />
          <div>
            <p className="font-bold text-gray-900">{profile?.full_name}</p>
            <p className="text-sm text-gray-400">{profile?.role === 'admin' ? 'مشرف' : 'متدربة'}</p>
          </div>
        </div>

        <Input
          label="الاسم الكامل"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          rightIcon={<User size={18} />}
          id="profile-name"
        />
        <Input
          label="البريد الإلكتروني"
          value={profile?.email ?? ''}
          disabled
          rightIcon={<Mail size={18} />}
          id="profile-email"
        />
        <Button variant="primary" loading={saving} onClick={saveProfile} icon={<Save size={16} />}>
          حفظ التعديلات
        </Button>
      </div>

      {/* Change password */}
      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <Key size={18} className="text-primary-600" />
          تغيير كلمة المرور
        </h2>
        <Input
          label="كلمة المرور الجديدة"
          type={showPw ? 'text' : 'password'}
          value={newPw}
          onChange={e => setNewPw(e.target.value)}
          id="profile-pw-new"
          leftIcon={
            <button type="button" onClick={() => setShowPw(!showPw)} className="text-gray-400">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <Input
          label="تأكيد كلمة المرور"
          type={showPw ? 'text' : 'password'}
          value={confirmPw}
          onChange={e => setConfirmPw(e.target.value)}
          id="profile-pw-confirm"
        />
        <Button variant="secondary" loading={savingPw} onClick={changePassword}>
          تغيير كلمة المرور
        </Button>
      </div>
    </div>
  );
}
