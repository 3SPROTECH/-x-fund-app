import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { investmentProjectsApi, investmentsApi, projectInvestorsApi, mvpReportsApi } from '../../api/investments';
import { dividendsApi } from '../../api/dividends';
import { financialStatementsApi } from '../../api/financialStatements';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, TrendingUp, FileText, DollarSign, AlertCircle, CheckCircle, Image as ImageIcon, Calendar, Upload, X, Trash2, Edit, Users, Eye, Send, Save, Pencil, Plus, Check, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { walletApi } from '../../api/wallet';
import { projectImagesApi } from '../../api/images';
import { getImageUrl } from '../../api/client';
import { adminApi } from '../../api/admin';

const STATUS_LABELS = { brouillon: 'Brouillon', ouvert: 'Ouvert', finance: 'Financé', cloture: 'Clôturé', annule: 'Annulé' };
const STATUS_BADGE = { ouvert: 'badge-success', finance: 'badge-info', cloture: '', annule: 'badge-danger', brouillon: 'badge-warning' };
const DIV_STATUS = { planifie: 'Planifié', distribue: 'Distribué', annule: 'Annulé' };
const STMT_TYPE = { trimestriel: 'Trimestriel', semestriel: 'Semestriel', annuel: 'Annuel' };

const OPERATION_TYPES = {
  promotion_immobiliere: 'Promotion immobiliere (construction neuve)',
  marchand_de_biens: 'Marchand de biens (achat / revente)',
  rehabilitation_lourde: 'Rehabilitation lourde',
  division_fonciere: 'Division fonciere',
  immobilier_locatif: 'Immobilier locatif',
  transformation_usage: "Transformation d'usage",
};
const OPERATION_TYPE_ICONS = {
  promotion_immobiliere: '\u{1F3D7}', marchand_de_biens: '\u{1F3E1}', rehabilitation_lourde: '\u{1F6E0}',
  division_fonciere: '\u{1F3D8}', immobilier_locatif: '\u{1F3E2}', transformation_usage: '\u{1F504}',
};
const OPERATION_STATUSES = {
  acquisition_en_cours: 'Acquisition en cours', acte_signe: 'Acte signé', en_renovation: 'En renovation',
  en_commercialisation: 'En commercialisation', sous_offre: 'Sous offre', sous_compromis: 'Sous compromis', vendu: 'Vendu',
};
// Libellés adaptés par type d'opération (affichage uniquement)
const OPERATION_STATUS_LABELS_BY_TYPE = {
  promotion_immobiliere: {
    acquisition_en_cours: 'Acquisition terrain', acte_signe: 'Acte signé', en_renovation: 'Construction en cours',
    en_commercialisation: 'Commercialisation', sous_offre: 'Sous offre', sous_compromis: 'Sous compromis', vendu: 'Livré / Vendu',
  },
  marchand_de_biens: null, // utilise OPERATION_STATUSES
  rehabilitation_lourde: {
    acquisition_en_cours: 'Acquisition en cours', acte_signe: 'Acte signé', en_renovation: 'Travaux en cours',
    en_commercialisation: 'En commercialisation', sous_offre: 'Sous offre', sous_compromis: 'Sous compromis', vendu: 'Vendu',
  },
  division_fonciere: {
    acquisition_en_cours: 'Étude / Acquisition', acte_signe: 'Acte signé', en_renovation: 'Division en cours',
    en_commercialisation: 'Commercialisation lots', sous_offre: 'Sous offre', sous_compromis: 'Sous compromis', vendu: 'Vendu',
  },
  immobilier_locatif: {
    acquisition_en_cours: 'Acquisition en cours', acte_signe: 'Acte signé', en_renovation: 'Travaux / Mise aux normes',
    en_commercialisation: 'Mise en location', sous_offre: 'Locataire pressenti', sous_compromis: 'Bail signé', vendu: 'En gestion',
  },
  transformation_usage: {
    acquisition_en_cours: 'Acquisition en cours', acte_signe: 'Acte signé', en_renovation: 'Travaux de transformation',
    en_commercialisation: 'Commercialisation', sous_offre: 'Sous offre', sous_compromis: 'Sous compromis', vendu: 'Réalisé',
  },
};
const getOperationStatusLabel = (operationType, status) =>
  (OPERATION_STATUS_LABELS_BY_TYPE[operationType] && OPERATION_STATUS_LABELS_BY_TYPE[operationType][status]) || OPERATION_STATUSES[status] || status;
