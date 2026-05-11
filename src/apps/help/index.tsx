import * as Icons from 'lucide-preact';

export default function Help() {
  const categories = [
    {
      title: 'Getting Started',
      icon: 'Rocket',
      items: [
        { label: 'Welcome to VirtuOS', desc: 'Learn the basics of your new operating system.' },
        { label: 'Customizing Desktop', desc: 'How to change wallpapers and icon sizes.' },
        { label: 'Managing Files', desc: 'Using the File Explorer to organize your data.' }
      ]
    },
    {
      title: 'Keyboard Shortcuts',
      icon: 'Keyboard',
      items: [
        { label: 'Ctrl + A', desc: 'Select All items' },
        { label: 'Ctrl + C / V', desc: 'Copy and Paste' },
        { label: 'Ctrl + X', desc: 'Cut' },
        { label: 'Alt + F4', desc: 'Close active window' },
        { label: 'Win + D', desc: 'Show desktop' },
        { label: 'Win + L', desc: 'Lock system' }
      ]
    },
    {
      title: 'System & Apps',
      icon: 'Settings',
      items: [
        { label: 'App Store', desc: 'Install and manage your applications.' },
        { label: 'Terminal', desc: 'Advanced command line interface.' },
        { label: 'Settings', desc: 'Configure system-wide preferences.' }
      ]
    }
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface-color)', color: 'var(--text-color)' }}>
      <div style={{ padding: '30px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>How can we help?</h1>
        <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>Search help articles or browse categories below</p>
      </div>
      
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {categories.map(cat => {
            const Icon = (Icons as any)[cat.icon] || Icons.HelpCircle;
            return (
              <div key={cat.title} style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--window-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: 'var(--accent-color)' }}>
                  <Icon size={24} />
                  <h2 style={{ margin: 0, fontSize: '18px' }}>{cat.title}</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {cat.items.map(item => (
                    <div key={item.label} style={{ cursor: 'pointer' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '2px' }}>{item.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid var(--window-border)', fontSize: '12px', color: 'var(--text-secondary)' }}>
        VirtuOS Help Center • Version 1.0.0
      </div>
    </div>
  );
}
