import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface WeeklyData {
  week: string;
  lessons: number;
  quizzes: number;
  assignments: number;
}

interface WeeklyChartProps {
  data: WeeklyData[];
  title?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 text-sm" dir="rtl">
      <p className="font-bold text-gray-700 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {entry.value}%
        </p>
      ))}
    </div>
  );
};

export function WeeklyChart({ data, title }: WeeklyChartProps) {
  return (
    <div className="card p-5">
      {title && <h3 className="section-title mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0eeff" />
          <XAxis dataKey="week" tick={{ fontFamily: 'Cairo', fontSize: 12 }} />
          <YAxis tick={{ fontFamily: 'Cairo', fontSize: 12 }} domain={[0, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span style={{ fontFamily: 'Cairo', fontSize: 12 }}>{value}</span>}
          />
          <Bar dataKey="lessons"     name="الدروس"      fill="#9270ff" radius={[4, 4, 0, 0]} />
          <Bar dataKey="quizzes"     name="الاختبارات"  fill="#7B5CC8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="assignments" name="المهام"       fill="#4B2D8F" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
