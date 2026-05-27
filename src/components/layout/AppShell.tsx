import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { PageTitleContext } from "./PageTitleContext";
import { useAuth } from "@auth/useAuth";
import { getFallbackAvatar } from "@utils/fallbackAvatar";
import ThemeToggle from "../core/ThemeToggle";
import ConfirmDialog from "../core/ConfirmDialog";

// Persist sidebar collapsed state across refreshes
const COLLAPSED_KEY = "sb_sidebar_collapsed";

const AppShell: React.FC = () => {
  const [pageTitle, setPageTitle] = useState<string>("");
  const [collapsed, setCollapsed] = useState<boolean>(
    () => localStorage.getItem(COLLAPSED_KEY) === "true",
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const pageTitleCtx = useMemo(
    () => ({ setTitle: setPageTitle, title: pageTitle }),
    [pageTitle],
  );

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  const handleSignOutClick = () => setShowSignOutConfirm(true);

  const handleConfirmSignOut = useCallback(async () => {
    setShowSignOutConfirm(false);
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
      title={collapsed ? label : undefined}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="sidebar-link-label">{label}</span>
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
      <div className="app-layout" data-collapsed={collapsed ? "true" : "false"}>
        {/* ── Fixed Sidebar ── */}
        <aside className="sidebar" data-open={isSidebarOpen ? "true" : "false"}>
          <div className="sidebar-inner">
            {/* Brand */}
            <div
              className="sidebar-brand"
              onClick={() => navigate("/dashboard")}
              style={{ cursor: "pointer" }}
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
              <button
                className="sidebar-link danger"
                onClick={handleSignOutClick}
                title={collapsed ? "Sign out" : undefined}
              >
                <span className="material-symbols-outlined">logout</span>
                <span className="sidebar-signout-label">Sign out</span>
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
                <div className="theme-toggle-wrap">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main area ── */}
        <div className="main-area">
          {/* Tap-to-close overlay (mobile) */}
          <button
            className={`sidebar-overlay${isSidebarOpen ? " visible" : ""}`}
            aria-label="Close menu"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sticky top header */}
          <header className="top-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Desktop: sidebar collapse toggle */}
              <button
                className="sidebar-collapse-btn"
                onClick={toggleCollapse}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <span className="material-symbols-outlined">
                  {collapsed ? "menu_open" : "menu"}
                </span>
              </button>
              {/* Mobile hamburger (CSS shows/hides based on breakpoint — same btn, separate class) */}
              <h2 className="top-header-title">{pageTitle || "Overview"}</h2>
            </div>
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

      <ConfirmDialog
        isOpen={showSignOutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out of SimpleBill?"
        confirmLabel="Sign out"
        onConfirm={handleConfirmSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
        danger={false}
      />
    </PageTitleContext.Provider>
  );
};

export default AppShell;
