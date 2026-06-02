import React from "react";
import { formatCurrency } from "@utils/currency";

export type PdfPreviewData = {
  type: "invoice" | "quotation";
  docNumber: string;
  date: string;
  customerDetails?: { name?: string; email?: string; address?: string };
  items: Array<{
    name: string;
    description?: string;
    unitPrice: number;
    quantity: number;
    amount: number;
  }>;
  subtotal: number;
  total: number;
  currency: string;
  businessName?: string;
  businessEmail?: string;
  businessAddress?: string;
};

const DocumentPreviewContent = React.forwardRef<
  HTMLDivElement,
  { data: PdfPreviewData }
>(({ data }, ref) => {
  const title = data.type === "invoice" ? "Invoice" : "Quotation";

  return (
    <div ref={ref} className="doc-preview-printable">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .doc-preview-printable,
          .doc-preview-printable * { visibility: visible; }
          .doc-preview-printable {
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            background: #fff;
            color: #000;
          }
        }
      `}</style>

      <div className="doc-preview__inner">
        <div className="doc-preview__header">
          <div>
            <h1 className="doc-preview__title">{title}</h1>
            {data.docNumber && (
              <p className="doc-preview__number">#{data.docNumber}</p>
            )}
            <p className="doc-preview__date">Date: {data.date}</p>
          </div>
          {(data.businessName ||
            data.businessEmail ||
            data.businessAddress) && (
            <div className="doc-preview__from">
              {data.businessName && <strong>{data.businessName}</strong>}
              {data.businessEmail && <p>{data.businessEmail}</p>}
              {data.businessAddress &&
                data.businessAddress
                  .split(/\r?\n/)
                  .map((line, i) =>
                    line.trim() ? <p key={i}>{line}</p> : null,
                  )}
            </div>
          )}
        </div>

        {data.customerDetails && (
          <div className="doc-preview__bill-to">
            <p className="doc-preview__section-label">Bill To</p>
            {data.customerDetails.name && (
              <p className="doc-preview__customer-name">
                {data.customerDetails.name}
              </p>
            )}
            {data.customerDetails.email && <p>{data.customerDetails.email}</p>}
            {data.customerDetails.address &&
              data.customerDetails.address
                .split(/\r?\n/)
                .map((line, i) => (line.trim() ? <p key={i}>{line}</p> : null))}
          </div>
        )}

        <table className="doc-preview__table">
          <thead>
            <tr>
              <th className="doc-preview__col-item">Item</th>
              <th className="doc-preview__col-num">Unit Price</th>
              <th className="doc-preview__col-num">Qty</th>
              <th className="doc-preview__col-num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i}>
                <td>
                  <span className="doc-preview__item-name">
                    {item.name || "—"}
                  </span>
                  {item.description && (
                    <span className="doc-preview__item-desc">
                      {item.description}
                    </span>
                  )}
                </td>
                <td className="doc-preview__col-num">
                  {formatCurrency(item.unitPrice, data.currency)}
                </td>
                <td className="doc-preview__col-num">{item.quantity}</td>
                <td className="doc-preview__col-num">
                  {formatCurrency(item.amount, data.currency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="doc-preview__subtotal-row">
              <td colSpan={3}>Subtotal</td>
              <td className="doc-preview__col-num">
                {formatCurrency(data.subtotal, data.currency)}
              </td>
            </tr>
            <tr className="doc-preview__total-row">
              <td colSpan={3}>
                <strong>Total</strong>
              </td>
              <td className="doc-preview__col-num">
                <strong>{formatCurrency(data.total, data.currency)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
});

DocumentPreviewContent.displayName = "DocumentPreviewContent";
export default DocumentPreviewContent;
