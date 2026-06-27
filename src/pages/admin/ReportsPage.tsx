import React, { useEffect, useState } from 'react';
import { TrendingUp, BarChart2, PieChart as PieIcon, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CardSkeleton } from '../../components/common';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis,
} from 'recharts';

const COLORS = ['#7B5CC8', '#9270ff', '#4B2D8F', '#b5a1ff'];

export function ReportsPage() {
  const [loading, setLoading] = useState(false);

  const weeklyData: any[] = [];

  const categoryData: any[] = [];

  const ticketCategoryData: any[] = [];

  const radarData: any[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">التقارير</h1>
          <p className="section-subtitle">تحليل أداء المتدربات والمنصة</p>
        </div>
        <button onClick={() => window.print()} className="btn-secondary btn flex items-center gap-2 text-sm print:hidden">
          <Download size={16} />
          تصدير PDF
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'متوسط إكمال الدروس', value: '0%', color: 'text-primary-600' },
          { label: 'متوسط الاختبارات',   value: '0%', color: 'text-warning' },
          { label: 'معدل حل التذاكر',    value: '0%', color: 'text-success' },
        ].map(item => (
          <div key={item.label} className="card p-5 text-center">
            <div className={`text-3xl font-black ${item.color}`}>{item.value}</div>
            <div className="text-sm text-gray-500 mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly progress */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-700 mb-4">التقدم الأسبوعي للمتدربات</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0eeff" />
              <XAxis dataKey="week" tick={{ fontFamily: 'Cairo', fontSize: 12 }} />
              <YAxis tick={{ fontFamily: 'Cairo', fontSize: 12 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ fontFamily: 'Cairo', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              <Legend wrapperStyle={{ fontFamily: 'Cairo', fontSize: 12, paddingTop: '10px' }} />
              <Bar dataKey="لجين" fill="#9270ff" radius={[4,4,0,0]} />
              <Bar dataKey="سارة"  fill="#7B5CC8" radius={[4,4,0,0]} />
              <Bar dataKey="نورة"  fill="#4B2D8F" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-700 mb-4">متوسط الأداء بالفئة</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie 
                data={categoryData} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={80} 
                labelLine={true}
                label={({ name, value }) => `${name}: ${value}%`}
                style={{ fontFamily: 'Cairo', fontSize: '11px', fill: '#4B5563' }}
              >
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: 'Cairo', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              <Legend wrapperStyle={{ fontFamily: 'Cairo', fontSize: 12, paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Radar */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-700 mb-4">مقارنة أداء المتدربات</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontFamily: 'Cairo', fontSize: 11 }} />
              <Radar name="لجين" dataKey="لجين" stroke="#9270ff" fill="#9270ff" fillOpacity={0.2} />
              <Radar name="سارة"  dataKey="سارة"  stroke="#7B5CC8" fill="#7B5CC8" fillOpacity={0.2} />
              <Radar name="نورة"  dataKey="نورة"  stroke="#4B2D8F" fill="#4B2D8F" fillOpacity={0.2} />
              <Tooltip contentStyle={{ fontFamily: 'Cairo', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              <Legend wrapperStyle={{ fontFamily: 'Cairo', fontSize: 12, paddingTop: '10px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Ticket categories */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-700 mb-4">توزيع التذاكر حسب الفئة</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ticketCategoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0eeff" />
              <XAxis type="number" tick={{ fontFamily: 'Cairo', fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontFamily: 'Cairo', fontSize: 12 }} width={80} />
              <Tooltip contentStyle={{ fontFamily: 'Cairo', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="value" fill="#7B5CC8" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
