import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import PorteurLayout from './components/PorteurLayout';
import { withRolePath } from './utils';

// Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';
import AdminPropertiesPage from './pages/admin/AdminPropertiesPage';
import AdminProjectsPage from './pages/admin/AdminProjectsPage';
import AdminProjectDetailPage from './pages/admin/AdminProjectDetailPage';
import AdminInvestmentsPage from './pages/admin/AdminInvestmentsPage';
import AdminTransactionsPage from './pages/admin/AdminTransactionsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminWalletPage from './pages/admin/AdminWalletPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import AdminCreateProjectPage from './pages/admin/AdminCreateProjectPage';
import AdminEditProjectPage from './pages/admin/AdminEditProjectPage';
import AdminDividendDetailPage from './pages/admin/AdminDividendDetailPage';
import AdminAgentRequestsPage from './pages/admin/AdminAgentRequestsPage';
import AdminProjectStructuringPage from './pages/admin/AdminProjectStructuringPage';
import AdminLegalDocumentsPage from './pages/admin/AdminLegalDocumentsPage';

// Investor pages
import InvestorDashboardPage from './pages/investor/InvestorDashboardPage';
import InvestorPropertiesPage from './pages/investor/InvestorPropertiesPage';
import InvestorProjectsPage from './pages/investor/InvestorProjectsPage';
import InvestorProjectDetailPage from './pages/investor/InvestorProjectDetailPage';
import InvestorWalletPage from './pages/investor/InvestorWalletPage';
import InvestorProfilePage from './pages/investor/InvestorProfilePage';
import InvestorKycPage from './pages/investor/InvestorKycPage';
import InvestorInvestmentsPage from './pages/investor/InvestorInvestmentsPage';
import InvestorDividendDetailPage from './pages/investor/InvestorDividendDetailPage';

// Analyste pages
import AnalysteDashboardPage from './pages/analyste/AnalysteDashboardPage';
import AnalysteProjectsPage from './pages/analyste/AnalysteProjectsPage';
import ProjectAnalysisPage from './pages/analyste/ProjectAnalysisPage';
import AnalysteProfilePage from './pages/analyste/AnalysteProfilePage';
import AnalysteKycPage from './pages/analyste/AnalysteKycPage';

// Porteur pages
import PorteurDashboardPage from './pages/porteur/PorteurDashboardPage';
import PorteurPropertiesPage from './pages/porteur/PorteurPropertiesPage';
import PorteurProjectsPage from './pages/porteur/PorteurProjectsPage';
import PorteurProjectDetailPage from './pages/porteur/PorteurProjectDetailPage';
import PorteurCreateProjectPage from './pages/porteur/PorteurCreateProjectPage';
import PorteurEditProjectPage from './pages/porteur/PorteurEditProjectPage';
import PorteurDividendDetailPage from './pages/porteur/PorteurDividendDetailPage';
import PorteurWalletPage from './pages/porteur/PorteurWalletPage';
import PorteurProfilePage from './pages/porteur/PorteurProfilePage';
import PorteurKycPage from './pages/porteur/PorteurKycPage';
import PorteurDelaysPage from './pages/porteur/PorteurDelaysPage';
import PorteurReportsPage from './pages/porteur/PorteurReportsPage';

// Demo pages (temporary)
import DemoAnalystDashboard from './pages/demo/DemoAnalystDashboard';
import DemoAnalystProjectReview from './pages/demo/DemoAnalystProjectReview';

function DashboardRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Chargement...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={withRolePath(user.role, 'dashboard')} replace />;
}

function LegacyRoleRedirect({ suffix, allowAdmin = true }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowAdmin && user.role === 'administrateur') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to={withRolePath(user.role, suffix)} replace />;
}

function LegacyProjectDetailRedirect() {
  const { id } = useParams();
  return <LegacyRoleRedirect suffix={`projects/${id}`} />;
}

function LegacyProjectEditRedirect() {
  const { id } = useParams();
  return <LegacyRoleRedirect suffix={`projects/${id}/edit`} allowAdmin={false} />;
}

