import { useState } from 'react';
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Board, Collaborator, Task, TaskFormValues } from '../types';
import { useStore } from '../store';
import {
  cn,
  downloadBoardFile,
  hasActiveFilters,
  uid,
} from '../utils';
import { BoardHeader } from './BoardHeader';
import { BoardDialog } from './BoardDialog';
import { CollaboratorsDialog } from './CollaboratorsDialog';
import { ColumnDialog } from './ColumnDialog';
import { ColumnView } from './Column';
import { TaskCard } from './TaskCard';
import { TaskDialog } from './TaskDialog';
import { useToast } from './Toast';
import { ConfirmDialog } from './ui';
import { EMPTY_FILTERS } from '../constants';

interface BoardPageProps {
  board: Board;
  onOpenSidebar: () => void;
}

type TaskDialogState = { taskId?: string; columnId: string };
type ConfirmState =
  | { kind: 'column'; columnId: string }
  | { kind: 'board' };

export function BoardPage({ board, onOpenSidebar }: BoardPageProps) {
  const { dispatch } = useStore();
  const { toast } = useToast();

  const [filters, setFilters] = useState<typeof EMPTY_FILTERS>(EMPTY_FILTERS);
  const [taskDialog, setTaskDialog] = useState<TaskDialogState | null>(null);
  const [columnDialog, setColumnDialog] = useState<{ columnId?: string } | null>(null);
  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [collaboratorsOpen, setCollaboratorsOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const filtering = hasActiveFilters(filters);
  const activeTask = activeTaskId ? board.tasks[activeTaskId] : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /* ------------------------------- Tareas -------------------------------- */

  const openNewTask = (columnId: string) => setTaskDialog({ columnId });

  const openTask = (taskId: string) => {
    const column = board.columns.find((item) => item.taskIds.includes(taskId));
    if (!column) return;
    setTaskDialog({ taskId, columnId: column.id });
  };

  const handleSaveTask = (values: TaskFormValues, targetColumnId: string) => {
    if (taskDialog?.taskId) {
      dispatch({
        type: 'UPDATE_TASK',
        boardId: board.id,
        taskId: taskDialog.taskId,
        values,
      });

      if (targetColumnId !== taskDialog.columnId) {
        const target = board.columns.find((column) => column.id === targetColumnId);
        dispatch({
          type: 'MOVE_TASK',
          boardId: board.id,
          taskId: taskDialog.taskId,
          toColumnId: targetColumnId,
          toIndex: target?.taskIds.length ?? 0,
        });
      }

      toast({ message: 'Tarea actualizada.' });
    } else {
      const now = new Date().toISOString();
      const task: Task = {
        id: uid('task'),
        ...values,
        createdAt: now,
        updatedAt: now,
      };
      dispatch({ type: 'CREATE_TASK', boardId: board.id, columnId: targetColumnId, task });
      toast({ message: 'Tarea creada.' });
    }

    setTaskDialog(null);
  };

  const handleDeleteTask = (task: Task) => {
    const column = board.columns.find((item) => item.taskIds.includes(task.id));
    const index = column ? column.taskIds.indexOf(task.id) : 0;
    dispatch({ type: 'DELETE_TASK', boardId: board.id, taskId: task.id });
    setTaskDialog(null);

    if (column) {
      toast({
        message: 'Tarea eliminada.',
        action: {
          label: 'Deshacer',
          onClick: () =>
            dispatch({
              type: 'RESTORE_TASK',
              boardId: board.id,
              columnId: column.id,
              task,
              index,
            }),
        },
      });
    }
  };

  /* ------------------------------ Columnas -------------------------------- */

  const handleCreateColumn = (title: string) => {
    dispatch({ type: 'CREATE_COLUMN', boardId: board.id, columnId: uid('col'), title });
    setColumnDialog(null);
    toast({ message: `Columna "${title}" creada.` });
  };

  const handleRenameColumn = (columnId: string, title: string) => {
    dispatch({ type: 'UPDATE_COLUMN', boardId: board.id, columnId, title });
    setColumnDialog(null);
    toast({ message: 'Columna actualizada.' });
  };

  const deleteTargetColumn =
    confirm?.kind === 'column'
      ? board.columns.find((column) => column.id === confirm.columnId)
      : undefined;

  const handleDeleteColumn = (columnId: string) => {
    dispatch({ type: 'DELETE_COLUMN', boardId: board.id, columnId });
    setConfirm(null);
    toast({ message: 'Columna eliminada.' });
  };

  const editingColumn =
    columnDialog?.columnId
      ? board.columns.find((column) => column.id === columnDialog.columnId)
      : undefined;

  /* ------------------------------ Tablero --------------------------------- */

  const handleUpdateBoard = (values: { title: string; description: string; color: string }) => {
    dispatch({ type: 'UPDATE_BOARD', boardId: board.id, patch: values });
    setBoardDialogOpen(false);
    toast({ message: 'Tablero actualizado.' });
  };

  const handleDeleteBoard = () => {
    dispatch({ type: 'DELETE_BOARD', boardId: board.id });
    setConfirm(null);
    toast({
      message: 'Tablero eliminado.',
      action: {
        label: 'Deshacer',
        onClick: () => dispatch({ type: 'IMPORT_BOARD', board }),
      },
    });
  };

  const handleExport = () => {
    downloadBoardFile(board.title, board);
    toast({ message: 'Tablero exportado como JSON.' });
  };

  /* --------------------------- Colaboradores ------------------------------ */

  const handleAddCollaborator = (collaborator: Collaborator) => {
    dispatch({ type: 'ADD_COLLABORATOR', boardId: board.id, collaborator });
    toast({ message: `${collaborator.name} se sumó al tablero.` });
  };

  const handleRemoveCollaborator = (collaboratorId: string) => {
    dispatch({ type: 'DELETE_COLLABORATOR', boardId: board.id, collaboratorId });
    toast({ message: 'Colaborador eliminado. Sus tareas quedaron sin asignar.' });
  };

  /* ------------------------------ Drag & drop ----------------------------- */

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'task') {
      setActiveTaskId(String(event.active.id));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);
    if (!over) return;

    const activeType = active.data.current?.type;
    const overData = over.data.current;

    if (activeType === 'column') {
      const overColumnId =
        overData?.type === 'column' ? String(over.id) : (overData?.columnId as string | undefined);
      if (overColumnId && overColumnId !== active.id) {
        dispatch({
          type: 'MOVE_COLUMN',
          boardId: board.id,
          activeId: String(active.id),
          overId: overColumnId,
        });
      }
      return;
    }

    if (activeType !== 'task') return;

    let targetColumnId: string | undefined;
    let toIndex = 0;

    if (overData?.type === 'task') {
      targetColumnId = overData.columnId as string;
      const targetColumn = board.columns.find((column) => column.id === targetColumnId);
      if (targetColumn) {
        const overIndex = targetColumn.taskIds.indexOf(String(over.id));
        toIndex = overIndex >= 0 ? overIndex : targetColumn.taskIds.length;
      }
    } else if (overData?.type === 'column-body' || overData?.type === 'column') {
      targetColumnId =
        overData.type === 'column-body' ? (overData.columnId as string) : String(over.id);
      const targetColumn = board.columns.find((column) => column.id === targetColumnId);
      toIndex = targetColumn?.taskIds.length ?? 0;
    }

    if (!targetColumnId) return;

    dispatch({
      type: 'MOVE_TASK',
      boardId: board.id,
      taskId: String(active.id),
      toColumnId: targetColumnId,
      toIndex,
    });
  };

  return (
    <div className="board-page">
      <BoardHeader
        board={board}
        filters={filters}
        onFiltersChange={setFilters}
        onNewColumn={() => setColumnDialog({})}
        onOpenSidebar={onOpenSidebar}
        onEditBoard={() => setBoardDialogOpen(true)}
        onOpenCollaborators={() => setCollaboratorsOpen(true)}
        onExport={handleExport}
        onDeleteBoard={() => setConfirm({ kind: 'board' })}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveTaskId(null)}
      >
        <SortableContext
          items={board.columns.map((column) => column.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className={cn('board-canvas', board.columns.length === 0 && 'is-empty')}>
            {board.columns.map((column) => (
              <ColumnView
                key={column.id}
                board={board}
                column={column}
                filters={filters}
                filtering={filtering}
                onCreateTask={() => openNewTask(column.id)}
                onOpenTask={openTask}
                onEditColumn={() => setColumnDialog({ columnId: column.id })}
                onDeleteColumn={() => setConfirm({ kind: 'column', columnId: column.id })}
              />
            ))}

            <button
              type="button"
              className="add-column-tile"
              onClick={() => setColumnDialog({})}
            >
              <Plus size={16} />
              Añadir columna
            </button>
          </div>
        </SortableContext>

        <DragOverlay>
          {activeTask ? (
            <div className="drag-overlay-task">
              <TaskCard task={activeTask} board={board} overlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {taskDialog && (
        <TaskDialog
          key={taskDialog.taskId ?? taskDialog.columnId}
          board={board}
          task={taskDialog.taskId ? board.tasks[taskDialog.taskId] ?? null : null}
          columnId={taskDialog.columnId}
          onClose={() => setTaskDialog(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}

      {columnDialog && (
        <ColumnDialog
          title={editingColumn?.title ?? ''}
          onClose={() => setColumnDialog(null)}
          onSubmit={(title) =>
            editingColumn
              ? handleRenameColumn(editingColumn.id, title)
              : handleCreateColumn(title)
          }
        />
      )}

      {boardDialogOpen && (
        <BoardDialog
          board={board}
          onClose={() => setBoardDialogOpen(false)}
          onSubmit={handleUpdateBoard}
        />
      )}

      {collaboratorsOpen && (
        <CollaboratorsDialog
          board={board}
          onClose={() => setCollaboratorsOpen(false)}
          onAdd={handleAddCollaborator}
          onRemove={handleRemoveCollaborator}
        />
      )}

      {confirm?.kind === 'column' && deleteTargetColumn && (
        <ConfirmDialog
          title="Eliminar columna"
          message={
            deleteTargetColumn.taskIds.length > 0
              ? `Se eliminarán la columna "${deleteTargetColumn.title}" y sus ${deleteTargetColumn.taskIds.length} tareas. Esta acción no se puede deshacer.`
              : `Se eliminará la columna "${deleteTargetColumn.title}".`
          }
          onClose={() => setConfirm(null)}
          onConfirm={() => handleDeleteColumn(deleteTargetColumn.id)}
        />
      )}

      {confirm?.kind === 'board' && (
        <ConfirmDialog
          title="Eliminar tablero"
          message={`Se eliminará el tablero "${board.title}" con todas sus columnas y tareas.`}
          onClose={() => setConfirm(null)}
          onConfirm={handleDeleteBoard}
        />
      )}
    </div>
  );
}
