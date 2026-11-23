import type { Filters, Task } from './types';

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDaysISO(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function diffDays(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${isoDate}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export type DueTone = 'overdue' | 'today' | 'soon' | 'normal';

export function dueInfo(isoDate: string | null): { label: string; tone: DueTone } | null {
  if (!isoDate) return null;

  const days = diffDays(isoDate);
  let label: string;

  if (days < 0) {
    label = days === -1 ? 'Venció ayer' : `Venció hace ${Math.abs(days)} d`;
  } else if (days === 0) {
    label = 'Vence hoy';
  } else if (days === 1) {
    label = 'Mañana';
  } else if (days <= 6) {
    label = `En ${days} días`;
  } else {
    label = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(
      new Date(`${isoDate}T00:00:00`),
    );
  }

  const tone: DueTone = days < 0 ? 'overdue' : days === 0 ? 'today' : days <= 2 ? 'soon' : 'normal';
  return { label, tone };
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function matchesTask(task: Task, filters: Filters): boolean {
  const query = filters.query.trim().toLowerCase();
  if (
    query &&
    !task.title.toLowerCase().includes(query) &&
    !task.description.toLowerCase().includes(query)
  ) {
    return false;
  }

  if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) {
    return false;
  }

  if (filters.assignee === 'unassigned') {
    if (task.assigneeId) return false;
  } else if (filters.assignee !== 'all') {
    if (task.assigneeId !== filters.assignee) return false;
  }

  if (filters.due !== 'all') {
    if (filters.due === 'none') {
      if (task.dueDate) return false;
    } else {
      if (!task.dueDate) return false;
      const days = diffDays(task.dueDate);
      if (filters.due === 'overdue' && days >= 0) return false;
      if (filters.due === 'today' && days !== 0) return false;
      if (filters.due === 'week' && (days < 0 || days > 7)) return false;
    }
  }

  return true;
}

export function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.query.trim() !== '' ||
    filters.priorities.length > 0 ||
    filters.assignee !== 'all' ||
    filters.due !== 'all'
  );
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'tablero';
}

export function downloadBoardFile(boardName: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugify(boardName)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
