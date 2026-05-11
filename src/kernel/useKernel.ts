import { create } from 'zustand';
import type { KernelState, WindowState, Process, Notification } from '../types';
import { APP_REGISTRY } from '../apps/registry';
import { vfs } from '../vfs/vfs';

export const useKernel = create<KernelState>((set, get) => ({
  windows: [],
  processes: [],
  focusedWindowId: null,
  nextPid: 1,
  notifications: [],
  notificationHistory: [],
  wallpaper: '/wp1.png',
  taskbarPosition: 'bottom',
  contextMenu: { x: 0, y: 0, items: [], isVisible: false },
  modal: null,
  pinnedApps: ['files', 'browser', 'terminal', 'notepad', 'appstore', 'settings'],
  showDesktopIcons: true,
  desktopIconSize: 'medium',
  taskbarSize: 'medium',
  clockFormat: '12h',
  isNotificationPanelOpen: false,
  theme: 'dark',
  user: null,
  isLoggedIn: false,
  hasSetup: false,
  clipboard: null,

  setWallpaper: (wallpaper: string) => {
    set({ wallpaper });
    get().persistSettings();
  },
  setTaskbarPosition: (taskbarPosition: 'bottom' | 'top') => {
    set({ taskbarPosition });
    get().persistSettings();
  },
  setShowDesktopIcons: (showDesktopIcons: boolean) => {
    set({ showDesktopIcons });
    get().persistSettings();
  },
  setDesktopIconSize: (desktopIconSize: 'small' | 'medium' | 'large') => {
    set({ desktopIconSize });
    get().persistSettings();
  },
  setTaskbarSize: (taskbarSize: 'small' | 'medium' | 'large') => {
    set({ taskbarSize });
    get().persistSettings();
  },
  setClockFormat: (clockFormat: '12h' | '24h') => {
    set({ clockFormat });
    get().persistSettings();
  },
  setTheme: (theme: 'light' | 'dark') => {
    set({ theme });
    get().persistSettings();
  },
  toggleNotificationPanel: () => set((state) => ({ isNotificationPanelOpen: !state.isNotificationPanelOpen })),
  
  setupUser: (username, password) => {
    const user = { username, password };
    set({ user, hasSetup: true, isLoggedIn: true });
    get().persistSettings();
  },

  login: (password) => {
    const { user } = get();
    if (user && user.password === password) {
      set({ isLoggedIn: true });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ isLoggedIn: false });
  },

  updateUser: (username, password) => {
    const currentUser = get().user;
    const updatedUser = { 
      username, 
      password: password !== undefined ? password : currentUser?.password 
    };
    set({ user: updatedUser });
    get().persistSettings();
  },

  pinApp: (appId: string) => {
    if (!get().pinnedApps.includes(appId)) {
      set({ pinnedApps: [...get().pinnedApps, appId] });
      get().persistSettings();
    }
  },
  unpinApp: (appId: string) => {
    set({ pinnedApps: get().pinnedApps.filter(id => id !== appId) });
    get().persistSettings();
  },
  showContextMenu: (x, y, items) => set({ contextMenu: { x, y, items, isVisible: true } }),
  hideContextMenu: () => set((state) => ({ contextMenu: { ...state.contextMenu, isVisible: false } })),
  showModal: (options) => set({ modal: options }),
  hideModal: () => set({ modal: null }),

  persistSettings: async () => {
    const state = get();
    const settings = {
      wallpaper: state.wallpaper,
      taskbarPosition: state.taskbarPosition,
      pinnedApps: state.pinnedApps,
      showDesktopIcons: state.showDesktopIcons,
      desktopIconSize: state.desktopIconSize,
      taskbarSize: state.taskbarSize,
      clockFormat: state.clockFormat,
      theme: state.theme,
      user: state.user,
      hasSetup: state.hasSetup,
    };
    if (!(await vfs.exists('/etc'))) {
      await vfs.mkdir('/', 'etc');
    }
    await vfs.writeFile('/etc/settings.json', JSON.stringify(settings));
  },

  loadSettings: async () => {
    const saved = await vfs.readFile('/etc/settings.json');
    if (saved && saved.content) {
      try {
        const settings = JSON.parse(saved.content);
        
        // Migrate old default wallpaper to new one
        let wallpaper = settings.wallpaper ?? get().wallpaper;
        if (wallpaper === 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)') {
          wallpaper = '/wp1.png';
        }

        set({
          wallpaper,
          taskbarPosition: settings.taskbarPosition ?? get().taskbarPosition,
          pinnedApps: settings.pinnedApps ?? get().pinnedApps,
          showDesktopIcons: settings.showDesktopIcons ?? get().showDesktopIcons,
          desktopIconSize: settings.desktopIconSize ?? get().desktopIconSize,
          taskbarSize: settings.taskbarSize ?? get().taskbarSize,
          clockFormat: settings.clockFormat ?? get().clockFormat,
          theme: settings.theme ?? get().theme,
          user: settings.user ?? get().user,
          hasSetup: settings.hasSetup ?? get().hasSetup,
        });
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    }
  },

  launchApp: (appId: string, args?: any) => {
    const { windows, processes, nextPid } = get();
    const app = APP_REGISTRY[appId];

    if (!app) {
      console.error(`App ${appId} not found in registry`);
      return;
    }

    // Handle singlton apps
    if (app.singleton) {
      const existingProcess = processes.find(p => p.appId === appId);
      if (existingProcess) {
        const win = windows.find(w => w.id === existingProcess.windowId);
        if (win) {
          // Update args and focus
          set((state) => ({
            processes: state.processes.map(p => p.windowId === win.id ? { ...p, args } : p)
          }));
          get().focusWindow(win.id);
          return;
        }
      }
    }
    
    const windowId = crypto.randomUUID();
    const pid = nextPid;

    const width = app.defaultSize?.width || 600;
    const height = app.defaultSize?.height || 400;
    
    // Center positioning logic
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
    
    const centerX = Math.max(20, (screenWidth - width) / 2) + (windows.length * 20);
    const centerY = Math.max(20, (screenHeight - height) / 2) + (windows.length * 20);

    const maxZIndex = Math.max(0, ...windows.map((w) => w.zIndex));

    const newWindow: WindowState = {
      id: windowId,
      appId: app.id,
      title: app.name,
      x: centerX,
      y: centerY,
      width: width,
      height: height,
      zIndex: maxZIndex + 1,
      isMinimized: false,
      isMaximized: false,
      isFocused: true,
    };

    const newProcess: Process = {
      pid,
      appId: app.id,
      windowId,
      args
    };

    set({
      windows: [...windows.map(w => ({ ...w, isFocused: false })), newWindow],
      processes: [...processes, newProcess],
      focusedWindowId: windowId,
      nextPid: nextPid + 1,
    });
  },

  closeWindow: (windowId: string) => {
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== windowId),
      processes: state.processes.filter((p) => p.windowId !== windowId),
      focusedWindowId: state.focusedWindowId === windowId ? null : state.focusedWindowId,
    }));
  },

  focusWindow: (windowId: string) => {
    set((state) => {
      const maxZIndex = Math.max(0, ...state.windows.map((w) => w.zIndex));
      return {
        windows: state.windows.map((w) => ({
          ...w,
          isFocused: w.id === windowId,
          zIndex: w.id === windowId ? maxZIndex + 1 : w.zIndex,
          isMinimized: w.id === windowId ? false : w.isMinimized,
        })),
        focusedWindowId: windowId,
      };
    });
  },

  minimizeWindow: (windowId: string) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === windowId ? { ...w, isMinimized: true, isFocused: false } : w
      ),
      focusedWindowId: state.focusedWindowId === windowId ? null : state.focusedWindowId,
    }));
  },

  maximizeWindow: (windowId: string) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === windowId ? { ...w, isMaximized: !w.isMaximized } : w
      ),
    }));
  },

  updateWindowPosition: (windowId: string, x: number, y: number) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === windowId ? { ...w, x, y } : w
      ),
    }));
  },

  updateWindowSize: (windowId: string, width: number, height: number) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === windowId ? { ...w, width, height } : w
      ),
    }));
  },

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    const newNotification: Notification = { ...notification, id, timestamp };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
      notificationHistory: [newNotification, ...state.notificationHistory].slice(0, 50)
    }));

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      get().removeNotification(id);
    }, 5000);
  },
  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },
  setClipboard: (clipboard) => set({ clipboard })
}));
