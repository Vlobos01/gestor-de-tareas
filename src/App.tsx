import { useState } from 'react';
import { Columns3, Plus, Sparkles } from 'lucide-react';
import { useStore } from './store';
import { makeBoard } from './seed';
import { BoardPage } from './components/BoardPage';
import { BoardDialog } from './components/BoardDialog';
import { Sidebar } from './components/Sidebar';

export default function App() {
  const { state } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const board = state.boards.find((item) => item.id === state.activeBoardId) ?? null;

  return (
    <div className="app">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main">
        {board ? (
          <BoardPage
            key={board.id}
            board={board}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        ) : (
          <EmptyWorkspace onOpenSidebar={() => setSidebarOpen(true)} />
        )}
      </main>
    </div>
  );
}

function EmptyWorkspace({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { dispatch } = useStore();
  const [creating, setCreating] = useState(false);

  return (
    <div className="empty-workspace">
      <button
        type="button"
        className="icon-btn empty-menu mobile-only"
        onClick={onOpenSidebar}
        aria-label="Abrir menú"
      >
        <Columns3 size={20} />
      </button>

      <div className="empty-card">
        <div className="empty-icon">
          <Columns3 size={30} />
        </div>
        <span className="empty-eyebrow">
          <Sparkles size={14} />
          Tu espacio de trabajo
        </span>
        <h1>Organizá tu trabajo en un tablero</h1>
        <p>
          Creá un tablero, sumá columnas y arrastrá las tareas a medida que avanzan.
          Todo se guarda automáticamente en tu navegador.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
          <Plus size={16} />
          Crear mi primer tablero
        </button>
      </div>

      {creating && (
        <BoardDialog
          onClose={() => setCreating(false)}
          onSubmit={(values) => {
            dispatch({
              type: 'CREATE_BOARD',
              board: makeBoard(values.title, values.description, values.color),
            });
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}
