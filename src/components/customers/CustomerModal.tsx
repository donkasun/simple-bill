import React, { useEffect, useMemo, useState } from "react";
import StyledInput from "../core/StyledInput";
import StyledTextarea from "../core/StyledTextarea";
import PrimaryButton from "../core/PrimaryButton";
import SecondaryButton from "../core/SecondaryButton";

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
  backdropFilter: "blur(2px)",
};

const modalStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 480,
  background: "var(--white)",
  border: "1px solid var(--brand-border)",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  marginTop: 24,
};

const CustomerModal: React.FC<CustomerModalProps> = ({
  open,
  title,
  initial,
  submitting = false,
  onSubmit,
  onCancel,
}) => {
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
        <h2 className="modal-title">{title ?? "Customer"}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <StyledInput
                label="Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Jane Doe / Acme Corp"
                required
                error={errors.name}
              />
              {errors.name && <div className="modal-error">{errors.name}</div>}
            </div>

            <div>
              <StyledInput
                label="Email (optional)"
                type="email"
                name="email"
                value={form.email ?? ""}
                onChange={handleChange}
                placeholder="billing@example.com"
              />
              {errors.email && (
                <div className="modal-error">{errors.email}</div>
              )}
            </div>

            <StyledTextarea
              label="Address"
              name="address"
              value={form.address ?? ""}
              onChange={handleChange}
              placeholder="Street, City, Country\nZIP"
              rows={4}
            />

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontSize: "var(--text-label)",
                color: "var(--brand-text-secondary)",
              }}
            >
              <input
                type="checkbox"
                name="showEmail"
                checked={!!form.showEmail}
                onChange={handleChange}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: "var(--brand-primary)",
                }}
              />
              <span>Show email on invoices/receipts</span>
            </label>
          </div>

          <div style={footerStyle}>
            <SecondaryButton
              type="button"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </SecondaryButton>
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
