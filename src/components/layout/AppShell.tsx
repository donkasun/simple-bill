import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Header from '../core/Header';

const AppShell: React.FC = () => {
  const location = useLocation();

  const getTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/customers':
        return 'Customers';
      case '/items':
        return 'Items';
      default:
        return 'SimpleBill';
    }
  };

  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <nav style={{ width: '220px', borderRight: '1px solid #ccc', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>
            <NavLink to="/dashboard">Dashboard</NavLink>
          </li>
          <li>
            <NavLink to="/customers">Customers</NavLink>
          </li>
          <li>
            <NavLink to="/items">Items</NavLink>
          </li>
        </ul>
        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(52,58,64,0.2)',
              background: '#fff',
              color: '#343a40',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </nav>
      <main style={{ flex: 1, padding: '1rem' }}>
        <Header title={getTitle()} />
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;