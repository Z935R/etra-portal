import { type ClassValue, clsx } from 'clsx';

// Simple cn utility without clsx dependency
export function cn(...inputs: (string | undefined | null | false | Record<string, boolean>)[]): string {
  return inputs
    .flatMap((input) => {
      if (!input) return [];
      if (typeof input === 'string') return [input];
      if (typeof input === 'object') {
        return Object.entries(input)
          .filter(([, val]) => val)
          .map(([key]) => key);
      }
      return [];
    })
    .join(' ');
}

// Format Arabic date
export function formatDateAr(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Format datetime Arabic
export function formatDateTimeAr(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Relative time in Arabic
export function timeAgoAr(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'منذ لحظات';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays === 1) return 'منذ يوم';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  return formatDateAr(d);
}

// Format ticket number
export function formatTicketNumber(num: number): string {
  return `TKT-${String(num).padStart(3, '0')}`;
}

// SLA remaining time
export function getSLAInfo(
  createdAt: string,
  priority: 'low' | 'medium' | 'high' | 'critical'
): { remaining: number; percentage: number; status: 'ok' | 'warning' | 'breach' } {
  const SLA_MS: Record<string, number> = {
    critical: 1 * 60 * 60 * 1000,
    high:     4 * 60 * 60 * 1000,
    medium:   8 * 60 * 60 * 1000,
    low:      24 * 60 * 60 * 1000,
  };

  const total = SLA_MS[priority];
  const elapsed = Date.now() - new Date(createdAt).getTime();
  const remaining = Math.max(0, total - elapsed);
  const percentage = Math.min(100, (elapsed / total) * 100);

  let status: 'ok' | 'warning' | 'breach' = 'ok';
  if (percentage >= 100) status = 'breach';
  else if (percentage >= 75) status = 'warning';

  return { remaining, percentage, status };
}

// Format duration
export function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hours > 0) return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Score color helper
export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-success';
  if (score >= 70) return 'text-warning';
  return 'text-danger';
}

// Initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('');
}

// Check if IP is on same subnet
export function isOnSameSubnet(ip1: string, ip2: string, subnet: string): boolean {
  try {
    const ipToNum = (ip: string) =>
      ip.split('.').reduce((acc, oct) => (acc << 8) | parseInt(oct), 0);
    const maskNum = ipToNum(subnet);
    return (ipToNum(ip1) & maskNum) === (ipToNum(ip2) & maskNum);
  } catch {
    return false;
  }
}
