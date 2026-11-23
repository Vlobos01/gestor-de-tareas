import { useState, type FormEvent } from 'react';
import { Plus, UserMinus, Users } from 'lucide-react';
import type { Board, Collaborator } from '../types';
import { AVATAR_COLORS } from '../constants';
import { cn, uid } from '../utils';
import { Avatar, Modal } from './ui';

interface CollaboratorsDialogProps {
  board: Board;
  onClose: () => void;
  onAdd: (collaborator: Collaborator) => void;
  onRemove: (collaboratorId: string) => void;
}

export function CollaboratorsDialog({
  board,
  onClose,
  onAdd,
  onRemove,
}: CollaboratorsDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [color, setColor] = useState(
    AVATAR_COLORS[board.collaborators.length % AVATAR_COLORS.length],
  );
  const [error, setError] = useState('');
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Ingresá un nombre.');
      return;
    }

    onAdd({
      id: uid('user'),
      name: name.trim(),
      email: email.trim(),
      color,
    });

    setName('');
    setEmail('');
    setError('');
    setColor(AVATAR_COLORS[(board.collaborators.length + 1) % AVATAR_COLORS.length]);
  };

  const taskCount = (collaboratorId: string) =>
    Object.values(board.tasks).filter((task) => task.assigneeId === collaboratorId).length;

  return (
    <Modal
      title="Colaboradores"
      subtitle="Sumá personas al tablero y asignales tareas."
      onClose={onClose}
      size="md"
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Listo
        </button>
      }
    >
      <div className="collaborator-list">
        {board.collaborators.length === 0 && (
          <div className="inline-empty">
            <Users size={22} />
            <p>Todavía no hay colaboradores. Agregá el primero abajo.</p>
          </div>
        )}

        {board.collaborators.map((collaborator) => (
          <div className="collaborator-row" key={collaborator.id}>
            <Avatar name={collaborator.name} color={collaborator.color} size="md" />
            <div className="collaborator-info">
              <strong>{collaborator.name}</strong>
              <span>{collaborator.email || 'Sin correo'}</span>
            </div>
            <span className="collaborator-count">{taskCount(collaborator.id)} tareas</span>

            {pendingRemove === collaborator.id ? (
              <div className="inline-confirm">
                <span>¿Quitar?</span>
                <button
                  type="button"
                  className="btn btn-danger btn-xs"
                  onClick={() => {
                    onRemove(collaborator.id);
                    setPendingRemove(null);
                  }}
                >
                  Sí
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => setPendingRemove(null)}
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="icon-btn icon-btn-muted"
                title={`Quitar a ${collaborator.name}`}
                aria-label={`Quitar a ${collaborator.name}`}
                onClick={() => setPendingRemove(collaborator.id)}
              >
                <UserMinus size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      <form className="add-collaborator" onSubmit={handleSubmit}>
        <div className="add-collaborator-grid">
          <div className="field">
            <label htmlFor="collaborator-name">Nombre</label>
            <input
              id="collaborator-name"
              className="input"
              value={name}
              placeholder="Ej. Ana Torres"
              onChange={(event) => {
                setName(event.target.value);
                setError('');
              }}
              maxLength={50}
            />
          </div>
          <div className="field">
            <label htmlFor="collaborator-email">Correo (opcional)</label>
            <input
              id="collaborator-email"
              className="input"
              type="email"
              value={email}
              placeholder="ana@equipo.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </div>

        <div className="add-collaborator-footer">
          <div className="swatches">
            {AVATAR_COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                className={cn('swatch swatch-sm', color === swatch && 'is-active')}
                style={{ backgroundColor: swatch }}
                onClick={() => setColor(swatch)}
                aria-label={`Usar color ${swatch}`}
                aria-pressed={color === swatch}
              />
            ))}
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            <Plus size={15} />
            Agregar
          </button>
        </div>
        {error && <span className="field-error">{error}</span>}
      </form>
    </Modal>
  );
}
