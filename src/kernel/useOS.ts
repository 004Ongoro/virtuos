import { useKernel } from './useKernel';
import { vfs } from '../vfs/vfs';

export function useOS() {
  const kernel = useKernel();

  return {
    // Window Management
    launchApp: kernel.launchApp,
    closeWindow: kernel.closeWindow,
    focusWindow: kernel.focusWindow,
    minimizeWindow: kernel.minimizeWindow,
    maximizeWindow: kernel.maximizeWindow,
    
    // Notifications
    notify: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      kernel.addNotification({ title, message, type });
    },

    // VFS
    fs: vfs,
    
    // Process info
    windows: kernel.windows,
    focusedWindowId: kernel.focusedWindowId,
  };
}
