import { useKernel } from '../../kernel/useKernel';
import * as Icons from 'lucide-preact';

export default function Notifications() {
  const { notificationHistory } = useKernel();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f1f5f9' }}>
      <div style={{ padding: '20px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Notification History</h2>
        <span style={{ fontSize: '12px', color: '#64748b' }}>{notificationHistory.length} total</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {notificationHistory.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '100px', color: '#94a3b8' }}>
            <Icons.BellOff size={48} style={{ margin: '0 auto 20px', opacity: 0.3 }} />
            <p>No notifications yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notificationHistory.map(n => (
              <div key={n.id} style={{ 
                background: '#fff', 
                padding: '15px', 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0',
                display: 'flex',
                gap: '15px',
                alignItems: 'start'
              }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: n.type === 'error' ? '#fee2e2' : n.type === 'success' ? '#dcfce7' : '#e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {n.type === 'error' ? <Icons.XCircle size={18} color="#ef4444" /> : 
                   n.type === 'success' ? <Icons.CheckCircle size={18} color="#22c55e" /> : 
                   <Icons.Info size={18} color="#3b82f6" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <h4 style={{ fontWeight: 'bold', fontSize: '14px' }}>{n.title}</h4>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569' }}>{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
