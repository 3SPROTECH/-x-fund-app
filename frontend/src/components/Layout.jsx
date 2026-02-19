import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut, User, LayoutDashboard, Wallet, Building, FileCheck,
  TrendingUp, Briefcase, Shield, BarChart3, ScrollText, CreditCard, Settings,
  Menu, X,
} from 'lucide-react';
import Navbar from './Navbar';

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAdminMobileMenu, setShowAdminMobileMenu] = useState(false);

  useEffect(() => {
    setShowAdminMobileMenu(false);
  }, [location.pathname]);

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
      <div className="layout admin-mobile-layout">
        {/* Sidebar desktop (caché sur mobile via CSS) */}
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

            <div className="nav-section"><span className="nav-section-label">Systeme</span></div>
            <NavLink to="/admin/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Settings size={18} /><span>Parametres</span>
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

        {/* Topbar mobile admin */}
        <div className="admin-mobile-topbar">
          <button className="admin-mobile-menu-btn" onClick={() => setShowAdminMobileMenu(!showAdminMobileMenu)}>
            {showAdminMobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="admin-mobile-logo">X<span style={{ color: '#DAA520' }}>-</span>Fund</span>
          <span className="admin-mobile-role">Admin</span>
        </div>

        {/* Menu mobile déroulant admin */}
        {showAdminMobileMenu && (
          <div className="admin-mobile-dropdown">
            <NavLink to="/wallet" className={({ isActive }) => `admin-mobile-item${isActive ? ' active' : ''}`} onClick={() => setShowAdminMobileMenu(false)}>
              <Wallet size={20} /><span>Portefeuille</span>
            </NavLink>
            <NavLink to="/admin/investments" className={({ isActive }) => `admin-mobile-item${isActive ? ' active' : ''}`} onClick={() => setShowAdminMobileMenu(false)}>
              <TrendingUp size={20} /><span>Investissements</span>
            </NavLink>
            <NavLink to="/admin/transactions" className={({ isActive }) => `admin-mobile-item${isActive ? ' active' : ''}`} onClick={() => setShowAdminMobileMenu(false)}>
              <CreditCard size={20} /><span>Transactions</span>
            </NavLink>
            <NavLink to="/admin/audit" className={({ isActive }) => `admin-mobile-item${isActive ? ' active' : ''}`} onClick={() => setShowAdminMobileMenu(false)}>
              <ScrollText size={20} /><span>Audit Logs</span>
            </NavLink>
            <NavLink to="/admin/settings" className={({ isActive }) => `admin-mobile-item${isActive ? ' active' : ''}`} onClick={() => setShowAdminMobileMenu(false)}>
              <Settings size={20} /><span>Parametres</span>
            </NavLink>
            <div className="admin-mobile-item admin-mobile-user" onClick={() => { navigate('/profile'); setShowAdminMobileMenu(false); }}>
              <User size={20} />
              <div><span>{user?.first_name} {user?.last_name}</span><small>{roleLabel[user?.role]}</small></div>
            </div>
            <button className="admin-mobile-item admin-mobile-logout" onClick={handleSignOut}>
              <LogOut size={20} /><span>Deconnexion</span>
            </button>
          </div>
        )}

        <main className="main-content">
          <Outlet />
        </main>

        {/* Bottom tab bar admin mobile */}
        <div className="admin-bottom-nav">
          <NavLink to="/admin/dashboard" className={({ isActive }) => `admin-bottom-tab${isActive ? ' active' : ''}`}>
            <BarChart3 size={22} /><span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `admin-bottom-tab${isActive ? ' active' : ''}`}>
            <Shield size={22} /><span>Users</span>
          </NavLink>
          <NavLink to="/admin/properties" className={({ isActive }) => `admin-bottom-tab${isActive ? ' active' : ''}`}>
            <Building size={22} /><span>Biens</span>
          </NavLink>
          <NavLink to="/admin/projects" className={({ isActive }) => `admin-bottom-tab${isActive ? ' active' : ''}`}>
            <Briefcase size={22} /><span>Projets</span>
          </NavLink>
          <button className="admin-bottom-tab" onClick={() => setShowAdminMobileMenu(!showAdminMobileMenu)}>
            <Menu size={22} /><span>Plus</span>
          </button>
        </div>
      </div>
    );
  }

  // Layout pour porteurs de projet: sidebar verticale
  const [showPorteurMobileMenu, setShowPorteurMobileMenu] = useState(false);

  useEffect(() => {
    setShowPorteurMobileMenu(false);
  }, [location.pathname]);

  return (
    <div className="layout porteur-mobile-layout">
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

      {/* Topbar mobile porteur */}
      <div className="porteur-mobile-topbar">
        <button className="admin-mobile-menu-btn" onClick={() => setShowPorteurMobileMenu(!showPorteurMobileMenu)}>
          {showPorteurMobileMenu ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span className="admin-mobile-logo">X<span style={{ color: '#DAA520' }}>-</span>Fund</span>
        <span className="admin-mobile-role">Porteur</span>
      </div>

      {/* Menu mobile déroulant porteur */}
      {showPorteurMobileMenu && (
        <div className="admin-mobile-dropdown">
          <NavLink to="/wallet" className={({ isActive }) => `admin-mobile-item${isActive ? ' active' : ''}`} onClick={() => setShowPorteurMobileMenu(false)}>
            <Wallet size={20} /><span>Portefeuille</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `admin-mobile-item${isActive ? ' active' : ''}`} onClick={() => setShowPorteurMobileMenu(false)}>
            <User size={20} /><span>Profil</span>
          </NavLink>
          <NavLink to="/kyc" className={({ isActive }) => `admin-mobile-item${isActive ? ' active' : ''}`} onClick={() => setShowPorteurMobileMenu(false)}>
            <FileCheck size={20} /><span>KYC</span>
          </NavLink>
          <div className="admin-mobile-item admin-mobile-user" onClick={() => { navigate('/profile'); setShowPorteurMobileMenu(false); }}>
            <User size={20} />
            <div><span>{user?.first_name} {user?.last_name}</span><small>{roleLabel[user?.role]}</small></div>
          </div>
          <button className="admin-mobile-item admin-mobile-logout" onClick={handleSignOut}>
            <LogOut size={20} /><span>Déconnexion</span>
          </button>
        </div>
      )}

      <main className="main-content">
        <Outlet />
      </main>

      {/* Bottom tab bar porteur mobile */}
      <div className="porteur-bottom-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `admin-bottom-tab${isActive ? ' active' : ''}`}>
          <LayoutDashboard size={22} /><span>Accueil</span>
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => `admin-bottom-tab${isActive ? ' active' : ''}`}>
          <TrendingUp size={22} /><span>Projets</span>
        </NavLink>
        {isPorteur && (
          <NavLink to="/properties" className={({ isActive }) => `admin-bottom-tab${isActive ? ' active' : ''}`}>
            <Building size={22} /><span>Biens</span>
          </NavLink>
        )}
        <button className="admin-bottom-tab" onClick={() => setShowPorteurMobileMenu(!showPorteurMobileMenu)}>
          <Menu size={22} /><span>Plus</span>
        </button>
      </div>
    </div>
  );
}
