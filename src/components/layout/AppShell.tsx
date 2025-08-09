import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../core/Header';

const AppShell: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1, padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;