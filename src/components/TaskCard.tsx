import type { CSSProperties, ReactNode } from 'react';
import { CalendarDays } from 'lucide-react';
import type { Board, Task } from '../types';
import { PRIORITY_META } from '../constants';
import { cn, dueInfo } from '../utils';
import { Avatar } from './ui';

interface TaskCardProps {
  task: Task;
  board: Board;
  onOpen?: () => void;
  overlay?: boolean;
  dragHandle?: ReactNode;
}

export function TaskCard({ task, board, onOpen, overlay, dragHandle }: TaskCardProps) {
  const priority = PRIORITY_META[task.priority];
  const due = dueInfo(task.dueDate);
  const assignee = board.collaborators.find(
    (collaborator) => collaborator.id === task.assigneeId,
  );

  return (
    <article
      className={cn('task-card', overlay && 'is-overlay')}
      style={{ '--priority-color': priority.color } as CSSProperties}
      onClick={onOpen}
    >
      <div className="task-card-top">
        <span className="priority-pill">
          <span className="dot" />
          {priority.label}
        </span>
        {dragHandle}
      </div>

      <h4 className="task-card-title">
        <button
          type="button"
          className="task-open-button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen?.();
          }}
        >
          {task.title}
        </button>
      </h4>
      {task.description && <p className="task-card-description">{task.description}</p>}

      {(due || assignee) && (
        <footer className="task-card-footer">
          {due ? (
            <span className={cn('due-badge', `due-${due.tone}`)}>
              <CalendarDays size={13} />
              {due.label}
            </span>
          ) : (
            <span />
          )}
          {assignee && (
            <Avatar name={assignee.name} color={assignee.color} size="xs" />
          )}
        </footer>
      )}
    </article>
  );
}
