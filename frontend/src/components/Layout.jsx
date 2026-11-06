import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const go = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const dashPath =
    user?.role === 'citizen' ? '/citizen' : user?.role === 'clerk' ? '/clerk' : user?.role === 'pdo' ? '/pdo' : '/';

  return (
    <>
      <header>
        <div className="lf" ref={menuRef}>
          <button className="hb" onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }} aria-label="Menu" aria-expanded={menuOpen}>
            <i /><i /><i />
          </button>
          <button className="brand" onClick={() => go('/')}>
            RTI Reply Tracker
          </button>
          {menuOpen && (
            <nav className="menu">
              <button onClick={() => go('/')}>🏠 Home: notifications</button>
              {user ? (
                <>
                  <button onClick={() => go(dashPath)}>📊 My dashboard</button>
                  <button onClick={handleLogout}>🚪 Logout</button>
                </>
              ) : (
                <>
                  <button onClick={() => go('/login?role=citizen&mode=register')}>✨ Sign up</button>
                  <button onClick={() => go('/login?role=citizen')}>👤 Login as Citizen</button>
                  <button onClick={() => go('/login?role=clerk')}>📋 Login as Clerk</button>
                  <button onClick={() => go('/login?role=pdo')}>🏛️ Login as PDO</button>
                </>
              )}
            </nav>
          )}
        </div>
        <span className="user-badge">
          {user
            ? `${user.name} · ${user.role}${user.panchayatName ? ` · ${user.panchayatName}` : ''}`
            : 'Not signed in'}
        </span>
      </header>
      <div className="clk">
        <span className="mut">
          Today: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        {user && (
          <button onClick={handleLogout} style={{ marginLeft: 'auto' }}>Logout</button>
        )}
      </div>
      {children}
    </>
  );
}
