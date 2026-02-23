import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User, LogOut, ChevronDown, BarChart3, Building, Briefcase,
  Wallet, AlertTriangle, FileText, Menu, X,
} from 'lucide-react';
import { ROLE_LABELS } from '../utils';
import NotificationBell from './NotificationBell';
import FloatingChat from './FloatingChat';

export default function PorteurLayout() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const dropdownRef = useRef(null);

    const kycVerified = user?.kyc_status === 'verified';

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setShowMobileMenu(false);
    }, [location.pathname]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const getInitials = () => {
        const first = user?.first_name?.charAt(0) || '';
        const last = user?.last_name?.charAt(0) || '';
        return (first + last).toUpperCase() || 'U';
    };

    // KYC verified: sidebar layout (same pattern as admin in Layout.jsx)
    if (kycVerified) {
        return (
            <div className="layout admin-mobile-layout">
                {/* Sidebar desktop */}
                <aside className="sidebar">
                    <div className="sidebar-header">
                        <span className="logo">X<span style={{ color: '#DAA520' }}>-</span>Fund</span>
                    </div>

                    <nav className="sidebar-nav">
                        <div className="nav-section"><span className="nav-section-label">Vue d'ensemble</span></div>
                        <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                            <BarChart3 size={18} /><span>Tableau de bord</span>
                        </NavLink>

                        <div className="nav-section"><span className="nav-section-label">Gestion</span></div>
                        <NavLink to="/properties" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                            <Building size={18} /><span>Proprietes</span>
                        </NavLink>
                        <NavLink to="/projects" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                            <Briefcase size={18} /><span>Projets</span>
                        </NavLink>
                        <NavLink to="/wallet" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                            <Wallet size={18} /><span>Portefeuille</span>
                        </NavLink>

                        <div className="nav-section"><span className="nav-section-label">Suivi</span></div>
                        <NavLink to="/reports" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                            <FileText size={18} /><span>Rapports</span>
                        </NavLink>
                        <NavLink to="/delays" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                            <AlertTriangle size={18} /><span>Retards</span>
                        </NavLink>
                    </nav>

                    <div className="sidebar-footer">
                        <div className="user-info user-info-clickable" onClick={() => navigate('/profile')} title="Voir le profil">
                            <span className="user-name">{user?.first_name} {user?.last_name}</span>
                            <span className="user-role">{ROLE_LABELS[user?.role] || user?.role}</span>
                        </div>
                        <button onClick={handleSignOut} className="btn-icon" title="Se deconnecter" style={{ color: '#DAA520' }}>
                            <LogOut size={18} />
                        </button>
                    </div>
                </aside>

                {/* Topbar mobile */}
                <div className="admin-mobile-topbar">
                    <button className="admin-mobile-menu-btn" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                        {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
                    </button>
                    <span className="admin-mobile-logo">X<span style={{ color: '#DAA520' }}>-</span>Fund</span>
                    <div className="admin-mobile-topbar-actions">
                        <NotificationBell />
                        <span className="admin-mobile-role">Porteur</span>
                    </div>
                </div>

                {/* Menu mobile dropdown */}
                {showMobileMenu && (
                    <div className="admin-mobile-dropdown">
                        <NavLink to="/wallet" className={({ isActive }) => `admin-mobile-item${isActive ? ' active' : ''}`} onClick={() => setShowMobileMenu(false)}>
                            <Wallet size={20} /><span>Portefeuille</span>
                        </NavLink>
                        <NavLink to="/reports" className={({ isActive }) => `admin-mobile-item${isActive ? ' active' : ''}`} onClick={() => setShowMobileMenu(false)}>
                            <FileText size={20} /><span>Rapports</span>
                        </NavLink>
                        <NavLink to="/delays" className={({ isActive }) => `admin-mobile-item${isActive ? ' active' : ''}`} onClick={() => setShowMobileMenu(false)}>
                            <AlertTriangle size={20} /><span>Retards</span>
                        </NavLink>
                        <div className="admin-mobile-item admin-mobile-user" onClick={() => { navigate('/profile'); setShowMobileMenu(false); }}>
                            <User size={20} />
                            <div><span>{user?.first_name} {user?.last_name}</span><small>{ROLE_LABELS[user?.role]}</small></div>
                        </div>
                        <button className="admin-mobile-item admin-mobile-logout" onClick={handleSignOut}>
                            <LogOut size={20} /><span>Deconnexion</span>
                        </button>
                    </div>
                )}

                <main className="main-content">
                    <div className="content-topbar">
                        <div className="content-topbar-left" />
                        <div className="content-topbar-right">
                            <NotificationBell />
                            <div className="content-topbar-user" onClick={() => navigate('/profile')}>
                                <span>{user?.first_name} {user?.last_name}</span>
                            </div>
                        </div>
                    </div>
                    <Outlet />
                </main>

                {/* Bottom tab bar mobile */}
                <div className="admin-bottom-nav">
                    <NavLink to="/dashboard" className={({ isActive }) => `admin-bottom-tab${isActive ? ' active' : ''}`}>
                        <BarChart3 size={22} /><span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/projects" className={({ isActive }) => `admin-bottom-tab${isActive ? ' active' : ''}`}>
                        <Briefcase size={22} /><span>Projets</span>
                    </NavLink>
                    <NavLink to="/properties" className={({ isActive }) => `admin-bottom-tab${isActive ? ' active' : ''}`}>
                        <Building size={22} /><span>Biens</span>
                    </NavLink>
                    <NavLink to="/wallet" className={({ isActive }) => `admin-bottom-tab${isActive ? ' active' : ''}`}>
                        <Wallet size={22} /><span>Wallet</span>
                    </NavLink>
                    <button className="admin-bottom-tab" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                        <Menu size={22} /><span>Plus</span>
                    </button>
                </div>
            </div>
        );
    }

    // KYC not verified: header-only layout (original)
    return (
        <div className="porteur-layout">
            <header className="porteur-header">
                <div className="porteur-header-inner">
                    <div className="porteur-header-logo" onClick={() => navigate('/dashboard')}>
                        <div className="porteur-logo-wrap">
                            <span className="porteur-logo-text">X<span className="porteur-logo-accent">-</span>Fund</span>
                            <span className="porteur-logo-sub">Espace de financement</span>
                        </div>
                    </div>

                    <div className="porteur-header-profile" ref={dropdownRef}>
                        <button
                            className="porteur-avatar-trigger"
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            <div className="porteur-avatar">
                                <span>{getInitials()}</span>
                            </div>
                            <ChevronDown size={14} className={`porteur-avatar-chevron${showDropdown ? ' open' : ''}`} />
                        </button>

                        {showDropdown && (
                            <div className="porteur-avatar-dropdown">
                                <div className="porteur-dropdown-header">
                                    <div className="porteur-dropdown-avatar">
                                        <span>{getInitials()}</span>
                                    </div>
                                    <div className="porteur-dropdown-info">
                                        <span className="porteur-dropdown-name">{user?.first_name} {user?.last_name}</span>
                                        <span className="porteur-dropdown-email">{user?.email}</span>
                                    </div>
                                </div>
                                <div className="porteur-dropdown-divider" />
                                <button
                                    className="porteur-dropdown-item"
                                    onClick={() => { navigate('/profile'); setShowDropdown(false); }}
                                >
                                    <User size={16} />
                                    <span>Mon Profil</span>
                                </button>
                                <div className="porteur-dropdown-divider" />
                                <button className="porteur-dropdown-item porteur-dropdown-logout" onClick={handleSignOut}>
                                    <LogOut size={16} />
                                    <span>Deconnexion</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="porteur-main">
                <Outlet />
            </main>

            <FloatingChat />
        </div>
    );
}
