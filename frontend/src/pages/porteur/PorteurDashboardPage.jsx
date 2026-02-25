import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { investmentProjectsApi } from '../../api/investments';
import { projectDraftsApi } from '../../api/projectDrafts';
import { getImageUrl } from '../../api/client';
import {
  Plus, MapPin, Image as ImageIcon, FileEdit, Trash2,
  ChevronDown, Inbox, AlertTriangle, PenTool,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  formatCents,
  formatDate as fmtDate,
  PROJECT_STATUS_LABELS as STATUS_LABELS,
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
const TASK_STATUS_CLASSES = { en_cours: 'pd-task-en-cours', en_attente: 'pd-task-en-attente', termine: 'pd-task-termine' };

/* ── Filter tabs ── */
const FILTER_TABS = [
  { value: '', label: 'Tous' },
  { value: 'signing', label: 'En Signature' },
  { value: 'info_requested', label: 'Complements' },
  { value: 'pending_analysis', label: 'En Analyse' },
  { value: 'funding_active', label: 'En Collecte' },
  { value: 'funded', label: 'Finance' },
];

/* ── Badge style mapping ── */
const BADGE_CLASS_MAP = {
  signing: 'pd-b-signature',
  info_requested: 'pd-b-complements',
  info_resubmitted: 'pd-b-complements',
  pending_analysis: 'pd-b-analyse',
  approved: 'pd-b-analyse',
  funding_active: 'pd-b-collecte',
  funded: 'pd-b-finance',
  draft: 'pd-b-draft',
};

export default function PorteurDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  /* ── Own projects ── */
  const [allProjects, setAllProjects] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  /* ── Financed projects (from other owners) ── */
  const [financedProjects, setFinancedProjects] = useState([]);
  const [financedLoading, setFinancedLoading] = useState(true);

  /* ── FAQ ── */
  const [openFaq, setOpenFaq] = useState(null);

  /* ── Load own projects + drafts ── */
  useEffect(() => { loadOwnProjects(); }, []);

  useEffect(() => {
    projectDraftsApi.list().then((res) => {
      setDrafts(res.data.data || []);
    }).catch(() => { });
  }, []);

  const loadOwnProjects = async () => {
    setLoading(true);
    try {
      const res = await investmentProjectsApi.list({ owned: true });
      setAllProjects(res.data.data || []);
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

  /* ── Client-side filtering ── */
  const filteredProjects = useMemo(() => {
    if (!statusFilter) return allProjects;
    return allProjects.filter((p) => {
      const a = p.attributes || p;
      return a.status === statusFilter;
    });
  }, [allProjects, statusFilter]);

  /* ── Dynamic stats ── */
  const stats = useMemo(() => {
    const signingCount = allProjects.filter((p) => (p.attributes || p).status === 'signing').length;
    const collecteCount = allProjects.filter((p) => (p.attributes || p).status === 'funding_active').length;
    const fundedCount = allProjects.filter((p) => (p.attributes || p).status === 'funded').length;
    const urgentTasks = STATIC_TASKS.filter((t) => t.status === 'en_cours').length;
    return {
      totalProjects: allProjects.length + drafts.length,
      collecteCount,
      signingCount,
      taskCount: STATIC_TASKS.length,
      urgentTasks,
      fundedCount,
    };
  }, [allProjects, drafts]);

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

  /* ── Merge drafts + projects for unified grid ── */
  const allItems = useMemo(() => {
    const items = [];
    const ACTION_STATUSES = ['info_requested', 'info_resubmitted', 'signing'];

    if (!statusFilter || statusFilter === 'draft') {
      drafts.forEach((draft) => {
        items.push({ type: 'draft', data: draft });
      });
    }

    filteredProjects.forEach((p) => {
      items.push({ type: 'project', data: p });
    });

    items.sort((a, b) => {
      if (a.type === 'draft' && b.type === 'draft') return 0;
      if (a.type === 'draft') return -1;
      if (b.type === 'draft') return 1;
      const aStatus = (a.data.attributes || a.data).status;
      const bStatus = (b.data.attributes || b.data).status;
      const aAction = ACTION_STATUSES.includes(aStatus) ? 0 : 1;
      const bAction = ACTION_STATUSES.includes(bStatus) ? 0 : 1;
      return aAction - bAction;
    });

    return items;
  }, [drafts, filteredProjects, statusFilter]);

  /* ── Render: Project card ── */
  const renderProjectCard = (item) => {
    if (item.type === 'draft') {
      const draft = item.data;
      const fd = draft.form_data || {};
      const title = fd.presentation?.title || 'Projet sans nom';

      return (
        <div
          key={`draft-${draft.id}`}
          className="pd-card"
          onClick={() => navigate(`/projects/new?draft=${draft.id}`)}
        >
          <div className="pd-card-thumb">
            <FileEdit size={18} opacity={0.35} />
            <span className="pd-card-badge pd-b-draft">Brouillon</span>
            <button
              className="pd-card-delete-btn"
              onClick={(e) => handleDeleteDraft(draft.id, e)}
              title="Supprimer le brouillon"
            >
              <Trash2 size={13} />
            </button>
          </div>
          <div className="pd-card-body">
            <div className="pd-card-name">{title}</div>
            {fd.location?.city && (
              <div className="pd-card-loc"><MapPin size={10} /> {fd.location.city}</div>
            )}
            <button className="pd-card-action" onClick={(e) => e.stopPropagation()}>
              <FileEdit size={12} /> Completer le brouillon
            </button>
          </div>
        </div>
      );
    }

    const p = item.data;
    const a = p.attributes || p;
    const progress = Math.min(a.funding_progress_percent || 0, 100);
    const firstImage = (a.photos?.length > 0) ? a.photos[0] : (a.images?.length > 0) ? a.images[0] : (a.property_photos?.length > 0) ? a.property_photos[0] : null;
    const isOwner = user?.id === a.owner_id;
    const canDelete = user?.role === 'porteur_de_projet' && isOwner && a.status === 'draft';
    const showForm = isOwner && ['draft', 'pending_analysis', 'info_requested', 'info_resubmitted', 'approved', 'signing'].includes(a.status);
    const cardHref = showForm ? `/projects/new?project=${p.id}` : `/projects/${p.id}`;
    const isActionRequired = a.status === 'info_requested';
    const isSigning = a.status === 'signing';

    return (
      <div
        key={p.id}
        className="pd-card"
        onClick={() => navigate(cardHref)}
      >
        <div className="pd-card-thumb">
          {firstImage ? (
            <img src={getImageUrl(firstImage.url)} alt={a.title} />
          ) : (
            <ImageIcon size={18} opacity={0.3} />
          )}
          <span className={`pd-card-badge ${BADGE_CLASS_MAP[a.status] || ''}`}>
            {STATUS_LABELS[a.status] || a.status}
          </span>
          {canDelete && (
            <button
              className="pd-card-delete-btn"
              onClick={(e) => handleDeleteProject(p.id, a.title, e)}
              title="Supprimer"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
        <div className="pd-card-body">
          <div className="pd-card-name">{a.title}</div>
          {a.property_city && (
            <div className="pd-card-loc"><MapPin size={10} /> {a.property_city}</div>
          )}
          {isSigning && (
            <button className="pd-card-action" onClick={(e) => e.stopPropagation()}>
              <PenTool size={12} /> Signer le contrat
            </button>
          )}
          {isActionRequired && (
            <button className="pd-card-action" onClick={(e) => e.stopPropagation()}>
              <AlertTriangle size={12} /> Completer les informations
            </button>
          )}
          {a.status === 'funding_active' && (
            <div className="pd-card-progress">
              <div className="pd-prog-track">
                <div className="pd-prog-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="pd-prog-label">
                {formatCents(a.amount_raised_cents)} leves · {Math.round(progress)} %
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ── Render: Read-only financed card ── */
  const renderReadOnlyCard = (p) => {
    const a = p.attributes || p;
    const firstImage = (a.photos?.length > 0) ? a.photos[0] : (a.images?.length > 0) ? a.images[0] : (a.property_photos?.length > 0) ? a.property_photos[0] : null;

    return (
      <div key={p.id} className="pd-card pd-card--readonly">
        <div className="pd-card-thumb">
          {firstImage ? (
            <img src={getImageUrl(firstImage.url)} alt={a.title} />
          ) : (
            <ImageIcon size={18} opacity={0.3} />
          )}
          <span className="pd-card-badge pd-b-finance">Finance</span>
        </div>
        <div className="pd-card-body">
          <div className="pd-card-name">{a.title}</div>
          {a.property_city && (
            <div className="pd-card-loc"><MapPin size={10} /> {a.property_city}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="pd-page">

      {/* ── Header ── */}
      <div className="pd-header">
        <div>
          <h1 className="pd-greeting">Bienvenue, {user?.first_name}</h1>
          <p className="pd-greeting-sub">Gerez vos projets et suivez leur avancement</p>
        </div>
        <button className="pd-btn-primary" onClick={() => navigate('/projects/new')}>
          <Plus size={15} /> Creer un projet
        </button>
      </div>

      {/* ── Stats row ── */}
      <div className="pd-stats-row">
        <div className="pd-stat-card">
          <div className="pd-stat-label">Projets</div>
          <div className="pd-stat-value">{stats.totalProjects}</div>
          <div className="pd-stat-sub">{stats.collecteCount} en collecte</div>
        </div>
        <div className="pd-stat-card">
          <div className="pd-stat-label">En signature</div>
          <div className="pd-stat-value">{stats.signingCount}</div>
          <div className="pd-stat-sub">{stats.signingCount > 0 ? 'Action requise' : 'Aucune action'}</div>
        </div>
        <div className="pd-stat-card">
          <div className="pd-stat-label">Taches</div>
          <div className="pd-stat-value">{stats.taskCount}</div>
          <div className="pd-stat-sub">{stats.urgentTasks} urgente{stats.urgentTasks > 1 ? 's' : ''}</div>
        </div>
        <div className="pd-stat-card">
          <div className="pd-stat-label">Finance</div>
          <div className="pd-stat-value">{stats.fundedCount}</div>
          <div className="pd-stat-sub">{stats.fundedCount > 0 ? `${stats.fundedCount} projet${stats.fundedCount > 1 ? 's' : ''}` : 'Aucun projet'}</div>
        </div>
      </div>

      {/* ── My Projects ── */}
      <section className="pd-section">
        <div className="pd-section-header">
          <h2 className="pd-section-title">Mes projets</h2>
        </div>

        <div className="pd-filter-bar">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              className={`pd-filter-chip${statusFilter === tab.value ? ' active' : ''}`}
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="pd-projects-grid">
            {allItems.map((item) => renderProjectCard(item))}
            <div className="pd-card-create" onClick={() => navigate('/projects/new')}>
              <div className="pd-card-create-icon"><Plus size={16} /></div>
              <span>Creer un projet</span>
            </div>
          </div>
        )}
      </section>

      {/* ── Tasks ── */}
      <section className="pd-section">
        <div className="pd-section-header">
          <h2 className="pd-section-title">Mes taches</h2>
        </div>
        <div className="pd-table-wrap">
          <table>
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
                  <td className="pd-task-name">{t.title}</td>
                  <td className="pd-task-secondary">{t.assignedBy}</td>
                  <td className="pd-task-secondary">{fmtDate(t.dueDate)}</td>
                  <td>
                    <span className={`pd-task-status ${TASK_STATUS_CLASSES[t.status] || ''}`}>
                      {TASK_STATUS_LABELS[t.status] || t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Financed Projects ── */}
      <section className="pd-section">
        <div className="pd-section-header">
          <h2 className="pd-section-title">Projets finances</h2>
        </div>
        {financedLoading ? (
          <LoadingSpinner />
        ) : financedProjects.length === 0 ? (
          <div className="pd-empty-state">
            <Inbox size={16} /> Aucun projet finance pour le moment
          </div>
        ) : (
          <div className="pd-projects-grid">
            {financedProjects.map((p) => renderReadOnlyCard(p))}
          </div>
        )}
      </section>

      {/* ── FAQ ── */}
      <section className="pd-section">
        <div className="pd-section-header">
          <h2 className="pd-section-title">Questions frequentes</h2>
        </div>
        <div className="pd-faq-list">
          {FAQ_ITEMS.map((item, idx) => (
            <div key={idx} className={`pd-faq-item${openFaq === idx ? ' open' : ''}`}>
              <button
                className="pd-faq-trigger"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <span>{item.q}</span>
                <ChevronDown size={15} className="pd-faq-chev" />
              </button>
              <div className="pd-faq-answer">{item.a}</div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
