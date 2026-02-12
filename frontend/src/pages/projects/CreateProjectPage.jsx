import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { propertiesApi } from '../../api/properties';
import { investmentProjectsApi } from '../../api/investments';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, ArrowRight, Check, Building, TrendingUp, Calendar, Euro } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, title: 'Sélection du bien', icon: Building },
  { id: 2, title: 'Configuration financière', icon: Euro },
  { id: 3, title: 'Planning & Validation', icon: Calendar },
];

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1
    property_id: searchParams.get('propertyId') || '',
    title: '',
    description: '',

    // Step 2
    total_amount_cents: '',
    share_price_cents: '',
    total_shares: '',
    min_investment_cents: '',
    max_investment_cents: '',
    management_fee_percent: '',
    gross_yield_percent: '',
    net_yield_percent: '',

    // Step 3
    funding_start_date: '',
    funding_end_date: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const res = await propertiesApi.list();
      setProperties(res.data.data || []);
    } catch (err) {
      toast.error('Erreur lors du chargement des biens');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedProperty = () => {
    return properties.find(p => String(p.id) === String(formData.property_id));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.property_id) newErrors.property_id = 'Veuillez sélectionner un bien';
    if (!formData.title?.trim()) newErrors.title = 'Le titre est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    const sharePrice = parseFloat(formData.share_price_cents);
    const totalAmount = parseFloat(formData.total_amount_cents);
    const totalShares = parseInt(formData.total_shares);
    const minInvest = parseFloat(formData.min_investment_cents);

    if (!sharePrice || sharePrice <= 0) {
      newErrors.share_price_cents = 'Le prix par part doit être supérieur à 0';
    }
    if (!totalAmount && !totalShares) {
      newErrors.total_amount_cents = 'Renseignez le montant total ou le nombre de parts';
    }
    if (!minInvest || minInvest <= 0) {
      newErrors.min_investment_cents = "L'investissement minimum est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
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

  const handleNext = () => {
    let isValid = false;
    if (currentStep === 1) isValid = validateStep1();
    else if (currentStep === 2) isValid = validateStep2();
    else if (currentStep === 3) isValid = validateStep3();

    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setSubmitting(true);
    try {
      const data = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        total_amount_cents: Math.round(parseFloat(formData.total_amount_cents) * 100) || 0,
        share_price_cents: Math.round(parseFloat(formData.share_price_cents) * 100),
        total_shares: formData.total_shares ? parseInt(formData.total_shares) : undefined,
        min_investment_cents: Math.round(parseFloat(formData.min_investment_cents) * 100),
        max_investment_cents: formData.max_investment_cents ? Math.round(parseFloat(formData.max_investment_cents) * 100) : undefined,
        management_fee_percent: formData.management_fee_percent ? parseFloat(formData.management_fee_percent) : undefined,
        gross_yield_percent: formData.gross_yield_percent ? parseFloat(formData.gross_yield_percent) : undefined,
        net_yield_percent: formData.net_yield_percent ? parseFloat(formData.net_yield_percent) : undefined,
        funding_start_date: formData.funding_start_date,
        funding_end_date: formData.funding_end_date,
      };

      await investmentProjectsApi.create(formData.property_id, data);
      toast.success("Projet d'investissement créé avec succès !");
      navigate('/properties');
    } catch (err) {
      const res = err.response;
      const msg = res?.data?.errors?.join(', ') || res?.data?.error || 'Erreur lors de la création';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Calcul automatique du rendement net: Net Yield = Gross Yield - Management Fees
      if (field === 'gross_yield_percent' || field === 'management_fee_percent') {
        const grossYield = parseFloat(field === 'gross_yield_percent' ? value : prev.gross_yield_percent);
        const managementFee = parseFloat(field === 'management_fee_percent' ? value : prev.management_fee_percent);

        if (!isNaN(grossYield) && !isNaN(managementFee)) {
          updated.net_yield_percent = (grossYield - managementFee).toFixed(2);
        } else if (!isNaN(grossYield) && (isNaN(managementFee) || managementFee === 0)) {
          updated.net_yield_percent = grossYield.toFixed(2);
        }
      }

      return updated;
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const calculatedShares = () => {
    const total = parseFloat(formData.total_amount_cents);
    const price = parseFloat(formData.share_price_cents);
    if (total > 0 && price > 0 && !formData.total_shares) {
      return Math.floor((total * 100) / (price * 100));
    }
    return null;
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  const selectedProperty = getSelectedProperty();
  const selectedPropertyData = selectedProperty?.attributes || selectedProperty;

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/properties')}>
          <ArrowLeft size={16} /> Retour aux biens
        </button>
      </div>

      <div className="page-header">
        <div>
          <h1>Créer un projet d'investissement</h1>
          <p className="text-muted">Configurez votre projet en 3 étapes simples</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="wizard-steps">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="wizard-step-container">
              <div className={`wizard-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                <div className="wizard-step-number">
                  {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                </div>
                <div className="wizard-step-content">
                  <div className="wizard-step-title">{step.title}</div>
                  <div className="wizard-step-subtitle">Étape {step.id}/3</div>
                </div>
              </div>
              {index < STEPS.length - 1 && <div className={`wizard-step-line ${isCompleted ? 'completed' : ''}`} />}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="wizard-content">
        {/* STEP 1: Sélection du bien */}
        {currentStep === 1 && (
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>
              <Building size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Sélection du bien immobilier
            </h3>

            <div className="form-group">
              <label>Bien immobilier *</label>
              <select
                value={formData.property_id}
                onChange={(e) => updateField('property_id', e.target.value)}
                className={errors.property_id ? 'error' : ''}
              >
                <option value="">-- Sélectionnez un bien --</option>
                {properties.map(prop => {
                  const a = prop.attributes || prop;
                  return (
                    <option key={prop.id} value={prop.id}>
                      {a.title} - {a.city}
                    </option>
                  );
                })}
              </select>
              {errors.property_id && <span className="error-message">{errors.property_id}</span>}
            </div>

            {selectedProperty && (
              <div className="property-preview">
                <h4>Aperçu du bien sélectionné</h4>
                <div className="detail-grid">
                  <div className="detail-row">
                    <span>Titre</span>
                    <span>{selectedPropertyData.title}</span>
                  </div>
                  <div className="detail-row">
                    <span>Type</span>
                    <span>{selectedPropertyData.property_type}</span>
                  </div>
                  <div className="detail-row">
                    <span>Ville</span>
                    <span>{selectedPropertyData.city}</span>
                  </div>
                  <div className="detail-row">
                    <span>Surface</span>
                    <span>{selectedPropertyData.surface_area_sqm} m²</span>
                  </div>
                </div>
              </div>
            )}

            <div className="divider" />

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
        )}

        {/* STEP 2: Configuration financière */}
        {currentStep === 2 && (
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>
              <Euro size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Configuration financière
            </h3>

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
                  <label>Nombre total de parts (optionnel)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total_shares}
                    onChange={(e) => updateField('total_shares', e.target.value)}
                    placeholder="Calculé automatiquement"
                  />
                </div>
                {calculatedShares() !== null && (
                  <div className="form-group">
                    <label>Parts calculées</label>
                    <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--primary)', fontWeight: '600' }}>
                      {calculatedShares()} parts
                    </div>
                  </div>
                )}
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
                    step="0.01"
                    min="0"
                    value={formData.management_fee_percent}
                    onChange={(e) => updateField('management_fee_percent', e.target.value)}
                    placeholder="2.5"
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
                  <label>Rendement net (%) - Calculé automatiquement</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.net_yield_percent}
                    readOnly
                    placeholder="Calculé: Brut - Frais"
                    style={{ backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed' }}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Formule: Rendement net = Rendement brut - Frais de gestion
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Planning & Validation */}
        {currentStep === 3 && (
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>
              <Calendar size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Planning de levée de fonds
            </h3>

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

            <div className="divider" />

            <div className="summary-section">
              <h4>Récapitulatif du projet</h4>
              <div className="detail-grid">
                <div className="detail-row"><span>Bien</span><span>{selectedPropertyData?.title}</span></div>
                <div className="detail-row"><span>Titre</span><span>{formData.title}</span></div>
                <div className="detail-row"><span>Montant total</span><span>{parseFloat(formData.total_amount_cents || 0).toLocaleString('fr-FR')} €</span></div>
                <div className="detail-row"><span>Prix par part</span><span>{parseFloat(formData.share_price_cents || 0).toLocaleString('fr-FR')} €</span></div>
                <div className="detail-row"><span>Nombre de parts</span><span>{formData.total_shares || calculatedShares() || '—'}</span></div>
                <div className="detail-row"><span>Investissement min</span><span>{parseFloat(formData.min_investment_cents || 0).toLocaleString('fr-FR')} €</span></div>
                {formData.gross_yield_percent && (
                  <>
                    <div className="detail-row"><span>Rendement brut</span><span>{formData.gross_yield_percent}%</span></div>
                    <div className="detail-row"><span>Frais de gestion</span><span>{formData.management_fee_percent || 0}%</span></div>
                    <div className="detail-row"><span>Rendement net</span><span style={{ color: 'var(--success)', fontWeight: '600' }}>{formData.net_yield_percent}%</span></div>
                  </>
                )}
                <div className="detail-row"><span>Période</span><span>{formData.funding_start_date} → {formData.funding_end_date}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="wizard-actions">
        {currentStep > 1 && (
          <button type="button" className="btn btn-ghost" onClick={handleBack} disabled={submitting}>
            <ArrowLeft size={16} /> Précédent
          </button>
        )}
        <div style={{ flex: 1 }} />
        {currentStep < 3 ? (
          <button type="button" className="btn btn-primary" onClick={handleNext}>
            Suivant <ArrowRight size={16} />
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Création en cours...' : (
              <>
                <Check size={16} /> Créer le projet
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
