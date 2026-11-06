import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/Spinner';
import RiskBadge from '../components/RiskBadge';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

export default function SupplierList() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [industry, setIndustry] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  const [confirm, setConfirm] = useState(null); // { id, name, newStatus }

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: 10, sortBy, sortOrder });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (riskLevel) params.set('riskLevel', riskLevel);
      if (industry) params.set('industry', industry);

      const res = await api.get(`/suppliers?${params}`);
      setSuppliers(res.data.data);
      setPagination(res.data.pagination);
    } catch (_err) {
      setError('Failed to load suppliers.');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, riskLevel, industry, sortBy, sortOrder]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const handleStatusChange = async () => {
    if (!confirm) return;
    try {
      await api.patch(`/suppliers/${confirm.id}/status`, { status: confirm.newStatus });
      setConfirm(null);
      fetchSuppliers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
      setConfirm(null);
    }
  };

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchSuppliers(); };

  return (
    <>
      {confirm && (
        <ConfirmDialog
          title={`${confirm.newStatus === 'Inactive' ? 'Deactivate' : 'Activate'} Supplier`}
          message={`Are you sure you want to ${confirm.newStatus === 'Inactive' ? 'deactivate' : 'activate'} "${confirm.name}"?`}
          confirmLabel={confirm.newStatus === 'Inactive' ? 'Deactivate' : 'Activate'}
          danger={confirm.newStatus === 'Inactive'}
          onConfirm={handleStatusChange}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="page-header">
        <div>
          <h1>Suppliers</h1>
          <p>Manage and monitor your supplier portfolio</p>
        </div>
        <Link to="/suppliers/new" className="btn btn-primary">+ Add Supplier</Link>
      </div>

      {/* Filters */}
      <form className="filter-bar" onSubmit={handleSearch}>
        <input
          className="form-input"
          placeholder="Search name or code…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select className="form-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select className="form-select" value={riskLevel} onChange={(e) => { setRiskLevel(e.target.value); setPage(1); }}>
          <option value="">All Risk Levels</option>
          <option value="Low">Low Risk</option>
          <option value="Medium">Medium Risk</option>
          <option value="High">High Risk</option>
        </select>
        <input
          className="form-input"
          placeholder="Filter by industry…"
          value={industry}
          onChange={(e) => { setIndustry(e.target.value); setPage(1); }}
          style={{ maxWidth: 200 }}
        />
        <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="createdAt">Sort: Date Added</option>
          <option value="name">Sort: Name</option>
          <option value="updatedAt">Sort: Last Updated</option>
        </select>
        <select className="form-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ maxWidth: 120 }}>
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </form>

      <div className="card">
        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="alert alert-error" style={{ margin: 16 }}>{error}</div>
        ) : suppliers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏭</div>
            <h3>No suppliers found</h3>
            <p>Try adjusting your filters or add a new supplier.</p>
            <Link to="/suppliers/new" className="btn btn-primary" style={{ marginTop: 8 }}>Add Supplier</Link>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Industry</th>
                    <th>Country</th>
                    <th>Status</th>
                    <th>Risk Level</th>
                    <th>Score</th>
                    <th>Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s._id}>
                      <td><code style={{ fontSize: 11 }}>{s.supplierCode}</code></td>
                      <td>
                        <Link to={`/suppliers/${s._id}`} style={{ fontWeight: 600 }}>{s.name}</Link>
                        {s.contactPerson && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.contactPerson}</div>}
                      </td>
                      <td>{s.industry || '—'}</td>
                      <td>{s.country || '—'}</td>
                      <td><RiskBadge status={s.status} /></td>
                      <td><RiskBadge level={s.latestAssessment?.riskLevel || null} /></td>
                      <td>{s.latestAssessment ? s.latestAssessment.riskScore?.toFixed(2) : '—'}</td>
                      <td>{fmtDate(s.createdAt)}</td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-ghost" onClick={() => navigate(`/suppliers/${s._id}`)}>View</button>
                          <button className="btn-ghost" onClick={() => navigate(`/suppliers/${s._id}/edit`)}>Edit</button>
                          <button
                            className={`btn-ghost${s.status === 'Active' ? ' danger' : ''}`}
                            style={s.status === 'Active' ? { color: 'var(--red)', borderColor: '#fca5a5' } : {}}
                            onClick={() => setConfirm({ id: s._id, name: s.name, newStatus: s.status === 'Active' ? 'Inactive' : 'Active' })}
                          >
                            {s.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
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
