export interface AppMetadata {
  id: string;
  name: string;
  icon: string;
  component: () => Promise<any>;
  defaultSize?: { width: number; height: number };
  singleton?: boolean;
}

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
}

export interface Process {
  pid: number;
  appId: string;
  windowId: string;
  args?: Record<string, any>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

export interface ContextMenuItem {
  label: string;
  icon?: string;
  action: () => void;
  danger?: boolean;
  divider?: boolean;
}

export interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
  isVisible: boolean;
}

export interface KernelState {
  windows: WindowState[];
  processes: Process[];
  focusedWindowId: string | null;
  nextPid: number;
  notifications: Notification[];
  notificationHistory: Notification[];
  wallpaper: string;
  taskbarPosition: 'bottom' | 'top';
  contextMenu: ContextMenuState;
  pinnedApps: string[];
  showDesktopIcons: boolean;
  desktopIconSize: 'small' | 'medium' | 'large';
  taskbarSize: 'small' | 'medium' | 'large';
  clockFormat: '12h' | '24h';
  isNotificationPanelOpen: boolean;
  theme: 'light' | 'dark';
  user: { username: string; password?: string } | null;
  isLoggedIn: boolean;
  hasSetup: boolean;
  
  // Actions
  setWallpaper: (wallpaper: string) => void;
  setTaskbarPosition: (position: 'bottom' | 'top') => void;
  setShowDesktopIcons: (show: boolean) => void;
  setDesktopIconSize: (size: 'small' | 'medium' | 'large') => void;
  setTaskbarSize: (size: 'small' | 'medium' | 'large') => void;
  setClockFormat: (format: '12h' | '24h') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleNotificationPanel: () => void;
  setupUser: (username: string, password: string) => void;
  login: (password: string) => boolean;
  logout: () => void;
  updateUser: (username: string, password?: string) => void;
  pinApp: (appId: string) => void;
  unpinApp: (appId: string) => void;
  showContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
  hideContextMenu: () => void;
  launchApp: (appId: string, args?: Record<string, any>) => void;
  persistSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
  closeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  updateWindowPosition: (windowId: string, x: number, y: number) => void;
  updateWindowSize: (windowId: string, width: number, height: number) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
}

export interface VFSNode {
  name: string;
  type: 'file' | 'directory';
  content?: any;
  parent?: string;
  updatedAt: number;
}
