import { useState, useEffect, useRef } from 'preact/hooks';
import { useOS } from '../../kernel/useOS';
import { useKernel } from '../../kernel/useKernel';
import type { VFSNode } from '../../vfs/vfs';
import * as Icons from 'lucide-preact';

export default function Files(props: { initialPath?: string }) {
  const { fs, notify, launchApp } = useOS();
  const { showContextMenu, setWallpaper, setClipboard, clipboard, showModal } = useKernel();
  const [currentPath, setCurrentPath] = useState(props.initialPath || '/home');
  const [items, setItems] = useState<VFSNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectionRect, setSelectionRect] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const isMarqueeDragging = useRef(false);

  // Manual double-click tracking
  const lastClickRef = useRef<{ time: number, path: string | null }>({ time: 0, path: null });

  const loadItems = async (path: string) => {
    setLoading(true);
    try {
      const list = await fs.listFiles(path);
      setItems(list);
      setCurrentPath(path);
      setSelectedFiles([]);
    } catch (err) {
      notify('Error', 'Failed to load directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (selectedFiles.length === 0) return;
    setClipboard({ type: 'files', data: selectedFiles.map(name => currentPath === '/' ? `/${name}` : `${currentPath}/${name}`), action: 'copy' });
    notify('Clipboard', `Copied ${selectedFiles.length} items`, 'success');
  };

  const handleCut = () => {
    if (selectedFiles.length === 0) return;
    setClipboard({ type: 'files', data: selectedFiles.map(name => currentPath === '/' ? `/${name}` : `${currentPath}/${name}`), action: 'cut' });
    notify('Clipboard', `Cut ${selectedFiles.length} items`, 'success');
  };
const handlePaste = async (targetPath = currentPath) => {
  if (!clipboard || clipboard.type !== 'files') return;

  try {
    for (const sourcePath of clipboard.data) {
      const fileName = sourcePath.split('/').pop();
      const destPath = targetPath === '/' ? `/${fileName}` : `${targetPath}/${fileName}`;

      if (destPath === sourcePath) {
          // Handle pasting into same directory - maybe add "copy" suffix
          // For now just skip or let it overwrite
      }

      if (clipboard.action === 'copy') {
        await (fs as any).copyFile(sourcePath, destPath);
      } else {
        await fs.moveFile(sourcePath, destPath);
      }
    }

    if (clipboard.action === 'cut') {
      setClipboard(null);
    }

    loadItems(currentPath);
    notify('Clipboard', 'Paste complete', 'success');
  } catch (err) {
    notify('Error', 'Paste failed', 'error');
  }
};

const handleDragStart = (e: DragEvent, item: VFSNode) => {
  // If dragging an unselected item, select only it
  if (!selectedFiles.includes(item.name)) {
      setSelectedFiles([item.name]);
  }

  const dragData = selectedFiles.includes(item.name) 
      ? selectedFiles.map(name => currentPath === '/' ? `/${name}` : `${currentPath}/${name}`)
      : [currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`];

  e.dataTransfer?.setData('application/virtuos-files', JSON.stringify(dragData));
  e.dataTransfer!.dropEffect = 'move';
};

const handleDropOnFolder = async (e: DragEvent, folder: VFSNode) => {
  e.preventDefault();
  e.stopPropagation();
  const data = e.dataTransfer?.getData('application/virtuos-files');
  if (!data) return;

  try {
    const sourcePaths: string[] = JSON.parse(data);
    const targetDir = currentPath === '/' ? `/${folder.name}` : `${currentPath}/${folder.name}`;

    for (const sourcePath of sourcePaths) {
      const fileName = sourcePath.split('/').pop();
      const destPath = `${targetDir}/${fileName}`;
      if (sourcePath !== destPath) {
        await fs.moveFile(sourcePath, destPath);
      }
    }
    loadItems(currentPath);
    notify('Move', `Moved ${sourcePaths.length} items to ${folder.name}`, 'success');
  } catch (err) {
    notify('Error', 'Failed to move items', 'error');
  }
};


  const handleRename = (item: VFSNode) => {
    showModal({
      title: 'Rename',
      message: `Enter new name for ${item.name}:`,
      type: 'prompt',
      defaultValue: item.name,
      onConfirm: async (newName) => {
        if (!newName || newName === item.name) return;
        const oldPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
        const newPath = currentPath === '/' ? `/${newName}` : `${currentPath}/${newName}`;
        try {
          await fs.moveFile(oldPath, newPath);
          loadItems(currentPath);
        } catch (err) {
          notify('Error', 'Failed to rename', 'error');
        }
      }
    });
  };

  const handleCreateFolder = () => {
    showModal({
      title: 'New Folder',
      message: 'Enter folder name:',
      type: 'prompt',
      defaultValue: 'New Folder',
      onConfirm: async (name) => {
        if (name) {
          try {
            await fs.mkdir(currentPath, name);
            loadItems(currentPath);
          } catch (err) {
            notify('Error', 'Failed to create folder', 'error');
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
            await fs.writeFile(currentPath === '/' ? `/${name}` : `${currentPath}/${name}`, '');
            loadItems(currentPath);
          } catch (err) {
            notify('Error', 'Failed to create file', 'error');
          }
        }
      }
    });
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

  const handlePermanentDelete = (item: VFSNode) => {
    showModal({
      title: 'Delete Permanently',
      message: `Are you sure you want to permanently delete ${item.name}? This cannot be undone.`,
      type: 'confirm',
      onConfirm: async () => {
        const path = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
        try {
          await fs.deleteFile(path);
          loadItems(currentPath);
          notify('Deleted', `${item.name} deleted`, 'info');
        } catch (err) {
          notify('Error', 'Failed to delete', 'error');
        }
      }
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedFiles(items.map(i => i.name));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        handleCut();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedFiles.length === 1) {
            const item = items.find(i => i.name === selectedFiles[0]);
            if (item) handleItemClick(item);
        }
      }
      if (e.key === 'Delete') {
        e.preventDefault();
        if (selectedFiles.length > 0) {
            selectedFiles.forEach(name => {
                const item = items.find(i => i.name === name);
                if (item) handleMoveToTrash(item);
            });
        }
      }
      if (e.key === 'F2' && selectedFiles.length === 1) {
        e.preventDefault();
        const item = items.find(i => i.name === selectedFiles[0]);
        if (item) handleRename(item);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedFiles, clipboard, currentPath]);

  const handleMarqueeMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    if (e.target !== gridRef.current) return;

    isMarqueeDragging.current = true;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSelectionRect({ x1: x, y1: y, x2: x, y2: y });
    
    if (!e.ctrlKey && !e.shiftKey) {
        setSelectedFiles([]);
    }
  };

  const handleMarqueeMouseMove = (e: MouseEvent) => {
    if (!isMarqueeDragging.current || !selectionRect || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - gridRect.left;
    const y = e.clientY - gridRect.top;
    const newRect = { ...selectionRect, x2: x, y2: y };
    setSelectionRect(newRect);

    // Calculate selection
    const xMin = Math.min(newRect.x1, newRect.x2) + gridRect.left;
    const xMax = Math.max(newRect.x1, newRect.x2) + gridRect.left;
    const yMin = Math.min(newRect.y1, newRect.y2) + gridRect.top;
    const yMax = Math.max(newRect.y1, newRect.y2) + gridRect.top;

    const fileItems = gridRef.current.querySelectorAll('.file-item');
    const newSelected: string[] = [];
    fileItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const fileName = item.getAttribute('data-name');
      if (fileName &&
          rect.left < xMax &&
          rect.right > xMin &&
          rect.top < yMax &&
          rect.bottom > yMin) {
        newSelected.push(fileName);
      }
    });
    setSelectedFiles(newSelected);
  };

  const handleMarqueeMouseUp = () => {
    isMarqueeDragging.current = false;
    setSelectionRect(null);
  };

  useEffect(() => {
    if (selectionRect) {
      window.addEventListener('mousemove', handleMarqueeMouseMove);
      window.addEventListener('mouseup', handleMarqueeMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMarqueeMouseMove);
      window.removeEventListener('mouseup', handleMarqueeMouseUp);
    };
  }, [selectionRect]);

  useEffect(() => {
    loadItems(props.initialPath || currentPath);
  }, [props.initialPath]);

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

  const handleRestore = async (item: VFSNode) => {
    const trashPath = `/trash/${item.name}`;
    const nameParts = item.name.split('_');
    nameParts.pop();
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
      { label: 'Paste', icon: 'Clipboard', action: handlePaste, divider: true },
      { label: 'Refresh', icon: 'RotateCw', action: () => loadItems(currentPath) },
    ]);
  };

  const onItemContextMenu = (e: MouseEvent, item: VFSNode) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedFiles.includes(item.name)) {
        setSelectedFiles([item.name]);
    }

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
      if (item.type === 'dir') {
        menuItems.push({ label: 'Paste into Folder', icon: 'Clipboard', action: () => handlePaste(currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`), divider: true });
      }
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
      menuItems.push({ label: 'Copy', icon: 'Copy', action: handleCopy });
      menuItems.push({ label: 'Cut', icon: 'Scissors', action: handleCut });
      menuItems.push({ label: 'Rename', icon: 'Type', action: () => handleRename(item) });
      menuItems.push({ divider: true, label: '', action: () => {} });
      menuItems.push({ label: 'Move to Trash', icon: 'Trash', action: () => handleMoveToTrash(item), danger: true });
    } else {
      menuItems.push({ label: 'Delete Permanently', icon: 'Trash2', action: () => handlePermanentDelete(item), danger: true });
    }

    showContextMenu(e.clientX, e.clientY, menuItems);
  };

  const QuickAccessItems = [
    { label: 'Home', path: '/home', icon: 'Home' },
    { label: 'Desktop', path: '/home/desktop', icon: 'Monitor' },
    { label: 'Documents', path: '/home/documents', icon: 'FileText' },
    { label: 'Pictures', path: '/home/pictures', icon: 'Image' },
    { label: 'Music', path: '/home/music', icon: 'Music' },
    { label: 'Videos', path: '/home/videos', icon: 'Film' },
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
          ref={gridRef}
          className="files-grid" 
          onContextMenu={onContextMenu}
          onMouseDown={handleMarqueeMouseDown}
          style={{ flex: 1, padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', alignContent: 'start', overflowY: 'auto', position: 'relative' }}
        >
          {selectionRect && (
            <div style={{
              position: 'absolute',
              left: Math.min(selectionRect.x1, selectionRect.x2),
              top: Math.min(selectionRect.y1, selectionRect.y2),
              width: Math.abs(selectionRect.x2 - selectionRect.x1),
              height: Math.abs(selectionRect.y2 - selectionRect.y1),
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid #3b82f6',
              zIndex: 10,
              pointerEvents: 'none'
            }} />
          )}

          {loading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>Loading...</div>
          ) : items.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', opacity: 0.5, fontSize: '13px' }}>This folder is empty.</div>
          ) : (
            items.map(item => {
              const ext = item.name.split('.').pop()?.toLowerCase();
              const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '');
              const isMedia = ['mp4', 'webm', 'mp3', 'wav', 'ogg'].includes(ext || '');
              const isSelected = selectedFiles.includes(item.name);

              return (
                <div 
                  key={item.name} 
                  data-name={item.name}
                  className={`file-item ${isSelected ? 'selected' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e as any, item)}
                  onDragOver={(e) => {
                      if (item.type === 'dir') {
                          e.preventDefault();
                          (e.currentTarget as HTMLElement).style.background = 'rgba(59, 130, 246, 0.2)';
                      }
                  }}
                  onDragLeave={(e) => {
                      if (item.type === 'dir') {
                          (e.currentTarget as HTMLElement).style.background = isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent';
                      }
                  }}
                  onDrop={(e) => {
                      if (item.type === 'dir') {
                          handleDropOnFolder(e as any, item);
                      }
                  }}
                  onClick={(e) => {
                      e.stopPropagation();
                      if (e.ctrlKey || e.metaKey) {
                          setSelectedFiles(prev => prev.includes(item.name) ? prev.filter(n => n !== item.name) : [...prev, item.name]);
                      } else {
                          setSelectedFiles([item.name]);
                      }
                      onFileClick(item);
                  }}
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
                    userSelect: 'none',
                    background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent'
                  }}
                  onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                  onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = 'transparent')}
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
