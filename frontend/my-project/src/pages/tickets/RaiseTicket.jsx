import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BASE from '../../api';

export default function RaiseTicket() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({ book_id: '', subject: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  // author ki books fetch karo dropdown ke liye
  useEffect(() => {
    fetch(`${BASE}/api/books/view`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setBooks(d.books || []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/tickets/create_ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Failed');
      navigate('/tickets');
    } catch {
      setError('Server se connect nahi ho paya');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
        <Link to="/home" className="text-xl font-bold text-indigo-600">BookLeaf</Link>
        <Link to="/tickets" className="text-sm text-indigo-500 hover:underline">← My Tickets</Link>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl shadow p-8"
          style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
          <h1 className="text-xl font-bold text-gray-800 mb-1">Raise a Ticket</h1>
          <p className="text-gray-400 text-sm mb-6">Our support team will respond within 48 hours.</p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Book dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Related Book</label>
              <select value={form.book_id} onChange={set('book_id')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">General / Account Level</option>
                {books.map(b => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input type="text" required value={form.subject} onChange={set('subject')}
                placeholder="e.g. Royalty not received for Q3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea required rows={5} value={form.description} onChange={set('description')}
                placeholder="Describe your issue in detail..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>

            {/* File — UI only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachment <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input type="file"
                className="w-full text-sm text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-600 file:text-sm file:font-medium" />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
