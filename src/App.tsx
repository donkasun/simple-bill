import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import AppShell from "@components/layout/AppShell";
import ProtectedRoute from "@components/core/ProtectedRoute";
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Customers = lazy(() => import("./pages/Customers"));
const Items = lazy(() => import("./pages/Items"));
const DocumentCreation = lazy(() => import("./pages/DocumentCreation"));
const DocumentEdit = lazy(() => import("./pages/DocumentEdit"));

function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{ padding: "1rem" }}>Loading…</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="items" element={<Items />} />
            <Route path="documents">
              <Route path="new" element={<DocumentCreation />} />
              <Route path=":id/edit" element={<DocumentEdit />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
