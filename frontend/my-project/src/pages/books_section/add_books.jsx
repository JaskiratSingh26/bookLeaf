import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BASE from '../../api';

export default function AddBooks() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    book_id: '', title: '', isbn: '', genre: '', publication_date: '',
    status: 'Published & Live', mrp: '', author_royalty_per_copy: '',
    total_copies_sold: '', total_royalty_earned: '', royalty_paid: '',
    royalty_pending: '', last_royalty_payout_date: '', print_partner: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/books/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
          // author_id nahi bhej rahe — backend JWT se lega
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Failed');
     
    } catch {
      setError('Server se connect nahi ho paya');
    } finally {
      setLoading(false);
    }
  };

  const field = (label, key, type = 'text') => (
    <div key={key}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={set(key)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Add Book</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {field('Book ID (e.g. BK006)', 'book_id')}
          {field('Title', 'title')}
          {field('ISBN', 'isbn')}
          {field('Genre', 'genre')}
          {field('Publication Date', 'publication_date', 'date')}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={set('status')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Published & Live</option>
              <option>In Production</option>
            </select>
          </div>

          {field('MRP (₹)', 'mrp', 'number')}
          {field('Royalty per copy (₹)', 'author_royalty_per_copy', 'number')}
          {field('Total copies sold', 'total_copies_sold', 'number')}
          {field('Total royalty earned (₹)', 'total_royalty_earned', 'number')}
          {field('Royalty paid (₹)', 'royalty_paid', 'number')}
          {field('Royalty pending (₹)', 'royalty_pending', 'number')}
          {field('Last payout date', 'last_royalty_payout_date', 'date')}
          {field('Print partner', 'print_partner')}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Adding...' : 'Add Book'}
          </button>
        </form>
      </div>
    </div>
  );
}
