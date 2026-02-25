import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { investmentsApi } from '../../api/investments';
import { formatCents as fmt, INVESTMENT_STATUS_LABELS as STATUS_LABELS, INVESTMENT_STATUS_BADGES as STATUS_BADGE } from '../../utils';
import { LoadingSpinner, EmptyState, Pagination } from '../../components/ui';
import TableFilters from '../../components/TableFilters';
import toast from 'react-hot-toast';
import {
  Briefcase, TrendingUp, Download, Plus, Info, ArrowDownLeft, Coins, FileText,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend);

const STATIC_BADGE = (
  <span className="static-data-badge">
    <Info size={12} />
    Données statiques
  </span>
);

/* ────────────────────────────────────────────
   Portfolio Line Chart (static)
   ──────────────────────────────────────────── */
function PortfolioChart() {
  const chartRef = useRef(null);
  const [gradients, setGradients] = useState({ gold: null, gray: null });

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const ctx = chart.ctx;

    const gold = ctx.createLinearGradient(0, 0, 0, 200);
    gold.addColorStop(0, 'rgba(176, 141, 39, 0.15)');
    gold.addColorStop(1, 'rgba(176, 141, 39, 0.01)');

    const gray = ctx.createLinearGradient(0, 0, 0, 200);
    gray.addColorStop(0, 'rgba(212, 212, 212, 0.12)');
    gray.addColorStop(1, 'rgba(212, 212, 212, 0.01)');

    setGradients({ gold, gray });
  }, []);

  const data = {
    labels: ['Sept', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév'],
    datasets: [
      {
        label: 'Valeur du portefeuille',
        data: [210000, 215800, 224500, 231200, 238900, 245420],
        borderColor: '#DAA520',
        backgroundColor: gradients.gold || 'rgba(176, 141, 39, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#DAA520',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      },
      {
        label: 'Capital investi',
        data: [200000, 200000, 200000, 200000, 210000, 210000],
        borderColor: '#d4d4d4',
        backgroundColor: gradients.gray || 'rgba(212, 212, 212, 0.08)',
        borderWidth: 1.5,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#d4d4d4',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        borderDash: [4, 3],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a2e',
        titleFont: { family: 'DM Sans', size: 11, weight: '500' },
        bodyFont: { family: 'DM Sans', size: 12, weight: '600' },
        padding: { x: 12, y: 8 },
        cornerRadius: 8,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        boxPadding: 4,
        callbacks: {
          label: (ctx) => ctx.dataset.label + ': ' + ctx.parsed.y.toLocaleString('fr-FR') + ' €',
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { font: { family: 'DM Sans', size: 11 }, color: '#a3a3a3', padding: 8 },
      },
      y: {
        grid: { color: '#f0f0f0', drawTicks: false },
        border: { display: false },
        ticks: {
          font: { family: 'DM Sans', size: 10 },
          color: '#a3a3a3',
          padding: 12,
          callback: (v) => (v / 1000) + 'k',
          maxTicksLimit: 5,
        },
        beginAtZero: false,
      },
    },
  };

  return <Line ref={chartRef} data={data} options={options} />;
}

/* ────────────────────────────────────────────
   Allocation Doughnut Chart (static)
   ──────────────────────────────────────────── */
const centerTextPlugin = {
  id: 'mipCenterText',
  afterDraw(chart) {
    if (chart.config.type !== 'doughnut') return;
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const cx = (chartArea.left + chartArea.right) / 2;
    const cy = (chartArea.top + chartArea.bottom) / 2;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = "600 15px 'Playfair Display'";
    ctx.fillStyle = '#1a1a2e';
    ctx.fillText('210k €', cx, cy - 6);

    ctx.font = "400 10px 'DM Sans'";
    ctx.fillStyle = '#8889a7';
    ctx.fillText('3 projets', cx, cy + 10);

    ctx.restore();
  },
};

function AllocationDoughnut() {
  const data = {
    labels: ['Projet Lyon', 'Villa Méditerranée'],
    datasets: [{
      data: [200000, 10000],
      backgroundColor: ['#1a1a2e', '#DAA520'],
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverOffset: 4,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a2e',
        titleFont: { family: 'DM Sans', size: 11, weight: '500' },
        bodyFont: { family: 'DM Sans', size: 12, weight: '600' },
        padding: { x: 12, y: 8 },
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = ((ctx.parsed / total) * 100).toFixed(1);
            return ctx.parsed.toLocaleString('fr-FR') + ' € (' + pct + ' %)';
          },
        },
      },
    },
  };

  return <Doughnut data={data} options={options} plugins={[centerTextPlugin]} />;
}

