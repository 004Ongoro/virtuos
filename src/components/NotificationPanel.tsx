import { useKernel } from '../kernel/useKernel';
import * as Icons from 'lucide-preact';

export function NotificationPanel() {
  const { notificationHistory, isNotificationPanelOpen, toggleNotificationPanel } = useKernel();

  if (!isNotificationPanelOpen) return null;

  return (
    <div className="notification-panel">
      <div className="notification-panel-header">
        <h3>Notifications</h3>
        <button onClick={toggleNotificationPanel} className="close-panel-btn">
          <Icons.X size={18} />
        </button>
      </div>

      <div className="notification-panel-content">
        {notificationHistory.length === 0 ? (
          <div className="no-notifications">
            <Icons.BellOff size={40} />
            <p>No new notifications</p>
          </div>
        ) : (
          notificationHistory.map((n) => (
            <div key={n.id} className={`panel-notification-item ${n.type}`}>
              <div className="notification-item-icon">
                {n.type === 'error' ? <Icons.XCircle size={16} /> : 
                 n.type === 'success' ? <Icons.CheckCircle size={16} /> : 
                 <Icons.Info size={16} />}
              </div>
              <div className="notification-item-text">
                <div className="notification-item-title">{n.title}</div>
                <div className="notification-item-message">{n.message}</div>
                <div className="notification-item-time">
                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
