import { useKernel } from '../kernel/useKernel';
import { Window } from './Window';
import { Taskbar } from './Taskbar';
import { ContextMenu } from './ContextMenu';
import { NotificationPanel } from './NotificationPanel';
import { Suspense, Component } from 'preact/compat';
import { APP_REGISTRY } from '../apps/registry';
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
  const { windows, processes, launchApp, notifications, removeNotification, wallpaper, showContextMenu, showDesktopIcons, desktopIconSize } = useKernel();

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, [
      { label: 'New Folder', icon: 'FolderPlus', action: () => console.log('New Folder') },
      { label: 'New File', icon: 'FilePlus', action: () => console.log('New File') },
      { divider: true, label: '', action: () => {} },
      { label: 'Change Wallpaper', icon: 'Image', action: () => launchApp('settings') },
      { label: 'System Settings', icon: 'Settings', action: () => launchApp('settings') },
      { divider: true, label: '', action: () => {} },
      { label: 'Refresh', icon: 'RotateCw', action: () => window.location.reload() },
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
    <div className="desktop" style={desktopStyle} onContextMenu={handleContextMenu}>
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

      {/* Desktop Icons */}
      {showDesktopIcons && (
        <div className="desktop-icons" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', flexWrap: 'wrap', height: '100%', alignContent: 'flex-start' }}>
          {Object.values(APP_REGISTRY).map(app => {
            const Icon = (Icons as any)[app.icon] || Icons.AppWindow;
            return (
              <div 
                key={app.id}
                className="desktop-icon" 
                style={{ width: iconSize.wrapper }}
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
                <div className="desktop-icon-image" style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={iconSize.icon} color="white" />
                </div>
                <span className="desktop-icon-label" style={{ fontSize: desktopIconSize === 'small' ? '10px' : '12px' }}>{app.name}</span>
              </div>
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


