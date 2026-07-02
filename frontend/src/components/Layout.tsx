import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      <nav className="nav">
        <div className="nav-brand">
          🏢 Maintaina
        </div>
        <div className="nav-links">
          {user?.role === 'resident' && (
            <Link className={`nav-link ${location.pathname === '/resident' ? 'active' : ''}`} to="/resident">My Complaints</Link>
          )}
          {user?.role === 'admin' && (
            <Link className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`} to="/admin">Admin Panel</Link>
          )}
          <Link className={`nav-link ${location.pathname === '/notices' ? 'active' : ''}`} to="/notices">Notice Board</Link>
          <span className="nav-user">👤 {user?.name}</span>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <main className="main">{children}</main>
    </>
  );
}
