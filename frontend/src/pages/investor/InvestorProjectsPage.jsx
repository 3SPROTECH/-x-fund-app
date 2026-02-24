import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { investmentProjectsApi } from '../../api/investments';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner, EmptyState } from '../../components/ui';
import ProjectCard, { getCategory } from '../../components/projects/ProjectCard';
import ProjectSection from '../../components/projects/ProjectSection';

import upcomingPlaceholder from '../../assets/projects-no-upcoming.jpg';

const SECTION_DEFS = [
  {
    key: 'upcoming',
    title: 'Prochainement',
    subtitle: 'Tenez-vous au courant des prochaines opportunités qui arrivent.',
    emptyState: (
      <div className="upcoming-empty">
        <div className="upcoming-empty-text">
          <h3>De nouvelles opportunités arrivent...</h3>
          <p>Un peu de patience, nous sélectionnons pour vous les meilleurs projets sur lesquels investir.</p>
        </div>
        <img src={upcomingPlaceholder} alt="Prochains projets" className="upcoming-empty-img" />
      </div>
    ),
  },
  { key: 'active',   title: 'En cours de collecte' },
  { key: 'funded',   title: 'Déjà financés' },
];

function DebouncedSearch({ value, onChange, placeholder }) {
  const [local, setLocal] = useState(value || '');
  const timerRef = useRef(null);

  useEffect(() => { setLocal(value || ''); }, [value]);

  const handleChange = (v) => {
    setLocal(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), 350);
  };

  const handleClear = () => { setLocal(''); clearTimeout(timerRef.current); onChange(''); };

  return (
    <div className="projects-search">
      <Search size={16} className="projects-search-icon" />
      <input
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
      />
      {local && (
        <button className="projects-search-clear" onClick={handleClear} type="button">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export default function InvestorProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadProjects(); }, [search]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const res = await investmentProjectsApi.list(params);
      setProjects(res.data.data || []);
    } catch {
      toast.error('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="page projects-page-full">
      {/* Page Header with search */}
      <div className="projects-page-header">
        <div>
          <h1>Les opportunités</h1>
          <p>Découvrez et investissez dans nos projets immobiliers rigoureusement sélectionnés.</p>
        </div>
        <DebouncedSearch
          value={search}
          onChange={setSearch}
          placeholder="Rechercher une ville, un nom de projet..."
        />
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingSpinner />
      ) : projects.length === 0 ? (
        <div className="card">
          <EmptyState icon={TrendingUp} message="Aucun projet disponible" />
        </div>
      ) : (
        SECTION_DEFS.map(({ key, title, subtitle, emptyState }) => (
          <ProjectSection key={key} title={title} subtitle={subtitle} count={grouped[key].length} emptyState={emptyState}>
            {grouped[key].map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                user={user}
                onClick={() => navigate(`/investor/projects/${p.id}`)}
              />
            ))}
          </ProjectSection>
        ))
      )}
    </div>
  );
}
