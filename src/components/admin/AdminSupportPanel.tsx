/**
 * src/components/admin/AdminSupportPanel.tsx
 * Admin panel for managing AI support tickets and chat sessions
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  apiAdminGetSupportTickets,
  apiAdminUpdateSupportTicket,
  apiAdminGetChatSessions,
} from '../../services/aiService';

type FilterStatus = 'all' | 'open' | 'in_progress' | 'resolved' | 'escalated' | 'closed';
type SubView = 'tickets' | 'sessions';

const STATUS_COLORS: Record<string, string> = {
  open:        '#facc15',
  in_progress: '#60a5fa',
  resolved:    '#4ade80',
  escalated:   '#f87171',
  closed:      '#9ca3af',
};

const PRIORITY_COLORS: Record<string, string> = {
  low:    '#6b7280',
  medium: '#60a5fa',
  high:   '#fb923c',
  urgent: '#f87171',
};

const SENTIMENT_ICONS: Record<string, string> = {
  positive: '😊',
  neutral:  '😐',
  negative: '😞',
  angry:    '😡',
};

const ISSUE_LABELS: Record<string, string> = {
  booking_help:    '🎟️ Booking',
  cancel_ticket:   '❌ Cancel',
  refund:          '💰 Refund',
  payment_failed:  '💳 Payment',
  razorpay_issue:  '🔧 Razorpay',
  login_signup:    '🔐 Login',
  account_issue:   '👤 Account',
  coupon_offer:    '🎁 Coupon',
  bug_report:      '🐛 Bug',
  speak_to_human:  '🤝 Human',
  other:           '💬 Other',
  feature_request: '💡 Feature',
  movie_info:      '🎬 Movie',
  theatre_info:    '🏟️ Theatre',
  ticket_download: '📥 Download',
};

const AdminSupportPanel: React.FC = () => {
  const [subView, setSubView] = useState<SubView>('tickets');
  const [tickets, setTickets] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({});
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');

  // ── Data loaders ───────────────────────────────────────────────────────────
  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (search) params.search = search;

      const res = await apiAdminGetSupportTickets(params);
      if (res.success) {
        setTickets(res.tickets || []);
        setStats(res.stats || {});
        setPagination(res.pagination || {});
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, priorityFilter, search]);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiAdminGetChatSessions({ page, limit: 15 });
      if (res.success) {
        setSessions(res.sessions || []);
        setPagination(res.pagination || {});
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (subView === 'tickets') loadTickets();
    else loadSessions();
  }, [subView, loadTickets, loadSessions]);

  // ── Update ticket ──────────────────────────────────────────────────────────
  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    setUpdating(true);
    try {
      const update: any = {};
      if (updateStatus) update.status = updateStatus;
      if (replyText.trim()) update.adminReply = replyText.trim();

      const res = await apiAdminUpdateSupportTicket(selectedTicket._id, update);
      if (res.success) {
        setUpdateSuccess('Updated successfully!');
        setSelectedTicket(res.ticket);
        loadTickets();
        setTimeout(() => setUpdateSuccess(''), 2500);
      }
    } finally {
      setUpdating(false);
    }
  };

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headerRow = ['Name', 'Email', 'Issue Type', 'Priority', 'Status', 'Sentiment', 'Message', 'Created At'];
    const rows = tickets.map((t) => {
      const safeMsg = String(t.message || '').replace(/"/g, "'");
      const dateStr = new Date(t.createdAt).toLocaleDateString();
      return [t.name, t.email, t.issueType, t.priority, t.status, t.sentiment, '"' + safeMsg + '"', dateStr];
    });
    const csv = [headerRow, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateLabel = new Date().toISOString().split('T')[0];
    a.download = 'support-tickets-' + dateLabel + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Shared style ───────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(99,102,241,0.12)',
    borderRadius: 14,
    padding: '16px',
    fontFamily: "'Outfit', sans-serif",
  };

  const noTicketsMsg = statusFilter !== 'all'
    ? 'No tickets found with status: ' + statusFilter
    : 'No tickets found';

  return (
    <div style={{ padding: '16px 0', fontFamily: "'Outfit', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, color: 'white', fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            🤖 AI Support Center
          </h2>
          <p style={{ margin: '4px 0 0', color: 'rgba(200,180,255,0.55)', fontSize: 13 }}>
            Manage support tickets &amp; AI chat sessions
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={exportCSV}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid rgba(99,102,241,0.3)',
              background: 'rgba(99,102,241,0.1)',
              color: '#c084fc',
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            📥 Export CSV
          </button>
          <button
            onClick={subView === 'tickets' ? loadTickets : loadSessions}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid rgba(99,102,241,0.2)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(200,190,255,0.7)',
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13,
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 20 }}>
        {[
          { key: 'open',        label: 'Open',        color: '#facc15' },
          { key: 'in_progress', label: 'In Progress',  color: '#60a5fa' },
          { key: 'escalated',   label: 'Escalated',    color: '#f87171' },
          { key: 'resolved',    label: 'Resolved',     color: '#4ade80' },
          { key: 'closed',      label: 'Closed',       color: '#9ca3af' },
        ].map((s) => (
          <div
            key={s.key}
            onClick={() => setStatusFilter(s.key as FilterStatus)}
            style={{
              ...card,
              cursor: 'pointer',
              textAlign: 'center',
              borderColor: statusFilter === s.key ? s.color + '60' : 'rgba(99,102,241,0.12)',
              background:  statusFilter === s.key ? s.color + '12' : 'rgba(255,255,255,0.03)',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>
              {stats[s.key] || 0}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(200,190,255,0.55)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Sub-view switch ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {(['tickets', 'sessions'] as SubView[]).map((v) => (
          <button
            key={v}
            onClick={() => { setSubView(v); setPage(1); setSelectedTicket(null); }}
            style={{
              padding: '8px 20px',
              borderRadius: 10,
              border: '1px solid',
              borderColor: subView === v ? 'rgba(168,85,247,0.5)' : 'rgba(99,102,241,0.15)',
              background:  subView === v ? 'rgba(168,85,247,0.15)' : 'transparent',
              color:       subView === v ? '#c084fc' : 'rgba(200,180,255,0.5)',
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              transition: 'all 0.2s',
            }}
          >
            {v === 'tickets' ? '🎫 Support Tickets' : '💬 Chat Sessions'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 380px' : '1fr', gap: 16 }}>

        {/* ── Left: list area ── */}
        <div>
          {/* Filters (tickets only) */}
          {subView === 'tickets' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="🔍 Search name, email, message..."
                style={{
                  flex: 1,
                  minWidth: 180,
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(99,102,241,0.2)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(230,220,255,0.85)',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(99,102,241,0.2)',
                  background: '#120c28',
                  color: 'rgba(200,185,255,0.8)',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="">All Priorities</option>
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🔵 Medium</option>
                <option value="low">⚫ Low</option>
              </select>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(200,180,255,0.4)', fontSize: 13 }}>
              ⏳ Loading...
            </div>
          ) : subView === 'tickets' ? (
            tickets.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: '32px', color: 'rgba(200,180,255,0.4)' }}>
                {noTicketsMsg}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tickets.map((ticket) => {
                  const statusColor  = STATUS_COLORS[ticket.status]   || '#9ca3af';
                  const priorityColor = PRIORITY_COLORS[ticket.priority] || '#6b7280';
                  const isSelected   = selectedTicket?._id === ticket._id;
                  const preview      = String(ticket.message || '').substring(0, 70);
                  const hasMore      = String(ticket.message || '').length > 70;
                  return (
                    <div
                      key={ticket._id}
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setUpdateStatus(ticket.status);
                        setReplyText(ticket.adminReply || '');
                      }}
                      style={{
                        ...card,
                        cursor: 'pointer',
                        borderColor: isSelected ? 'rgba(168,85,247,0.4)' : 'rgba(99,102,241,0.12)',
                        background:  isSelected ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.03)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected)
                          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(168,85,247,0.25)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected)
                          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.12)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: 'rgba(230,220,255,0.9)', fontSize: 14 }}>{ticket.name}</span>
                            <span style={{ fontSize: 11, color: 'rgba(180,160,255,0.5)' }}>{ticket.email}</span>
                            <span style={{ fontSize: 11 }}>{SENTIMENT_ICONS[ticket.sentiment] || '😐'}</span>
                          </div>
                          <div style={{ color: 'rgba(200,185,255,0.6)', fontSize: 12, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ISSUE_LABELS[ticket.issueType] || ticket.issueType} — {preview}{hasMore ? '...' : ''}
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(160,140,220,0.4)', marginTop: 4 }}>
                            {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: 20,
                            background: statusColor + '20',
                            border: '1px solid ' + statusColor + '40',
                            color: statusColor,
                            fontSize: 11,
                            fontWeight: 600,
                          }}>
                            {String(ticket.status).replace('_', ' ')}
                          </span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 20,
                            background: priorityColor + '18',
                            color: priorityColor,
                            fontSize: 10,
                            fontWeight: 600,
                          }}>
                            {ticket.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Chat sessions */
            sessions.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: '32px', color: 'rgba(200,180,255,0.4)' }}>
                No chat sessions found
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sessions.map((session) => (
                  <div
                    key={session._id}
                    style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'rgba(220,210,255,0.85)', fontSize: 13 }}>
                        {session.userId?.name || 'Guest'}{' '}
                        <span style={{ fontSize: 11, color: 'rgba(160,140,220,0.5)', fontWeight: 400 }}>
                          {session.userId?.email || ''}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(160,140,220,0.5)', marginTop: 3 }}>
                        {session.messageCount} messages
                        {' · '}
                        {String(session.language || 'en').toUpperCase()}
                        {' · '}
                        {new Date(session.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 20 }}>{SENTIMENT_ICONS[session.overallSentiment] || '😐'}</span>
                      {session.escalatedToHuman && (
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 20,
                          background: 'rgba(239,68,68,0.12)',
                          border: '1px solid rgba(239,68,68,0.3)',
                          color: '#f87171',
                          fontSize: 11,
                          fontWeight: 600,
                        }}>
                          🆘 Escalated
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  padding: '6px 14px', borderRadius: 8,
                  border: '1px solid rgba(99,102,241,0.2)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(200,180,255,0.6)',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                ← Prev
              </button>
              <span style={{ color: 'rgba(200,180,255,0.5)', fontSize: 13 }}>
                {page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                style={{
                  padding: '6px 14px', borderRadius: 8,
                  border: '1px solid rgba(99,102,241,0.2)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(200,180,255,0.6)',
                  cursor: page >= pagination.pages ? 'not-allowed' : 'pointer',
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* ── Right: Ticket detail panel ── */}
        {selectedTicket && (
          <div style={{ ...card, height: 'fit-content', position: 'sticky', top: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: 15, fontWeight: 700 }}>Ticket Details</h3>
              <button
                onClick={() => setSelectedTicket(null)}
                style={{ background: 'none', border: 'none', color: 'rgba(200,180,255,0.5)', cursor: 'pointer', fontSize: 18 }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* From */}
              <div style={{ fontSize: 13 }}>
                <span style={{ color: 'rgba(180,160,240,0.55)', fontWeight: 600 }}>From: </span>
                <span style={{ color: 'rgba(230,220,255,0.85)' }}>{selectedTicket.name}</span>
                <span style={{ color: 'rgba(160,140,220,0.5)', marginLeft: 6, fontSize: 12 }}>{selectedTicket.email}</span>
              </div>

              {/* Issue type */}
              <div style={{ fontSize: 13, color: 'rgba(180,160,240,0.55)' }}>
                <span style={{ fontWeight: 600 }}>Issue: </span>
                <span style={{ color: 'rgba(220,210,255,0.8)' }}>
                  {ISSUE_LABELS[selectedTicket.issueType] || selectedTicket.issueType}
                </span>
              </div>

              {/* Message */}
              <div style={{
                padding: '12px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 10,
                border: '1px solid rgba(99,102,241,0.1)',
                color: 'rgba(220,215,255,0.8)',
                fontSize: 13,
                lineHeight: 1.6,
              }}>
                {selectedTicket.message}
              </div>

              {/* Existing admin reply */}
              {selectedTicket.adminReply && (
                <div style={{
                  padding: '10px 12px',
                  background: 'rgba(34,197,94,0.07)',
                  border: '1px solid rgba(34,197,94,0.15)',
                  borderRadius: 10,
                  fontSize: 12.5,
                }}>
                  <div style={{ color: '#86efac', fontWeight: 600, marginBottom: 4 }}>✅ Admin Reply:</div>
                  <div style={{ color: 'rgba(190,255,190,0.75)' }}>{selectedTicket.adminReply}</div>
                </div>
              )}

              {/* Status selector */}
              <div>
                <label style={{ fontSize: 12, color: 'rgba(180,160,255,0.6)', fontWeight: 600, display: 'block', marginBottom: 5 }}>
                  Update Status
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: '1px solid rgba(99,102,241,0.2)', background: '#120c28',
                    color: 'rgba(220,210,255,0.85)', fontFamily: "'Outfit', sans-serif",
                    fontSize: 13, outline: 'none',
                  }}
                >
                  <option value="open">🟡 Open</option>
                  <option value="in_progress">🔵 In Progress</option>
                  <option value="resolved">🟢 Resolved</option>
                  <option value="escalated">🔴 Escalated</option>
                  <option value="closed">⚫ Closed</option>
                </select>
              </div>

              {/* Reply textarea */}
              <div>
                <label style={{ fontSize: 12, color: 'rgba(180,160,255,0.6)', fontWeight: 600, display: 'block', marginBottom: 5 }}>
                  Admin Reply
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  placeholder="Write a reply to the user..."
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: '1px solid rgba(99,102,241,0.2)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(220,210,255,0.85)',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13, outline: 'none', resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Success feedback */}
              {updateSuccess && (
                <div style={{
                  padding: '8px 12px',
                  background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.25)',
                  borderRadius: 8, color: '#86efac', fontSize: 12, textAlign: 'center',
                }}>
                  {updateSuccess}
                </div>
              )}

              {/* Save button */}
              <button
                onClick={handleUpdateTicket}
                disabled={updating}
                style={{
                  padding: '10px', borderRadius: 10, border: 'none',
                  background: updating ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: 'white', fontWeight: 700, fontSize: 13,
                  fontFamily: "'Outfit', sans-serif",
                  cursor: updating ? 'not-allowed' : 'pointer',
                  boxShadow: updating ? 'none' : '0 4px 14px rgba(99,102,241,0.4)',
                }}
              >
                {updating ? '⏳ Updating...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupportPanel;
