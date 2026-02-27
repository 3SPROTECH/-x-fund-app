import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analysteApi } from '../../api/analyste';
import { Briefcase, Eye, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  PROJECT_STATUS_LABELS, PROJECT_STATUS_BADGES,
  ANALYST_OPINION_LABELS, ANALYST_OPINION_BADGES,
} from '../../utils';
import TableFilters from '../../components/TableFilters';
import { LoadingSpinner, Pagination, EmptyState } from '../../components/ui';

export default function AnalysteProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ opinion: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const navigate = useNavigate();

  useEffect(() => { loadProjects(); }, [page, filters, search]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.opinion) params.opinion = filters.opinion;
      if (search) params.search = search;
      const res = await analysteApi.getProjects(params);
      setProjects(res.data.data || []);
      setMeta(res.data.meta || {});
    } catch {
      toast.error('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Projets a analyser</h1>
          <p className="text-muted">Liste des projets qui vous sont assignes</p>
        </div>
        <span className="badge"><Briefcase size={12} /> {meta.total_count ?? projects.length} projet(s)</span>
      </div>

      <TableFilters
        filters={[
          { key: 'opinion', label: 'Avis', value: filters.opinion, options: [
            { value: '', label: 'Tous les avis' },
            { value: 'opinion_pending', label: 'En attente' },
            { value: 'opinion_submitted', label: 'Soumise' },
            { value: 'opinion_info_requested', label: 'Infos demandees' },
          ]},
        ]}
        onFilterChange={(key, value) => { setFilters({ ...filters, [key]: value }); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Rechercher un projet..."
      />

      {loading ? (
        <LoadingSpinner />
      ) : projects.length === 0 ? (
        <div className="card">
          <EmptyState icon={Search} message="Aucun projet trouve" />
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Porteur</th>
                  <th>Ville</th>
                  <th>Statut projet</th>
                  <th>Avis analyste</th>
                  <th>Date soumission</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const a = p.attributes || p;
                  return (
                    <tr key={p.id}>
                      <td data-label="Titre">{a.title}</td>
                      <td data-label="Porteur">{a.owner_name || '—'}</td>
                      <td data-label="Ville">{a.property_city || '—'}</td>
                      <td data-label="Statut">
                        <span className={`badge ${PROJECT_STATUS_BADGES[a.status] || ''}`}>
                          {PROJECT_STATUS_LABELS[a.status] || a.status}
                        </span>
                      </td>
                      <td data-label="Avis">
                        <span className={`badge ${ANALYST_OPINION_BADGES[a.analyst_opinion] || ''}`}>
                          {ANALYST_OPINION_LABELS[a.analyst_opinion] || 'En attente'}
                        </span>
                      </td>
                      <td data-label="Date">{a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                      <td data-label="Actions">
                        <button className="btn-icon" title="Analyser" onClick={() => navigate(`/analyste/projects/${p.id}`)}>
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={meta.total_pages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
