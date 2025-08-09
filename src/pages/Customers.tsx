import React from "react";
import StyledTable from "../components/core/StyledTable";
import PrimaryButton from "../components/core/PrimaryButton";
import { useAuth } from "../hooks/useAuth";
import { useFirestore, type BaseEntity } from "../hooks/useFirestore";

type Customer = BaseEntity & {
  userId: string;
  name: string;
  email: string;
  address?: string;
};

const Customers: React.FC = () => {
  const { user } = useAuth();
  const { items, loading, error, add, remove } = useFirestore<Customer>({
    collectionName: "customers",
    userId: user?.uid,
    orderByField: "createdAt",
  });

  return (
    <div style={{ padding: "1rem" }}>
      <div className="container-xl">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
            Customers
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            <PrimaryButton
              onClick={async () => {
                const name = window.prompt("Customer name");
                if (!name) return;
                const email = window.prompt("Customer email") ?? "";
                const address = window.prompt("Customer address") ?? "";
                await add({ name, email, address, userId: user?.uid || "" });
              }}
            >
              Add New Customer
            </PrimaryButton>
          </div>
        </div>

        {loading && <div>Loading customers…</div>}
        {error && (
          <div role="alert" style={{ color: "crimson" }}>
            {error}
          </div>
        )}

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
                  <td>{c.address ?? "-"}</td>
                  <td>
                    <button style={{ marginRight: 8 }}>Edit</button>
                    <button
                      onClick={async () => {
                        if (c.id && window.confirm("Delete this customer?"))
                          await remove(c.id);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </StyledTable>
        )}
      </div>
    </div>
  );
};

export default Customers;
