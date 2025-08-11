import React, { useEffect, useMemo, useReducer, useState } from 'react';
import StyledDropdown from '../components/core/StyledDropdown';
import StyledInput from '../components/core/StyledInput';
import StyledTextarea from '../components/core/StyledTextarea';
import StyledTable from '../components/core/StyledTable';
import PrimaryButton from '../components/core/PrimaryButton';
import SecondaryButton from '../components/core/SecondaryButton';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { useNavigate, useParams } from 'react-router-dom';
import { generateDocumentPdf } from '../utils/pdf';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { DocumentEntity as PersistedDocumentEntity, DocumentFormState, FormLineItem, DocumentType } from '../types/document';
import type { Customer } from '../types/customer';
import type { Item } from '../types/item';
import { allocateNextDocumentNumber } from '../utils/docNumber';
import { formatCurrency } from '../utils/currency';

type DocumentStatus = 'draft' | 'finalized';

type LineItem = FormLineItem;

// Use DocumentFormState from types

// Use shared Customer and Item types

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
  | { type: 'SET_ITEM_SELECTION'; id: string; item?: Item }
  | { type: 'SET_ALL'; value: DocumentFormState };

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

import { computeAmount, computeSubtotal } from '../utils/documentMath';

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
                amount: computeAmount(
                  action.changes.unitPrice ?? li.unitPrice,
                  action.changes.quantity ?? li.quantity
                ),
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
    case 'SET_ALL': {
      return action.value;
    }
    default:
      return state;
  }
}

import { todayIso } from '../utils/date';

const DocumentEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
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

  const { set: setDocument } = useFirestore<PersistedDocumentEntity>({
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

  const [initializing, setInitializing] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>('draft');

  useEffect(() => {
    let mounted = true;
    async function loadDocument() {
      if (!id) {
        setLoadError('Missing document id');
        setInitializing(false);
        return;
      }
      try {
        const ref = doc(db, 'documents', id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          if (!mounted) return;
          setLoadError('Document not found');
          setInitializing(false);
          return;
        }
        const data = snap.data() as PersistedDocumentEntity;
        if (!mounted) return;
        setDocumentStatus(data.status);
        const items: LineItem[] = (data.items ?? []).map((it) => ({
          id: crypto.randomUUID(),
          itemId: it.itemId,
          name: it.name,
          description: it.description,
          unitPrice: Number.isFinite(it.unitPrice) ? it.unitPrice : 0,
          quantity: Number.isFinite(it.quantity) ? it.quantity : 0,
          amount: Number.isFinite(it.amount) ? it.amount : computeAmount(it.unitPrice ?? 0, it.quantity ?? 0),
        }));
        dispatch({
          type: 'SET_ALL',
          value: {
            documentType: data.type,
            documentNumber: data.docNumber ?? '',
            date: data.date,
            customerId: data.customerId,
            notes: data.notes,
            lineItems: items.length > 0 ? items : [createEmptyLineItem()],
          },
        });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to load document';
        setLoadError(message);
      } finally {
        if (mounted) setInitializing(false);
      }
    }
    loadDocument();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!state.customerId && customers.length > 0) {
      dispatch({ type: 'SET_FIELD', field: 'customerId', value: customers[0].id });
    }
  }, [customers, state.customerId]);

  const subtotal = useMemo(() => computeSubtotal(state.lineItems), [state.lineItems]);

  const total = subtotal;

  const findItemById = (itemId?: string) => itemCatalog.find((i) => i.id === itemId);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  // Validation state will be added in a follow-up extraction shared with creation page

  const handleSaveChanges = async () => {
    setSaveError(null);
    if (!id || !user?.uid) return;
    setSaving(true);
    try {
      const selectedCustomer = customers.find((c) => c.id === state.customerId);
      const docNumber = state.documentNumber?.trim()
        ? state.documentNumber.trim()
        : await allocateNextDocumentNumber(user.uid, state.documentType, state.date);
      const payload: Partial<PersistedDocumentEntity> = {
        type: state.documentType,
        docNumber,
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
      await setDocument(id, payload);
      navigate('/dashboard');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to save changes';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizeAndDownload = async () => {
    setFinalizeError(null);
    if (!id || !user?.uid) return;
    setFinalizing(true);
    try {
      const selectedCustomer = customers.find((c) => c.id === state.customerId);
      const docNumber = state.documentNumber?.trim()
        ? state.documentNumber.trim()
        : await allocateNextDocumentNumber(user.uid, state.documentType, state.date);
      const payload: Partial<PersistedDocumentEntity> = {
        type: state.documentType,
        docNumber,
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
        status: 'finalized',
        finalizedAt: serverTimestamp() as unknown as import('firebase/firestore').Timestamp,
      };

      await setDocument(id, payload);

      const pdfBytes = await generateDocumentPdf({
        type: payload.type as DocumentType,
        docNumber: payload.docNumber || '',
        date: payload.date as string,
        customerDetails: payload.customerDetails,
        items: (payload.items || []).map((it) => ({
          name: it.name,
          description: it.description,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          amount: it.amount,
        })),
        subtotal: payload.subtotal as number,
        total: payload.total as number,
      });
      const { getDocumentFilename } = await import('../utils/documents');
      const { downloadBlob } = await import('../utils/download');
      const filename = `${getDocumentFilename(payload.type as DocumentType, payload.docNumber as string, payload.date as string)}.pdf`;
      downloadBlob(filename, pdfBytes, 'application/pdf');

      navigate('/dashboard');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to finalize & download';
      setFinalizeError(message);
    } finally {
      setFinalizing(false);
    }
  };

  const canEdit = documentStatus === 'draft';

  const headerTitle = 'Edit Document';

  return (
    <div style={{ padding: '1rem' }}>
      <div className="container-xl">
        <div className="page-header">
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{headerTitle}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <SecondaryButton onClick={() => navigate('/dashboard')}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleSaveChanges} disabled={saving || finalizing || initializing || !canEdit}>
              {saving ? 'Saving…' : 'Save Changes'}
            </PrimaryButton>
            <PrimaryButton onClick={handleFinalizeAndDownload} disabled={saving || finalizing || initializing || !canEdit}>
              {finalizing ? 'Finalizing…' : 'Finalize & Download PDF'}
            </PrimaryButton>
          </div>
        </div>

        {initializing && <div>Loading document…</div>}
        {loadError && (
          <div role="alert" style={{ color: 'crimson', marginBottom: 12 }}>{loadError}</div>
        )}
        {!canEdit && !initializing && !loadError && (
          <div role="alert" style={{ color: '#8a6d3b', background: '#fcf8e3', padding: 12, borderRadius: 6, marginBottom: 12 }}>
            This document has been finalized and cannot be edited.
          </div>
        )}
        {saveError && (
          <div role="alert" style={{ color: 'crimson', marginBottom: 12 }}>{saveError}</div>
        )}
        {finalizeError && (
          <div role="alert" style={{ color: 'crimson', marginBottom: 12 }}>{finalizeError}</div>
        )}

        {!initializing && !loadError && (
          <>
            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <StyledDropdown
                  label="Document Type"
                  value={state.documentType}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'documentType', value: e.target.value as DocumentType })}
                  disabled={!canEdit}
                >
                  <option value="invoice">Invoice</option>
                  <option value="quotation">Quotation</option>
                </StyledDropdown>

                <StyledInput
                  label="Document #"
                  placeholder={state.documentType === 'invoice' ? 'INV-YYYY-XXX' : 'QUO-YYYY-XXX'}
                  value={state.documentNumber}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'documentNumber', value: e.target.value })}
                  disabled={!canEdit}
                />

                <StyledInput
                  label="Date"
                  type="date"
                  value={state.date}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'date', value: e.target.value })}
                  disabled={!canEdit}
                />

                <StyledDropdown
                  label="Bill To"
                  value={state.customerId ?? ''}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'customerId', value: e.target.value || undefined })}
                  disabled={loadingCustomers || !canEdit}
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
                          disabled={loadingItems || !canEdit}
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
                          disabled={!canEdit}
                        />
                      </td>
                      <td>
                        <StyledTextarea
                          placeholder="Description"
                          value={li.description}
                          onChange={(e) => dispatch({ type: 'UPDATE_LINE_ITEM', id: li.id, changes: { description: e.target.value } })}
                          disabled={!canEdit}
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
                          disabled={!canEdit}
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
                          disabled={!canEdit}
                        />
                      </td>
                      <td className="td-right">
                        <span className="td-strong">{formatCurrency(li.amount)}</span>
                      </td>
                      <td className="td-right">
                        <button
                          className="link-btn link-danger"
                          onClick={() => dispatch({ type: 'REMOVE_LINE_ITEM', id: li.id })}
                          disabled={state.lineItems.length <= 1 || !canEdit}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </StyledTable>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <SecondaryButton onClick={() => dispatch({ type: 'ADD_LINE_ITEM' })} disabled={!canEdit}>Add Line Item</SecondaryButton>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                  <div>
                    <div className="muted" style={{ fontSize: 12 }}>Subtotal</div>
                    <div className="td-strong" style={{ textAlign: 'right' }}>{formatCurrency(subtotal)}</div>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 12 }}>Total</div>
                    <div className="td-strong" style={{ textAlign: 'right', fontSize: 18 }}>{formatCurrency(total)}</div>
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
                disabled={!canEdit}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentEdit;


