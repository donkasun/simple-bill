import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const AppShell: React.FC = () => {
  return (
    <div style={{ display: 'flex' }}>
      <nav style={{ width: '200px', borderRight: '1px solid #ccc', padding: '1rem' }}>
        <ul>
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
      </nav>
      <main style={{ flex: 1, padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;