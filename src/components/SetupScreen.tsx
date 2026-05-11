import { useState } from 'preact/hooks';
import { useKernel } from '../kernel/useKernel';
import * as Icons from 'lucide-preact';

export function SetupScreen() {
  const { setupUser, wallpaper } = useKernel();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');

  const handleSetup = (e: Event) => {
    e.preventDefault();
    if (!username.trim()) return setError('Please enter a username');
    if (password.length < 4) return setError('Password must be at least 4 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');

    setupUser(username, password);
  };

  const desktopStyle = {
    background: wallpaper.startsWith('linear-gradient') || wallpaper.startsWith('#') || wallpaper.startsWith('rgba')
      ? wallpaper 
      : `url("${wallpaper}") center / cover no-repeat`
  };

  return (
    <div className="setup-screen" style={desktopStyle}>
      <div className="setup-card">
        <div className="setup-header">
          <img src="/logo.png" alt="VirtuOS" className="setup-logo" />
          <h1>Welcome to VirtuOS</h1>
          <p>Let's set up your new personal workspace.</p>
        </div>

        <form onSubmit={handleSetup} className="setup-form">
          <div className="form-group">
            <label>Username</label>
            <div className="input-wrapper">
              <Icons.User size={18} />
              <input 
                type="text" 
                placeholder="Enter username"
                value={username}
                onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Icons.Lock size={18} />
              <input 
                type="password" 
                placeholder="Set password"
                value={password}
                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className="input-wrapper">
              <Icons.ShieldCheck size={18} />
              <input 
                type="password" 
                placeholder="Repeat password"
                value={confirmPassword}
                onInput={(e) => setPasswordConfirm((e.target as HTMLInputElement).value)}
              />
            </div>
          </div>

          {error && <div className="setup-error">{error}</div>}

          <button type="submit" className="setup-btn">
            Get Started
            <Icons.ArrowRight size={18} />
          </button>
        </form>

        <div className="setup-footer">
          <p>VirtuOS v1.0.0 • Alpha Release</p>
        </div>
      </div>
    </div>
  );
}
