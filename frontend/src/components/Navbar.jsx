import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, TrendingUp, Briefcase, User, LogOut, FileCheck, Plus, Wallet, Menu, X
} from 'lucide-react';
import WalletRechargeModal from './WalletRechargeModal';
import NotificationBell from './NotificationBell';
import useWalletStore from '../stores/useWalletStore';
import { formatBalance, ROLE_LABELS } from '../utils';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { wallet, fetchWallet } = useWalletStore();
  const investorBase = '/investor';
  const walletBalance = wallet?.balance_cents || 0;
  const profileRef = useRef(null);

  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = () => {
    const first = user?.first_name?.charAt(0) || '';
    const last = user?.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  return (
    <>
      <nav className="advanced-navbar">
        <div className="navbar-container">
          {/* Hamburger mobile */}
          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <div className="nav-brand" onClick={() => navigate(`${investorBase}/projects`)}>
            <div className="brand-text">
              <span className="brand-title">X<span style={{ color: '#DAA520' }}>-</span>Fund</span>
              <span className="brand-subtitle">Plateforme d'investissement</span>
            </div>
          </div>

          {/* Navigation links - centered */}
          <div className="nav-links-center">
            <NavLink to={`${investorBase}/dashboard`} className={({ isActive }) => `nav-link-text${isActive ? ' active' : ''}`}>
              Tableau de bord
            </NavLink>
            <NavLink to={`${investorBase}/projects`} className={({ isActive }) => `nav-link-text${isActive ? ' active' : ''}`}>
              Projets
            </NavLink>
            <NavLink to={`${investorBase}/investments`} className={({ isActive }) => `nav-link-text${isActive ? ' active' : ''}`}>
              Investissements
            </NavLink>
          </div>

          {/* Right actions */}
          <div className="nav-right">
            <div className="balance-badge">
              <Wallet size={18} />
              <span>{formatBalance(walletBalance)}</span>
            </div>
            <NotificationBell />
            <button className="btn-add-funds" onClick={() => setShowWalletModal(true)}>
              <Plus size={18} />
              <span>Abondement</span>
            </button>
            <div className="navbar-profile" ref={profileRef}>
              <button className="nav-avatar" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                {getInitials()}
              </button>

              {showProfileMenu && (
                <div className="profile-menu">
                  <div className="profile-menu-header">
                    <div className="profile-avatar-large">
                      <div className="avatar-gradient-large" />
                      <span>{getInitials()}</span>
                    </div>
                    <div className="profile-header-info">
                      <h4>{user?.first_name} {user?.last_name}</h4>
                      <p>{user?.email}</p>
                      <span className="role-badge">{ROLE_LABELS[user?.role]}</span>
                    </div>
                  </div>

                  <div className="profile-menu-section">
                    <span className="section-label">Mon Compte</span>
                    <NavLink to={`${investorBase}/wallet`} className="menu-item" onClick={() => setShowProfileMenu(false)}>
                      <div className="menu-item-icon"><Wallet size={18} /></div>
                      <div className="menu-item-content">
                        <span>Portefeuille</span>
                        <small>Gérer mon solde</small>
                      </div>
                    </NavLink>
                    <NavLink to={`${investorBase}/profile`} className="menu-item" onClick={() => setShowProfileMenu(false)}>
                      <div className="menu-item-icon"><User size={18} /></div>
                      <div className="menu-item-content">
                        <span>Mon Profil</span>
                        <small>Gérer mes informations</small>
                      </div>
                    </NavLink>
                    <NavLink to={`${investorBase}/kyc`} className="menu-item" onClick={() => setShowProfileMenu(false)}>
                      <div className="menu-item-icon"><FileCheck size={18} /></div>
                      <div className="menu-item-content">
                        <span>Vérification KYC</span>
                        <small>Statut de vérification</small>
                      </div>
                    </NavLink>
                  </div>

                  <div className="profile-menu-footer">
                    <button className="logout-btn" onClick={handleSignOut}>
                      <LogOut size={18} />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Menu mobile déroulant */}
        {showMobileMenu && (
          <div className="mobile-menu-dropdown">
            <NavLink to={`${investorBase}/wallet`} className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <Wallet size={20} />
              <div>
                <span>Portefeuille</span>
                <small>{formatBalance(walletBalance)}</small>
              </div>
            </NavLink>
            <NavLink to={`${investorBase}/profile`} className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <User size={20} />
              <div>
                <span>Mon Profil</span>
                <small>{user?.first_name} {user?.last_name}</small>
              </div>
            </NavLink>
            <NavLink to={`${investorBase}/kyc`} className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              <FileCheck size={20} />
              <div>
                <span>Vérification KYC</span>
              </div>
            </NavLink>
            <button className="mobile-menu-item mobile-logout" onClick={handleSignOut}>
              <LogOut size={20} />
              <div><span>Déconnexion</span></div>
            </button>
          </div>
        )}
      </nav>

      {/* Bottom Tab Bar mobile */}
      <div className="mobile-bottom-nav">
        <NavLink to={`${investorBase}/dashboard`} className={({ isActive }) => `bottom-tab${isActive ? ' active' : ''}`}>
          <LayoutDashboard size={22} />
          <span>Accueil</span>
        </NavLink>
        <NavLink to={`${investorBase}/projects`} className={({ isActive }) => `bottom-tab${isActive ? ' active' : ''}`}>
          <TrendingUp size={22} />
          <span>Projets</span>
        </NavLink>
        <button className="bottom-tab bottom-tab-wallet" onClick={() => setShowWalletModal(true)}>
          <div className="bottom-tab-wallet-icon">
            <Plus size={20} strokeWidth={3} />
          </div>
          <span>Recharger</span>
        </button>
        <NavLink to={`${investorBase}/investments`} className={({ isActive }) => `bottom-tab${isActive ? ' active' : ''}`}>
          <Briefcase size={22} />
          <span>Invest.</span>
        </NavLink>
        <NavLink to={`${investorBase}/profile`} className={({ isActive }) => `bottom-tab${isActive ? ' active' : ''}`}>
          <User size={22} />
          <span>Profil</span>
        </NavLink>
      </div>

      <WalletRechargeModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </>
  );
}
