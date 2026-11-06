import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/suppliers', label: 'Suppliers', icon: '🏭' },
  { to: '/assessments/new', label: 'New Assessment', icon: '📋' },
  { to: '/assessments', label: 'Assessment History', icon: '📂' },
];

const ADMIN_ITEMS = [
  { to: '/admin/users', label: 'User Management', icon: '👥' },
];

function PageTitle({ pathname }) {
  const map = {
    '/dashboard': 'Dashboard',
    '/suppliers': 'Suppliers',
    '/suppliers/new': 'Add Supplier',
    '/assessments': 'Assessment History',
    '/assessments/new': 'New Assessment',
    '/admin/users': 'User Management',
  };
  if (pathname.startsWith('/suppliers/') && pathname.endsWith('/edit')) return 'Edit Supplier';
  if (pathname.startsWith('/suppliers/') && pathname.endsWith('/assessments')) return 'Assessment History';
  if (pathname.startsWith('/suppliers/')) return 'Supplier Details';
  if (pathname.startsWith('/assessments/')) return 'Assessment Details';
  if (pathname.startsWith('/admin/users/')) return 'User Details';
  return map[pathname] || 'Supplier Risk Assessment';
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <span>🛡️</span>
          <div>
            <div style={{ fontSize: 13 }}>Supplier Risk</div>
            <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 400 }}>Assessment System</div>
          </div>
        </div>

        <nav className="sidebar-nav" onClick={() => setSidebarOpen(false)}>
          <div className="sidebar-section-label">Main</div>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {user?.role === 'Admin' && (
            <>
              <div className="sidebar-section-label">Admin</div>
              {ADMIN_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => isActive ? 'active' : ''}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <span>{user?.role} Account</span>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">☰</button>
            <span className="topbar-title">
              <PageTitle pathname={location.pathname} />
            </span>
          </div>

          <div className="topbar-right">
            <div className="user-menu" ref={userMenuRef}>
              <button
                className="user-menu-btn"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
              >
                👤 {user?.name}
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>▼</span>
              </button>

              {userMenuOpen && (
                <div className="user-menu-dropdown">
                  <div className="user-menu-dropdown-header">
                    <p>{user?.name}</p>
                    <small>{user?.email}</small>
                    <br />
                    <span className="badge badge-blue" style={{ marginTop: 4 }}>{user?.role}</span>
                  </div>
                  <button className="user-menu-item danger" onClick={handleLogout}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
