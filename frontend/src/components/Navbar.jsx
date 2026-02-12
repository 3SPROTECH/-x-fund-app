import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, TrendingUp, Briefcase, User, LogOut, FileCheck, ChevronDown, Plus, Wallet
} from 'lucide-react';
import WalletRechargeModal from './WalletRechargeModal';
import { walletApi } from '../api/wallet';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const profileRef = useRef(null);

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
    loadWalletBalance();
  }, []);

  const loadWalletBalance = async () => {
    try {
      const res = await walletApi.getWallet();
      const wallet = res.data.data?.attributes || res.data;
      setWalletBalance(wallet.balance_cents || 0);
    } catch (err) {
      console.error('Erreur chargement wallet:', err);
    }
  };

  const handleWalletRechargeSuccess = () => {
    loadWalletBalance();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const roleLabel = {
    investisseur: 'Investisseur',
    porteur_de_projet: 'Porteur de projet',
    administrateur: 'Administrateur',
  };

  const getInitials = () => {
    const first = user?.first_name?.charAt(0) || '';
    const last = user?.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const formatBalance = (cents) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format((cents || 0) / 100);
  };

  return (
    <nav className="advanced-navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-brand" onClick={() => navigate('/projects')}>
          <div className="brand-text">
            <span className="brand-title">X<span style={{ color: '#DAA520' }}>-</span>Fund</span>
            <span className="brand-subtitle">Plateforme d'investissement</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="navbar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <div className="nav-link-content">
              <LayoutDashboard size={18} />
              <span>Tableau de bord</span>
            </div>
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <div className="nav-link-content">
              <TrendingUp size={18} />
              <span>Projets</span>
            </div>
          </NavLink>
          <NavLink to="/investments" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <div className="nav-link-content">
              <Briefcase size={18} />
              <span>Investissements</span>
            </div>
          </NavLink>
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {/* Wallet Balance Button */}
          <button
            className="wallet-balance-btn"
            onClick={() => setShowWalletModal(true)}
            title="Recharger mon portefeuille"
          >
            <div className="wallet-icon">
              <Plus size={16} strokeWidth={3} />
            </div>
            <span className="wallet-amount">{formatBalance(walletBalance)}</span>
          </button>

          {/* Profile */}
          <div className="navbar-profile" ref={profileRef}>
            <button
              className="profile-trigger"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="profile-avatar">
                <div className="avatar-gradient" />
                <span>{getInitials()}</span>
              </div>
              <ChevronDown size={16} className={`chevron ${showProfileMenu ? 'rotate' : ''}`} />
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
                    <span className="role-badge">{roleLabel[user?.role]}</span>
                  </div>
                </div>

                <div className="profile-menu-section">
                  <span className="section-label">Mon Compte</span>
                  <NavLink
                    to="/wallet"
                    className="menu-item"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <div className="menu-item-icon">
                      <Wallet size={18} />
                    </div>
                    <div className="menu-item-content">
                      <span>Portefeuille</span>
                      <small>Gérer mon solde</small>
                    </div>
                  </NavLink>
                  <NavLink
                    to="/profile"
                    className="menu-item"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <div className="menu-item-icon">
                      <User size={18} />
                    </div>
                    <div className="menu-item-content">
                      <span>Mon Profil</span>
                      <small>Gérer mes informations</small>
                    </div>
                  </NavLink>
                  <NavLink
                    to="/kyc"
                    className="menu-item"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <div className="menu-item-icon">
                      <FileCheck size={18} />
                    </div>
                    <div className="menu-item-content">
                      <span>Vérification KYC</span>
                      <small>Statut de vérification</small>
                    </div>
                  </NavLink>
                </div>

                <div className="profile-menu-footer">
                  <button
                    className="logout-btn"
                    onClick={handleSignOut}
                  >
                    <LogOut size={18} />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <WalletRechargeModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSuccess={handleWalletRechargeSuccess}
      />
    </nav>
  );
}
