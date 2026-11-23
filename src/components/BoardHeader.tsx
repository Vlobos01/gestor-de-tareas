import type { CSSProperties } from 'react';
import {
  Download,
  Menu as MenuIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import type { Board, Filters } from '../types';
import { DUE_FILTERS, PRIORITIES } from '../constants';
import { cn, diffDays, hasActiveFilters, pluralize } from '../utils';
import { Avatar, Menu, MenuItem, MenuSeparator } from './ui';

interface BoardHeaderProps {
  board: Board;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onNewColumn: () => void;
  onOpenSidebar: () => void;
  onEditBoard: () => void;
  onOpenCollaborators: () => void;
  onExport: () => void;
  onDeleteBoard: () => void;
}

export function BoardHeader({
  board,
  filters,
  onFiltersChange,
  onNewColumn,
  onOpenSidebar,
  onEditBoard,
  onOpenCollaborators,
  onExport,
  onDeleteBoard,
}: BoardHeaderProps) {
  const tasks = Object.values(board.tasks);
  const overdue = tasks.filter(
    (task) => task.dueDate && diffDays(task.dueDate) < 0,
  ).length;

  const filtering = hasActiveFilters(filters);
  const visibleCollaborators = board.collaborators.slice(0, 4);
  const hiddenCollaborators = board.collaborators.length - visibleCollaborators.length;

  const togglePriority = (priority: Filters['priorities'][number]) => {
    const priorities = filters.priorities.includes(priority)
      ? filters.priorities.filter((item) => item !== priority)
      : [...filters.priorities, priority];
    onFiltersChange({ ...filters, priorities });
  };

  return (
    <header
      className="board-header"
      style={{ '--board-accent': board.color } as CSSProperties}
    >
      <div className="board-header-top">
        <button
          type="button"
          className="icon-btn mobile-only"
          onClick={onOpenSidebar}
          aria-label="Abrir menú de tableros"
        >
          <MenuIcon size={20} />
        </button>

        <div className="board-heading">
          <div className="board-eyebrow">
            <span className="board-dot" />
            {pluralize(tasks.length, 'tarea', 'tareas')}
            {overdue > 0 && (
              <span className="overdue-label">· {pluralize(overdue, 'vencida', 'vencidas')}</span>
            )}
          </div>
          <h1>{board.title}</h1>
          {board.description && <p className="board-description">{board.description}</p>}
        </div>

        <div className="board-header-actions">
          <button
            type="button"
            className="avatar-stack"
            onClick={onOpenCollaborators}
            title="Gestionar colaboradores"
            aria-label="Gestionar colaboradores"
          >
            {visibleCollaborators.length === 0 ? (
              <span className="avatar-stack-empty">
                <Users size={16} />
              </span>
            ) : (
              visibleCollaborators.map((collaborator) => (
                <Avatar
                  key={collaborator.id}
                  name={collaborator.name}
                  color={collaborator.color}
                  size="sm"
                />
              ))
            )}
            {hiddenCollaborators > 0 && (
              <span className="avatar avatar-sm avatar-more">+{hiddenCollaborators}</span>
            )}
          </button>

          <button type="button" className="btn btn-secondary btn-sm hide-sm" onClick={onNewColumn}>
            <Plus size={15} />
            Nueva columna
          </button>

          <Menu trigger={<MoreHorizontal size={18} />} title="Opciones del tablero">
            {(close) => (
              <>
                <MenuItem
                  icon={<Pencil size={15} />}
                  onClick={() => {
                    close();
                    onEditBoard();
                  }}
                >
                  Editar tablero
                </MenuItem>
                <MenuItem
                  icon={<Users size={15} />}
                  onClick={() => {
                    close();
                    onOpenCollaborators();
                  }}
                >
                  Colaboradores
                </MenuItem>
                <MenuItem
                  icon={<Download size={15} />}
                  onClick={() => {
                    close();
                    onExport();
                  }}
                >
                  Exportar JSON
                </MenuItem>
                <MenuSeparator />
                <MenuItem
                  icon={<Trash2 size={15} />}
                  danger
                  onClick={() => {
                    close();
                    onDeleteBoard();
                  }}
                >
                  Eliminar tablero
                </MenuItem>
              </>
            )}
          </Menu>
        </div>
      </div>

      <div className="board-toolbar">
        <label className="search-field">
          <Search size={16} />
          <input
            type="search"
            value={filters.query}
            placeholder="Buscar tareas..."
            aria-label="Buscar tareas"
            onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })}
          />
          {filters.query && (
            <button
              type="button"
              className="search-clear"
              onClick={() => onFiltersChange({ ...filters, query: '' })}
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </label>

        <Menu
          trigger={
            <>
              <SlidersHorizontal size={15} />
              Prioridad
              {filters.priorities.length > 0 && (
                <span className="filter-count">{filters.priorities.length}</span>
              )}
            </>
          }
          title="Filtrar por prioridad"
          align="start"
          triggerClassName={cn('btn btn-secondary btn-sm filter-trigger', filters.priorities.length > 0 && 'is-active')}
        >
          {() => (
            <>
              {PRIORITIES.map((priority) => (
                <MenuItem
                  key={priority.value}
                  selected={filters.priorities.includes(priority.value)}
                  onClick={() => togglePriority(priority.value)}
                  icon={<span className="dot" style={{ backgroundColor: priority.color }} />}
                >
                  {priority.label}
                </MenuItem>
              ))}
              {filters.priorities.length > 0 && (
                <>
                  <MenuSeparator />
                  <MenuItem onClick={() => onFiltersChange({ ...filters, priorities: [] })}>
                    Quitar filtro
                  </MenuItem>
                </>
              )}
            </>
          )}
        </Menu>

        <label className={cn('select-field', filters.assignee !== 'all' && 'is-active')}>
          <UserRound size={15} />
          <select
            value={filters.assignee}
            aria-label="Filtrar por responsable"
            onChange={(event) => onFiltersChange({ ...filters, assignee: event.target.value })}
          >
            <option value="all">Todos</option>
            <option value="unassigned">Sin asignar</option>
            {board.collaborators.map((collaborator) => (
              <option key={collaborator.id} value={collaborator.id}>
                {collaborator.name}
              </option>
            ))}
          </select>
        </label>

        <label className={cn('select-field', filters.due !== 'all' && 'is-active')}>
          <select
            value={filters.due}
            aria-label="Filtrar por fecha de entrega"
            onChange={(event) =>
              onFiltersChange({ ...filters, due: event.target.value as Filters['due'] })
            }
          >
            {DUE_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {filtering && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onFiltersChange({ query: '', priorities: [], assignee: 'all', due: 'all' })}
          >
            <X size={14} />
            Limpiar filtros
          </button>
        )}
      </div>
    </header>
  );
}
