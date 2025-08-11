import React, { useEffect, useMemo, useReducer, useState } from 'react';
import StyledDropdown from '../components/core/StyledDropdown';
import StyledInput from '../components/core/StyledInput';
import StyledTextarea from '../components/core/StyledTextarea';
import StyledTable from '../components/core/StyledTable';
import PrimaryButton from '../components/core/PrimaryButton';
import SecondaryButton from '../components/core/SecondaryButton';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { useNavigate } from 'react-router-dom';
import { generateDocumentPdf } from '../utils/pdf';
import { serverTimestamp } from 'firebase/firestore';
import { allocateNextDocumentNumber } from '../utils/docNumber';
import { formatCurrency } from '../utils/currency';
import type { DocumentEntity, DocumentFormState, FormLineItem, DocumentType } from '../types/document';
import type { Customer } from '../types/customer';
import type { Item } from '../types/item';
import { computeAmount, computeSubtotal } from '../utils/documentMath';
import { todayIso } from '../utils/date';
import { buildDocumentPayload, selectCustomerDetails, getDocumentFilename, getDocNumberPlaceholder } from '../utils/documents';
import { downloadBlob } from '../utils/download';

type LineItem = FormLineItem;

type HeaderErrors = {
  documentType?: string;
  date?: string;
  customerId?: string;
};

type LineItemFieldErrors = {
  name?: string;
  unitPrice?: string;
  quantity?: string;
};

type ValidationResult = {
  header: HeaderErrors;
  items: Record<string, LineItemFieldErrors>;
};

// DocumentEntity comes from types

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

