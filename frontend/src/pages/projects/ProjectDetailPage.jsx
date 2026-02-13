import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { investmentProjectsApi, investmentsApi, projectInvestorsApi } from '../../api/investments';
import { dividendsApi } from '../../api/dividends';
import { financialStatementsApi } from '../../api/financialStatements';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, TrendingUp, FileText, DollarSign, AlertCircle, CheckCircle, Image as ImageIcon, Calendar, Upload, X, Trash2, Edit, Users, Eye, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { walletApi } from '../../api/wallet';
import { projectImagesApi } from '../../api/images';
import { getImageUrl } from '../../api/client';

const STATUS_LABELS = { brouillon: 'Brouillon', ouvert: 'Ouvert', finance: 'Financé', cloture: 'Clôturé', annule: 'Annulé' };
const STATUS_BADGE = { ouvert: 'badge-success', finance: 'badge-info', cloture: '', annule: 'badge-danger', brouillon: 'badge-warning' };
const DIV_STATUS = { planifie: 'Planifié', distribue: 'Distribué', annule: 'Annulé' };
const STMT_TYPE = { trimestriel: 'Trimestriel', semestriel: 'Semestriel', annuel: 'Annuel' };

const fmt = (c) => c == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(c / 100);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [dividends, setDividends] = useState([]);
  const [statements, setStatements] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [investorsMeta, setInvestorsMeta] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('details');
  const [investAmount, setInvestAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Admin: create dividend
  const [divForm, setDivForm] = useState({ total_amount_cents: '', period_start: '', period_end: '' });
  // Create statement (Admin + Project Owner)
  const [stmtForm, setStmtForm] = useState({
    statement_type: 'trimestriel',
    period_start: '',
    period_end: '',
    total_revenue_cents: '',
    total_expenses_cents: ''
  });

  useEffect(() => { loadAll(); }, [id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [projRes, divRes, stmtRes, walletRes, investorsRes] = await Promise.allSettled([
        investmentProjectsApi.get(id),
        dividendsApi.list(id),
        financialStatementsApi.list(id),
        walletApi.getWallet(),
        projectInvestorsApi.list(id),
      ]);
      if (projRes.status === 'fulfilled') setProject(projRes.value.data.data || projRes.value.data);
      if (divRes.status === 'fulfilled') setDividends(divRes.value.data.data || []);
      if (stmtRes.status === 'fulfilled') setStatements(stmtRes.value.data.data || []);
      if (walletRes.status === 'fulfilled') setWallet(walletRes.value.data.data?.attributes || walletRes.value.data);
      if (investorsRes.status === 'fulfilled') {
        setInvestors(investorsRes.value.data.data || []);
        setInvestorsMeta(investorsRes.value.data.meta || null);
      }
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = async (e) => {
    e.preventDefault();
    const cents = Math.round(parseFloat(investAmount) * 100);
    if (!cents || cents <= 0) { toast.error('Montant invalide'); return; }
    setSubmitting(true);
    try {
      await investmentsApi.create(id, cents);
      toast.success('Investissement effectué !');
      setInvestAmount('');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDividend = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await dividendsApi.create(id, {
        total_amount_cents: Math.round(parseFloat(divForm.total_amount_cents) * 100),
        period_start: divForm.period_start,
        period_end: divForm.period_end,
      });
      toast.success('Dividende créé avec succès');
      setDivForm({ total_amount_cents: '', period_start: '', period_end: '' });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStatement = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await financialStatementsApi.create(id, {
        statement_type: stmtForm.statement_type,
        period_start: stmtForm.period_start,
        period_end: stmtForm.period_end,
        total_revenue_cents: Math.round(parseFloat(stmtForm.total_revenue_cents) * 100),
        total_expenses_cents: Math.round(parseFloat(stmtForm.total_expenses_cents) * 100)
      });
      toast.success('Rapport financier créé');
      setStmtForm({
        statement_type: 'trimestriel',
        period_start: '',
        period_end: '',
        total_revenue_cents: '',
        total_expenses_cents: ''
      });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadImages = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      await projectImagesApi.uploadImages(id, files);
      toast.success(`${files.length} image(s) ajoutée(s) avec succès`);
      loadAll();
      e.target.value = ''; // Reset input
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'upload');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm('Voulez-vous vraiment supprimer cette image ?')) return;

    try {
      await projectImagesApi.deleteImage(id, imageId);
      toast.success('Image supprimée');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleDeleteDividend = async (dividendId) => {
    if (!confirm('Voulez-vous vraiment supprimer ce dividende ?')) return;

    try {
      await dividendsApi.delete(id, dividendId);
      toast.success('Dividende supprimé');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleDistributeDividend = async (dividendId) => {
    if (!confirm('Voulez-vous vraiment distribuer ce dividende ? Cette action est irréversible et créditera immédiatement les portefeuilles des investisseurs.')) return;

    try {
      await dividendsApi.distribute(id, dividendId);
      toast.success('Dividende distribué avec succès !');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.errors?.join(', ') || err.response?.data?.error || 'Erreur lors de la distribution');
    }
  };

  const handleDeleteStatement = async (statementId) => {
    if (!confirm('Voulez-vous vraiment supprimer ce rapport financier ?')) return;

    try {
      await financialStatementsApi.delete(id, statementId);
      toast.success('Rapport financier supprimé');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Voulez-vous vraiment supprimer ce projet ? Cette action est irréversible.')) return;

    try {
      await investmentProjectsApi.delete(id);
      toast.success('Projet supprimé avec succès');
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!project) return <div className="page"><div className="card"><p>Projet introuvable</p></div></div>;

  const a = project.attributes || project;
  const isAdmin = user?.role === 'administrateur';
  const isOwner = user?.id === a.owner_id;
  const canEdit = isAdmin || (user?.role === 'porteur_de_projet' && isOwner && a.status === 'brouillon');
  const canDelete = isAdmin || (user?.role === 'porteur_de_projet' && isOwner && a.status === 'brouillon');
  const canInvest = (user?.role === 'investisseur' || isAdmin) && a.status === 'ouvert';
  const canCreateStatement = isAdmin || (user?.role === 'porteur_de_projet' && isOwner && a.status === 'finance');
  const canViewInvestors = isAdmin || (user?.role === 'porteur_de_projet' && isOwner);

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => navigate('/projects')} style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Retour aux projets
      </button>

      <div className="page-header">
        <div>
          <h1>{a.title}</h1>
          {a.property_city && <p className="text-muted">{a.property_title} — {a.property_city}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span>
          {canEdit && (
            <button
              className="btn btn-sm"
              onClick={() => navigate(`/projects/${id}/edit`)}
              title="Modifier le projet"
            >
              <Edit size={16} /> Modifier
            </button>
          )}
          {canDelete && (
            <button
              className="btn btn-sm btn-danger"
              onClick={handleDeleteProject}
              title="Supprimer le projet"
            >
              <Trash2 size={16} /> Supprimer
            </button>
          )}
        </div>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'details' ? ' active' : ''}`} onClick={() => setTab('details')}>Détails</button>
        <button className={`tab${tab === 'photos' ? ' active' : ''}`} onClick={() => setTab('photos')}>Photos</button>
        <button className={`tab${tab === 'dividends' ? ' active' : ''}`} onClick={() => setTab('dividends')}>Dividendes ({dividends.length})</button>
        <button className={`tab${tab === 'statements' ? ' active' : ''}`} onClick={() => setTab('statements')}>Rapports ({statements.length})</button>
        <button className={`tab${tab === 'investors' ? ' active' : ''}`} onClick={() => setTab('investors')}>Associés ({investorsMeta?.total_investors || 0})</button>
      </div>

      {tab === 'details' && (
        <div className="two-col">
          <div className="two-col-main">
            {/* Informations clés en haut */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="stat-card">
                <div className="stat-icon stat-icon-primary">
                  <TrendingUp size={20} />
                </div>
                <div className="stat-content">
                  <span className="stat-value" style={{ color: '#10B981' }}>{a.net_yield_percent ?? '—'}%</span>
                  <span className="stat-label">Rendement net annuel</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon-success">
                  <DollarSign size={20} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{fmt(a.share_price_cents)}</span>
                  <span className="stat-label">Prix par part</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon stat-icon-info">
                  <Calendar size={20} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{a.available_shares}</span>
                  <span className="stat-label">Parts disponibles</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {a.description && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3>Description du projet</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '.9rem', lineHeight: '1.6' }}>
                  {a.description}
                </p>
              </div>
            )}

            {/* Période de financement */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3>Période de levée de fonds</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(79, 70, 229, 0.05)', borderRadius: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-secondary)', marginBottom: '.25rem' }}>Date de début</div>
                  <div style={{ fontWeight: 600 }}>{fmtDate(a.funding_start_date)}</div>
                </div>
                <div style={{ height: '40px', width: '1px', background: 'var(--border-color)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-secondary)', marginBottom: '.25rem' }}>Date de fin</div>
                  <div style={{ fontWeight: 600 }}>{fmtDate(a.funding_end_date)}</div>
                </div>
                <div style={{ height: '40px', width: '1px', background: 'var(--border-color)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-secondary)', marginBottom: '.25rem' }}>Durée restante</div>
                  <div style={{ fontWeight: 600, color: new Date(a.funding_end_date) > new Date() ? '#10B981' : '#EF4444' }}>
                    {new Date(a.funding_end_date) > new Date()
                      ? `${Math.ceil((new Date(a.funding_end_date) - new Date()) / (1000 * 60 * 60 * 24))} jours`
                      : 'Terminé'}
                  </div>
                </div>
              </div>
            </div>

            {/* Détails financiers complets */}
            <div className="card">
              <h3>Détails financiers</h3>
              <div className="detail-grid">
                <div className="detail-row"><span>Montant total (objectif)</span><span style={{ fontWeight: 600 }}>{fmt(a.total_amount_cents)}</span></div>
                <div className="detail-row"><span>Montant levé</span><span style={{ fontWeight: 600, color: '#10B981' }}>{fmt(a.amount_raised_cents)}</span></div>
                <div className="detail-row"><span>Parts totales</span><span>{a.total_shares} parts</span></div>
                <div className="detail-row"><span>Parts vendues</span><span>{a.shares_sold}</span></div>
                <div className="detail-row"><span>Parts disponibles</span><span style={{ fontWeight: 600 }}>{a.available_shares}</span></div>
                <div className="detail-row"><span>Prix par part</span><span>{fmt(a.share_price_cents)}</span></div>
                <div className="detail-row"><span>Investissement minimum</span><span>{fmt(a.min_investment_cents)}</span></div>
                <div className="detail-row"><span>Investissement maximum</span><span>{a.max_investment_cents ? fmt(a.max_investment_cents) : 'Aucune limite'}</span></div>
                <div className="detail-row"><span>Frais de gestion</span><span>{a.management_fee_percent}%</span></div>
                <div className="detail-row"><span>Rendement brut</span><span className="text-success">{a.gross_yield_percent ?? '—'}%</span></div>
                <div className="detail-row"><span>Rendement net</span><span className="text-success" style={{ fontWeight: 600 }}>{a.net_yield_percent ?? '—'}%</span></div>
              </div>
            </div>
          </div>

          <div className="two-col-side">
            <div className="card">
              <h3>Suivi de l'avancement du financement</h3>
              <div className="progress-bar-container" style={{ marginBottom: '.5rem' }}>
                <div className="progress-bar" style={{ width: `${Math.min(a.funding_progress_percent || 0, 100)}%` }} />
              </div>
              <div className="progress-info">
                <span>{fmt(a.amount_raised_cents)} levés</span>
                <span>{Math.round(a.funding_progress_percent || 0)}%</span>
              </div>
              <div style={{ marginTop: '1rem', fontSize: '.9rem', color: 'var(--text-secondary)' }}>
                Objectif : {fmt(a.total_amount_cents)} · Période de levée : {fmtDate(a.funding_start_date)} → {fmtDate(a.funding_end_date)}
              </div>
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <span className="stat-value">{a.available_shares}</span>
                <span className="stat-label">parts disponibles</span>
              </div>
            </div>

{canInvest && (
              <div className="card" style={{ marginTop: '1rem' }}>
                <h3 style={{ color: 'var(--primary)' }}>Investir dans ce projet</h3>

                {/* Vérification KYC */}
                {user?.kyc_status !== 'verified' && (
                  <div style={{ padding: '.75rem', background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)', borderRadius: '8px', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
                      <AlertCircle size={18} color="#FFC107" />
                      <span style={{ fontWeight: 600, color: '#FFC107' }}>Vérification KYC requise</span>
                    </div>
                    <p style={{ fontSize: '.875rem', margin: 0, color: 'var(--text-secondary)' }}>
                      Vous devez compléter votre vérification d'identité avant d'investir.
                    </p>
                    <button
                      className="btn btn-sm"
                      onClick={() => navigate('/kyc')}
                      style={{ marginTop: '.5rem' }}
                    >
                      Compléter mon KYC
                    </button>
                  </div>
                )}

                {/* Info solde wallet */}
                {wallet && (
                  <div style={{ padding: '.75rem', background: 'rgba(79, 70, 229, 0.1)', border: '1px solid rgba(79, 70, 229, 0.3)', borderRadius: '8px', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '.875rem', color: 'var(--text-secondary)' }}>Solde disponible</span>
                      <span style={{ fontWeight: 600, fontSize: '1rem' }}>{fmt(wallet.balance_cents)}</span>
                    </div>
                  </div>
                )}

                <div className="invest-constraints">
                  <span>Min: {fmt(a.min_investment_cents)}</span>
                  {a.max_investment_cents && <span>Max: {fmt(a.max_investment_cents)}</span>}
                  <span>Prix/part: {fmt(a.share_price_cents)}</span>
                </div>

                <form onSubmit={handleInvest}>
                  <div className="form-group">
                    <label>Montant à investir (EUR)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={investAmount}
                      onChange={e => setInvestAmount(e.target.value)}
                      placeholder="1000.00"
                      required
                      disabled={user?.kyc_status !== 'verified'}
                    />
                  </div>

                  {/* Calcul automatique des parts */}
                  {investAmount && parseFloat(investAmount) > 0 && a.share_price_cents > 0 && (
                    <div style={{ padding: '.75rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', marginTop: '.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
                        <CheckCircle size={18} color="#10B981" />
                        <span style={{ fontWeight: 600, color: '#10B981' }}>Détails de l'investissement</span>
                      </div>
                      <div style={{ fontSize: '.875rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.25rem' }}>
                          <span>Nombre de parts</span>
                          <span style={{ fontWeight: 600 }}>{Math.floor((parseFloat(investAmount) * 100) / a.share_price_cents)} parts</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.25rem' }}>
                          <span>Rendement estimé annuel</span>
                          <span style={{ fontWeight: 600, color: '#10B981' }}>
                            {a.net_yield_percent ? `${fmt(parseFloat(investAmount) * 100 * a.net_yield_percent / 100)} (${a.net_yield_percent}%)` : '—'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>% du projet détenu</span>
                          <span style={{ fontWeight: 600 }}>
                            {((Math.floor((parseFloat(investAmount) * 100) / a.share_price_cents) / a.total_shares) * 100).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {wallet && investAmount && parseFloat(investAmount) * 100 > wallet.balance_cents && (
                    <div style={{ padding: '.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', marginTop: '.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        <AlertCircle size={18} color="#EF4444" />
                        <span style={{ fontSize: '.875rem', color: '#EF4444', fontWeight: 600 }}>
                          Solde insuffisant. Veuillez recharger votre portefeuille.
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={
                      submitting ||
                      user?.kyc_status !== 'verified' ||
                      (wallet && investAmount && parseFloat(investAmount) * 100 > wallet.balance_cents)
                    }
                    style={{ marginTop: '.75rem' }}
                  >
                    {submitting ? (
                      <><div className="spinner spinner-sm" /> Traitement...</>
                    ) : (
                      'Confirmer l\'investissement'
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'photos' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ marginBottom: '.25rem' }}>Galerie du projet</h3>
              <p style={{ fontSize: '.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                {(a.images?.length || 0) + (a.property_photos?.length || 0)} photo(s)
              </p>
            </div>
            {isAdmin && (
              <div>
                <input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  onChange={handleUploadImages}
                  style={{ display: 'none' }}
                />
                <label htmlFor="image-upload" className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                  {uploadingImages ? (
                    <><div className="spinner spinner-sm" /> Upload en cours...</>
                  ) : (
                    <><Upload size={16} /> Ajouter des photos</>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Images du projet */}
          {a.images && a.images.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '.9rem', marginBottom: '.75rem', color: 'var(--text-secondary)' }}>
                Photos du projet ({a.images.length})
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {a.images.map((img) => (
                  <div key={img.id} style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer' }} onClick={() => setSelectedImage({ url: getImageUrl(img.url), filename: img.filename })}>
                    <img
                      src={getImageUrl(img.url)}
                      alt={img.filename}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#f5f5f5' }}
                    />
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteImage(img.id)}
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          background: 'rgba(239, 68, 68, 0.9)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: 'white',
                          transition: 'background 0.2s',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 1)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'}
                      >
                        <X size={16} />
                      </button>
                    )}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '.5rem',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                      color: 'white',
                      fontSize: '.75rem',
                    }}>
                      {img.filename}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos du bien immobilier */}
          {a.property_photos && a.property_photos.length > 0 && (
            <div>
              <h4 style={{ fontSize: '.9rem', marginBottom: '.75rem', color: 'var(--text-secondary)' }}>
                Photos du bien immobilier ({a.property_photos.length})
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {a.property_photos.map((photo) => (
                  <div key={photo.id} style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => setSelectedImage({ url: getImageUrl(photo.url), filename: photo.filename })} onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}>
                    <img
                      src={getImageUrl(photo.url)}
                      alt={photo.filename}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#f5f5f5' }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '.5rem',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                      color: 'white',
                      fontSize: '.75rem',
                    }}>
                      {photo.filename}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* État vide */}
          {(!a.images || a.images.length === 0) && (!a.property_photos || a.property_photos.length === 0) && (
            <div style={{
              aspectRatio: '16/9',
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
              border: '2px dashed rgba(79, 70, 229, 0.3)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '.5rem',
              color: 'var(--text-secondary)',
            }}>
              <ImageIcon size={40} opacity={0.5} />
              <span style={{ fontSize: '.875rem' }}>Aucune photo pour le moment</span>
              {isAdmin && (
                <label htmlFor="image-upload" style={{ marginTop: '.5rem', cursor: 'pointer', color: 'var(--primary)', fontSize: '.875rem', textDecoration: 'underline' }}>
                  Ajouter la première photo
                </label>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'dividends' && (
        <div>
          {isAdmin && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3>Créer un dividende</h3>
              <form onSubmit={handleCreateDividend}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Montant total (EUR)</label>
                    <input type="number" step="0.01" min="0.01" required value={divForm.total_amount_cents} onChange={e => setDivForm({ ...divForm, total_amount_cents: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Début période</label>
                    <input type="date" required value={divForm.period_start} onChange={e => setDivForm({ ...divForm, period_start: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Fin période</label>
                    <input type="date" required value={divForm.period_end} onChange={e => setDivForm({ ...divForm, period_end: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? '...' : 'Créer le dividende'}</button>
              </form>
            </div>
          )}
          {dividends.length === 0 ? (
            <div className="card"><div className="empty-state"><DollarSign size={48} /><p>Aucun dividende</p></div></div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr><th>Date création</th><th>Période</th><th>Montant total</th><th>Par part</th><th>Statut</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {dividends.map(d => {
                    const da = d.attributes || d;
                    return (
                      <tr key={d.id}>
                        <td>{fmtDate(da.created_at)}</td>
                        <td>{fmtDate(da.period_start)} — {fmtDate(da.period_end)}</td>
                        <td>{fmt(da.total_amount_cents)}</td>
                        <td>{fmt(da.amount_per_share_cents)}</td>
                        <td><span className={`badge ${da.status === 'distribue' ? 'badge-success' : da.status === 'annule' ? 'badge-danger' : 'badge-warning'}`}>{DIV_STATUS[da.status] || da.status}</span></td>
                        <td>
                          <div className="actions-cell">
                            <button className="btn-icon" title="Voir les détails" onClick={() => navigate(`/projects/${id}/dividends/${d.id}`)}>
                              <Eye size={16} />
                            </button>
                            {isAdmin && da.status === 'planifie' && (
                              <button className="btn-icon btn-success" title="Distribuer" onClick={() => handleDistributeDividend(d.id)}>
                                <Send size={16} />
                              </button>
                            )}
                            {isAdmin && (
                              <button className="btn-icon btn-danger" title="Supprimer" onClick={() => handleDeleteDividend(d.id)}>
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'statements' && (
        <div>
          {canCreateStatement && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3>Soumettre un rapport financier</h3>
              <p style={{ fontSize: '.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Les rapports financiers permettent de suivre les revenus et dépenses du projet sur une période donnée.
              </p>
              <form onSubmit={handleCreateStatement}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Type de Rapport *</label>
                    <select value={stmtForm.statement_type} onChange={e => setStmtForm({ ...stmtForm, statement_type: e.target.value })} required>
                      <option value="trimestriel">Trimestriel</option>
                      <option value="semestriel">Semestriel</option>
                      <option value="annuel">Annuel</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date de début *</label>
                    <input
                      type="date"
                      required
                      value={stmtForm.period_start}
                      onChange={e => setStmtForm({ ...stmtForm, period_start: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date de fin *</label>
                    <input
                      type="date"
                      required
                      value={stmtForm.period_end}
                      onChange={e => setStmtForm({ ...stmtForm, period_end: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Loyers Encaissés (Revenus) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={stmtForm.total_revenue_cents}
                      onChange={e => setStmtForm({ ...stmtForm, total_revenue_cents: e.target.value })}
                      placeholder="0.00 EUR"
                    />
                    <small style={{ fontSize: '.75rem', color: 'var(--text-secondary)' }}>
                      Saisissez le montant total des loyers perçus pendant cette période
                    </small>
                  </div>
                  <div className="form-group">
                    <label>Charges / Dépenses *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={stmtForm.total_expenses_cents}
                      onChange={e => setStmtForm({ ...stmtForm, total_expenses_cents: e.target.value })}
                      placeholder="0.00 EUR"
                    />
                    <small style={{ fontSize: '.75rem', color: 'var(--text-secondary)' }}>
                      Incluant taxes foncières, charges de copropriété, travaux, etc.
                    </small>
                  </div>
                </div>

                {/* Calcul automatique des montants */}
                {stmtForm.total_revenue_cents && stmtForm.total_expenses_cents && (
                  <div style={{ padding: '1rem', background: 'rgba(79, 70, 229, 0.05)', borderRadius: '8px', marginTop: '1rem', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '.9rem', marginBottom: '.75rem', color: 'var(--primary)' }}>Calcul automatique</h4>
                    <div className="detail-grid">
                      <div className="detail-row">
                        <span>Frais de Gestion ({a.management_fee_percent}%)</span>
                        <span style={{ fontWeight: 600 }}>{fmt(Math.round(parseFloat(stmtForm.total_revenue_cents) * 100 * (a.management_fee_percent / 100)))}</span>
                      </div>
                      <div className="detail-row">
                        <span style={{ fontWeight: 600 }}>Résultat Net (À verser aux investisseurs)</span>
                        <span style={{ fontWeight: 600, color: '#10B981' }}>
                          {fmt(
                            Math.round(parseFloat(stmtForm.total_revenue_cents) * 100) -
                            Math.round(parseFloat(stmtForm.total_expenses_cents) * 100) -
                            Math.round(parseFloat(stmtForm.total_revenue_cents) * 100 * (a.management_fee_percent / 100))
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <><div className="spinner spinner-sm" /> Envoi en cours...</>
                  ) : (
                    'Soumettre le rapport'
                  )}
                </button>
              </form>
            </div>
          )}
          {statements.length === 0 ? (
            <div className="card"><div className="empty-state"><FileText size={48} /><p>Aucun rapport financier</p></div></div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr><th>Type</th><th>Période</th><th>Revenus</th><th>Dépenses</th><th>Résultat net</th><th>Rend. net</th>{isAdmin && <th>Actions</th>}</tr>
                </thead>
                <tbody>
                  {statements.map(s => {
                    const sa = s.attributes || s;
                    return (
                      <tr key={s.id}>
                        <td><span className="badge badge-info">{STMT_TYPE[sa.statement_type] || sa.statement_type}</span></td>
                        <td>{fmtDate(sa.period_start)} — {fmtDate(sa.period_end)}</td>
                        <td className="amount-positive">{fmt(sa.total_revenue_cents)}</td>
                        <td className="amount-negative">{fmt(sa.total_expenses_cents)}</td>
                        <td style={{ fontWeight: 600 }}>{fmt(sa.net_income_cents)}</td>
                        <td>{sa.net_yield_percent ?? '—'}%</td>
                        {isAdmin && (
                          <td>
                            <div className="actions-cell">
                              <button className="btn-icon btn-danger" title="Supprimer" onClick={() => handleDeleteStatement(s.id)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Onglet Associés (Investisseurs) */}
      {tab === 'investors' && (
        <div>
          {canViewInvestors ? (
            // Admin et Porteur: voir la liste complète des investisseurs
            <div>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <h3>Résumé des investisseurs</h3>
                <div className="detail-grid">
                  <div className="detail-row">
                    <span>Nombre total d'investisseurs</span>
                    <span style={{ fontWeight: 600 }}>{investorsMeta?.total_investors || 0}</span>
                  </div>
                  <div className="detail-row">
                    <span>Montant total investi</span>
                    <span style={{ fontWeight: 600 }}>{fmt(investorsMeta?.total_amount_cents || 0)}</span>
                  </div>
                </div>
              </div>

              {investors.length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    <Users size={48} />
                    <p>Aucun investisseur pour le moment</p>
                  </div>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Investisseur</th>
                        <th>Email</th>
                        <th>Montant investi</th>
                        <th>Date d'investissement</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investors.map(inv => {
                        const a = inv.attributes || inv;
                        return (
                          <tr key={inv.id}>
                            <td>{a.investor_name || '—'}</td>
                            <td>{a.investor_email || '—'}</td>
                            <td style={{ fontWeight: 600 }}>{fmt(a.amount_cents)}</td>
                            <td>{fmtDate(a.created_at)}</td>
                            <td>
                              <span className={`badge ${a.status === 'active' ? 'badge-success' : 'badge-info'}`}>
                                {a.status === 'active' ? 'Actif' : a.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            // Investisseur: voir seulement le nombre total
            <div className="card">
              <div className="empty-state">
                <Users size={64} style={{ color: '#DAA520' }} />
                <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                  {investorsMeta?.total_investors || 0} investisseur{(investorsMeta?.total_investors || 0) > 1 ? 's' : ''}
                </h3>
                <p style={{ color: '#6b7280' }}>
                  {(investorsMeta?.total_investors || 0) > 0
                    ? `${investorsMeta?.total_investors} personne${investorsMeta?.total_investors > 1 ? 's' : ''} ${investorsMeta?.total_investors > 1 ? 'ont' : 'a'} investi dans ce projet`
                    : 'Aucun investisseur pour le moment'}
                </p>
                <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#f8f9fb', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    Montant total investi
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>
                    {fmt(investorsMeta?.total_amount_cents || 0)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal pour visualiser l'image en grand */}
      {selectedImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '2rem',
          }}
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              fontSize: '24px',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <X size={24} />
          </button>
          <div
            style={{
              maxWidth: '95%',
              maxHeight: '95%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.url}
              alt={selectedImage.filename}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              }}
            />
            <div
              style={{
                color: 'white',
                fontSize: '0.875rem',
                textAlign: 'center',
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
              }}
            >
              {selectedImage.filename}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
