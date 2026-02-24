import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import notificationsApi from '../api/notifications';
import '../styles/notifications.css';

const POLL_INTERVAL = 30000; // 30 seconds

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "A l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
  return date.toLocaleDateString('fr-FR');
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsApi.unreadCount();
      setUnreadCount(res.data.unread_count);
    } catch {
      // silently fail
    }
  }, []);

  // Poll unread count
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.list({ per_page: 15 });
      const items = (res.data.data || []).map(d => d.attributes || d);
      setNotifications(items);
      if (res.data.meta?.unread_count !== undefined) {
        setUnreadCount(res.data.meta.unread_count);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const toggleDropdown = () => {
    if (!open) fetchNotifications();
    setOpen(prev => !prev);
  };

  const getNotificationRoute = (notif) => {
    const type = notif.notification_type;
    const id = notif.notifiable_id;
    const nType = notif.notifiable_type;

    if (type === 'agent_request') return '/admin/agent-requests';

    if (nType === 'InvestmentProject' && id) {
      if (user?.role === 'administrateur') return `/admin/projects/${id}`;
      if (user?.role === 'analyste') return `/analyste/projects/${id}`;
      return `/projects/${id}`;
    }

    return null;
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationsApi.markAsRead(notif.id);
        setNotifications(prev =>
          prev.map(n => n.id === notif.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch { /* silent */ }
    }

    const route = getNotificationRoute(notif);
    if (route) {
      setOpen(false);
      navigate(route);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  const handleDelete = async (e, notif) => {
    e.stopPropagation();
    try {
      await notificationsApi.delete(notif.id);
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
      if (!notif.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  };

  const handleDeleteAll = async () => {
    try {
      await notificationsApi.deleteAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button className="notification-bell-btn" onClick={toggleDropdown} title="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h4>Notifications</h4>
            <div className="notification-header-actions">
              {unreadCount > 0 && (
                <button className="notification-mark-all-btn" onClick={handleMarkAllAsRead}>
                  Tout marquer comme lu
                </button>
              )}
              {notifications.length > 0 && (
                <button className="notification-delete-all-btn" onClick={handleDeleteAll} title="Supprimer tout">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Chargement...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <BellOff size={32} />
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`notification-item${!notif.is_read ? ' unread' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                  style={{ cursor: getNotificationRoute(notif) ? 'pointer' : 'default' }}
                >
                  <div className={`notification-dot${notif.is_read ? ' read' : ''}`} />
                  <div className="notification-content">
                    <div className="notification-title">{notif.title}</div>
                    {notif.body && <div className="notification-body">{notif.body}</div>}
                    <div className="notification-time">
                      {notif.actor_name && <span>{notif.actor_name} · </span>}
                      {timeAgo(notif.created_at)}
                    </div>
                  </div>
                  <button
                    className="notification-delete-btn"
                    onClick={(e) => handleDelete(e, notif)}
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
