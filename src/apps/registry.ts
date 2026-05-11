import { lazy } from 'preact/compat';
import type { AppMetadata } from '../types';

export interface AppEntry extends AppMetadata {
  lazyComponent: any;
}

export const APP_REGISTRY: Record<string, AppEntry> = {
  notepad: {
    id: 'notepad',
    name: 'Notepad',
    icon: 'FileText',
    component: () => import('./notepad/index.tsx'),
    lazyComponent: lazy(() => import('./notepad/index.tsx')),
    defaultSize: { width: 600, height: 400 }
  },
  files: {
    id: 'files',
    name: 'Files',
    icon: 'Folder',
    component: () => import('./files/index.tsx'),
    lazyComponent: lazy(() => import('./files/index.tsx')),
    defaultSize: { width: 600, height: 450 }
  },
  browser: {
    id: 'browser',
    name: 'Browser',
    icon: 'Globe',
    component: () => import('./browser/index.tsx'),
    lazyComponent: lazy(() => import('./browser/index.tsx')),
    defaultSize: { width: 800, height: 600 }
  },
  settings: {
    id: 'settings',
    name: 'Settings',
    icon: 'Settings',
    component: () => import('./settings/index.tsx'),
    lazyComponent: lazy(() => import('./settings/index.tsx')),
    defaultSize: { width: 700, height: 550 },
    singleton: true
  },
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    icon: 'Terminal',
    component: () => import('./terminal/index.tsx'),
    lazyComponent: lazy(() => import('./terminal/index.tsx')),
    defaultSize: { width: 700, height: 450 }
  },
  taskmanager: {
    id: 'taskmanager',
    name: 'Task Manager',
    icon: 'Activity',
    component: () => import('./taskmanager/index.tsx'),
    lazyComponent: lazy(() => import('./taskmanager/index.tsx')),
    defaultSize: { width: 600, height: 500 },
    singleton: true
  },
  calculator: {
    id: 'calculator',
    name: 'Calculator',
    icon: 'Calculator',
    component: () => import('./calculator/index.tsx'),
    lazyComponent: lazy(() => import('./calculator/index.tsx')),
    defaultSize: { width: 320, height: 450 }
  },
  photos: {
    id: 'photos',
    name: 'Photos',
    icon: 'Image',
    component: () => import('./photos/index.tsx'),
    lazyComponent: lazy(() => import('./photos/index.tsx')),
    defaultSize: { width: 800, height: 600 }
  },
  media: {
    id: 'media',
    name: 'Media Player',
    icon: 'PlayCircle',
    component: () => import('./media/index.tsx'),
    lazyComponent: lazy(() => import('./media/index.tsx')),
    defaultSize: { width: 640, height: 480 }
  },
  appstore: {
    id: 'appstore',
    name: 'App Store',
    icon: 'ShoppingBag',
    component: () => import('./appstore/index.tsx'),
    lazyComponent: lazy(() => import('./appstore/index.tsx')),
    defaultSize: { width: 900, height: 650 },
    singleton: true
  },
  screenshot: {
    id: 'screenshot',
    name: 'Screenshot',
    icon: 'Camera',
    component: () => import('./screenshot/index.tsx'),
    lazyComponent: lazy(() => import('./screenshot/index.tsx')),
    defaultSize: { width: 450, height: 550 },
    singleton: true
  },
  help: {
    id: 'help',
    name: 'Help',
    icon: 'HelpCircle',
    component: () => import('./help/index.tsx'),
    lazyComponent: lazy(() => import('./help/index.tsx')),
    defaultSize: { width: 700, height: 500 },
    singleton: true
  }
};

export const getAppMetadata = (id: string): AppEntry | undefined => {
  return APP_REGISTRY[id];
};
