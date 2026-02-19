import { useAuth } from '../../context/AuthContext';
import UserWalletPage from '../shared/UserWalletPage';
import AdminWalletPage from '../admin/AdminWalletPage';

export default function WalletPage() {
  const { user } = useAuth();

  if (user?.role === 'administrateur') return <AdminWalletPage />;
  return <UserWalletPage />;
}
