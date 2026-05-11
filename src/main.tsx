import { render } from 'preact'
import './index.css'
import { App } from './app.tsx'
import { vfs } from './vfs/vfs'
import { useKernel } from './kernel/useKernel'

// Initialize Virtual File System
vfs.init().then(async () => {
  // Disable default browser context menu
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  
  // Load persistent settings
  await useKernel.getState().loadSettings();
  
  render(<App />, document.getElementById('app')!)
});
