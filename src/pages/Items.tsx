import React from 'react';

const Items: React.FC = () => {
  return (
    <div style={{ padding: '1rem' }}>
      <div className="container-xl">
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: '1rem' }}>Items</h2>
        <div style={{ background: '#fff', border: '1px solid var(--brand-border)', borderRadius: 12, padding: 16 }}>
          Coming soon…
        </div>
      </div>
    </div>
  );
};

export default Items;
