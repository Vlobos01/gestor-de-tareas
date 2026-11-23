import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { STORAGE_KEY } from './constants';
import { createSeedState } from './seed';
import type {
  AppState,
  Board,
  Collaborator,
  Task,
  Theme,
} from './types';

export type Action =
  | { type: 'SET_ACTIVE_BOARD'; boardId: string | null }
  | { type: 'SET_THEME'; theme: Theme }
  | { type: 'TOGGLE_THEME' }
  | { type: 'CREATE_BOARD'; board: Board }
  | {
      type: 'UPDATE_BOARD';
      boardId: string;
      patch: Partial<Pick<Board, 'title' | 'description' | 'color'>>;
    }
  | { type: 'DELETE_BOARD'; boardId: string }
  | { type: 'IMPORT_BOARD'; board: Board }
  | { type: 'CREATE_COLUMN'; boardId: string; columnId: string; title: string }
  | { type: 'UPDATE_COLUMN'; boardId: string; columnId: string; title: string }
  | { type: 'DELETE_COLUMN'; boardId: string; columnId: string }
  | { type: 'MOVE_COLUMN'; boardId: string; activeId: string; overId: string }
  | { type: 'CREATE_TASK'; boardId: string; columnId: string; task: Task }
  | { type: 'UPDATE_TASK'; boardId: string; taskId: string; values: Partial<Task> }
  | { type: 'DELETE_TASK'; boardId: string; taskId: string }
  | { type: 'MOVE_TASK'; boardId: string; taskId: string; toColumnId: string; toIndex: number }
  | {
      type: 'RESTORE_TASK';
      boardId: string;
      columnId: string;
      task: Task;
      index: number;
    }
  | { type: 'ADD_COLLABORATOR'; boardId: string; collaborator: Collaborator }
  | { type: 'DELETE_COLLABORATOR'; boardId: string; collaboratorId: string };

interface StoreValue {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const StoreContext = createContext<StoreValue | null>(null);

function freshState(): AppState {
  const seed = createSeedState();
  return {
    boards: seed.boards,
    activeBoardId: seed.activeBoardId,
    theme:
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light',
  };
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();

    const parsed = JSON.parse(raw) as Partial<AppState> | null;
    if (!parsed || !Array.isArray(parsed.boards) || parsed.boards.length === 0) {
      return freshState();
    }

    const boards = parsed.boards.filter(
      (board): board is Board =>
        !!board && typeof board.id === 'string' && Array.isArray(board.columns),
    );

    if (boards.length === 0) return freshState();

    const activeBoardId = boards.some((board) => board.id === parsed.activeBoardId)
      ? (parsed.activeBoardId as string)
      : boards[0].id;

    return {
      boards,
      activeBoardId,
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
    };
  } catch {
    return freshState();
  }
}

function touch(board: Board): Board {
  return { ...board, updatedAt: new Date().toISOString() };
}

