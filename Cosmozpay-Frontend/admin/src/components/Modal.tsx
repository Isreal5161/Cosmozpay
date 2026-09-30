import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 760, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;
