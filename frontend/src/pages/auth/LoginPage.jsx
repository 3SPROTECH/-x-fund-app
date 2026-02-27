import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { LogIn } from 'lucide-react';
import xfundLogo from '../../assets/XFUND LOGO.png';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(form);
      toast.success('Connexion réussie');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Identifiants invalides');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo-header">
          <img src={xfundLogo} alt="X-Fund" className="auth-logo-img" />
        </div>
        <p className="auth-subtitle">Connectez-vous à votre espace investisseur</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="votre@email.com" />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </div>
          <div style={{ textAlign: 'right' }}>
            <Link to="/forgot-password" style={{ fontSize: '.85rem' }}>Mot de passe oublié ?</Link>
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
            {submitting ? 'Connexion...' : <><LogIn size={18} /> Se connecter</>}
          </button>
        </form>
        <p className="auth-footer">
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
