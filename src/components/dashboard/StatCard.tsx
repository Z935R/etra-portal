import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: { value: number; label: string };
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

export function StatCard({ title, value, icon, iconBg = 'bg-primary-100', trend, subtitle, className = '', onClick }: StatCardProps) {
  const content = (
    <>
      <div className={`stat-icon ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0 text-right">
        <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        {trend && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${
            trend.value >= 0 ? 'text-success' : 'text-danger'
          }`}>
            <span>{trend.value >= 0 ? '▲' : '▼'}</span>
            <span>{Math.abs(trend.value)}% {trend.label}</span>
          </div>
        )}
      </div>
    </>
  );

  const baseClass = `stat-card ${className}`;

  if (onClick) {
    return (
      <button onClick={onClick} className={`${baseClass} hover:bg-gray-50 hover:shadow-md transition-all text-right w-full active:scale-[0.98]`}>
        {content}
      </button>
    );
  }

  return (
    <div className={baseClass}>
      {content}
    </div>
  );
}
