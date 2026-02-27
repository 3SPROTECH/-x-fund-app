import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
import FormSelect from '../../components/FormSelect';
import xfundLogo from '../../assets/XFUND LOGO.png';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '', password: '', password_confirmation: '',
    first_name: '', last_name: '', phone: '', role: 'investisseur',
  });
  const [submitting, setSubmitting] = useState(false);
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setSubmitting(true);
    try {
      await signUp(form);
      toast.success('Compte créé avec succès');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (Array.isArray(errors)) {
        errors.forEach(msg => toast.error(msg));
      } else {
        toast.error(err.response?.data?.error || 'Erreur lors de la création');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-logo-header"><img src={xfundLogo} alt="X-Fund" className="auth-logo-img" /></div>
        <p className="auth-subtitle">Créer votre compte investisseur</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Prénom</label>
              <input required value={form.first_name} onChange={set('first_name')} placeholder="Jean" />
            </div>
            <div className="form-group">
              <label>Nom</label>
              <input required value={form.last_name} onChange={set('last_name')} placeholder="Dupont" />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" required value={form.email} onChange={set('email')} placeholder="votre@email.com" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Téléphone</label>
              <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+33 6 12 34 56 78" />
            </div>
            <div className="form-group">
              <label>Type de compte</label>
              <FormSelect
                value={form.role}
                onChange={set('role')}
                name="role"
                options={[
                  { value: 'investisseur', label: 'Investisseur' },
                  { value: 'porteur_de_projet', label: 'Porteur de projet' },
                  { value: 'administrateur', label: 'Administrateur' },
                ]}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Mot de passe</label>
              <input type="password" required minLength={6} value={form.password} onChange={set('password')} placeholder="Min. 6 caractères" />
            </div>
            <div className="form-group">
              <label>Confirmer</label>
              <input type="password" required value={form.password_confirmation} onChange={set('password_confirmation')} placeholder="Confirmer" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
            {submitting ? 'Création...' : <><UserPlus size={18} /> Créer le compte</>}
          </button>
        </form>
        <p className="auth-footer">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
