import { useState, type FormEvent } from 'react';
import type { Board } from '../types';
import { BOARD_COLORS } from '../constants';
import { cn } from '../utils';
import { Modal } from './ui';

interface BoardDialogProps {
  board?: Board | null;
  onClose: () => void;
  onSubmit: (values: { title: string; description: string; color: string }) => void;
}

export function BoardDialog({ board, onClose, onSubmit }: BoardDialogProps) {
  const [title, setTitle] = useState(board?.title ?? '');
  const [description, setDescription] = useState(board?.description ?? '');
  const [color, setColor] = useState(board?.color ?? BOARD_COLORS[0]);
  const [error, setError] = useState('');

  const isEditing = Boolean(board);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('El tablero necesita un nombre.');
      return;
    }
    onSubmit({ title: title.trim(), description: description.trim(), color });
  };

  return (
    <Modal
      title={isEditing ? 'Editar tablero' : 'Nuevo tablero'}
      subtitle={
        isEditing
          ? 'Actualizá el nombre, la descripción o el color del tablero.'
          : 'Creá un tablero y empezá a organizar tu trabajo.'
      }
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="board-form" className="btn btn-primary">
            {isEditing ? 'Guardar cambios' : 'Crear tablero'}
          </button>
        </>
      }
    >
      <form id="board-form" className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="board-title">Nombre</label>
          <input
            id="board-title"
            className="input"
            value={title}
            placeholder="Ej. Lanzamiento de producto"
            onChange={(event) => {
              setTitle(event.target.value);
              setError('');
            }}
            maxLength={60}
          />
          {error && <span className="field-error">{error}</span>}
        </div>

        <div className="field">
          <label htmlFor="board-description">Descripción</label>
          <textarea
            id="board-description"
            className="textarea"
            value={description}
            placeholder="¿De qué trata este tablero?"
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            maxLength={240}
          />
        </div>

        <div className="field">
          <label>Color</label>
          <div className="swatches">
            {BOARD_COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                className={cn('swatch', color === swatch && 'is-active')}
                style={{ backgroundColor: swatch }}
                onClick={() => setColor(swatch)}
                aria-label={`Usar color ${swatch}`}
                aria-pressed={color === swatch}
              />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
