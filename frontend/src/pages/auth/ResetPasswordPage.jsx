import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import toast from 'react-hot-toast';
import xfundLogo from '../../assets/XFUND LOGO.png';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('reset_password_token') || '';
  const [form, setForm] = useState({ password: '', password_confirmation: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword({
        resetPasswordToken: token,
        password: form.password,
        passwordConfirmation: form.password_confirmation,
      });
      toast.success('Mot de passe modifié avec succès');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la réinitialisation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo-header"><img src={xfundLogo} alt="X-Fund" className="auth-logo-img" /></div>
        <p className="auth-subtitle">Choisissez un nouveau mot de passe</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Nouveau mot de passe</label>
            <input type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 caractères" />
          </div>
          <div className="form-group">
            <label>Confirmer le mot de passe</label>
            <input type="password" required value={form.password_confirmation} onChange={e => setForm({ ...form, password_confirmation: e.target.value })} placeholder="Confirmer" />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
            {submitting ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </form>
        <p className="auth-footer">
          <Link to="/login">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
