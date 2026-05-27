import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Logo from "../../assets/logo.svg";
import { PageTitleContext } from "./PageTitleContext";
import { useAuth } from "@auth/useAuth";
import { getFallbackAvatar } from "@utils/fallbackAvatar";
import ThemeToggle from "../core/ThemeToggle";

// Inline SVG icons — kept minimal to match Stitch line-art style
const IconDashboard = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const IconCustomers = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconItems = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
);
const IconProfile = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconSettings = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IconPlus = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const AppShell: React.FC = () => {
  const [pageTitle, setPageTitle] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const pageTitleCtx = useMemo(() => ({ setTitle: setPageTitle }), []);
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);
  const handleSignOut = async () => {
    await signOut();
  };

  useEffect(() => {
    if (pageTitle && pageTitle.trim().length > 0) {
      document.title = `${pageTitle} · SimpleBill`;
    } else {
      document.title = "SimpleBill";
    }
  }, [pageTitle]);

  return (
    <PageTitleContext.Provider value={pageTitleCtx}>
      <div
        className="app-layout"
        style={{
          minHeight: "100vh",
          display: "grid",
          gridTemplateColumns: "auto 1fr",
        }}
      >
        <aside
          className="sidebar"
          data-open={sidebarOpen ? "true" : "false"}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sidebar-inner">
            {/* Brand */}
            <div
              className="sidebar-brand"
              onClick={() => {
                navigate("/dashboard");
                handleCloseSidebar();
              }}
              style={{ cursor: "pointer" }}
            >
              <img src={Logo} alt="SimpleBill" className="brand-icon" />
              <div>
                <span className="brand-title">SimpleBill</span>
                <div className="brand-tagline">Dead-simple invoicing</div>
              </div>
            </div>

            {/* New Invoice CTA */}
            <div style={{ padding: "0 0.75rem 0.5rem" }}>
              <button
                className="sidebar-new-invoice"
                onClick={() => {
                  navigate("/documents/new");
                  handleCloseSidebar();
                }}
              >
                <IconPlus />
                New Invoice
              </button>
            </div>

            <div className="sidebar-sep" />

            {/* Main nav */}
            <nav className="sidebar-nav" style={{ flex: 1 }}>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
                onClick={handleCloseSidebar}
                end
              >
                <IconDashboard /> Dashboard
              </NavLink>
              <NavLink
                to="/customers"
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
                onClick={handleCloseSidebar}
              >
                <IconCustomers /> Customers
              </NavLink>
              <NavLink
                to="/items"
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
                onClick={handleCloseSidebar}
              >
                <IconItems /> Items
              </NavLink>
              <div className="sidebar-sep" />
            </nav>

            {/* Bottom nav */}
            <nav className="sidebar-nav">
              <ThemeToggle />
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
                onClick={handleCloseSidebar}
              >
                <IconProfile /> Profile
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
                onClick={handleCloseSidebar}
              >
                <IconSettings /> Settings
              </NavLink>
              <div className="sidebar-sep" />
              <button className="sidebar-link danger" onClick={handleSignOut}>
                Sign out
              </button>
            </nav>

            {/* User */}
            <div className="sidebar-user">
              <div className="sidebar-user-button" aria-label="User">
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
                <div className="sidebar-user-text">
                  <div className="sidebar-user-name">
                    {user?.displayName ?? "User"}
                  </div>
                  <div className="sidebar-user-email">
                    {user?.email ?? "User"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="main-area">
          <main className="main-content">
            <Outlet />
          </main>
          <button
            className="sidebar-overlay"
            aria-label="Close sidebar"
            onClick={handleCloseSidebar}
          />
        </div>
      </div>
    </PageTitleContext.Provider>
  );
};

export default AppShell;
