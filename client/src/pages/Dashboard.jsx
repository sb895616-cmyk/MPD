import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/Spinner';

function StatCard({ label, value, sub, color }) {
  return (
    <div className={`stat-card${color ? ' ' + color : ''}`}>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}

function RiskBar({ label, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const colors = { Low: '#16a34a', Medium: '#d97706', High: '#dc2626' };
  const fill = colors[label] || '#94a3b8';
  return (
    <div className="risk-bar-row">
      <span className="risk-bar-label">{label}</span>
      <div className="risk-bar-track">
        <div className="risk-bar-fill" style={{ width: pct + '%', background: fill }} />
      </div>
      <span className="risk-bar-count">{count}</span>
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function RiskBadge({ level }) {
  if (!level) return <span className="badge badge-grey">Not Assessed</span>;
  const map = { Low: 'badge-green', Medium: 'badge-amber', High: 'badge-red' };
  return <span className={'badge ' + (map[level] || 'badge-grey')}>{level} Risk</span>;
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [highRisk, setHighRisk] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(function () {
    async function load() {
      try {
        const s = await api.get('/dashboard/stats');
        const r = await api.get('/dashboard/recent-assessments');
        const h = await api.get('/dashboard/high-risk-suppliers');
        setStats(s.data.data);
        setRecent(r.data.data);
        setHighRisk(h.data.data);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <div className="alert alert-error">{error}</div>;

  const assessed = stats.low + stats.medium + stats.high;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Risk overview across all active suppliers</p>
        </div>
        <Link to="/assessments/new" className="btn btn-primary">+ New Assessment</Link>
      </div>

      <div className="stats-grid">
        <StatCard label="Active Suppliers" value={stats.totalActive} sub={stats.notAssessed + ' not yet assessed'} />
        <StatCard label="Low Risk" value={stats.low} color="green" sub="Score 0 - 33.33" />
        <StatCard label="Medium Risk" value={stats.medium} color="amber" sub="Score 33.34 - 66.66" />
        <StatCard label="High Risk" value={stats.high} color="red" sub="Score 66.67 - 100" />
        <StatCard label="Not Assessed" value={stats.notAssessed} sub="Awaiting first assessment" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px,1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card">
          <div className="card-header">Risk Distribution</div>
          <div className="card-body">
            {assessed === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <p>No assessed suppliers yet.</p>
              </div>
            ) : (
              <div className="risk-chart">
                <RiskBar label="Low" count={stats.low} total={assessed} />
                <RiskBar label="Medium" count={stats.medium} total={assessed} />
                <RiskBar label="High" count={stats.high} total={assessed} />
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span>Highest Risk Suppliers</span>
            <Link to="/suppliers" style={{ fontSize: '12px' }}>View all</Link>
          </div>
          {highRisk.length === 0 ? (
            <div className="empty-state"><p>No high-risk suppliers.</p></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Score</th>
                    <th>Level</th>
                  </tr>
                </thead>
                <tbody>
                  {highRisk.map(function (r, i) {
                    return (
                      <tr key={i}>
                        <td>
                          <Link to={'/suppliers/' + (r.supplier && r.supplier._id)}>
                            {r.supplier ? r.supplier.name : '—'}
                          </Link>
                        </td>
                        <td>{r.riskScore ? r.riskScore.toFixed(2) : '—'}</td>
                        <td><RiskBadge level={r.riskLevel} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span>Recent Assessments</span>
          <Link to="/assessments" style={{ fontSize: '12px' }}>View all</Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state"><p>No assessments recorded yet.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Score</th>
                  <th>Risk Level</th>
                  <th>Assessed By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(function (a) {
                  return (
                    <tr key={a._id}>
                      <td>
                        <Link to={'/suppliers/' + (a.supplier && a.supplier._id)}>
                          {a.supplier ? a.supplier.name : '—'}
                        </Link>
                      </td>
                      <td>{a.riskScore ? a.riskScore.toFixed(2) : '—'}</td>
                      <td><RiskBadge level={a.riskLevel} /></td>
                      <td>{a.assessedBy ? a.assessedBy.name : '—'}</td>
                      <td>{fmtDate(a.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
