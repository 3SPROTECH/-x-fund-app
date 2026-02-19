import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { investmentProjectsApi } from '../../api/investments';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../../components/ui';

export default function EditProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    total_amount_cents: '',
    share_price_cents: '',
    total_shares: '',
    min_investment_cents: '',
    max_investment_cents: '',
    funding_start_date: '',
    funding_end_date: '',
    management_fee_percent: '2.5',
    gross_yield_percent: '',
    net_yield_percent: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const res = await investmentProjectsApi.get(id);
      const project = res.data.data?.attributes || res.data.data;

      setFormData({
        title: project.title || '',
        description: project.description || '',
        total_amount_cents: project.total_amount_cents ? (project.total_amount_cents / 100).toString() : '',
        share_price_cents: project.share_price_cents ? (project.share_price_cents / 100).toString() : '',
        total_shares: project.total_shares ? project.total_shares.toString() : '',
        min_investment_cents: project.min_investment_cents ? (project.min_investment_cents / 100).toString() : '',
        max_investment_cents: project.max_investment_cents ? (project.max_investment_cents / 100).toString() : '',
        funding_start_date: project.funding_start_date || '',
        funding_end_date: project.funding_end_date || '',
        management_fee_percent: '2.5',
        gross_yield_percent: project.gross_yield_percent || '',
        net_yield_percent: project.net_yield_percent || '',
      });
    } catch (err) {
      toast.error('Erreur lors du chargement du projet');
      navigate(user?.role === 'administrateur' ? '/admin/projects' : '/projects');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Le titre est requis';
    }

    const sharePrice = parseFloat(formData.share_price_cents);
    if (!sharePrice || sharePrice <= 0) {
      newErrors.share_price_cents = 'Le prix par part doit être supérieur à 0';
    }

    const minInvest = parseFloat(formData.min_investment_cents);
    if (!minInvest || minInvest <= 0) {
      newErrors.min_investment_cents = "L'investissement minimum est requis";
    }

    if (!formData.funding_start_date) {
      newErrors.funding_start_date = 'La date de début est requise';
    }

    if (!formData.funding_end_date) {
      newErrors.funding_end_date = 'La date de fin est requise';
    }

    if (formData.funding_start_date && formData.funding_end_date) {
      if (new Date(formData.funding_end_date) <= new Date(formData.funding_start_date)) {
        newErrors.funding_end_date = 'La date de fin doit être postérieure à la date de début';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    try {
      const data = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        total_amount_cents: formData.total_amount_cents ? Math.round(parseFloat(formData.total_amount_cents) * 100) : 0,
        share_price_cents: Math.round(parseFloat(formData.share_price_cents) * 100),
        total_shares: formData.total_shares ? parseInt(formData.total_shares) : undefined,
        min_investment_cents: Math.round(parseFloat(formData.min_investment_cents) * 100),
        max_investment_cents: formData.max_investment_cents ? Math.round(parseFloat(formData.max_investment_cents) * 100) : undefined,
        funding_start_date: formData.funding_start_date,
        funding_end_date: formData.funding_end_date,
        management_fee_percent: formData.management_fee_percent || undefined,
        gross_yield_percent: formData.gross_yield_percent || undefined,
        net_yield_percent: formData.net_yield_percent || undefined,
      };

      await investmentProjectsApi.update(id, data);
      toast.success('Projet mis à jour avec succès !');
      navigate(`/projects/${id}`);
    } catch (err) {
      const res = err.response;
      const msg = res?.data?.errors?.join(', ') || res?.data?.error || 'Erreur lors de la mise à jour';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'gross_yield_percent') {
        const grossYield = parseFloat(value);
        const managementFee = parseFloat(updated.management_fee_percent) || 2.5;
        if (!isNaN(grossYield) && grossYield > 0) {
          updated.net_yield_percent = (grossYield - managementFee).toFixed(2);
        } else {
          updated.net_yield_percent = '';
        }
      }
      return updated;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div style={{ marginBottom: '2rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate(`/projects/${id}`)}>
          <ArrowLeft size={16} /> Retour au projet
        </button>
      </div>

      <div className="page-header">
        <div>
          <h1>Modifier le projet</h1>
          <p className="text-muted">Modifiez les informations de votre projet d'investissement</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Informations générales</h3>

          <div className="form-group">
            <label>Titre du projet *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Ex: Investissement Appartement Lyon Centre"
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Décrivez les opportunités et avantages de ce projet..."
              rows={4}
            />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Configuration financière</h3>

          <div className="form-section">
            <div className="form-section-title">Montant et parts</div>
            <div className="form-row">
              <div className="form-group">
                <label>Montant total à lever (EUR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.total_amount_cents}
                  onChange={(e) => updateField('total_amount_cents', e.target.value)}
                  placeholder="500000"
                  className={errors.total_amount_cents ? 'error' : ''}
                />
                {errors.total_amount_cents && <span className="error-message">{errors.total_amount_cents}</span>}
              </div>
              <div className="form-group">
                <label>Prix par part (EUR) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.share_price_cents}
                  onChange={(e) => updateField('share_price_cents', e.target.value)}
                  placeholder="100"
                  required
                  className={errors.share_price_cents ? 'error' : ''}
                />
                {errors.share_price_cents && <span className="error-message">{errors.share_price_cents}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Nombre total de parts</label>
                <input
                  type="number"
                  min="1"
                  value={formData.total_shares}
                  onChange={(e) => updateField('total_shares', e.target.value)}
                  placeholder="Nombre de parts"
                />
              </div>
            </div>
          </div>

          <div className="divider" />

          <div className="form-section">
            <div className="form-section-title">Limites d'investissement</div>
            <div className="form-row">
              <div className="form-group">
                <label>Investissement minimum (EUR) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.min_investment_cents}
                  onChange={(e) => updateField('min_investment_cents', e.target.value)}
                  placeholder="100"
                  required
                  className={errors.min_investment_cents ? 'error' : ''}
                />
                {errors.min_investment_cents && <span className="error-message">{errors.min_investment_cents}</span>}
              </div>
              <div className="form-group">
                <label>Investissement maximum (EUR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.max_investment_cents}
                  onChange={(e) => updateField('max_investment_cents', e.target.value)}
                  placeholder="Optionnel"
                />
              </div>
            </div>
          </div>

          <div className="divider" />

          <div className="form-section">
            <div className="form-section-title">Rendements</div>
            <div className="form-row">
              <div className="form-group">
                <label>Frais de gestion (%)</label>
                <input
                  type="number"
                  value={2.5}
                  disabled
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>
              <div className="form-group">
                <label>Rendement brut (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.gross_yield_percent}
                  onChange={(e) => updateField('gross_yield_percent', e.target.value)}
                  placeholder="5.0"
                />
              </div>
              <div className="form-group">
                <label>Rendement net (%) — auto</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.net_yield_percent}
                  readOnly
                  style={{ background: 'var(--bg)', cursor: 'default', fontWeight: 600 }}
                  placeholder="Calculé automatiquement"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Planning de levée de fonds</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Date de début de levée *</label>
              <input
                type="date"
                value={formData.funding_start_date}
                onChange={(e) => updateField('funding_start_date', e.target.value)}
                required
                className={errors.funding_start_date ? 'error' : ''}
              />
              {errors.funding_start_date && <span className="error-message">{errors.funding_start_date}</span>}
            </div>
            <div className="form-group">
              <label>Date de fin de levée *</label>
              <input
                type="date"
                value={formData.funding_end_date}
                onChange={(e) => updateField('funding_end_date', e.target.value)}
                required
                className={errors.funding_end_date ? 'error' : ''}
              />
              {errors.funding_end_date && <span className="error-message">{errors.funding_end_date}</span>}
            </div>
          </div>
        </div>

        <div className="wizard-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate(`/projects/${id}`)}
            disabled={submitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Enregistrement...' : (
              <>
                <Save size={16} /> Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
