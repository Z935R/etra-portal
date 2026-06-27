import React from 'react';
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen" dir="rtl">
      <Outlet />
    </div>
  );
}
