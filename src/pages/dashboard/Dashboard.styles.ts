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
    fontSize: "1.875rem",
    fontWeight: 700,
    color: "#333",
    margin: 0,
  } as CSSProperties,

  createButton: {
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  } as CSSProperties,

  loadingContainer: {
    textAlign: "center",
    padding: "2rem",
    color: "#666",
  } as CSSProperties,

  tableContainer: {
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e0e0e0",
    overflow: "hidden",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  } as CSSProperties,

  tableHeader: {
    backgroundColor: "#f8f9fa",
    borderBottom: "1px solid #e0e0e0",
  } as CSSProperties,

  tableHeaderCell: {
    padding: "1rem",
    textAlign: "left",
    fontWeight: 600,
    color: "#333",
    fontSize: "0.875rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  } as CSSProperties,

  tableCell: {
    padding: "1rem",
    color: "#666",
  } as CSSProperties,

  tableCellStrong: {
    padding: "1rem",
    fontWeight: 600,
    color: "#333",
  } as CSSProperties,

  relationsCell: {
    padding: "1rem",
    color: "#666",
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
    color: "#1976d2",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
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
    color: "#666",
    marginBottom: "0.5rem",
  } as CSSProperties,

  emptyStateText: {
    fontSize: "0.875rem",
    color: "#999",
    margin: 0,
    maxWidth: "400px",
  } as CSSProperties,

  emptyStateButton: {
    marginTop: "1rem",
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "1rem",
    cursor: "pointer",
  } as CSSProperties,
};

// Helper functions for dynamic styles
export const getTableRowStyle = (
  index: number,
  totalRows: number,
): CSSProperties => ({
  borderBottom: index < totalRows - 1 ? "1px solid #f0f0f0" : "none",
  backgroundColor: "#fff",
});

export const getStatusBadgeStyle = (isFinalized: boolean): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "0.25rem 0.75rem",
  borderRadius: "999px",
  fontSize: "0.75rem",
  fontWeight: 600,
  backgroundColor: isFinalized ? "#e6f7f1" : "#fff4e5",
  color: isFinalized ? "#008a5a" : "#ff8c00",
});
