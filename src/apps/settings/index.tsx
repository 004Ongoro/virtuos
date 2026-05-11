import { useState } from 'preact/hooks';
import { useOS } from '../../kernel/useOS';
import { useKernel } from '../../kernel/useKernel';
import { APP_REGISTRY } from '../registry';
import * as Icons from 'lucide-preact';

export default function Settings() {
  const { notify } = useOS();
  const { 
    wallpaper, setWallpaper, 
    taskbarPosition, setTaskbarPosition,
    showDesktopIcons, setShowDesktopIcons,
    desktopIconSize, setDesktopIconSize,
    taskbarSize, setTaskbarSize,
    clockFormat, setClockFormat,
    theme, setTheme,
    enableJellyAnimation, setEnableJellyAnimation,
    pinnedApps, pinApp, unpinApp,
    user, updateUser, logout
  } = useKernel();
  const [activeTab, setActiveTab] = useState('personalization');

  // Account form state
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [newPassword, setNewPassword] = useState('');

  const themes = [
    { name: 'Midnight', value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' },
    { name: 'Ocean', value: 'linear-gradient(135deg, #075985 0%, #0c4a6e 100%)' },
    { name: 'Forest', value: 'linear-gradient(135deg, #065f46 0%, #064e3b 100%)' },
    { name: 'Sunset', value: 'linear-gradient(135deg, #9d174d 0%, #831843 100%)' },
    { name: 'Purple', value: 'linear-gradient(135deg, #581c87 0%, #4c1d95 100%)' },
    { name: 'Black', value: '#000000' }
  ];

  const menuItems = [
    { id: 'personalization', label: 'Personalization', icon: 'Palette' },
    { id: 'taskbar', label: 'Taskbar', icon: 'Layout' },
    { id: 'apps', label: 'Apps', icon: 'Grid' },
    { id: 'accounts', label: 'Accounts', icon: 'User' },
    { id: 'input', label: 'Input', icon: 'MousePointer2' },
    { id: 'network', label: 'Network', icon: 'Wifi' },
    { id: 'about', label: 'About', icon: 'Info' },
  ];

  const togglePin = (id: string) => {
    if (pinnedApps.includes(id)) unpinApp(id);
    else pinApp(id);
  };

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--surface-color)', color: 'var(--text-color)', backdropFilter: 'blur(10px)' }}>
      {/* Sidebar */}
      <div style={{ width: '220px', background: 'rgba(0,0,0,0.05)', borderRight: '1px solid var(--window-border)', padding: '20px 10px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', padding: '0 10px' }}>Settings</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {menuItems.map(item => {
            const Icon = (Icons as any)[item.icon];
            return (
              <div 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '10px 15px', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  background: activeTab === item.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  color: activeTab === item.id ? 'var(--accent-color)' : 'var(--text-secondary)',
                  fontWeight: activeTab === item.id ? '600' : '400',
                  fontSize: '13px'
                }}
              >
                <Icon size={16} />
                {item.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {activeTab === 'personalization' && (
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>Personalization</h3>
            
            <section style={{ marginBottom: '40px' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '15px' }}>Wallpaper</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' }}>
                {themes.map(themeItem => (
                  <div key={themeItem.name} onClick={() => setWallpaper(themeItem.value)} style={{ cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ height: '60px', background: themeItem.value, borderRadius: '8px', border: wallpaper === themeItem.value ? '3px solid var(--accent-color)' : '1px solid var(--window-border)', marginBottom: '8px' }} />
                    <span style={{ fontSize: '11px' }}>{themeItem.name}</span>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '15px' }}>System Theme</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['light', 'dark'].map(t => (
                  <button key={t} onClick={() => setTheme(t as any)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--window-border)', background: theme === t ? 'var(--accent-color)' : 'var(--surface-color)', color: theme === t ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', textTransform: 'capitalize', fontSize: '13px' }}>{t} Mode</button>
                ))}
              </div>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '15px' }}>Desktop Icons</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', border: '1px solid var(--window-border)' }}>
                <span style={{ fontSize: '13px' }}>Show desktop icons</span>
                <input type="checkbox" checked={showDesktopIcons} onChange={(e) => setShowDesktopIcons((e.target as HTMLInputElement).checked)} style={{ width: '20px', height: '20px' }} />
              </div>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '15px' }}>Window Effects</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', border: '1px solid var(--window-border)' }}>
                <span style={{ fontSize: '13px' }}>Enable Jelly Animation</span>
                <input type="checkbox" checked={enableJellyAnimation} onChange={(e) => setEnableJellyAnimation((e.target as HTMLInputElement).checked)} style={{ width: '20px', height: '20px' }} />
              </div>
            </section>

            <section>
              <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '15px' }}>Desktop Icon Size</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['small', 'medium', 'large'].map(size => (
                  <button 
                    key={size}
                    onClick={() => setDesktopIconSize(size as any)}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--window-border)', background: desktopIconSize === size ? 'var(--accent-color)' : 'var(--surface-color)', color: desktopIconSize === size ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', textTransform: 'capitalize', fontSize: '12px' }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'taskbar' && (
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>Taskbar</h3>
            <section style={{ marginBottom: '40px' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '15px' }}>Position</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['bottom', 'top'].map(pos => (
                  <button key={pos} onClick={() => setTaskbarPosition(pos as any)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--window-border)', background: taskbarPosition === pos ? 'var(--accent-color)' : 'var(--surface-color)', color: taskbarPosition === pos ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', textTransform: 'capitalize', fontSize: '13px' }}>{pos}</button>
                ))}
              </div>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '15px' }}>Size</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['small', 'medium', 'large'].map(size => (
                  <button key={size} onClick={() => setTaskbarSize(size as any)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--window-border)', background: taskbarSize === size ? 'var(--accent-color)' : 'var(--surface-color)', color: taskbarSize === size ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', textTransform: 'capitalize', fontSize: '13px' }}>{size}</button>
                ))}
              </div>
            </section>

            <section>
              <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '15px' }}>Time & Clock</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['12h', '24h'].map(format => (
                  <button key={format} onClick={() => setClockFormat(format as any)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--window-border)', background: clockFormat === format ? 'var(--accent-color)' : 'var(--surface-color)', color: clockFormat === format ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>{format === '12h' ? '12-Hour (AM/PM)' : '24-Hour'}</button>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'apps' && (
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>Apps</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.values(APP_REGISTRY).map(app => {
                const Icon = (Icons as any)[app.icon];
                const isPinned = pinnedApps.includes(app.id);
                return (
                  <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', border: '1px solid var(--window-border)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--window-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} color="var(--accent-color)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: '600' }}>{app.name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>System Application</p>
                    </div>
                    <button onClick={() => togglePin(app.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--window-border)', background: isPinned ? 'transparent' : 'var(--accent-color)', color: isPinned ? 'var(--text-color)' : '#fff', fontSize: '12px', cursor: 'pointer' }}>
                      {isPinned ? 'Unpin' : 'Pin to Taskbar'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>Accounts</h3>
            
            <section style={{ marginBottom: '40px' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '15px' }}>User Profile</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '25px', background: 'rgba(0,0,0,0.03)', borderRadius: '16px', border: '1px solid var(--window-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icons.User size={32} color="white" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '18px', fontWeight: 'bold' }}>{user?.username}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>System Administrator</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>Username</label>
                    <input 
                      type="text" 
                      value={newUsername}
                      onInput={(e) => setNewUsername((e.target as HTMLInputElement).value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--window-border)', background: 'var(--surface-color)', color: 'var(--text-color)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>New Password (leave blank to keep current)</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={newPassword}
                      onInput={(e) => setNewPassword((e.target as HTMLInputElement).value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--window-border)', background: 'var(--surface-color)', color: 'var(--text-color)' }}
                    />
                  </div>
                  <button 
                    onClick={() => {
                      updateUser(newUsername, newPassword || undefined);
                      setNewPassword('');
                      notify('Account', 'Settings updated successfully', 'success');
                    }}
                    style={{ padding: '12px', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </section>

            <section>
              <button 
                onClick={() => logout()}
                style={{ width: '100%', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                <Icons.LogOut size={16} />
                Sign Out
              </button>
            </section>
          </div>
        )}

        {activeTab === 'input' && (
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>Input</h3>
            <section style={{ marginBottom: '40px' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Keyboard Layout</p>
              <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--window-border)', background: 'var(--surface-color)', color: 'var(--text-color)', fontSize: '13px' }}>
                <option>English (United States)</option>
                <option>English (United Kingdom)</option>
                <option>French (AZERTY)</option>
                <option>German (QWERTZ)</option>
              </select>
            </section>
            <section>
              <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Pointer Speed</p>
              <input type="range" style={{ width: '100%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'network' && (
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>Network</h3>
            <div style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid var(--accent-color)', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
              <Icons.Wifi size={32} color="var(--accent-color)" />
              <div>
                <p style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--accent-color)' }}>Connected to VirtuOS_Internal</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>IPv4: 192.168.1.104 • Signal: Excellent</p>
              </div>
            </div>
            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '15px' }}>Available Networks</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Starlink_882', 'Guest_WiFi', 'Neighbor_Network'].map(net => (
                <div key={net} style={{ padding: '12px 15px', background: 'rgba(0,0,0,0.05)', border: '1px solid var(--window-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>{net}</span>
                  <Icons.Lock size={14} color="var(--text-secondary)" />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div style={{ textAlign: 'center', paddingTop: '40px' }}>
            <div style={{ width: '80px', height: '80px', background: 'var(--accent-color)', borderRadius: '20px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Cpu size={48} color="#fff" />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>VirtuOS</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '30px' }}>Version 1.0.0-ALPHA (Build 2026.05.10)</p>
            <div style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '12px', border: '1px solid var(--window-border)', padding: '20px', textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>VirtuOS is an experimental web-based operating system built with Preact and Zustand. It features a robust microkernel and a virtual file system persisted via IndexedDB.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
