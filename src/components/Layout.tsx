import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/categories', label: 'Categories' },
  { to: '/subcategories', label: 'Subcategories' },
  { to: '/providers', label: 'Providers' },
  { to: '/customers', label: 'Customers' },
  { to: '/payments', label: 'Payments' },
];

export function Layout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">ServiceHub Admin</div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">{user?.email}</div>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
