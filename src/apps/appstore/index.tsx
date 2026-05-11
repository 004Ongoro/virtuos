import { useState } from 'preact/hooks';
import { useKernel } from '../../kernel/useKernel';
import { APP_REGISTRY } from '../registry';
import * as Icons from 'lucide-preact';

export default function AppStore() {
  const { launchApp, pinnedApps, pinApp, unpinApp } = useKernel();
  const [filter, setFilter] = useState('all');

  const apps = Object.values(APP_REGISTRY).filter(app => {
    if (filter === 'all') return true;
    if (filter === 'system') return ['settings', 'taskmanager', 'files', 'terminal'].includes(app.id);
    if (filter === 'productivity') return ['notepad', 'calculator', 'browser'].includes(app.id);
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-color)', color: 'var(--text-color)' }}>
      {/* Header */}
      <div style={{ padding: '30px 40px', background: 'linear-gradient(to right, var(--accent-color), #2563eb)', color: 'white' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>App Store</h1>
        <p style={{ opacity: 0.9 }}>Discover and manage your VirtuOS applications.</p>
      </div>

      {/* Navigation */}
      <div style={{ padding: '0 40px', background: 'var(--surface-color)', borderBottom: '1px solid var(--window-border)', display: 'flex', gap: '30px' }}>
        {['all', 'productivity', 'system'].map(cat => (
          <button 
            key={cat}
            onClick={() => setFilter(cat)}
            style={{ 
              padding: '15px 0', 
              background: 'none', 
              border: 'none', 
              borderBottom: filter === cat ? '3px solid var(--accent-color)' : '3px solid transparent',
              color: filter === cat ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* App Grid */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {apps.map(app => {
            const Icon = (Icons as any)[app.icon] || Icons.AppWindow;
            const isPinned = pinnedApps.includes(app.id);

            return (
              <div key={app.id} style={{ background: 'var(--surface-color)', borderRadius: '16px', padding: '20px', display: 'flex', gap: '20px', border: '1px solid var(--window-border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '14px', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--window-border)' }}>
                  <Icon size={32} color="var(--accent-color)" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px', color: 'var(--text-color)' }}>{app.name}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '15px' }}>v1.0.0 • Verified</p>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => launchApp(app.id)}
                      style={{ padding: '6px 16px', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Launch
                    </button>
                    <button 
                      onClick={() => isPinned ? unpinApp(app.id) : pinApp(app.id)}
                      style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      {isPinned ? <Icons.PinOff size={14} /> : <Icons.Pin size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
