import React from "react";
import AutocompleteInput, {
  type AutocompleteOption,
} from "../core/AutocompleteInput";
import { useCustomerSearch } from "../../hooks/useCustomerSearch";
import { useAuth } from "../../auth/useAuth";
import type { Customer } from "../../types/customer";

export type CustomerAutocompleteProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (customer: Customer) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
};

const CustomerAutocomplete: React.FC<CustomerAutocompleteProps> = ({
  label,
  name,
  value,
  onChange,
  onSelect,
  placeholder = "Search customers...",
  required = false,
  disabled = false,
  error,
}) => {
  const { user } = useAuth();

  const { search, options, loading, loadAllCustomers } = useCustomerSearch({
    userId: user?.uid || "",
    debounceMs: 300,
    maxResults: 5,
    minSearchLength: 2,
  });

  const handleChange = (newValue: string) => {
    onChange(newValue);
    search(newValue);
  };

  const handleSelect = (option: AutocompleteOption) => {
    if (option.customer) {
      onSelect?.(option.customer);
    }
  };

  const handleToggleDropdown = () => {
    loadAllCustomers();
  };

  return (
    <AutocompleteInput
      label={label}
      name={name}
      value={value}
      onChange={handleChange}
      onSelect={handleSelect}
      onToggleDropdown={handleToggleDropdown}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      options={options}
      loading={loading}
      error={error}
      minSearchLength={2}
      maxResults={5}
    />
  );
};

export default CustomerAutocomplete;
