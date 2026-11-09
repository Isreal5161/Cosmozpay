import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  closeDisabled?: boolean;
  children: ReactNode;
}

function Modal({ open, title, onClose, closeDisabled = false, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;
