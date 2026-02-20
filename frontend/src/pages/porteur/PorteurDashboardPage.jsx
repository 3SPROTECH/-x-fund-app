import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { investmentProjectsApi } from '../../api/investments';
import { projectDraftsApi } from '../../api/projectDrafts';
import { porteurDashboardApi } from '../../api/investments';
import { getImageUrl } from '../../api/client';
import {
  Plus, MapPin, Image as ImageIcon, FileEdit, Clock, Trash2,
  ChevronDown, CheckCircle, AlertCircle, ClipboardList, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TableFilters from '../../components/TableFilters';
import {
  formatCents,
  formatDate as fmtDate,
  PROJECT_STATUS_LABELS as STATUS_LABELS,
  PROJECT_STATUS_BADGES as STATUS_BADGE,
} from '../../utils';
import { LoadingSpinner } from '../../components/ui';

/* ── Static FAQ data ── */
const FAQ_ITEMS = [
  {
    q: 'Comment creer un nouveau projet ?',
    a: 'Cliquez sur le bouton "Creer un projet" dans la section Mes Projets. Vous serez guide a travers un formulaire en plusieurs etapes pour renseigner les informations de votre projet.',
  },
  {
    q: 'Quels sont les differents statuts d\'un projet ?',
    a: 'Brouillon : projet en cours de redaction. En Analyse : soumis pour revision. Complements requis : des informations supplementaires sont necessaires. Approuve : valide par l\'equipe. En Collecte : ouvert aux investisseurs. Finance : objectif atteint.',
  },
  {
    q: 'Combien de temps dure l\'analyse d\'un projet ?',
    a: 'L\'analyse d\'un projet soumis prend generalement entre 5 et 10 jours ouvrables. Vous recevrez une notification a chaque mise a jour du statut de votre projet.',
  },
  {
    q: 'Comment contacter le support ?',
    a: 'Vous pouvez contacter notre equipe par email a support@x-fund.com ou via le formulaire de contact disponible dans les parametres de votre profil.',
  },
];

/* ── Static tasks data (placeholder) ── */
const STATIC_TASKS = [
  { id: 1, title: 'Completer le dossier KYC', assignedBy: 'Analyste', dueDate: '2026-03-01', status: 'en_cours' },
  { id: 2, title: 'Fournir les documents juridiques', assignedBy: 'Admin', dueDate: '2026-03-10', status: 'en_attente' },
  { id: 3, title: 'Signer le contrat de financement', assignedBy: 'Analyste', dueDate: '2026-03-15', status: 'en_attente' },
];

const TASK_STATUS_LABELS = { en_cours: 'En cours', en_attente: 'En attente', termine: 'Termine' };
const TASK_STATUS_CLASSES = { en_cours: 'badge-warning', en_attente: 'badge-info', termine: 'badge-success' };

export default function PorteurDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  /* ── Own projects ── */
  const [projects, setProjects] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  /* ── Financed projects (from other owners) ── */
  const [financedProjects, setFinancedProjects] = useState([]);
  const [financedLoading, setFinancedLoading] = useState(true);

  /* ── FAQ ── */
  const [openFaq, setOpenFaq] = useState(null);

  /* ── Load own projects + drafts ── */
  useEffect(() => { loadOwnProjects(); }, [statusFilter]);

  useEffect(() => {
    projectDraftsApi.list().then((res) => {
      setDrafts(res.data.data || []);
    }).catch(() => { });
  }, []);

  const loadOwnProjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await investmentProjectsApi.list(params);
      setProjects(res.data.data || []);
    } catch {
      toast.error('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  /* ── Load financed projects from other owners ── */
  useEffect(() => {
    const loadFinanced = async () => {
      setFinancedLoading(true);
      try {
        const res = await investmentProjectsApi.list({ status: 'funded' });
        const all = res.data.data || [];
        setFinancedProjects(all.filter((p) => {
          const a = p.attributes || p;
          return a.owner_id !== user?.id;
        }));
      } catch {
        // silent fail
      } finally {
        setFinancedLoading(false);
      }
    };
    loadFinanced();
  }, [user?.id]);

  /* ── Delete handlers ── */
  const handleDeleteDraft = async (draftId, e) => {
    e.stopPropagation();
    if (!window.confirm('Voulez-vous vraiment supprimer ce brouillon ?')) return;
    try {
      await projectDraftsApi.delete(draftId);
      setDrafts((prev) => prev.filter((d) => d.id !== draftId));
      toast.success('Brouillon supprime');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDeleteProject = async (projectId, title, e) => {
    e.stopPropagation();
    if (!window.confirm(`Supprimer "${title}" ? Cette action est irreversible.`)) return;
    try {
      await investmentProjectsApi.delete(projectId);
      toast.success('Projet supprime');
      loadOwnProjects();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  /* ── Filter config ── */
  const statusOptions = [
    { value: '', label: 'Tous' },
    { value: 'draft', label: 'Brouillon' },
    { value: 'pending_analysis', label: 'En Analyse' },
    { value: 'info_requested', label: 'Complements requis' },
    { value: 'approved', label: 'Approuve' },
    { value: 'funding_active', label: 'En Collecte' },
    { value: 'funded', label: 'Finance' },
  ];

  /* ── Merge drafts + projects for unified grid ── */
  const allItems = [];

  // Only show drafts when filter is empty or explicitly set to 'draft'
  if (!statusFilter || statusFilter === 'draft') {
    drafts.forEach((draft) => {
      allItems.push({ type: 'draft', data: draft });
    });
  }

  // Sort: info_requested and info_resubmitted projects come first
  const ACTION_STATUSES = ['info_requested', 'info_resubmitted'];

  projects.forEach((p) => {
    allItems.push({ type: 'project', data: p });
  });

  // Sort to put action-required projects first
  allItems.sort((a, b) => {
    if (a.type === 'draft' && b.type === 'draft') return 0;
    if (a.type === 'draft') return -1; // drafts stay at top
    if (b.type === 'draft') return 1;
    const aStatus = (a.data.attributes || a.data).status;
    const bStatus = (b.data.attributes || b.data).status;
    const aAction = ACTION_STATUSES.includes(aStatus) ? 0 : 1;
    const bAction = ACTION_STATUSES.includes(bStatus) ? 0 : 1;
    return aAction - bAction;
  });

  /* ── Render helpers ── */
  const renderProjectCard = (item) => {
    if (item.type === 'draft') {
      const draft = item.data;
      const fd = draft.form_data || {};
      const title = fd.presentation?.title || 'Projet sans nom';
      const updatedAt = draft.updated_at
        ? new Date(draft.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';

      return (
        <div
          key={`draft-${draft.id}`}
          className="porteur-project-card"
          onClick={() => navigate(`/projects/new?draft=${draft.id}`)}
        >
          <div className="porteur-card-visual porteur-card-visual--draft">
            <FileEdit size={32} opacity={0.3} color="var(--gold-color)" />
          </div>
          <div className="porteur-card-body">
            <div className="porteur-card-top">
              <h4 className="porteur-card-title">{title}</h4>
              <div className="porteur-card-actions">
                <span className="badge badge-warning">Brouillon</span>
                <button
                  className="porteur-card-delete"
                  onClick={(e) => handleDeleteDraft(draft.id, e)}
                  title="Supprimer le brouillon"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            {fd.location?.city && (
              <p className="porteur-card-location"><MapPin size={13} /> {fd.location.city}</p>
            )}
            <div className="porteur-card-meta">
              <Clock size={12} /> <span>{updatedAt}</span>
            </div>
          </div>
        </div>
      );
    }

    const p = item.data;
    const a = p.attributes || p;
    const progress = Math.min(a.funding_progress_percent || 0, 100);
    const firstImage = (a.images?.length > 0) ? a.images[0] : (a.property_photos?.length > 0) ? a.property_photos[0] : null;
    const isOwner = user?.id === a.owner_id;
    const canDelete = user?.role === 'porteur_de_projet' && isOwner && a.status === 'draft';
    const showForm = isOwner && (a.status === 'draft' || a.status === 'pending_analysis' || a.status === 'info_requested' || a.status === 'info_resubmitted');
    const cardHref = showForm ? `/projects/new?project=${p.id}` : `/projects/${p.id}`;
    const isActionRequired = a.status === 'info_requested';
    const isInfoResubmitted = a.status === 'info_resubmitted';

    return (
      <div
        key={p.id}
        className={`porteur-project-card ${isActionRequired ? 'porteur-card--action-required' : ''} ${isInfoResubmitted ? 'porteur-card--info-resubmitted' : ''}`}
        onClick={() => navigate(cardHref)}
      >
        <div className="porteur-card-visual">
          {firstImage ? (
            <img src={getImageUrl(firstImage.url)} alt={a.title} />
          ) : (
            <div className="porteur-card-placeholder">
              <ImageIcon size={28} opacity={0.25} />
            </div>
          )}
        </div>
        <div className="porteur-card-body">
          <div className="porteur-card-top">
            <h4 className="porteur-card-title">{a.title}</h4>
            <div className="porteur-card-actions">
              <span className={`badge ${STATUS_BADGE[a.status] || ''}`}>{STATUS_LABELS[a.status] || a.status}</span>
              {canDelete && (
                <button
                  className="porteur-card-delete"
                  onClick={(e) => handleDeleteProject(p.id, a.title, e)}
                  title="Supprimer"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
          {a.property_city && (
            <p className="porteur-card-location"><MapPin size={13} /> {a.property_city}</p>
          )}
          {a.status === 'funding_active' && (
            <div className="porteur-card-progress">
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <div className="porteur-card-progress-info">
                <span>{formatCents(a.amount_raised_cents)} leves</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          )}
          {isActionRequired && (
            <div className="porteur-card-cta">
              <AlertTriangle size={14} />
              <span>Compléter les informations</span>
            </div>
          )}
          {isInfoResubmitted && (
            <div className="porteur-card-cta porteur-card-cta--success">
              <CheckCircle size={14} />
              <span>Compléments envoyés — en attente</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReadOnlyCard = (p) => {
    const a = p.attributes || p;
    const progress = Math.min(a.funding_progress_percent || 0, 100);
    const firstImage = (a.images?.length > 0) ? a.images[0] : (a.property_photos?.length > 0) ? a.property_photos[0] : null;

    return (
      <div key={p.id} className="porteur-project-card porteur-readonly-card">
        <div className="porteur-card-visual">
          {firstImage ? (
            <img src={getImageUrl(firstImage.url)} alt={a.title} />
          ) : (
            <div className="porteur-card-placeholder">
              <ImageIcon size={28} opacity={0.25} />
            </div>
          )}
        </div>
        <div className="porteur-card-body">
          <div className="porteur-card-top">
            <h4 className="porteur-card-title">{a.title}</h4>
            <span className="badge badge-success">Finance</span>
          </div>
          {a.property_city && (
            <p className="porteur-card-location"><MapPin size={13} /> {a.property_city}</p>
          )}

        </div>
      </div>
    );
  };

  return (
    <div className="porteur-dashboard">

      {/* ═══ Section 1: Welcome + My Projects ═══ */}
      <section className="porteur-section">
        <div className="porteur-section-header">
          <div>
            <h1 className="porteur-welcome">Bienvenue, {user?.first_name}</h1>
            <p className="porteur-welcome-sub">Gerez vos projets et suivez leur avancement</p>
          </div>
        </div>

        <div className="porteur-filters-row">
          <TableFilters
            filters={[
              { key: 'status', label: 'Statut', value: statusFilter, options: statusOptions },
            ]}
            onFilterChange={(key, value) => setStatusFilter(value)}
          />
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="porteur-project-grid">
            {allItems.map((item) => renderProjectCard(item))}

            {/* CTA Card */}
            <div
              className="porteur-cta-card"
              onClick={() => navigate('/projects/new')}
            >
              <div className="porteur-cta-icon">
                <Plus size={28} strokeWidth={2} />
              </div>
              <span className="porteur-cta-label">Creer un projet</span>
            </div>
          </div>
        )}
      </section>

      {/* ═══ Section 2: Tasks ═══ */}
      <section className="porteur-section">
        <h2 className="porteur-section-title">
          <ClipboardList size={20} />
          Mes taches
        </h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Tache</th>
                <th>Assigne par</th>
                <th>Echeance</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {STATIC_TASKS.map((t) => (
                <tr key={t.id}>
                  <td data-label="Tache">{t.title}</td>
                  <td data-label="Assigne par">{t.assignedBy}</td>
                  <td data-label="Echeance">{fmtDate(t.dueDate)}</td>
                  <td data-label="Statut">
                    <span className={`badge ${TASK_STATUS_CLASSES[t.status] || ''}`}>
                      {TASK_STATUS_LABELS[t.status] || t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ Section 3: Financed Projects ═══ */}
      <section className="porteur-section">
        <h2 className="porteur-section-title">
          <CheckCircle size={20} />
          Projets finances
        </h2>
        {financedLoading ? (
          <LoadingSpinner />
        ) : financedProjects.length === 0 ? (
          <div className="porteur-empty-state">
            <AlertCircle size={20} />
            <span>Aucun projet finance pour le moment</span>
          </div>
        ) : (
          <div className="porteur-project-grid">
            {financedProjects.map((p) => renderReadOnlyCard(p))}
          </div>
        )}
      </section>

      {/* ═══ Section 4: FAQ ═══ */}
      <section className="porteur-section">
        <h2 className="porteur-section-title">Questions frequentes</h2>
        <div className="porteur-faq">
          {FAQ_ITEMS.map((item, idx) => (
            <div key={idx} className={`porteur-faq-item${openFaq === idx ? ' open' : ''}`}>
              <button
                className="porteur-faq-trigger"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <span>{item.q}</span>
                <ChevronDown size={16} className="porteur-faq-chevron" />
              </button>
              {openFaq === idx && (
                <div className="porteur-faq-answer">
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