// computeAmount and todayIso imported from utils

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

  const subtotal = useMemo(() => computeSubtotal(state.lineItems), [state.lineItems]);

  const total = subtotal; // Placeholder for future tax/discount logic

  const handleAddRow = () => dispatch({ type: 'ADD_LINE_ITEM' });
  const handleRemoveRow = (id: string) => dispatch({ type: 'REMOVE_LINE_ITEM', id });

  const findItemById = (id?: string) => itemCatalog.find((i) => i.id === id);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [headerErrors, setHeaderErrors] = useState<HeaderErrors>({});
  const [itemErrors, setItemErrors] = useState<Record<string, LineItemFieldErrors>>({});

  function validateDraft(s: DocumentFormState): ValidationResult {
    const header: HeaderErrors = {};
    const items: Record<string, LineItemFieldErrors> = {};
    if (!s.documentType) header.documentType = 'Document type is required';
    if (!s.date?.trim()) header.date = 'Date is required';
    if (!Array.isArray(s.lineItems) || s.lineItems.length === 0) {
      // Ensure at least one row; UI always keeps one, but guard anyway
    }
    for (const li of s.lineItems) {
      const err: LineItemFieldErrors = {};
      if (!Number.isFinite(li.unitPrice) || li.unitPrice < 0) err.unitPrice = 'Unit price must be ≥ 0';
      if (!Number.isFinite(li.quantity) || li.quantity < 0) err.quantity = 'Quantity must be ≥ 0';
      if (Object.keys(err).length > 0) items[li.id] = err;
    }
    return { header, items };
  }

  function validateFinalize(s: DocumentFormState): ValidationResult {
    const header: HeaderErrors = {};
    const items: Record<string, LineItemFieldErrors> = {};
    if (!s.documentType) header.documentType = 'Document type is required';
    if (!s.date?.trim()) header.date = 'Date is required';
    if (!s.customerId) header.customerId = 'Customer is required to finalize';
    if (!Array.isArray(s.lineItems) || s.lineItems.length === 0) {
      // UI enforces at least one line item; keep branch for clarity without empty block
    }
    for (const li of s.lineItems) {
      const err: LineItemFieldErrors = {};
      if (!li.name?.trim()) err.name = 'Item name is required';
      if (!Number.isFinite(li.unitPrice) || li.unitPrice < 0) err.unitPrice = 'Unit price must be ≥ 0';
      if (!Number.isFinite(li.quantity) || li.quantity < 1) err.quantity = 'Quantity must be ≥ 1';
      if (Object.keys(err).length > 0) items[li.id] = err;
    }
    return { header, items };
  }

  const finalizeDisabled = useMemo(() => {
    const res = validateFinalize(state);
    return (
      Object.keys(res.header).length > 0 ||
      Object.keys(res.items).length > 0
    );
  }, [state]);

  function focusFirstError(res: ValidationResult) {
    const orderHeaderIds = [
      res.header.documentType ? 'doc-documentType' : null,
      res.header.date ? 'doc-date' : null,
      res.header.customerId ? 'doc-customerId' : null,
    ].filter(Boolean) as string[];
    if (orderHeaderIds.length > 0) {
      document.getElementById(orderHeaderIds[0])?.focus();
      return;
    }
    for (const li of state.lineItems) {
      const e = res.items[li.id];
      if (!e) continue;
      const id = e.name
        ? `li-${li.id}-name`
        : e.unitPrice
        ? `li-${li.id}-unitPrice`
        : e.quantity
        ? `li-${li.id}-quantity`
        : null;
      if (id) {
        document.getElementById(id)?.focus();
        return;
      }
    }
  }

  const handleSaveDraft = async () => {
    setSaveError(null);
    if (!user?.uid) return;
    setSaving(true);
    try {
      const validation = validateDraft(state);
      setHeaderErrors(validation.header);
      setItemErrors(validation.items);
      const hasErrors = Object.keys(validation.header).length > 0 || Object.keys(validation.items).length > 0;
      if (hasErrors) {
        setSaveError('Please fix the highlighted fields before saving the draft.');
        focusFirstError(validation);
        return;
      }
      // kept for parity with edit page structure
      const autoDocNumber = state.documentNumber?.trim()
        ? state.documentNumber.trim()
        : await allocateNextDocumentNumber(user.uid, state.documentType, state.date);
      const payload = buildDocumentPayload(
        user.uid,
        state,
        'draft',
        autoDocNumber,
        selectCustomerDetails(customers, state.customerId),
        { subtotal, total }
      );
      const id = await addDocument(payload);
      if (id) navigate('/dashboard');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to save draft';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizeAndDownload = async () => {
    setFinalizeError(null);
    if (!user?.uid) return;
    setFinalizing(true);
    try {
      const validation = validateFinalize(state);
      setHeaderErrors(validation.header);
      setItemErrors(validation.items);
      const hasErrors = Object.keys(validation.header).length > 0 || Object.keys(validation.items).length > 0;
      if (hasErrors) {
        setFinalizeError('Please resolve the errors to finalize.');
        focusFirstError(validation);
        return;
      }
      // kept for parity with edit page structure
      const autoDocNumber = state.documentNumber?.trim()
        ? state.documentNumber.trim()
        : await allocateNextDocumentNumber(user.uid, state.documentType, state.date);
      const payload = {
        ...buildDocumentPayload(
          user.uid,
          state,
          'finalized',
          autoDocNumber,
          selectCustomerDetails(customers, state.customerId),
          { subtotal, total }
        ),
        finalizedAt: serverTimestamp() as unknown as import('firebase/firestore').Timestamp,
      } as Omit<DocumentEntity, 'id' | 'createdAt' | 'updatedAt'> & { finalizedAt: import('firebase/firestore').Timestamp };

      // Save finalized doc
      const id = await addDocument(payload);

      // Generate PDF and download
      const pdfBytes = await generateDocumentPdf({
        type: payload.type,
        docNumber: payload.docNumber,
        date: payload.date,
        customerDetails: payload.customerDetails,
        items: payload.items,
        subtotal: payload.subtotal,
        total: payload.total,
      });
      const filename = `${getDocumentFilename(payload.type, payload.docNumber, payload.date)}.pdf`;
      downloadBlob(filename, pdfBytes, 'application/pdf');

      if (id) navigate('/dashboard');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to finalize & download'
      setFinalizeError(message);
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div className="container-xl">
        <div className="page-header">
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Create Document</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <SecondaryButton onClick={() => navigate('/dashboard')}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleSaveDraft} disabled={saving || finalizing} aria-disabled={saving || finalizing}>
              {saving ? 'Saving…' : 'Save Draft'}
            </PrimaryButton>
            <PrimaryButton onClick={handleFinalizeAndDownload} disabled={saving || finalizing || finalizeDisabled} aria-disabled={saving || finalizing || finalizeDisabled}>
              {finalizing ? 'Finalizing…' : 'Finalize & Download PDF'}
            </PrimaryButton>
          </div>
        </div>

        {saveError && (
          <div role="alert" style={{ color: 'crimson', marginBottom: 12 }}>{saveError}</div>
        )}
        {finalizeError && (
          <div role="alert" style={{ color: 'crimson', marginBottom: 12 }}>{finalizeError}</div>
        )}

        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <StyledDropdown
              label="Document Type"
              id="doc-documentType"
              value={state.documentType}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'documentType', value: e.target.value as DocumentType })}
              required
              error={headerErrors.documentType}
            >
              <option value="invoice">Invoice</option>
              <option value="quotation">Quotation</option>
            </StyledDropdown>

            <StyledInput
              label="Document #"
              placeholder={getDocNumberPlaceholder(state.documentType)}
              value={state.documentNumber}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'documentNumber', value: e.target.value })}
            />

            <StyledInput
              label="Date"
              type="date"
              id="doc-date"
              value={state.date}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'date', value: e.target.value })}
              required
              error={headerErrors.date}
            />

            <StyledDropdown
              label="Bill To"
              id="doc-customerId"
              value={state.customerId ?? ''}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'customerId', value: e.target.value || undefined })}
              disabled={loadingCustomers}
              required={false}
              error={headerErrors.customerId}
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
                      id={`li-${li.id}-name`}
                      value={li.name}
                      onChange={(e) => dispatch({ type: 'UPDATE_LINE_ITEM', id: li.id, changes: { name: e.target.value } })}
                      style={{ marginTop: 8 }}
                      error={itemErrors[li.id]?.name}
                      required={false}
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
                      id={`li-${li.id}-unitPrice`}
                      value={Number.isFinite(li.unitPrice) ? String(li.unitPrice) : ''}
                      onChange={(e) =>
                        dispatch({
                          type: 'UPDATE_LINE_ITEM',
                          id: li.id,
                          changes: { unitPrice: parseFloat(e.target.value || '0') },
                        })
                      }
                      error={itemErrors[li.id]?.unitPrice}
                    />
                  </td>
                  <td className="td-right">
                    <StyledInput
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      id={`li-${li.id}-quantity`}
                      value={Number.isFinite(li.quantity) ? String(li.quantity) : ''}
                      onChange={(e) =>
                        dispatch({
                          type: 'UPDATE_LINE_ITEM',
                          id: li.id,
                          changes: { quantity: parseInt(e.target.value || '0', 10) },
                        })
                      }
                      error={itemErrors[li.id]?.quantity}
                    />
                  </td>
                  <td className="td-right">
                    <span className="td-strong">{formatCurrency(li.amount)}</span>
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
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentCreation;


