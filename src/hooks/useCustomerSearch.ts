import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/config";
import type { Customer } from "../types/customer";
import type { AutocompleteOption } from "../components/core/AutocompleteInput";
import { debounce } from "../utils/search";

export type UseCustomerSearchOptions = {
  userId: string;
  debounceMs?: number;
  maxResults?: number;
  minSearchLength?: number;
};

export type UseCustomerSearchReturn = {
  search: (searchTerm: string) => void;
  options: AutocompleteOption[];
  loading: boolean;
  error: string | null;
  clearSearch: () => void;
};

export function useCustomerSearch({
  userId,
  debounceMs = 300,
  maxResults = 5,
  minSearchLength = 2,
}: UseCustomerSearchOptions): UseCustomerSearchReturn {
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (!term || term.length < minSearchLength) {
        setOptions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const customersRef = collection(db, "customers");

        // Create query for case-insensitive search
        // Note: Firestore doesn't support case-insensitive queries directly
        // We'll use a range query and filter client-side for better performance
        const q = query(
          customersRef,
          where("userId", "==", userId),
          orderBy("name"),
          limit(20), // Get more results to filter client-side
        );

        const querySnapshot = await getDocs(q);
        const customers: Customer[] = [];

        querySnapshot.forEach((doc) => {
          customers.push({ id: doc.id, ...doc.data() } as Customer);
        });

        // Filter and sort results client-side for better search experience
        const filteredCustomers = customers
          .filter((customer) =>
            customer.name.toLowerCase().includes(term.toLowerCase()),
          )
          .sort((a, b) => {
            // Prioritize exact matches
            const aExact = a.name.toLowerCase() === term.toLowerCase();
            const bExact = b.name.toLowerCase() === term.toLowerCase();

            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;

            // Then prioritize starts with matches
            const aStartsWith = a.name
              .toLowerCase()
              .startsWith(term.toLowerCase());
            const bStartsWith = b.name
              .toLowerCase()
              .startsWith(term.toLowerCase());

            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;

            // Finally sort alphabetically
            return a.name.localeCompare(b.name);
          })
          .slice(0, maxResults);

        // Convert to AutocompleteOption format
        const autocompleteOptions: AutocompleteOption[] = filteredCustomers.map(
          (customer) => ({
            id: customer.id,
            label: customer.name,
            value: customer.name,
            customer: customer, // Include full customer data for selection
          }),
        );

        setOptions(autocompleteOptions);
      } catch (err) {
        console.error("Error searching customers:", err);
        setError(
          err instanceof Error ? err.message : "Failed to search customers",
        );
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs),
    [userId, maxResults, minSearchLength, debounceMs],
  );

  // Search function
  const search = useCallback(
    (term: string) => {
      debouncedSearch(term);
    },
    [debouncedSearch],
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setOptions([]);
    setError(null);
    setLoading(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any pending debounced calls
      debouncedSearch.cancel?.();
    };
  }, [debouncedSearch]);

  return {
    search,
    options,
    loading,
    error,
    clearSearch,
  };
}
