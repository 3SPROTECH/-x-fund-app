import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { investmentProjectsApi } from '../../api/investments';
import { projectDraftsApi } from '../../api/projectDrafts';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, Plus, FileEdit } from 'lucide-react';
import toast from 'react-hot-toast';
import TableFilters from '../../components/TableFilters';
import { LoadingSpinner, EmptyState } from '../../components/ui';
import ProjectCard, { getCategory } from '../../components/projects/ProjectCard';
import ProjectSection from '../../components/projects/ProjectSection';
import DraftCard from '../../components/projects/DraftCard';

const SECTION_DEFS = [
  { key: 'active',   title: 'En cours de collecte' },
  { key: 'upcoming', title: 'Prochainement' },
  { key: 'funded',   title: 'Déjà financés' },
];

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const canCreateProject = user?.role === 'porteur_de_projet' || user?.role === 'administrateur';

  useEffect(() => { loadProjects(); }, [statusFilter, search]);

  useEffect(() => {
    if (canCreateProject) {
      projectDraftsApi.list().then((res) => {
        setDrafts(res.data.data || []);
      }).catch(() => {});
    }
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await investmentProjectsApi.list(params);
      setProjects(res.data.data || []);
    } catch {
      toast.error('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId, e) => {
    e.stopPropagation();
    if (!window.confirm('Voulez-vous vraiment supprimer ce brouillon ?')) return;
    try {
      await projectDraftsApi.delete(draftId);
      setDrafts((prev) => prev.filter((d) => d.id !== draftId));
      toast.success('Brouillon supprimé');
    } catch {
      toast.error('Erreur lors de la suppression du brouillon');
    }
  };

  const handleDeleteProject = async (projectId, projectTitle, e) => {
    e.stopPropagation();
    if (!window.confirm(`Voulez-vous vraiment supprimer "${projectTitle}" ? Cette action est irréversible.`)) return;
    try {
      await investmentProjectsApi.delete(projectId);
      toast.success('Projet supprimé avec succès');
      loadProjects();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression du projet');
    }
  };

  const navigateToProject = (project) => {
    const attrs = project.attributes || project;
    const isOwner = user?.id === attrs.owner_id;
    const showForm = isOwner && (attrs.status === 'draft' || attrs.status === 'pending_analysis');
    navigate(showForm ? `/projects/new?project=${project.id}` : `/projects/${project.id}`);
  };

  /* Group projects by status category */
  const grouped = useMemo(() => {
    const groups = { active: [], upcoming: [], funded: [] };
    for (const p of projects) {
      const status = (p.attributes || p).status;
      const cat = getCategory(status);
      if (groups[cat]) groups[cat].push(p);
    }
    return groups;
  }, [projects]);

  const hasAnyProjects = projects.length > 0 || drafts.length > 0;

  return (
    <div className="page">
      {/* Page Header */}
      <div className="projects-page-header">
        <div>
          <h1>Les opportunités</h1>
          <p>Découvrez et investissez dans nos projets immobiliers rigoureusement sélectionnés.</p>
        </div>
        {canCreateProject && (
          <button type="button" className="btn gold-color" onClick={() => navigate('/projects/new')}>
            <Plus size={16} /> Créer un projet
          </button>
        )}
      </div>

      {/* Filters */}
      <TableFilters
        filters={[
          {
            key: 'status', label: 'Statut', value: statusFilter, options: [
              { value: '', label: 'Tous' },
              { value: 'funding_active', label: 'En Collecte' },
              { value: 'funded', label: 'Financé' },
              { value: 'under_construction', label: 'En Travaux' },
              { value: 'operating', label: 'En Exploitation' },
              { value: 'repaid', label: 'Remboursé' },
            ],
          },
        ]}
        onFilterChange={(key, value) => { setStatusFilter(value); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); }}
        searchPlaceholder="Rechercher une ville, un nom de projet..."
      />

      {/* Drafts Section */}
      {drafts.length > 0 && (
        <section className="project-section">
          <div className="section-header">
            <FileEdit size={18} style={{ color: 'var(--text-muted)' }} />
            <h2 className="section-title" style={{ fontSize: '1.1rem' }}>Mes brouillons</h2>
            <span className="section-count">{drafts.length}</span>
          </div>
          <div className="project-grid">
            {drafts.map((draft) => (
              <DraftCard
                key={`draft-${draft.id}`}
                draft={draft}
                onResume={() => navigate(`/projects/new?draft=${draft.id}`)}
                onDelete={handleDeleteDraft}
              />
            ))}
          </div>
        </section>
      )}

      {/* Main Content */}
      {loading ? (
        <LoadingSpinner />
      ) : !hasAnyProjects ? (
        <div className="card">
          <EmptyState icon={TrendingUp} message="Aucun projet disponible">
            {canCreateProject && (
              <button type="button" className="btn btn-primary" onClick={() => navigate('/properties')}>
                <Plus size={16} /> Créer un projet depuis Mes biens
              </button>
            )}
          </EmptyState>
        </div>
      ) : (
        <>
          {SECTION_DEFS.map(({ key, title }) => (
            <ProjectSection key={key} title={title} count={grouped[key].length}>
              {grouped[key].map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  user={user}
                  onDelete={handleDeleteProject}
                  onClick={() => navigateToProject(p)}
                />
              ))}
            </ProjectSection>
          ))}

          {/* If filter results are empty after filtering */}
          {projects.length === 0 && drafts.length === 0 && (
            <div className="card">
              <EmptyState icon={TrendingUp} message="Aucun projet ne correspond à votre recherche" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
