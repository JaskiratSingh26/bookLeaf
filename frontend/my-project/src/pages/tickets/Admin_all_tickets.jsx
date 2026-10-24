import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import BASE from '../../api';

const statusColor = (s) => ({
  open:        'bg-red-100 text-red-600',
  in_progress: 'bg-yellow-100 text-yellow-600',
  resolved:    'bg-green-100 text-green-600',
  closed:      'bg-gray-100 text-gray-500',
}[s] || 'bg-gray-100 text-gray-500');

const priorityColor = (p) => ({
  critical: 'text-red-500',
  high:     'text-orange-500',
  medium:   'text-yellow-500',
  low:      'text-gray-400',
}[p] || 'text-gray-400');

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const STATUS_ORDER   = { open: 0, in_progress: 1, resolved: 2, closed: 3 };

const CATEGORIES = [
  { label: 'Royalty & Payments',              value: 'royalty' },
  { label: 'ISBN & Metadata Issues',           value: 'isbn' },
  { label: 'Printing & Quality',               value: 'printing' },
  { label: 'Distribution & Availability',      value: 'distribution' },
  { label: 'Book Status & Production Updates', value: 'production' },
  { label: 'General Inquiry',                  value: 'general' },
];

const PRIORITIES = ['critical', 'high', 'medium', 'low'];

