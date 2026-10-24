import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BASE from '../../api';

const statusColor = (s) =>
  s === 'Published & Live' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700';

export default function ViewBooks() {
  const [books, setBooks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BASE}/api/books/view`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.json())
      .then(d => setBooks(d.books || []));
  }, []);

  const openBook = (book) => {
    // data seedha state mein pass karo — no extra API call
    navigate('/books/detail', { state: { book } });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
        <Link to="/home" className="text-xl font-bold text-indigo-600">BookLeaf</Link>
        <Link to="/add-book" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">+ Add Book</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Books</h1>

        {books.length === 0 && (
          <p className="text-gray-400 text-sm">No books yet. <Link to="/add-book" className="text-indigo-500 hover:underline">Add one →</Link></p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {books.map(book => (
            <button key={book.id} onClick={() => openBook(book)} className="text-left w-full">
              <div className="bg-white rounded-2xl p-6 shadow hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor(book.status)}`}>{book.status}</span>
                  <span className="text-xs text-gray-400">{book.genre}</span>
                </div>
                <h2 className="text-lg font-bold text-gray-800 mb-1">{book.title}</h2>
                <p className="text-xs text-gray-400 mb-4">ISBN: {book.isbn}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded-xl p-2">
                    <p className="text-xs text-gray-400">Copies</p>
                    <p className="font-bold text-gray-700">{book.total_copies_sold}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-2">
                    <p className="text-xs text-gray-400">Earned</p>
                    <p className="font-bold text-green-600">₹{book.total_royalty_earned}</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-2">
                    <p className="text-xs text-gray-400">Pending</p>
                    <p className="font-bold text-amber-600">₹{book.royalty_pending}</p>
                  </div>
                </div>
                <p className="text-indigo-500 text-xs font-semibold mt-4">View details →</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
