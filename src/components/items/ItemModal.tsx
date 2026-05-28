import React, { useEffect, useMemo, useState } from "react";
import StyledInput from "../core/StyledInput";
import StyledTextarea from "../core/StyledTextarea";
import Button from "../core/Button";

export type ItemFormData = {
  name: string;
  unitPrice: number;
  description?: string;
};

type ItemModalProps = {
  open: boolean;
  title?: string;
  initial?: ItemFormData;
  submitting?: boolean;
  onSubmit: (data: ItemFormData) => void | Promise<void>;
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

const ItemModal: React.FC<ItemModalProps> = ({
  open,
  title,
  initial,
  submitting = false,
  onSubmit,
  onCancel,
}) => {
  const initialState = useMemo(
    () => ({
      name: "",
      unitPrice: (initial?.unitPrice ?? 0).toString(),
      description: initial?.description ?? "",
    }),
    [initial],
  );

  const [form, setForm] = useState<{
    name: string;
    unitPrice: string;
    description: string;
  }>(initialState);
  const [errors, setErrors] = useState<{ name?: string; unitPrice?: string }>(
    {},
  );

  useEffect(() => {
    setForm(initialState);
    setErrors({});
  }, [initialState, open]);

  if (!open) return null;

  const validate = (): boolean => {
    const next: { name?: string; unitPrice?: string } = {};
    if (!form.name?.trim()) next.name = "Name is required";
    const parsed = Number(form.unitPrice);
    if (Number.isNaN(parsed)) next.unitPrice = "Enter a valid price";
    else if (parsed < 0) next.unitPrice = "Price cannot be negative";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value } = e.target as HTMLInputElement | HTMLTextAreaElement;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const price = Number(form.unitPrice);
    await onSubmit({
      name: form.name.trim(),
      unitPrice: price,
      description: form.description?.trim() || undefined,
    });
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal>
      <div style={modalStyle}>
        <h2 className="modal-title">{title ?? "Item"}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <StyledInput
                label="Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Service or product name"
                required
              />
              {errors.name && <div className="modal-error">{errors.name}</div>}
            </div>

            <div>
              <StyledInput
                label="Unit Price"
                type="number"
                name="unitPrice"
                value={form.unitPrice}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
              {errors.unitPrice && (
                <div className="modal-error">{errors.unitPrice}</div>
              )}
            </div>

            <StyledTextarea
              label="Description (optional)"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Details about this item"
              rows={4}
            />
          </div>

          <div style={footerStyle}>
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemModal;
