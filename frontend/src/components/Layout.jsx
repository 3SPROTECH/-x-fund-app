import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut, User, LayoutDashboard, Wallet, Building, FileCheck,
  TrendingUp, Briefcase, Shield, BarChart3, ScrollText, CreditCard,
} from 'lucide-react';
import Navbar from './Navbar';

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const roleLabel = {
    investisseur: 'Investisseur',
    porteur_de_projet: 'Porteur de projet',
    administrateur: 'Administrateur',
  };

  const isAdmin = user?.role === 'administrateur';
  const isPorteur = user?.role === 'porteur_de_projet';
  const isInvestor = user?.role === 'investisseur';

  // Layout pour investisseurs: navbar horizontale
  if (isInvestor) {
    return (
      <div className="investor-layout">
        <Navbar />
        <main className="investor-content">
          <Outlet />
        </main>
      </div>
    );
  }

  // Admin sidebar
  if (isAdmin) {
    return (
      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <span className="logo">X<span style={{ color: '#DAA520' }}>-</span>Fund</span>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section"><span className="nav-section-label">Vue d'ensemble</span></div>
            <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <BarChart3 size={18} /><span>Tableau de bord</span>
            </NavLink>
            <NavLink to="/wallet" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Wallet size={18} /><span>Portefeuille</span>
            </NavLink>

            <div className="nav-section"><span className="nav-section-label">Gestion</span></div>
            <NavLink to="/admin/users" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Shield size={18} /><span>Utilisateurs</span>
            </NavLink>
            <NavLink to="/admin/properties" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Building size={18} /><span>Biens immobiliers</span>
            </NavLink>
            <NavLink to="/admin/projects" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Briefcase size={18} /><span>Projets</span>
            </NavLink>
            <NavLink to="/admin/investments" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <TrendingUp size={18} /><span>Investissements</span>
            </NavLink>

            <div className="nav-section"><span className="nav-section-label">Finances</span></div>
            <NavLink to="/admin/transactions" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <CreditCard size={18} /><span>Transactions</span>
            </NavLink>
            <NavLink to="/admin/audit" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <ScrollText size={18} /><span>Audit Logs</span>
            </NavLink>
          </nav>

          <div className="sidebar-footer">
            <div className="user-info user-info-clickable" onClick={() => navigate('/profile')} title="Voir le profil">
              <span className="user-name">{user?.first_name} {user?.last_name}</span>
              <span className="user-role">{roleLabel[user?.role] || user?.role}</span>
            </div>
            <button onClick={handleSignOut} className="btn-icon" title="Se déconnecter" style={{ color: '#DAA520' }}>
              <LogOut size={18} />
            </button>
          </div>
        </aside>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    );
  }

  // Layout pour porteurs de projet: sidebar verticale
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="logo">X<span style={{ color: '#DAA520' }}>-</span>Fund</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section"><span className="nav-section-label">Principal</span></div>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <LayoutDashboard size={18} /><span>Tableau de bord</span>
          </NavLink>
          <NavLink to="/wallet" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Wallet size={18} /><span>Portefeuille</span>
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <TrendingUp size={18} /><span>Projets</span>
          </NavLink>
          <NavLink to="/investments" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Briefcase size={18} /><span>Mes Investissements</span>
          </NavLink>

          {isPorteur && (
            <>
              <div className="nav-section"><span className="nav-section-label">Immobilier</span></div>
              <NavLink to="/properties" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <Building size={18} /><span>Biens immobiliers</span>
              </NavLink>
            </>
          )}

          <div className="nav-section"><span className="nav-section-label">Compte</span></div>
          <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <User size={18} /><span>Profil</span>
          </NavLink>
          <NavLink to="/kyc" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <FileCheck size={18} /><span>KYC</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user?.first_name} {user?.last_name}</span>
            <span className="user-role">{roleLabel[user?.role] || user?.role}</span>
          </div>
          <button onClick={handleSignOut} className="btn-icon" title="Se déconnecter" style={{ color: '#DAA520' }}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
