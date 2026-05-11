import { useState } from 'preact/hooks';
import { useKernel } from '../kernel/useKernel';
import * as Icons from 'lucide-preact';

export function LoginScreen() {
  const { user, login, wallpaper } = useKernel();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: Event) => {
    e.preventDefault();
    const success = login(password);
    if (!success) {
      setError(true);
      setPassword('');
    }
  };

  const desktopStyle = {
    background: wallpaper.startsWith('linear-gradient') || wallpaper.startsWith('#') || wallpaper.startsWith('rgba')
      ? wallpaper 
      : `url("${wallpaper}") center / cover no-repeat`
  };

  return (
    <div className="login-screen" style={desktopStyle}>
      {/* Background Blur Overlay */}
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        backdropFilter: 'blur(10px)', 
        background: 'rgba(0,0,0,0.3)',
        zIndex: 0
      }} />

      <div className="login-card" style={{ position: 'relative', zIndex: 1 }}>
        <div className="login-avatar">
          <div className="avatar-placeholder">
            <Icons.User size={48} color="white" />
          </div>
        </div>
        
        <h2 className="login-username">{user?.username || 'Guest'}</h2>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className={`login-input-group ${error ? 'error' : ''}`}>
            <input 
              type="password" 
              placeholder="Enter Password"
              value={password}
              onInput={(e) => {
                setPassword((e.target as HTMLInputElement).value);
                setError(false);
              }}
              autoFocus
            />
            <button type="submit" className="login-submit-btn">
              <Icons.ArrowRight size={18} />
            </button>
          </div>
          {error && <p className="login-error-msg">Incorrect password. Please try again.</p>}
        </form>

        <div className="login-actions">
          <button className="login-action-btn">
            <Icons.Power size={14} />
            Power
          </button>
          <button className="login-action-btn">
            <Icons.Wifi size={14} />
            Network
          </button>
          <button className="login-action-btn">
            <Icons.Accessibility size={14} />
            Accessibility
          </button>
        </div>
      </div>
      
      <div className="login-footer">
        <div className="login-time">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="login-date">
          {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>
    </div>
  );
}
