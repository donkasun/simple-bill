import React, { useState, useEffect, useRef, useCallback } from "react";
import StyledInput from "./StyledInput";

export type AutocompleteOption = {
  id: string;
  label: string;
  value: string;
  customer?: {
    id?: string;
    name: string;
    email?: string | null;
    address?: string | null;
    showEmail?: boolean;
  };
};

export type AutocompleteInputProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (option: AutocompleteOption) => void;
  onToggleDropdown?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options: AutocompleteOption[];
  loading?: boolean;
  error?: string;
  minSearchLength?: number;
  maxResults?: number;
  highlightMatch?: boolean;
};

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  label,
  name,
  value,
  onChange,
  onSelect,
  onToggleDropdown,
  placeholder,
  required = false,
  disabled = false,
  options = [],
  loading = false,
  error,
  minSearchLength = 2,
  maxResults = 5,
  highlightMatch = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update input value when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle option selection
  const handleSelect = useCallback(
    (option: AutocompleteOption) => {
      setInputValue(option.label);
      onChange(option.label);
      setIsOpen(false);
      setHighlightedIndex(-1);
      onSelect?.(option);
    },
    [onChange, onSelect],
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || options.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : options.length - 1,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < options.length) {
            handleSelect(options[highlightedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    },
    [isOpen, options, highlightedIndex, handleSelect],
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    // Show dropdown if we have enough characters and options
    const shouldShowDropdown =
      newValue.length >= minSearchLength && options.length > 0;

    setIsOpen(shouldShowDropdown);
    setHighlightedIndex(-1);
  };

  // Highlight matching text in option label
  const highlightText = (text: string, searchTerm: string) => {
    if (!highlightMatch || !searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          style={{ backgroundColor: "yellow", fontWeight: "bold" }}
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  // Filter and limit options
  const filteredOptions = options.slice(0, maxResults);

  // Handle dropdown toggle
  const handleToggleDropdown = () => {
    onToggleDropdown?.();
    setIsOpen(!isOpen);
    setHighlightedIndex(-1);
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <StyledInput
          label={label}
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.length >= minSearchLength && options.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          error={error}
        />
        <button
          type="button"
          onClick={handleToggleDropdown}
          disabled={disabled}
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            color: "#666",
            fontSize: "12px",
            transition: "transform 0.2s ease",
            transform: `translateY(-50%) rotate(${isOpen ? 180 : 0}deg)`,
            zIndex: 10,
          }}
          aria-label="Toggle dropdown"
        >
          ▼
        </button>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            zIndex: 1000,
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {loading ? (
            <div style={{ padding: "8px 12px", color: "#666" }}>
              Searching...
            </div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.id}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  backgroundColor:
                    index === highlightedIndex ? "#f0f0f0" : "transparent",
                  borderBottom:
                    index < filteredOptions.length - 1
                      ? "1px solid #eee"
                      : "none",
                }}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {highlightText(option.label, inputValue)}
              </div>
            ))
          ) : (
            <div style={{ padding: "8px 12px", color: "#666" }}>
              No customers found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;
