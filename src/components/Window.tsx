import { useState, useRef, useEffect } from 'preact/hooks';
import { useKernel } from '../kernel/useKernel';
import type { WindowState } from '../types';
import { Minimize2, Maximize2, X } from 'lucide-preact';

interface WindowProps {
  window: WindowState;
  children: any;
}

export function Window({ window: win, children }: WindowProps) {
  const { 
    closeWindow, 
    focusWindow, 
    minimizeWindow, 
    maximizeWindow, 
    updateWindowPosition 
  } = useKernel();
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: MouseEvent) => {
    if (win.isMaximized) return;
    
    focusWindow(win.id);
    
    const target = e.target as HTMLElement;
    const header = target.closest('.window-header');
    
    if (header && !target.closest('.window-controls')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - win.x,
        y: e.clientY - win.y,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Use global window object to avoid collision with win prop
      const x = Math.max(-win.width + 50, Math.min(window.innerWidth - 50, newX));
      const y = Math.max(0, Math.min(window.innerHeight - 40, newY));
      
      updateWindowPosition(win.id, x, y);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, win.id, updateWindowPosition, win.width]);

  const style = {
    left: win.x,
    top: win.y,
    width: win.width,
    height: win.height,
    zIndex: win.zIndex,
  };

  return (
    <div
      ref={windowRef}
      className={`window ${win.isMinimized ? 'minimized' : ''} ${win.isMaximized ? 'maximized' : ''} ${win.isFocused ? 'focused' : ''}`}
      style={style}
      onMouseDown={() => focusWindow(win.id)}
    >
      <div className="window-header" onMouseDown={handleMouseDown}>
        <span className="window-title">{win.title}</span>
        <div className="window-controls">
          <button className="control-icon-btn" onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}>
            <Minimize2 size={14} />
          </button>
          <button className="control-icon-btn" onClick={(e) => { e.stopPropagation(); maximizeWindow(win.id); }}>
            <Maximize2 size={14} />
          </button>
          <button className="control-icon-btn close" onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}>
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="window-content">
        {children}
      </div>
    </div>
  );
}
