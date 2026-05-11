import { useState, useEffect, useRef } from 'preact/hooks';
import { useKernel } from '../kernel/useKernel';

export function Modal() {
  const { modal, hideModal } = useKernel();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modal?.type === 'prompt') {
      setValue(modal.defaultValue || '');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [modal]);

  if (!modal) return null;

  const handleConfirm = () => {
    if (modal.onConfirm) {
      modal.onConfirm(modal.type === 'prompt' ? value : undefined);
    }
    hideModal();
  };

  const handleCancel = () => {
    if (modal.onCancel) {
      modal.onCancel();
    }
    hideModal();
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)'
    }}>
      <div className="modal-container" style={{
        width: '400px',
        background: 'var(--surface-color)',
        color: 'var(--text-color)',
        borderRadius: '12px',
        border: '1px solid var(--window-border)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        animation: 'modal-in 0.2s ease-out'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--window-border)', fontWeight: 'bold' }}>
          {modal.title}
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ margin: '0 0 15px 0', fontSize: '14px', lineHeight: '1.5' }}>{modal.message}</p>
          {modal.type === 'prompt' && (
            <input
              ref={inputRef}
              type="text"
              value={value}
              onInput={(e) => setValue((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(0, 0, 0, 0.1)',
                border: '1px solid var(--window-border)',
                borderRadius: '6px',
                color: 'inherit',
                outline: 'none',
                fontSize: '14px'
              }}
            />
          )}
        </div>
        <div style={{ padding: '15px 20px', background: 'rgba(0, 0, 0, 0.05)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          {modal.type !== 'alert' && (
            <button
              onClick={handleCancel}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid var(--window-border)',
                borderRadius: '6px',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleConfirm}
            style={{
              padding: '8px 16px',
              background: 'var(--accent-color)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold'
            }}
          >
            {modal.type === 'confirm' ? 'Confirm' : 'OK'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
