import { GripVertical, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Board, Column, Filters, Task } from '../types';
import { cn, matchesTask } from '../utils';
import { Menu, MenuItem, MenuSeparator } from './ui';
import { TaskCard } from './TaskCard';

interface ColumnViewProps {
  board: Board;
  column: Column;
  filters: Filters;
  filtering: boolean;
  onCreateTask: () => void;
  onOpenTask: (taskId: string) => void;
  onEditColumn: () => void;
  onDeleteColumn: () => void;
}

export function ColumnView({
  board,
  column,
  filters,
  filtering,
  onCreateTask,
  onOpenTask,
  onEditColumn,
  onDeleteColumn,
}: ColumnViewProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: 'column' } });

  const { setNodeRef: setBodyRef, isOver } = useDroppable({
    id: `body:${column.id}`,
    data: { type: 'column-body', columnId: column.id },
  });

  const tasks = column.taskIds
    .map((taskId) => board.tasks[taskId])
    .filter((task): task is Task => Boolean(task));

  const visibleTasks = filtering ? tasks.filter((task) => matchesTask(task, filters)) : tasks;

  return (
    <section
      ref={setNodeRef}
      className={cn('column', isDragging && 'is-dragging')}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      aria-label={`Columna ${column.title}`}
    >
      <header className="column-header">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="column-grip"
          title="Arrastrar columna"
          aria-label={`Mover columna ${column.title}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={15} />
        </button>

        <h3 className="column-title">{column.title}</h3>
        <span className="column-count">
          {filtering && visibleTasks.length !== tasks.length
            ? `${visibleTasks.length}/${tasks.length}`
            : tasks.length}
        </span>

        <Menu
          trigger={<MoreHorizontal size={16} />}
          title={`Opciones de ${column.title}`}
          triggerClassName="icon-btn column-menu-btn"
        >
          {(close) => (
            <>
              <MenuItem
                icon={<Pencil size={15} />}
                onClick={() => {
                  close();
                  onEditColumn();
                }}
              >
                Renombrar columna
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                icon={<Trash2 size={15} />}
                danger
                onClick={() => {
                  close();
                  onDeleteColumn();
                }}
              >
                Eliminar columna
              </MenuItem>
            </>
          )}
        </Menu>
      </header>

      <div
        ref={setBodyRef}
        className={cn('column-tasks', isOver && 'is-over')}
      >
        <SortableContext items={visibleTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {visibleTasks.map((task) => (
            <SortableTask
              key={task.id}
              task={task}
              board={board}
              columnId={column.id}
              onOpen={() => onOpenTask(task.id)}
            />
          ))}
        </SortableContext>

        {visibleTasks.length === 0 && (
          <div className="column-empty">
            {filtering && tasks.length > 0
              ? 'Ninguna tarea coincide con los filtros.'
              : 'Arrastrá tareas acá o creá una nueva.'}
          </div>
        )}
      </div>

      <button type="button" className="add-task-btn" onClick={onCreateTask}>
        <Plus size={16} />
        Añadir tarea
      </button>
    </section>
  );
}

interface SortableTaskProps {
  task: Task;
  board: Board;
  columnId: string;
  onOpen: () => void;
}

function SortableTask({ task, board, columnId, onOpen }: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'task', columnId } });

  return (
    <div
      ref={setNodeRef}
      className={cn('task-slot', isDragging && 'is-dragging')}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <TaskCard
        task={task}
        board={board}
        onOpen={onOpen}
        dragHandle={
          <button
            ref={setActivatorNodeRef}
            type="button"
            className="task-drag-handle"
            title="Arrastrar tarea"
            aria-label={`Mover tarea ${task.title}`}
            onClick={(event) => event.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={14} />
          </button>
        }
      />
    </div>
  );
}
