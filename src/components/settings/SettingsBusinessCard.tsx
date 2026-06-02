import React, { useEffect, useState } from "react";
import Button from "@components/core/Button";

type BusinessInfo = {
  name?: string;
  email?: string;
  address?: string;
};

type SettingsBusinessCardProps = {
  business: BusinessInfo;
  onSave: (info: BusinessInfo) => Promise<void>;
};

const SettingsBusinessCard: React.FC<SettingsBusinessCardProps> = ({
  business,
  onSave,
}) => {
  const [name, setName] = useState(business.name ?? "");
  const [email, setEmail] = useState(business.email ?? "");
  const [address, setAddress] = useState(business.address ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(business.name ?? "");
    setEmail(business.email ?? "");
    setAddress(business.address ?? "");
  }, [business.name, business.email, business.address]);

  const isDirty =
    name !== (business.name ?? "") ||
    email !== (business.email ?? "") ||
    address !== (business.address ?? "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
        address: address.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="settings-card"
      aria-labelledby="settings-business-title"
    >
      <h2 id="settings-business-title" className="page-card-title">
        Your business
      </h2>
      <p className="settings-card__helper">
        Shown in the "From" section of your PDF invoices and quotations.
      </p>

      <form className="settings-business-form" onSubmit={handleSave}>
        <div className="settings-business-form__field settings-business-form__field--name">
          <label htmlFor="biz-name" className="settings-business-form__label">
            Business name
          </label>
          <input
            id="biz-name"
            type="text"
            className="styled-input"
            placeholder="e.g. Kusal & Co."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="settings-business-form__field settings-business-form__field--email">
          <label htmlFor="biz-email" className="settings-business-form__label">
            Email
          </label>
          <input
            id="biz-email"
            type="email"
            className="styled-input"
            placeholder="e.g. hello@yourco.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="settings-business-form__field settings-business-form__field--address">
          <label
            htmlFor="biz-address"
            className="settings-business-form__label"
          >
            Address
          </label>
          <textarea
            id="biz-address"
            className="styled-textarea"
            rows={4}
            placeholder={"e.g. 42 Galle Road\nColombo 3\nSri Lanka"}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="settings-business-form__actions">
          <Button type="submit" disabled={!isDirty || saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </section>
  );
};

export default SettingsBusinessCard;