function mapBoard(state: AppState, boardId: string, updater: (board: Board) => Board): AppState {
  return {
    ...state,
    boards: state.boards.map((board) => (board.id === boardId ? updater(board) : board)),
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ACTIVE_BOARD':
      return { ...state, activeBoardId: action.boardId };

    case 'SET_THEME':
      return { ...state, theme: action.theme };

    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };

    case 'CREATE_BOARD':
      return {
        ...state,
        boards: [action.board, ...state.boards],
        activeBoardId: action.board.id,
      };

    case 'UPDATE_BOARD':
      return mapBoard(state, action.boardId, (board) =>
        touch({ ...board, ...action.patch }),
      );

    case 'DELETE_BOARD': {
      const boards = state.boards.filter((board) => board.id !== action.boardId);
      return {
        ...state,
        boards,
        activeBoardId:
          state.activeBoardId === action.boardId
            ? boards[0]?.id ?? null
            : state.activeBoardId,
      };
    }

    case 'IMPORT_BOARD':
      return {
        ...state,
        boards: [action.board, ...state.boards],
        activeBoardId: action.board.id,
      };

    case 'CREATE_COLUMN':
      return mapBoard(state, action.boardId, (board) =>
        touch({
          ...board,
          columns: [
            ...board.columns,
            { id: action.columnId, title: action.title.trim(), taskIds: [] },
          ],
        }),
      );

    case 'UPDATE_COLUMN':
      return mapBoard(state, action.boardId, (board) =>
        touch({
          ...board,
          columns: board.columns.map((column) =>
            column.id === action.columnId
              ? { ...column, title: action.title.trim() }
              : column,
          ),
        }),
      );

    case 'DELETE_COLUMN':
      return mapBoard(state, action.boardId, (board) => {
        const column = board.columns.find((item) => item.id === action.columnId);
        if (!column) return board;

        const tasks = { ...board.tasks };
        column.taskIds.forEach((taskId) => {
          delete tasks[taskId];
        });

        return touch({
          ...board,
          columns: board.columns.filter((item) => item.id !== action.columnId),
          tasks,
        });
      });

    case 'MOVE_COLUMN':
      return mapBoard(state, action.boardId, (board) => {
        const from = board.columns.findIndex((column) => column.id === action.activeId);
        const to = board.columns.findIndex((column) => column.id === action.overId);
        if (from === -1 || to === -1 || from === to) return board;

        const columns = [...board.columns];
        const [moved] = columns.splice(from, 1);
        columns.splice(to, 0, moved);
        return touch({ ...board, columns });
      });

    case 'CREATE_TASK':
      return mapBoard(state, action.boardId, (board) =>
        touch({
          ...board,
          tasks: { ...board.tasks, [action.task.id]: action.task },
          columns: board.columns.map((column) =>
            column.id === action.columnId
              ? { ...column, taskIds: [...column.taskIds, action.task.id] }
              : column,
          ),
        }),
      );

    case 'UPDATE_TASK':
      return mapBoard(state, action.boardId, (board) => {
        const task = board.tasks[action.taskId];
        if (!task) return board;

        const updated: Task = {
          ...task,
          ...action.values,
          id: task.id,
          updatedAt: new Date().toISOString(),
        };

        return touch({
          ...board,
          tasks: { ...board.tasks, [updated.id]: updated },
        });
      });

    case 'DELETE_TASK':
      return mapBoard(state, action.boardId, (board) => {
        if (!board.tasks[action.taskId]) return board;
        const tasks = { ...board.tasks };
        delete tasks[action.taskId];

        return touch({
          ...board,
          tasks,
          columns: board.columns.map((column) => ({
            ...column,
            taskIds: column.taskIds.filter((taskId) => taskId !== action.taskId),
          })),
        });
      });

    case 'MOVE_TASK':
      return mapBoard(state, action.boardId, (board) => {
        if (!board.tasks[action.taskId]) return board;

        const target = board.columns.find((column) => column.id === action.toColumnId);
        if (!target) return board;

        const sourceColumn = board.columns.find((column) =>
          column.taskIds.includes(action.taskId),
        );

        let insertAt = Math.max(0, Math.min(action.toIndex, target.taskIds.length));
        if (
          sourceColumn &&
          sourceColumn.id === target.id &&
          sourceColumn.taskIds.indexOf(action.taskId) < insertAt
        ) {
          insertAt -= 1;
        }

        const columns = board.columns.map((column) => {
          const taskIds = column.taskIds.filter((taskId) => taskId !== action.taskId);
          if (column.id !== target.id) return { ...column, taskIds };
          return { ...column, taskIds };
        });

        return touch({
          ...board,
          columns: columns.map((column) => {
            if (column.id !== target.id) return column;
            const taskIds = [...column.taskIds];
            taskIds.splice(insertAt, 0, action.taskId);
            return { ...column, taskIds };
          }),
        });
      });

    case 'RESTORE_TASK':
      return mapBoard(state, action.boardId, (board) => {
        const column = board.columns.find((item) => item.id === action.columnId);
        if (!column) return board;

        const taskIds = [...column.taskIds];
        taskIds.splice(Math.min(action.index, taskIds.length), 0, action.task.id);

        return touch({
          ...board,
          tasks: { ...board.tasks, [action.task.id]: action.task },
          columns: board.columns.map((item) =>
            item.id === action.columnId ? { ...item, taskIds } : item,
          ),
        });
      });

    case 'ADD_COLLABORATOR':
      return mapBoard(state, action.boardId, (board) =>
        touch({
          ...board,
          collaborators: [...board.collaborators, action.collaborator],
        }),
      );

    case 'DELETE_COLLABORATOR':
      return mapBoard(state, action.boardId, (board) => {
        const tasks = Object.fromEntries(
          Object.entries(board.tasks).map(([id, task]) => [
            id,
            task.assigneeId === action.collaboratorId
              ? { ...task, assigneeId: null }
              : task,
          ]),
        );

        return touch({
          ...board,
          collaborators: board.collaborators.filter(
            (collaborator) => collaborator.id !== action.collaboratorId,
          ),
          tasks,
        });
      });

    default:
      return state;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // El almacenamiento puede estar lleno o bloqueado; la app sigue funcionando en memoria.
    }
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore debe usarse dentro de <StoreProvider>.');
  }
  return context;
}
