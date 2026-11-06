import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>404 — Page Not Found</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>The page you're looking for doesn't exist.</p>
        <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
      </div>
    </div>
  );
}
