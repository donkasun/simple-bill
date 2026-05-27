import React, { useCallback } from "react";
import PrimaryButton from "@components/core/PrimaryButton";
import StyledTable from "@components/core/StyledTable";
import ErrorBanner from "@components/core/ErrorBanner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import { usePageTitle } from "@components/layout/PageTitleContext";
import type { DocumentEntity } from "../../types/document";
import { formatCurrency } from "@utils/currency";
import { downloadBlob } from "@utils/download";
import { getDocumentFilename } from "@utils/documents";
import {
  styles,
  getTableRowStyle,
  getStatusBadgeStyle,
} from "./Dashboard.styles";

const Dashboard: React.FC = () => {
  usePageTitle("Dashboard");
  const navigate = useNavigate();
  const { user } = useAuth();
  type DocumentRow = DocumentEntity & {
    typeLabel: string;
    customerName: string;
    relatedCount?: number; // Number of related invoices for quotations
    sourceInfo?: string; // Source quotation info for invoices
  };
  const {
    items: documents,
    loading,
    error,
  } = useFirestore<DocumentEntity, DocumentRow>({
    collectionName: "documents",
    userId: user?.uid,
    orderByField: "createdAt",
    select: (doc) => ({
      ...doc,
      typeLabel: doc.type === "invoice" ? "Invoice" : "Quotation",
      customerName: doc.customerDetails?.name ?? "—",
      relatedCount: doc.relatedInvoices?.length || 0,
      sourceInfo: doc.sourceDocumentId
        ? `From ${doc.sourceDocumentType || "Document"}`
        : undefined,
    }),
  });

  const handleDownload = useCallback(async (doc: DocumentEntity) => {
    const { generateDocumentPdf } = await import("../../utils/pdf");
    const pdfBytes = await generateDocumentPdf({
      type: doc.type,
      docNumber: doc.docNumber,
      date: doc.date,
      customerDetails: doc.customerDetails,
      items: doc.items,
      subtotal: doc.subtotal,
      total: doc.total,
      currency: doc.currency || "USD",
    });
    const filename = `${getDocumentFilename(
      doc.type,
      doc.docNumber,
      doc.date,
    )}.pdf`;
    downloadBlob(filename, pdfBytes, "application/pdf");
  }, []);

  return (
    <div style={styles.container}>
      <div className="container-xl">
        <div style={styles.header}>
          <h1 style={styles.title}>Dashboard</h1>
          <PrimaryButton
            onClick={() => navigate("/documents/new")}
            style={styles.createButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1565c0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1976d2";
            }}
          >
            Create New Document
          </PrimaryButton>
        </div>

        <div>
          {loading && (
            <div style={styles.loadingContainer}>Loading documents…</div>
          )}
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {!loading && !error && (
            <div style={styles.tableContainer}>
              <StyledTable>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th scope="col" style={styles.tableHeaderCell}>
                      DOC #
                    </th>
                    <th scope="col" style={styles.tableHeaderCell}>
                      TYPE
                    </th>
                    <th scope="col" style={styles.tableHeaderCell}>
                      CUSTOMER
                    </th>
                    <th scope="col" style={styles.tableHeaderCell}>
                      DATE
                    </th>
                    <th scope="col" style={styles.tableHeaderCell}>
                      TOTAL
                    </th>
                    <th scope="col" style={styles.tableHeaderCell}>
                      STATUS
                    </th>
                    <th scope="col" style={styles.tableHeaderCell}>
                      RELATIONS
                    </th>
                    <th scope="col" style={styles.tableHeaderCell}>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d, index) => (
                    <tr
                      key={d.id}
                      style={getTableRowStyle(index, documents.length)}
                    >
                      <td style={styles.tableCellStrong}>
                        {d.docNumber || "—"}
                      </td>
                      <td style={styles.tableCell}>{d.typeLabel}</td>
                      <td style={styles.tableCell}>{d.customerName}</td>
                      <td style={styles.tableCell}>{d.date}</td>
                      <td style={styles.tableCellStrong}>
                        {formatCurrency(d.total, d.currency || "USD")}
                      </td>
                      <td style={styles.tableCell}>
                        <span
                          style={getStatusBadgeStyle(d.status === "finalized")}
                        >
                          {d.status === "finalized" ? "Finalized" : "Draft"}
                        </span>
                      </td>
                      <td style={styles.relationsCell}>
                        {d.type === "quotation" &&
                          (d.relatedCount || 0) > 0 && (
                            <span>
                              {d.relatedCount} Invoice
                              {(d.relatedCount || 0) !== 1 ? "s" : ""} generated
                            </span>
                          )}
                        {d.type === "invoice" && d.sourceInfo && (
                          <span>{d.sourceInfo}</span>
                        )}
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.actionsContainer}>
                          <button
                            style={styles.actionButton}
                            onClick={() => navigate(`/documents/${d.id}/edit`)}
                          >
                            View
                          </button>
                          {d.status === "finalized" && (
                            <button
                              style={styles.actionButton}
                              onClick={() => handleDownload(d)}
                            >
                              Download
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {documents.length === 0 && (
                    <tr>
                      <td colSpan={8}>
                        <div style={styles.emptyStateContainer}>
                          <div style={styles.emptyStateTitle}>
                            No documents yet.
                          </div>
                          <p style={styles.emptyStateText}>
                            Create your first invoice or quotation to get
                            started.
                          </p>
                          <PrimaryButton
                            onClick={() => navigate("/documents/new")}
                            style={styles.emptyStateButton}
                          >
                            Create Your First Document
                          </PrimaryButton>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </StyledTable>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
