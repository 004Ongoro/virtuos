import { useKernel } from '../../kernel/useKernel';
import { APP_REGISTRY } from '../registry';
import * as Icons from 'lucide-preact';

export default function TaskManager() {
  const { processes, windows, closeWindow } = useKernel();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface-color)', color: 'var(--text-color)', backdropFilter: 'blur(10px)' }}>
      <div style={{ padding: '20px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--window-border)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icons.Activity size={20} color="#ef4444" />
          Task Manager
        </h2>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: 'rgba(0,0,0,0.05)' }}>
              <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--window-border)' }}>Process</th>
              <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--window-border)' }}>PID</th>
              <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--window-border)' }}>Status</th>
              <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--window-border)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {processes.map(proc => {
              const app = APP_REGISTRY[proc.appId];
              const win = windows.find(w => w.id === proc.windowId);
              const Icon = app ? (Icons as any)[app.icon] : Icons.AppWindow;

              return (
                <tr key={proc.pid} style={{ borderBottom: '1px solid var(--window-border)' }}>
                  <td style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={16} color="var(--text-secondary)" />
                    <span style={{ fontWeight: '500' }}>{app?.name || proc.appId}</span>
                  </td>
                  <td style={{ padding: '10px 20px', color: 'var(--text-secondary)' }}>{proc.pid}</td>
                  <td style={{ padding: '10px 20px' }}>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '10px', 
                      background: win?.isMinimized ? '#fef3c7' : '#dcfce7', 
                      color: win?.isMinimized ? '#92400e' : '#166534',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      {win?.isMinimized ? 'Suspended' : 'Running'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 20px', textAlign: 'right' }}>
                    <button 
                      onClick={() => closeWindow(proc.windowId)}
                      style={{ 
                        padding: '6px 12px', 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        color: '#ef4444', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      End Task
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {processes.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No active processes found.
          </div>
        )}
      </div>

      <div style={{ padding: '15px 20px', background: 'rgba(0,0,0,0.02)', borderTop: '1px solid var(--window-border)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <span>Processes: {processes.length}</span>
        <span>Memory: Browser-managed</span>
      </div>
    </div>
  );
}
