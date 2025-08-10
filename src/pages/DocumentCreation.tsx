import React, { useEffect, useMemo, useReducer, useState } from 'react';
import StyledDropdown from '../components/core/StyledDropdown';
import StyledInput from '../components/core/StyledInput';
import StyledTextarea from '../components/core/StyledTextarea';
import StyledTable from '../components/core/StyledTable';
import PrimaryButton from '../components/core/PrimaryButton';
import SecondaryButton from '../components/core/SecondaryButton';
import { useAuth } from '../hooks/useAuth';
import { useFirestore, type BaseEntity } from '../hooks/useFirestore';
import { useNavigate } from 'react-router-dom';

type Customer = BaseEntity & {
  userId: string;
  name: string;
  email?: string;
  address?: string;
  showEmail?: boolean;
};

type Item = BaseEntity & {
  userId: string;
  name: string;
  unitPrice: number;
  description?: string;
};

type DocumentType = 'invoice' | 'quotation';
type DocumentStatus = 'draft' | 'finalized';

type LineItem = {
  id: string;
  itemId?: string;
  name: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  amount: number;
};

type DocumentFormState = {
  documentType: DocumentType;
  documentNumber: string;
  date: string; // yyyy-mm-dd
  customerId?: string;
  notes?: string;
  lineItems: LineItem[];
};

type DocumentLineItem = {
  itemId?: string;
  name: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  amount: number;
};

type DocumentEntity = BaseEntity & {
  userId: string;
  type: DocumentType;
  docNumber: string;
  date: string; // ISO yyyy-mm-dd
  customerId?: string;
  customerDetails?: { name?: string; email?: string; address?: string };
  items: DocumentLineItem[];
  subtotal: number;
  total: number;
  notes?: string;
  status: DocumentStatus;
  finalizedAt?: import('firebase/firestore').Timestamp;
};

type SetFieldAction =
  | { type: 'SET_FIELD'; field: 'documentType'; value: DocumentType }
  | { type: 'SET_FIELD'; field: 'documentNumber'; value: string }
  | { type: 'SET_FIELD'; field: 'date'; value: string }
  | { type: 'SET_FIELD'; field: 'customerId'; value: string | undefined }
  | { type: 'SET_FIELD'; field: 'notes'; value: string | undefined };

type Action =
  | SetFieldAction
  | { type: 'ADD_LINE_ITEM' }
  | { type: 'REMOVE_LINE_ITEM'; id: string }
  | { type: 'UPDATE_LINE_ITEM'; id: string; changes: Partial<LineItem> }
  | { type: 'SET_ITEM_SELECTION'; id: string; item?: Item };

function createEmptyLineItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    unitPrice: 0,
    quantity: 1,
    amount: 0,
  };
}

function reducer(state: DocumentFormState, action: Action): DocumentFormState {
  switch (action.type) {
    case 'SET_FIELD': {
      return { ...state, [action.field]: action.value } as DocumentFormState;
    }
    case 'ADD_LINE_ITEM': {
      return { ...state, lineItems: [...state.lineItems, createEmptyLineItem()] };
    }
    case 'REMOVE_LINE_ITEM': {
      return { ...state, lineItems: state.lineItems.filter((li) => li.id !== action.id) };
    }
    case 'UPDATE_LINE_ITEM': {
      return {
        ...state,
        lineItems: state.lineItems.map((li) =>
          li.id === action.id
            ? {
                ...li,
                ...action.changes,
                amount: computeAmount(action.changes.unitPrice ?? li.unitPrice, action.changes.quantity ?? li.quantity),
              }
            : li
        ),
      };
    }
    case 'SET_ITEM_SELECTION': {
      return {
        ...state,
        lineItems: state.lineItems.map((li) =>
          li.id === action.id
            ? action.item
              ? {
                  ...li,
                  itemId: action.item.id,
                  name: action.item.name,
                  description: action.item.description ?? li.description,
                  unitPrice: action.item.unitPrice ?? 0,
                  amount: computeAmount(action.item.unitPrice ?? 0, li.quantity),
                }
              : { ...li, itemId: undefined }
            : li
        ),
      };
    }
    default:
      return state;
  }
}

function computeAmount(unitPrice: number, quantity: number): number {
  const up = Number.isFinite(unitPrice) ? unitPrice : 0;
  const qty = Number.isFinite(quantity) ? quantity : 0;
  return Math.max(0, up * qty);
}

const todayIso = () => new Date().toISOString().slice(0, 10);

