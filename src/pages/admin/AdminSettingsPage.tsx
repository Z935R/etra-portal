import React from 'react';
import { Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ProfilePage } from '../trainee/ProfilePage';

export function AdminSettingsPage() {
  const { profile } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">الإعدادات</h1>
        <p className="section-subtitle">إعدادات الحساب والمنصة</p>
      </div>
      <ProfilePage />
    </div>
  );
}
