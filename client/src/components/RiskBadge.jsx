/**
 * Displays a coloured badge for a risk level or supplier status.
 */
export default function RiskBadge({ level, status }) {
  if (status) {
    const cls = status === 'Active' ? 'badge-green' : 'badge-grey';
    return <span className={`badge ${cls}`}>{status}</span>;
  }
  if (!level) return <span className="badge badge-grey">Not Assessed</span>;
  const map = { Low: 'badge-green', Medium: 'badge-amber', High: 'badge-red' };
  return <span className={`badge ${map[level] || 'badge-grey'}`}>{level} Risk</span>;
}
