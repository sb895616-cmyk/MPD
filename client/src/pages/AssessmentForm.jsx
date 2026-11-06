import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { previewScore } from '../services/scoring';
import Spinner from '../components/Spinner';

const FACTORS = [
  {
    key: 'financialStabilityRating',
    label: 'Financial Stability',
    weight: '25%',
    description: 'Assess the supplier\'s financial health, creditworthiness, and ability to sustain operations.',
    hints: ['1 – Very stable finances, low bankruptcy risk', '2 – Solid financials, minor concerns', '3 – Moderate stability, some red flags', '4 – Weak financials, debt concerns', '5 – Severe financial distress'],
  },
  {
    key: 'deliveryPerformanceRating',
    label: 'Delivery Performance',
    weight: '25%',
    description: 'Evaluate on-time delivery rate, lead time reliability, and responsiveness during disruptions.',
    hints: ['1 – Consistently on time, excellent reliability', '2 – Mostly on time, rare delays', '3 – Occasional delays, manageable', '4 – Frequent delays affecting operations', '5 – Chronic delays, severe disruptions'],
  },
  {
    key: 'qualityRating',
    label: 'Product / Service Quality',
    weight: '20%',
    description: 'Rate the consistency and standard of goods or services delivered against contract requirements.',
    hints: ['1 – Defect-free, exceeds standards', '2 – High quality, minor deviations', '3 – Acceptable quality, occasional issues', '4 – Below standard, frequent defects', '5 – Consistently poor, unacceptable quality'],
  },
  {
    key: 'complianceRating',
    label: 'Regulatory & Compliance Risk',
    weight: '20%',
    description: 'Review adherence to legal, environmental, labour, and contractual obligations.',
    hints: ['1 – Fully compliant, certified', '2 – Minor non-conformances, quickly resolved', '3 – Some compliance gaps, under review', '4 – Significant violations, corrective actions needed', '5 – Major legal or regulatory breaches'],
  },
  {
    key: 'dependencyRating',
    label: 'Supplier Dependency Risk',
    weight: '10%',
    description: 'Measure how heavily your operations depend on this single supplier and availability of alternatives.',
    hints: ['1 – Multiple alternatives, low dependency', '2 – Some alternatives exist', '3 – Moderate dependency, limited options', '4 – High dependency, few alternatives', '5 – Sole source, no viable substitute'],
  },
];

function RatingSelector({ factor, value, onChange }) {
  const LABELS = { 1: 'Very Low', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Very High' };
  return (
    <div className="rating-group">
      <div style={{ marginBottom: 4, fontSize: 13 }}>{factor.description}</div>
      <div className="rating-options">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`rating-btn${value === n ? ` selected-${n}` : ''}`}
            onClick={() => onChange(n)}
            title={factor.hints[n - 1]}
          >
            {n} — {LABELS[n]}
          </button>
        ))}
      </div>
      {value && <div className="rating-description">{factor.hints[value - 1]}</div>}
    </div>
  );
}

function ScorePreview({ ratings }) {
  const result = previewScore(ratings);
  if (!result) return (
    <div className="score-preview" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
      Rate all five factors to see a score preview.
    </div>
  );
  const color = { Low: 'var(--green)', Medium: 'var(--amber)', High: 'var(--red)' }[result.level];
  return (
    <div className="score-preview">
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Predicted Score</div>
        <div className="score-big">{result.score.toFixed(2)}</div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Risk Category</div>
        <div className="score-level" style={{ color }}>{result.level} Risk</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Final score is calculated server-side.
        </div>
      </div>
    </div>
  );
}

export default function AssessmentForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSupplier = searchParams.get('supplierId');

  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({
    supplierId: preselectedSupplier || '',
    financialStabilityRating: 0,
    deliveryPerformanceRating: 0,
    qualityRating: 0,
    complianceRating: 0,
    dependencyRating: 0,
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/suppliers?status=Active&limit=100');
        setSuppliers(res.data.data);
      } catch (_err) {
        setServerError('Failed to load suppliers.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setRating = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((v) => ({ ...v, [key]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.supplierId) errs.supplierId = 'Please select a supplier.';
    FACTORS.forEach((f) => {
      if (!form[f.key]) errs[f.key] = 'Please select a rating.';
    });
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const res = await api.post('/assessments', form);
      navigate(`/assessments/${res.data.data._id}`);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to submit assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>New Risk Assessment</h1>
          <p>Rate each factor 1 (very low risk) to 5 (very high risk)</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
      </div>

      {serverError && <div className="alert alert-error">{serverError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        {/* Supplier selection */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">Select Supplier</div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label required" htmlFor="supplierId">Supplier</label>
              <select
                id="supplierId"
                className={`form-select${errors.supplierId ? ' error' : ''}`}
                value={form.supplierId}
                onChange={(e) => { setForm((f) => ({ ...f, supplierId: e.target.value })); setErrors((v) => ({ ...v, supplierId: '' })); }}
              >
                <option value="">— Select active supplier —</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.supplierCode})</option>
                ))}
              </select>
              {errors.supplierId && <span className="form-error">{errors.supplierId}</span>}
              {suppliers.length === 0 && <span className="form-hint">No active suppliers found. Add a supplier first.</span>}
            </div>
          </div>
        </div>

        {/* Five factor ratings */}
        {FACTORS.map((factor) => (
          <div className="card" key={factor.key} style={{ marginBottom: 16 }}>
            <div className="card-header">
              <span>{factor.label}</span>
              <span className="badge badge-blue">Weight: {factor.weight}</span>
            </div>
            <div className="card-body">
              <RatingSelector
                factor={factor}
                value={form[factor.key]}
                onChange={(v) => setRating(factor.key, v)}
              />
              {errors[factor.key] && <div className="form-error" style={{ marginTop: 6 }}>{errors[factor.key]}</div>}
            </div>
          </div>
        ))}

        {/* Notes */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">Assessment Notes (Optional)</div>
          <div className="card-body">
            <textarea
              className="form-textarea"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Add any observations, context, or recommendations for this assessment…"
              rows={4}
            />
          </div>
        </div>

        {/* Score preview */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">Score Preview</div>
          <div className="card-body">
            <ScorePreview ratings={form} />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Assessment'}
          </button>
        </div>
      </form>
    </>
  );
}