function LegacyDividendRedirect() {
  const { projectId, dividendId } = useParams();
  return <LegacyRoleRedirect suffix={`projects/${projectId}/dividends/${dividendId}`} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '10px',
              background: '#1a1a2e',
              color: '#fff',
              fontSize: '.875rem',
            },
          }}
        />

        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route
            element={(
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            )}
          >
            <Route
              path="/admin/dashboard"
              element={<ProtectedRoute roles={['administrateur']}><AdminDashboardPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/users"
              element={<ProtectedRoute roles={['administrateur']}><AdminUsersPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/kyc"
              element={<ProtectedRoute roles={['administrateur']}><AdminUsersPage kycMode /></ProtectedRoute>}
            />
            <Route
              path="/admin/agent-requests"
              element={<ProtectedRoute roles={['administrateur']}><AdminAgentRequestsPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/properties"
              element={<ProtectedRoute roles={['administrateur']}><AdminPropertiesPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/projects"
              element={<ProtectedRoute roles={['administrateur']}><AdminProjectsPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/projects/new"
              element={<ProtectedRoute roles={['administrateur']}><AdminCreateProjectPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/projects/:id"
              element={<ProtectedRoute roles={['administrateur']}><AdminProjectDetailPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/projects/:id/edit"
              element={<ProtectedRoute roles={['administrateur']}><AdminEditProjectPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/projects/:id/structuring"
              element={<ProtectedRoute roles={['administrateur']}><AdminProjectStructuringPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/projects/:id/legal-documents"
              element={<ProtectedRoute roles={['administrateur']}><AdminLegalDocumentsPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/projects/:projectId/dividends/:dividendId"
              element={<ProtectedRoute roles={['administrateur']}><AdminDividendDetailPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/projects/:id/mvp-report"
              element={<ProtectedRoute roles={['administrateur']}><Navigate to="/admin/projects" replace /></ProtectedRoute>}
            />
            <Route
              path="/admin/investments"
              element={<ProtectedRoute roles={['administrateur']}><AdminInvestmentsPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/transactions"
              element={<ProtectedRoute roles={['administrateur']}><AdminTransactionsPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/audit"
              element={<ProtectedRoute roles={['administrateur']}><AdminAuditLogsPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/settings"
              element={<ProtectedRoute roles={['administrateur']}><AdminSettingsPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/wallet"
              element={<ProtectedRoute roles={['administrateur']}><AdminWalletPage /></ProtectedRoute>}
            />
            <Route
              path="/admin/profile"
              element={<ProtectedRoute roles={['administrateur']}><AdminProfilePage /></ProtectedRoute>}
            />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Demo Analyst (temporary) */}
            <Route
              path="/demo/analyst"
              element={<ProtectedRoute roles={['administrateur']}><DemoAnalystDashboard /></ProtectedRoute>}
            />
            <Route
              path="/demo/analyst/projects/:id"
              element={<ProtectedRoute roles={['administrateur']}><DemoAnalystProjectReview /></ProtectedRoute>}
            />
            {/* Analyste routes */}
            <Route
              path="/analyste/dashboard"
              element={<ProtectedRoute roles={['analyste']}><AnalysteDashboardPage /></ProtectedRoute>}
            />
            <Route
              path="/analyste/projects"
              element={<ProtectedRoute roles={['analyste']}><AnalysteProjectsPage /></ProtectedRoute>}
            />
            <Route
              path="/analyste/projects/:id"
              element={<ProtectedRoute roles={['analyste']}><ProjectAnalysisPage /></ProtectedRoute>}
            />
            <Route
              path="/analyste/kyc"
              element={<ProtectedRoute roles={['analyste']}><AnalysteKycPage /></ProtectedRoute>}
            />
            <Route
              path="/analyste/profile"
              element={<ProtectedRoute roles={['analyste']}><AnalysteProfilePage /></ProtectedRoute>}
            />
            <Route path="/analyste" element={<Navigate to="/analyste/dashboard" replace />} />

            <Route
              path="/investor/dashboard"
              element={<ProtectedRoute roles={['investisseur']}><InvestorDashboardPage /></ProtectedRoute>}
            />
            <Route
              path="/investor/wallet"
              element={<ProtectedRoute roles={['investisseur']}><InvestorWalletPage /></ProtectedRoute>}
            />
            <Route
              path="/investor/properties"
              element={<ProtectedRoute roles={['investisseur']}><InvestorPropertiesPage /></ProtectedRoute>}
            />
            <Route
              path="/investor/projects"
              element={<ProtectedRoute roles={['investisseur']}><InvestorProjectsPage /></ProtectedRoute>}
            />
            <Route
              path="/investor/projects/:id"
              element={<ProtectedRoute roles={['investisseur']}><InvestorProjectDetailPage /></ProtectedRoute>}
            />
            <Route
              path="/investor/projects/:projectId/dividends/:dividendId"
              element={<ProtectedRoute roles={['investisseur']}><InvestorDividendDetailPage /></ProtectedRoute>}
            />
            <Route
              path="/investor/investments"
              element={<ProtectedRoute roles={['investisseur']}><InvestorInvestmentsPage /></ProtectedRoute>}
            />
            <Route
              path="/investor/profile"
              element={<ProtectedRoute roles={['investisseur']}><InvestorProfilePage /></ProtectedRoute>}
            />
            <Route
              path="/investor/kyc"
              element={<ProtectedRoute roles={['investisseur']}><InvestorKycPage /></ProtectedRoute>}
            />
            <Route path="/investor" element={<Navigate to="/investor/dashboard" replace />} />
          </Route>

          {/* Porteur routes — root-level paths, separate layout */}
          <Route
            element={(
              <ProtectedRoute>
                <PorteurLayout />
              </ProtectedRoute>
            )}
          >
            <Route
              path="/dashboard"
              element={<ProtectedRoute roles={['porteur_de_projet']}><PorteurDashboardPage /></ProtectedRoute>}
            />
            <Route
              path="/wallet"
              element={<ProtectedRoute roles={['porteur_de_projet']}><PorteurWalletPage /></ProtectedRoute>}
            />
            <Route
              path="/properties"
              element={<ProtectedRoute roles={['porteur_de_projet']}><PorteurPropertiesPage /></ProtectedRoute>}
            />
            <Route
              path="/projects"
              element={<ProtectedRoute roles={['porteur_de_projet']}><PorteurProjectsPage /></ProtectedRoute>}
            />
            <Route
              path="/projects/new"
              element={<ProtectedRoute roles={['porteur_de_projet']}><PorteurCreateProjectPage /></ProtectedRoute>}
            />
            <Route
              path="/projects/:id/edit"
              element={<ProtectedRoute roles={['porteur_de_projet']}><PorteurEditProjectPage /></ProtectedRoute>}
            />
            <Route
              path="/projects/:id"
              element={<ProtectedRoute roles={['porteur_de_projet']}><PorteurProjectDetailPage /></ProtectedRoute>}
            />
            <Route
              path="/projects/:projectId/dividends/:dividendId"
              element={<ProtectedRoute roles={['porteur_de_projet']}><PorteurDividendDetailPage /></ProtectedRoute>}
            />
            <Route
              path="/profile"
              element={<ProtectedRoute roles={['porteur_de_projet']}><PorteurProfilePage /></ProtectedRoute>}
            />
            <Route
              path="/kyc"
              element={<ProtectedRoute roles={['porteur_de_projet']}><PorteurKycPage /></ProtectedRoute>}
            />
            <Route
              path="/reports"
              element={<ProtectedRoute roles={['porteur_de_projet']}><PorteurReportsPage /></ProtectedRoute>}
            />
            <Route
              path="/delays"
              element={<ProtectedRoute roles={['porteur_de_projet']}><PorteurDelaysPage /></ProtectedRoute>}
            />
          </Route>

          <Route path="/" element={<DashboardRedirect />} />
          <Route path="*" element={<DashboardRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
