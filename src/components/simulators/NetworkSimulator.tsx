import React, { useState, useRef, useCallback } from 'react';
import { Plus, Trash2, Play, RotateCcw, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Modal, Input } from '../common';
import { isOnSameSubnet } from '../../lib/utils';
import type { NetworkDevice, NetworkConnection } from '../../types';

type DeviceType = 'pc' | 'switch' | 'router';

const DEVICE_ICONS: Record<DeviceType, string> = {
  pc:     '💻',
  switch: '🔀',
  router: '🌐',
};

const DEVICE_LABELS: Record<DeviceType, string> = {
  pc:     'حاسب',
  switch: 'سويتش',
  router: 'راوتر',
};

// Preloaded scenario: 3 PCs, one with wrong IP
const PRELOADED_SCENARIO: { devices: NetworkDevice[]; connections: NetworkConnection[] } = {
  devices: [
    { id: 'd1', type: 'switch', label: 'Switch-01', x: 300, y: 200 },
    { id: 'd2', type: 'pc', label: 'PC-01', x: 120, y: 350, ip: '192.168.1.10', subnet: '255.255.255.0', gateway: '192.168.1.1' },
    { id: 'd3', type: 'pc', label: 'PC-02', x: 300, y: 380, ip: '192.168.1.20', subnet: '255.255.255.0', gateway: '192.168.1.1' },
    { id: 'd4', type: 'pc', label: 'PC-03 ❌', x: 480, y: 350, ip: '192.168.2.50', subnet: '255.255.255.0', gateway: '192.168.1.1' },
  ],
  connections: [
    { id: 'c1', fromId: 'd2', toId: 'd1' },
    { id: 'c2', fromId: 'd3', toId: 'd1' },
    { id: 'c3', fromId: 'd4', toId: 'd1' },
  ],
};

interface TestResult {
  from: string;
  to: string;
  success: boolean;
  reason: string;
}

