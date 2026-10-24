import { useLocation, Link } from 'react-router-dom';

const Row = ({ label, value }) => (
  <div className="flex justify-between py-3 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-400">{label}</span>
    <span className="text-sm font-medium text-gray-800">{value ?? '—'}</span>
  </div>
);

export default function BookDetail() {
  const { state } = useLocation();
  const book = state?.book;

  if (!book) return (
    <div className="p-10 text-center text-gray-400">
      No book data. <Link to="/books/view" className="text-indigo-500">Go back</Link>
    </div>
  );

  const date = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
        <Link to="/home" className="text-xl font-bold text-indigo-600">BookLeaf</Link>
        <Link to="/books/view" className="text-sm text-indigo-500 hover:underline">← My Books</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-2xl p-7 text-white mb-6"
          style={{ boxShadow: '0 16px 40px rgba(99,102,241,0.30)' }}>
          <p className="text-indigo-200 text-xs mb-1">{book.genre}</p>
          <h1 className="text-2xl font-bold mb-1">{book.title}</h1>
          <p className="text-indigo-100 text-sm">ISBN: {book.isbn}</p>
          <span className="mt-3 inline-block text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">{book.status}</span>
        </div>

        {/* Book Info */}
        <div className="bg-white rounded-2xl p-6 shadow mb-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Book Info</h2>
          <Row label="Book ID"          value={book.id} />
          <Row label="Publication Date" value={date(book.publication_date)} />
          <Row label="Print Partner"    value={book.print_partner} />
          <Row label="MRP"              value={book.mrp ? `₹${book.mrp}` : null} />
          <Row label="Available On"     value={book.available_on?.length ? book.available_on.join(', ') : '—'} />
        </div>

        {/* Royalty */}
        <div className="bg-white rounded-2xl p-6 shadow">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Royalty</h2>
          <Row label="Royalty per Copy"   value={book.author_royalty_per_copy ? `₹${book.author_royalty_per_copy}` : null} />
          <Row label="Total Copies Sold"  value={book.total_copies_sold} />
          <Row label="Total Earned"       value={book.total_royalty_earned ? `₹${book.total_royalty_earned}` : null} />
          <Row label="Royalty Paid"       value={book.royalty_paid ? `₹${book.royalty_paid}` : null} />
          <Row label="Royalty Pending"    value={book.royalty_pending ? `₹${book.royalty_pending}` : null} />
          <Row label="Last Payout Date"   value={date(book.last_royalty_payout_date)} />
        </div>
      </div>
    </div>
  );
}
