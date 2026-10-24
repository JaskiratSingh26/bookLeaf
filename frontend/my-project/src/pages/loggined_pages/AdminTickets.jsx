import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BASE from '../../api';

const statusColor = (s) => ({
  open:        'bg-red-100 text-red-600',
  in_progress: 'bg-yellow-100 text-yellow-600',
  resolved:    'bg-green-100 text-green-600',
  closed:      'bg-gray-100 text-gray-500',
}[s] || 'bg-gray-100 text-gray-500');

const priorityColor = (p) => ({
  critical: 'text-red-600',
  high:     'text-orange-500',
  medium:   'text-yellow-500',
  low:      'text-gray-400',
}[p] || 'text-gray-400');

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`${BASE}/api/tickets/ALL_tickets`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setTickets(d.tickets || []));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
        <Link to="/admin/home" className="text-xl font-bold text-indigo-600">BookLeaf Admin</Link>
        <span className="text-sm text-gray-400">Ticket Queue</span>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          All Tickets <span className="text-gray-400 font-normal text-lg">({tickets.length})</span>
        </h1>

        {tickets.length === 0 && (
          <p className="text-gray-400 text-sm">No tickets yet.</p>
        )}

        <div className="space-y-3">
          {tickets.map(t => (
            <div key={t.id} className="bg-white rounded-xl px-6 py-4 shadow flex items-center gap-4"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

              {/* ID */}
              <span className="text-xs text-gray-300 font-mono w-8">#{t.id}</span>

              {/* Subject + author */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{t.subject}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.author_id} · {t.book_id || 'General'}</p>
              </div>

              {/* Category */}
              <span className="text-xs text-gray-400 hidden sm:block w-28 truncate">{t.category}</span>

              {/* Priority */}
              <span className={`text-xs font-bold uppercase w-16 ${priorityColor(t.priority)}`}>
                {t.priority}
              </span>

              {/* Status */}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor(t.status)}`}>
                {t.status}
              </span>

              {/* Date */}
              <span className="text-xs text-gray-300 w-20 text-right">
                {new Date(t.created_at).toLocaleDateString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
