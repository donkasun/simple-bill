import React from 'react';
import StyledTable from '../components/core/StyledTable';
import PrimaryButton from '../components/core/PrimaryButton';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';

type Customer = {
  id?: string;
  userId: string;
  name: string;
  email: string;
  address?: string;
};

const Customers: React.FC = () => {
  const { user } = useAuth();
  const { items, loading, error } = useFirestore<Customer>({
    collectionName: 'customers',
    userId: user?.uid,
    orderByField: 'createdAt',
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div></div>
        <PrimaryButton onClick={() => { /* TODO: open modal */ }}>
          Add New Customer
        </PrimaryButton>
      </div>

      {loading && <div>Loading customers…</div>}
      {error && <div role="alert" style={{ color: 'crimson' }}>{error}</div>}

      {!loading && !error && (
        <StyledTable>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.address ?? '-'}</td>
                <td>
                  <button style={{ marginRight: 8 }}>Edit</button>
                  <button>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </StyledTable>
      )}
    </div>
  );
};

export default Customers;
