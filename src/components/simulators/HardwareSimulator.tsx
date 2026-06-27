import React, { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../common';

// ── Hardware component data ───────────────────────────────────────
const COMPONENTS = [
  {
    id: 'cpu', nameAr: 'المعالج', nameEn: 'CPU',
    emoji: '🖥️',
    purposeAr: 'يعالج جميع العمليات الحسابية والمنطقية في الحاسب — دماغ الجهاز',
    commonProblems: ['ارتفاع الحرارة', 'عدم تشغيل الجهاز', 'الأداء البطيء'],
  },
  {
    id: 'ram', nameAr: 'الذاكرة العشوائية', nameEn: 'RAM',
    emoji: '🟩',
    purposeAr: 'تخزين مؤقت للبيانات التي يستخدمها المعالج حالياً — تزداد السرعة بازدياد حجمها',
    commonProblems: ['الشاشة الزرقاء BSOD', 'إعادة التشغيل المفاجئة', 'بطء في الأداء'],
  },
  {
    id: 'hdd', nameAr: 'القرص الصلب', nameEn: 'HDD/SSD/NVMe',
    emoji: '💾',
    purposeAr: 'التخزين الدائم للبيانات والنظام — الملفات تبقى حتى بعد إيقاف الجهاز',
    commonProblems: ['بطء التشغيل', 'ضوضاء غريبة (HDD)', 'أخطاء القراءة والكتابة'],
  },
  {
    id: 'psu', nameAr: 'وحدة الطاقة', nameEn: 'PSU',
    emoji: '⚡',
    purposeAr: 'تحويل التيار المتردد (AC) إلى تيار مستمر (DC) وتوزيعه على مكونات الجهاز',
    commonProblems: ['عدم تشغيل الجهاز', 'إيقاف تشغيل مفاجئ', 'رائحة احتراق'],
  },
  {
    id: 'motherboard', nameAr: 'اللوحة الأم', nameEn: 'Motherboard',
    emoji: '🔌',
    purposeAr: 'تربط جميع مكونات الحاسب معاً وتتيح التواصل بينها',
    commonProblems: ['عدم التعرف على المكونات', 'صوت Beep عند التشغيل', 'عدم التشغيل'],
  },
  {
    id: 'gpu', nameAr: 'كرت الشاشة', nameEn: 'GPU',
    emoji: '🎮',
    purposeAr: 'معالجة وعرض الصور والفيديو والرسومات — ضروري للألعاب والتصميم',
    commonProblems: ['لا توجد صورة', 'تشويه الصورة', 'توقف الشاشة'],
  },
  {
    id: 'nic', nameAr: 'كرت الشبكة', nameEn: 'NIC',
    emoji: '🌐',
    purposeAr: 'يتيح الاتصال بالشبكة والإنترنت — قد يكون مدمجاً في اللوحة الأم',
    commonProblems: ['عدم الاتصال بالشبكة', 'علامة تحذير في Device Manager', 'تقطع الاتصال'],
  },
  {
    id: 'cooler', nameAr: 'مروحة التبريد', nameEn: 'Cooler/Fan',
    emoji: '🌀',
    purposeAr: 'تبريد المعالج ومنع ارتفاع الحرارة الذي قد يتلف المكونات',
    commonProblems: ['ارتفاع حرارة المعالج', 'ضوضاء عالية', 'توقف مفاجئ للجهاز'],
  },
];

// ── Mode 1: Identify component ────────────────────────────────────
function IdentifyMode() {
  const [currentIdx, setCurrentIdx] = useState(Math.floor(Math.random() * COMPONENTS.length));
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const current = COMPONENTS[currentIdx];
  const shuffled = [...COMPONENTS].sort(() => Math.random() - 0.5).slice(0, 4);
  const [options] = useState(() => {
    const arr = [...COMPONENTS].sort(() => Math.random() - 0.5).slice(0, 3);
    if (!arr.find(c => c.id === current.id)) arr[0] = current;
    return arr.sort(() => Math.random() - 0.5);
  });

  const handleSelect = (id: string) => {
    if (showResult) return;
    setSelected(id);
    setShowResult(true);
    setScore(s => ({ correct: s.correct + (id === current.id ? 1 : 0), total: s.total + 1 }));
  };

  const next = () => {
    setCurrentIdx(Math.floor(Math.random() * COMPONENTS.length));
    setSelected(null);
    setShowResult(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-700">تعرّف على المكون</h3>
        <span className="text-sm text-gray-500">النتيجة: {score.correct}/{score.total}</span>
      </div>

      {/* Component display */}
      <div className="card p-8 text-center">
        <div className="text-7xl mb-4">{current.emoji}</div>
        <p className="text-gray-600 text-sm">{current.purposeAr}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {options.map(opt => {
          const isSelected = selected === opt.id;
          const isCorrect = opt.id === current.id;
          const showColors = showResult;
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`p-4 rounded-2xl border-2 text-center font-semibold transition-all duration-200 ${
                showColors && isCorrect ? 'border-success bg-success/10 text-success' :
                showColors && isSelected && !isCorrect ? 'border-danger bg-danger/10 text-danger' :
                !showColors ? 'border-gray-200 hover:border-primary-300 hover:bg-primary-50' :
                'border-gray-100 text-gray-400'
              }`}
            >
              <div className="text-2xl mb-1">{opt.emoji}</div>
              <div className="text-sm">{opt.nameAr}</div>
              <div className="text-xs opacity-70">{opt.nameEn}</div>
            </button>
          );
        })}
      </div>

      {/* Result + Next */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`card p-4 ${selected === current.id ? 'bg-success/5 border-success/20' : 'bg-danger/5 border-danger/20'} border`}
          >
            <div className="flex items-center gap-2 mb-2">
              {selected === current.id
                ? <CheckCircle2 size={20} className="text-success" />
                : <XCircle size={20} className="text-danger" />}
              <span className="font-bold">
                {selected === current.id ? 'ممتاز! إجابة صحيحة' : `الإجابة الصحيحة: ${current.nameAr}`}
              </span>
            </div>
            <p className="text-sm text-gray-600">المشاكل الشائعة: {current.commonProblems.join('، ')}</p>
            <Button variant="primary" size="sm" className="mt-3" onClick={next}>
              السؤال التالي ←
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Mode 2: Function quiz ─────────────────────────────────────────
const FUNCTION_QUESTIONS = [
  { question: 'ما القطعة المسؤولة عن التخزين الدائم للبيانات؟', answer: 'hdd' },
  { question: 'ما القطعة التي تُعتبر "دماغ" الجهاز؟', answer: 'cpu' },
  { question: 'أي القطع تحوّل الكهرباء من AC إلى DC؟', answer: 'psu' },
  { question: 'ما القطعة التي تربط جميع المكونات معاً؟', answer: 'motherboard' },
  { question: 'أي مكون يسمح للجهاز بالاتصال بالشبكة؟', answer: 'nic' },
  { question: 'ما المكون المسؤول عن عرض الصور والرسومات؟', answer: 'gpu' },
  { question: 'أي مكون يحتوي بيانات مؤقتة يستخدمها المعالج؟', answer: 'ram' },
  { question: 'ما القطعة التي تمنع ارتفاع حرارة المعالج؟', answer: 'cooler' },
];

function FunctionMode() {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const q = FUNCTION_QUESTIONS[qIdx % FUNCTION_QUESTIONS.length];
  const opts = [...COMPONENTS].sort(() => Math.random() - 0.5).slice(0, 4);
  const correctComp = COMPONENTS.find(c => c.id === q.answer)!;
  if (!opts.find(o => o.id === q.answer)) opts[0] = correctComp;
  const [shuffledOpts] = useState(() => opts.sort(() => Math.random() - 0.5));

  const handleSelect = (id: string) => {
    if (showResult) return;
    setSelected(id);
    setShowResult(true);
    if (id === q.answer) setScore(s => s + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-700">اختر المكون الصحيح</h3>
        <span className="text-sm text-gray-500">السؤال {(qIdx % FUNCTION_QUESTIONS.length) + 1}/{FUNCTION_QUESTIONS.length}</span>
      </div>

      <div className="card p-6 text-center">
        <p className="text-lg font-bold text-gray-900">{q.question}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {shuffledOpts.map(opt => (
          <button
            key={opt.id}
            onClick={() => handleSelect(opt.id)}
            className={`p-4 rounded-2xl border-2 text-center font-semibold transition-all ${
              showResult && opt.id === q.answer ? 'border-success bg-success/10 text-success' :
              showResult && selected === opt.id ? 'border-danger bg-danger/10 text-danger' :
              !showResult ? 'border-gray-200 hover:border-primary-300 hover:bg-primary-50' :
              'border-gray-100 text-gray-400'
            }`}
          >
            <div className="text-2xl mb-1">{opt.emoji}</div>
            <div className="text-sm">{opt.nameAr}</div>
          </button>
        ))}
      </div>

      {showResult && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={`card p-4 border ${selected === q.answer ? 'bg-success/5 border-success/20' : 'bg-danger/5 border-danger/20'}`}>
          <p className="font-bold mb-1">
            {selected === q.answer ? '✓ صحيح!' : `✗ الإجابة: ${correctComp.nameAr}`}
          </p>
          <p className="text-sm text-gray-600">{correctComp.purposeAr}</p>
          <Button variant="primary" size="sm" className="mt-3" onClick={() => { setQIdx(i => i + 1); setSelected(null); setShowResult(false); }}>
            التالي
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// ── Mode 3: Order assembly steps ──────────────────────────────────
const ASSEMBLY_STEPS = [
  'فصل الكهرباء',
  'ارتداء سوار مضاد للكهرباء الساكنة',
  'فتح الهيكل',
  'تركيب المعالج على اللوحة الأم',
  'تركيب الذاكرة العشوائية',
  'تركيب القرص الصلب',
  'توصيل كابلات الطاقة',
  'توصيل كابلات SATA',
  'إعادة إغلاق الهيكل',
  'التشغيل الأول والتحقق',
];

function OrderMode() {
  const [items, setItems] = useState(() =>
    [...ASSEMBLY_STEPS].map((s, i) => ({ id: i, text: s })).sort(() => Math.random() - 0.5)
  );
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  const checkOrder = () => {
    const correct = items.every((item, idx) => item.id === idx);
    setIsCorrect(correct);
    setChecked(true);
  };

  const reset = () => {
    setItems([...ASSEMBLY_STEPS].map((s, i) => ({ id: i, text: s })).sort(() => Math.random() - 0.5));
    setChecked(false);
    setIsCorrect(null);
  };

  const moveItem = (fromIdx: number, toIdx: number) => {
    const newItems = [...items];
    const [moved] = newItems.splice(fromIdx, 1);
    newItems.splice(toIdx, 0, moved);
    setItems(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-700">رتّب خطوات تجميع الجهاز</h3>
        <button onClick={reset} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <RotateCcw size={14} /> إعادة
        </button>
      </div>
      <p className="text-sm text-gray-500">اسحب الخطوات لترتيبها بالترتيب الصحيح</p>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => setDragging(idx)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => { if (dragging !== null) moveItem(dragging, idx); setDragging(null); }}
            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-grab active:cursor-grabbing transition-all ${
              checked
                ? item.id === idx
                  ? 'border-success bg-success/10'
                  : 'border-danger bg-danger/10'
                : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-glow-sm'
            }`}
          >
            <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              {idx + 1}
            </span>
            <span className="flex-1 text-sm font-medium">{item.text}</span>
            {checked && (
              item.id === idx
                ? <CheckCircle2 size={16} className="text-success" />
                : <XCircle size={16} className="text-danger" />
            )}
          </div>
        ))}
      </div>

      {!checked ? (
        <Button variant="primary" onClick={checkOrder} className="w-full">
          تحقق من الترتيب
        </Button>
      ) : (
        <div className={`card p-4 border text-center ${isCorrect ? 'bg-success/5 border-success/20' : 'bg-warning/5 border-warning/20'}`}>
          <p className="font-bold text-lg">{isCorrect ? '🎉 ترتيب صحيح!' : '❌ ترتيب خاطئ — جربي مجدداً'}</p>
          {!isCorrect && (
            <Button variant="secondary" size="sm" className="mt-3" onClick={reset}>
              إعادة المحاولة
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Simulator ────────────────────────────────────────────────
export function HardwareSimulator() {
  const [mode, setMode] = useState<'identify' | 'function' | 'order'>('identify');

  const modes = [
    { id: 'identify' as const, label: 'تعرّف على المكون', emoji: '🔍' },
    { id: 'function' as const, label: 'اختر الوظيفة الصحيحة', emoji: '🎯' },
    { id: 'order'    as const, label: 'رتّب خطوات التجميع', emoji: '📋' },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-primary p-4">
        <h2 className="text-white font-black text-lg">🖥️ محاكي مكونات الحاسب</h2>
        <p className="text-white/70 text-sm">اختاري وضع التدريب الذي تريدينه</p>
      </div>

      {/* Mode selector */}
      <div className="flex border-b border-gray-100">
        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex-1 p-3 text-sm font-semibold transition-colors ${
              mode === m.id
                ? 'border-b-2 border-primary-500 text-primary-700 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            {mode === 'identify' && <IdentifyMode />}
            {mode === 'function' && <FunctionMode />}
            {mode === 'order' && <OrderMode />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
