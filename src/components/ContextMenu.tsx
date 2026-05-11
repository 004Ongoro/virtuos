import { useEffect, useRef } from 'preact/hooks';
import { useKernel } from '../kernel/useKernel';
import * as Icons from 'lucide-preact';

export function ContextMenu() {
  const { contextMenu, hideContextMenu } = useKernel();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        hideContextMenu();
      }
    };

    if (contextMenu.isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu.isVisible, hideContextMenu]);

  if (!contextMenu.isVisible) return null;

  // Ensure menu doesn't go off screen
  const x = Math.min(contextMenu.x, window.innerWidth - 200);
  const y = Math.min(contextMenu.y, window.innerHeight - (contextMenu.items.length * 40));

  return (
    <div 
      ref={menuRef}
      className="context-menu"
      style={{
        left: x,
        top: y,
      }}
    >
      {contextMenu.items.map((item, index) => {
        if (item.divider) {
          return <div key={index} className="context-menu-divider" />;
        }

        const Icon = item.icon ? (Icons as any)[item.icon] : null;

        return (
          <div 
            key={index}
            className={`context-menu-item ${item.danger ? 'danger' : ''}`}
            onClick={() => {
              item.action();
              hideContextMenu();
            }}
          >
            {Icon && <Icon size={14} />}
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
