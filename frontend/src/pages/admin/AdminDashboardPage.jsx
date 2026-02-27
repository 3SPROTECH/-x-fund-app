import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/admin';
import {
  Users, Building, TrendingUp, Download,
  Briefcase, CreditCard, ScrollText, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBalance as fmt } from '../../utils';
import { LoadingSpinner } from '../../components/ui';
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

/* ── Mini sparkline chart used inside KPI cards ── */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function MiniLineChart({ data, color = '#DAA520', height = 60 }) {
  const chartRef = useRef(null);
  const [gradient, setGradient] = useState(null);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const ctx = chart.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, hexToRgba(color, 0.25));
    g.addColorStop(1, hexToRgba(color, 0));
    setGradient(g);
  }, [height, color]);

  return (
    <div style={{ height }}>
      <Line
        ref={chartRef}
        data={{
          labels: data.map((_, i) => i),
          datasets: [{
            data,
            borderColor: color,
            backgroundColor: gradient || hexToRgba(color, 0.1),
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            tension: 0.4,
          }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } },
        }}
      />
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const res = await adminApi.getDashboard();
      setData(res.data.data || res.data);
    } catch {
      toast.error('Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type, format) => {
    try {
      const fn = { users: adminApi.exportUsers, investments: adminApi.exportInvestments, transactions: adminApi.exportTransactions }[type];
      const res = await fn(format);
      const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
      const content = format === 'csv' ? res.data : JSON.stringify(res.data, null, 2);
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Export ${type} téléchargé`);
    } catch {
      toast.error("Erreur lors de l'export");
    }
  };

  if (loading) return <LoadingSpinner />;

  const users = data?.users || {};
  const properties = data?.properties || {};
  const projects = data?.projects || {};
  const investments = data?.investments || {};
  const financial = data?.financial || {};

  const totalUsers = (users.investisseurs || 0) + (users.porteurs_de_projet || 0) + (users.administrateurs || 0);
  const fundingPercent = financial.total_deposits_cents
    ? Math.round((investments.total_amount_cents || 0) / financial.total_deposits_cents * 100)
    : 0;

  /* Chart data */
  const userDoughnutData = {
    labels: ['Investisseurs', 'Porteurs de projet', 'Administrateurs'],
    datasets: [{
      data: [users.investisseurs || 0, users.porteurs_de_projet || 0, users.administrateurs || 0],
      backgroundColor: ['#DAA520', '#9CA3AF', '#374151'],
      borderWidth: 0,
      cutout: '70%',
    }],
  };

  const fundingDoughnutData = {
    datasets: [{
      data: [fundingPercent, Math.max(0, 100 - fundingPercent)],
      backgroundColor: ['#DAA520', '#E5E7EB'],
      borderWidth: 0,
      cutout: '78%',
    }],
  };

  const projectStatuses = [
    { label: 'Brouillon', value: projects.brouillon },
    { label: 'Ouverts', value: projects.ouvert ?? 0 },
    { label: 'Financés', value: projects.finance ?? 0 },
    { label: 'Clôturés', value: projects.cloture ?? 0 },
    { label: 'Approuvés', value: projects.approved ?? 0 },
    { label: 'Rejetés', value: projects.rejected ?? 0 },
  ];

  const quickLinks = [
    { icon: Users, label: 'Utilisateurs', path: '/admin/users' },
    { icon: Building, label: 'Biens immobiliers', path: '/admin/properties' },
    { icon: Briefcase, label: 'Projets', path: '/admin/projects' },
    { icon: TrendingUp, label: 'Investissements', path: '/admin/investments' },
    { icon: CreditCard, label: 'Transactions', path: '/admin/transactions' },
    { icon: ScrollText, label: 'Audit Logs', path: '/admin/audit' },
  ];

  return (
    <div className="adm-dash">
      {/* ── Greeting header ── */}
      <div className="adm-dash-header">
        <h1 className="adm-dash-greeting">Bonjour, {user?.first_name} !</h1>
        <p className="adm-dash-subtitle">Dashboard Administrateur</p>
      </div>

      {data ? (
        <>
          {/* ── Row 1: 4 KPI cards ── */}
          <div className="adm-dash-kpi-row">
            {/* Portefeuille Actif */}
            <div className="adm-dash-card">
              <h3 className="adm-dash-card-title">Portefeuille Actif</h3>
              <div className="adm-dash-portfolio-stats">
                <div className="adm-dash-portfolio-stat">
                  <span className="adm-dash-big-number">{properties.total ?? '—'}</span>
                  <span className="adm-dash-stat-label">Biens</span>
                </div>
                <div className="adm-dash-portfolio-divider" />
                <div className="adm-dash-portfolio-stat">
                  <span className="adm-dash-big-number">{projects.total ?? '—'}</span>
                  <span className="adm-dash-stat-label">Projets</span>
                </div>
              </div>
              <MiniLineChart data={[2, 3, 2, 4, 3, 5]} height={35} color="#000000" />
            </div>

            {/* Capital Investi */}
            <div className="adm-dash-card">
              <h3 className="adm-dash-card-title">Capital Investi</h3>
              <span className="adm-dash-big-number" style={{ color: '#10b981' }}>{fmt(investments.total_amount_cents)}</span>
              <MiniLineChart data={[5000, 8000, 12000, 15000, 18000, 22700]} height={35} color="#000000" />
              <p className="adm-dash-card-footnote">
                Sur un total de dépôts de<br /><strong>{fmt(financial.total_deposits_cents)}</strong>
              </p>
            </div>

            {/* Collecte de fonds */}
            <div className="adm-dash-card adm-dash-card-center">
              <h3 className="adm-dash-card-title">Collecte de fonds</h3>
              <div className="adm-dash-doughnut-wrap">
                <Doughnut
                  data={fundingDoughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                  }}
                  plugins={[{
                    id: 'fundingCenter',
                    beforeDraw: (chart) => {
                      const { ctx, width, height } = chart;
                      ctx.save();
                      ctx.font = 'bold 2rem Inter, sans-serif';
                      ctx.fillStyle = '#1a1a2e';
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'middle';
                      ctx.fillText(String(fundingPercent), width / 2, height / 2 - 8);
                      ctx.font = '500 0.7rem Inter, sans-serif';
                      ctx.fillStyle = '#8889a7';
                      ctx.fillText('% of target', width / 2, height / 2 + 16);
                      ctx.restore();
                    },
                  }]}
                />
              </div>
            </div>

            {/* Répartition des Utilisateurs */}
            <div className="adm-dash-card adm-dash-card-center">
              <h3 className="adm-dash-card-title">Répartition des Utilisateurs</h3>
              <div className="adm-dash-doughnut-wrap">
                <Doughnut
                  data={userDoughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: { display: false },
                      tooltip: { backgroundColor: '#1a1a2e', padding: 10, cornerRadius: 8 },
                    },
                  }}
                  plugins={[{
                    id: 'userCenter',
                    beforeDraw: (chart) => {
                      const { ctx, width, height } = chart;
                      ctx.save();
                      ctx.font = 'bold 2rem Inter, sans-serif';
                      ctx.fillStyle = '#1a1a2e';
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'middle';
                      ctx.fillText(String(totalUsers), width / 2, height / 2);
                      ctx.restore();
                    },
                  }]}
                />
              </div>
              <div className="adm-dash-legend">
                <span className="adm-dash-legend-item">
                  <span className="adm-dash-legend-dot" style={{ background: '#DAA520' }} />
                  Investisseurs
                </span>
                <span className="adm-dash-legend-item">
                  <span className="adm-dash-legend-dot" style={{ background: '#9CA3AF' }} />
                  Porteurs de projet
                </span>
              </div>
            </div>
          </div>

          {/* ── Bottom grid: Total Inv + Accès Rapide + Exports + Pipeline ── */}
          <div className="adm-dash-bottom-grid">
            {/* Total Investissements */}
            <div className="adm-dash-card adm-dash-invest-card">
              <h3 className="adm-dash-card-title">Total Investissements</h3>
              <span className="adm-dash-big-number">{investments.total_count ?? '—'}</span>
              <MiniLineChart data={[1, 3, 2, 5, 4, 7, 6, 9]} height={50} color="#000000" />
            </div>

            {/* Accès Rapide */}
            <div className="adm-dash-card adm-dash-quick-card">
              <h3 className="adm-dash-card-title">Accès Rapide</h3>
              <div className="adm-dash-quick-links">
                {quickLinks.map(({ icon: Icon, label, path }) => (
                  <button key={path} className="adm-dash-quick-btn" onClick={() => navigate(path)}>
                    <div className="adm-dash-quick-icon">
                      <Icon size={20} strokeWidth={1.8} />
                    </div>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Exports de données */}
            <div className="adm-dash-card adm-dash-export-card">
              <h3 className="adm-dash-card-title">Exports de données</h3>
              <div className="adm-dash-export-icon-wrap">
                <Download size={38} strokeWidth={1.8} />
              </div>
              <div className="adm-dash-export-list">
                {[
                  { key: 'users', label: 'Utilisateurs' },
                  { key: 'investments', label: 'Investissements' },
                  { key: 'transactions', label: 'Transactions' },
                ].map(({ key, label }) => (
                  <div key={key} className="adm-dash-export-item" onClick={() => handleExport(key, 'csv')}>
                    <div className="adm-dash-export-info">
                      <div className="adm-dash-export-dot">
                        <Clock size={14} />
                      </div>
                      <span>Export {label}</span>
                    </div>
                    <div className="adm-dash-export-actions">
                      <button onClick={(e) => { e.stopPropagation(); handleExport(key, 'csv'); }}>CSV</button>
                      <button onClick={(e) => { e.stopPropagation(); handleExport(key, 'json'); }}>JSON</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Statut des Projets — Pipeline */}
            <div className="adm-dash-card adm-dash-pipeline-card">
              <h3 className="adm-dash-card-title">Statut des Projets</h3>
              <div className="adm-dash-pipeline">
                {projectStatuses.map((status) => (
                  <div key={status.label} className="adm-dash-pipeline-station">
                    <div
                      className="adm-dash-pipeline-circle"
                      style={{
                        background: (status.value ?? 0) > 0 ? '#DAA520' : '#E5E7EB',
                        color: (status.value ?? 0) > 0 ? '#fff' : '#6B7280',
                      }}
                    >
                      {status.value ?? '—'}
                    </div>
                    <span className="adm-dash-pipeline-label">{status.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card">
          <div className="empty-state">
            <Briefcase size={48} />
            <p>Aucune donnée disponible</p>
          </div>
        </div>
      )}
    </div>
  );
}
