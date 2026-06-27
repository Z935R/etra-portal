import React, { useState, useEffect } from 'react';
import { Menu, Bell, ChevronDown, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AR } from '../../constants/arabic';
import { ROUTES } from '../../constants/config';
import { supabase } from '../../lib/supabase';
import { timeAgoAr } from '../../lib/utils';
import type { Notification } from '../../types';

interface TopNavProps {
  onMenuClick: () => void;
  isAdmin?: boolean;
}

export function TopNav({ onMenuClick, isAdmin }: TopNavProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    fetchNotifications();
  }, [profile]);

  const fetchNotifications = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
    }
  };

  const markAllRead = async () => {
    if (!profile) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile.id)
      .eq('is_read', false);
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.login);
  };

  return (
    <header className="topnav flex items-center justify-between px-6">
      {/* Right: Menu button + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden btn-ghost p-2 rounded-xl"
          aria-label="القائمة"
        >
          <Menu size={20} />
        </button>
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
          <span className="font-semibold text-primary-700">
            {isAdmin ? 'لوحة التحكم' : 'منصة إترا للتدريب'}
          </span>
        </div>
      </div>

      {/* Left: Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}
            className="btn-ghost p-2 rounded-xl relative"
            aria-label="الإشعارات"
            id="notif-btn"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute left-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <span className="font-bold text-gray-800">الإشعارات</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">
                    تحديد الكل كمقروء
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">لا توجد إشعارات</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !n.is_read ? 'bg-primary-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {!n.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                        )}
                        <div className={!n.is_read ? '' : 'mr-5'}>
                          <p className="text-sm font-semibold text-gray-800">{n.title_ar}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.message_ar}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{timeAgoAr(n.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            id="user-menu-btn"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold">
              {profile?.full_name?.charAt(0) ?? '?'}
            </div>
            <span className="hidden md:block text-sm font-semibold text-gray-700 max-w-[120px] truncate">
              {profile?.full_name}
            </span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {showUserMenu && (
            <div className="absolute left-0 top-12 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden py-1">
              <button
                onClick={() => { navigate(isAdmin ? ROUTES.adminSettings : ROUTES.profile); setShowUserMenu(false); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User size={16} />
                {AR.profile}
              </button>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors"
              >
                <LogOut size={16} />
                {AR.logout}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showNotifs || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowNotifs(false); setShowUserMenu(false); }}
        />
      )}
    </header>
  );
}
