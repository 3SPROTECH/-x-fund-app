import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';
import xfundLogo from '../../assets/XFUND LOGO.png';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authApi.requestPasswordReset(email);
      setSent(true);
      toast.success('Instructions envoyées par email');
    } catch {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo-header"><img src={xfundLogo} alt="X-Fund" className="auth-logo-img" /></div>
        <p className="auth-subtitle">Réinitialiser votre mot de passe</p>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <Mail size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
            <p style={{ marginBottom: '1rem' }}>Si un compte existe avec cette adresse, vous recevrez un email avec les instructions de réinitialisation.</p>
            <Link to="/login" className="btn btn-primary btn-block">Retour à la connexion</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? 'Envoi...' : 'Envoyer les instructions'}
            </button>
          </form>
        )}
        <p className="auth-footer">
          <Link to="/login">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
