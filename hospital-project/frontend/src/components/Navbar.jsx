import { NavLink } from 'react-router-dom';

export default function Navbar() {
  const { pathname } = useLocation();
  return (
    <div className="navbar-wrapper">
      <nav className="navbar-glass">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">
            🏥 <span>Hospital Finder</span>
          </Link>
          <div className="navbar-links">
            <Link to="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
            <Link to="/hospitals" className={pathname.startsWith('/hospitals') ? 'active' : ''}>Hospitals</Link>
            <Link to="/nearest" className={pathname === '/nearest' ? 'active' : ''}>📍 Nearest</Link>
            <Link to="/compare" className={pathname === '/compare' ? 'active' : ''}>Compare</Link>
            <Link to="/recommend" className={pathname === '/recommend' ? 'active' : ''}>Recommend</Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
