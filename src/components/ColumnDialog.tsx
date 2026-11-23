import { useState, type FormEvent } from 'react';
import { Modal } from './ui';

interface ColumnDialogProps {
  title?: string;
  onClose: () => void;
  onSubmit: (title: string) => void;
}

export function ColumnDialog({ title: initialTitle = '', onClose, onSubmit }: ColumnDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [error, setError] = useState('');
  const isEditing = initialTitle.trim() !== '';

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('La columna necesita un nombre.');
      return;
    }
    onSubmit(title.trim());
  };

  return (
    <Modal
      title={isEditing ? 'Renombrar columna' : 'Nueva columna'}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="column-form" className="btn btn-primary">
            {isEditing ? 'Guardar' : 'Crear columna'}
          </button>
        </>
      }
    >
      <form id="column-form" className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="column-title">Nombre de la columna</label>
          <input
            id="column-title"
            className="input"
            value={title}
            placeholder="Ej. En revisión"
            onChange={(event) => {
              setTitle(event.target.value);
              setError('');
            }}
            maxLength={40}
          />
          {error && <span className="field-error">{error}</span>}
        </div>
      </form>
    </Modal>
  );
}
