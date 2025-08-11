import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import Logo from '../../assets/logo.svg';
import { useAuth } from '../../hooks/useAuth';
import { getFallbackAvatar } from '../../utils/fallbackAvatar';

type HeaderProps = { title?: string };

const Header: React.FC<HeaderProps> = () => {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
  };

  const navClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' active' : ''}`;

  return (
    <header className="top-header">
      <div className="top-header__inner">
        <div className="brand-group">
          <img src={Logo} alt="InvoiceApp logo" className="brand-icon" />
          <h1 className="brand-title">InvoiceApp</h1>
        </div>

        <nav className="nav-links">
          <NavLink to="/dashboard" className={navClass} end>
            Dashboard
          </NavLink>
          <NavLink to="/customers" className={navClass}>
            Customers
          </NavLink>
          <NavLink to="/items" className={navClass}>
            Items
          </NavLink>
        </nav>

        <div className="header-actions">
          <div className="user-menu" ref={menuRef}>
            <button
              className="avatar-button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <div className="avatar" title={user?.displayName ?? 'User'}>
                <img
                  src={user?.photoURL || getFallbackAvatar({ uid: user?.uid, email: user?.email, displayName: user?.displayName })}
                  alt="User avatar"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = getFallbackAvatar({ uid: user?.uid, email: user?.email, displayName: user?.displayName });
                  }}
                />
              </div>
            </button>
            <div className={`menu-dropdown ${menuOpen ? 'open' : ''}`} role="menu">
              <div className="menu-header">
                <div className="menu-user">{user?.displayName ?? 'User'}</div>
                {user?.email && <div className="menu-email">{user.email}</div>}
              </div>
              <button className="menu-item" role="menuitem" onClick={handleSignOut}>Sign out</button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;