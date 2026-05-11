import { useKernel } from '../kernel/useKernel';
import { Window } from './Window';
import { Taskbar } from './Taskbar';
import { ContextMenu } from './ContextMenu';
import { NotificationPanel } from './NotificationPanel';
import { Modal } from './Modal';
import { Suspense, Component, useState, useEffect, useRef } from 'preact/compat';
import { APP_REGISTRY } from '../apps/registry';
import { Tooltip } from './Tooltip';
import * as Icons from 'lucide-preact';

class ErrorBoundary extends Component<{ children: any }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: '#ff5555', background: '#1a1a1a', height: '100%', overflow: 'auto' }}>
          <h3>App Crash</h3>
          <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{ marginTop: '10px', padding: '5px 10px', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Dynamic component loader
const AppLoader = ({ appId, args }: { appId: string, args?: any }) => {
  const app = APP_REGISTRY[appId];
  if (!app) return <div style={{ color: 'white' }}>App not found</div>;
  
  const DemoApp = app.lazyComponent;
  
  return (
    <ErrorBoundary>
      <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>Loading...</div>}>
        <DemoApp {...args} />
      </Suspense>
    </ErrorBoundary>
  );
};

export function Desktop() {
  const { windows, processes, launchApp, notifications, removeNotification, wallpaper, showContextMenu, showDesktopIcons, desktopIconSize, focusedWindowId, closeWindow, logout, minimizeWindow, showModal } = useKernel();
  
  const [selectedIcons, setSelectedIcons] = useState<string[]>([]);
  const [selectionRect, setSelectionRect] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
  const [desktopFiles, setDesktopFiles] = useState<any[]>([]);
  const desktopRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const loadDesktopFiles = async () => {
    try {
      const { vfs } = await import('../vfs/vfs');
      const files = await vfs.listFiles('/home/desktop');
      setDesktopFiles(files);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDesktopFiles();
  }, []);

  const handleCreateFolder = () => {
    showModal({
      title: 'New Folder',
      message: 'Enter folder name:',
      type: 'prompt',
      defaultValue: 'New Folder',
      onConfirm: async (name) => {
        if (name) {
          try {
            const { vfs } = await import('../vfs/vfs');
            await vfs.mkdir('/home/desktop', name);
            loadDesktopFiles();
          } catch (err) {
            console.error(err);
          }
        }
      }
    });
  };

  const handleCreateFile = () => {
    showModal({
      title: 'New File',
      message: 'Enter file name:',
      type: 'prompt',
      defaultValue: 'New File.txt',
      onConfirm: async (name) => {
        if (name) {
          try {
            const { vfs } = await import('../vfs/vfs');
            await vfs.writeFile(`/home/desktop/${name}`, '');
            loadDesktopFiles();
          } catch (err) {
            console.error(err);
          }
        }
      }
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'f4') {
        e.preventDefault();
        if (focusedWindowId) closeWindow(focusedWindowId);
      }
      if (e.metaKey && e.key === 'd') {
        e.preventDefault();
        windows.forEach(w => minimizeWindow(w.id));
      }
      if (e.metaKey && e.key === 'l') {
        e.preventDefault();
        logout();
      }
      if (e.key === 'F1') {
        e.preventDefault();
        launchApp('help');
      }

      if (!focusedWindowId) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
          e.preventDefault();
          setSelectedIcons([...Object.keys(APP_REGISTRY), ...desktopFiles.map(f => f.name)]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedWindowId, windows, desktopFiles]);

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    if (e.target !== desktopRef.current && !(e.target as HTMLElement).classList.contains('desktop-icons')) {
        return;
    }

    isDragging.current = true;
    setSelectionRect({ x1: e.clientX, y1: e.clientY, x2: e.clientX, y2: e.clientY });
    if (!e.ctrlKey && !e.shiftKey) {
        setSelectedIcons([]);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !selectionRect) return;

    const newRect = { ...selectionRect, x2: e.clientX, y2: e.clientY };
    setSelectionRect(newRect);

    const xMin = Math.min(newRect.x1, newRect.x2);
    const xMax = Math.max(newRect.x1, newRect.x2);
    const yMin = Math.min(newRect.y1, newRect.y2);
    const yMax = Math.max(newRect.y1, newRect.y2);

    const icons = document.querySelectorAll('.desktop-icon');
    const newSelected: string[] = [];
    icons.forEach((icon) => {
      const rect = icon.getBoundingClientRect();
      const iconId = icon.getAttribute('data-id');
      if (iconId &&
          rect.left < xMax &&
          rect.right > xMin &&
          rect.top < yMax &&
          rect.bottom > yMin) {
        newSelected.push(iconId);
      }
    });
    setSelectedIcons(newSelected);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    setSelectionRect(null);
  };

  useEffect(() => {
    if (selectionRect) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selectionRect]);

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, [
      { label: 'New Folder', icon: 'FolderPlus', action: handleCreateFolder },
      { label: 'New File', icon: 'FilePlus', action: handleCreateFile },
      { divider: true, label: '', action: () => {} },
      { label: 'Change Wallpaper', icon: 'Image', action: () => launchApp('settings') },
      { label: 'System Settings', icon: 'Settings', action: () => launchApp('settings') },
      { divider: true, label: '', action: () => {} },
      { label: 'Refresh', icon: 'RotateCw', action: () => { loadDesktopFiles(); window.location.reload(); } },
    ]);
  };

  const getIconSize = () => {
    if (desktopIconSize === 'small') return { wrapper: '70px', icon: 24 };
    if (desktopIconSize === 'large') return { wrapper: '110px', icon: 40 };
    return { wrapper: '90px', icon: 32 };
  };

  const iconSize = getIconSize();

  const desktopStyle = {
    background: wallpaper.startsWith('linear-gradient') || wallpaper.startsWith('#') || wallpaper.startsWith('rgba')
      ? wallpaper 
      : `url("${wallpaper}") center / cover no-repeat`
  };

  return (
    <div 
        ref={desktopRef}
        className="desktop" 
        style={desktopStyle} 
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
    >
      {/* Selection Marquee */}
      {selectionRect && (
        <div style={{
          position: 'absolute',
          left: Math.min(selectionRect.x1, selectionRect.x2),
          top: Math.min(selectionRect.y1, selectionRect.y2),
          width: Math.abs(selectionRect.x2 - selectionRect.x1),
          height: Math.abs(selectionRect.y2 - selectionRect.y1),
          background: 'rgba(59, 130, 246, 0.3)',
          border: '1px solid #3b82f6',
          zIndex: 1000,
          pointerEvents: 'none'
        }} />
      )}

      {/* Notifications */}
      <div className="notifications-container">
        {notifications.map(n => (
          <div key={n.id} className={`notification ${n.type}`} onClick={() => removeNotification(n.id)}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{n.title}</div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>{n.message}</div>
          </div>
        ))}
      </div>

      {/* Side Panels */}
      <NotificationPanel />

      {/* Context Menu */}
      <ContextMenu />

      {/* Custom Modals */}
      <Modal />

      {/* Desktop Icons */}
      {showDesktopIcons && (
        <div className="desktop-icons" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', flexWrap: 'wrap', height: '100%', alignContent: 'flex-start' }}>
          {/* Apps */}
          {Object.values(APP_REGISTRY).map(app => {
            const Icon = (Icons as any)[app.icon] || Icons.AppWindow;
            const isSelected = selectedIcons.includes(app.id);
            return (
              <Tooltip key={app.id} text={app.name} position="bottom" delay={800}>
                <div 
                  data-id={app.id}
                  className={`desktop-icon ${isSelected ? 'selected' : ''}`}
                  style={{ 
                      width: iconSize.wrapper,
                      background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                      borderRadius: '8px',
                      padding: '5px'
                  }}
                  onClick={(e) => {
                      e.stopPropagation();
                      if (e.ctrlKey || e.metaKey) {
                          setSelectedIcons(prev => prev.includes(app.id) ? prev.filter(id => id !== app.id) : [...prev, app.id]);
                      } else {
                          setSelectedIcons([app.id]);
                      }
                  }}
                  onDblClick={() => launchApp(app.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    showContextMenu(e.clientX, e.clientY, [
                      { label: `Open ${app.name}`, icon: 'ExternalLink', action: () => launchApp(app.id) },
                      { label: 'Properties', icon: 'Info', action: () => console.log('Properties') },
                    ]);
                  }}
                >
                  <div className="desktop-icon-image" style={{ background: isSelected ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={iconSize.icon} color="white" />
                  </div>
                  <span className="desktop-icon-label" style={{ fontSize: desktopIconSize === 'small' ? '10px' : '12px' }}>{app.name}</span>
                </div>
              </Tooltip>
            );
          })}

          {/* Files/Folders */}
          {desktopFiles.map(item => {
            const isDir = item.type === 'dir';
            const isSelected = selectedIcons.includes(item.name);
            const ext = item.name.split('.').pop()?.toLowerCase();
            const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '');

            return (
              <Tooltip key={item.name} text={item.name} position="bottom" delay={800}>
                <div 
                  data-id={item.name}
                  className={`desktop-icon ${isSelected ? 'selected' : ''}`}
                  style={{ 
                      width: iconSize.wrapper,
                      background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                      borderRadius: '8px',
                      padding: '5px'
                  }}
                  onClick={(e) => {
                      e.stopPropagation();
                      if (e.ctrlKey || e.metaKey) {
                          setSelectedIcons(prev => prev.includes(item.name) ? prev.filter(id => id !== item.name) : [...prev, item.name]);
                      } else {
                          setSelectedIcons([item.name]);
                      }
                  }}
                  onDblClick={() => {
                    if (isDir) {
                      launchApp('files', { initialPath: `/home/desktop/${item.name}` });
                    } else {
                      launchApp('notepad', { filePath: `/home/desktop/${item.name}` });
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    showContextMenu(e.clientX, e.clientY, [
                      { label: 'Open', icon: 'ExternalLink', action: () => isDir ? launchApp('files', { initialPath: `/home/desktop/${item.name}` }) : launchApp('notepad', { filePath: `/home/desktop/${item.name}` }) },
                      { label: 'Delete', icon: 'Trash', action: () => {
                        showModal({
                          title: 'Delete',
                          message: `Are you sure you want to delete ${item.name}?`,
                          type: 'confirm',
                          onConfirm: async () => {
                            const { vfs } = await import('../vfs/vfs');
                            await vfs.deleteFile(`/home/desktop/${item.name}`);
                            loadDesktopFiles();
                          }
                        });
                      }},
                    ]);
                  }}
                >
                  <div className="desktop-icon-image" style={{ background: isSelected ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isDir ? <Icons.Folder size={iconSize.icon} color="#3b82f6" fill="#3b82f6" fillOpacity={0.2} /> : 
                     isImage ? <Icons.Image size={iconSize.icon} color="#10b981" /> : 
                     <Icons.FileText size={iconSize.icon} color="white" />}
                  </div>
                  <span className="desktop-icon-label" style={{ fontSize: desktopIconSize === 'small' ? '10px' : '12px' }}>{item.name}</span>
                </div>
              </Tooltip>
            );
          })}
        </div>
      )}

      {/* Windows */}
      {windows.map((win) => {
        const process = processes.find(p => p.windowId === win.id);
        return (
          <Window key={win.id} window={win}>
            <AppLoader appId={win.appId} args={process?.args} />
          </Window>
        );
      })}

      <Taskbar />
    </div>
  );
}
