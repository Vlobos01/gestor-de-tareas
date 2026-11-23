export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type Theme = 'light' | 'dark';

export type DueFilter = 'all' | 'overdue' | 'today' | 'week' | 'none';

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  /** Fecha local en formato YYYY-MM-DD. */
  dueDate: string | null;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export interface Board {
  id: string;
  title: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  columns: Column[];
  tasks: Record<string, Task>;
  collaborators: Collaborator[];
}

export interface Filters {
  query: string;
  priorities: Priority[];
  /** 'all' | 'unassigned' | id de colaborador. */
  assignee: string;
  due: DueFilter;
}

export interface AppState {
  boards: Board[];
  activeBoardId: string | null;
  theme: Theme;
}

export interface TaskFormValues {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string | null;
  assigneeId: string | null;
}
