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
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}

export default Toast;
