import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import InvestorDashboardPage from '../investor/InvestorDashboardPage';
import PorteurDashboardPage from '../porteur/PorteurDashboardPage';

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'administrateur') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'investisseur') return <InvestorDashboardPage />;
  return <PorteurDashboardPage />;
}
