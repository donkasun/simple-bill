import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { PageTitleContext } from "./PageTitleContext";
import { useAuth } from "@auth/useAuth";
import ConfirmDialog from "../core/ConfirmDialog";
import { isLocalDevHost } from "@utils/isLocalDevHost";

const SIDEBAR_NAV_ITEMS = [
  { to: "/dashboard", icon: "dashboard", label: "Dashboard", end: true },
  { to: "/documents", icon: "folder_open", label: "Documents" },
  { to: "/customers", icon: "group", label: "Customers" },
  { to: "/items", icon: "inventory_2", label: "Items" },
  { to: "/settings", icon: "settings", label: "Settings" },
] as const;

type NavIndicator = {
  top: number;
  height: number;
  visible: boolean;
};

const AppShell: React.FC = () => {
  const [pageTitle, setPageTitle] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [indicatorReady, setIndicatorReady] = useState(false);
  const [showDevNav, setShowDevNav] = useState(false);
  const [navIndicator, setNavIndicator] = useState<NavIndicator>({
    top: 0,
    height: 0,
    visible: false,
  });
  const navRef = useRef<HTMLElement | null>(null);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitleCtx = useMemo(
    () => ({ setTitle: setPageTitle, title: pageTitle }),
    [pageTitle],
  );

  const handleSignOutClick = () => {
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
    setShowDevNav(isLocalDevHost());
  }, []);

  const updateNavIndicator = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;

    const activeLink = nav.querySelector<HTMLElement>(".sidebar-link.active");
    if (!activeLink) {
      setNavIndicator((prev) => ({ ...prev, visible: false }));
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    setNavIndicator({
      top: linkRect.top - navRect.top + linkRect.height * 0.25,
      height: linkRect.height * 0.5,
      visible: true,
    });
  }, []);

  useLayoutEffect(() => {
    updateNavIndicator();
    const frame = requestAnimationFrame(() => setIndicatorReady(true));
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, updateNavIndicator]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const observer = new ResizeObserver(() => updateNavIndicator());
    observer.observe(nav);

    window.addEventListener("resize", updateNavIndicator);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateNavIndicator);
    };
  }, [updateNavIndicator]);

  const navLink = (to: string, icon: string, label: string, end = false) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
      onClick={() => setIsSidebarOpen(false)}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="sidebar-link-label">{label}</span>
    </NavLink>
  );

  return (
    <PageTitleContext.Provider value={pageTitleCtx}>
      <div className="app-layout">
        <aside className="sidebar" data-open={isSidebarOpen ? "true" : "false"}>
          <div className="sidebar-inner">
            <div
              className="sidebar-brand"
              onClick={() => {
                navigate("/dashboard");
                setIsSidebarOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate("/dashboard");
                  setIsSidebarOpen(false);
                }
              }}
              role="link"
              tabIndex={0}
            >
              <span className="material-symbols-outlined filled sidebar-brand__icon">
                account_balance_wallet
              </span>
              <span className="brand-title">SimpleBill</span>
            </div>

            <nav ref={navRef} className="sidebar-nav" aria-label="Main">
              <span
                className={`sidebar-nav-indicator${indicatorReady ? " is-ready" : ""}`}
                style={{
                  top: navIndicator.top,
                  height: navIndicator.height,
                  opacity: navIndicator.visible ? 1 : 0,
                }}
                aria-hidden
              />
              {SIDEBAR_NAV_ITEMS.map((item) =>
                navLink(
                  item.to,
                  item.icon,
                  item.label,
                  "end" in item ? item.end : false,
                ),
              )}
              {showDevNav
                ? navLink("/dev/colors", "palette", "Color guide (dev)")
                : null}
            </nav>

            <div className="sidebar-footer">
              <button
                type="button"
                className="sidebar-sign-out"
                onClick={handleSignOutClick}
              >
                <span className="material-symbols-outlined">logout</span>
                <span className="sidebar-link-label">Sign out</span>
              </button>
            </div>
          </div>
        </aside>

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
