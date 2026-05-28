import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { PageTitleContext } from "./PageTitleContext";
import { useAuth } from "@auth/useAuth";
import { getFallbackAvatar } from "@utils/fallbackAvatar";
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
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

  const handleSignOutClick = () => {
    setUserMenuOpen(false);
    setShowSignOutConfirm(true);
  };

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

  useEffect(() => {
    if (!userMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [userMenuOpen]);

  const navLink = (to: string, icon: string, label: string, end = false) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
      title={collapsed ? label : undefined}
      onClick={() => setIsSidebarOpen(false)}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="sidebar-link-label">{label}</span>
    </NavLink>
  );

  const goNewInvoice = () => {
    navigate("/documents/new");
    setIsSidebarOpen(false);
  };

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
              onClick={() => {
                navigate("/dashboard");
                setIsSidebarOpen(false);
              }}
              style={{ cursor: "pointer" }}
            >
              <div className="brand-logo-box">
                <span className="material-symbols-outlined filled icon-md">
                  account_balance_wallet
                </span>
              </div>
              <div>
                <span className="brand-title">SimpleBill</span>
                <div className="brand-tagline">Dead-simple invoicing</div>
              </div>
            </div>

            {/* Primary action */}
            <div className="sidebar-cta-wrap">
              <button
                type="button"
                className="sidebar-cta-btn btn-primary"
                onClick={goNewInvoice}
                title="New invoice"
              >
                <span className="material-symbols-outlined filled" aria-hidden>
                  add
                </span>
                <span className="sidebar-cta-label">New invoice</span>
              </button>
              <p className="sidebar-cta-hint">Takes about a minute</p>
            </div>

            {/* Main nav */}
            <nav className="sidebar-nav">
              {navLink("/dashboard", "home", "Home", true)}
              {navLink("/documents", "receipt_long", "Documents")}
              {navLink("/customers", "group", "Customers")}
              {navLink("/items", "inventory_2", "Products & services")}
              {navLink("/settings", "settings", "Settings")}
            </nav>

            {/* Collapse: explain in plain language when expanded; icon-only when collapsed */}
            <div className="sidebar-panel-toggle">
              <button
                type="button"
                className="sidebar-panel-toggle-btn"
                onClick={toggleCollapse}
                aria-label={
                  collapsed
                    ? "Show full sidebar with names"
                    : "Use a smaller sidebar with icons only"
                }
                title={
                  collapsed
                    ? "Show the full sidebar again with names next to each item"
                    : "Use a narrow sidebar with icons only so your pages have more room"
                }
              >
                <span className="material-symbols-outlined">chevron_left</span>
                <span className="sidebar-panel-toggle-copy">
                  <span className="sidebar-panel-toggle-label">
                    Smaller sidebar
                  </span>
                  <span className="sidebar-panel-toggle-sublabel">
                    Icons only — more room for your work
                  </span>
                </span>
              </button>
            </div>

            {/* User menu */}
            <div className="sidebar-user" ref={userMenuRef}>
              <button
                type="button"
                className="sidebar-user-trigger"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((o) => !o)}
              >
                <div className="avatar">
                  <img
                    src={avatarSrc}
                    alt=""
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
                <span
                  className="material-symbols-outlined sidebar-user-chevron"
                  aria-hidden
                >
                  expand_more
                </span>
              </button>

              {userMenuOpen && (
                <div className="sidebar-user-dropdown" role="menu">
                  <NavLink
                    to="/profile"
                    className="sidebar-user-dropdown-link"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setIsSidebarOpen(false);
                    }}
                  >
                    Profile
                  </NavLink>
                  <button
                    type="button"
                    className="sidebar-user-dropdown-danger"
                    role="menuitem"
                    onClick={handleSignOutClick}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main area ── */}
        <div className="main-area">
          <div className="main-mobile-bar">
            <button
              type="button"
              className="hamburger-btn"
              aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
              aria-expanded={isSidebarOpen}
              onClick={() => setIsSidebarOpen((o) => !o)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>

          <button
            type="button"
            className={`sidebar-overlay${isSidebarOpen ? " visible" : ""}`}
            aria-label="Close menu"
            onClick={() => setIsSidebarOpen(false)}
          />

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
