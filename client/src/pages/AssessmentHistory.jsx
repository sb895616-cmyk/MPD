import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/Spinner';
import RiskBadge from '../components/RiskBadge';
import Pagination from '../components/Pagination';

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

export default function AssessmentHistory() {
  const { supplierId } = useParams(); // present when coming from supplier page
  const [assessments, setAssessments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [page, setPage] = useState(1);
  const [supplierName, setSupplierName] = useState('');

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (supplierId) {
        res = await api.get(`/suppliers/${supplierId}/assessments?page=${page}&limit=10`);
        if (!supplierName) {
          const sRes = await api.get(`/suppliers/${supplierId}`);
          setSupplierName(sRes.data.data.name);
        }
      } else {
        const params = new URLSearchParams({ page, limit: 10 });
        if (riskLevel) params.set('riskLevel', riskLevel);
        res = await api.get(`/assessments?${params}`);
      }
      setAssessments(res.data.data);
      setPagination(res.data.pagination);
    } catch (_err) {
      setError('Failed to load assessments.');
    } finally {
      setLoading(false);
    }
  }, [page, riskLevel, supplierId, supplierName]);

  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{supplierId ? `${supplierName || 'Supplier'} — Assessment History` : 'Assessment History'}</h1>
          <p>Historical risk assessment records, newest first</p>
        </div>
        {supplierId && (
          <Link to={`/suppliers/${supplierId}`} className="btn btn-secondary">← Back to Supplier</Link>
        )}
      </div>

      {!supplierId && (
        <div className="filter-bar">
          <select className="form-select" value={riskLevel} onChange={(e) => { setRiskLevel(e.target.value); setPage(1); }}>
            <option value="">All Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </select>
        </div>
      )}

      <div className="card">
        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="alert alert-error" style={{ margin: 16 }}>{error}</div>
        ) : assessments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <h3>No assessments found</h3>
            <p>{supplierId ? 'This supplier has not been assessed yet.' : 'No assessments have been recorded yet.'}</p>
            <Link to="/assessments/new" className="btn btn-primary" style={{ marginTop: 8 }}>Create Assessment</Link>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {!supplierId && <th>Supplier</th>}
                    <th>Date</th>
                    <th>Score</th>
                    <th>Risk Level</th>
                    <th>Fin.</th>
                    <th>Delivery</th>
                    <th>Quality</th>
                    <th>Compliance</th>
                    <th>Dependency</th>
                    <th>Assessed By</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a) => (
                    <tr key={a._id}>
                      {!supplierId && (
                        <td>
                          <Link to={`/suppliers/${a.supplier?._id}`} style={{ fontWeight: 600 }}>
                            {a.supplier?.name || '—'}
                          </Link>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.supplier?.supplierCode}</div>
                        </td>
                      )}
                      <td>{fmtDate(a.createdAt)}</td>
                      <td><strong>{a.riskScore?.toFixed(2)}</strong></td>
                      <td><RiskBadge level={a.riskLevel} /></td>
                      <td>{a.financialStabilityRating}</td>
                      <td>{a.deliveryPerformanceRating}</td>
                      <td>{a.qualityRating}</td>
                      <td>{a.complianceRating}</td>
                      <td>{a.dependencyRating}</td>
                      <td>{a.assessedBy?.name || '—'}</td>
                      <td><Link to={`/assessments/${a._id}`} className="btn-ghost">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...pagination} onPageChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}
