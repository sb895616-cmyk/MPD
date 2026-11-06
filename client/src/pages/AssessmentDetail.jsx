import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/Spinner';
import RiskBadge from '../components/RiskBadge';

function fmtDate(d) {
  return d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

const FACTOR_LABELS = {
  financialStability: 'Financial Stability',
  deliveryPerformance: 'Delivery Performance',
  quality: 'Product / Service Quality',
  compliance: 'Regulatory & Compliance',
  dependency: 'Supplier Dependency',
};

const RATING_LABELS = ['', 'Very Low Risk', 'Low Risk', 'Moderate Risk', 'High Risk', 'Very High Risk'];

function FactorCard({ factorKey, data }) {
  const ratingColor = ['', '#16a34a', '#059669', '#d97706', '#ea580c', '#dc2626'][data.rating];
  return (
    <div className="breakdown-card">
      <div className="breakdown-card-label">{FACTOR_LABELS[factorKey]}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div className="breakdown-card-rating" style={{ color: ratingColor }}>{data.rating}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{RATING_LABELS[data.rating]}</div>
      </div>
      <div className="breakdown-card-contribution">
        Weight: {data.weightPercent}% · Contribution: {data.contribution.toFixed(2)} pts
      </div>
    </div>
  );
}

export default function AssessmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/assessments/${id}`);
        setAssessment(res.data.data);
      } catch (_err) {
        setError('Failed to load assessment.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <Spinner />;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!assessment) return null;

  const { breakdown = {}, insights = [] } = assessment;
  const scoreColor = { Low: 'var(--green)', Medium: 'var(--amber)', High: 'var(--red)' }[assessment.riskLevel];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Assessment Details</h1>
          <p>
            <Link to={`/suppliers/${assessment.supplier?._id}`}>{assessment.supplier?.name}</Link>
            {' · '}<code style={{ fontSize: 11 }}>{assessment.supplier?.supplierCode}</code>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
          {assessment.supplier?.status === 'Active' && (
            <Link to={`/assessments/new?supplierId=${assessment.supplier?._id}`} className="btn btn-primary">
              + New Assessment
            </Link>
          )}
        </div>
      </div>

      {/* Score summary */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">Overall Risk Score</div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Score</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{assessment.riskScore?.toFixed(2)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>out of 100</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Classification</div>
              <RiskBadge level={assessment.riskLevel} />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                Assessed by {assessment.assessedBy?.name || '—'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(assessment.createdAt)}</div>
            </div>
            {assessment.notes && (
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Notes</div>
                <p style={{ fontSize: 13 }}>{assessment.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">Factor Breakdown</div>
        <div className="card-body">
          <div className="breakdown-grid">
            {Object.entries(breakdown).map(([key, data]) => (
              <FactorCard key={key} factorKey={key} data={data} />
            ))}
          </div>
        </div>
      </div>

      {/* Rule-based insights */}
      {insights.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">Key Observations</div>
          <div className="card-body">
            <div className="alert alert-info" style={{ marginBottom: 8, fontSize: 12 }}>
              These observations are generated by rule-based logic, not AI. They reflect the ratings entered by the analyst.
            </div>
            {insights.map((ins, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: i < insights.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                  {FACTOR_LABELS[ins.factor]}
                </strong>
                <p style={{ marginTop: 2, fontSize: 13 }}>{ins.insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scoring formula reference */}
      <div className="card">
        <div className="card-header">Scoring Formula Reference</div>
        <div className="card-body">
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            Score version: <code>{assessment.scoringVersion}</code> · Formula:
            per-factor contribution = <code>((rating − 1) / 4) × weight × 100</code>
          </p>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Factor</th><th>Rating</th><th>Weight</th><th>Contribution</th></tr>
              </thead>
              <tbody>
                {Object.entries(breakdown).map(([key, data]) => (
                  <tr key={key}>
                    <td>{FACTOR_LABELS[key]}</td>
                    <td>{data.rating} — {RATING_LABELS[data.rating]}</td>
                    <td>{data.weightPercent}%</td>
                    <td>{data.contribution.toFixed(4)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 700 }}>
                  <td colSpan={3}>Total Score</td>
                  <td style={{ color: scoreColor }}>{assessment.riskScore?.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
