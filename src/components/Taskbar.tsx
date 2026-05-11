import { useState } from 'preact/hooks';
import { useKernel } from '../kernel/useKernel';
import { APP_REGISTRY } from '../apps/registry';
import * as Icons from 'lucide-preact';

export function Taskbar() {
  const { 
    windows, focusWindow, minimizeWindow, focusedWindowId, 
    launchApp, taskbarPosition, pinnedApps, unpinApp, 
    pinApp, showContextMenu, taskbarSize, clockFormat,
    toggleNotificationPanel 
  } = useKernel();
  const [isStartOpen, setIsStartOpen] = useState(false);

  const allTaskbarApps = Array.from(new Set([...pinnedApps, ...windows.map(w => w.appId)]));

  const getTaskbarHeight = () => {
    if (taskbarSize === 'small') return 36;
    if (taskbarSize === 'large') return 56;
    return 48;
  };

  const getIconSize = () => {
    if (taskbarSize === 'small') return 14;
    if (taskbarSize === 'large') return 22;
    return 18;
  };

  return (
    <div className={`taskbar ${taskbarPosition} ${taskbarSize}`} style={{ height: getTaskbarHeight() }}>
      <button 
        className={`start-btn ${isStartOpen ? 'active' : ''}`}
        onClick={() => setIsStartOpen(!isStartOpen)}
        style={{ width: getTaskbarHeight() - 8, height: getTaskbarHeight() - 8 }}
      >
        <img src="/logo.png" style={{ width: '80%', height: '80%', objectFit: 'contain' }} alt="Start" />
      </button>
      
      {isStartOpen && (
        <div className="start-menu">
          <div className="start-menu-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" style={{ width: '24px', height: '24px' }} alt="VirtuOS" />
            <span>VirtuOS</span>
          </div>
          <div className="start-menu-apps">
            {Object.values(APP_REGISTRY).map(app => {
              const Icon = (Icons as any)[app.icon] || Icons.AppWindow;
              return (
                <div 
                  key={app.id} 
                  className="start-menu-item"
                  onClick={() => {
                    launchApp(app.id);
                    setIsStartOpen(false);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const isPinned = pinnedApps.includes(app.id);
                    showContextMenu(e.clientX, e.clientY, [
                      { label: isPinned ? 'Unpin from Taskbar' : 'Pin to Taskbar', icon: isPinned ? 'PinOff' : 'Pin', action: () => isPinned ? unpinApp(app.id) : pinApp(app.id) },
                      { label: 'Open', icon: 'ExternalLink', action: () => launchApp(app.id) }
                    ]);
                  }}
                >
                  <Icon size={20} />
                  <span>{app.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="running-apps">
        {allTaskbarApps.map((appId) => {
          const app = APP_REGISTRY[appId];
          const Icon = (Icons as any)[app?.icon] || Icons.AppWindow;
          const activeWindows = windows.filter(w => w.appId === appId);
          const isRunning = activeWindows.length > 0;
          const isFocused = activeWindows.some(w => w.id === focusedWindowId);
          
          return (
            <div
              key={appId}
              className={`taskbar-item ${isFocused ? 'active' : ''} ${isRunning ? 'running' : ''}`}
              style={{ width: getTaskbarHeight() - 4, height: getTaskbarHeight() - 4 }}
              onClick={() => {
                if (isRunning) {
                  const win = activeWindows.find(w => w.id === focusedWindowId) || activeWindows[0];
                  if (win.id === focusedWindowId) {
                    minimizeWindow(win.id);
                  } else {
                    focusWindow(win.id);
                  }
                } else {
                  launchApp(appId);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const isPinned = pinnedApps.includes(appId);
                showContextMenu(e.clientX, e.clientY, [
                  { label: isPinned ? 'Unpin from Taskbar' : 'Pin to Taskbar', icon: isPinned ? 'PinOff' : 'Pin', action: () => isPinned ? unpinApp(appId) : pinApp(appId) },
                  isRunning ? { label: 'Close All Windows', icon: 'X', action: () => activeWindows.forEach(w => useKernel.getState().closeWindow(w.id)), danger: true } : null,
                ].filter(Boolean) as any);
              }}
            >
              <Icon size={getIconSize()} />
              {isRunning && <div className="running-indicator" />}
            </div>
          );
        })}
      </div>

      <div className="system-tray">
        <div className="tray-item" onClick={toggleNotificationPanel} style={{ cursor: 'pointer' }}>
          <Icons.Bell size={getIconSize() - 4} />
        </div>
        <div className="tray-item">
          <Icons.Wifi size={getIconSize() - 4} />
        </div>
        <div className="tray-item">
          <Icons.Volume2 size={getIconSize() - 4} />
        </div>
        <div className="tray-time" style={{ fontSize: taskbarSize === 'small' ? '10px' : '12px' }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: clockFormat === '12h' })}
        </div>
      </div>
    </div>
  );
}
