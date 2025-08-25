import { useState, useCallback } from "react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../firebase/config";
import type { Customer } from "../types/customer";
import type { AutocompleteOption } from "../components/core/AutocompleteInput";

export type UseCustomerSearchOptions = {
  userId: string;
  debounceMs?: number;
  maxResults?: number;
  minSearchLength?: number;
};

export type UseCustomerSearchReturn = {
  search: (searchTerm: string) => void;
  loadAllCustomers: () => void;
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

  // Search function with debouncing
  const search = useCallback(
    (term: string) => {
      if (!term || term.length < minSearchLength) {
        setOptions([]);
        setLoading(false);
        return;
      }

      if (!userId) {
        setOptions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Use setTimeout for debouncing
      const timeoutId = setTimeout(async () => {
        try {
          const customersRef = collection(db, "customers");

          // Use a simpler query that doesn't require a composite index
          const q = query(
            customersRef,
            where("userId", "==", userId),
            limit(100), // Get more results since we can't order by name
          );

          const querySnapshot = await getDocs(q);
          const customers: Customer[] = [];

          querySnapshot.forEach((doc) => {
            customers.push({ id: doc.id, ...doc.data() } as Customer);
          });

          // Filter and sort results client-side
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
          const autocompleteOptions: AutocompleteOption[] = filteredCustomers
            .filter((customer) => customer.id)
            .map((customer) => ({
              id: customer.id!,
              label: customer.name,
              value: customer.name,
              customer: customer,
            }));

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
      }, debounceMs);

      return () => clearTimeout(timeoutId);
    },
    [userId, maxResults, minSearchLength, debounceMs],
  );

  // Load all customers
  const loadAllCustomers = useCallback(async () => {
    if (!userId) {
      setOptions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const customersRef = collection(db, "customers");
      const q = query(customersRef, where("userId", "==", userId), limit(50));

      const querySnapshot = await getDocs(q);
      const customers: Customer[] = [];

      querySnapshot.forEach((doc) => {
        customers.push({ id: doc.id, ...doc.data() } as Customer);
      });

      const autocompleteOptions: AutocompleteOption[] = customers
        .filter((customer) => customer.id) // Only include customers with an id
        .map((customer) => ({
          id: customer.id!,
          label: customer.name,
          value: customer.name,
          customer: customer,
        }));

      setOptions(autocompleteOptions);
    } catch (err) {
      console.error("Error loading customers:", err);
      setError(err instanceof Error ? err.message : "Failed to load customers");
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Clear search
  const clearSearch = useCallback(() => {
    setOptions([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    search,
    loadAllCustomers,
    options,
    loading,
    error,
    clearSearch,
  };
}
