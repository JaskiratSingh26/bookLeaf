import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import BASE from '../../api';

const statusColor = (s) => ({
  open:        'bg-red-100 text-red-600',
  in_progress: 'bg-yellow-100 text-yellow-600',
  resolved:    'bg-green-100 text-green-600',
  closed:      'bg-gray-100 text-gray-500',
}[s] || 'bg-gray-100 text-gray-500');

const Dots = () => (
  <span className="inline-flex gap-1">
    {[0,1,2].map(i => (
      <span key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }} />
    ))}
  </span>
);

export default function MyTickets() {
  const [tickets, setTickets]     = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [selected, setSelected]   = useState(null);
  const [messages, setMessages]   = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [reply, setReply]         = useState('');
  const [sending, setSending]     = useState(false);
  const bottomRef                 = useRef(null);
  const token = localStorage.getItem('token');

  const fetchTickets = () => {
    fetch(`${BASE}/api/tickets/my_tickets`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setTickets(d.tickets || []); setListLoading(false); });
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = (ticketId, showLoader = false) => {
    if (showLoader) setMsgLoading(true);
    fetch(`${BASE}/api/tickets/get_conversation/${ticketId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        setMessages(d.messages || []);
        setMsgLoading(false);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });
  };

  useEffect(() => {
    if (!selected) return;
    const interval = setInterval(() => fetchMessages(selected.id), 5000);
    return () => clearInterval(interval);
  }, [selected?.id]);

  const openTicket = (ticket) => {
    setSelected(ticket);
    setMessages([]);
    setReply('');
    fetchMessages(ticket.id, true); // showLoader = true
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    const res = await fetch(`${BASE}/api/tickets/${selected.id}/author_messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ body: reply }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessages(prev => [...prev, data.message]);
      setReply('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
        <Link to="/home" className="text-xl font-bold text-indigo-600">BookLeaf</Link>
        <Link to="/tickets/raise" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          + New Ticket
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Tickets</h1>

        {/* List loading */}
        {listLoading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Dots /> Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No tickets yet. <Link to="/tickets/raise" className="text-indigo-500 hover:underline">Raise one →</Link>
          </p>
        ) : (
          <div className="space-y-4">
            {tickets.map(t => (
              <div key={t.id} className="bg-white rounded-2xl p-5 shadow"
                style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs text-gray-400 font-mono">#{t.id}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(t.status)}`}>
                    {t.status}
                  </span>
                </div>
                <h2 className="font-semibold text-gray-800 mb-1">{t.subject}</h2>
                <p className="text-xs text-gray-400">{t.book_id || 'General'} · {t.category} · {t.priority}</p>
                <p className="text-xs text-gray-300 mt-1">{new Date(t.created_at).toLocaleDateString('en-IN')}</p>
                <button onClick={() => openTicket(t)}
                  className="mt-3 text-xs text-indigo-600 font-semibold hover:underline">
                  View Conversation →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col"
            style={{ maxHeight: '85vh' }}>

            <div className="flex justify-between items-start p-5 border-b">
              <div>
                <p className="text-xs text-gray-400 font-mono">#{selected.id}</p>
                <h2 className="font-bold text-gray-800">{selected.subject}</h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(selected.status)}`}>
                  {selected.status}
                </span>
              </div>
              <button onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {msgLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-gray-400 text-sm">
                  <Dots /> Loading messages...
                </div>
              ) : (
                messages.filter(m => !m.is_internal).map(m => (
                  <div key={m.id}
                    className={`flex ${m.sender_role === 'author' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                      m.sender_role === 'author' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p>{m.body}</p>
                      <p className={`text-xs mt-1 ${m.sender_role === 'author' ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {m.sender_role} · {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t">
              <textarea rows={2} value={reply} onChange={e => setReply(e.target.value)}
                placeholder="Type your reply..."
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2" />
              <div className="flex justify-end">
                <button onClick={sendReply} disabled={sending || !reply.trim()}
                  className="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40">
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
