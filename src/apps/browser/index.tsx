import { useState, useEffect } from 'preact/hooks';
import { useOS } from '../../kernel/useOS';
import { useKernel } from '../../kernel/useKernel';
import * as Icons from 'lucide-preact';

interface Tab {
  id: string;
  url: string;
  title: string;
  history: string[];
  historyIndex: number;
}

export default function Browser(props: { filePath?: string }) {
  const { fs, launchApp } = useOS();
  const { showContextMenu } = useKernel();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadHistory();
    const initialUrl = props.filePath || 'about:blank';
    const initialTab: Tab = { 
      id: crypto.randomUUID(), 
      url: initialUrl, 
      title: initialUrl === 'about:blank' ? 'New Tab' : initialUrl.split('/').pop() || initialUrl,
      history: [initialUrl],
      historyIndex: 0
    };
    setTabs([initialTab]);
    setActiveTabId(initialTab.id);
  }, []);

  const activeTab = tabs.find(t => t.id === activeTabId);

  useEffect(() => {
    if (activeTab) {
      setInputUrl(activeTab.url === 'about:blank' ? '' : activeTab.url);
    }
  }, [activeTabId, activeTab?.url]);

  const loadHistory = async () => {
    const saved = await fs.readFile('/home/.browser/history.json');
    if (saved && saved.content) {
      try {
        setHistory(JSON.parse(saved.content));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  };

  const saveHistory = async (newHistory: string[]) => {
    if (!(await fs.exists('/home/.browser'))) {
      await fs.mkdir('/home', '.browser');
    }
    await fs.writeFile('/home/.browser/history.json', JSON.stringify(newHistory));
  };

  const handleGo = (e?: any) => {
    if (e) e.preventDefault();
    let target = inputUrl.trim();
    if (!target) return;

    if (!target.startsWith('http') && !target.startsWith('/') && !target.startsWith('about:')) {
      if (target.includes('.') && !target.includes(' ')) {
        target = 'https://' + target;
      } else {
        // Use DuckDuckGo Lite which is more likely to work in iframes
        target = `https://duckduckgo.com/lite/?q=${encodeURIComponent(target)}`;
      }
    }

    updateActiveTab(target);
    addToHistory(target);
  };

  const updateActiveTab = (url: string, title?: string) => {
    setTabs(tabs.map(t => {
      if (t.id === activeTabId) {
        const newHistory = t.history.slice(0, t.historyIndex + 1);
        newHistory.push(url);
        return { 
          ...t, 
          url, 
          title: title || url.split('/').pop() || url,
          history: newHistory,
          historyIndex: newHistory.length - 1
        };
      }
      return t;
    }));
  };

  const addToHistory = (url: string) => {
    const newHistory = [url, ...history.filter(h => h !== url)].slice(0, 100);
    setHistory(newHistory);
    saveHistory(newHistory);
  };

  const createTab = () => {
    const newId = crypto.randomUUID();
    const newTab = { 
      id: newId, 
      url: 'about:blank', 
      title: 'New Tab',
      history: ['about:blank'],
      historyIndex: 0
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      const newId = crypto.randomUUID();
      setTabs([{ 
        id: newId, 
        url: 'about:blank', 
        title: 'New Tab',
        history: ['about:blank'],
        historyIndex: 0
      }]);
      setActiveTabId(newId);
      return;
    }
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const goBack = () => {
    if (activeTab && activeTab.historyIndex > 0) {
      const newIndex = activeTab.historyIndex - 1;
      const newUrl = activeTab.history[newIndex];
      setTabs(tabs.map(t => t.id === activeTabId ? { ...t, url: newUrl, historyIndex: newIndex } : t));
    }
  };

  const goForward = () => {
    if (activeTab && activeTab.historyIndex < activeTab.history.length - 1) {
      const newIndex = activeTab.historyIndex + 1;
      const newUrl = activeTab.history[newIndex];
      setTabs(tabs.map(t => t.id === activeTabId ? { ...t, url: newUrl, historyIndex: newIndex } : t));
    }
  };

  const refresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const openExternal = () => {
    if (activeTab && activeTab.url !== 'about:blank') {
      window.open(activeTab.url, '_blank');
    }
  };

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, [
      { label: 'New Tab', icon: 'Plus', action: createTab },
      { label: 'Reload', icon: 'RotateCw', action: refresh },
      { divider: true, label: '', action: () => {} },
      { label: 'View History', icon: 'History', action: () => setShowHistory(true) },
      { label: 'Open in Native Tab', icon: 'ExternalLink', action: openExternal },
      { divider: true, label: '', action: () => {} },
      { label: 'Browser Settings', icon: 'Settings', action: () => launchApp('settings') },
    ]);
  };

  const SearchEngines = [
    { name: 'DuckDuckGo (Lite)', url: 'https://duckduckgo.com/lite/?q=', icon: 'Shield' },
    { name: 'Google', url: 'https://www.google.com/search?q=', icon: 'Search' },
    { name: 'Bing', url: 'https://www.bing.com/search?q=', icon: 'Globe' },
  ];

  if (!activeTab) return null;

  return (
    <div 
      style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}
      onContextMenu={handleContextMenu}
    >
      {/* Tab Bar */}
      <div style={{ background: '#e2e8f0', display: 'flex', alignItems: 'center', padding: '4px 4px 0 4px', gap: '2px', borderBottom: '1px solid #cbd5e1' }}>
        {tabs.map(tab => (
          <div 
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            style={{
              padding: '6px 12px',
              background: tab.id === activeTabId ? '#fff' : 'transparent',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              border: tab.id === activeTabId ? '1px solid #cbd5e1' : 'none',
              borderBottom: tab.id === activeTabId ? '1px solid #fff' : 'none',
              marginBottom: '-1px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '120px',
              maxWidth: '200px',
              cursor: 'pointer',
              fontSize: '11px',
              color: tab.id === activeTabId ? '#1e293b' : '#64748b'
            }}
          >
            <Icons.Globe size={12} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tab.title}</span>
            <Icons.X size={12} onClick={(e) => closeTab(e, tab.id)} />
          </div>
        ))}
        <button onClick={createTab} style={{ background: 'none', border: 'none', padding: '4px 8px', cursor: 'pointer', color: '#64748b' }}>
          <Icons.Plus size={16} />
        </button>
      </div>

      {/* Address Bar */}
      <div style={{ padding: '8px 12px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button onClick={goBack} disabled={activeTab.historyIndex === 0} style={{ background: 'none', border: 'none', color: activeTab.historyIndex === 0 ? '#cbd5e1' : '#64748b', cursor: 'pointer' }} title="Back"><Icons.ArrowLeft size={16} /></button>
          <button onClick={goForward} disabled={activeTab.historyIndex === activeTab.history.length - 1} style={{ background: 'none', border: 'none', color: activeTab.historyIndex === activeTab.history.length - 1 ? '#cbd5e1' : '#64748b', cursor: 'pointer' }} title="Forward"><Icons.ArrowRight size={16} /></button>
          <button onClick={refresh} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }} title="Reload"><Icons.RotateCw size={16} /></button>
        </div>
        <form onSubmit={handleGo} style={{ flex: 1, display: 'flex' }}>
          <input 
            type="text" 
            value={inputUrl} 
            onInput={(e) => setInputUrl((e.target as HTMLInputElement).value)}
            style={{ 
              flex: 1, 
              padding: '4px 12px', 
              borderRadius: '20px', 
              border: '1px solid #cbd5e1', 
              fontSize: '13px',
              outline: 'none',
              background: '#f1f5f9'
            }}
            placeholder="Search or enter address"
          />
        </form>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button onClick={openExternal} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }} title="Open in new tab">
            <Icons.ExternalLink size={18} />
          </button>
          <button onClick={() => setShowHistory(!showHistory)} style={{ background: 'none', border: 'none', color: showHistory ? '#3b82f6' : '#64748b', cursor: 'pointer' }} title="History">
            <Icons.History size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {showHistory && (
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '260px', background: '#fff', borderLeft: '1px solid #e2e8f0', zIndex: 10, padding: '15px', overflowY: 'auto', boxShadow: '-2px 0 5px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 'bold' }}>History</h3>
              <Icons.X size={14} style={{ cursor: 'pointer' }} onClick={() => setShowHistory(false)} />
            </div>
            {history.map((url, i) => (
              <div 
                key={i} 
                onClick={() => { updateActiveTab(url); setShowHistory(false); }}
                style={{ fontSize: '12px', padding: '8px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#3b82f6' }}
              >
                {url}
              </div>
            ))}
          </div>
        )}

        {activeTab.url === 'about:blank' ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <Icons.Globe size={64} color="#3b82f6" style={{ marginBottom: '15px' }} />
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}>VirtuOS Browser</h1>
              <p style={{ color: '#64748b' }}>Fast, secure, and integrated.</p>
            </div>
            
            <div style={{ width: '100%', maxWidth: '500px', display: 'flex', gap: '10px', marginBottom: '30px' }}>
              <input 
                type="text" 
                value={inputUrl} 
                onInput={(e) => setInputUrl((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGo()}
                placeholder="Search DuckDuckGo..."
                style={{ flex: 1, padding: '10px 20px', borderRadius: '30px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
              />
              <button onClick={handleGo} style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: '600' }}>Search</button>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              {SearchEngines.map(se => (
                <button 
                  key={se.name}
                  onClick={() => { setInputUrl(se.url); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 15px', borderRadius: '8px', background: '#fff', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569' }}
                >
                  <Icons.Search size={14} />
                  {se.name}
                </button>
              ))}
            </div>
            
            <div style={{ marginTop: '40px', padding: '15px', background: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '8px', color: '#856404', fontSize: '12px', maxWidth: '400px', textAlign: 'center' }}>
              <Icons.AlertTriangle size={16} style={{ marginBottom: '5px' }} />
              <p>Note: Some websites block iframe embedding. If a page refuses to connect, use the <b>Open in Native Tab</b> button in the address bar.</p>
            </div>
          </div>
        ) : (
          <iframe 
            key={`${activeTab.id}-${refreshKey}-${activeTab.url}`}
            src={activeTab.url} 
            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
            title="browser-content"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        )}
      </div>
    </div>
  );
}
