import { useState, useEffect, useRef } from 'preact/hooks';
import { useOS } from '../../kernel/useOS';
import { useKernel } from '../../kernel/useKernel';
import type { VFSNode } from '../../vfs/vfs';
import * as Icons from 'lucide-preact';

export default function Files() {
  const { fs, notify, launchApp } = useOS();
  const { showContextMenu, setWallpaper } = useKernel();
  const [currentPath, setCurrentPath] = useState('/home');
  const [items, setItems] = useState<VFSNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual double-click tracking
  const lastClickRef = useRef<{ time: number, path: string | null }>({ time: 0, path: null });

  const loadItems = async (path: string) => {
    setLoading(true);
    try {
      const list = await fs.listFiles(path);
      setItems(list);
      setCurrentPath(path);
    } catch (err) {
      notify('Error', 'Failed to load directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems(currentPath);
  }, []);

  const navigateUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const newPath = '/' + parts.join('/');
    loadItems(newPath === '' ? '/' : newPath);
  };

  const getCompatibleApps = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const apps: string[] = [];
    
    if (['txt', 'md', 'json', 'js', 'ts', 'html', 'css'].includes(ext || '')) {
      apps.push('notepad');
    }
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '')) {
      apps.push('photos');
    }
    if (['mp4', 'webm', 'mp3', 'wav', 'ogg'].includes(ext || '')) {
      apps.push('media');
    }
    if (ext === 'html') {
      apps.push('browser');
    }
    
    return apps.length > 0 ? apps : ['notepad'];
  };

  const handleItemClick = (item: VFSNode, specificApp?: string) => {
    if (item.type === 'dir') {
      const newPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
      loadItems(newPath);
    } else {
      const fullPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
      const appToLaunch = specificApp || getCompatibleApps(item.name)[0];
      launchApp(appToLaunch, { filePath: fullPath });
    }
  };

  const onFileClick = (item: VFSNode) => {
    const now = Date.now();
    const fullPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
    
    if (lastClickRef.current.path === fullPath && (now - lastClickRef.current.time) < 300) {
      if (currentPath === '/trash') {
        handleRestore(item);
      } else {
        handleItemClick(item);
      }
      lastClickRef.current = { time: 0, path: null };
    } else {
      lastClickRef.current = { time: now, path: fullPath };
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Folder name:');
    if (name) {
      await fs.mkdir(currentPath, name);
      loadItems(currentPath);
    }
  };

  const handleCreateFile = async () => {
    const name = prompt('File name:');
    if (name) {
      await fs.writeFile(`${currentPath}/${name}`, '');
      loadItems(currentPath);
    }
  };

  const handleMoveToTrash = async (item: VFSNode) => {
    const path = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
    const trashPath = `/trash/${item.name}_${Date.now()}`;
    try {
      await fs.moveFile(path, trashPath);
      notify('Trash', `${item.name} moved to trash`, 'info');
      loadItems(currentPath);
    } catch (err) {
      notify('Error', 'Failed to move to trash', 'error');
    }
  };

  const handlePermanentDelete = async (item: VFSNode) => {
    const path = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
    if (confirm(`Permanently delete ${item.name}? This cannot be undone.`)) {
      await fs.deleteFile(path);
      loadItems(currentPath);
    }
  };

  const handleRestore = async (item: VFSNode) => {
    const trashPath = `/trash/${item.name}`;
    // Extract original name (it was stored as name_timestamp)
    const nameParts = item.name.split('_');
    nameParts.pop(); // remove timestamp
    const originalName = nameParts.join('_') || item.name;
    const restorePath = `/home/${originalName}`;

    try {
      await fs.moveFile(trashPath, restorePath);
      notify('Restore', `Restored ${originalName} to /home`, 'success');
      loadItems(currentPath);
    } catch (err) {
      notify('Error', 'Failed to restore file', 'error');
    }
  };

  const handleSetWallpaper = async (item: VFSNode) => {
    const fullPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
    const node = await fs.readFile(fullPath);
    if (node && node.content) {
      let url = '';
      if (node.content instanceof Blob) {
        url = URL.createObjectURL(node.content);
      } else if (typeof node.content === 'string') {
        url = node.content;
      }
      if (url) {
        setWallpaper(url);
        notify('Wallpaper', 'Desktop background updated', 'success');
      }
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      await fs.writeFile(path, file);
    }
    loadItems(currentPath);
  };

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu(e.clientX, e.clientY, [
      { label: 'New Folder', icon: 'FolderPlus', action: handleCreateFolder },
      { label: 'New File', icon: 'FilePlus', action: handleCreateFile },
      { label: 'Upload Files', icon: 'Upload', action: () => fileInputRef.current?.click() },
      { divider: true, label: '', action: () => {} },
      { label: 'Refresh', icon: 'RotateCw', action: () => loadItems(currentPath) },
    ]);
  };

  const onItemContextMenu = (e: MouseEvent, item: VFSNode) => {
    e.preventDefault();
    e.stopPropagation();
    const ext = item.name.split('.').pop()?.toLowerCase();
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '');
    const isInTrash = currentPath === '/trash';

    const menuItems: any[] = [
      { label: isInTrash ? 'Restore' : 'Open', icon: isInTrash ? 'Undo' : 'ExternalLink', action: () => {
        if (isInTrash) handleRestore(item);
        else handleItemClick(item);
      }},
    ];

    if (!isInTrash) {
      const compatibleApps = getCompatibleApps(item.name);
      menuItems.push(...compatibleApps.map(appId => ({
        label: `Open in ${appId.charAt(0).toUpperCase() + appId.slice(1)}`,
        icon: appId === 'notepad' ? 'FileText' : appId === 'photos' ? 'Image' : appId === 'media' ? 'PlayCircle' : 'Globe',
        action: () => handleItemClick(item, appId)
      })));

      if (isImage) {
        menuItems.push({ label: 'Set as Wallpaper', icon: 'Image', action: () => handleSetWallpaper(item) });
      }
      
      menuItems.push({ divider: true, label: '', action: () => {} });
      menuItems.push({ label: 'Move to Trash', icon: 'Trash', action: () => handleMoveToTrash(item), danger: true });
    } else {
      menuItems.push({ label: 'Delete Permanently', icon: 'Trash2', action: () => handlePermanentDelete(item), danger: true });
    }

    showContextMenu(e.clientX, e.clientY, menuItems);
  };

  const QuickAccessItems = [
    { label: 'Home', path: '/home', icon: 'Home' },
    { label: 'Documents', path: '/home/documents', icon: 'FileText' },
    { label: 'Pictures', path: '/home/pictures', icon: 'Image' },
    { label: 'Bin', path: '/trash', icon: 'Trash2' },
    { label: 'Root', path: '/', icon: 'HardDrive' },
  ];

  return (
    <div 
      className="files-app" 
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer?.files || null); }}
      style={{ display: 'flex', height: '100%', background: 'var(--surface-color)', color: 'var(--text-color)', backdropFilter: 'blur(10px)' }}
    >
      <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => handleFileUpload((e.target as HTMLInputElement).files)} />

      {/* Sidebar */}
      <div className="files-sidebar" style={{ width: '200px', background: 'rgba(0,0,0,0.05)', borderRight: '1px solid var(--window-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '15px 10px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Access</div>
        {QuickAccessItems.map(item => {
          const Icon = (Icons as any)[item.icon];
          return (
            <div 
              key={item.path}
              onClick={() => loadItems(item.path)}
              style={{ 
                padding: '8px 15px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                cursor: 'pointer',
                background: currentPath === item.path ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                borderRadius: '6px',
                margin: '2px 8px',
                fontSize: '13px',
                color: currentPath === item.path ? 'var(--accent-color)' : 'inherit'
              }}
            >
              <Icon size={16} />
              {item.label}
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div className="files-toolbar" style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--window-border)' }}>
          <button onClick={navigateUp} disabled={currentPath === '/'} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: currentPath === '/' ? 0.3 : 1 }}>
            <Icons.ChevronLeft size={20} />
          </button>
          <div style={{ flex: 1, padding: '4px 10px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentPath}
          </div>
          <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Upload"><Icons.Upload size={18} /></button>
          <button onClick={() => loadItems(currentPath)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Refresh"><Icons.RotateCw size={18} /></button>
        </div>

        <div 
          className="files-grid" 
          onContextMenu={onContextMenu}
          style={{ flex: 1, padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', alignContent: 'start', overflowY: 'auto' }}
        >
          {loading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>Loading...</div>
          ) : items.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', opacity: 0.5, fontSize: '13px' }}>This folder is empty.</div>
          ) : (
            items.map(item => {
              const ext = item.name.split('.').pop()?.toLowerCase();
              const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '');
              const isMedia = ['mp4', 'webm', 'mp3', 'wav', 'ogg'].includes(ext || '');

              return (
                <div 
                  key={item.name} 
                  className="file-item" 
                  onClick={() => onFileClick(item)}
                  onContextMenu={(e) => onItemContextMenu(e, item)}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '8px', 
                    cursor: 'pointer', 
                    padding: '10px', 
                    borderRadius: '8px',
                    transition: 'background 0.2s',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {item.type === 'dir' ? (
                    <Icons.Folder size={40} color="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  ) : isImage ? (
                    <Icons.Image size={40} color="#10b981" />
                  ) : isMedia ? (
                    <Icons.PlayCircle size={40} color="#f59e0b" />
                  ) : (
                    <Icons.FileText size={40} color="#94a3b8" />
                  )}
                  <span style={{ fontSize: '12px', textAlign: 'center', wordBreak: 'break-all', maxWidth: '80px' }}>{item.name}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isDragging && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(59, 130, 246, 0.1)', border: '2px dashed #3b82f6', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ background: '#3b82f6', color: 'white', padding: '10px 20px', borderRadius: '20px', fontWeight: 'bold' }}>Drop to upload</div>
        </div>
      )}
    </div>
  );
}
