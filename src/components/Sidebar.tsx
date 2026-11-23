import { useRef, useState } from 'react';
import {
  Columns3,
  Download,
  Moon,
  Plus,
  Sun,
  Upload,
  X,
} from 'lucide-react';
import type { Board } from '../types';
import { useStore } from '../store';
import { makeBoard, rehydrateBoard } from '../seed';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { cn, pluralize } from '../utils';
import { BoardDialog } from './BoardDialog';
import { useToast } from './Toast';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const { canInstall, install } = useInstallPrompt();
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDark = state.theme === 'dark';

  const handleCreateBoard = (values: { title: string; description: string; color: string }) => {
    const board = makeBoard(values.title, values.description, values.color);
    dispatch({ type: 'CREATE_BOARD', board });
    setCreating(false);
    onClose();
    toast({ message: `Tablero "${board.title}" creado.` });
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const board: Board | null = rehydrateBoard(JSON.parse(text));
      if (!board) {
        toast({ message: 'El archivo no tiene el formato de un tablero de Flujo.' });
        return;
      }
      dispatch({ type: 'IMPORT_BOARD', board });
      onClose();
      toast({ message: `Tablero "${board.title}" importado.` });
    } catch {
      toast({ message: 'No pudimos leer el archivo. Verificá que sea un JSON válido.' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {open && <button className="sidebar-backdrop" aria-label="Cerrar menú" onClick={onClose} />}

      <aside className={cn('sidebar', open && 'is-open')}>
        <div className="brand-row">
          <div className="brand-logo" aria-hidden="true">
            <Columns3 size={19} />
          </div>
          <div className="brand-text">
            <strong>Flujo</strong>
            <span>Kanban</span>
          </div>
          <button type="button" className="icon-btn mobile-only" onClick={onClose} aria-label="Cerrar menú">
            <X size={19} />
          </button>
        </div>

        <button type="button" className="btn btn-primary sidebar-new" onClick={() => setCreating(true)}>
          <Plus size={16} />
          Nuevo tablero
        </button>

        <div className="sidebar-label">
          <span>Tus tableros</span>
          <span className="sidebar-label-count">{state.boards.length}</span>
        </div>

        <nav className="board-list" aria-label="Tableros">
          {state.boards.length === 0 && (
            <p className="sidebar-empty">Creá tu primer tablero para empezar.</p>
          )}

          {state.boards.map((board) => {
            const active = board.id === state.activeBoardId;
            return (
              <button
                key={board.id}
                type="button"
                className={cn('board-item', active && 'is-active')}
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_BOARD', boardId: board.id });
                  onClose();
                }}
                aria-current={active ? 'page' : undefined}
              >
                <span className="board-item-dot" style={{ backgroundColor: board.color }} />
                <span className="board-item-title">{board.title}</span>
                <span className="board-item-count">
                  {Object.keys(board.tasks).length}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-action"
            onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? 'Modo claro' : 'Modo oscuro'}
          </button>

          <button
            type="button"
            className="sidebar-action"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} />
            Importar tablero
          </button>

          {canInstall && (
            <button type="button" className="sidebar-action" onClick={install}>
              <Download size={16} />
              Instalar aplicación
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            onChange={(event) => handleImport(event.target.files?.[0])}
          />

          <p className="sidebar-note">
            {pluralize(state.boards.length, 'tablero', 'tableros')} · Datos guardados en tu navegador
          </p>
        </div>
      </aside>

      {creating && (
        <BoardDialog onClose={() => setCreating(false)} onSubmit={handleCreateBoard} />
      )}
    </>
  );
}