export default function Admin_all_tickets() {
  const [tickets, setTickets]       = useState([]);
  const [sortBy, setSortBy]         = useState('date');
  const [filterStatus, setFilterStatus]     = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [selected, setSelected]     = useState(null);
  const [messages, setMessages]     = useState([]);
  const [reply, setReply]           = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending]       = useState(false);
  const [editCat, setEditCat]       = useState(false);
  const [editPri, setEditPri]       = useState(false);
  const [category, setCategory]     = useState('');
  const [priority, setPriority]     = useState('');
  const [savingCat, setSavingCat]   = useState(false);
  const [savingPri, setSavingPri]   = useState(false);
  const [editSt, setEditSt]         = useState(false);
  const [status, setStatus]         = useState('');
  const [savingSt, setSavingSt]     = useState(false);
  const [draft, setDraft]           = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState('');
  const bottomRef                   = useRef(null);
  const token   = localStorage.getItem('token');
  const myAuthorId = JSON.parse(localStorage.getItem('user') || '{}').author_id;

  const fetchTickets = () => {
    fetch(`${BASE}/api/tickets/ALL_tickets`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setTickets(d.tickets || []));
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000); // list polling
    return () => clearInterval(interval);
  }, []);

  const filtered = tickets
    .filter(t => !filterStatus   || t.status   === filterStatus)
    .filter(t => !filterCategory || t.category === filterCategory)
    .filter(t => !filterPriority || t.priority === filterPriority);

  const sorted = [...filtered].sort((a, b) => {
    // closed always last
    const sDiff = (STATUS_ORDER[a.status] ?? 2) - (STATUS_ORDER[b.status] ?? 2);
    if (sDiff !== 0) return sDiff;
    if (sortBy === 'priority')
      return (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
    return new Date(b.updated_at) - new Date(a.updated_at);
  });

  const saveStatus = async () => {
    setSavingSt(true);
    const res = await fetch(`${BASE}/api/admin/tickets/${selected.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { setSelected(p => ({ ...p, status })); setEditSt(false); }
    setSavingSt(false);
  };

  const fetchMessages = (ticketId) => {
    fetch(`${BASE}/api/tickets/get_conversation/${ticketId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        setMessages(d.messages || []);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });
  };

  // polling — har 5s mein messages fetch karo jab modal open ho
  useEffect(() => {
    if (!selected) return;
    const interval = setInterval(() => fetchMessages(selected.id), 5000);
    return () => clearInterval(interval); // modal band ho toh stop
  }, [selected?.id]);

  const fetchDraft = async (ticketId, force = false) => {
    setDraftLoading(true);
    setDraftError('');
    try {
      const res = await fetch(
        `${BASE}/api/admin/tickets/${ticketId}/draft`,
        {
          method: force ? 'POST' : 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setDraft(data.draft || '');
      if (data.error) setDraftError(data.error);
    } catch {
      setDraftError('AI unavailable — type manually');
      setDraft('');
    } finally {
      setDraftLoading(false);
    }
  };

  const assignTicket = async (ticketId) => {
    const res = await fetch(`${BASE}/api/admin/tickets/${ticketId}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      setTickets(prev => prev.map(t =>
        t.id === ticketId ? { ...t, assigned_to: data.assigned_to } : t
      ));
    }
  };

  const openTicket = (ticket) => {
    // auto-assign on open
    if (!ticket.assigned_to || ticket.assigned_to === myAuthorId) {
      assignTicket(ticket.id);
    }
    setSelected(ticket);
    setCategory(ticket.category);
    setPriority(ticket.priority);
    setStatus(ticket.status);
    setEditCat(false);
    setEditPri(false);
    setEditSt(false);
    setMessages([]);
    setReply('');
    setDraft('');
    setDraftError('');
    fetchMessages(ticket.id);
    fetchDraft(ticket.id);
  };

const saveCategory = async () => {
    setSavingCat(true);
    const res = await fetch(`${BASE}/api/admin/tickets/${selected.id}/category`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ category }),
    });
    if (res.ok) { setSelected(p => ({ ...p, category })); setEditCat(false); }
    setSavingCat(false);
  };

  const savePriority = async () => {
    setSavingPri(true);
    const res = await fetch(`${BASE}/api/admin/tickets/${selected.id}/priority`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ priority }),
    });
    if (res.ok) { setSelected(p => ({ ...p, priority })); setEditPri(false); }
    setSavingPri(false);
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    const res = await fetch(`${BASE}/api/admin/tickets/${selected.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ body: reply, is_internal: isInternal }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessages(prev => [...prev, data.message]);
      setReply('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
    setSending(false);
  };

  const EditRow = ({ show, value, onChange, options, onSave, onCancel, saving, display }) =>
    show ? (
      <div className="flex items-center gap-2 mt-1">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {options.map(o => (
            <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
          ))}
        </select>
        <button onClick={onSave} disabled={saving}
          className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-lg disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
      </div>
    ) : (
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{display}</span>
        <button onClick={() => show === false && null} className="text-xs text-gray-400 hover:text-indigo-500">Edit</button>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
        <Link to="/admin/home" className="text-xl font-bold text-indigo-600">BookLeaf Admin</Link>
        <span className="text-sm text-gray-400">All Tickets ({tickets.length})</span>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Ticket Queue
            <span className="text-gray-400 font-normal text-base ml-2">({filtered.length})</span>
          </h1>
          <div className="flex gap-2 text-xs">
            <button onClick={() => setSortBy('date')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${sortBy === 'date' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 shadow'}`}>
              Latest First
            </button>
            <button onClick={() => setSortBy('priority')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${sortBy === 'priority' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 shadow'}`}>
              By Priority
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {(filterStatus || filterCategory || filterPriority) && (
            <button onClick={() => { setFilterStatus(''); setFilterCategory(''); setFilterPriority(''); }}
              className="text-xs text-red-400 hover:text-red-600">
              ✕ Clear filters
            </button>
          )}
        </div>

        {filtered.length === 0 && <p className="text-gray-400 text-sm">No tickets match filters.</p>}

        <div className="space-y-4">
          {sorted.map(t => (
            <div key={t.id} className="bg-white rounded-2xl p-5 shadow"
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs text-gray-400 font-mono">#{t.id}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(t.status)}`}>{t.status}</span>
              </div>
              <h2 className="font-semibold text-gray-800 mb-1">{t.subject}</h2>
              <p className="text-xs text-gray-400">
                {t.author_id} · {t.book_id || 'General'} · {t.category} ·{' '}
                <span className={`font-semibold ${priorityColor(t.priority)}`}>{t.priority}</span>
              </p>
              <p className="text-xs text-gray-300 mt-1">{new Date(t.updated_at).toLocaleDateString('en-IN')}</p>
              <div className="flex items-center justify-between mt-3">
                {/* sirf apna ya unassigned ticket khol sakte hain */}
                {!t.assigned_to || t.assigned_to === myAuthorId ? (
                  <button onClick={() => openTicket(t)}
                    className="text-xs text-indigo-600 font-semibold hover:underline">
                    View Conversation →
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">Assigned to other admin</span>
                )}

                {/* Take over — sirf tab dikhe jab kisi aur ne le rakha ho */}
                {t.assigned_to && t.assigned_to !== myAuthorId && (
                  <button onClick={() => assignTicket(t.id)}
                    className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-lg hover:bg-indigo-50 hover:text-indigo-600">
                    Take Over
                  </button>
                )}

                {t.assigned_to === myAuthorId && (
                  <span className="text-xs text-indigo-500 font-medium">✓ Assigned to you</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col" style={{ maxHeight: '85vh' }}>

            {/* Header */}
            <div className="flex justify-between items-start p-5 border-b">
              <div className="flex-1 pr-4">
                <p className="text-xs text-gray-400 font-mono">#{selected.id}</p>
                <h2 className="font-bold text-gray-800">{selected.subject}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{selected.author_id} · {selected.status}</p>

                {/* Category */}
                {editCat ? (
                  <div className="flex items-center gap-2 mt-2">
                    <select value={category} onChange={e => setCategory(e.target.value)}
                      className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <button onClick={saveCategory} disabled={savingCat}
                      className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-lg disabled:opacity-50">
                      {savingCat ? '...' : 'Save'}
                    </button>
                    <button onClick={() => setEditCat(false)} className="text-xs text-gray-400">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                      {CATEGORIES.find(c => c.value === selected.category)?.label || selected.category}
                    </span>
                    <button onClick={() => setEditCat(true)} className="text-xs text-gray-400 hover:text-indigo-500">Edit</button>
                  </div>
                )}

                {/* Status */}
                {editSt ? (
                  <div className="flex items-center gap-2 mt-1">
                    <select value={status} onChange={e => setStatus(e.target.value)}
                      className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="open">open</option>
                      <option value="closed">closed</option>
                    </select>
                    <button onClick={saveStatus} disabled={savingSt}
                      className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-lg disabled:opacity-50">
                      {savingSt ? '...' : 'Save'}
                    </button>
                    <button onClick={() => setEditSt(false)} className="text-xs text-gray-400">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(selected.status)}`}>{selected.status}</span>
                    <button onClick={() => setEditSt(true)} className="text-xs text-gray-400 hover:text-indigo-500">Edit</button>
                  </div>
                )}

                {/* Priority */}
                {editPri ? (
                  <div className="flex items-center gap-2 mt-1">
                    <select value={priority} onChange={e => setPriority(e.target.value)}
                      className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <button onClick={savePriority} disabled={savingPri}
                      className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-lg disabled:opacity-50">
                      {savingPri ? '...' : 'Save'}
                    </button>
                    <button onClick={() => setEditPri(false)} className="text-xs text-gray-400">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-bold uppercase ${priorityColor(selected.priority)}`}>{selected.priority}</span>
                    <button onClick={() => setEditPri(true)} className="text-xs text-gray-400 hover:text-indigo-500">Edit</button>
                  </div>
                )}
              </div>
              <button onClick={() => { setSelected(null); fetchTickets(); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                    m.is_internal ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                    : m.sender_role === 'admin' ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800'}`}>
                    {m.is_internal && <p className="text-xs font-bold mb-1">🔒 Internal Note</p>}
                    <p>{m.body}</p>
                    <p className={`text-xs mt-1 ${m.sender_role === 'admin' && !m.is_internal ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {m.sender_role} · {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* AI Draft + Reply */}
            <div className="p-4 border-t space-y-3">

              {/* Draft section */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-gray-500">
                    {draftLoading ? '🤖 AI is thinking...' : '🤖 AI Draft'}
                  </span>
                  <button onClick={() => fetchDraft(selected.id, true)}
                    disabled={draftLoading}
                    className="text-xs text-indigo-400 hover:text-indigo-600 disabled:opacity-40">
                    ↺ Regenerate
                  </button>
                </div>

                {draftLoading ? (
                  <div className="w-full border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 text-xs text-gray-400 animate-pulse">
                    Generating draft...
                  </div>
                ) : (
                  <textarea rows={3}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder={draftError || 'AI draft will appear here...'}
                    className="w-full border border-indigo-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50/30" />
                )}
                {/* Use draft button */}
                {draft && !draftLoading && (
                  <button onClick={() => setReply(draft)}
                    className="text-xs text-indigo-600 hover:underline mt-1">
                    Use this draft →
                  </button>
                )}
              </div>

              {/* Reply box */}
              <textarea rows={2} value={reply} onChange={e => setReply(e.target.value)}
                placeholder="Edit or type your reply here..."
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />

              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                  <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                  Internal note
                </label>
                <button onClick={sendReply} disabled={sending || !reply.trim()}
                  className="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40">
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
