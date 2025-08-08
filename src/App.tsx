import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./components/core/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Items from "./pages/Items";
import { AuthProvider } from "./hooks/useAuth";

function App() {
  return (
    <AuthProvider>
      <Router>
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
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
