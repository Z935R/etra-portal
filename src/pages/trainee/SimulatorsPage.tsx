import React, { useState } from 'react';
import { Monitor, Network } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HardwareSimulator } from '../../components/simulators/HardwareSimulator';
import { NetworkSimulator } from '../../components/simulators/NetworkSimulator';

const SIMULATORS = [
  {
    id: 'hardware',
    icon: <Monitor size={24} />,
    title: 'محاكي مكونات الحاسب',
    subtitle: 'تعرّف على مكونات الحاسب وتجميعه',
    emoji: '🖥️',
  },
  {
    id: 'network',
    icon: <Network size={24} />,
    title: 'محاكي الشبكة',
    subtitle: 'صمّمي شبكات وصوّبي الأخطاء تفاعلياً',
    emoji: '🌐',
  },
];

export function SimulatorsPage() {
  const [active, setActive] = useState<string>('hardware');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">المحاكيات التفاعلية</h1>
        <p className="section-subtitle">تدرّبي على المهارات التقنية بطريقة تفاعلية وآمنة</p>
      </div>

      {/* Simulator selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SIMULATORS.map(sim => (
          <button
            key={sim.id}
            onClick={() => setActive(sim.id)}
            className={`card p-5 text-right flex items-center gap-4 transition-all duration-200 ${
              active === sim.id
                ? 'border-2 border-primary-400 bg-primary-50/40 shadow-glow'
                : 'hover:border-primary-200'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 ${
              active === sim.id ? 'bg-gradient-primary' : 'bg-gray-100'
            }`}>
              {sim.emoji}
            </div>
            <div>
              <h3 className={`font-bold text-lg ${active === sim.id ? 'text-primary-700' : 'text-gray-800'}`}>
                {sim.title}
              </h3>
              <p className="text-sm text-gray-500">{sim.subtitle}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Active simulator */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {active === 'hardware' && <HardwareSimulator />}
          {active === 'network'  && <NetworkSimulator />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