const DocumentCreation: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { items: customers, loading: loadingCustomers } = useFirestore<Customer>({
    collectionName: 'customers',
    userId: user?.uid,
    orderByField: 'createdAt',
  });
  const { items: itemCatalog, loading: loadingItems } = useFirestore<Item>({
    collectionName: 'items',
    userId: user?.uid,
    orderByField: 'createdAt',
  });

  const { add: addDocument } = useFirestore<DocumentEntity>({
    collectionName: 'documents',
    userId: user?.uid,
    subscribe: false,
  });

  const [state, dispatch] = useReducer(reducer, {
    documentType: 'invoice',
    documentNumber: '',
    date: todayIso(),
    customerId: undefined,
    notes: '',
    lineItems: [createEmptyLineItem()],
  });

  useEffect(() => {
    if (!state.customerId && customers.length > 0) {
      dispatch({ type: 'SET_FIELD', field: 'customerId', value: customers[0].id });
    }
  }, [customers, state.customerId]);

  const subtotal = useMemo(() => {
    return state.lineItems.reduce((sum, li) => sum + (Number.isFinite(li.amount) ? li.amount : 0), 0);
  }, [state.lineItems]);

  const total = subtotal; // Placeholder for future tax/discount logic

  const handleAddRow = () => dispatch({ type: 'ADD_LINE_ITEM' });
  const handleRemoveRow = (id: string) => dispatch({ type: 'REMOVE_LINE_ITEM', id });

  const findItemById = (id?: string) => itemCatalog.find((i) => i.id === id);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSaveDraft = async () => {
    setSaveError(null);
    if (!user?.uid) return;
    setSaving(true);
    try {
      const selectedCustomer = customers.find((c) => c.id === state.customerId);
      const payload: Omit<DocumentEntity, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        type: state.documentType,
        docNumber: state.documentNumber || '',
        date: state.date,
        customerId: state.customerId,
        customerDetails: selectedCustomer
          ? { name: selectedCustomer.name, email: selectedCustomer.email, address: selectedCustomer.address }
          : undefined,
        items: state.lineItems.map((li) => ({
          itemId: li.itemId,
          name: li.name,
          description: li.description,
          unitPrice: Number.isFinite(li.unitPrice) ? li.unitPrice : 0,
          quantity: Number.isFinite(li.quantity) ? li.quantity : 0,
          amount: Number.isFinite(li.amount) ? li.amount : 0,
        })),
        subtotal,
        total,
        notes: state.notes,
        status: 'draft',
      };
      const id = await addDocument(payload);
      if (id) navigate('/dashboard');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to save draft';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div className="container-xl">
        <div className="page-header">
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Create Document</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <SecondaryButton onClick={() => navigate('/dashboard')}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleSaveDraft} disabled={saving}>
              {saving ? 'Saving…' : 'Save Draft'}
            </PrimaryButton>
          </div>
        </div>

        {saveError && (
          <div role="alert" style={{ color: 'crimson', marginBottom: 12 }}>{saveError}</div>
        )}

        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <StyledDropdown
              label="Document Type"
              value={state.documentType}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'documentType', value: e.target.value as DocumentType })}
            >
              <option value="invoice">Invoice</option>
              <option value="quotation">Quotation</option>
            </StyledDropdown>

            <StyledInput
              label="Document #"
              placeholder={state.documentType === 'invoice' ? 'INV-YYYY-XXX' : 'QUO-YYYY-XXX'}
              value={state.documentNumber}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'documentNumber', value: e.target.value })}
            />

            <StyledInput
              label="Date"
              type="date"
              value={state.date}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'date', value: e.target.value })}
            />

            <StyledDropdown
              label="Bill To"
              value={state.customerId ?? ''}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'customerId', value: e.target.value || undefined })}
              disabled={loadingCustomers}
            >
              <option value="" disabled>
                {loadingCustomers ? 'Loading customers…' : 'Select a customer'}
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </StyledDropdown>
          </div>
        </div>

        <div>
          <StyledTable>
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Item</th>
                <th>Description</th>
                <th className="td-right" style={{ width: 140 }}>Unit Price</th>
                <th className="td-right" style={{ width: 120 }}>Qty</th>
                <th className="td-right" style={{ width: 140 }}>Amount</th>
                <th className="td-right" style={{ width: 90 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.lineItems.map((li) => (
                <tr key={li.id}>
                  <td>
                    <StyledDropdown
                      value={li.itemId ?? ''}
                      onChange={(e) => {
                        const selected = findItemById(e.target.value);
                        dispatch({ type: 'SET_ITEM_SELECTION', id: li.id, item: selected });
                      }}
                      disabled={loadingItems}
                    >
                      <option value="">{loadingItems ? 'Loading…' : 'Select item'}</option>
                      {itemCatalog.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name}
                        </option>
                      ))}
                    </StyledDropdown>
                    <StyledInput
                      placeholder="Custom item name"
                      value={li.name}
                      onChange={(e) => dispatch({ type: 'UPDATE_LINE_ITEM', id: li.id, changes: { name: e.target.value } })}
                      style={{ marginTop: 8 }}
                    />
                  </td>
                  <td>
                    <StyledTextarea
                      placeholder="Description"
                      value={li.description}
                      onChange={(e) => dispatch({ type: 'UPDATE_LINE_ITEM', id: li.id, changes: { description: e.target.value } })}
                    />
                  </td>
                  <td className="td-right">
                    <StyledInput
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.01}
                      value={Number.isFinite(li.unitPrice) ? String(li.unitPrice) : ''}
                      onChange={(e) =>
                        dispatch({
                          type: 'UPDATE_LINE_ITEM',
                          id: li.id,
                          changes: { unitPrice: parseFloat(e.target.value || '0') },
                        })
                      }
                    />
                  </td>
                  <td className="td-right">
                    <StyledInput
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      value={Number.isFinite(li.quantity) ? String(li.quantity) : ''}
                      onChange={(e) =>
                        dispatch({
                          type: 'UPDATE_LINE_ITEM',
                          id: li.id,
                          changes: { quantity: parseInt(e.target.value || '0', 10) },
                        })
                      }
                    />
                  </td>
                  <td className="td-right">
                    <span className="td-strong">{li.amount.toFixed(2)}</span>
                  </td>
                  <td className="td-right">
                    <button className="link-btn link-danger" onClick={() => handleRemoveRow(li.id)} disabled={state.lineItems.length <= 1}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </StyledTable>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <SecondaryButton onClick={handleAddRow}>Add Line Item</SecondaryButton>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Subtotal</div>
                <div className="td-strong" style={{ textAlign: 'right' }}>{subtotal.toFixed(2)}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Total</div>
                <div className="td-strong" style={{ textAlign: 'right', fontSize: 18 }}>{total.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 16, marginTop: 16 }}>
          <StyledTextarea
            label="Notes"
            placeholder="Additional notes for the customer"
            value={state.notes}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'notes', value: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentCreation;


