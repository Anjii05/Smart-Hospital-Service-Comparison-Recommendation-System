import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/hospitals', label: 'Hospitals', icon: '🏥' },
  { to: '/map', label: 'Map', icon: '🗺️' },
  { to: '/recommend', label: 'Recommend', icon: '🎯' }
];

export default function AppNavbar({ compareCount = 0 }) {
  return (
    <header className="navbar-shell">
      <nav className="navbar">
        <NavLink to="/" className="brand-mark">
          <span className="brand-icon">🏥</span>
          <span className="brand-name">
            Hospital<span>Finder</span>
          </span>
        </NavLink>

        <div className="navbar-links">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          <NavLink
            to="/compare"
            className={({ isActive }) => `nav-link compare-link ${isActive ? 'active' : ''}`}
          >
            <span>⚖️</span>
            <span>Compare{compareCount > 0 ? ` (${compareCount})` : ''}</span>
          </NavLink>
        </div>
      </nav>
    </header>
  );
}

