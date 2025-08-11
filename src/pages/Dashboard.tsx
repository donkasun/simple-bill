import React, { useCallback } from 'react';
import PrimaryButton from '../components/core/PrimaryButton';
import StyledTable from '../components/core/StyledTable';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import type { DocumentEntity } from '../types/document';
import { generateDocumentPdf } from '../utils/pdf';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: documents, loading, error } = useFirestore<DocumentEntity>({
    collectionName: 'documents',
    userId: user?.uid,
    orderByField: 'createdAt',
  });

  const handleDownload = useCallback(async (doc: DocumentEntity) => {
    const pdfBytes = await generateDocumentPdf({
      type: doc.type,
      docNumber: doc.docNumber,
      date: doc.date,
      customerDetails: doc.customerDetails,
      items: doc.items,
      subtotal: doc.subtotal,
      total: doc.total,
    });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const prefix = doc.type === 'invoice' ? 'INV' : 'QUO';
    const filename = doc.docNumber ? doc.docNumber : `${prefix}-${doc.date}`;
    a.href = url;
    a.download = `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);


  return (
    <div style={{ padding: '1rem' }}>
      <div className="container-xl">
        <div className="page-header">
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Dashboard</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <PrimaryButton onClick={() => navigate('/documents/new')}>Create New Document</PrimaryButton>
          </div>
        </div>


        <div>
          {loading && <div>Loading documents…</div>}
          {error && <div role="alert" style={{ color: 'crimson' }}>{error}</div>}
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
                  <th scope="col" className="td-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id}>
                    <td className="td-strong">{d.docNumber || '—'}</td>
                    <td>{d.type === 'invoice' ? 'Invoice' : 'Quotation'}</td>
                    <td>{d.customerDetails?.name || '—'}</td>
                    <td>{d.date}</td>
                    <td>${d.total.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${d.status === 'finalized' ? 'status-finalized' : 'status-draft'}`}>
                        {d.status === 'finalized' ? 'Finalized' : 'Draft'}
                      </span>
                    </td>
                    <td className="td-right">
                      <div className="actions">
                        {d.status === 'draft' ? (
                          <button className="link-btn" onClick={() => navigate(`/documents/${d.id}/edit`)}>Edit</button>
                        ) : (
                          <button className="link-btn" onClick={() => handleDownload(d)}>Download</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '1rem' }}>
                      No documents yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </StyledTable>
          )}
        </div>

        {/* Optional card view removed for simplicity in Phase 4.4 */}
      </div>
    </div>
  );
};

export default Dashboard;