export function NetworkSimulator() {
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [configDevice, setConfigDevice] = useState<NetworkDevice | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<SVGSVGElement>(null);

  const addDevice = (type: DeviceType) => {
    const newDevice: NetworkDevice = {
      id: `d${Date.now()}`,
      type,
      label: `${DEVICE_LABELS[type]}-${devices.filter(d => d.type === type).length + 1}`,
      x: 150 + Math.random() * 300,
      y: 150 + Math.random() * 200,
      ip: type === 'pc' ? '' : undefined,
      subnet: type === 'pc' ? '255.255.255.0' : undefined,
      gateway: type === 'pc' ? '' : undefined,
    };
    setDevices(d => [...d, newDevice]);
  };

  const handleDeviceMouseDown = (e: React.MouseEvent, deviceId: string) => {
    if (connecting) {
      // Complete connection
      if (connecting !== deviceId) {
        const newConn: NetworkConnection = {
          id: `c${Date.now()}`,
          fromId: connecting,
          toId: deviceId,
        };
        setConnections(c => [...c, newConn]);
      }
      setConnecting(null);
      return;
    }
    // Start drag
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;
    setDraggingId(deviceId);
    setDragOffset({ x: e.clientX - rect.left - device.x, y: e.clientY - rect.top - device.y });
    e.stopPropagation();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    setDevices(devs => devs.map(d => d.id === draggingId ? { ...d, x, y } : d));
  };

  const testConnections = () => {
    const pcs = devices.filter(d => d.type === 'pc' && d.ip);
    const results: TestResult[] = [];
    for (let i = 0; i < pcs.length; i++) {
      for (let j = i + 1; j < pcs.length; j++) {
        const a = pcs[i];
        const b = pcs[j];
        if (!a.ip || !b.ip || !a.subnet) {
          results.push({ from: a.label, to: b.label, success: false, reason: 'عنوان IP غير مكتمل' });
          continue;
        }
        const sameSubnet = isOnSameSubnet(a.ip, b.ip, a.subnet);
        results.push({
          from: a.label, to: b.label, success: sameSubnet,
          reason: sameSubnet
            ? 'كلا الجهازين في نفس الشبكة الفرعية'
            : `الجهاز ${a.label} (${a.ip}) والجهاز ${b.label} (${b.ip}) في شبكات مختلفة — تحققي من Subnet Mask`,
        });
      }
    }
    setTestResults(results);
    setShowResults(true);
  };

  const loadScenario = () => {
    setDevices(PRELOADED_SCENARIO.devices);
    setConnections(PRELOADED_SCENARIO.connections);
    setTestResults([]);
    setShowResults(false);
  };

  const saveDeviceConfig = (updated: NetworkDevice) => {
    setDevices(devs => devs.map(d => d.id === updated.id ? updated : d));
    setConfigDevice(null);
  };

  const deleteDevice = (id: string) => {
    setDevices(d => d.filter(x => x.id !== id));
    setConnections(c => c.filter(x => x.fromId !== id && x.toId !== id));
  };

  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-primary p-4">
        <h2 className="text-white font-black text-lg">🌐 محاكي الشبكة التفاعلي</h2>
        <p className="text-white/70 text-sm">أضيفي الأجهزة وصلي بينها وعيّني عناوين IP</p>
      </div>

      {/* Toolbar */}
      <div className="p-3 border-b border-gray-100 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">أضيفي:</span>
        {(['pc', 'switch', 'router'] as DeviceType[]).map(type => (
          <button
            key={type}
            onClick={() => addDevice(type)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-primary-100 text-sm font-medium transition-colors"
          >
            {DEVICE_ICONS[type]} {DEVICE_LABELS[type]}
          </button>
        ))}
        <div className="flex-1" />
        <Button variant="secondary" size="sm" onClick={loadScenario}>
          📋 سيناريو: صحح الخطأ
        </Button>
        <Button variant="primary" size="sm" icon={<Play size={14} />} onClick={testConnections}>
          اختبر الاتصال
        </Button>
        <button onClick={() => { setDevices([]); setConnections([]); setTestResults([]); setShowResults(false); }}
          className="p-2 text-gray-400 hover:text-danger transition-colors">
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Canvas */}
      <div className="relative overflow-hidden bg-gray-50" style={{ height: 450 }}>
        {/* Grid dots */}
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#e9e2ff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <svg
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseUp={() => setDraggingId(null)}
        >
          {/* Connections */}
          {connections.map(conn => {
            const from = devices.find(d => d.id === conn.fromId);
            const to   = devices.find(d => d.id === conn.toId);
            if (!from || !to) return null;
            return (
              <line
                key={conn.id}
                x1={from.x + 24} y1={from.y + 24}
                x2={to.x + 24}   y2={to.y + 24}
                stroke="#7B5CC8" strokeWidth={2} strokeDasharray="6,4"
                opacity={0.7}
              />
            );
          })}

          {/* Active connection preview */}
          {connecting && (() => {
            const from = devices.find(d => d.id === connecting);
            if (!from) return null;
            return (
              <line
                x1={from.x + 24} y1={from.y + 24}
                x2={from.x + 80} y2={from.y}
                stroke="#9270ff" strokeWidth={2} strokeDasharray="4,4" opacity={0.5}
              />
            );
          })()}
        </svg>

        {/* Device nodes */}
        {devices.map(device => (
          <div
            key={device.id}
            className={`absolute select-none cursor-grab active:cursor-grabbing ${
              connecting === device.id ? 'ring-4 ring-primary-400 rounded-2xl' : ''
            }`}
            style={{ left: device.x, top: device.y, zIndex: draggingId === device.id ? 50 : 10 }}
            onMouseDown={e => handleDeviceMouseDown(e, device.id)}
          >
            <div className="w-16 h-16 bg-white rounded-2xl shadow-card flex flex-col items-center justify-center border-2 border-gray-200 hover:border-primary-400 transition-all">
              <span className="text-2xl">{DEVICE_ICONS[device.type]}</span>
              {device.ip && <span className="text-[9px] text-gray-500 font-mono leading-tight">{device.ip}</span>}
            </div>
            <p className="text-center text-xs text-gray-600 mt-1 font-medium max-w-[70px] truncate">{device.label}</p>

            {/* Action buttons */}
            <div className="absolute -top-2 -right-2 flex gap-1">
              <button
                onClick={e => { e.stopPropagation(); setConfigDevice(device); }}
                className="w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors"
              >
                <Settings size={10} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setConnecting(connecting === device.id ? null : device.id); }}
                className={`w-5 h-5 text-white rounded-full flex items-center justify-center transition-colors ${
                  connecting === device.id ? 'bg-danger' : 'bg-success'
                }`}
              >
                <Plus size={10} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); deleteDevice(device.id); }}
                className="w-5 h-5 bg-gray-400 text-white rounded-full flex items-center justify-center hover:bg-danger transition-colors"
              >
                <Trash2 size={10} />
              </button>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {devices.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <p className="text-4xl mb-2">🌐</p>
              <p className="font-semibold">أضيفي أجهزة للبدء</p>
              <p className="text-sm">أو جرّبي سيناريو "صحح الخطأ"</p>
            </div>
          </div>
        )}
      </div>

      {/* Test results */}
      {showResults && testResults.length > 0 && (
        <div className="p-4 border-t border-gray-100 space-y-2">
          <h3 className="font-bold text-gray-700 text-sm">نتائج اختبار الاتصال:</h3>
          {testResults.map((r, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl text-sm ${
                r.success ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
              }`}
            >
              <span className="text-lg">{r.success ? '✓' : '✗'}</span>
              <div>
                <span className="font-bold">{r.from} ↔ {r.to}: </span>
                <span>{r.reason}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Config modal */}
      {configDevice && (
        <Modal
          open={true}
          onClose={() => setConfigDevice(null)}
          title={`إعداد ${configDevice.label}`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfigDevice(null)}>إلغاء</Button>
              <Button variant="primary" onClick={() => saveDeviceConfig(configDevice)}>حفظ</Button>
            </>
          }
        >
          <div className="space-y-3">
            <Input label="اسم الجهاز" value={configDevice.label}
              onChange={e => setConfigDevice(d => d ? { ...d, label: e.target.value } : d)}
              id="dev-label" />
            {configDevice.type === 'pc' && (
              <>
                <Input label="عنوان IP" value={configDevice.ip ?? ''} dir="ltr"
                  onChange={e => setConfigDevice(d => d ? { ...d, ip: e.target.value } : d)}
                  placeholder="192.168.1.x" id="dev-ip" />
                <Input label="Subnet Mask" value={configDevice.subnet ?? '255.255.255.0'} dir="ltr"
                  onChange={e => setConfigDevice(d => d ? { ...d, subnet: e.target.value } : d)} id="dev-mask" />
                <Input label="Default Gateway" value={configDevice.gateway ?? ''} dir="ltr"
                  onChange={e => setConfigDevice(d => d ? { ...d, gateway: e.target.value } : d)}
                  placeholder="192.168.1.1" id="dev-gw" />
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
