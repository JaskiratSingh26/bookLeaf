import { useNavigate, Link } from 'react-router-dom';

export default function AuthorHome() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const logout = () => { localStorage.clear(); navigate('/login'); };

  const cards = [
    {
      title: 'My Books',
      desc: 'View all your published and in-production books with royalty details.',
      action: 'View Books →',
      link: '/books/view',
      bg: 'from-blue-500 to-indigo-600',
      icon: '📚',
    },
    {
      title: 'Add Book',
      desc: 'Submit a new book to the BookLeaf platform with all its details.',
      action: 'Add New Book →',
      link: '/add-book',
      bg: 'from-emerald-500 to-teal-600',
      icon: '➕',
    },
    {
      title: 'Raise Ticket',
      desc: 'Raise a support ticket or check the status of existing ones.',
      action: 'Raise Ticket →',
      link: '/tickets/raise',
      bg: 'from-violet-500 to-purple-600',
      icon: '🎫',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
        <span className="text-xl font-bold text-indigo-600 tracking-tight">BookLeaf</span>
        <div className="flex gap-6 items-center text-sm font-medium text-gray-600">
          <Link to="/books/view" className="hover:text-indigo-600 transition">My Books</Link>
          <Link to="/add-book"   className="hover:text-indigo-600 transition">Add Book</Link>
          <Link to="/tickets"    className="hover:text-indigo-600 transition">Tickets</Link>
          <button onClick={logout} className="text-red-500 hover:text-red-700 transition">Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Welcome */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-2xl p-8 text-white shadow-xl mb-10"
          style={{ boxShadow: '0 20px 40px rgba(99,102,241,0.35)' }}>
          <p className="text-indigo-200 text-sm mb-1">Welcome back,</p>
          <h1 className="text-3xl font-bold mb-1">{user.name || 'Author'}</h1>
          <p className="text-indigo-100 text-sm">{user.email} · Author Portal</p>
        </div>

        {/* Action Cards */}
        <h2 className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {cards.map(c => (
            <Link key={c.link} to={c.link}
              className="group block rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-200"
              style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}>
              <div className={`bg-gradient-to-br ${c.bg} p-6 text-white`}>
                <div className="text-4xl mb-3">{c.icon}</div>
                <h3 className="text-lg font-bold mb-1">{c.title}</h3>
                <p className="text-white/80 text-sm leading-relaxed">{c.desc}</p>
                <p className="mt-4 text-sm font-semibold group-hover:underline">{c.action}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Route info — for dev reference */}
        <div className="mt-10 bg-white rounded-xl p-5 shadow text-xs text-gray-400 space-y-1">
          <p className="font-semibold text-gray-500 mb-2">Routes in this portal</p>
          <p><span className="text-indigo-500">GET  /books/view</span> — fetch & show all books for this author</p>
          <p><span className="text-emerald-500">POST /add-book</span>   — form to add a new book → calls POST /api/books/add</p>
          <p><span className="text-violet-500">GET  /tickets</span>     — list tickets, create new, view thread</p>
        </div>
      </div>
    </div>
  );
}
