import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import AppShell from "@components/layout/AppShell";
import ProtectedRoute from "@components/core/ProtectedRoute";
import ErrorBoundary from "@components/core/ErrorBoundary";
import { ThemeProvider, ToastProvider } from "./contexts";
import { DevColorGuidePage, DevButtonGuidePage } from "./routes/DevRoutes";

const Landing = lazy(() => import("./pages/Landing"));
const Terms = lazy(() => import("./pages/Terms"));
const Dashboard = lazy(() => import("./pages/dashboard"));
const Customers = lazy(() => import("./pages/Customers"));
const Items = lazy(() => import("./pages/Items"));
const DocumentCreation = lazy(() => import("./pages/DocumentCreation"));
const DocumentEdit = lazy(() => import("./pages/DocumentEdit"));
const Documents = lazy(() => import("./pages/Documents"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <ErrorBoundary>
            <Suspense
              fallback={<div style={{ padding: "1rem" }}>Loading…</div>}
            >
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/terms" element={<Terms />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <AppShell />
                    </ProtectedRoute>
                  }
                >
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="items" element={<Items />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="documents">
                    <Route index element={<Documents />} />
                    <Route path="new" element={<DocumentCreation />} />
                    <Route path=":id/edit" element={<DocumentEdit />} />
                  </Route>
                  {DevColorGuidePage ? (
                    <Route path="dev/colors" element={<DevColorGuidePage />} />
                  ) : null}
                  {DevButtonGuidePage ? (
                    <Route
                      path="dev/buttons"
                      element={<DevButtonGuidePage />}
                    />
                  ) : null}
                </Route>
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
