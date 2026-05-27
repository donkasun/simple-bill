import type { CSSProperties } from "react";

// Stylesheet similar to React Native StyleSheet
export const styles = {
  container: {
    padding: "1.5rem",
  } as CSSProperties,

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  } as CSSProperties,

  title: {
    fontFamily: "var(--font-heading)",
    fontSize: "1.875rem",
    fontWeight: 700,
    color: "var(--brand-text-primary)",
    margin: 0,
  } as CSSProperties,

  createButton: {
    backgroundColor: "var(--brand-primary)",
    color: "var(--white)",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "9999px",
    fontWeight: 700,
    fontSize: "1rem",
    minHeight: "48px",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  } as CSSProperties,

  loadingContainer: {
    textAlign: "center",
    padding: "2rem",
    color: "var(--brand-text-secondary)",
  } as CSSProperties,

  tableContainer: {
    background: "var(--white)",
    borderRadius: "12px",
    border: "1px solid var(--brand-border)",
    overflow: "hidden",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  } as CSSProperties,

  tableHeader: {
    backgroundColor: "var(--brand-background)",
    borderBottom: "1px solid var(--brand-border)",
  } as CSSProperties,

  tableHeaderCell: {
    padding: "1rem",
    textAlign: "left",
    fontWeight: 600,
    color: "var(--brand-text-secondary)",
    fontSize: "0.875rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  } as CSSProperties,

  tableCell: {
    padding: "1rem",
    color: "var(--brand-text-secondary)",
  } as CSSProperties,

  tableCellStrong: {
    padding: "1rem",
    fontWeight: 600,
    color: "var(--brand-text-primary)",
  } as CSSProperties,

  relationsCell: {
    padding: "1rem",
    color: "var(--brand-text-secondary)",
    fontSize: "0.875rem",
  } as CSSProperties,

  actionsContainer: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
  } as CSSProperties,

  actionButton: {
    background: "none",
    border: "none",
    color: "var(--brand-primary)",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
    padding: 0,
  } as CSSProperties,

  emptyStateContainer: {
    textAlign: "center",
    padding: "4rem 2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
  } as CSSProperties,

  emptyStateTitle: {
    fontSize: "1.125rem",
    color: "var(--brand-text-secondary)",
    marginBottom: "0.5rem",
  } as CSSProperties,

  emptyStateText: {
    fontSize: "0.875rem",
    color: "var(--brand-text-muted)",
    margin: 0,
    maxWidth: "400px",
  } as CSSProperties,

  emptyStateButton: {
    marginTop: "1rem",
    backgroundColor: "var(--brand-primary)",
    color: "var(--white)",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "9999px",
    fontWeight: 700,
    fontSize: "1rem",
    minHeight: "48px",
    cursor: "pointer",
  } as CSSProperties,
};

// Helper functions for dynamic styles
export const getTableRowStyle = (): CSSProperties => ({
  borderBottom: "1px solid var(--brand-border)",
  backgroundColor: "var(--white)",
});

export const getStatusBadgeStyle = (isFinalized: boolean): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "0.25rem 0.75rem",
  borderRadius: "999px",
  fontSize: "0.75rem",
  fontWeight: 600,
  backgroundColor: isFinalized ? "#e6f7f1" : "#fff4e5",
  color: isFinalized ? "var(--brand-success)" : "var(--brand-warning)",
});
