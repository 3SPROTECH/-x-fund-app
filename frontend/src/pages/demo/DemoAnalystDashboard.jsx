import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { demoAnalystApi } from '../../api/demoAnalyst';
import {
    PROJECT_STATUS_LABELS as STATUS_LABELS,
    PROJECT_STATUS_BADGES as STATUS_BADGE,
} from '../../utils';
import { formatCents, formatDate } from '../../utils';
import {
    BarChart3, FileSearch, Clock, CheckCircle, AlertTriangle, XCircle,
    Search, ChevronRight, TrendingUp, Users, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import './demo-analyst.css';

const METRIC_CARDS = [
    { key: 'pending_analysis', label: 'En attente', icon: Clock, color: '#f0ad4e' },
    { key: 'info_requested', label: 'Info demandée', icon: AlertTriangle, color: '#e67e22' },
    { key: 'info_resubmitted', label: 'Info resoumise', icon: RefreshCw, color: '#3498db' },
    { key: 'analyst_approved', label: 'Pré-approuvés', icon: CheckCircle, color: '#27ae60' },
    { key: 'rejected', label: 'Rejetés', icon: XCircle, color: '#e74c3c' },
];

export default function DemoAnalystDashboard() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [metrics, setMetrics] = useState({});
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadProjects();
    }, [statusFilter]);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (search) params.search = search;
            const res = await demoAnalystApi.listProjects(params);
            setProjects(res.data.data || []);
            setMetrics(res.data.metrics || {});
        } catch {
            toast.error('Erreur lors du chargement des projets');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadProjects();
    };

    const totalProjects = metrics.total || 0;

    return (
        <div className="demo-analyst-page">
            <div className="demo-analyst-header">
                <div className="demo-analyst-header-left">
                    <div className="demo-analyst-badge">DÉMO</div>
                    <div>
                        <h1>Tableau de bord Analyste</h1>
                        <p>Revue et analyse des projets soumis</p>
                    </div>
                </div>
            </div>

            {/* ─── Metrics Row ─── */}
            <div className="demo-metrics-row">
                {METRIC_CARDS.map((card) => {
                    const Icon = card.icon;
                    const count = metrics[card.key] || 0;
                    const pct = totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0;
                    return (
                        <button
                            key={card.key}
                            className={`demo-metric-card ${statusFilter === card.key ? 'active' : ''}`}
                            onClick={() => setStatusFilter(statusFilter === card.key ? '' : card.key)}
                        >
                            <div className="demo-metric-icon" style={{ background: `${card.color}20`, color: card.color }}>
                                <Icon size={18} />
                            </div>
                            <div className="demo-metric-info">
                                <span className="demo-metric-count">{count}</span>
                                <span className="demo-metric-label">{card.label}</span>
                            </div>
                            <div className="demo-metric-bar">
                                <div className="demo-metric-bar-fill" style={{ width: `${pct}%`, background: card.color }} />
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ─── Donut Chart ─── */}
            {totalProjects > 0 && (
                <div className="demo-chart-section">
                    <h3><BarChart3 size={16} /> Répartition des statuts</h3>
                    <div className="demo-donut-container">
                        <svg viewBox="0 0 100 100" className="demo-donut-chart">
                            {(() => {
                                let offset = 0;
                                return METRIC_CARDS.map((card) => {
                                    const count = metrics[card.key] || 0;
                                    const pct = totalProjects > 0 ? (count / totalProjects) * 100 : 0;
                                    const segment = (
                                        <circle
                                            key={card.key}
                                            cx="50" cy="50" r="40"
                                            fill="none"
                                            stroke={card.color}
                                            strokeWidth="12"
                                            strokeDasharray={`${pct * 2.51327} ${251.327 - pct * 2.51327}`}
                                            strokeDashoffset={-offset * 2.51327}
                                            style={{ transition: 'stroke-dasharray 0.5s ease' }}
                                        />
                                    );
                                    offset += pct;
                                    return segment;
                                });
                            })()}
                            <text x="50" y="48" textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontWeight="700">
                                {totalProjects}
                            </text>
                            <text x="50" y="60" textAnchor="middle" fill="var(--text-secondary)" fontSize="5">
                                projets
                            </text>
                        </svg>
                        <div className="demo-donut-legend">
                            {METRIC_CARDS.map((card) => (
                                <div key={card.key} className="demo-legend-item">
                                    <span className="demo-legend-dot" style={{ background: card.color }} />
                                    <span>{card.label}: {metrics[card.key] || 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Search + Filter ─── */}
            <div className="demo-toolbar">
                <form className="demo-search-box" onSubmit={handleSearch}>
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Rechercher par titre..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </form>
                <select
                    className="demo-filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">Tous les statuts</option>
                    <option value="pending_analysis">En attente</option>
                    <option value="info_requested">Info demandée</option>
                    <option value="info_resubmitted">Info resoumise</option>
                    <option value="analyst_approved">Pré-approuvés</option>
                    <option value="rejected">Rejetés</option>
                </select>
            </div>

            {/* ─── Projects Table ─── */}
            {loading ? (
                <div className="demo-loading">
                    <div className="spinner" />
                    <p>Chargement des projets...</p>
                </div>
            ) : projects.length === 0 ? (
                <div className="demo-empty">
                    <FileSearch size={40} strokeWidth={1} />
                    <p>Aucun projet trouvé</p>
                </div>
            ) : (
                <div className="demo-projects-table-wrapper">
                    <table className="demo-projects-table">
                        <thead>
                            <tr>
                                <th>Projet</th>
                                <th>Porteur</th>
                                <th>Ville</th>
                                <th>Montant</th>
                                <th>Statut</th>
                                <th>Date</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((p) => {
                                const a = p.attributes || p;
                                return (
                                    <tr
                                        key={p.id}
                                        className="demo-project-row"
                                        onClick={() => navigate(`/demo/analyst/projects/${p.id}`)}
                                    >
                                        <td className="demo-project-title">
                                            <TrendingUp size={14} />
                                            <span>{a.title}</span>
                                        </td>
                                        <td><Users size={13} /> {a.owner_name}</td>
                                        <td>{a.property_city || '—'}</td>
                                        <td className="demo-amount">{formatCents(a.total_amount_cents)}</td>
                                        <td>
                                            <span className={`badge ${STATUS_BADGE[a.status] || ''}`}>
                                                {STATUS_LABELS[a.status] || a.status}
                                            </span>
                                        </td>
                                        <td className="demo-date">{formatDate(a.created_at)}</td>
                                        <td><ChevronRight size={16} className="demo-chevron" /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
