import { useState, useEffect } from 'react';
import { profileApi } from '../../api/profile';
import { useAuth } from '../../context/AuthContext';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { KYC_STATUS_LABELS } from '../../utils';
import { LoadingSpinner } from '../../components/ui';

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', date_of_birth: '',
    address_line1: '', address_line2: '', city: '', postal_code: '', country: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const res = await profileApi.getProfile();
      const attrs = res.data.data?.attributes || res.data;
      setForm({
        first_name: attrs.first_name || '', last_name: attrs.last_name || '',
        phone: attrs.phone || '', date_of_birth: attrs.date_of_birth || '',
        address_line1: attrs.address_line1 || '', address_line2: attrs.address_line2 || '',
        city: attrs.city || '', postal_code: attrs.postal_code || '', country: attrs.country || '',
      });
    } catch {
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profileApi.updateProfile(form);
      await refreshProfile();
      toast.success('Profil mis à jour avec succès');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Mon Profil</h1>
          <p className="text-muted">Gérez vos informations personnelles</p>
        </div>
      </div>

      <div className="two-col">
        <div className="two-col-main">
          <div className="card">
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <div className="form-section-title">Informations personnelles</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Prénom</label>
                    <input value={form.first_name} onChange={set('first_name')} required />
                  </div>
                  <div className="form-group">
                    <label>Nom</label>
                    <input value={form.last_name} onChange={set('last_name')} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Téléphone</label>
                    <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+33 6 12 34 56 78" />
                  </div>
                  <div className="form-group">
                    <label>Date de naissance</label>
                    <input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">Adresse</div>
                <div className="form-group" style={{ marginBottom: '.75rem' }}>
                  <label>Adresse ligne 1</label>
                  <input value={form.address_line1} onChange={set('address_line1')} placeholder="Numéro et rue" />
                </div>
                <div className="form-group" style={{ marginBottom: '.75rem' }}>
                  <label>Adresse ligne 2</label>
                  <input value={form.address_line2} onChange={set('address_line2')} placeholder="Complément (optionnel)" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Ville</label>
                    <input value={form.city} onChange={set('city')} />
                  </div>
                  <div className="form-group">
                    <label>Code postal</label>
                    <input value={form.postal_code} onChange={set('postal_code')} />
                  </div>
                  <div className="form-group">
                    <label>Pays</label>
                    <input value={form.country} onChange={set('country')} placeholder="France" />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} />
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </form>
          </div>
        </div>

        <div className="two-col-side">
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div className="avatar avatar-lg" style={{ margin: '0 auto .75rem' }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <h3 style={{ marginBottom: '.15rem' }}>{user?.first_name} {user?.last_name}</h3>
              <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
            <div className="divider" />
            <div className="detail-grid">
              <div className="detail-row"><span>Email</span><span>{user?.email}</span></div>
              {user?.role !== 'administrateur' && (
                <div className="detail-row">
                  <span>KYC</span>
                  <span className={`badge kyc-${user?.kyc_status || 'pending'}`}>
                    {KYC_STATUS_LABELS[user?.kyc_status] || 'En attente'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
