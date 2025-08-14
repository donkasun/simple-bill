import React, { useCallback, useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import Header from "../core/Header";
import Logo from "../../assets/logo.svg";
import { PageTitleContext } from "./PageTitleContext";

const AppShell: React.FC = () => {
  const [pageTitle, setPageTitle] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const pageTitleCtx = useMemo(() => ({ setTitle: setPageTitle }), []);
  const handleToggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);

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
            <nav className="sidebar-nav">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
                end
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/customers"
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
              >
                Customers
              </NavLink>
              <NavLink
                to="/items"
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
              >
                Items
              </NavLink>
              <div className="sidebar-sep" />
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
              >
                Profile
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
              >
                Settings
              </NavLink>
            </nav>
          </div>
          {/* Mobile overlay to close */}
          <button
            className="sidebar-overlay"
            aria-label="Close sidebar"
            onClick={handleCloseSidebar}
          />
        </aside>
        <div className="main-area">
          <Header
            title={pageTitle || ""}
            onToggleSidebar={handleToggleSidebar}
          />
          <main className="main-content">
            <Outlet />
          </main>
        </div>
      </div>
    </PageTitleContext.Provider>
  );
};

export default AppShell;
