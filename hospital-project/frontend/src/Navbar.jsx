import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { pathname } = useLocation();
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          🏥 <span>Hospital Finder</span>
        </Link>
        <div className="navbar-links">
          <Link to="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/hospitals" className={pathname.startsWith('/hospitals') ? 'active' : ''}>Hospitals</Link>
          <Link to="/compare" className={pathname === '/compare' ? 'active' : ''}>Compare</Link>
          <Link to="/recommend" className={pathname === '/recommend' ? 'active' : ''}>Recommend</Link>
        </div>
      </div>
    </nav>
  );
}