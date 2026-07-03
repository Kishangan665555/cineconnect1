import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
import { useSocket } from '../context/SocketContext';

interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  createdAt: string;
  readStatus?: boolean;
  isRead?: boolean;
  actionLink?: string;
}

export const Notifications: React.FC = () => {
  const { currentUser, navigate, showToast } = useApp();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [currentUser]);

  useEffect(() => {
    if (!socket || !currentUser) return;
    const handleNewNotification = (notification: any) => {
      setNotifications(prev => [notification, ...prev]);
    };
    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, currentUser]);

  const markAsRead = async (id: string, actionLink?: string) => {
    try {
      const token = localStorage.getItem('cc_token');
      await fetch(`${BASE}/notifications/read/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, readStatus: true, isRead: true } : n));
      if (actionLink) {
        // e.g., if it's an internal route we could use navigate manually, but since they vary, 
        // a simple router switch can be implemented if known (like /owner -> 'theatre-owner')
        if (actionLink.includes('owner')) navigate('theatre-owner');
        else if (actionLink.includes('admin')) navigate('admin');
        else navigate('user-dashboard'); // fallback
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const token = localStorage.getItem('cc_token');
      const res = await fetch(`${BASE}/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => prev.filter(n => n._id !== id));
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        showToast('Notification deleted', 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const bulkMarkAsRead = async () => {
    if (selectedIds.size === 0) {
        // Fallback to mark all as read if none selected
        try {
            const token = localStorage.getItem('cc_token');
            await fetch(`${BASE}/notifications/read-all`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, readStatus: true, isRead: true })));
            showToast('All notifications marked as read', 'success');
        } catch (err) {}
        return;
    }

    try {
      const token = localStorage.getItem('cc_token');
      // Execute each, for real production an array endpoint is better
      await Promise.all(Array.from(selectedIds).map(id =>
        fetch(`${BASE}/notifications/read/${id}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } })
      ));
      setNotifications(prev => prev.map(n => selectedIds.has(n._id) ? { ...n, readStatus: true, isRead: true } : n));
      setSelectedIds(new Set());
      showToast('Selected notifications marked as read', 'success');
    } catch(err) { console.error(err); }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      const token = localStorage.getItem('cc_token');
      await Promise.all(Array.from(selectedIds).map(id =>
        fetch(`${BASE}/notifications/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
      ));
      setNotifications(prev => prev.filter(n => !selectedIds.has(n._id)));
      setSelectedIds(new Set());
      showToast('Selected notifications deleted', 'success');
    } catch(err) { console.error(err); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = notifications.filter(n => {
    const read = n.readStatus || n.isRead;
    if (filter === 'unread' && read) return false;
    if (filter === 'read' && !read) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'success': return '#34d399';
      case 'warning': return '#f59e0b';
      case 'alert': return '#ef4444';
      default: return '#60a5fa'; // info
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 text-white">
        <p>Please log in to view notifications.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '120px 24px 60px', minHeight: '100vh', color: '#f1f5f9' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 36, fontWeight: 900, fontFamily: "'Outfit',sans-serif", background: 'linear-gradient(135deg, #fff, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            Notification Center
          </h1>
          <p style={{ color: 'rgba(241,245,249,0.5)', marginTop: 8, fontSize: 15 }}>
            Stay updated with your bookings, account status, and platform announcements.
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderRadius: 16, background: 'rgba(99,102,241,0.05)',
        border: '1px solid rgba(168,85,247,0.15)', backdropFilter: 'blur(10px)', marginBottom: 24
      }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10 }}>
          {(['all', 'unread', 'read'] as const).map(f => (
            <button
              key={f} onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px', borderRadius: 8, textTransform: 'capitalize',
                background: filter === f ? 'rgba(168,85,247,0.2)' : 'transparent',
                border: filter === f ? '1px solid rgba(168,85,247,0.5)' : '1px solid rgba(168,85,247,0.2)',
                color: filter === f ? '#fff' : 'rgba(241,245,249,0.6)', cursor: 'pointer',
                transition: 'all 0.2s', fontWeight: filter === f ? 700 : 500,
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="text" placeholder="Search notifications..." value={search} onChange={e => setSearch(e.target.value)}
            style={{
              padding: '10px 16px', borderRadius: 8, width: 250,
              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(168,85,247,0.3)',
              color: '#fff', outline: 'none'
            }}
          />
        </div>

        {/* Bulk Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={bulkMarkAsRead}
            style={{
              padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399',
            }}
          >
            Mark {selectedIds.size > 0 ? 'Selected' : 'All'} Read
          </button>
          
          <button onClick={bulkDelete} disabled={selectedIds.size === 0}
            style={{
              padding: '10px 16px', borderRadius: 8, cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', 
              color: '#ef4444', opacity: selectedIds.size > 0 ? 1 : 0.5
            }}
          >
            Delete Selected
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.5)' }}>Loading notifications...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 80, borderRadius: 16,
          background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(168,85,247,0.3)'
        }}>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>No notifications found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(notif => (
            <div key={notif._id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 16,
              padding: '20px', borderRadius: 12,
              background: (notif.readStatus || notif.isRead) ? 'rgba(0,0,0,0.2)' : 'rgba(168,85,247,0.06)',
              border: `1px solid ${(notif.readStatus || notif.isRead) ? 'rgba(168,85,247,0.1)' : 'rgba(168,85,247,0.3)'}`,
              transition: 'transform 0.2s, box-shadow 0.2s',
              borderLeft: `4px solid ${getTypeColor(notif.type)}`,
            }}>
              <input 
                type="checkbox" 
                checked={selectedIds.has(notif._id)}
                onChange={() => toggleSelect(notif._id)}
                style={{ marginTop: 4, width: 18, height: 18, accentColor: '#c084fc', cursor: 'pointer' }}
              />

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: (notif.readStatus || notif.isRead) ? 600 : 800, color: (notif.readStatus || notif.isRead) ? 'rgba(255,255,255,0.8)' : '#fff' }}>
                    {notif.title}
                  </h3>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    {new Date(notif.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                  {notif.message}
                </p>
                {notif.actionLink && (
                  <button onClick={() => markAsRead(notif._id, notif.actionLink)}
                    style={{
                      marginTop: 12, padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                      background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)',
                      color: '#c084fc', fontSize: 12, fontWeight: 700
                    }}>
                    Take Action →
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                {!(notif.readStatus || notif.isRead) && (
                  <button onClick={() => markAsRead(notif._id)} title="Mark as read"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#34d399', fontSize: 18 }}>
                    ✓
                  </button>
                )}
                <button onClick={() => deleteNotification(notif._id)} title="Delete"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 18 }}>
                  🗑
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
