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
    updateWindowPosition,
    updateWindowSize
  } = useKernel();
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Snap and restore state
  const [restoredState, setRestoredState] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const [snapPreview, setSnapPreview] = useState<'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null>(null);
  const [showSnapLayouts, setShowSnapLayouts] = useState(false);
  
  const windowRef = useRef<HTMLDivElement>(null);

  const isSnapped = restoredState !== null && !win.isMaximized;

  const saveRestoredState = () => {
    if (!restoredState && !win.isMaximized) {
      setRestoredState({ x: win.x, y: win.y, w: win.width, h: win.height });
    }
  };

  const applySnap = (type: string) => {
    saveRestoredState();
    if (win.isMaximized) maximizeWindow(win.id); // Unmaximize if it was maximized

    const sw = window.innerWidth;
    const sh = window.innerHeight - 48; // assuming 48px taskbar at bottom
    
    switch (type) {
      case 'left':
        updateWindowPosition(win.id, 0, 0);
        updateWindowSize(win.id, sw / 2, sh);
        break;
      case 'right':
        updateWindowPosition(win.id, sw / 2, 0);
        updateWindowSize(win.id, sw / 2, sh);
        break;
      case 'top-left':
        updateWindowPosition(win.id, 0, 0);
        updateWindowSize(win.id, sw / 2, sh / 2);
        break;
      case 'bottom-left':
        updateWindowPosition(win.id, 0, sh / 2);
        updateWindowSize(win.id, sw / 2, sh / 2);
        break;
      case 'top-right':
        updateWindowPosition(win.id, sw / 2, 0);
        updateWindowSize(win.id, sw / 2, sh / 2);
        break;
      case 'bottom-right':
        updateWindowPosition(win.id, sw / 2, sh / 2);
        updateWindowSize(win.id, sw / 2, sh / 2);
        break;
      case 'top':
        if (!win.isMaximized) maximizeWindow(win.id);
        break;
    }
    setShowSnapLayouts(false);
  };

  const handleMouseDown = (e: MouseEvent) => {
    focusWindow(win.id);
    const target = e.target as HTMLElement;
    const header = target.closest('.window-header');
    
    if (header && !target.closest('.window-controls')) {
      setIsDragging(true);

      if (win.isMaximized || isSnapped) {
        // If maximized or snapped, clicking and dragging restores it to its original size 
        // but keeps the mouse at the same relative position if possible, or centered.
        const restoreW = restoredState?.w || Math.min(800, window.innerWidth - 100);
        // Calculate offset so the window is centered on the mouse x
        const newX = e.clientX - (restoreW / 2);
        const newY = e.clientY - 20; // 20px down into the header
        
        setDragOffset({ x: restoreW / 2, y: 20 });

        if (win.isMaximized) maximizeWindow(win.id);
        setRestoredState(null);
        updateWindowPosition(win.id, newX, newY);
        updateWindowSize(win.id, restoreW, restoredState?.h || 600);
      } else {
        setDragOffset({
          x: e.clientX - win.x,
          y: e.clientY - win.y,
        });
      }
    }
  };

  const handleMouseUpCapture = () => {
    if (windowRef.current && !win.isMaximized && !isSnapped) {
      const { width, height } = windowRef.current.getBoundingClientRect();
      if (Math.abs(width - win.width) > 2 || Math.abs(height - win.height) > 2) {
        updateWindowSize(win.id, width, height);
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      const x = Math.max(-win.width + 50, Math.min(window.innerWidth - 50, newX));
      const y = Math.max(0, Math.min(window.innerHeight - 40, newY));

      // Calculate Snap Previews
      if (e.clientX <= 10 && e.clientY <= 10) setSnapPreview('top-left');
      else if (e.clientX >= window.innerWidth - 10 && e.clientY <= 10) setSnapPreview('top-right');
      else if (e.clientX <= 10 && e.clientY >= window.innerHeight - 50) setSnapPreview('bottom-left');
      else if (e.clientX >= window.innerWidth - 10 && e.clientY >= window.innerHeight - 50) setSnapPreview('bottom-right');
      else if (e.clientX <= 10) setSnapPreview('left');
      else if (e.clientX >= window.innerWidth - 10) setSnapPreview('right');
      else if (e.clientY <= 5) setSnapPreview('top');
      else setSnapPreview(null);
      
      updateWindowPosition(win.id, x, y);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (snapPreview) {
          applySnap(snapPreview);
          setSnapPreview(null);
        }
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, win.id, updateWindowPosition, win.width, snapPreview, restoredState]);

  const toggleMaximize = () => {
    if (!win.isMaximized) {
      saveRestoredState();
    } else {
      // Restoring from maximize
      if (restoredState) {
        updateWindowPosition(win.id, restoredState.x, restoredState.y);
        updateWindowSize(win.id, restoredState.w, restoredState.h);
        setRestoredState(null);
      }
    }
    maximizeWindow(win.id);
  };

  const style = {
    left: win.isMaximized ? 0 : win.x,
    top: win.isMaximized ? 0 : win.y,
    width: win.isMaximized ? '100vw' : win.width,
    height: win.isMaximized ? 'calc(100vh - var(--taskbar-height))' : win.height,
    zIndex: win.zIndex,
    transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  };

  return (
    <>
      {/* Snap Preview Overlay */}
      {snapPreview && (
        <div style={{
          position: 'fixed',
          top: snapPreview.includes('bottom') ? '50%' : 0,
          left: snapPreview.includes('right') ? '50%' : 0,
          width: snapPreview === 'top' ? '100vw' : snapPreview.includes('left') || snapPreview.includes('right') ? '50vw' : '100vw',
          height: snapPreview === 'top' ? 'calc(100vh - 48px)' : snapPreview.includes('top-') || snapPreview.includes('bottom-') ? 'calc(50vh - 24px)' : 'calc(100vh - 48px)',
          background: 'rgba(59, 130, 246, 0.2)',
          border: '2px solid rgba(59, 130, 246, 0.5)',
          borderRadius: snapPreview === 'top' ? 0 : '12px',
          zIndex: 9999,
          pointerEvents: 'none',
          transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }} />
      )}

      <div
        ref={windowRef}
        className={`window ${win.isMinimized ? 'minimized' : ''} ${win.isMaximized ? 'maximized' : ''} ${win.isFocused ? 'focused' : ''}`}
        style={style}
        onMouseDownCapture={() => focusWindow(win.id)}
        onMouseUpCapture={handleMouseUpCapture}
      >
        <div className="window-header" onMouseDown={handleMouseDown} onDblClick={toggleMaximize}>
          <span className="window-title">{win.title}</span>
          <div className="window-controls" style={{ position: 'relative' }}>
            <button className="control-icon-btn" onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}>
              <Minimize2 size={14} />
            </button>
            <div 
              onMouseEnter={() => setShowSnapLayouts(true)} 
              onMouseLeave={() => setShowSnapLayouts(false)}
              style={{ position: 'relative' }}
            >
              <button className="control-icon-btn" onClick={(e) => { e.stopPropagation(); toggleMaximize(); }}>
                <Maximize2 size={14} />
              </button>
              
              {/* Windows 11 Snap Layouts Popup */}
              {showSnapLayouts && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '30px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--surface-color)',
                    border: '1px solid var(--window-border)',
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                    zIndex: 100000,
                    backdropFilter: 'blur(20px)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Split 50/50 */}
                    <div style={{ display: 'flex', gap: '2px', width: '60px', height: '40px', cursor: 'pointer' }}>
                      <div onClick={() => applySnap('left')} style={{ flex: 1, background: 'rgba(255,255,255,0.2)', borderRadius: '4px 0 0 4px' }} className="snap-btn" />
                      <div onClick={() => applySnap('right')} style={{ flex: 1, background: 'rgba(255,255,255,0.2)', borderRadius: '0 4px 4px 0' }} className="snap-btn" />
                    </div>
                    {/* Split 60/40 approx (using 50/50 for simplicity here but drawn differently) */}
                    <div style={{ display: 'flex', gap: '2px', width: '60px', height: '40px', cursor: 'pointer' }}>
                      <div onClick={() => applySnap('left')} style={{ flex: 2, background: 'rgba(255,255,255,0.2)', borderRadius: '4px 0 0 4px' }} className="snap-btn" />
                      <div onClick={() => applySnap('right')} style={{ flex: 1, background: 'rgba(255,255,255,0.2)', borderRadius: '0 4px 4px 0' }} className="snap-btn" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Split quarters */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '2px', width: '60px', height: '40px' }}>
                      <div onClick={() => applySnap('top-left')} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '4px 0 0 0', cursor: 'pointer' }} className="snap-btn" />
                      <div onClick={() => applySnap('top-right')} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '0 4px 0 0', cursor: 'pointer' }} className="snap-btn" />
                      <div onClick={() => applySnap('bottom-left')} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '0 0 0 4px', cursor: 'pointer' }} className="snap-btn" />
                      <div onClick={() => applySnap('bottom-right')} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '0 0 4px 0', cursor: 'pointer' }} className="snap-btn" />
                    </div>
                    {/* Split 3 */}
                    <div style={{ display: 'flex', gap: '2px', width: '60px', height: '40px' }}>
                      <div onClick={() => applySnap('left')} style={{ flex: 1, background: 'rgba(255,255,255,0.2)', borderRadius: '4px 0 0 4px', cursor: 'pointer' }} className="snap-btn" />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div onClick={() => applySnap('top-right')} style={{ flex: 1, background: 'rgba(255,255,255,0.2)', borderRadius: '0 4px 0 0', cursor: 'pointer' }} className="snap-btn" />
                        <div onClick={() => applySnap('bottom-right')} style={{ flex: 1, background: 'rgba(255,255,255,0.2)', borderRadius: '0 0 4px 0', cursor: 'pointer' }} className="snap-btn" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button className="control-icon-btn close" onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}>
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="window-content">
          {children}
        </div>
        {!win.isMaximized && !isSnapped && <div className="window-resize-handle" />}
      </div>
      <style>{`
        .snap-btn:hover {
          background: var(--accent-color) !important;
        }
      `}</style>
    </>
  );
}
