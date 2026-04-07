import { Link } from 'react-router-dom';

const footerLinks = [
  { to: '/', label: 'Home' },
  { to: '/hospitals', label: 'Hospitals' },
  { to: '/map', label: 'Map' },
  { to: '/nearest', label: 'Nearest' },
  { to: '/compare', label: 'Compare' },
  { to: '/recommend', label: 'Recommend' }
];

export default function AppFooter() {
  return (
    <footer className="footer-shell">
      <div className="footer-brand">Hospital<span>Finder</span> India</div>

      <div className="footer-links">
        {footerLinks.map((link) => (
          <Link key={link.to} to={link.to}>
            {link.label}
          </Link>
        ))}
      </div>

      <p>
        Connected to your backend hospital API for search, compare, recommendations, nearest results,
        reviews, and live route-based pages.
      </p>
    </footer>
  );
}
