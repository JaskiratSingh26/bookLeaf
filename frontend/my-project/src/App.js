import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import AuthorHome from './pages/loggined_pages/AuthorHome';
import AdminHome from './pages/loggined_pages/AdminHome';
import AddBooks from './pages/books_section/add_books';
import RaiseTicket from './pages/tickets/RaiseTicket';
import MyTickets from './pages/tickets/MyTickets';
import ViewBooks from './pages/books_section/view_books';
import BookDetail from './pages/books_section/BookDetail';
import Admin_all_tickets from './pages/tickets/Admin_all_tickets'

function getTokenPayload() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function ProtectedRoute({ children, role }) {
  const payload = getTokenPayload();
  if (!payload) return <Navigate to="/login" replace />;
  if (role && payload.role !== role) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"       element={<Login />} />
        <Route path="/signup"      element={<SignUp />} />
        <Route path="/home"        element={<ProtectedRoute role="author"><AuthorHome /></ProtectedRoute>} />
        <Route path="/admin/home"  element={<ProtectedRoute role="admin"><AdminHome /></ProtectedRoute>} />
        <Route path="/add-book"    element={<ProtectedRoute role="author"><AddBooks /></ProtectedRoute>} />
        <Route path="/books/view"    element={<ProtectedRoute role="author"><ViewBooks /></ProtectedRoute>} />
        <Route path="/tickets/raise" element={<ProtectedRoute role="author"><RaiseTicket /></ProtectedRoute>} />
        <Route path="/tickets"       element={<ProtectedRoute role="author"><MyTickets /></ProtectedRoute>} />
        <Route path="/books/detail" element={<ProtectedRoute role="author"><BookDetail /></ProtectedRoute>} />
        <Route path="/admin/all_tickets" element={<ProtectedRoute role=
        "admin"><Admin_all_tickets /></ProtectedRoute>} />
        <Route path="*"            element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
