import { useState, type CSSProperties, type FormEvent } from 'react';
import { CalendarDays, Trash2, UserRound } from 'lucide-react';
import type { Board, Priority, Task, TaskFormValues } from '../types';
import { PRIORITIES } from '../constants';
import { addDaysISO, cn, todayISO } from '../utils';
import { Avatar, Modal } from './ui';

interface TaskDialogProps {
  board: Board;
  task: Task | null;
  columnId: string;
  onClose: () => void;
  onSave: (values: TaskFormValues, columnId: string) => void;
  onDelete?: (task: Task) => void;
}

export function TaskDialog({
  board,
  task,
  columnId,
  onClose,
  onSave,
  onDelete,
}: TaskDialogProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState<string>(task?.dueDate ?? '');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? '');
  const [targetColumnId, setTargetColumnId] = useState(columnId);
  const [error, setError] = useState('');

  const isEditing = Boolean(task);
  const assignee = board.collaborators.find((collaborator) => collaborator.id === assigneeId);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('La tarea necesita un título.');
      return;
    }

    onSave(
      {
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate || null,
        assigneeId: assigneeId || null,
      },
      targetColumnId,
    );
  };

  const quickDates: Array<{ label: string; value: string }> = [
    { label: 'Hoy', value: todayISO() },
    { label: 'Mañana', value: addDaysISO(1) },
    { label: 'En 7 días', value: addDaysISO(7) },
  ];

  return (
    <Modal
      title={isEditing ? 'Editar tarea' : 'Nueva tarea'}
      subtitle={isEditing ? 'Actualizá los detalles de la tarea.' : 'Describí la tarea y asigná un responsable.'}
      onClose={onClose}
      size="md"
      footer={
        <>
          {isEditing && task && onDelete && (
            <button type="button" className="btn btn-ghost btn-danger-text" onClick={() => onDelete(task)}>
              <Trash2 size={15} />
              Eliminar
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="task-form" className="btn btn-primary">
            {isEditing ? 'Guardar cambios' : 'Crear tarea'}
          </button>
        </>
      }
    >
      <form id="task-form" className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="task-title">Título</label>
          <input
            id="task-title"
            className="input"
            value={title}
            placeholder="¿Qué hay que hacer?"
            onChange={(event) => {
              setTitle(event.target.value);
              setError('');
            }}
            maxLength={120}
          />
          {error && <span className="field-error">{error}</span>}
        </div>

        <div className="field">
          <label htmlFor="task-description">Descripción</label>
          <textarea
            id="task-description"
            className="textarea"
            value={description}
            placeholder="Agregá contexto, criterios de aceptación o enlaces."
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        </div>

        <div className="field">
          <label>Prioridad</label>
          <div className="segmented" role="group" aria-label="Prioridad">
            {PRIORITIES.map((item) => (
              <button
                key={item.value}
                type="button"
                className={cn('segment', priority === item.value && 'is-active')}
                style={{ '--priority': item.color } as CSSProperties}
                onClick={() => setPriority(item.value)}
                aria-pressed={priority === item.value}
              >
                <span className="dot" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="task-due">
              <CalendarDays size={14} />
              Fecha de entrega
            </label>
            <input
              id="task-due"
              type="date"
              className="input"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
            <div className="quick-dates">
              {quickDates.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  className={cn('chip-button', dueDate === option.value && 'is-active')}
                  onClick={() => setDueDate(option.value)}
                >
                  {option.label}
                </button>
              ))}
              {dueDate && (
                <button type="button" className="chip-button" onClick={() => setDueDate('')}>
                  Quitar
                </button>
              )}
            </div>
          </div>

          <div className="field">
            <label htmlFor="task-assignee">
              <UserRound size={14} />
              Responsable
            </label>
            <div className="assignee-select">
              {assignee && <Avatar name={assignee.name} color={assignee.color} size="sm" />}
              <select
                id="task-assignee"
                className="select"
                value={assigneeId}
                onChange={(event) => setAssigneeId(event.target.value)}
              >
                <option value="">Sin asignar</option>
                {board.collaborators.map((collaborator) => (
                  <option key={collaborator.id} value={collaborator.id}>
                    {collaborator.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="field">
          <label htmlFor="task-column">Columna</label>
          <select
            id="task-column"
            className="select"
            value={targetColumnId}
            onChange={(event) => setTargetColumnId(event.target.value)}
          >
            {board.columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.title}
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}
