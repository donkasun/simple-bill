import { useCallback, useEffect, useReducer } from 'react';
import type { DocumentFormState, FormLineItem, DocumentType } from '../types/document';
import type { Item } from '../types/item';
import type { Customer } from '../types/customer';
import { todayIso } from '../utils/date';
import { computeAmount } from '../utils/documentMath';

export type HeaderErrors = {
  documentType?: string;
  date?: string;
  customerId?: string;
};

export type LineItemFieldErrors = {
  name?: string;
  unitPrice?: string;
  quantity?: string;
};

export type ValidationResult = {
  header: HeaderErrors;
  items: Record<string, LineItemFieldErrors>;
};

export function createEmptyLineItem(): FormLineItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    unitPrice: 0,
    quantity: 1,
    amount: 0,
  };
}

export function getDefaultInitialState(): DocumentFormState {
  return {
    documentType: 'invoice',
    documentNumber: '',
    date: todayIso(),
    customerId: undefined,
    notes: '',
    lineItems: [createEmptyLineItem()],
  };
}

export type FormAction =
  | { type: 'SET_FIELD'; field: 'documentType'; value: DocumentType }
  | { type: 'SET_FIELD'; field: 'documentNumber'; value: string }
  | { type: 'SET_FIELD'; field: 'date'; value: string }
  | { type: 'SET_FIELD'; field: 'customerId'; value: string | undefined }
  | { type: 'SET_FIELD'; field: 'notes'; value: string | undefined }
  | { type: 'ADD_LINE_ITEM' }
  | { type: 'REMOVE_LINE_ITEM'; id: string }
  | { type: 'UPDATE_LINE_ITEM'; id: string; changes: Partial<FormLineItem> }
  | { type: 'SET_ITEM_SELECTION'; id: string; item?: Item }
  | { type: 'SET_ALL'; value: DocumentFormState };

function reducer(state: DocumentFormState, action: FormAction): DocumentFormState {
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

export type UseDocumentFormOptions = {
  initial?: DocumentFormState;
  customers?: Customer[];
  itemCatalog?: Item[];
  canEdit?: boolean;
};

function isMutatingAction(action: FormAction): boolean {
  return action.type !== 'SET_ALL';
}

export function useDocumentForm(options?: UseDocumentFormOptions) {
  const { initial, customers, itemCatalog, canEdit = true } = options ?? {};
  const [state, rawDispatch] = useReducer(reducer, initial ?? getDefaultInitialState());

  const dispatch = useCallback(
    (action: FormAction) => {
      if (!canEdit && isMutatingAction(action)) return;
      rawDispatch(action);
    },
    [canEdit]
  );

  useEffect(() => {
    if (!canEdit) return;
    if (!state.customerId && customers && customers.length > 0) {
      rawDispatch({ type: 'SET_FIELD', field: 'customerId', value: customers[0].id });
    }
  }, [customers, state.customerId, canEdit]);

  const addLine = useCallback(() => dispatch({ type: 'ADD_LINE_ITEM' }), [dispatch]);
  const removeLine = useCallback((id: string) => dispatch({ type: 'REMOVE_LINE_ITEM', id }), [dispatch]);
  const changeLine = useCallback((id: string, changes: Partial<FormLineItem>) => dispatch({ type: 'UPDATE_LINE_ITEM', id, changes }), [dispatch]);
  const setField = useCallback(<K extends keyof DocumentFormState>(field: K, value: DocumentFormState[K]) => dispatch({ type: 'SET_FIELD', field: field as any, value: value as any }), [dispatch]);
  const selectItemById = useCallback(
    (lineId: string, itemId?: string) => {
      const selected = itemId ? itemCatalog?.find((i) => i.id === itemId) : undefined;
      dispatch({ type: 'SET_ITEM_SELECTION', id: lineId, item: selected });
    },
    [dispatch, itemCatalog]
  );

  return { state, dispatch, addLine, removeLine, changeLine, setField, selectItemById } as const;
}

export function validateDraft(s: DocumentFormState): ValidationResult {
  const header: HeaderErrors = {};
  const items: Record<string, LineItemFieldErrors> = {};
  if (!s.documentType) header.documentType = 'Document type is required';
  if (!s.date?.trim()) header.date = 'Date is required';
  for (const li of s.lineItems) {
    const err: LineItemFieldErrors = {};
    if (!Number.isFinite(li.unitPrice) || li.unitPrice < 0) err.unitPrice = 'Unit price must be ≥ 0';
    if (!Number.isFinite(li.quantity) || li.quantity < 0) err.quantity = 'Quantity must be ≥ 0';
    if (Object.keys(err).length > 0) items[li.id] = err;
  }
  return { header, items };
}

export function validateFinalize(s: DocumentFormState): ValidationResult {
  const header: HeaderErrors = {};
  const items: Record<string, LineItemFieldErrors> = {};
  if (!s.documentType) header.documentType = 'Document type is required';
  if (!s.date?.trim()) header.date = 'Date is required';
  if (!s.customerId) header.customerId = 'Customer is required to finalize';
  for (const li of s.lineItems) {
    const err: LineItemFieldErrors = {};
    if (!li.name?.trim()) err.name = 'Item name is required';
    if (!Number.isFinite(li.unitPrice) || li.unitPrice < 0) err.unitPrice = 'Unit price must be ≥ 0';
    if (!Number.isFinite(li.quantity) || li.quantity < 1) err.quantity = 'Quantity must be ≥ 1';
    if (Object.keys(err).length > 0) items[li.id] = err;
  }
  return { header, items };
}


