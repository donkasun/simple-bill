/**
 * Search utility functions for autocomplete functionality
 */

// Debounce function to limit API calls
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: NodeJS.Timeout;

  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };

  debounced.cancel = () => {
    clearTimeout(timeout);
  };

  return debounced;
}

// Case-insensitive search function
export function searchText(text: string, searchTerm: string): boolean {
  if (!searchTerm) return true;
  return text.toLowerCase().includes(searchTerm.toLowerCase());
}

// Search that matches start of text (for better relevance)
export function searchTextStartsWith(
  text: string,
  searchTerm: string,
): boolean {
  if (!searchTerm) return true;
  return text.toLowerCase().startsWith(searchTerm.toLowerCase());
}

// Combined search function (starts with OR contains)
export function searchTextCombined(text: string, searchTerm: string): boolean {
  if (!searchTerm) return true;
  const lowerText = text.toLowerCase();
  const lowerSearch = searchTerm.toLowerCase();

  // Prioritize starts with matches
  if (lowerText.startsWith(lowerSearch)) return true;

  // Fall back to contains matches
  return lowerText.includes(lowerSearch);
}

// Highlight text with search term
export function highlightText(text: string, searchTerm: string): string {
  if (!searchTerm) return text;

  const regex = new RegExp(`(${searchTerm})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

// Filter and sort search results
export function filterAndSortResults<T extends { name: string }>(
  items: T[],
  searchTerm: string,
  maxResults: number = 5,
): T[] {
  if (!searchTerm) return items.slice(0, maxResults);

  const results = items
    .filter((item) => searchTextCombined(item.name, searchTerm))
    .sort((a, b) => {
      // Prioritize exact matches
      const aExact = a.name.toLowerCase() === searchTerm.toLowerCase();
      const bExact = b.name.toLowerCase() === searchTerm.toLowerCase();

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Then prioritize starts with matches
      const aStartsWith = a.name
        .toLowerCase()
        .startsWith(searchTerm.toLowerCase());
      const bStartsWith = b.name
        .toLowerCase()
        .startsWith(searchTerm.toLowerCase());

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      // Finally sort alphabetically
      return a.name.localeCompare(b.name);
    })
    .slice(0, maxResults);

  return results;
}
