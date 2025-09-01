import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Logo from "../../assets/logo.svg";
import { PageTitleContext } from "./PageTitleContext";
import { useAuth } from "@auth/useAuth";
import { getFallbackAvatar } from "@utils/fallbackAvatar";
import ThemeToggle from "../core/ThemeToggle";

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

  // No profile dropdown menu in sidebar-user section anymore

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
            <div
              className="sidebar-brand"
              onClick={() => {
                navigate("/dashboard");
                handleCloseSidebar();
              }}
              style={{ cursor: "pointer" }}
            >
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

            <nav className="sidebar-nav">
              <div className="sidebar-theme-toggle">
                <ThemeToggle />
              </div>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
                onClick={handleCloseSidebar}
              >
                Profile
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
                onClick={handleCloseSidebar}
              >
                Settings
              </NavLink>
              <div className="sidebar-sep" />
              <button className="sidebar-link danger" onClick={handleSignOut}>
                Sign out
              </button>
            </nav>

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
