import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/Spinner';

const INITIAL = {
  supplierCode: '', name: '', contactPerson: '', email: '', phone: '',
  industry: '', country: '', city: '', address: '',
  yearsInOperation: '', annualContractValue: '', description: '',
};

const INDUSTRIES = [
  'Agriculture', 'Automotive', 'Chemicals', 'Construction', 'Electronics',
  'Energy', 'Food & Beverage', 'Healthcare', 'IT Services', 'Logistics',
  'Manufacturing', 'Mining', 'Packaging', 'Pharmaceuticals', 'Retail',
  'Steel & Metals', 'Textiles', 'Telecommunications', 'Other',
];

export default function SupplierForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await api.get(`/suppliers/${id}`);
        const s = res.data.data;
        setForm({
          supplierCode: s.supplierCode || '',
          name: s.name || '',
          contactPerson: s.contactPerson || '',
          email: s.email || '',
          phone: s.phone || '',
          industry: s.industry || '',
          country: s.country || '',
          city: s.city || '',
          address: s.address || '',
          yearsInOperation: s.yearsInOperation !== undefined ? String(s.yearsInOperation) : '',
          annualContractValue: s.annualContractValue !== undefined ? String(s.annualContractValue) : '',
          description: s.description || '',
        });
      } catch (_err) {
        setServerError('Failed to load supplier details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((v) => ({ ...v, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.supplierCode.trim()) errs.supplierCode = 'Supplier code is required.';
    if (!form.name.trim()) errs.name = 'Supplier name is required.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email.';
    if (form.yearsInOperation && isNaN(Number(form.yearsInOperation))) errs.yearsInOperation = 'Must be a number.';
    if (form.annualContractValue && isNaN(Number(form.annualContractValue))) errs.annualContractValue = 'Must be a number.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/suppliers/${id}`, form);
        navigate(`/suppliers/${id}`);
      } else {
        const res = await api.post('/suppliers', form);
        navigate(`/suppliers/${res.data.data._id}`);
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to save supplier.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Supplier' : 'Add Supplier'}</h1>
          <p>{isEdit ? 'Update supplier information' : 'Register a new supplier in the system'}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
      </div>

      {serverError && <div className="alert alert-error">{serverError}</div>}

      <div className="card">
        <div className="card-header">Supplier Information</div>
        <div className="card-body">
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label required" htmlFor="supplierCode">Supplier Code</label>
                <input id="supplierCode" name="supplierCode" className={`form-input${errors.supplierCode ? ' error' : ''}`}
                  value={form.supplierCode} onChange={handleChange} placeholder="e.g. SUP-099"
                  disabled={isEdit} title={isEdit ? 'Supplier code cannot be changed after creation' : ''} />
                {errors.supplierCode && <span className="form-error">{errors.supplierCode}</span>}
                {isEdit && <span className="form-hint">Code cannot be changed after creation.</span>}
              </div>

              <div className="form-group">
                <label className="form-label required" htmlFor="name">Supplier Name</label>
                <input id="name" name="name" className={`form-input${errors.name ? ' error' : ''}`}
                  value={form.name} onChange={handleChange} placeholder="Company legal name" />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contactPerson">Contact Person</label>
                <input id="contactPerson" name="contactPerson" className="form-input"
                  value={form.contactPerson} onChange={handleChange} placeholder="Primary contact name" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input id="email" name="email" type="email" className={`form-input${errors.email ? ' error' : ''}`}
                  value={form.email} onChange={handleChange} placeholder="contact@supplier.com" />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone Number</label>
                <input id="phone" name="phone" className="form-input"
                  value={form.phone} onChange={handleChange} placeholder="+1-555-000-0000" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="industry">Industry</label>
                <select id="industry" name="industry" className="form-select"
                  value={form.industry} onChange={handleChange}>
                  <option value="">Select industry…</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="country">Country</label>
                <input id="country" name="country" className="form-input"
                  value={form.country} onChange={handleChange} placeholder="e.g. Germany" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="city">City</label>
                <input id="city" name="city" className="form-input"
                  value={form.city} onChange={handleChange} placeholder="e.g. Berlin" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="yearsInOperation">Years in Operation</label>
                <input id="yearsInOperation" name="yearsInOperation" type="number" min="0"
                  className={`form-input${errors.yearsInOperation ? ' error' : ''}`}
                  value={form.yearsInOperation} onChange={handleChange} placeholder="e.g. 10" />
                {errors.yearsInOperation && <span className="form-error">{errors.yearsInOperation}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="annualContractValue">Annual Contract Value (USD)</label>
                <input id="annualContractValue" name="annualContractValue" type="number" min="0"
                  className={`form-input${errors.annualContractValue ? ' error' : ''}`}
                  value={form.annualContractValue} onChange={handleChange} placeholder="e.g. 500000" />
                {errors.annualContractValue && <span className="form-error">{errors.annualContractValue}</span>}
              </div>

              <div className="form-group full">
                <label className="form-label" htmlFor="address">Address</label>
                <input id="address" name="address" className="form-input"
                  value={form.address} onChange={handleChange} placeholder="Street address (optional)" />
              </div>

              <div className="form-group full">
                <label className="form-label" htmlFor="description">Description / Notes</label>
                <textarea id="description" name="description" className="form-textarea"
                  value={form.description} onChange={handleChange}
                  placeholder="Brief description of the supplier's products or services…" rows={3} />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Supplier'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
