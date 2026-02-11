import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

/** Redirige vers le tableau de bord adapté au rôle après login / accès à / */
function DashboardRedirect() {
  const { user } = useAuth();
  if (user?.role === 'administrateur') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

// Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';
import WalletPage from './pages/dashboard/WalletPage';
import PropertiesPage from './pages/dashboard/PropertiesPage';

// Projects & Investments
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import MyInvestmentsPage from './pages/investments/MyInvestmentsPage';

// Profile
import ProfilePage from './pages/profile/ProfilePage';
import KycPage from './pages/profile/KycPage';

// Admin
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';
import AdminPropertiesPage from './pages/admin/AdminPropertiesPage';
import AdminProjectsPage from './pages/admin/AdminProjectsPage';
import AdminInvestmentsPage from './pages/admin/AdminInvestmentsPage';
import AdminTransactionsPage from './pages/admin/AdminTransactionsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '10px', background: '#1a1a2e', color: '#fff', fontSize: '.875rem' } }} />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/investments" element={<MyInvestmentsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/kyc" element={<KycPage />} />

            {/* Admin routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute roles={['administrateur']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute roles={['administrateur']}>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/properties"
              element={
                <ProtectedRoute roles={['administrateur']}>
                  <AdminPropertiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/projects"
              element={
                <ProtectedRoute roles={['administrateur']}>
                  <AdminProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/investments"
              element={
                <ProtectedRoute roles={['administrateur']}>
                  <AdminInvestmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/transactions"
              element={
                <ProtectedRoute roles={['administrateur']}>
                  <AdminTransactionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute roles={['administrateur']}>
                  <AdminAuditLogsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Redirect root to dashboard selon le rôle */}
          <Route path="/" element={<DashboardRedirect />} />
          <Route path="*" element={<DashboardRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
