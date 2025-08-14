import React, { useCallback } from "react";
import PrimaryButton from "@components/core/PrimaryButton";
import StyledTable from "@components/core/StyledTable";
import ErrorBanner from "@components/core/ErrorBanner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@auth/useAuth";
import { useFirestore } from "@hooks/useFirestore";
import { usePageTitle } from "@components/layout/PageTitleContext";
import type { DocumentEntity } from "../types/document";
import { formatCurrency } from "@utils/currency";
import { downloadBlob } from "@utils/download";
import { getDocumentFilename } from "@utils/documents";

const Dashboard: React.FC = () => {
  usePageTitle("Dashboard");
  const navigate = useNavigate();
  const { user } = useAuth();
  type DocumentRow = DocumentEntity & {
    typeLabel: string;
    customerName: string;
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
    }),
  });

  const handleDownload = useCallback(async (doc: DocumentEntity) => {
    const { generateDocumentPdf } = await import("../utils/pdf");
    const pdfBytes = await generateDocumentPdf({
      type: doc.type,
      docNumber: doc.docNumber,
      date: doc.date,
      customerDetails: doc.customerDetails,
      items: doc.items,
      subtotal: doc.subtotal,
      total: doc.total,
    });
    const filename = `${getDocumentFilename(
      doc.type,
      doc.docNumber,
      doc.date,
    )}.pdf`;
    downloadBlob(filename, pdfBytes, "application/pdf");
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <div className="container-xl">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
            Dashboard
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            <PrimaryButton onClick={() => navigate("/documents/new")}>
              Create New Document
            </PrimaryButton>
          </div>
        </div>

        <div>
          {loading && <div>Loading documents…</div>}
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {!loading && !error && (
            <StyledTable>
              <thead>
                <tr>
                  <th scope="col">Doc #</th>
                  <th scope="col">Type</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Date</th>
                  <th scope="col">Total</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="td-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id}>
                    <td className="td-strong">{d.docNumber || "—"}</td>
                    <td>{d.typeLabel}</td>
                    <td>{d.customerName}</td>
                    <td>{d.date}</td>
                    <td>{formatCurrency(d.total)}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          d.status === "finalized"
                            ? "status-finalized"
                            : "status-draft"
                        }`}
                      >
                        {d.status === "finalized" ? "Finalized" : "Draft"}
                      </span>
                    </td>
                    <td className="td-right">
                      <div className="actions">
                        {d.status === "draft" ? (
                          <button
                            className="link-btn"
                            onClick={() => navigate(`/documents/${d.id}/edit`)}
                          >
                            Edit
                          </button>
                        ) : (
                          <button
                            className="link-btn"
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
                    <td
                      colSpan={7}
                      style={{ textAlign: "center", padding: "1rem" }}
                    >
                      No documents yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </StyledTable>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
