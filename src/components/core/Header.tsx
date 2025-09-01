import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@auth/useAuth";
import { getFallbackAvatar } from "@utils/fallbackAvatar";

type HeaderProps = { title?: string; onToggleSidebar?: () => void };

const Header: React.FC<HeaderProps> = ({ title, onToggleSidebar }) => {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
  };

  return (
    <header className="top-header">
      <div className="top-header__inner">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="hamburger-btn"
            aria-label="Open sidebar"
            onClick={onToggleSidebar}
          >
            <span aria-hidden>☰</span>
          </button>
          <h2 className="page-title" style={{ margin: 0 }}>
            {title || ""}
          </h2>
        </div>

        <div className="header-actions">
          <div className="user-menu" ref={menuRef}>
            <button
              className="avatar-button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <div className="avatar" title={user?.displayName ?? "User"}>
                <img
                  src={
                    user?.photoURL ||
                    getFallbackAvatar({
                      uid: user?.uid,
                      email: user?.email,
                      displayName: user?.displayName,
                    })
                  }
                  alt="User avatar"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = getFallbackAvatar({
                      uid: user?.uid,
                      email: user?.email,
                      displayName: user?.displayName,
                    });
                  }}
                />
              </div>
            </button>
            <div
              className={`menu-dropdown ${menuOpen ? "open" : ""}`}
              role="menu"
            >
              <div className="menu-header">
                <div className="menu-user">{user?.displayName ?? "User"}</div>
                {user?.email && <div className="menu-email">{user.email}</div>}
              </div>
              <div className="menu-links">
                <NavLink
                  to="/profile"
                  className="menu-link"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </NavLink>
                <NavLink
                  to="/settings"
                  className="menu-link"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  Settings
                </NavLink>
              </div>
              <button
                className="menu-item menu-item--center"
                role="menuitem"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
