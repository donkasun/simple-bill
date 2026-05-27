import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { PageTitleContext } from "./PageTitleContext";
import { useAuth } from "@auth/useAuth";
import { getFallbackAvatar } from "@utils/fallbackAvatar";
import ThemeToggle from "../core/ThemeToggle";

const AppShell: React.FC = () => {
  const [pageTitle, setPageTitle] = useState<string>("");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const pageTitleCtx = useMemo(
    () => ({ setTitle: setPageTitle, title: pageTitle }),
    [pageTitle],
  );

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  useEffect(() => {
    if (pageTitle && pageTitle.trim().length > 0) {
      document.title = `${pageTitle} · SimpleBill`;
    } else {
      document.title = "SimpleBill";
    }
  }, [pageTitle]);

  const navLink = (to: string, icon: string, label: string, end = false) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      {label}
    </NavLink>
  );

  const avatarSrc =
    user?.photoURL ||
    getFallbackAvatar({
      uid: user?.uid,
      email: user?.email,
      displayName: user?.displayName,
    });

  return (
    <PageTitleContext.Provider value={pageTitleCtx}>
      <div className="app-layout">
        {/* ── Fixed Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-inner">
            {/* Brand */}
            <div
              className="sidebar-brand"
              onClick={() => navigate("/dashboard")}
            >
              <div className="brand-logo-box">
                <span
                  className="material-symbols-outlined filled"
                  style={{ fontSize: 22 }}
                >
                  account_balance_wallet
                </span>
              </div>
              <div>
                <span className="brand-title">SimpleBill</span>
                <div className="brand-tagline">Dead-simple invoicing</div>
              </div>
            </div>

            {/* Main nav */}
            <nav className="sidebar-nav">
              {navLink("/dashboard", "dashboard", "Dashboard", true)}
              {navLink("/customers", "group", "Customers")}
              {navLink("/items", "inventory_2", "Items")}
              {navLink("/settings", "settings", "Settings")}
            </nav>

            {/* Sign out */}
            <div className="sidebar-signout">
              <button className="sidebar-link danger" onClick={handleSignOut}>
                <span className="material-symbols-outlined">logout</span>
                Sign out
              </button>
            </div>

            {/* User strip */}
            <div className="sidebar-user">
              <div className="sidebar-user-button">
                <div className="avatar">
                  <img
                    src={avatarSrc}
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
                <div className="sidebar-user-text">
                  <div className="sidebar-user-name">
                    {user?.displayName ?? "User"}
                  </div>
                  <div className="sidebar-user-email">{user?.email ?? ""}</div>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main area ── */}
        <div className="main-area">
          {/* Sticky top header */}
          <header className="top-header">
            <h2 className="top-header-title">{pageTitle || "Overview"}</h2>
            <div className="top-header-actions">
              <button className="icon-btn" aria-label="Help">
                <span className="material-symbols-outlined">help</span>
              </button>
              <button className="icon-btn" aria-label="Notifications">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <div className="header-avatar">
                <img
                  src={avatarSrc}
                  alt="User"
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
            </div>
          </header>

          <main className="main-content">
            <Outlet />
          </main>
        </div>
      </div>
    </PageTitleContext.Provider>
  );
};

export default AppShell;
