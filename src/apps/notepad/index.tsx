import { useState, useEffect } from 'preact/hooks';
import { useOS } from '../../kernel/useOS';
import { useKernel } from '../../kernel/useKernel';
import * as Icons from 'lucide-preact';

export default function Notepad(props: { filePath?: string }) {
  const { fs, notify } = useOS();
  const { theme: globalTheme } = useKernel();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState<'light' | 'dark'>(globalTheme);
  const currentPath = props.filePath || '/home/note.txt';

  useEffect(() => {
    setTheme(globalTheme);
  }, [globalTheme]);

  useEffect(() => {
    async function loadFile() {
      const saved = await fs.readFile(currentPath);
      if (saved && saved.content !== undefined) {
        setContent(saved.content);
      } else {
        setContent('');
      }
      setLoading(false);
    }
    loadFile();
  }, [currentPath]);

  const handleSave = async () => {
    try {
      await fs.writeFile(currentPath, content);
      notify('Saved', `File saved to ${currentPath}`, 'success');
    } catch (err) {
      notify('Error', 'Failed to save file', 'error');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, currentPath]);

  const fileName = currentPath.split('/').pop() || 'untitled.txt';

  if (loading) return <div style={{ padding: '20px', color: '#64748b' }}>Loading...</div>;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      background: theme === 'light' ? '#fff' : '#1e293b', 
      color: theme === 'light' ? '#334155' : '#f8fafc' 
    }}>
      {/* Robust Toolbar */}
      <div style={{ 
        padding: '8px 12px', 
        background: theme === 'light' ? '#f1f5f9' : '#0f172a', 
        borderBottom: `1px solid ${theme === 'light' ? '#e2e8f0' : '#334155'}`, 
        display: 'flex', 
        gap: '15px', 
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={handleSave} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '6px 14px', 
            background: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          <Icons.Save size={14} />
          Save
        </button>

        <div style={{ width: '1px', height: '20px', background: theme === 'light' ? '#cbd5e1' : '#334155' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={() => setFontSize(s => Math.max(8, s - 1))}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <Icons.Minus size={14} />
          </button>
          <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'center' }}>{fontSize}px</span>
          <button 
            onClick={() => setFontSize(s => Math.min(72, s + 1))}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <Icons.Plus size={14} />
          </button>
        </div>

        <div style={{ width: '1px', height: '20px', background: theme === 'light' ? '#cbd5e1' : '#334155' }} />

        <button 
          onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'inherit', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px'
          }}
        >
          {theme === 'light' ? <Icons.Moon size={14} /> : <Icons.Sun size={14} />}
          {theme === 'light' ? 'Dark' : 'Light'} Mode
        </button>

        <div style={{ flex: 1 }} />

        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
          {fileName}
        </div>
      </div>

      <textarea
        value={content}
        onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
        spellcheck={false}
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          padding: '20px',
          outline: 'none',
          resize: 'none',
          fontFamily: '"Cascadia Code", "Fira Code", "Courier New", monospace',
          fontSize: `${fontSize}px`,
          lineHeight: '1.6',
          background: 'transparent',
          color: 'inherit'
        }}
        placeholder="Start typing..."
      />

      {/* Footer Info */}
      <div style={{ 
        padding: '4px 12px', 
        fontSize: '11px', 
        background: theme === 'light' ? '#f8fafc' : '#0f172a', 
        borderTop: `1px solid ${theme === 'light' ? '#e2e8f0' : '#334155'}`,
        color: '#64748b',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>UTF-8</span>
        <span>Lines: {content.split('\n').length} | Chars: {content.length}</span>
      </div>
    </div>
  );
}
