# AutocompleteInput Component

A generic, reusable autocomplete input component that can work with any dataset.

## Features

- ✅ Real-time search with debouncing
- ✅ Keyboard navigation (arrow keys, enter, escape)
- ✅ Click selection from dropdown
- ✅ Text highlighting in suggestions
- ✅ Loading states
- ✅ Error handling
- ✅ Customizable minimum search length
- ✅ Configurable maximum results
- ✅ Generic data support

## Basic Usage

```tsx
import AutocompleteInput, {
  type AutocompleteOption,
} from "./components/core/AutocompleteInput";

const MyComponent = () => {
  const [value, setValue] = useState("");
  const [options, setOptions] = useState<AutocompleteOption[]>([]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    // Trigger search here
  };

  const handleSelect = (option: AutocompleteOption) => {
    console.log("Selected:", option);
    // Handle selection here
  };

  return (
    <AutocompleteInput
      label="Search Items"
      name="search"
      value={value}
      onChange={handleChange}
      onSelect={handleSelect}
      options={options}
      placeholder="Type to search..."
      minSearchLength={2}
      maxResults={5}
    />
  );
};
```

## AutocompleteOption Type

```tsx
type AutocompleteOption = {
  id: string; // Unique identifier
  label: string; // Display text in dropdown
  value: string; // Value to set in input
  data?: Record<string, unknown>; // Additional data
};
```

## Examples

### Customer Search

```tsx
const CustomerSearch = () => {
  const [searchValue, setSearchValue] = useState("");
  const [customers, setCustomers] = useState<AutocompleteOption[]>([]);

  const handleCustomerSelect = (option: AutocompleteOption) => {
    const customer = option.data as Customer;
    setSearchValue(customer.name);
    // Update form with customer data
  };

  return (
    <AutocompleteInput
      label="Customer"
      name="customer"
      value={searchValue}
      onChange={setSearchValue}
      onSelect={handleCustomerSelect}
      options={customers}
      placeholder="Search customers..."
    />
  );
};
```

### Product Search

```tsx
const ProductSearch = () => {
  const [searchValue, setSearchValue] = useState("");
  const [products, setProducts] = useState<AutocompleteOption[]>([]);

  const handleProductSelect = (option: AutocompleteOption) => {
    const product = option.data as Product;
    setSearchValue(product.name);
    // Update form with product data
  };

  return (
    <AutocompleteInput
      label="Product"
      name="product"
      value={searchValue}
      onChange={setSearchValue}
      onSelect={handleProductSelect}
      options={products}
      placeholder="Search products..."
    />
  );
};
```

### Country Search

```tsx
const CountrySearch = () => {
  const [searchValue, setSearchValue] = useState("");
  const [countries, setCountries] = useState<AutocompleteOption[]>([]);

  const handleCountrySelect = (option: AutocompleteOption) => {
    const country = option.data as Country;
    setSearchValue(country.name);
    // Update form with country data
  };

  return (
    <AutocompleteInput
      label="Country"
      name="country"
      value={searchValue}
      onChange={setSearchValue}
      onSelect={handleCountrySelect}
      options={countries}
      placeholder="Search countries..."
    />
  );
};
```

## Props

| Prop               | Type                                   | Default | Description                                   |
| ------------------ | -------------------------------------- | ------- | --------------------------------------------- |
| `label`            | `string`                               | -       | Input label                                   |
| `name`             | `string`                               | -       | Input name attribute                          |
| `value`            | `string`                               | -       | Current input value                           |
| `onChange`         | `(value: string) => void`              | -       | Called when input value changes               |
| `onSelect`         | `(option: AutocompleteOption) => void` | -       | Called when option is selected                |
| `onToggleDropdown` | `() => void`                           | -       | Called when dropdown toggle button is clicked |
| `placeholder`      | `string`                               | -       | Input placeholder text                        |
| `required`         | `boolean`                              | `false` | Whether input is required                     |
| `disabled`         | `boolean`                              | `false` | Whether input is disabled                     |
| `options`          | `AutocompleteOption[]`                 | `[]`    | Available options                             |
| `loading`          | `boolean`                              | `false` | Show loading state                            |
| `error`            | `string`                               | -       | Error message to display                      |
| `minSearchLength`  | `number`                               | `2`     | Minimum characters to show dropdown           |
| `maxResults`       | `number`                               | `5`     | Maximum number of results to show             |
| `highlightMatch`   | `boolean`                              | `true`  | Whether to highlight matching text            |

## Keyboard Navigation

- **Arrow Down**: Navigate to next option
- **Arrow Up**: Navigate to previous option
- **Enter**: Select highlighted option
- **Escape**: Close dropdown
- **Tab**: Move focus (closes dropdown)

## Styling

The component uses inline styles for the dropdown positioning and basic styling. You can customize the appearance by:

1. Modifying the inline styles in the component
2. Adding CSS classes and updating the component to use them
3. Using a CSS-in-JS solution

## Accessibility

- Proper ARIA attributes for screen readers
- Keyboard navigation support
- Focus management
- Screen reader announcements for loading states

## Performance

- Debounced search input (handled by parent component)
- Efficient rendering with React.memo (if needed)
- Portal-based dropdown to avoid layout issues
