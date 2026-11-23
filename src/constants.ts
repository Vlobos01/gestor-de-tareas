import type { Filters, Priority } from './types';

export const STORAGE_KEY = 'flujo.state.v1';

export const PRIORITIES: Array<{ value: Priority; label: string; color: string }> = [
  { value: 'urgent', label: 'Urgente', color: '#ef4444' },
  { value: 'high', label: 'Alta', color: '#f97316' },
  { value: 'medium', label: 'Media', color: '#3b82f6' },
  { value: 'low', label: 'Baja', color: '#94a3b8' },
];

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  urgent: { label: 'Urgente', color: '#ef4444' },
  high: { label: 'Alta', color: '#f97316' },
  medium: { label: 'Media', color: '#3b82f6' },
  low: { label: 'Baja', color: '#94a3b8' },
};

export const BOARD_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#64748b',
];

export const AVATAR_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#0891b2',
  '#475569',
];

export const DEFAULT_COLUMNS = ['Por hacer', 'En progreso', 'Hecho'];

export const EMPTY_FILTERS: Filters = {
  query: '',
  priorities: [],
  assignee: 'all',
  due: 'all',
};

export const DUE_FILTERS: Array<{ value: Filters['due']; label: string }> = [
  { value: 'all', label: 'Cualquier fecha' },
  { value: 'overdue', label: 'Vencidas' },
  { value: 'today', label: 'Para hoy' },
  { value: 'week', label: 'Próximos 7 días' },
  { value: 'none', label: 'Sin fecha' },
];
