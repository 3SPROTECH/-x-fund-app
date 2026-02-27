import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User, LogOut, ChevronDown, BarChart3, Building, Briefcase,
  Wallet, AlertTriangle, FileText, Menu, X, FileCheck,
} from 'lucide-react';
import { ROLE_LABELS } from '../utils';
import NotificationBell from './NotificationBell';
import FloatingChat from './FloatingChat';
import xfundLogo from '../assets/XFUND LOGO.png';

export default function PorteurLayout() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const dropdownRef = useRef(null);
    const profileRef = useRef(null);

    const kycVerified = user?.kyc_status === 'verified';

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setShowProfileMenu(false);
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

    // KYC verified: white horizontal navbar layout (like investor)
    if (kycVerified) {
        return (
            <>
                <nav className="advanced-navbar">
                    <div className="navbar-container porteur-navbar-container">
                        {/* Mobile header (no hamburger) */}
                        <div className="porteur-mobile-header">
                            <div className="pmh-left" aria-hidden="true" />
                            <div className="pmh-logo" onClick={() => navigate('/dashboard')}>
                                <img src={xfundLogo} alt="X-Fund" className="brand-logo-img" />
                            </div>
                            <div className="pmh-right">
                                <NotificationBell />
                            </div>
                        </div>

                        {/* Logo */}
                        <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
                            <div className="brand-text">
                                <img src={xfundLogo} alt="X-Fund" className="brand-logo-img" />
                                <span className="brand-subtitle">Espace porteur de projet</span>
                            </div>
                        </div>

                        {/* Navigation desktop */}
                        <div className="navbar-nav">
                            <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                                <div className="nav-link-content">
                                    <BarChart3 size={18} />
                                    <span>Tableau de bord</span>
                                </div>
                            </NavLink>
                            <NavLink to="/properties" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                                <div className="nav-link-content">
                                    <Building size={18} />
                                    <span>Proprietes</span>
                                </div>
                            </NavLink>
                            <NavLink to="/projects" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                                <div className="nav-link-content">
                                    <Briefcase size={18} />
                                    <span>Projets</span>
                                </div>
                            </NavLink>
                            <NavLink to="/wallet" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                                <div className="nav-link-content">
                                    <Wallet size={18} />
                                    <span>Portefeuille</span>
                                </div>
                            </NavLink>
                            <NavLink to="/reports" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                                <div className="nav-link-content">
                                    <FileText size={18} />
                                    <span>Rapports</span>
                                </div>
                            </NavLink>
                            <NavLink to="/delays" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                                <div className="nav-link-content">
                                    <AlertTriangle size={18} />
                                    <span>Retards</span>
                                </div>
                            </NavLink>
                        </div>

                        {/* Actions */}
                        <div className="navbar-actions">
                            <NotificationBell />

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
                                            <div className="profile-header-info">
                                                <h4>{user?.first_name} {user?.last_name}</h4>
                                                <span className="role-badge">{ROLE_LABELS[user?.role]}</span>
                                            </div>
                                        </div>

                                        <div className="profile-menu-section">
                                            <span className="section-label">Mon Compte</span>
                                            <NavLink to="/profile" className="menu-item" onClick={() => setShowProfileMenu(false)}>
                                                <div className="menu-item-icon"><User size={18} /></div>
                                                <div className="menu-item-content">
                                                    <span>Mon Profil</span>
                                                    <small>Gerer mes informations</small>
                                                </div>
                                            </NavLink>
                                            <NavLink to="/kyc" className="menu-item" onClick={() => setShowProfileMenu(false)}>
                                                <div className="menu-item-icon"><FileCheck size={18} /></div>
                                                <div className="menu-item-content">
                                                    <span>Verification KYC</span>
                                                    <small>Statut de verification</small>
                                                </div>
                                            </NavLink>
                                        </div>

                                        <div className="profile-menu-footer">
                                            <button className="logout-btn" onClick={handleSignOut}>
                                                <LogOut size={18} />
                                                <span>Deconnexion</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Menu mobile deroulant */}
                    {showMobileMenu && (
                        <div className="mobile-menu-dropdown">
                            <NavLink to="/wallet" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
                                <Wallet size={20} />
                                <div><span>Portefeuille</span></div>
                            </NavLink>
                            <NavLink to="/reports" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
                                <FileText size={20} />
                                <div><span>Rapports</span></div>
                            </NavLink>
                            <NavLink to="/delays" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
                                <AlertTriangle size={20} />
                                <div><span>Retards</span></div>
                            </NavLink>
                            <NavLink to="/profile" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
                                <User size={20} />
                                <div>
                                    <span>Mon Profil</span>
                                    <small>{user?.first_name} {user?.last_name}</small>
                                </div>
                            </NavLink>
                            <NavLink to="/kyc" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
                                <FileCheck size={20} />
                                <div><span>Verification KYC</span></div>
                            </NavLink>
                            <button className="mobile-menu-item mobile-logout" onClick={handleSignOut}>
                                <LogOut size={20} />
                                <div><span>Deconnexion</span></div>
                            </button>
                        </div>
                    )}
                </nav>

                {/* Bottom Tab Bar mobile */}
                <div className="mobile-bottom-nav">
                    <NavLink to="/dashboard" className={({ isActive }) => `bottom-tab${isActive ? ' active' : ''}`}>
                        <BarChart3 size={22} />
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/projects" className={({ isActive }) => `bottom-tab${isActive ? ' active' : ''}`}>
                        <Briefcase size={22} />
                        <span>Projets</span>
                    </NavLink>
                    <NavLink to="/properties" className={({ isActive }) => `bottom-tab${isActive ? ' active' : ''}`}>
                        <Building size={22} />
                        <span>Biens</span>
                    </NavLink>
                    <NavLink to="/wallet" className={({ isActive }) => `bottom-tab${isActive ? ' active' : ''}`}>
                        <Wallet size={22} />
                        <span>Wallet</span>
                    </NavLink>
                    <button className="bottom-tab" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                        <Menu size={22} />
                        <span>Plus</span>
                    </button>
                </div>

                <main className="investor-content">
                    <Outlet />
                </main>

                <FloatingChat />
            </>
        );
    }

    // KYC not verified: header-only layout (original)
    return (
        <div className="porteur-layout">
            <header className="porteur-header">
                <div className="porteur-header-inner">
                    <div className="porteur-header-logo" onClick={() => navigate('/dashboard')}>
                        <div className="porteur-logo-wrap">
                            <img src={xfundLogo} alt="X-Fund" className="brand-logo-img" />
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
