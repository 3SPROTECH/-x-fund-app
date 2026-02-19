import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, ChevronDown } from 'lucide-react';

export default function PorteurNavbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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
    <nav className="advanced-navbar">
      <div className="navbar-container porteur-navbar-container">
        {/* Logo */}
        <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
          <div className="brand-text">
            <span className="brand-title">X<span style={{ color: '#DAA520' }}>-</span>Fund</span>
            <span className="brand-subtitle">Espace porteur de projet</span>
          </div>
        </div>

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
            <div className="profile-details">
              <span className="profile-name">{user?.first_name} {user?.last_name}</span>
              <span className="profile-role">Porteur de projet</span>
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
                  <span className="role-badge">Porteur de projet</span>
                </div>
              </div>

              <div className="profile-menu-section">
                <span className="section-label">Mon Compte</span>
                <button
                  className="menu-item"
                  onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <div className="menu-item-icon">
                    <User size={18} />
                  </div>
                  <div className="menu-item-content">
                    <span>Mon Profil</span>
                    <small>Gérer mes informations</small>
                  </div>
                </button>
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
    </nav>
  );
}