import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SupplierList from './pages/SupplierList';
import SupplierForm from './pages/SupplierForm';
import SupplierDetail from './pages/SupplierDetail';
import AssessmentForm from './pages/AssessmentForm';
import AssessmentDetail from './pages/AssessmentDetail';
import AssessmentHistory from './pages/AssessmentHistory';
import UserManagement from './pages/UserManagement';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute><SupplierList /></ProtectedRoute>} />
          <Route path="/suppliers/new" element={<ProtectedRoute><SupplierForm /></ProtectedRoute>} />
          <Route path="/suppliers/:id" element={<ProtectedRoute><SupplierDetail /></ProtectedRoute>} />
          <Route path="/suppliers/:id/edit" element={<ProtectedRoute><SupplierForm /></ProtectedRoute>} />
          <Route path="/suppliers/:supplierId/assessments" element={<ProtectedRoute><AssessmentHistory /></ProtectedRoute>} />
          <Route path="/assessments" element={<ProtectedRoute><AssessmentHistory /></ProtectedRoute>} />
          <Route path="/assessments/new" element={<ProtectedRoute><AssessmentForm /></ProtectedRoute>} />
          <Route path="/assessments/:id" element={<ProtectedRoute><AssessmentDetail /></ProtectedRoute>} />

          <Route path="/admin/users" element={<ProtectedRoute requiredRole="Admin"><UserManagement /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
