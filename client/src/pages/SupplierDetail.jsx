import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/Spinner';
import RiskBadge from '../components/RiskBadge';
import ConfirmDialog from '../components/ConfirmDialog';

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || '—'}</span>
    </div>
  );
}

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.all([
        api.get(`/suppliers/${id}`),
        api.get(`/suppliers/${id}/assessments?limit=5`),
      ]);
      setSupplier(sRes.data.data);
      setAssessments(aRes.data.data);
    } catch (_err) {
      setError('Failed to load supplier details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const toggleStatus = async () => {
    const newStatus = supplier.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await api.patch(`/suppliers/${id}/status`, { status: newStatus });
      setConfirm(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
      setConfirm(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!supplier) return null;

  const latest = supplier.latestAssessment;

  return (
    <>
      {confirm && (
        <ConfirmDialog
          title={supplier.status === 'Active' ? 'Deactivate Supplier' : 'Activate Supplier'}
          message={`Are you sure you want to ${supplier.status === 'Active' ? 'deactivate' : 'activate'} "${supplier.name}"?`}
          confirmLabel={supplier.status === 'Active' ? 'Deactivate' : 'Activate'}
          danger={supplier.status === 'Active'}
          onConfirm={toggleStatus}
          onCancel={() => setConfirm(false)}
        />
      )}

      <div className="page-header">
        <div>
          <h1>{supplier.name}</h1>
          <p>
            <code style={{ fontSize: 12, background: '#f0f4f8', padding: '2px 6px', borderRadius: 4 }}>{supplier.supplierCode}</code>
            {' '}<RiskBadge status={supplier.status} />
            {' '}{latest && <RiskBadge level={latest.riskLevel} />}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to={`/assessments/new?supplierId=${id}`} className="btn btn-primary" style={{ opacity: supplier.status === 'Inactive' ? 0.5 : 1, pointerEvents: supplier.status === 'Inactive' ? 'none' : 'auto' }}>
            + New Assessment
          </Link>
          <Link to={`/suppliers/${id}/edit`} className="btn btn-secondary">Edit</Link>
          <button className={`btn ${supplier.status === 'Active' ? 'btn-danger' : 'btn-success'}`} onClick={() => setConfirm(true)}>
            {supplier.status === 'Active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: 20, marginBottom: 20 }}>
        {/* Supplier details */}
        <div className="card">
          <div className="card-header">Supplier Details</div>
          <div className="detail-grid">
            <DetailRow label="Supplier Code" value={supplier.supplierCode} />
            <DetailRow label="Contact Person" value={supplier.contactPerson} />
            <DetailRow label="Email" value={supplier.email} />
            <DetailRow label="Phone" value={supplier.phone} />
            <DetailRow label="Industry" value={supplier.industry} />
            <DetailRow label="Country" value={supplier.country} />
            <DetailRow label="City" value={supplier.city} />
            <DetailRow label="Address" value={supplier.address} />
            <DetailRow label="Years in Operation" value={supplier.yearsInOperation} />
            <DetailRow label="Annual Contract Value" value={supplier.annualContractValue ? `$${supplier.annualContractValue.toLocaleString()}` : null} />
            <DetailRow label="Created By" value={supplier.createdBy?.name} />
            <DetailRow label="Created" value={fmtDate(supplier.createdAt)} />
            <DetailRow label="Last Updated" value={fmtDate(supplier.updatedAt)} />
          </div>
          {supplier.description && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
              <div className="detail-label" style={{ marginBottom: 4 }}>Description</div>
              <p style={{ fontSize: 13 }}>{supplier.description}</p>
            </div>
          )}
        </div>

        {/* Latest assessment summary */}
        <div className="card">
          <div className="card-header">Latest Assessment</div>
          {!latest ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>Not yet assessed</h3>
              <p>No risk assessment has been performed for this supplier.</p>
              {supplier.status === 'Active' && (
                <Link to={`/assessments/new?supplierId=${id}`} className="btn btn-primary" style={{ marginTop: 8 }}>
                  Create Assessment
                </Link>
              )}
            </div>
          ) : (
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Overall Score</div>
                  <div style={{ fontSize: 38, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>{latest.riskScore?.toFixed(2)}</div>
                </div>
                <div>
                  <RiskBadge level={latest.riskLevel} />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    Assessed by {latest.assessedBy?.name || '—'} on {fmtDate(latest.createdAt)}
                  </div>
                </div>
              </div>
              <Link to={`/assessments/${latest._id}`} className="btn btn-secondary btn-sm">
                View Full Assessment →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Assessment history table */}
      <div className="card">
        <div className="card-header">
          <span>Assessment History</span>
          <Link to={`/suppliers/${id}/assessments`} style={{ fontSize: 12 }}>View all</Link>
        </div>
        {assessments.length === 0 ? (
          <div className="empty-state"><p>No assessments recorded yet.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Risk Level</th>
                  <th>Assessed By</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => (
                  <tr key={a._id}>
                    <td>{fmtDate(a.createdAt)}</td>
                    <td><strong>{a.riskScore?.toFixed(2)}</strong></td>
                    <td><RiskBadge level={a.riskLevel} /></td>
                    <td>{a.assessedBy?.name || '—'}</td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.notes || '—'}
                    </td>
                    <td><Link to={`/assessments/${a._id}`} className="btn-ghost">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
