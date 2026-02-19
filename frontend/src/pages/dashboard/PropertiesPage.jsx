import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import InvestorPropertiesPage from '../investor/InvestorPropertiesPage';
import PorteurPropertiesPage from '../porteur/PorteurPropertiesPage';

export default function PropertiesPage() {
  const { user } = useAuth();

  if (user?.role === 'administrateur') return <Navigate to="/admin/properties" replace />;
  if (user?.role === 'investisseur') return <InvestorPropertiesPage />;
  return <PorteurPropertiesPage />;
}
