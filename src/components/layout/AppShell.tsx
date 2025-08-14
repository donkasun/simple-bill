import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NavLink, Outlet } from "react-router-dom";
import Logo from "../../assets/logo.svg";
import { PageTitleContext } from "./PageTitleContext";
import { useAuth } from "@auth/useAuth";
import { getFallbackAvatar } from "@utils/fallbackAvatar";

const AppShell: React.FC = () => {
  const [pageTitle, setPageTitle] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const pageTitleCtx = useMemo(() => ({ setTitle: setPageTitle }), []);
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);
  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
  };

  useEffect(() => {
    if (pageTitle && pageTitle.trim().length > 0) {
      document.title = `${pageTitle} · SimpleBill`;
    } else {
      document.title = "SimpleBill";
    }
  }, [pageTitle]);

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
          onClick={(e) => {
            // prevent clicks inside from bubbling to overlay handler
            e.stopPropagation();
          }}
        >
          <div className="sidebar-inner">
            <div className="sidebar-brand">
              <img src={Logo} alt="SimpleBill" className="brand-icon" />
              <span className="brand-title">SimpleBill</span>
            </div>
            <div className="sidebar-sep" />
            <nav className="sidebar-nav" style={{ flex: 1 }}>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
                onClick={handleCloseSidebar}
                end
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/customers"
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
                onClick={handleCloseSidebar}
              >
                Customers
              </NavLink>
              <NavLink
                to="/items"
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
                onClick={handleCloseSidebar}
              >
                Items
              </NavLink>
              <div className="sidebar-sep" />
            </nav>

            <div className="sidebar-user">
              <div className="user-menu" ref={menuRef}>
                <button
                  className="sidebar-user-button"
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
                  <div className="sidebar-user-text">
                    <div className="sidebar-user-name">
                      {user?.displayName ?? "User"}
                    </div>
                    <div className="sidebar-user-email">
                      {user?.email ?? "User"}
                    </div>
                  </div>
                </button>
                <div
                  className={`menu-dropdown ${menuOpen ? "open" : ""}`}
                  role="menu"
                >
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
        </aside>
        <div className="main-area">
          <main className="main-content">
            <Outlet />
          </main>
          {/* Mobile overlay to close */}
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
