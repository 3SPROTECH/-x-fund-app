import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { propertiesApi } from '../../api/properties';
import { investmentProjectsApi } from '../../api/investments';
import { useAuth } from '../../context/AuthContext';
import { projectImagesApi } from '../../api/images';
import { ArrowLeft, ArrowRight, Check, Building, TrendingUp, Calendar, Euro, ImagePlus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, title: 'Sélection du bien', icon: Building },
  { id: 2, title: 'Configuration financière', icon: Euro },
  { id: 3, title: 'Photos du projet', icon: ImagePlus },
  { id: 4, title: 'Planning & Validation', icon: Calendar },
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
    property_ids: searchParams.get('propertyId') ? [searchParams.get('propertyId')] : [],
    title: '',
    description: '',

    // Step 2
    total_amount_cents: '',
    share_price_cents: '',
    total_shares: '',
    min_investment_cents: '',
    max_investment_cents: '',
    management_fee_percent: '2.5',
    gross_yield_percent: '',
    net_yield_percent: '',

    // Step 3
    funding_start_date: '',
    funding_end_date: '',
  });

  const [photos, setPhotos] = useState([]);
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

  const getSelectedProperties = () => {
    const ids = formData.property_ids || [];
    return properties.filter(p => ids.includes(String(p.id)));
  };

  const togglePropertyId = (id) => {
    const sid = String(id);
    setFormData(prev => {
      const ids = prev.property_ids || [];
      if (ids.includes(sid)) return { ...prev, property_ids: ids.filter(i => i !== sid) };
      return { ...prev, property_ids: [...ids, sid] };
    });
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.property_ids?.length) newErrors.property_ids = 'Veuillez sélectionner au moins un bien';
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
    else if (currentStep === 3) isValid = true; // Photos are optional
    else if (currentStep === 4) isValid = validateStep3();

    if (isValid && currentStep < 4) {
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

      const res = await investmentProjectsApi.create({ ...data, property_ids: formData.property_ids });
      const projectId = res.data.data?.id || res.data.id;

      // Upload photos if any were selected
      if (photos.length > 0 && projectId) {
        try {
          await projectImagesApi.uploadImages(projectId, photos);
        } catch {
          toast.error("Projet créé mais erreur lors de l'upload des photos");
        }
      }

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

      // Calcul automatique du rendement net: Net Yield = Gross Yield - Management Fees (fixé à 2.5%)
      if (field === 'gross_yield_percent') {
        const grossYield = parseFloat(value);
        const managementFee = 2.5;

        if (!isNaN(grossYield)) {
          updated.net_yield_percent = (grossYield - managementFee).toFixed(2);
        }
      }

      return updated;
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAddPhotos = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setPhotos(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const handleRemovePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
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

  const selectedProperties = getSelectedProperties();

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
          <p className="text-muted">Configurez votre projet en 4 étapes simples</p>
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
                  <div className="wizard-step-subtitle">Étape {step.id}/4</div>
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
              Sélection du bien immobilier
            </h3>

            <div className="form-group">
              <label>Biens immobiliers *</label>
              <select
                value=""
                onChange={(e) => { if (e.target.value) togglePropertyId(e.target.value); }}
                className={errors.property_ids ? 'error' : ''}
                style={{ marginTop: '0.5rem' }}
              >
                <option value="">-- Sélectionner un bien à ajouter --</option>
                {properties
                  .filter(p => !(formData.property_ids || []).includes(String(p.id)))
                  .map(prop => {
                    const a = prop.attributes || prop;
                    return (
                      <option key={prop.id} value={prop.id}>
                        {a.title} — {a.city} ({a.property_type})
                      </option>
                    );
                  })}
              </select>
              {errors.property_ids && <span className="error-message">{errors.property_ids}</span>}
            </div>

            {getSelectedProperties().length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h4>Biens sélectionnés ({getSelectedProperties().length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {getSelectedProperties().map(prop => {
                    const a = prop.attributes || prop;
                    return (
                      <div key={prop.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
                        <div>
                          <strong>{a.title}</strong>
                          <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{a.city} — {a.property_type} — {a.surface_area_sqm} m²</span>
                        </div>
                        <button type="button" className="btn-icon" onClick={() => togglePropertyId(prop.id)} aria-label="Retirer" style={{ color: 'var(--danger)' }}>
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
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
                  <label>Rendement net (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.net_yield_percent}
                    readOnly
                    placeholder="Calculé: Brut - Frais"
                    style={{ backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed' }}
                  />
                  
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Photos du projet */}
        {currentStep === 3 && (
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>
              <ImagePlus size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Photos du projet
            </h3>

            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Ajoutez des photos pour illustrer votre projet (optionnel).
            </p>

            <label
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.25rem', border: '2px dashed #d1d5db',
                borderRadius: '8px', cursor: 'pointer', color: '#374151',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
            >
              <ImagePlus size={20} />
              Ajouter des photos
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleAddPhotos}
                style={{ display: 'none' }}
              />
            </label>

            {photos.length > 0 && (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '1rem', marginTop: '1.5rem',
              }}>
                {photos.map((photo, index) => (
                  <div key={index} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={photo.name}
                      style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block', borderRadius: '8px' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      style={{
                        position: 'absolute', top: '4px', right: '4px',
                        background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
                        borderRadius: '50%', width: '24px', height: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={14} />
                    </button>
                    <div style={{
                      fontSize: '0.7rem', color: '#6b7280', padding: '4px',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {photo.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {photos.length === 0 && (
              <div style={{
                marginTop: '1.5rem', padding: '2rem', textAlign: 'center',
                color: '#9ca3af', background: '#f9fafb', borderRadius: '8px',
              }}>
                Aucune photo ajoutée. Vous pourrez en ajouter plus tard.
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Planning & Validation */}
        {currentStep === 4 && (
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
                <div className="detail-row"><span>Biens</span><span>{selectedProperties.length} bien{selectedProperties.length > 1 ? 's' : ''} sélectionné{selectedProperties.length > 1 ? 's' : ''}</span></div>
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
                <div className="detail-row"><span>Photos</span><span>{photos.length} photo{photos.length > 1 ? 's' : ''}</span></div>
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
        {currentStep < 4 ? (
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
