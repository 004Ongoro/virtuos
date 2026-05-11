import { useEffect } from 'preact/hooks';
import { Desktop } from './components/Desktop';
import { SetupScreen } from './components/SetupScreen';
import { LoginScreen } from './components/LoginScreen';
import { useKernel } from './kernel/useKernel';
import './index.css';

export function App() {
  const { theme, hasSetup, isLoggedIn } = useKernel();

  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  if (!hasSetup) return <SetupScreen />;
  if (!isLoggedIn) return <LoginScreen />;

  return (
    <Desktop />
  );
}
