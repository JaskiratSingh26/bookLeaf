import { useNavigate, Link } from 'react-router-dom';

export default function AdminHome() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const logout = () => { localStorage.clear(); navigate('/login'); };

  const cards = [
    {
      title: 'All Tickets',
      desc: 'View and manage all support tickets from authors. Reply, assign, and update status.',
      action: 'View Queue →',
      link: '/admin/all_tickets',
      bg: 'from-indigo-500 to-blue-600',
      icon: '🎫',
    },
    {
      title: 'Authors',
      desc: 'Browse all registered authors and their book portfolio.',
      action: 'View Authors →',
      link: '/admin/authors',
      bg: 'from-violet-500 to-purple-600',
      icon: '👥',
    },
    {
      title: 'Analytics',
      desc: 'Ticket stats, resolution rates, and priority breakdown.',
      action: 'Coming Soon',
      link: '#',
      bg: 'from-emerald-500 to-teal-600',
      icon: '📊',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-white shadow-md px-8 py-4 flex justify-between items-center">
        <span className="text-xl font-bold text-indigo-600 tracking-tight">BookLeaf Admin</span>
        <div className="flex gap-6 items-center text-sm font-medium text-gray-600">
          <Link to="/admin/all_tickets" className="hover:text-indigo-600 transition">Tickets</Link>
          <button onClick={logout} className="text-red-500 hover:text-red-700 transition">Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Welcome */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl p-8 text-white shadow-xl mb-10"
          style={{ boxShadow: '0 20px 40px rgba(15,23,42,0.30)' }}>
          <p className="text-slate-400 text-sm mb-1">Welcome back,</p>
          <h1 className="text-3xl font-bold mb-1">{user.name || 'Admin'}</h1>
          <p className="text-slate-400 text-sm">{user.email} · Admin Portal</p>
        </div>

        {/* Cards */}
        <h2 className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {cards.map(c => (
            <Link key={c.link} to={c.link}
              className="group block rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-200">
              <div className={`bg-gradient-to-br ${c.bg} p-6 text-white`}>
                <div className="text-4xl mb-3">{c.icon}</div>
                <h3 className="text-lg font-bold mb-1">{c.title}</h3>
                <p className="text-white/80 text-sm leading-relaxed">{c.desc}</p>
                <p className="mt-4 text-sm font-semibold group-hover:underline">{c.action}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
