import React from 'react';
import PrimaryButton from '../components/core/PrimaryButton';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '1rem' }}>
      <div className="container-xl">
        <div className="page-header">
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Dashboard</h2>
          <PrimaryButton onClick={() => navigate('/documents/new')}>Create New Document</PrimaryButton>
        </div>


        <div className="table-wrapper card">
          <table className="table">
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
              <tr>
                <td className="td-strong">INV-2024-001</td>
                <td>Invoice</td>
                <td>Acme Corp</td>
                <td>2024-07-26</td>
                <td>$1,200.00</td>
                <td>
                  <span className="status-badge status-finalized">Finalized</span>
                </td>
                <td className="td-right"><a href="#" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Download</a></td>
              </tr>
              <tr>
                <td className="td-strong">QUO-2024-002</td>
                <td>Quotation</td>
                <td>Beta Inc</td>
                <td>2024-07-25</td>
                <td>$850.00</td>
                <td>
                  <span className="status-badge status-draft">Draft</span>
                </td>
                <td className="td-right"><a href="#" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Edit</a></td>
              </tr>
              <tr>
                <td className="td-strong">INV-2024-002</td>
                <td>Invoice</td>
                <td>Gamma Ltd</td>
                <td>2024-07-24</td>
                <td>$2,500.00</td>
                <td>
                  <span className="status-badge status-finalized">Finalized</span>
                </td>
                <td className="td-right"><a href="#" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Download</a></td>
              </tr>
              <tr>
                <td className="td-strong">QUO-2024-001</td>
                <td>Quotation</td>
                <td>Delta LLC</td>
                <td>2024-07-23</td>
                <td>$450.00</td>
                <td>
                  <span className="status-badge status-draft">Draft</span>
                </td>
                <td className="td-right"><a href="#" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Edit</a></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="doc-cards">
          <div className="doc-card">
            <div className="body">
              <div className="row">
                <span className="td-strong">INV-2024-001</span>
                <span className="status-badge status-finalized">Finalized</span>
              </div>
              <p className="muted" style={{ marginTop: 8 }}>Acme Corp</p>
              <div className="row" style={{ marginTop: 12 }}>
                <span className="muted">$1,200.00</span>
                <a href="#" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Download</a>
              </div>
            </div>
          </div>

          <div className="doc-card">
            <div className="body">
              <div className="row">
                <span className="td-strong">QUO-2024-002</span>
                <span className="status-badge status-draft">Draft</span>
              </div>
              <p className="muted" style={{ marginTop: 8 }}>Beta Inc</p>
              <div className="row" style={{ marginTop: 12 }}>
                <span className="muted">$850.00</span>
                <a href="#" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Edit</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