/* ────────────────────────────────────────────
   Static Recent Activity
   ──────────────────────────────────────────── */
const STATIC_ACTIVITIES = [
  { type: 'invest', title: 'Investissement', project: 'Villa Méditerranée', amount: '5 000 €', date: '13 fév. 2026' },
  { type: 'invest', title: 'Investissement', project: 'Villa Méditerranée', amount: '5 000 €', date: '12 fév. 2026' },
  { type: 'dividend', title: 'Dividende', project: 'Projet Lyon', amount: '+12 450 €', date: '1 jan. 2026' },
  { type: 'report', title: 'Rapport', project: 'Projet Lyon T4 disponible', amount: null, date: '15 déc. 2025' },
];

const ACTIVITY_ICON_MAP = {
  invest: { icon: ArrowDownLeft, className: 'mip-activity-icon-invest' },
  dividend: { icon: Coins, className: 'mip-activity-icon-dividend' },
  report: { icon: FileText, className: 'mip-activity-icon-info' },
};

function ActivityItem({ activity }) {
  const { icon: Icon, className } = ACTIVITY_ICON_MAP[activity.type];
  return (
    <div className="mip-activity-item">
      <div className={`mip-activity-icon ${className}`}>
        <Icon size={14} />
      </div>
      <div>
        <div className="mip-activity-text">
          <strong>{activity.title}</strong> — {activity.project}
        </div>
        {activity.amount && (
          <div className={`mip-activity-text ${activity.type === 'dividend' ? 'mip-dividend-val' : ''}`} style={{ fontWeight: 600 }}>
            {activity.amount}
          </div>
        )}
        <div className="mip-activity-date">{activity.date}</div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Static allocation legend data
   ──────────────────────────────────────────── */
const ALLOC_LEGEND = [
  { label: 'Projet Lyon', pct: '95,2 %', color: '#1a1a2e' },
  { label: 'Villa Méditerranée', pct: '4,8 %', color: '#DAA520' },
];

/* ────────────────────────────────────────────
   Static performance data
   ──────────────────────────────────────────── */
const PERF_ROWS = [
  { label: 'Plus-value latente', value: '+35 420 €', positive: true },
  { label: 'Rendement global', value: '+16,9 %', positive: true },
  { label: 'TRI estimé', value: '11,2 %', positive: false },
  { label: 'Durée moy. restante', value: '14 mois', positive: false },
];

/* ────────────────────────────────────────────
   Main Page
   ──────────────────────────────────────────── */
export default function InvestorInvestmentsPage() {
  const navigate = useNavigate();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, [page, statusFilter, search]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await investmentsApi.list(params);
      setInvestments(res.data.data || []);
      setMeta(res.data.meta || {});
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  /* Compute summary stats from real data */
  const stats = useMemo(() => {
    if (!investments.length) return null;
    const totalInvested = investments.reduce((s, inv) => s + ((inv.attributes || inv).amount_cents || 0), 0);
    const totalDividends = investments.reduce((s, inv) => s + ((inv.attributes || inv).dividends_received_cents || 0), 0);
    const totalValue = investments.reduce((s, inv) => s + ((inv.attributes || inv).current_value_cents || 0), 0);
    const activeCount = investments.filter(inv => {
      const status = (inv.attributes || inv).status;
      return status === 'en_cours' || status === 'confirme';
    }).length;
    const changePercent = totalInvested > 0 ? (((totalValue - totalInvested) / totalInvested) * 100).toFixed(1) : '0.0';
    const avgYield = totalInvested > 0 ? ((totalDividends / totalInvested) * 100).toFixed(1) : '0.0';
    return { totalInvested, totalDividends, totalValue, activeCount, changePercent, avgYield };
  }, [investments]);

  return (
    <div className="mip-page">
      {/* ─── Page Header ─── */}
      <div className="mip-page-header">
        <div>
          <h1 className="mip-page-title">Mes Investissements</h1>
          <p className="mip-page-subtitle">Vue d'ensemble de votre portefeuille</p>
        </div>
        <div className="mip-header-actions">
          <button className="mip-btn mip-btn-outline">
            <Download size={14} /> Exporter
          </button>
          <button className="mip-btn mip-btn-primary" onClick={() => navigate('/investor/projects')}>
            <Plus size={14} /> Investir
          </button>
        </div>
      </div>

      {/* ─── Summary Cards ─── */}
      {!loading && stats && (
        <div className="mip-summary-row">
          <div className="mip-summary-card">
            <div className="mip-summary-label">Total investi</div>
            <div className="mip-summary-value">{fmt(stats.totalInvested)}</div>
            <div className="mip-summary-sub">{stats.activeCount} projet{stats.activeCount > 1 ? 's' : ''} actif{stats.activeCount > 1 ? 's' : ''}</div>
          </div>
          <div className="mip-summary-card">
            <div className="mip-summary-label">Valeur actuelle</div>
            <div className="mip-summary-value">{fmt(stats.totalValue)}</div>
            {Number(stats.changePercent) !== 0 && (
              <div className={`mip-summary-change ${Number(stats.changePercent) >= 0 ? 'mip-change-up' : 'mip-change-down'}`}>
                <TrendingUp size={11} /> {Number(stats.changePercent) >= 0 ? '+' : ''}{stats.changePercent} %
              </div>
            )}
          </div>
          <div className="mip-summary-card">
            <div className="mip-summary-label">Dividendes reçus</div>
            <div className="mip-summary-value">{fmt(stats.totalDividends)}</div>
          </div>
          <div className="mip-summary-card">
            <div className="mip-summary-label">Rendement moyen</div>
            <div className="mip-summary-value">{stats.avgYield} %</div>
            <div className="mip-summary-sub">Pondéré par montant</div>
          </div>
        </div>
      )}

      {/* ─── Main Layout ─── */}
      <div className="mip-main-layout">

        {/* Left Column */}
        <div className="mip-main-col">

          {/* Portfolio Chart */}
          <div className="mip-chart-card">
            <div className="mip-chart-header">
              <div className="mip-chart-title">Évolution du portefeuille</div>
              <div className="mip-chart-header-right">
                {STATIC_BADGE}
              </div>
            </div>
            <div className="mip-chart-area">
              <PortfolioChart />
            </div>
            <div className="mip-chart-legend">
              <div className="mip-legend-item">
                <div className="mip-legend-dot" style={{ background: '#DAA520' }} />
                Valeur du portefeuille
              </div>
              <div className="mip-legend-item">
                <div className="mip-legend-dot" style={{ background: '#d4d4d4' }} />
                Capital investi
              </div>
            </div>
          </div>

          {/* Investments Table */}
          <div className="mip-table-card">
            <div className="mip-table-header">
              <div className="mip-table-title">Mes projets</div>
              <div className="mip-table-count">
                {meta.total_count ?? investments.length} investissement{(meta.total_count ?? investments.length) > 1 ? 's' : ''}
              </div>
            </div>

            <TableFilters
              filters={[
                { key: 'status', label: 'Statut', value: statusFilter, options: [
                  { value: '', label: 'Tous' },
                  { value: 'en_cours', label: 'En cours' },
                  { value: 'confirme', label: 'Confirmé' },
                  { value: 'cloture', label: 'Clôturé' },
                  { value: 'annule', label: 'Annulé' },
                ]},
              ]}
              onFilterChange={(_key, value) => { setStatusFilter(value); setPage(1); }}
              search={search}
              onSearchChange={(v) => { setSearch(v); setPage(1); }}
              searchPlaceholder="Rechercher un projet..."
            />

            {loading ? (
              <div style={{ padding: '2rem' }}>
                <LoadingSpinner />
              </div>
            ) : investments.length === 0 ? (
              <div style={{ padding: '2rem' }}>
                <EmptyState icon={Briefcase} message="Aucun investissement pour le moment">
                  <button className="btn btn-primary" onClick={() => navigate('/investor/projects')}>
                    Découvrir les projets
                  </button>
                </EmptyState>
              </div>
            ) : (
              <>
                <table className="mip-inv-table">
                  <thead>
                    <tr>
                      <th>Projet</th>
                      <th>Montant</th>
                      <th>Parts</th>
                      <th>Dividendes</th>
                      <th>Valeur actuelle</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map((inv) => {
                      const a = inv.attributes || inv;
                      const feePercent = a.fee_cents > 0 && a.amount_cents > 0
                        ? (a.fee_cents / a.amount_cents * 100).toFixed(1).replace(/\.0$/, '')
                        : null;
                      return (
                        <tr
                          key={inv.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => a.investment_project_id && navigate(`/investor/projects/${a.investment_project_id}`)}
                        >
                          <td>
                            <div className="mip-project-cell">
                              <div>
                                <div className="mip-project-cell-name">{a.project_title || '—'}</div>
                                <div className="mip-project-cell-type">
                                  {a.project_type || 'Investissement'} · {a.project_city || 'France'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="mip-td-amount">
                            {fmt(a.amount_cents)}
                            {feePercent && (
                              <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                incl. {feePercent}% frais
                              </div>
                            )}
                          </td>
                          <td>{a.shares_count}</td>
                          <td>
                            {a.dividends_received_cents > 0
                              ? <span className="mip-dividend-val">+{fmt(a.dividends_received_cents)}</span>
                              : <span className="mip-dividend-none">—</span>
                            }
                          </td>
                          <td className="mip-td-amount">{fmt(a.current_value_cents)}</td>
                          <td>{a.invested_at ? new Date(a.invested_at).toLocaleDateString('fr-FR') : '—'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={`badge ${STATUS_BADGE[a.status] || ''}`}>
                              {STATUS_LABELS[a.status] || a.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ padding: '0.5rem 1.5rem 1rem' }}>
                  <Pagination page={page} totalPages={meta.total_pages} onPageChange={setPage} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ─── Sidebar ─── */}
        <div className="mip-sidebar">

          {/* Allocation Donut */}
          <div className="mip-sidebar-card">
            <div className="mip-sidebar-title">
              Répartition
              {STATIC_BADGE}
            </div>
            <div className="mip-donut-container">
              <AllocationDoughnut />
            </div>
            <div className="mip-alloc-legend">
              {ALLOC_LEGEND.map((item) => (
                <div key={item.label} className="mip-alloc-item">
                  <div className="mip-alloc-item-left">
                    <div className="mip-alloc-dot" style={{ background: item.color }} />
                    <span className="mip-alloc-item-label">{item.label}</span>
                  </div>
                  <span className="mip-alloc-item-value">{item.pct}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance */}
          <div className="mip-sidebar-card">
            <div className="mip-sidebar-title">
              Performance
              {STATIC_BADGE}
            </div>
            {PERF_ROWS.map((row) => (
              <div key={row.label} className="mip-perf-row">
                <span className="mip-perf-label">{row.label}</span>
                <span className={`mip-perf-value ${row.positive ? 'mip-positive' : ''}`}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="mip-sidebar-card">
            <div className="mip-sidebar-title">
              Activité récente
              {STATIC_BADGE}
            </div>
            <div className="mip-activity-list">
              {STATIC_ACTIVITIES.map((a, i) => (
                <ActivityItem key={i} activity={a} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
