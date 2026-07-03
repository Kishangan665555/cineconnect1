import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useSocket } from '../../context/SocketContext';
import { apiService } from '../../services/apiService'; // Assume apiGetNotifications exist
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Bell icon for reuse
const BellIcon = ({ hasUnread }: { hasUnread: boolean }) => (
  <div style={{ position: 'relative', display: 'inline-flex' }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
    {hasUnread && (
      <div style={{
        position: 'absolute', top: -2, right: 0,
        width: 10, height: 10, borderRadius: '50%',
        background: 'linear-gradient(135deg,#f43f5e,#e11d48)',
        boxShadow: '0 0 8px rgba(244,63,94,0.6)',
        border: '2px solid rgba(7,2,15,0.97)',
      }} />
    )}
  </div>
);

interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  createdAt: string;
  readStatus?: boolean;
  isRead?: boolean;
  actionLink?: string;
  senderRole?: string;
}

export const NotificationDropdown: React.FC = () => {
  const { currentUser, navigate, showToast } = useApp();
  const { socket } = useSocket();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch initial notifications
  useEffect(() => {
    if (!currentUser) return;
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('cc_token');
        const res = await fetch(`${BASE}/notifications/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    fetchNotifications();
  }, [currentUser]);

  // Socket listener for real-time updates
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleNewNotification = (notification: any) => {
      // Add notification to state
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Optional: show toast for alert types
      if (notification.type === 'alert' || notification.type === 'warning') {
        showToast(notification.title || 'New Notification', notification.type === 'warning' ? 'error' : 'info');
      }
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, currentUser, showToast]);

  const markAsRead = async (id: string, actionLink?: string) => {
    try {
      const token = localStorage.getItem('cc_token');
      await fetch(`${BASE}/notifications/read/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Optimistic update
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, readStatus: true, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      if (actionLink) {
        setOpen(false);
        // Handle custom navigation logic if needed
        if (actionLink.startsWith('/')) {
            // we use internal pages mapping usually, but if actionLink is a path:
            console.log("Navigating to", actionLink);
        }
      }
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('cc_token');
      await fetch(`${BASE}/notifications/read-all`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, readStatus: true, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  if (!currentUser) return null;

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'success': return '#34d399';
      case 'warning': return '#f59e0b';
      case 'alert': return '#ef4444';
      default: return '#60a5fa'; // info
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 38, height: 38, borderRadius: '50%',
          background: open ? 'rgba(168,85,247,0.15)' : 'rgba(99,102,241,0.08)',
          border: `1.5px solid ${open ? 'rgba(168,85,247,0.6)' : 'rgba(168,85,247,0.25)'}`,
          color: open ? '#c084fc' : 'rgba(241,245,249,0.7)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease', backdropFilter: 'blur(10px)',
          boxShadow: open ? '0 0 16px rgba(168,85,247,0.3)' : 'none',
        }}
      >
        <BellIcon hasUnread={unreadCount > 0} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 14px)', right: -10,
          width: 340, maxHeight: 480, borderRadius: 16,
          background: 'rgba(10,2,25,0.95)',
          border: '1px solid rgba(168,85,247,0.25)',
          backdropFilter: 'blur(30px)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(168,85,247,0.1)',
          display: 'flex', flexDirection: 'column',
          zIndex: 9999, overflow: 'hidden',
          animation: 'navDropIn 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid rgba(168,85,247,0.15)',
            background: 'linear-gradient(135deg, rgba(168,85,247,0.05), transparent)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', fontFamily: "'Outfit',sans-serif" }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{
                  padding: '2px 8px', borderRadius: 12, background: 'linear-gradient(135deg,#f43f5e,#e11d48)',
                  fontSize: 11, fontWeight: 800, color: '#fff', boxShadow: '0 0 10px rgba(244,63,94,0.4)'
                }}>
                  {unreadCount} New
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                style={{
                  background: 'none', border: 'none', color: '#c084fc', fontSize: 12, fontWeight: 700, 
                  cursor: 'pointer', transition: 'color 0.2s', padding: 0
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                <BellIcon hasUnread={false} />
                <div style={{ marginTop: 12, fontWeight: 500 }}>No notifications yet</div>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif._id}
                  onClick={() => markAsRead(notif._id, notif.actionLink)}
                  style={{
                    padding: '14px 16px', display: 'flex', gap: 14, cursor: 'pointer',
                    background: (notif.readStatus || notif.isRead) ? 'transparent' : 'rgba(168,85,247,0.05)',
                    borderLeft: `3px solid ${(notif.readStatus || notif.isRead) ? 'transparent' : getTypeColor(notif.type)}`,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(168,85,247,0.1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = (notif.readStatus || notif.isRead) ? 'transparent' : 'rgba(168,85,247,0.05)'; }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: (notif.readStatus || notif.isRead) ? 'transparent' : getTypeColor(notif.type), flexShrink: 0, marginTop: 6 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: (notif.readStatus || notif.isRead) ? 'rgba(241,245,249,0.7)' : '#f1f5f9', marginBottom: 4 }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(241,245,249,0.5)', lineHeight: 1.4 }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(241,245,249,0.3)', marginTop: 8, fontWeight: 500 }}>
                      {new Date(notif.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px', textAlign: 'center', borderTop: '1px solid rgba(168,85,247,0.15)',
            background: 'rgba(10,2,25,0.8)'
          }}>
            <button 
              onClick={() => { setOpen(false); navigate('notifications' as any); }}
              style={{
                width: '100%', padding: '8px', background: 'transparent', border: 'none',
                color: 'rgba(241,245,249,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'color 0.2s'
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#c084fc'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(241,245,249,0.6)'; }}
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
