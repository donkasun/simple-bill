import React, { useEffect, useMemo, useState } from "react";
import StyledInput from "../core/StyledInput";
import StyledTextarea from "../core/StyledTextarea";
import PrimaryButton from "../core/PrimaryButton";
import AutocompleteInput, {
  type AutocompleteOption,
} from "../core/AutocompleteInput";
import { useCustomerSearch } from "../../hooks/useCustomerSearch";
import { useAuth } from "../../auth/useAuth";
import type { Customer } from "../../types/customer";

export type CustomerFormData = {
  name: string;
  email?: string | null;
  address?: string | null;
  showEmail?: boolean;
};

type CustomerModalProps = {
  open: boolean;
  title?: string;
  initial?: CustomerFormData;
  submitting?: boolean;
  onSubmit: (data: CustomerFormData) => void | Promise<void>;
  onCancel: () => void;
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 480,
  background: "#fff",
  border: "1px solid rgba(52,58,64,0.2)",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  marginTop: 16,
};

const headerStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  marginBottom: 12,
};

const errorTextStyle: React.CSSProperties = {
  color: "crimson",
  fontSize: 13,
  marginTop: 6,
};

const CustomerModal: React.FC<CustomerModalProps> = ({
  open,
  title,
  initial,
  submitting = false,
  onSubmit,
  onCancel,
}) => {
  const { user } = useAuth();
  const initialState: CustomerFormData = useMemo(
    () => ({
      name: "",
      email: "",
      address: "",
      showEmail: true,
      ...(initial ?? {}),
    }),
    [initial],
  );
  const [form, setForm] = useState<CustomerFormData>(initialState);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  // Customer search hook
  const {
    search,
    options,
    loading: searchLoading,
  } = useCustomerSearch({
    userId: user?.uid || "",
    debounceMs: 300,
    maxResults: 5,
    minSearchLength: 2,
  });

  useEffect(() => {
    setForm(initialState);
    setErrors({});
  }, [initialState, open]);

  if (!open) return null;

  const validate = (): boolean => {
    const next: { name?: string; email?: string } = {};
    if (!form.name?.trim()) next.name = "Name is required";
    if (form.email && form.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim()))
        next.email = "Enter a valid email or leave it empty";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    const { name } = e.target as HTMLInputElement | HTMLTextAreaElement;
    const target = e.target as HTMLInputElement;
    if (target && target.type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: !!target.checked }));
      return;
    }
    const value = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle name input change with autocomplete
  const handleNameChange = (value: string) => {
    setForm((prev) => ({ ...prev, name: value }));
    search(value);
  };

  // Handle customer selection from autocomplete
  const handleCustomerSelect = (option: AutocompleteOption) => {
    if (option.data) {
      const customer = option.data as Customer;
      const updatedForm = {
        name: customer.name,
        email: customer.email || "",
        address: customer.address || "",
        showEmail: customer.showEmail ?? true,
      };
      setForm((prev) => ({ ...prev, ...updatedForm }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      name: form.name.trim(),
      email: form.email?.trim() || null,
      address: form.address?.trim() || null,
      showEmail: form.showEmail ?? true,
    });
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal>
      <div style={modalStyle}>
        <div style={headerStyle}>{title ?? "Customer"}</div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <AutocompleteInput
              label="Name"
              name="name"
              value={form.name}
              onChange={handleNameChange}
              onSelect={handleCustomerSelect}
              placeholder="Jane Doe / Acme Corp"
              required
              options={options}
              loading={searchLoading}
              error={errors.name}
              minSearchLength={2}
              maxResults={5}
            />
            {errors.name && <div style={errorTextStyle}>{errors.name}</div>}

            <StyledInput
              label="Email (optional)"
              type="email"
              name="email"
              value={form.email ?? ""}
              onChange={handleChange}
              placeholder="billing@example.com"
            />
            {errors.email && <div style={errorTextStyle}>{errors.email}</div>}

            <StyledTextarea
              label="Address"
              name="address"
              value={form.address ?? ""}
              onChange={handleChange}
              placeholder="Street, City, Country\nZIP"
              rows={4}
            />

            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                name="showEmail"
                checked={!!form.showEmail}
                onChange={handleChange}
              />
              <span>Show email on invoices/receipts</span>
            </label>
          </div>

          <div style={footerStyle}>
            <button type="button" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;
