import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';
import Layout from './Layout';

/**
 * Wraps private routes. Redirects to /login if unauthenticated.
 * Optionally restricts to a specific role (e.g. 'Admin').
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner text="Authenticating..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
}
