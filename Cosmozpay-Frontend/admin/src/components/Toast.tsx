import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
}

function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 2200);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, background: '#111827', color: 'white', padding: '12px 16px', borderRadius: 10, zIndex: 1100 }}>
      {message}
    </div>
  );
}

export default Toast;
