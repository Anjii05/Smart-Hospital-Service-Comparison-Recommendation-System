import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">🏥</div>
          <div className="brand-text">
            <span className="brand-name">MedCompare</span>
            <span className="brand-tagline">Smart Hospital Finder</span>
          </div>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} end onClick={() => setMenuOpen(false)}>Home</NavLink>
          <NavLink to="/hospitals" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Find Hospitals</NavLink>
          <NavLink to="/compare" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Compare</NavLink>
          <NavLink to="/recommend" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>AI Recommend</NavLink>
        </div>

        <div className="navbar-actions">
          <button className="btn btn-primary btn-sm" onClick={() => { navigate('/hospitals'); setMenuOpen(false); }}>
            🔍 Search Now
          </button>
          <button className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;