import React, { useState } from 'react';
import StyledTable from '../components/core/StyledTable';
import PrimaryButton from '../components/core/PrimaryButton';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import ItemModal, { type ItemFormData } from '../components/items/ItemModal';
import type { Item } from '../types/item';

const Items: React.FC = () => {
  const { user } = useAuth();
  type ItemRow = Item & { unitPriceLabel: string };
  const { items, loading, error, add, update, remove } = useFirestore<Item, ItemRow>({
    collectionName: 'items',
    userId: user?.uid,
    orderByField: 'createdAt',
    select: (it) => ({ ...it, unitPriceLabel: it.unitPrice.toFixed(2) }),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const handleAddClick = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEditClick = (it: Item) => {
    setEditingItem(it);
    setModalOpen(true);
  };

  const handleSubmit = async (data: ItemFormData) => {
    setPageError(null);
    setModalSubmitting(true);
    try {
      if (editingItem?.id) {
        await update(editingItem.id, {
          name: data.name,
          unitPrice: data.unitPrice,
          description: data.description ?? '',
        });
      } else {
        await add({
          name: data.name,
          unitPrice: data.unitPrice,
          description: data.description ?? '',
          userId: user?.uid || '',
        });
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save item';
      setPageError(message);
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div className="container-xl">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Items</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <PrimaryButton onClick={handleAddClick}>Add New Item</PrimaryButton>
          </div>
        </div>

        {loading && <div>Loading items…</div>}
        {(error || pageError) && (
          <div role="alert" style={{ color: 'crimson' }}>
            {error || pageError}
          </div>
        )}

        {!loading && !error && (
          <StyledTable>
            <thead>
              <tr>
                <th>Name</th>
                <th className="td-right">Unit Price</th>
                <th>Description</th>
                <th className="td-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>{it.name}</td>
                  <td className="td-right">{it.unitPriceLabel}</td>
                  <td>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{it.description ?? '-'}</div>
                  </td>
                  <td className="td-right">
                    <div className="actions">
                      <button className="link-btn" onClick={() => handleEditClick(it)}>Edit</button>
                      <button
                        className="link-btn link-danger"
                        onClick={async () => {
                          if (it.id && window.confirm('Delete this item?')) await remove(it.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </StyledTable>
        )}

        <ItemModal
          open={modalOpen}
          title={editingItem ? 'Edit Item' : 'Add Item'}
          initial={
            editingItem
              ? {
                  name: editingItem.name,
                  unitPrice: editingItem.unitPrice,
                  description: editingItem.description,
                }
              : undefined
          }
          submitting={modalSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default Items;
