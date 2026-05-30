import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import AppShell from "@components/layout/AppShell";
import ProtectedRoute from "@components/core/ProtectedRoute";
import ErrorBoundary from "@components/core/ErrorBoundary";
import { ThemeProvider } from "./contexts";
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
      <Router>
        <ErrorBoundary>
          <Suspense fallback={<div style={{ padding: "1rem" }}>Loading…</div>}>
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
              </Route>
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Router>
    </ThemeProvider>
  );
}

export default App;
