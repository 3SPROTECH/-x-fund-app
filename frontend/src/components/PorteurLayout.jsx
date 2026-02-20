import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, ChevronDown } from 'lucide-react';

export default function PorteurLayout() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
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
        </div>
    );
}