const MVP_STATUS_BADGE = {
  acquisition_en_cours: 'badge-warning', acte_signe: 'badge-info', en_renovation: 'badge-warning',
  en_commercialisation: 'badge-info', sous_offre: 'badge-info', sous_compromis: 'badge-success', vendu: 'badge-success',
};
const REVIEW_STATUS_LABELS = {
  brouillon: 'Brouillon', soumis: 'Soumis', valide: 'Valide', rejete: 'Rejete',
};
const REVIEW_STATUS_BADGE = {
  brouillon: 'badge-warning', soumis: 'badge-info', valide: 'badge-success', rejete: 'badge-danger',
};
const EMPTY_MVP_FORM = {
  operation_status: 'acquisition_en_cours', expected_repayment_date: '', summary: '',
  purchase_price_previsionnel: '', purchase_price_realise: '', works_previsionnel: '', works_realise: '',
  total_cost_previsionnel: '', total_cost_realise: '', target_sale_price_previsionnel: '', target_sale_price_realise: '',
  best_offer_previsionnel: '', best_offer_realise: '', works_progress_percent: '', budget_variance_percent: '',
  sale_start_date: '', visits_count: '', offers_count: '', listed_price: '',
  risk_identified: '', risk_impact: '', corrective_action: '',
  estimated_compromise_date: '', estimated_deed_date: '', estimated_repayment_date: '', exit_confirmed: false,
};
function mvpApiToForm(data) {
  const r = data.attributes || data;
  const c = (v) => v ? (v / 100).toString() : '';
  const s = (v) => v != null ? v.toString() : '';
  return {
    operation_status: r.operation_status || 'acquisition_en_cours', expected_repayment_date: r.expected_repayment_date || '',
    summary: r.summary || '',
    purchase_price_previsionnel: c(r.purchase_price_previsionnel_cents), purchase_price_realise: c(r.purchase_price_realise_cents),
    works_previsionnel: c(r.works_previsionnel_cents), works_realise: c(r.works_realise_cents),
    total_cost_previsionnel: c(r.total_cost_previsionnel_cents), total_cost_realise: c(r.total_cost_realise_cents),
    target_sale_price_previsionnel: c(r.target_sale_price_previsionnel_cents), target_sale_price_realise: c(r.target_sale_price_realise_cents),
    best_offer_previsionnel: c(r.best_offer_previsionnel_cents), best_offer_realise: c(r.best_offer_realise_cents),
    works_progress_percent: s(r.works_progress_percent), budget_variance_percent: s(r.budget_variance_percent),
    sale_start_date: r.sale_start_date || '', visits_count: s(r.visits_count), offers_count: s(r.offers_count),
    listed_price: c(r.listed_price_cents),
    risk_identified: r.risk_identified || '', risk_impact: r.risk_impact || '', corrective_action: r.corrective_action || '',
    estimated_compromise_date: r.estimated_compromise_date || '', estimated_deed_date: r.estimated_deed_date || '',
    estimated_repayment_date: r.estimated_repayment_date || '', exit_confirmed: r.exit_confirmed || false,
  };
}
function mvpFormToApi(f) {
  const toC = (v) => v ? Math.round(parseFloat(v) * 100) : null;
  const toN = (v) => v ? parseFloat(v) : null;
  const toI = (v) => v ? parseInt(v, 10) : null;
  return {
    operation_status: f.operation_status, expected_repayment_date: f.expected_repayment_date || null, summary: f.summary || null,
    purchase_price_previsionnel_cents: toC(f.purchase_price_previsionnel), purchase_price_realise_cents: toC(f.purchase_price_realise),
    works_previsionnel_cents: toC(f.works_previsionnel), works_realise_cents: toC(f.works_realise),
    total_cost_previsionnel_cents: toC(f.total_cost_previsionnel), total_cost_realise_cents: toC(f.total_cost_realise),
    target_sale_price_previsionnel_cents: toC(f.target_sale_price_previsionnel), target_sale_price_realise_cents: toC(f.target_sale_price_realise),
    best_offer_previsionnel_cents: toC(f.best_offer_previsionnel), best_offer_realise_cents: toC(f.best_offer_realise),
    works_progress_percent: toN(f.works_progress_percent), budget_variance_percent: toN(f.budget_variance_percent),
    sale_start_date: f.sale_start_date || null, visits_count: toI(f.visits_count), offers_count: toI(f.offers_count),
    listed_price_cents: toC(f.listed_price),
    risk_identified: f.risk_identified || null, risk_impact: f.risk_impact || null, corrective_action: f.corrective_action || null,
    estimated_compromise_date: f.estimated_compromise_date || null, estimated_deed_date: f.estimated_deed_date || null,
    estimated_repayment_date: f.estimated_repayment_date || null, exit_confirmed: f.exit_confirmed,
  };
}

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

  // MVP Report state
  const [mvpReports, setMvpReports] = useState([]);
  const [loadingMvpReports, setLoadingMvpReports] = useState(false);
  const [mvpMode, setMvpMode] = useState('list'); // 'list' | 'create' | 'edit' | 'view'
  const [mvpForm, setMvpForm] = useState({ ...EMPTY_MVP_FORM });
  const [mvpEditingId, setMvpEditingId] = useState(null);
  const [mvpViewReport, setMvpViewReport] = useState(null);
  const [mvpSubmitting, setMvpSubmitting] = useState(false);
  const [rejectModalReport, setRejectModalReport] = useState(null);
  const [rejectComment, setRejectComment] = useState('');

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

  // Load MVP reports when switching to statements tab (admin + porteur owner)
  useEffect(() => {
    if (tab === 'statements' && id && (user?.role === 'administrateur' || user?.role === 'porteur_de_projet')) {
      loadMvpReports();
    }
  }, [tab, id]);

  // === MVP Report handlers ===
  const loadMvpReports = async () => {
    setLoadingMvpReports(true);
    try {
      const res = user?.role === 'administrateur'
        ? await adminApi.getMvpReports(id)
        : await mvpReportsApi.list(id);
      setMvpReports(res.data.data || []);
    } catch { /* silent - no access */ }
    finally { setLoadingMvpReports(false); }
  };

  const handleSetOperationType = async (type) => {
    try {
      if (user?.role === 'administrateur') {
        await adminApi.updateProject(id, { operation_type: type });
      } else {
        await investmentProjectsApi.update(id, { operation_type: type });
      }
      setProject((prev) => {
        const attrs = prev.attributes || prev;
        return prev.attributes
          ? { ...prev, attributes: { ...attrs, operation_type: type } }
          : { ...prev, operation_type: type };
      });
      toast.success("Type d'operation mis a jour");
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || 'Erreur');
    }
  };

  const handleMvpCreate = () => { setMvpForm({ ...EMPTY_MVP_FORM }); setMvpEditingId(null); setMvpMode('create'); };
  const handleMvpEdit = (report) => { setMvpForm(mvpApiToForm(report)); setMvpEditingId(report.id); setMvpMode('edit'); };
  const handleMvpView = (report) => { setMvpViewReport(report); setMvpMode('view'); };

  const handleMvpDelete = async (reportId) => {
    if (!window.confirm('Supprimer ce rapport ?')) return;
    try {
      if (isAdmin) {
        await adminApi.deleteMvpReport(id, reportId);
      } else {
        await mvpReportsApi.delete(id, reportId);
      }
      toast.success('Rapport supprime');
      loadMvpReports();
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur lors de la suppression'); }
  };

  const handleMvpSubmit = async (e) => {
    e.preventDefault();
    setMvpSubmitting(true);
    try {
      const payload = mvpFormToApi(mvpForm);
      if (mvpMode === 'create') {
        if (isAdmin) {
          await adminApi.createMvpReport(id, payload);
        } else {
          await mvpReportsApi.create(id, payload);
        }
        toast.success('Rapport cree');
      } else {
        if (isAdmin) {
          await adminApi.updateMvpReport(id, mvpEditingId, payload);
        } else {
          await mvpReportsApi.update(id, mvpEditingId, payload);
        }
        toast.success('Rapport mis a jour');
      }
      setMvpMode('list');
      loadMvpReports();
    } catch (err) {
      toast.error(err.response?.data?.errors?.join(', ') || err.response?.data?.error || "Erreur lors de l'enregistrement");
    } finally { setMvpSubmitting(false); }
  };

  // Porteur: submit report for validation
  const handleMvpSubmitForReview = async (reportId) => {
    if (!window.confirm('Soumettre ce rapport pour validation par l\'admin ?')) return;
    setMvpSubmitting(true);
    try {
      await mvpReportsApi.submit(id, reportId);
      toast.success('Rapport soumis pour validation');
      loadMvpReports();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la soumission');
    } finally { setMvpSubmitting(false); }
  };

  // Admin: validate report
  const handleMvpValidate = async (reportId) => {
    if (!window.confirm('Valider ce rapport ? Le projet sera approuve et publie.')) return;
    setMvpSubmitting(true);
    try {
      await adminApi.validateMvpReport(id, reportId);
      toast.success('Rapport valide. Projet approuve et publie.');
      loadMvpReports();
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la validation');
    } finally { setMvpSubmitting(false); }
  };

  // Admin: reject report
  const handleMvpReject = async () => {
    if (!rejectComment.trim()) { toast.error('Un commentaire est requis'); return; }
    setMvpSubmitting(true);
    try {
      await adminApi.rejectMvpReport(id, rejectModalReport.id, rejectComment);
      toast.success('Rapport rejete');
      setRejectModalReport(null);
      setRejectComment('');
      loadMvpReports();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors du rejet');
    } finally { setMvpSubmitting(false); }
  };

  const updateMvpField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setMvpForm((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-compute total cost for MVP
  useEffect(() => {
    const pp = parseFloat(mvpForm.purchase_price_previsionnel) || 0;
    const wp = parseFloat(mvpForm.works_previsionnel) || 0;
    if (pp || wp) setMvpForm((prev) => ({ ...prev, total_cost_previsionnel: (pp + wp).toString() }));
  }, [mvpForm.purchase_price_previsionnel, mvpForm.works_previsionnel]);

  useEffect(() => {
    const pr = parseFloat(mvpForm.purchase_price_realise) || 0;
    const wr = parseFloat(mvpForm.works_realise) || 0;
    if (pr || wr) setMvpForm((prev) => ({ ...prev, total_cost_realise: (pr + wr).toString() }));
  }, [mvpForm.purchase_price_realise, mvpForm.works_realise]);

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
      navigate(user?.role === 'administrateur' ? '/admin/projects' : '/projects');
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
      <button className="btn btn-ghost" onClick={() => navigate(user?.role === 'administrateur' ? '/admin/projects' : '/projects')} style={{ marginBottom: '1rem' }}>
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
                  {investAmount && parseFloat(investAmount) > 0 && a.share_price_cents > 0 && (() => {
                    const amountCents = parseFloat(investAmount) * 100;
                    const feePercent = a.investment_fee_percent || 0;
                    const feeCents = feePercent > 0 ? Math.round(amountCents * feePercent / 100) : 0;
                    const shares = Math.floor(amountCents / a.share_price_cents);
                    const netCents = amountCents - feeCents;
                    return (
                      <div style={{ padding: '.75rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', marginTop: '.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
                          <CheckCircle size={18} color="#10B981" />
                          <span style={{ fontWeight: 600, color: '#10B981' }}>Détails de l'investissement</span>
                        </div>
                        <div style={{ fontSize: '.875rem', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.25rem' }}>
                            <span>Nombre de parts</span>
                            <span style={{ fontWeight: 600 }}>{shares} parts</span>
                          </div>
                          {feeCents > 0 && (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.25rem' }}>
                                <span>Frais de plateforme ({feePercent}%)</span>
                                <span style={{ fontWeight: 600, color: '#EF4444' }}>-{fmt(feeCents)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.25rem', paddingTop: '.25rem', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <span style={{ fontWeight: 600 }}>Montant net investi</span>
                                <span style={{ fontWeight: 600 }}>{fmt(netCents)}</span>
                              </div>
                            </>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.25rem' }}>
                            <span>Rendement estimé annuel</span>
                            <span style={{ fontWeight: 600, color: '#10B981' }}>
                              {a.net_yield_percent ? `${fmt(amountCents * a.net_yield_percent / 100)} (${a.net_yield_percent}%)` : '—'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>% du projet détenu</span>
                            <span style={{ fontWeight: 600 }}>
                              {((shares / a.total_shares) * 100).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

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
          

          {/* ===== RAPPORT MVP (Admin + Porteur owner) ===== */}
          {(isAdmin || isOwner) && (
            <div style={{ marginTop: '2rem' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                {mvpMode === 'list' && a.operation_type && !isAdmin && (
                  <button className="btn btn-sm btn-primary" onClick={handleMvpCreate}><Plus size={14} /> Nouveau rapport</button>
                )}
                {mvpMode !== 'list' && (
                  <button className="btn btn-sm btn-ghost" onClick={() => setMvpMode('list')}><X size={14} /> Fermer</button>
                )}
              </div>

              {/* Operation Type Selection */}
              {!a.operation_type && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <p className="text-muted" style={{ marginBottom: '1rem' }}>
                    Selectionnez le type d'operation pour ce projet :
                  </p>
                  <div className="operation-type-selector">
                    {Object.entries(OPERATION_TYPES).map(([key, label]) => (
                      <div key={key} className="operation-type-option" onClick={() => handleSetOperationType(key)}>
                        <span className="type-emoji">{OPERATION_TYPE_ICONS[key]}</span>
                        <span className="type-label">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show current operation type */}
              {a.operation_type && (
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <span className="badge badge-info">
                    {OPERATION_TYPE_ICONS[a.operation_type]} {OPERATION_TYPES[a.operation_type]}
                  </span>
                  {(isAdmin || isOwner) && (
                    <button className="btn btn-sm btn-ghost" style={{ fontSize: '.75rem' }}
                      onClick={() => setProject((prev) => {
                        const attrs = prev.attributes || prev;
                        return prev.attributes
                          ? { ...prev, attributes: { ...attrs, operation_type: null } }
                          : { ...prev, operation_type: null };
                      })}
                    >Modifier le type</button>
                  )}
                </div>
              )}

              {/* === LIST des rapports MVP (tous types d'opération) === */}
              {a.operation_type && mvpMode === 'list' && (
                <>
                  {loadingMvpReports ? (
                    <div className="page-loading"><div className="spinner" /></div>
                  ) : mvpReports.length === 0 ? (
                    <div className="card">
                      <div className="empty-state">
                        <p>Aucun rapport pour ce projet</p>
                        {!isAdmin && (
                          <button className="btn btn-primary btn-sm" onClick={handleMvpCreate} style={{ marginTop: '.75rem' }}>
                            <Plus size={14} /> Créer le premier rapport
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="table">
                        <thead><tr><th>Date</th><th>Statut operation</th><th>Validation</th><th>Resume</th><th>Auteur</th><th>Actions</th></tr></thead>
                        <tbody>
                          {mvpReports.map((r) => {
                            const ra = r.attributes || r;
                            const canEditReport = isAdmin || (isOwner && (ra.review_status === 'brouillon' || ra.review_status === 'rejete'));
                            const canDeleteReport = isAdmin || (isOwner && ra.review_status === 'brouillon');
                            const canSubmitReport = isOwner && ra.review_status === 'brouillon';
                            const canValidate = isAdmin && ra.review_status === 'soumis';
                            return (
                              <tr key={r.id}>
                                <td>{fmtDate(ra.created_at)}</td>
                                <td><span className={`badge ${MVP_STATUS_BADGE[ra.operation_status] || ''}`}>{getOperationStatusLabel(a.operation_type, ra.operation_status)}</span></td>
                                <td><span className={`badge ${REVIEW_STATUS_BADGE[ra.review_status] || ''}`}>{REVIEW_STATUS_LABELS[ra.review_status] || ra.review_status}</span></td>
                                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ra.summary || '\u2014'}</td>
                                <td>{ra.author_name}</td>
                                <td>
                                  <div className="actions-cell">
                                    <button className="btn-icon" title="Voir" onClick={() => handleMvpView(r)}><Eye size={16} /></button>
                                    {canEditReport && (
                                      <button className="btn-icon" title="Modifier" onClick={() => handleMvpEdit(r)}><Pencil size={16} /></button>
                                    )}
                                    {canSubmitReport && (
                                      <button className="btn-icon btn-success" title="Soumettre pour validation" onClick={() => handleMvpSubmitForReview(r.id)}><Send size={16} /></button>
                                    )}
                                    {canValidate && (
                                      <>
                                        <button className="btn-icon btn-success" title="Valider" onClick={() => handleMvpValidate(r.id)}><Check size={16} /></button>
                                        <button className="btn-icon btn-danger" title="Rejeter" onClick={() => { setRejectModalReport(r); setRejectComment(''); }}><XCircle size={16} /></button>
                                      </>
                                    )}
                                    {canDeleteReport && (
                                      <button className="btn-icon btn-danger" title="Supprimer" onClick={() => handleMvpDelete(r.id)}><Trash2 size={16} /></button>
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
                </>
              )}

              {/* === VIEW rapport MVP (tous types) === */}
              {a.operation_type && mvpMode === 'view' && mvpViewReport && (() => {
                const ra = mvpViewReport.attributes || mvpViewReport;
                const viewIsWork = ra.operation_status === 'en_renovation';
                const viewIsSale = ['en_commercialisation', 'sous_offre', 'sous_compromis'].includes(ra.operation_status);
                const canEditThis = isAdmin || (isOwner && (ra.review_status === 'brouillon' || ra.review_status === 'rejete'));
                return (
                  <div className="card mvp-report-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                        <h3>Rapport du {fmtDate(ra.created_at)}</h3>
                        <span className={`badge ${REVIEW_STATUS_BADGE[ra.review_status] || ''}`}>{REVIEW_STATUS_LABELS[ra.review_status] || ra.review_status}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '.5rem' }}>
                        {canEditThis && (
                          <button className="btn btn-sm" onClick={() => handleMvpEdit(mvpViewReport)}><Pencil size={14} /> Modifier</button>
                        )}
                        {isOwner && ra.review_status === 'brouillon' && (
                          <button className="btn btn-sm btn-primary" onClick={() => handleMvpSubmitForReview(mvpViewReport.id)}><Send size={14} /> Soumettre</button>
                        )}
                        {isAdmin && ra.review_status === 'soumis' && (
                          <>
                            <button className="btn btn-sm btn-success" onClick={() => handleMvpValidate(mvpViewReport.id)}><Check size={14} /> Valider</button>
                            <button className="btn btn-sm btn-danger" onClick={() => { setRejectModalReport(mvpViewReport); setRejectComment(''); }}><XCircle size={14} /> Rejeter</button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Show rejection comment if rejected */}
                    {ra.review_status === 'rejete' && ra.review_comment && (
                      <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
                          <XCircle size={18} color="#EF4444" />
                          <span style={{ fontWeight: 600, color: '#EF4444' }}>Rapport rejete</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '.875rem', color: 'var(--text-secondary)' }}>
                          <strong>Commentaire :</strong> {ra.review_comment}
                        </p>
                        {ra.reviewed_at && (
                          <p style={{ margin: '.25rem 0 0', fontSize: '.75rem', color: 'var(--text-secondary)' }}>
                            Rejete le {fmtDate(ra.reviewed_at)} par {ra.reviewer_name || 'Admin'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Show validation info if validated */}
                    {ra.review_status === 'valide' && (
                      <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                          <CheckCircle size={18} color="#10B981" />
                          <span style={{ fontWeight: 600, color: '#10B981' }}>Rapport valide</span>
                        </div>
                        {ra.reviewed_at && (
                          <p style={{ margin: '.25rem 0 0', fontSize: '.75rem', color: 'var(--text-secondary)' }}>
                            Valide le {fmtDate(ra.reviewed_at)} par {ra.reviewer_name || 'Admin'}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mvp-section">
                      <div className="mvp-section-header"><span className="section-letter">A</span> Informations Generales</div>
                      <div className="detail-grid">
                        <div className="detail-row"><span>Projet</span><span>{a.title}</span></div>
                        <div className="detail-row"><span>Localisation</span><span>{a.property_city || '\u2014'}</span></div>
                        <div className="detail-row"><span>Montant leve</span><span>{fmt(a.amount_raised_cents)}</span></div>
                        <div className="detail-row"><span>Taux</span><span>{a.gross_yield_percent ?? '\u2014'} %</span></div>
                        <div className="detail-row"><span>Date remboursement previsionnelle</span><span>{fmtDate(ra.expected_repayment_date)}</span></div>
                        <div className="detail-row"><span>Statut actuel</span><span className={`badge ${MVP_STATUS_BADGE[ra.operation_status] || ''}`}>{getOperationStatusLabel(a.operation_type, ra.operation_status)}</span></div>
                      </div>
                    </div>

                    <div className="mvp-section">
                      <div className="mvp-section-header"><span className="section-letter">B</span> Resume Synthetique</div>
                      <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{ra.summary || 'Aucun resume fourni.'}</p>
                    </div>

                    <div className="mvp-section">
                      <div className="mvp-section-header"><span className="section-letter">C</span> Donnees Cles</div>
                      <table className="mvp-comparison-table">
                        <thead><tr><th className="col-label">Element</th><th>Previsionnel</th><th>Realise</th><th>Ecart</th></tr></thead>
                        <tbody>
                          {[
                            ["Prix d'achat", ra.purchase_price_previsionnel_cents, ra.purchase_price_realise_cents],
                            ['Travaux', ra.works_previsionnel_cents, ra.works_realise_cents],
                            ['Cout total', ra.total_cost_previsionnel_cents, ra.total_cost_realise_cents],
                            ['Prix de vente cible', ra.target_sale_price_previsionnel_cents, ra.target_sale_price_realise_cents],
                            ['Meilleure offre', ra.best_offer_previsionnel_cents, ra.best_offer_realise_cents],
                          ].map(([label, prev, real]) => {
                            const ecart = (prev && real) ? real - prev : null;
                            return (
                              <tr key={label}>
                                <td className="col-label">{label}</td>
                                <td className="col-previsionnel">{prev ? fmt(prev) : '\u2014'}</td>
                                <td className="col-realise">{real ? fmt(real) : '\u2014'}</td>
                                <td className={`col-ecart ${ecart > 0 ? 'ecart-negative' : ecart < 0 ? 'ecart-positive' : ''}`}>{ecart != null ? fmt(ecart) : '\u2014'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mvp-section">
                      <div className="mvp-section-header"><span className="section-letter">D</span> Avancement</div>
                      {viewIsWork && (
                        <div className="detail-grid">
                          <div className="detail-row"><span>% Travaux</span><span>{ra.works_progress_percent != null ? `${ra.works_progress_percent} %` : '\u2014'}</span></div>
                          <div className="detail-row"><span>Ecart budget</span><span>{ra.budget_variance_percent != null ? `${ra.budget_variance_percent} %` : '\u2014'}</span></div>
                        </div>
                      )}
                      {viewIsSale && (
                        <div className="detail-grid">
                          <div className="detail-row"><span>Date mise en vente</span><span>{fmtDate(ra.sale_start_date)}</span></div>
                          <div className="detail-row"><span>Nombre de visites</span><span>{ra.visits_count ?? '\u2014'}</span></div>
                          <div className="detail-row"><span>Nombre d'offres</span><span>{ra.offers_count ?? '\u2014'}</span></div>
                          <div className="detail-row"><span>Prix affiche</span><span>{ra.listed_price_cents ? fmt(ra.listed_price_cents) : '\u2014'}</span></div>
                        </div>
                      )}
                      {!viewIsWork && !viewIsSale && <p className="text-muted">Champs visibles selon le statut (en renovation ou en commercialisation).</p>}
                    </div>

                    <div className="mvp-section">
                      <div className="mvp-section-header"><span className="section-letter">E</span> Risque Principal</div>
                      <div className="detail-grid">
                        <div className="detail-row"><span>Risque identifie</span><span>{ra.risk_identified || '\u2014'}</span></div>
                        <div className="detail-row"><span>Impact</span><span>{ra.risk_impact || '\u2014'}</span></div>
                        <div className="detail-row"><span>Action corrective</span><span>{ra.corrective_action || '\u2014'}</span></div>
                      </div>
                    </div>

                    <div className="mvp-section">
                      <div className="mvp-section-header"><span className="section-letter">F</span> Prevision de Sortie</div>
                      <div className="detail-grid">
                        <div className="detail-row"><span>Date estimee compromis</span><span>{fmtDate(ra.estimated_compromise_date)}</span></div>
                        <div className="detail-row"><span>Date estimee acte</span><span>{fmtDate(ra.estimated_deed_date)}</span></div>
                        <div className="detail-row"><span>Date remboursement estimee</span><span>{fmtDate(ra.estimated_repayment_date)}</span></div>
                        <div className="detail-row"><span>Sortie</span><span className={`badge ${ra.exit_confirmed ? 'badge-success' : 'badge-warning'}`}>{ra.exit_confirmed ? 'Confirmee' : 'Non confirmee'}</span></div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* === CREATE / EDIT rapport MVP (tous types) === */}
              {a.operation_type && (mvpMode === 'create' || mvpMode === 'edit') && (
                <form onSubmit={handleMvpSubmit}>
                  <div className="card mvp-report-card">
                    <h3 style={{ marginBottom: '1.5rem' }}>{mvpMode === 'create' ? 'Nouveau rapport' : 'Modifier le rapport'}</h3>
                    {a.operation_type !== 'marchand_de_biens' && (
                      <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '.875rem' }}>
                        Rapport de suivi pour <strong>{OPERATION_TYPES[a.operation_type]}</strong>. Utilisez les champs prévisionnel / réalisé pour les montants clés de votre opération (acquisition, travaux, objectifs de sortie, etc.).
                      </p>
                    )}

                    <div className="mvp-section">
                      <div className="mvp-section-header"><span className="section-letter">A</span> Informations Generales</div>
                      <div className="detail-grid" style={{ marginBottom: '1rem' }}>
                        <div className="detail-row"><span>Projet</span><span>{a.title}</span></div>
                        <div className="detail-row"><span>Localisation</span><span>{a.property_city || '\u2014'}</span></div>
                        <div className="detail-row"><span>Montant leve</span><span>{fmt(a.amount_raised_cents)}</span></div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Statut actuel</label>
                          <select value={mvpForm.operation_status} onChange={updateMvpField('operation_status')}>
                            {Object.keys(OPERATION_STATUSES).map((k) => <option key={k} value={k}>{getOperationStatusLabel(a.operation_type, k)}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Date previsionnelle remboursement</label>
                          <input type="date" value={mvpForm.expected_repayment_date} onChange={updateMvpField('expected_repayment_date')} />
                        </div>
                      </div>
                    </div>

                    <div className="mvp-section">
                      <div className="mvp-section-header"><span className="section-letter">B</span> Resume Synthetique</div>
                      <div className="form-group">
                        <textarea value={mvpForm.summary} onChange={updateMvpField('summary')} placeholder="Resume du projet (5 lignes max, 500 caracteres)" rows={5} maxLength={500} />
                        <span className="text-muted" style={{ fontSize: '.75rem' }}>{mvpForm.summary.length} / 500</span>
                      </div>
                    </div>

                    <div className="mvp-section">
                      <div className="mvp-section-header"><span className="section-letter">C</span> Donnees Cles</div>
                      <table className="mvp-comparison-table">
                        <thead><tr><th className="col-label">Element</th><th>Previsionnel (EUR)</th><th>Realise (EUR)</th></tr></thead>
                        <tbody>
                          {[
                            ["Prix d'achat", 'purchase_price_previsionnel', 'purchase_price_realise'],
                            ['Travaux', 'works_previsionnel', 'works_realise'],
                            ['Cout total', 'total_cost_previsionnel', 'total_cost_realise'],
                            ['Prix de vente cible', 'target_sale_price_previsionnel', 'target_sale_price_realise'],
                            ['Meilleure offre', 'best_offer_previsionnel', 'best_offer_realise'],
                          ].map(([label, prevF, realF]) => {
                            const isTotal = prevF === 'total_cost_previsionnel';
                            return (
                              <tr key={label}>
                                <td className="col-label">{label}</td>
                                <td><input type="number" step="0.01" value={mvpForm[prevF]} onChange={updateMvpField(prevF)} placeholder="0.00" readOnly={isTotal} style={isTotal ? { background: 'var(--bg)', fontWeight: 600 } : {}} /></td>
                                <td><input type="number" step="0.01" value={mvpForm[realF]} onChange={updateMvpField(realF)} placeholder="0.00" readOnly={isTotal} style={isTotal ? { background: 'var(--bg)', fontWeight: 600 } : {}} /></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mvp-section">
                      <div className="mvp-section-header"><span className="section-letter">D</span> Avancement</div>
                      {mvpForm.operation_status === 'en_renovation' && (
                        <div className="form-row">
                          <div className="form-group"><label>% Travaux</label><input type="number" step="0.01" min="0" max="100" value={mvpForm.works_progress_percent} onChange={updateMvpField('works_progress_percent')} placeholder="0" /></div>
                          <div className="form-group"><label>Ecart budget (%)</label><input type="number" step="0.01" value={mvpForm.budget_variance_percent} onChange={updateMvpField('budget_variance_percent')} placeholder="0" /></div>
                        </div>
                      )}
                      {['en_commercialisation', 'sous_offre', 'sous_compromis'].includes(mvpForm.operation_status) && (
                        <>
                          <div className="form-row">
                            <div className="form-group"><label>Date mise en vente</label><input type="date" value={mvpForm.sale_start_date} onChange={updateMvpField('sale_start_date')} /></div>
                            <div className="form-group"><label>Prix affiche (EUR)</label><input type="number" step="0.01" value={mvpForm.listed_price} onChange={updateMvpField('listed_price')} placeholder="0.00" /></div>
                          </div>
                          <div className="form-row">
                            <div className="form-group"><label>Nombre de visites</label><input type="number" min="0" value={mvpForm.visits_count} onChange={updateMvpField('visits_count')} placeholder="0" /></div>
                            <div className="form-group"><label>Nombre d'offres</label><input type="number" min="0" value={mvpForm.offers_count} onChange={updateMvpField('offers_count')} placeholder="0" /></div>
                          </div>
                        </>
                      )}
                      {mvpForm.operation_status !== 'en_renovation' && !['en_commercialisation', 'sous_offre', 'sous_compromis'].includes(mvpForm.operation_status) && (
                        <p className="text-muted">Selectionnez "En renovation" ou "En commercialisation" pour les champs d'avancement.</p>
                      )}
                    </div>

                    <div className="mvp-section">
                      <div className="mvp-section-header"><span className="section-letter">E</span> Risque Principal</div>
                      <div className="form-group" style={{ marginBottom: '.75rem' }}><label>Risque identifie</label><input type="text" value={mvpForm.risk_identified} onChange={updateMvpField('risk_identified')} placeholder="Ex: Retard livraison materiaux" /></div>
                      <div className="form-group" style={{ marginBottom: '.75rem' }}><label>Impact</label><input type="text" value={mvpForm.risk_impact} onChange={updateMvpField('risk_impact')} placeholder="Ex: Decalage de 2 semaines" /></div>
                      <div className="form-group"><label>Action corrective</label><textarea value={mvpForm.corrective_action} onChange={updateMvpField('corrective_action')} rows={3} placeholder="Ex: Relance fournisseur + plan B commande" /></div>
                    </div>

                    <div className="mvp-section">
                      <div className="mvp-section-header"><span className="section-letter">F</span> Prevision de Sortie</div>
                      <div className="form-row">
                        <div className="form-group"><label>Date estimee compromis</label><input type="date" value={mvpForm.estimated_compromise_date} onChange={updateMvpField('estimated_compromise_date')} /></div>
                        <div className="form-group"><label>Date estimee acte</label><input type="date" value={mvpForm.estimated_deed_date} onChange={updateMvpField('estimated_deed_date')} /></div>
                      </div>
                      <div className="form-row">
                        <div className="form-group"><label>Date remboursement estimee</label><input type="date" value={mvpForm.estimated_repayment_date} onChange={updateMvpField('estimated_repayment_date')} /></div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', paddingTop: '1.5rem' }}>
                          <input type="checkbox" id="mvp_exit_confirmed" checked={mvpForm.exit_confirmed} onChange={updateMvpField('exit_confirmed')} style={{ width: 'auto' }} />
                          <label htmlFor="mvp_exit_confirmed" style={{ margin: 0, cursor: 'pointer' }}>Date confirmee</label>
                        </div>
                      </div>
                    </div>

                    <div className="modal-actions" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                      <button type="button" className="btn" onClick={() => setMvpMode('list')}>Annuler</button>
                      <button type="submit" className="btn btn-primary" disabled={mvpSubmitting}>
                        <Save size={16} /> {mvpSubmitting ? 'Enregistrement...' : 'Enregistrer le rapport'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
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

      {/* Modal de rejet MVP */}
      {rejectModalReport && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '2rem' }}
          onClick={() => setRejectModalReport(null)}>
          <div className="card" style={{ maxWidth: '500px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem', color: '#EF4444' }}>Rejeter le rapport MVP</h3>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>
              Veuillez indiquer la raison du rejet. Le porteur pourra corriger et resoumettre.
            </p>
            <div className="form-group">
              <label>Commentaire (obligatoire)</label>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                rows={4}
                placeholder="Expliquez pourquoi ce rapport est rejete..."
                required
              />
            </div>
            <div className="modal-actions" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
              <button className="btn" onClick={() => setRejectModalReport(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={handleMvpReject} disabled={mvpSubmitting || !rejectComment.trim()}>
                <XCircle size={16} /> {mvpSubmitting ? 'Envoi...' : 'Confirmer le rejet'}
              </button>
            </div>
          </div>
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
